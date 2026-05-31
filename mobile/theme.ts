/**
 * PlanMyTrip design tokens — 60-30-10 color rule.
 *
 *  60 % primary   — dominant hue family: cover tints, itinerary headers,
 *                   plan half-sheet hero gradient
 *  30 % secondary — interactive / CTA: buttons, FAB, progress bar,
 *                   active states, calendar edges
 *  10 % accent    — plan-type colors: icons, type chips, small highlights
 *
 * To switch themes, change ACTIVE_THEME at the bottom of the file.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Six-stop scale: 50 (lightest ghost) → 900 (deepest). */
export type PrimaryScale = {
  '50':  string;
  '100': string;
  '300': string;
  '500': string;
  '700': string;
  '900': string;
};

export type SecondaryTokens = {
  base:    string;
  hover:   string;
  subtle:  string;   // ~10 % opacity — range fills, hover bgs
  xSubtle: string;   // ~6 % opacity  — active button bgs
};

export type NeutralTokens = {
  bgBase:        string;
  bgBase2:       string;
  bgBase3:       string;
  surface:       string;
  surface2:      string;
  textPrimary:   string;
  textSecondary: string;
  textTertiary:  string;
  border:        string;
  borderStrong:  string;
  danger:        string;
  dangerSubtle:  string;
  success:       string;
  successSubtle: string;
  warn:          string;
  warnSubtle:    string;
  shadow:        string;
  tabBar:        string;
};

export type PlanColorPair   = { base: string; tint: string };
export type PlanColorTokens = {
  flight:  PlanColorPair;
  hotel:   PlanColorPair;
  food:    PlanColorPair;
  nature:  PlanColorPair;
  event:   PlanColorPair;
  neutral: PlanColorPair;
};

/** Compositing values for UI layered over colorful covers / tinted headers. */
export type GlassTokens = {
  modalBg:      string;
  buttonBg:     string;
  buttonBorder: string;
  textPrimary:  string;   // ~0.95
  textHigh:     string;   // ~0.90
  textMeta:     string;   // ~0.88
  textLabel:    string;   // ~0.78
  textSecondary: string;  // ~0.75 (consolidated from 0.72 / 0.75)
  textTertiary: string;   // ~0.70
  activePillBg:   string;
  activePillText: string;  // text on the bright active pill — always dark
  segControlBg:   string;
  closeBtnBg:     string;
  chipBg:         string;
  chipBorder:     string;
  watermark:    string;
  cardScrim:    string[];
  coverText:    string;
  coverBadgeBg: string;
};

export type Theme = {
  /** 60 % — dominant hue family. */
  primary: PrimaryScale;
  /** 30 % — interactive / CTA color. */
  secondary: SecondaryTokens;
  /** Neutral surfaces, text, borders and semantic colors. */
  neutral: NeutralTokens;
  /** 10 % — plan-type accent colors. */
  accent: PlanColorTokens;
  glass: GlassTokens;
  /** Solid fills for 44 px destination thumbnails. */
  typeColors: Record<string, string>;
};

// ─── Shared glass defaults (on-cover compositing, same across themes) ─────────

const BASE_GLASS: GlassTokens = {
  modalBg:       'rgba(0,0,0,0.45)',
  buttonBg:      'rgba(255,255,255,0.30)',
  buttonBorder:  'rgba(255,255,255,0.40)',
  textPrimary:   'rgba(255,255,255,0.95)',
  textHigh:      'rgba(255,255,255,0.90)',
  textMeta:      'rgba(255,255,255,0.88)',
  textLabel:     'rgba(255,255,255,0.78)',
  textSecondary: 'rgba(255,255,255,0.75)',
  textTertiary:  'rgba(255,255,255,0.70)',
  activePillBg:   'rgba(255,255,255,0.22)',
  activePillText: 'rgba(0,0,0,0.87)',
  segControlBg:   'rgba(0,0,0,0.22)',
  closeBtnBg:    'rgba(0,0,0,0.35)',
  chipBg:        'rgba(255,255,255,0.92)',
  chipBorder:    'rgba(255,255,255,0.35)',
  watermark:     'rgba(0,0,0,0.08)',
  cardScrim:     ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.70)'],
  coverText:     'rgba(255,255,255,0.90)',
  coverBadgeBg:  'rgba(255,255,255,0.85)',
};

// ─── "Midnight" — deep Atlantic navy (default light theme) ────────────────────

export const midnightTheme: Theme = {
  primary: {
    '900': '#050E1F',  // almost-black navy — deepest cover tints
    '700': '#0B2150',  // dark navy — cover overlay, itinerary header
    '500': '#1A3D8A',  // mid navy
    '300': '#4D77C4',  // slate blue
    '100': '#C5D7F0',  // pale blue-gray
    '50':  '#EDF2FA',  // ghost — half-sheet gradient end
  },
  secondary: {
    base:    '#0f62fe',
    hover:   '#0353e9',
    subtle:  'rgba(15,98,254,0.10)',
    xSubtle: 'rgba(15,98,254,0.06)',
  },
  neutral: {
    bgBase:        '#f4f4f4',
    bgBase2:       '#ffffff',
    bgBase3:       '#e8e8e8',
    surface:       '#ffffff',
    surface2:      '#f4f4f4',
    textPrimary:   '#161616',
    textSecondary: '#525252',
    textTertiary:  '#8d8d8d',
    border:        '#e0e0e0',
    borderStrong:  '#c6c6c6',
    danger:        '#da1e28',
    dangerSubtle:  '#fff1f1',
    success:       '#198038',
    successSubtle: '#defbe6',
    warn:          '#f1c21b',
    warnSubtle:    'rgba(255,243,196,0.18)',
    shadow:        '#000000',
    tabBar:        'rgba(247,247,247,0.82)',
  },
  accent: {
    flight:  { base: '#0f62fe', tint: '#4589ff' },
    hotel:   { base: '#8a3ffc', tint: '#be95ff' },
    food:    { base: '#d2691e', tint: '#f1a266' },
    nature:  { base: '#198038', tint: '#42be65' },
    event:   { base: '#da1e28', tint: '#ff8389' },
    neutral: { base: '#525252', tint: '#8d8d8d' },
  },
  typeColors: {
    city:       '#0B2150',
    beach:      '#0E6699',
    island:     '#0A7B82',
    mountain:   '#1A1B52',
    nature:     '#124A26',
    historical: '#6B2D0A',
    other:      '#1A2D6B',
  },
  glass: BASE_GLASS,
};

// ─── "Cosmos" — deep indigo / violet (dark theme) ─────────────────────────────

const _cn: NeutralTokens = {
  bgBase:        '#0a0a0a',
  bgBase2:       '#161616',
  bgBase3:       '#1f1f1f',
  surface:       '#1c1c1e',
  surface2:      '#2c2c2e',
  textPrimary:   '#f4f4f4',
  textSecondary: '#c6c6c6',
  textTertiary:  '#8d8d8d',
  border:        '#2c2c2e',
  borderStrong:  '#3a3a3c',
  danger:        '#ff4d4f',
  dangerSubtle:  '#2a0a0b',
  success:       '#42be65',
  successSubtle: '#0a2015',
  warn:          '#f1c21b',
  warnSubtle:    'rgba(241,194,27,0.12)',
  shadow:        '#000000',
  tabBar:        'rgba(28,28,30,0.86)',
};

export const cosmosTheme: Theme = {
  primary: {
    '900': '#080514',  // near-black purple
    '700': '#160F38',  // deep indigo — cover overlay, itinerary header
    '500': '#2B1F6E',  // rich violet
    '300': '#5247A8',  // medium purple
    '100': '#2A2258',  // dark ghost — header gradient end (dark mode)
    '50':  '#1E1942',  // darkest ghost
  },
  secondary: {
    base:    '#4589ff',
    hover:   '#6ea0ff',
    subtle:  'rgba(69,137,255,0.15)',
    xSubtle: 'rgba(69,137,255,0.08)',
  },
  neutral: _cn,
  accent: {
    flight:  { base: '#4589ff', tint: '#74b3ff' },
    hotel:   { base: '#a855f7', tint: '#d8b4fe' },
    food:    { base: '#f97316', tint: '#fdba74' },
    nature:  { base: '#42be65', tint: '#86efac' },
    event:   { base: '#ff4d4f', tint: '#fca5a5' },
    neutral: { base: _cn.textSecondary, tint: _cn.textTertiary },
  },
  typeColors: {
    city:       '#160F38',
    beach:      '#0B4D7A',
    island:     '#0C5C62',
    mountain:   '#2B1F6E',
    nature:     '#0A3018',
    historical: '#4A1C06',
    other:      '#1A1040',
  },
  glass: {
    ...BASE_GLASS,
    modalBg:      'rgba(0,0,0,0.65)',
    buttonBg:     'rgba(255,255,255,0.22)',
    buttonBorder: 'rgba(255,255,255,0.38)',
    segControlBg: 'rgba(255,255,255,0.12)',  // light container on dark header
  },
};

// ─── "Lagoon" — tropical teal / cyan ─────────────────────────────────────────

const _ln: NeutralTokens = {
  bgBase:        '#F0FAFA',
  bgBase2:       '#ffffff',
  bgBase3:       '#DCF5F5',
  surface:       '#ffffff',
  surface2:      '#F0FAFA',
  textPrimary:   '#07252A',
  textSecondary: '#0E5A66',
  textTertiary:  '#5AAAB8',
  border:        '#A8E0E8',
  borderStrong:  '#6CC8D4',
  danger:        '#EF4444',
  dangerSubtle:  '#FEF2F2',
  success:       '#059669',
  successSubtle: '#ECFDF5',
  warn:          '#F59E0B',
  warnSubtle:    'rgba(245,158,11,0.12)',
  shadow:        '#072830',
  tabBar:        'rgba(240,250,250,0.88)',
};

export const lagoonTheme: Theme = {
  primary: {
    '900': '#042A2E',  // deepest teal
    '700': '#085E6B',  // dark teal — cover overlay, itinerary header
    '500': '#0E7490',  // mid teal
    '300': '#22BDD4',  // bright cyan
    '100': '#A5EEF7',  // pale cyan
    '50':  '#ECFCFF',  // ghost — half-sheet gradient end
  },
  secondary: {
    // warm coral — complementary contrast against cool primary
    base:    '#F97316',
    hover:   '#EA6A0A',
    subtle:  'rgba(249,115,22,0.10)',
    xSubtle: 'rgba(249,115,22,0.06)',
  },
  neutral: _ln,
  accent: {
    flight:  { base: '#0EA5E9', tint: '#38BDF8' },
    hotel:   { base: '#7C3AED', tint: '#C4B5FD' },
    food:    { base: '#D97706', tint: '#FCD34D' },
    nature:  { base: '#059669', tint: '#34D399' },
    event:   { base: '#E11D48', tint: '#FDA4AF' },
    neutral: { base: '#64748B', tint: '#94A3B8' },
  },
  typeColors: {
    city:       '#085E6B',
    beach:      '#0E7490',
    island:     '#0F766E',
    mountain:   '#042A2E',
    nature:     '#065F46',
    historical: '#92400E',
    other:      '#0369A1',
  },
  glass: BASE_GLASS,
};

// ─── Active theme ─────────────────────────────────────────────────────────────
// ← Change this one line to swap the entire color scheme:

export type ThemeName = 'midnight' | 'cosmos' | 'lagoon';

export const themes: Record<ThemeName, Theme> = {
  midnight: midnightTheme,
  cosmos:   cosmosTheme,
  lagoon:   lagoonTheme,
};

const ACTIVE_THEME: ThemeName = 'cosmos';
export const theme = themes[ACTIVE_THEME];

// ─── Re-exports ───────────────────────────────────────────────────────────────
// All existing `import {colors, planColors, glass, ...} from '../theme'` keep working.
// - colors.accent      → secondary.base
// - colors.accentHover → secondary.hover
// etc.

export const primary   = theme.primary;
export const secondary = theme.secondary;
export const glass     = theme.glass;
export const typeColors = theme.typeColors;

/** Flat colors object — backward-compatible shape for all existing component imports. */
export const colors = {
  ...theme.neutral,
  accent:      theme.secondary.base,
  accentHover: theme.secondary.hover,
  accentSubtle:  theme.secondary.subtle,
  accentXSubtle: theme.secondary.xSubtle,
};

/** Backward-compatible planColors — maps to theme.accent. */
export const planColors = theme.accent;

// ─── Non-color tokens (theme-independent) ─────────────────────────────────────

export const typography = {
  fontSans: 'IBM Plex Sans',
  fontMono: 'IBM Plex Mono',

  xs:        10,
  sm:        12,
  bodySmall: 13,
  base:      14,
  md:        15,
  lg:        16,
  xl:        18,
  '2xl':     22,
  '3xl':     28,
  '4xl':     32,

  light:    '300' as const,
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
} as const;

export const radii = {
  sm:   4,
  md:   8,
  lg:   10,
  xl:   12,
  card: 18,
  row:  14,
  chip: 999,
} as const;

export const spacing = {
  xs:    4,
  sm:    6,
  md:    8,
  lg:    12,
  xl:    16,
  '2xl': 24,
} as const;

// ─── Utility functions ────────────────────────────────────────────────────────

/** Lighter pastel of a hex — mix 55 % color + 45 % white. */
export function lightTint(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const m = (c: number) => Math.round(c * 0.55 + 255 * 0.45).toString(16).padStart(2, '0');
  return `#${m(r)}${m(g)}${m(b)}`;
}

/**
 * Deterministic primary-family tint for a trip, derived from its ID.
 * Cycles through three shades of the active primary scale so each trip
 * gets a subtly distinct but always on-brand cover overlay.
 */
export function tripTint(id: string): string {
  const shades = [theme.primary['900'], theme.primary['700'], theme.primary['500']] as const;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return shades[h % shades.length];
}
