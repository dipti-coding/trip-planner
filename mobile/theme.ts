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
  successSubtle: 'rgba(25,128,56,0.14)',
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
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 32,

  // Weights
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
