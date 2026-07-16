import { expect, test } from '@playwright/test';

const routes = ['/', '/submit/', '/speakers/', '/schedule/', '/papers/', '/reviewer-guidelines/', '/organizers/'];
const widths = [390, 768, 1440];

const rgbChannels = (cssColor: string) => {
  const channels = cssColor.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length !== 3) throw new Error(`Unsupported CSS color: ${cssColor}`);
  return channels;
};

const relativeLuminance = (cssColor: string) => {
  const channels = rgbChannels(cssColor).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (foreground: string, background: string) => {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

for (const width of widths) {
  for (const route of routes) {
    test(`${route} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const response = await page.goto(route);
      expect(response).not.toBeNull();
      expect(response?.ok()).toBe(true);
      expect(new URL(page.url()).pathname).toBe(route);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    });
  }
}

test('mobile navigation opens and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-menu-toggle]');
  const navigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(toggle).toHaveAccessibleName('Open navigation');
  await expect(navigation).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveAccessibleName('Close navigation');
  await expect(navigation).toBeVisible();
  const homeLink = navigation.getByRole('link', { name: 'Home', exact: true });
  await homeLink.focus();
  await expect(homeLink).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAccessibleName('Open navigation');
  await expect(toggle).toBeFocused();
});

test('skip link reaches main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeFocused();
  await skipLink.press('Enter');
  const main = page.locator('#main-content');
  await expect(main).toBeFocused();
  const outline = await main.evaluate((element) => {
    const style = getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });
  expect(outline.style).not.toBe('none');
  expect(Number.parseFloat(outline.width)).toBeGreaterThanOrEqual(3);
});

test('small accent text meets AA contrast on white and warm surfaces', async ({ page }) => {
  await page.goto('/');
  const samples = await page.locator('.eyebrow, .topic-grid span').evaluateAll((elements) =>
    elements.map((element) => {
      let ancestor: Element | null = element;
      let background = 'rgba(0, 0, 0, 0)';
      while (ancestor) {
        background = getComputedStyle(ancestor).backgroundColor;
        if (background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent') break;
        ancestor = ancestor.parentElement;
      }
      return {
        foreground: getComputedStyle(element).color,
        background,
      };
    }),
  );

  expect(samples.length).toBeGreaterThan(0);
  expect(samples.some(({ background }) => background === 'rgb(255, 255, 255)')).toBe(true);
  expect(samples.some(({ background }) => background === 'rgb(241, 239, 238)')).toBe(true);
  for (const sample of samples) {
    expect(contrastRatio(sample.foreground, sample.background)).toBeGreaterThanOrEqual(4.5);
  }
});

test('brand and text CTA meet the 44px touch-target minimum at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const brand = await page.locator('.brand').boundingBox();
  const textCta = await page.locator('.text-cta').boundingBox();

  expect(brand).not.toBeNull();
  expect(textCta).not.toBeNull();
  expect(brand!.height).toBeGreaterThanOrEqual(44);
  expect(textCta!.height).toBeGreaterThanOrEqual(44);
});

test('short navigation, profile, and footer links meet the 44px touch-target minimum', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const homeLink = page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Home', exact: true });
  const xLink = page.locator('.footer-links').getByRole('link', { name: 'X', exact: true });

  for (const target of [homeLink, xLink]) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }

  await page.goto('/speakers/');
  const shortProfileLink = page.locator('.profile-links a').first();
  const profileBox = await shortProfileLink.boundingBox();
  expect(profileBox).not.toBeNull();
  expect(profileBox!.width).toBeGreaterThanOrEqual(44);
  expect(profileBox!.height).toBeGreaterThanOrEqual(44);
});

test('odd-count grids finish without empty placeholder tracks', async ({ page }) => {
  const cases = [
    { route: '/', width: 768, selector: '.date-grid' },
    { route: '/', width: 768, selector: '.topic-grid' },
    { route: '/speakers/', width: 768, selector: '.profile-grid-speaker' },
    { route: '/speakers/', width: 1440, selector: '.profile-grid-speaker' },
    { route: '/organizers/', width: 1440, selector: '.profile-grid-organizer' },
  ];

  for (const { route, width, selector } of cases) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const edges = await page.locator(selector).evaluate((grid) => {
      const lastItem = grid.lastElementChild;
      if (!lastItem) throw new Error('Expected a populated grid');
      const gridBox = grid.getBoundingClientRect();
      const itemBox = lastItem.getBoundingClientRect();
      return {
        rightGap: Math.abs(gridBox.right - itemBox.right),
        bottomGap: Math.abs(gridBox.bottom - itemBox.bottom),
      };
    });

    expect(edges.rightGap, `${selector} leaves an empty final track at ${width}px`).toBeLessThanOrEqual(1);
    expect(edges.bottomGap, `${selector} leaves an empty final row at ${width}px`).toBeLessThanOrEqual(1);
  }
});

test('button and text CTAs have contrast-safe hover feedback', async ({ page }) => {
  await page.goto('/papers/');
  const button = page.locator('.button-link');
  const buttonBefore = await button.evaluate((element) => getComputedStyle(element).backgroundColor);
  await button.hover();
  const buttonAfter = await button.evaluate((element) => {
    const style = getComputedStyle(element);
    return { foreground: style.color, background: style.backgroundColor };
  });
  expect(buttonAfter.background).not.toBe(buttonBefore);
  expect(contrastRatio(buttonAfter.foreground, buttonAfter.background)).toBeGreaterThanOrEqual(4.5);

  await page.goto('/');
  const textCta = page.locator('.text-cta');
  const textBefore = await textCta.evaluate((element) => getComputedStyle(element).color);
  await textCta.hover();
  const textAfter = await textCta.evaluate((element) => ({
    foreground: getComputedStyle(element).color,
    background: getComputedStyle(element.closest('.surface-warm')!).backgroundColor,
  }));
  expect(textAfter.foreground).not.toBe(textBefore);
  expect(contrastRatio(textAfter.foreground, textAfter.background)).toBeGreaterThanOrEqual(4.5);
});

test('footer links and separators wrap with readable spacing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const linkRow = page.locator('.footer-links');

  await expect(linkRow).toHaveCount(1);
  await expect(linkRow.locator('.footer-separator')).toHaveCount(2);
  const style = await linkRow.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      display: computed.display,
      flexWrap: computed.flexWrap,
      columnGap: computed.columnGap,
      rowGap: computed.rowGap,
    };
  });
  expect(style.display).toBe('flex');
  expect(style.flexWrap).toBe('wrap');
  expect(Number.parseFloat(style.columnGap)).toBeGreaterThanOrEqual(8);
  expect(Number.parseFloat(style.rowGap)).toBeGreaterThan(0);
});

test('reduced-motion preference disables smooth scrolling', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const scrollBehavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
  expect(scrollBehavior).toBe('auto');
});

test('unknown routes return the custom 404 without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto('/missing-production-route/');

  expect(response).not.toBeNull();
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to the workshop' })).toHaveAttribute('href', '/');
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
