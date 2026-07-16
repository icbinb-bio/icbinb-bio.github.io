import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { workshop } from '../../src/data/workshop';

interface ElementMatch {
  openingTag: string;
  innerHtml: string;
  html: string;
}

const expectedNavigation = [
  { label: 'Home', href: '/' },
  { label: 'Submit', href: '/submit/' },
  { label: 'Speakers', href: '/speakers/' },
  { label: 'Schedule', href: '/schedule/' },
  { label: 'Papers', href: '/papers/' },
  { label: 'Reviewer Guidelines', href: '/reviewer-guidelines/' },
  { label: 'Organizers', href: '/organizers/' },
  { label: 'ICBINB', href: 'https://icbinb.cc/' },
];

const expectedVenueNoticeLabel = 'Date and venue to be announced';
const expectedVenuePublicDetail =
  'The exact workshop date, city, venue, room, and local timezone will be announced.';

const htmlFor = (route: string) => {
  const relativePath = route === '/' ? 'index.html' : `${route.replace(/^\/|\/$/g, '')}/index.html`;
  return readFileSync(resolve('dist', relativePath), 'utf8');
};

const openingTagsFor = (html: string, tagName: string) =>
  html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? [];

const elementsFor = (html: string, tagName: string): ElementMatch[] =>
  Array.from(
    html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)</${tagName}>`, 'gi')),
    (match) => ({
      openingTag: match[0].slice(0, match[0].indexOf('>') + 1),
      innerHtml: match[1],
      html: match[0],
    }),
  );

const attributeFor = (openingTag: string, name: string) => {
  const match = openingTag.match(new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match?.[1] ?? match?.[2];
};

const classNamesFor = (openingTag: string) =>
  (attributeFor(openingTag, 'class') ?? '').split(/\s+/).filter(Boolean);

const decodeHtmlText = (text: string) =>
  text
    .replace(/&#(\d+);/g, (_, value: string) => String.fromCodePoint(Number(value)))
    .replace(/&#x([\da-f]+);/gi, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&(amp|apos|gt|lt|quot);/g, (_, entity: string) => ({
      amp: '&',
      apos: "'",
      gt: '>',
      lt: '<',
      quot: '"',
    })[entity]!);

const textFor = (html: string) =>
  decodeHtmlText(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

const visibleTextFor = (html: string) => {
  const withoutHiddenText = elementsFor(html, 'span')
    .filter(({ openingTag }) => classNamesFor(openingTag).includes('visually-hidden'))
    .reduce((visibleHtml, element) => visibleHtml.replace(element.html, ''), html);
  return textFor(withoutHiddenText);
};

const relTokensFor = (openingTag: string) =>
  (attributeFor(openingTag, 'rel') ?? '').split(/\s+/).filter(Boolean);

const stylesheetFor = (html: string) => {
  const stylesheetLink = openingTagsFor(html, 'link').find((tag) =>
    relTokensFor(tag).includes('stylesheet'),
  );
  expect(stylesheetLink).toBeDefined();
  const href = attributeFor(stylesheetLink!, 'href');
  expect(href).toMatch(/^\/_astro\/[^/]+\.css$/);
  return readFileSync(resolve('dist', href!.replace(/^\/+/, '')), 'utf8');
};

const firstHeadingTextFor = (html: string) => {
  const firstHeading = elementsFor(html, 'h1')[0];
  return firstHeading ? textFor(firstHeading.innerHtml) : undefined;
};

const canonicalHrefsFor = (html: string) =>
  openingTagsFor(html, 'link')
    .filter((tag) => relTokensFor(tag).includes('canonical'))
    .map((tag) => attributeFor(tag, 'href') ?? '');

const invalidHrefValuesFor = (html: string) => {
  const targetNames = new Set(
    (html.match(/<[a-z][^>]*>/gi) ?? [])
      .flatMap((tag) => [attributeFor(tag, 'id'), attributeFor(tag, 'name')])
      .filter((value): value is string => Boolean(value)),
  );

  return openingTagsFor(html, 'a')
    .map((tag) => attributeFor(tag, 'href'))
    .filter((href): href is string => href !== undefined)
    .map((href) => href.trim())
    .filter((href) => {
      if (!href || /^javascript:/i.test(href)) return true;
      if (!href.startsWith('#')) return false;

      const fragment = href.slice(1);
      if (!fragment) return true;

      try {
        return !targetNames.has(decodeURIComponent(fragment));
      } catch {
        return true;
      }
    });
};

beforeAll(() => {
  execFileSync('npm', ['run', 'build'], { stdio: 'pipe' });
});

describe('generated site shell', () => {
  test('wires the skip link, menu button, and primary navigation', () => {
    const html = htmlFor('/');
    const skipLink = elementsFor(html, 'a').find(({ openingTag }) =>
      classNamesFor(openingTag).includes('skip-link'),
    );
    expect(skipLink).toBeDefined();
    expect(textFor(skipLink!.innerHtml)).toBe('Skip to main content');
    const skipTarget = attributeFor(skipLink!.openingTag, 'href');
    expect(skipTarget).toBe('#main-content');
    expect(
      openingTagsFor(html, 'main').some(
        (tag) => `#${attributeFor(tag, 'id')}` === skipTarget,
      ),
    ).toBe(true);

    const menuButton = openingTagsFor(html, 'button').find((tag) =>
      /\sdata-menu-toggle(?:\s|>)/i.test(tag),
    );
    expect(menuButton).toBeDefined();
    expect(attributeFor(menuButton!, 'aria-expanded')).toBe('false');
    expect(attributeFor(menuButton!, 'aria-controls')).toBe('primary-navigation');

    const primaryNavigation = elementsFor(html, 'nav').find(
      ({ openingTag }) =>
        attributeFor(openingTag, 'id') === attributeFor(menuButton!, 'aria-controls'),
    );
    expect(primaryNavigation).toBeDefined();
    expect(attributeFor(primaryNavigation!.openingTag, 'aria-label')).toBe('Primary navigation');
  });

  test('renders the approved navigation in order with active and external semantics', () => {
    const html = htmlFor('/');
    const primaryNavigation = elementsFor(html, 'nav').find(
      ({ openingTag }) => attributeFor(openingTag, 'id') === 'primary-navigation',
    );
    expect(primaryNavigation).toBeDefined();
    const navigationLinks = elementsFor(primaryNavigation!.innerHtml, 'a');

    expect(
      navigationLinks.map(({ openingTag, innerHtml }) => ({
        label: visibleTextFor(innerHtml),
        href: attributeFor(openingTag, 'href'),
      })),
    ).toEqual(expectedNavigation);

    const [homeLink, ...inactiveLinks] = navigationLinks;
    expect(classNamesFor(homeLink.openingTag)).toContain('active');
    expect(attributeFor(homeLink.openingTag, 'aria-current')).toBe('page');
    expect(
      inactiveLinks.every(
        ({ openingTag }) =>
          !classNamesFor(openingTag).includes('active') &&
          attributeFor(openingTag, 'aria-current') === undefined,
      ),
    ).toBe(true);

    const externalLink = navigationLinks.at(-1)!;
    expect(attributeFor(externalLink.openingTag, 'target')).toBe('_blank');
    expect(relTokensFor(externalLink.openingTag)).toEqual(['noreferrer']);
    const hiddenExternalLabels = elementsFor(externalLink.innerHtml, 'span').filter(
      ({ openingTag }) => classNamesFor(openingTag).includes('visually-hidden'),
    );
    expect(hiddenExternalLabels).toHaveLength(1);
    expect(textFor(hiddenExternalLabels[0].innerHtml)).toBe('(external)');
    expect(html).not.toContain('Get Involved');
  });

  test('renders the shared footer and exact neutral workshop status', () => {
    const html = htmlFor('/');
    const mailingListLink = elementsFor(html, 'a').find(
      ({ innerHtml }) => visibleTextFor(innerHtml) === 'ICBINB mailing list',
    );
    expect(mailingListLink).toBeDefined();
    expect(attributeFor(mailingListLink!.openingTag, 'href')).toBe(
      'https://groups.google.com/g/icbinb',
    );
    expect(html).toContain('NeurIPS Workshop 2026');
    expect(html).toMatch(/<p\b[^>]*>\s*Workshop at NeurIPS 2026\s*<\/p>/);
    expect(html).not.toMatch(/accepted/i);
  });

  test('provides the exact canonical URL', () => {
    const html = htmlFor('/');
    const canonicalLinks = openingTagsFor(html, 'link').filter((tag) =>
      relTokensFor(tag).includes('canonical'),
    );
    expect(canonicalLinks).toHaveLength(1);
    expect(attributeFor(canonicalLinks[0], 'href')).toBe('https://icbinbio.github.io/');
  });

  test('keeps the mobile navigation scrollable within viewport bounds', () => {
    const css = stylesheetFor(htmlFor('/'));
    const primaryNavigationRules = Array.from(
      css.matchAll(/\.primary-nav\{([^}]*)\}/g),
      (match) => match[1].replace(/\s+/g, ''),
    );
    const mobileNavigationRule = primaryNavigationRules.find((rule) =>
      rule.includes('position:absolute'),
    );

    expect(mobileNavigationRule).toBeDefined();
    const fallback = 'max-block-size:calc(100vh-4.5rem)';
    const dynamicViewport = 'max-block-size:calc(100dvh-4.5rem)';
    expect(mobileNavigationRule).toContain(fallback);
    expect(mobileNavigationRule).toContain('overflow-y:auto');
    expect(primaryNavigationRules).toContain(dynamicViewport);
    expect(css.replace(/\s+/g, '')).toContain(
      `@supports(height:100dvh){.primary-nav{${dynamicViewport}}}`,
    );
  });

  test('renders the complete homepage identity', () => {
    const html = htmlFor('/');
    expect(html).toContain("I Can't Believe It's Not Better");
    expect(html).toContain('Failure Modes of AI in Biology');
    expect(html).toContain('Workshop at NeurIPS 2026');
    expect(html).not.toMatch(/accepted workshop/i);
    expect(html).toContain('Stress-testing AI for biology in the real world');
  });

  test('renders the centralized workshop title before the event line', () => {
    const html = htmlFor('/');
    const source = readFileSync(resolve('src/pages/index.astro'), 'utf8');
    const heading = elementsFor(html, 'h1')[0];
    const bannerIndex = html.indexOf('class="hero-banner"');
    const headingIndex = html.indexOf(heading.html);
    const eventLineIndex = html.indexOf(workshop.eventLine);

    expect(textFor(heading.innerHtml)).toBe(workshop.name);
    expect(source).toMatch(/<h1>[\s\S]*workshop\.name[\s\S]*<\/h1>/);
    expect(bannerIndex).toBeGreaterThanOrEqual(0);
    expect(headingIndex).toBeGreaterThan(bannerIndex);
    expect(eventLineIndex).toBeGreaterThan(headingIndex);
  });

  test('identifies the centralized workshop name in shared metadata', () => {
    const html = htmlFor('/');
    const siteName = openingTagsFor(html, 'meta').find(
      (tag) => attributeFor(tag, 'property') === 'og:site_name',
    );

    expect(siteName).toBeDefined();
    expect(attributeFor(siteName!, 'content')).toBe(workshop.name);
  });

  test('labels dates and location honestly', () => {
    const html = htmlFor('/');
    expect(html.match(/Tentative/g)?.length).toBeGreaterThanOrEqual(5);
    expect(html).toContain('Exact date and location to be announced');
  });
});

const administrativeRoutes = [
  ['/submit/', 'Call for Papers'],
  ['/schedule/', 'Tentative Schedule'],
  ['/papers/', 'Papers'],
  ['/reviewer-guidelines/', 'Reviewer Guidelines'],
] as const;

test.each([
  [
    'src/pages/submit.astro',
    ['Paper submission', 'Review period', 'Acceptance notification', 'Camera-ready & poster'],
    ['August 29, 2026', 'August 29–September 21, 2026', 'September 29, 2026', 'October 20, 2026'],
    ['.value', '.note'],
  ],
  [
    'src/pages/schedule.astro',
    ['In-person workshop'],
    ['December 2026'],
    ['.value', '.note'],
  ],
  [
    'src/pages/papers.astro',
    ['Acceptance notification'],
    ['September 29, 2026'],
    ['.value'],
  ],
  [
    'src/pages/reviewer-guidelines.astro',
    ['Review period'],
    ['August 29–September 21, 2026'],
    ['.value'],
  ],
] as const)(
  '%s sources its dates from named workshop records',
  (sourcePath, dateLabels, duplicatedValues, requiredFields) => {
    const source = readFileSync(resolve(sourcePath), 'utf8');
    expect(source).toMatch(/import\s*\{\s*workshop\s*\}\s*from\s*['"]\.\.\/data\/workshop['"]/);
    expect(source).toContain('workshop.dates.find');
    for (const dateLabel of dateLabels) expect(source).toContain(`'${dateLabel}'`);
    for (const field of requiredFields) expect(source).toContain(field);
    for (const duplicatedValue of duplicatedValues) expect(source).not.toContain(duplicatedValue);
  },
);

test.each(administrativeRoutes)('renders %s with its exact first h1', (route, heading) => {
  expect(firstHeadingTextFor(htmlFor(route))).toBe(heading);
});

test.each(administrativeRoutes)('provides the exact canonical URL for %s', (route) => {
  expect(canonicalHrefsFor(htmlFor(route))).toEqual([
    `https://icbinbio.github.io${route}`,
  ]);
});

test('never emits empty or fake links', () => {
  for (const [route] of administrativeRoutes) {
    expect(invalidHrefValuesFor(htmlFor(route))).toEqual([]);
  }
  expect(htmlFor('/submit/')).toContain('Submission site coming soon');
});

test('publishes submission eligibility and all evaluation criteria', () => {
  const text = visibleTextFor(htmlFor('/submit/'));

  expect(text).toContain('Eligibility');
  expect(text).toContain(
    'Submissions are considered only if the work has not been accepted for publication in previous conference proceedings.',
  );
  expect(text).toContain('Evaluation criteria');
  for (const criterion of [
    'Clarity of the problem and claims.',
    'Technical rigour and reproducibility.',
    'Faithfulness to the biological setting.',
    'Depth of failure analysis.',
    'Quality of empirical documentation.',
  ]) {
    expect(text).toContain(criterion);
  }
});

test('announces papers and program decisions only after the tentative notification date', () => {
  const html = htmlFor('/papers/');
  const text = visibleTextFor(html);
  const source = readFileSync(resolve('src/pages/papers.astro'), 'utf8');

  expect(text).toContain(
    'Papers, spotlights, posters, and awards will be announced after the tentative notification date, currently September 29, 2026.',
  );
  expect(text).not.toMatch(/announcements begin|announced on September 29/i);
  expect(source).toContain('notificationDate.tentative');
});

test('renders the Schedule notice directly from centralized venue presentation fields', () => {
  const html = htmlFor('/schedule/');
  const text = visibleTextFor(html);
  const source = readFileSync(resolve('src/pages/schedule.astro'), 'utf8');

  expect(text).toContain(expectedVenueNoticeLabel);
  expect(text).toContain(`${workshop.venue.month}. ${expectedVenuePublicDetail}`);
  expect(source).toContain('workshopDate.value !== workshop.venue.month');
  expect(source).toContain('workshop.venue.noticeLabel');
  expect(source).toContain('workshop.venue.publicDetail');
  expect(source).not.toMatch(/\.replace\s*\(/);
});

test('uses neutral markup for schedule time ranges', () => {
  const html = htmlFor('/schedule/');
  const scheduleTimes = elementsFor(html, 'span').filter(({ openingTag }) =>
    classNamesFor(openingTag).includes('schedule-time'),
  );

  expect(elementsFor(html, 'time')).toHaveLength(0);
  expect(scheduleTimes.map(({ innerHtml }) => textFor(innerHtml))).toEqual(
    workshop.schedule.map(({ time }) => time),
  );
});

test('link audit rejects unsafe and unresolved hrefs', () => {
  const invalidDocuments = [
    '<a href="   ">Whitespace</a>',
    '<a href="JaVaScRiPt:void(0)">Script</a>',
    '<a href="#">Empty fragment</a>',
    '<a href="#missing">Missing fragment</a>',
  ];

  expect(invalidDocuments.map(invalidHrefValuesFor)).toEqual([
    [''],
    ['JaVaScRiPt:void(0)'],
    ['#'],
    ['#missing'],
  ]);
});

test('link audit accepts fragments with same-document targets', () => {
  const html = [
    '<a href="#main-content">Main content</a>',
    '<main id="main-content"></main>',
    '<a href="#legacy-target">Legacy target</a>',
    '<a name="legacy-target"></a>',
  ].join('');

  expect(invalidHrefValuesFor(html)).toEqual([]);
});

test('renders all invited speakers', () => {
  const html = htmlFor('/speakers/');
  for (const name of ['Anshul Kundaje', 'Marzyeh Ghassemi', 'Hoifung Poon', 'Mihaela van der Schaar', 'Sergey Ovchinnikov']) {
    expect(html).toContain(name);
  }
});

test('renders all organizers without personal email addresses', () => {
  const html = htmlFor('/organizers/');
  for (const name of ['Maria Brbić', 'Peter Koo', 'Bianca M. Dumitrascu', 'Su-In Lee', 'Siba Smarak Panigrahi', 'Masayuki Nagai', 'Ozgur Yilmaz Beker', 'Soham Gadgil']) {
    expect(html).toContain(name);
  }
  expect(html).not.toMatch(/(?:mbrbic|koo|bmd2151|suinlee|panigrahi|nagai|ob2391|sgadgil)@/i);
});

test('builds a noindex custom 404 without canonical or URL metadata', () => {
  const html = readFileSync(resolve('dist/404.html'), 'utf8');
  const robots = openingTagsFor(html, 'meta').find(
    (tag) => attributeFor(tag, 'name') === 'robots',
  );
  const openGraphUrls = openingTagsFor(html, 'meta').filter(
    (tag) => attributeFor(tag, 'property') === 'og:url',
  );

  expect(html).toContain('Page not found');
  expect(html).toContain('Back to the workshop');
  expect(robots).toBeDefined();
  expect(attributeFor(robots!, 'content')).toBe('noindex');
  expect(canonicalHrefsFor(html)).toEqual([]);
  expect(openGraphUrls).toEqual([]);
});

test('ships local brand assets', () => {
  for (const path of ['public/images/icbinb-wordmark.png', 'public/images/icbinb-banner.jpg', 'public/images/favicon.png']) {
    expect(existsSync(resolve(path))).toBe(true);
  }
});

test('uses the official Astro Pages actions', () => {
  const workflow = readFileSync(resolve('.github/workflows/deploy.yml'), 'utf8');
  expect(workflow).toContain('actions/checkout@v7');
  expect(workflow).toContain('withastro/action@v6');
  expect(workflow).toContain('actions/deploy-pages@v5');
});

test('resolves every internal page link', () => {
  const routes = ['/', '/submit/', '/speakers/', '/schedule/', '/papers/', '/reviewer-guidelines/', '/organizers/'];
  const html = routes.map(htmlFor).join('\n');
  const hrefs = [...html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)"/g)].map((match) => match[1]);

  for (const href of hrefs) {
    const target = href === '/' ? resolve('dist/index.html') : resolve('dist', href.slice(1), 'index.html');
    expect(existsSync(target), `Missing internal target for ${href}`).toBe(true);
  }
});
