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

// Categorical gradient colors for plan types — each pair is [tint, base] for LinearGradient
export const planColors = {
  flight:  {base: '#0f62fe', tint: '#4589ff'},  // matches colors.accent
  hotel:   {base: '#8a3ffc', tint: '#be95ff'},
  food:    {base: '#d2691e', tint: '#f1a266'},
  nature:  {base: '#198038', tint: '#42be65'},  // matches colors.success
  event:   {base: '#da1e28', tint: '#ff8389'},  // matches colors.danger
  neutral: {base: '#525252', tint: '#8d8d8d'},  // matches colors.textSecondary / textTertiary
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

// Destination cover gradients — muted, soothing tones, dark→light top-to-bottom
// so white text on the top portion is always readable
const coverPalette: Record<string, string[]> = {
  tokyo:     ['#5C4A7A', '#8B6BA8', '#B8A0CC', '#DDD0E8'],  // muted plum
  iceland:   ['#2A4A6E', '#4A78A0', '#7AA8C8', '#B0CDE0'],  // muted arctic blue
  paris:     ['#6B4E38', '#9C7A58', '#C4A882', '#E4D0B4'],  // muted warm amber
  spring:    ['#3A6648', '#5E9870', '#90C8A0', '#C4E4CC'],  // muted sage green
  summer:    ['#7A4A28', '#B07848', '#D4A870', '#EDD0A0'],  // muted terracotta
  fall:      ['#5C3A28', '#8C6248', '#B89078', '#D8BCA8'],  // muted brown
  winter:    ['#2E4060', '#4A6488', '#7898B8', '#A8BED4'],  // muted slate blue
  beach:     ['#1E6878', '#3898AA', '#70C0CC', '#B0DCE0'],  // muted teal
  mountains: ['#3A5070', '#5A7898', '#88A8C4', '#B8CCD8'],  // muted steel blue
  default:   ['#3A5888', '#5878A8', '#88A0C8', '#B8C8E0'],  // muted blue
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
