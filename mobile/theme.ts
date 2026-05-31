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

// Deterministic tint color per trip — derived from trip ID, used on card covers and detail header
const TINT_PALETTE = [
  '#E8432D', // coral-red
  '#F97316', // amber-orange
  '#3B82F6', // sky-blue
  '#8B5CF6', // violet
  '#EC4899', // rose-pink
  '#06B6D4', // cyan-teal
  '#10B981', // emerald
  '#EAB308', // gold-yellow
  '#6366F1', // indigo
  '#D97706', // warm-amber
];

/** Lighter pastel version of a tint hex color — mix 55% tint + 45% white. */
export function lightTint(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * 0.55 + 255 * 0.45).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

export function tripTint(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return TINT_PALETTE[h % TINT_PALETTE.length];
}

// Solid color per destination type — used for small thumbnails (44×44, 28×28)
// Colors match the dominant hue of each SVG cover illustration
export const TYPE_COLORS: Record<string, string> = {
  city:       '#0D2152',  // midnight blue (CityCover sky)
  beach:      '#0284C7',  // ocean blue (BeachCover water)
  island:     '#0891B2',  // cyan (IslandCover sea)
  mountain:   '#1E1B4B',  // deep indigo (MountainCover sky)
  nature:     '#166534',  // forest green (NatureCover hills)
  historical: '#92400E',  // amber (HistoricalCover columns)
  other:      '#3A5888',  // muted blue (default)
};
