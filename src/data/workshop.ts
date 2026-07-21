export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface LinkItem {
  label: string;
  href: string;
}

export interface Person {
  name: string;
  initials: string;
  photo?: string;
  affiliation: string;
  focus: string;
  bio: string;
  links: LinkItem[];
}

export interface ScheduleItem {
  time: string;
  title: string;
  category: 'talk' | 'discussion' | 'break' | 'community';
}

export const workshop = {
  name: "I Can't Believe It's Not Better: Failure Modes of AI in Biology",
  shortName: 'ICBINB-BIO',
  eventLine: 'Workshop at NeurIPS 2026',
  tagline:
    'Stress-testing AI for biology in the real world: failure modes, robustness, and trustworthy scientific discovery.',
  contact: 'icbinbbio@gmail.com',
  venue: {
    month: 'December 2026',
    status: 'To be announced',
    detail: 'Exact date and location to be announced',
    noticeLabel: 'Date and venue to be announced',
    publicDetail: 'The exact workshop date, city, venue, room, and local timezone will be announced.',
  },
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'Submit', href: '/submit/' },
    { label: 'Speakers', href: '/speakers/' },
    { label: 'Schedule', href: '/schedule/' },
    { label: 'Papers', href: '/papers/' },
    { label: 'Reviewer Guidelines', href: '/reviewer-guidelines/' },
    { label: 'Organizers', href: '/organizers/' },
    { label: 'ICBINB', href: 'https://icbinb.cc/', external: true },
  ] satisfies NavItem[],
  dates: [
    { label: 'Paper submission', value: 'August 29, 2026', note: '11:59 p.m. AoE', tentative: true },
    { label: 'Review period', value: 'August 29–September 21, 2026', tentative: true },
    { label: 'Acceptance notification', value: 'September 29, 2026', tentative: true },
    { label: 'Camera-ready & poster', value: 'October 20, 2026', tentative: true },
    { label: 'In-person workshop', value: 'December 2026', note: 'Exact date and location to be announced', tentative: true },
  ],
  topics: [
    'Out-of-distribution generalization and domain shift',
    'Failure under weak or confounded supervision',
    'Causal mechanisms versus spurious correlation',
    'Uncertainty, calibration, and decision-aware reliability',
    'Interpretability and trustworthy biological inference',
    'Learning with limited data and distribution shift',
    'Deployment-relevant evaluation beyond benchmarks',
    'Limits of foundation, multimodal, and agentic models',
    'Causal intervention and experimental design',
  ],
  schedule: [
    { time: '08:50–09:00', title: 'Opening remarks', category: 'community' },
    { time: '09:00–10:00', title: 'Invited talks 1 & 2', category: 'talk' },
    { time: '10:00–10:30', title: 'Spotlight talks 1, 2 & 3', category: 'talk' },
    { time: '10:30–10:45', title: 'Moderated spotlight discussion', category: 'discussion' },
    { time: '10:45–11:00', title: 'Coffee break', category: 'break' },
    { time: '11:00–12:15', title: 'Poster session', category: 'community' },
    { time: '12:15–13:00', title: 'Lunch break', category: 'break' },
    { time: '13:00–14:30', title: 'Invited talks 3, 4 & 5', category: 'talk' },
    { time: '14:30–15:00', title: 'Spotlight talks 4, 5 & 6', category: 'talk' },
    { time: '15:00–15:15', title: 'Moderated spotlight discussion', category: 'discussion' },
    { time: '15:15–15:30', title: 'Coffee break', category: 'break' },
    { time: '15:30–16:30', title: 'Panel discussion', category: 'discussion' },
    { time: '16:30–17:00', title: 'Closing synthesis', category: 'community' },
  ] satisfies ScheduleItem[],
  speakers: [
    {
      name: 'Anshul Kundaje',
      initials: 'AK',
      affiliation: 'Stanford University',
      focus: 'Regulatory genomics · Real-world deployment',
      bio: 'Develops deep-learning methods and interpretation frameworks for biological sequences, molecular interactions, and genetic variation.',
      links: [
        { label: 'Homepage', href: 'https://profiles.stanford.edu/anshul-kundaje' },
        { label: 'ORCID', href: 'https://orcid.org/0000-0003-3084-2287' },
      ],
    },
    {
      name: 'Marzyeh Ghassemi',
      initials: 'MG',
      affiliation: 'MIT',
      focus: 'Health fairness · Clinical AI',
      bio: 'Designs robust, private, and fair learning methods for health and studies the evaluation challenges of clinical machine learning.',
      links: [
        { label: 'Homepage', href: 'https://healthyml.org/marzyeh/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=9RyeFYwAAAAJ&hl=en' },
      ],
    },
    {
      name: 'Hoifung Poon',
      initials: 'HP',
      affiliation: 'Microsoft Research',
      focus: 'Tissue pathology · Virtual patients',
      bio: 'Leads precision-health research spanning causal learning across biological sequences, radiology, pathology, and genomics.',
      links: [
        { label: 'Homepage', href: 'https://www.microsoft.com/en-us/research/people/hoifung/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=yqqmVbkAAAAJ&hl=en' },
      ],
    },
    {
      name: 'Mihaela van der Schaar',
      initials: 'MS',
      affiliation: 'University of Cambridge',
      focus: 'Reality-centric biomedicine',
      bio: 'Develops machine-learning methods for medicine and directs the Cambridge Centre for AI in Medicine.',
      links: [
        { label: 'Homepage', href: 'https://www.vanderschaar-lab.com/prof-mihaela-van-der-schaar/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=DZ3S--MAAAAJ&hl=en' },
      ],
    },
    {
      name: 'Sergey Ovchinnikov',
      initials: 'SO',
      affiliation: 'MIT',
      focus: 'Protein evolution',
      bio: 'Combines phylogenetic inference, protein structure prediction and design, deep learning, and differentiable programming.',
      links: [
        { label: 'Homepage', href: 'https://biology.mit.edu/profile/sergey-ovchinnikov/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=8KJ9gf4AAAAJ&hl=en' },
      ],
    },
  ] satisfies Person[],
  organizers: [
    {
      name: 'Maria Brbić',
      initials: 'MB',
      photo: '/images/organizers/maria-brbic.jpg',
      affiliation: 'EPFL',
      focus: 'AI for biology and biomedicine',
      bio: 'Develops AI methods that drive advances in biology and biomedicine.',
      links: [
        { label: 'Homepage', href: 'https://brbiclab.epfl.ch/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?hl=en&user=ltxmeroAAAAJ' },
      ],
    },
    {
      name: 'Peter Koo',
      initials: 'PK',
      photo: '/images/organizers/peter-koo.jpg',
      affiliation: 'Cold Spring Harbor Laboratory',
      focus: 'Interpretable and generative genomics',
      bio: 'Develops interpretable and generative machine-learning methods for regulatory genomics.',
      links: [
        { label: 'Homepage', href: 'https://koo-lab.github.io/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=zoAsQGwAAAAJ&hl=en&oi=ao' },
      ],
    },
    {
      name: 'Bianca M. Dumitrascu',
      initials: 'BD',
      affiliation: 'Columbia University',
      focus: 'Machine learning · Genetics · Spatial systems',
      bio: 'Studies how local molecular rules give rise to emergent spatial patterns in biological dynamical systems.',
      links: [
        { label: 'Homepage', href: 'https://www.morpho-lab.com/bianca.html' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=wF23N-4AAAAJ&hl=en' },
      ],
    },
    {
      name: 'Su-In Lee',
      initials: 'SL',
      photo: '/images/organizers/su-in-lee.jpg',
      affiliation: 'University of Washington',
      focus: 'Explainable AI · Molecular and clinical applications',
      bio: 'Advances explainable AI principles for molecular biology and clinical medicine.',
      links: [
        { label: 'Homepage', href: 'https://suinlee.cs.washington.edu/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=3ifikJ0AAAAJ&hl=en' },
      ],
    },
    {
      name: 'Siba Smarak Panigrahi',
      initials: 'SP',
      affiliation: 'EPFL',
      focus: 'Multimodal single-cell models · Scientific agents',
      bio: 'Develops multimodal models for single-cell multi-omics and benchmarks agentic scientific systems.',
      links: [
        { label: 'Homepage', href: 'https://sibasmarak.github.io/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=X0n6DHoAAAAJ&hl=en' },
      ],
    },
    {
      name: 'Masayuki Nagai (Moon)',
      initials: 'MN',
      photo: '/images/organizers/masayuki-nagai.jpg',
      affiliation: 'Cold Spring Harbor Laboratory',
      focus: 'Continual learning · Genomic foundation models',
      bio: 'Studies continual learning for genomic foundation models using perturbation data.',
      links: [
        { label: 'Homepage', href: 'https://masayukinagai.github.io/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=dvXFid8AAAAJ&hl=en&oi=sra' },
      ],
    },
    {
      name: 'Ozgur Yilmaz Beker',
      initials: 'OB',
      affiliation: 'Columbia University',
      focus: 'Probabilistic single-cell models',
      bio: 'Develops probabilistic models for multi-condition single-cell omics and interpretable conditional effects.',
      links: [
        { label: 'Homepage', href: 'https://cancerdynamics.columbia.edu/ozgur-beker' },
        { label: 'ORCID', href: 'https://orcid.org/0000-0001-6226-7235' },
      ],
    },
    {
      name: 'Soham Gadgil',
      initials: 'SG',
      affiliation: 'University of Washington',
      focus: 'Explainable clinical foundation models',
      bio: 'Develops explainable AI methods that connect clinical foundation models to human-understandable concepts.',
      links: [
        { label: 'Homepage', href: 'https://sohamgadgil.com/' },
        { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=Tg2VT2UAAAAJ&hl=en&oi=ao' },
      ],
    },
  ] satisfies Person[],
};
