import { describe, expect, test } from 'vitest';
import { workshop } from '../../src/data/workshop';

describe('workshop data', () => {
  test('exposes the approved navigation', () => {
    expect(workshop.navigation).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Submit', href: '/submit/' },
      { label: 'Speakers', href: '/speakers/' },
      { label: 'Schedule', href: '/schedule/' },
      { label: 'Papers', href: '/papers/' },
      { label: 'Reviewer Guidelines', href: '/reviewer-guidelines/' },
      { label: 'Organizers', href: '/organizers/' },
      { label: 'ICBINB', href: 'https://icbinb.cc/', external: true },
    ]);
    expect(workshop.navigation.some(({ label }) => label === 'Get Involved')).toBe(false);
  });

  test('keeps the hero status neutral', () => {
    expect(workshop.eventLine).toBe('Workshop at NeurIPS 2026');
    expect(workshop.eventLine).not.toMatch(/accepted/i);
  });

  test('contains the complete public rosters', () => {
    const speakerNames = workshop.speakers.map(({ name }) => name);
    const organizerNames = workshop.organizers.map(({ name }) => name);

    expect(speakerNames).toEqual([
      'Anshul Kundaje',
      'Marzyeh Ghassemi',
      'Hoifung Poon',
      'Mihaela van der Schaar',
      'Sergey Ovchinnikov',
    ]);
    expect(organizerNames).toEqual([
      'Maria Brbić',
      'Peter Koo',
      'Bianca M. Dumitrascu',
      'Su-In Lee',
      'Siba Smarak Panigrahi',
      'Masayuki Nagai',
      'Ozgur Yilmaz Beker',
      'Soham Gadgil',
    ]);
    expect(new Set(speakerNames).size).toBe(speakerNames.length);
    expect(new Set(organizerNames).size).toBe(organizerNames.length);
  });

  test('keeps personal organizer emails private', () => {
    expect(JSON.stringify(workshop.organizers)).not.toMatch(/@/);
  });

  test('marks every unresolved date explicitly', () => {
    expect(workshop.dates).toHaveLength(5);
    expect(workshop.dates.every(({ tentative }) => tentative)).toBe(true);
    expect(workshop.venue.status).toBe('To be announced');
    expect(workshop.venue.noticeLabel).toBe('Date and venue to be announced');
    expect(workshop.venue.publicDetail).toBe(
      'The exact workshop date, city, venue, room, and local timezone will be announced.',
    );
    expect(workshop.dates.find(({ label }) => label === 'In-person workshop')?.value).toBe(
      workshop.venue.month,
    );
  });

  test('keeps contact and initiative links authoritative', () => {
    expect(workshop.contact).toBe('icbinbio@gmail.com');
    expect('links' in workshop).toBe(false);
    expect(workshop.navigation.at(-1)).toEqual({
      label: 'ICBINB',
      href: 'https://icbinb.cc/',
      external: true,
    });
  });
});
