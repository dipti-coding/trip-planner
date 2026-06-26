import {toISO, stripLeadingWeekday, findDateCandidates} from '../core/dates';

describe('toISO — deterministic date/time parsing', () => {
  const cases: Array<[string, string, string | undefined]> = [
    // [raw span, tripYear, expected]
    ['Sep 04, 2025, 03:00 pm', '2025', '2025-09-04T15:00:00'], // hotel-1 check-in
    ['Sep 07, 2025, 11:00 am', '2025', '2025-09-07T11:00:00'], // hotel-1 check-out
    ['Feb 14, 2026', '2026', '2026-02-14'], // hotel-2 (date-only)
    ['Feb 17, 2026', '2026', '2026-02-17'],
    ['Mar 06, 2024 at 12:30 AM', '2024', '2024-03-06T00:30:00'], // car-1 (12am → 00)
    ['Mar 09, 2024 at 10:30 PM', '2024', '2024-03-09T22:30:00'], // car-1 (10pm → 22)
    ['December 20, 2025 at 12:00 pm', '2025', '2025-12-20T12:00:00'], // 12pm → 12
    ['7 January 2026', '2026', '2026-01-07'], // day-month-year
    ['19 August 2023', '2023', '2023-08-19'],
    ['DEC 22, 2025 AT 06:00 PM', '2025', '2025-12-22T18:00:00'], // uppercase
    ['2026-01-07T15:10:00', '2026', '2026-01-07T15:10:00'], // ISO idempotent
    ['Oct 14', '2025', '2025-10-14'], // no year → tripYear
    ['nonsense', '2025', undefined],
  ];
  test.each(cases)('toISO(%j, %j) === %j', (raw, year, expected) => {
    expect(toISO(raw, year)).toBe(expected);
  });
});

describe('stripLeadingWeekday', () => {
  test.each([
    ['Wed Mar 06, 2024 at 12:30 AM', 'Mar 06, 2024 at 12:30 AM'],
    ['Thu, Sep 04, 2025, 03:00 pm', 'Sep 04, 2025, 03:00 pm'],
    ['Saturday, December 20, 2025', 'December 20, 2025'],
    ['Mar 09, 2024', 'Mar 09, 2024'],
  ])('strips %j', (input, expected) => {
    expect(stripLeadingWeekday(input)).toBe(expected);
  });
});

describe('findDateCandidates — ordered datetimes from messy OCR', () => {
  test('stitches a date with the time on the following line', () => {
    const text = 'Mon, Oct 14\n12:58pm\nMon, Oct 14\n1:59pm';
    expect(findDateCandidates(text, '2025')).toEqual([
      '2025-10-14T12:58:00',
      '2025-10-14T13:59:00',
    ]);
  });

  test('skips OCR-garbled month names (LLM recovers those)', () => {
    // "Uct" (a real JetBlue OCR error for "Oct") is not a month → not a candidate.
    expect(findDateCandidates('Mon, Uct 14\n1:59pm', '2025')).toEqual([]);
  });
});
