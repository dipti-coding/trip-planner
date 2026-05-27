// Design tokens extracted from designs/PlanMyTrip.html
// Source: IBM Carbon-based design system with light/dark variants

export const colors = {
  // Backgrounds
  bgBase: '#f4f4f4',
  bgBase2: '#ffffff',
  bgBase3: '#e8e8e8',

  // Surfaces (cards, sheets)
  surface: '#ffffff',
  surface2: '#f4f4f4',

  // Text
  textPrimary: '#161616',
  textSecondary: '#525252',
  textTertiary: '#8d8d8d',

  // Borders
  border: '#e0e0e0',
  borderStrong: '#c6c6c6',

  // Accent / interactive
  accent: '#0f62fe',
  accentHover: '#0353e9',

  // Semantic
  danger: '#da1e28',
  dangerSubtle: '#fff1f1',
  success: '#198038',
  successSubtle: '#defbe6',
  warn: '#f1c21b',
  warnSubtle: 'rgba(255,243,196,0.18)',

  // Dark mode variants (use with Appearance.getColorScheme())
  dark: {
    bgBase: '#0a0a0a',
    bgBase2: '#161616',
    bgBase3: '#1f1f1f',
    surface: '#1c1c1e',
    surface2: '#2c2c2e',
    textPrimary: '#f4f4f4',
    textSecondary: '#c6c6c6',
    textTertiary: '#8d8d8d',
    border: '#2c2c2e',
    borderStrong: '#3a3a3c',
    accent: '#4589ff',
    accentHover: '#6ea0ff',
    tabBar: 'rgba(28,28,30,0.86)',
  },

  tabBar: 'rgba(247,247,247,0.82)',
} as const;

export const typography = {
  fontSans: 'IBM Plex Sans',
  fontMono: 'IBM Plex Mono',

  // Scale
  xs: 10,
  sm: 12,
  bodySmall: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 32,

  // Weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 10,
  xl: 12,
  card: 18,    // --r-card
  row: 14,     // --r-row
  chip: 999,   // --r-chip (pill)
} as const;

export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
} as const;

// Destination cover gradients (from designs/PlanMyTrip.html cover-* classes)
// Colors flow top→bottom matching the design's vertical linear gradients
const coverPalette: Record<string, string[]> = {
  tokyo:          ['#FFB5A8', '#FF8E89', '#C9627E', '#6B3F66'],
  iceland:        ['#2A4374', '#5B7BB0', '#8FB1D9', '#C5DCEE'],
  paris:          ['#F5C97E', '#E89B6A', '#E89B6A', '#B16F7E'],
  spring:         ['#FFCDA0', '#FF9C8B', '#FF9C8B', '#B16484'],
  summer:         ['#FFD27A', '#FF8E60', '#FF8E60', '#B83A6D'],
  fall:           ['#FFB66E', '#D86F49', '#D86F49', '#6B3D5C'],
  winter:         ['#B8D0E8', '#6F8FB9', '#6F8FB9', '#2E3E73'],
  beach:          ['#FFE0A0', '#66C4D6', '#66C4D6', '#1A6A98'],
  mountains:      ['#4A6A8F', '#7AA0BE', '#7AA0BE', '#BFD9E8'],
  default:        ['#4FACEE', '#76C2F1', '#BCDEEF', '#BCDEEF'],
};

const SEASON_KEYS = ['spring', 'summer', 'fall', 'winter'] as const;

export function coverGradient(city: string): string[] {
  const key = city.toLowerCase().replace(/\s+/g, '');
  if (key.includes('tokyo') || key.includes('japan'))     return coverPalette.tokyo;
  if (key.includes('iceland') || key.includes('reykjavik')) return coverPalette.iceland;
  if (key.includes('paris') || key.includes('france'))    return coverPalette.paris;
  if (key.includes('beach') || key.includes('miami') || key.includes('bali')) return coverPalette.beach;
  if (key.includes('mount') || key.includes('alps') || key.includes('hike')) return coverPalette.mountains;
  // deterministic hash → one of the four city-season variants
  let hash = 0;
  for (let i = 0; i < city.length; i++) hash = (hash * 31 + city.charCodeAt(i)) & 0xffff;
  return coverPalette[SEASON_KEYS[hash % 4]];
}
