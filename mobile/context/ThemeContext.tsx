import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {makePlanTypeMeta, makeDefaultMeta} from '../assets/planTypes';
import SplashScreen from '../components/SplashScreen';
import {
  lightTint,
  themes,
  type GlassTokens,
  type NeutralTokens,
  type PlanColorTokens,
  type PrimaryScale,
  type SecondaryTokens,
  type Theme,
  type ThemeName,
} from '../theme';

const STORAGE_KEY = '@planmytrip/theme';

// ─── Derived colors shape (backward-compatible with existing components) ──────

export type ThemeColors = NeutralTokens & {
  accent:      string;
  accentHover: string;
  accentSubtle:  string;
  accentXSubtle: string;
};

// ─── Context value ────────────────────────────────────────────────────────────

export type ThemeContextValue = {
  theme:        Theme;
  themeName:    ThemeName;
  setThemeName: (name: ThemeName) => void;
  // Pre-computed, stable-reference token groups (change only on theme switch)
  colors:       ThemeColors;
  primary:      PrimaryScale;
  secondary:    SecondaryTokens;
  glass:        GlassTokens;
  planColors:   PlanColorTokens;
  typeMeta:     ReturnType<typeof makePlanTypeMeta>;
  defaultMeta:  ReturnType<typeof makeDefaultMeta>;
  typeColors:   Record<string, string>;
  tripTint:     (id: string) => string;
  lightTint:    typeof lightTint;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({children}: {children: React.ReactNode}) {
  const [themeName, setThemeNameState] = useState<ThemeName>('midnight');
  const [ready, setReady] = useState(false);

  // Load persisted theme once on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (stored && stored in themes) setThemeNameState(stored as ThemeName);
      })
      .finally(() => setReady(true));
  }, []);

  const setThemeName = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
  }, []);

  const value = useMemo((): ThemeContextValue => {
    const t = themes[themeName];
    const colors: ThemeColors = {
      ...t.neutral,
      accent:       t.secondary.base,
      accentHover:  t.secondary.hover,
      accentSubtle:  t.secondary.subtle,
      accentXSubtle: t.secondary.xSubtle,
    };
    return {
      theme: t,
      themeName,
      setThemeName,
      colors,
      primary:     t.primary,
      secondary:   t.secondary,
      glass:       t.glass,
      planColors:  t.accent,
      typeMeta:    makePlanTypeMeta(t.accent),
      defaultMeta: makeDefaultMeta(t.accent),
      typeColors:  t.typeColors,
      tripTint(id: string): string {
        const shades = [t.primary['900'], t.primary['700'], t.primary['500']] as const;
        let h = 0;
        for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
        return shades[h % shades.length];
      },
      lightTint,
    };
  }, [themeName, setThemeName]);

  if (!ready) return <SplashScreen />;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
