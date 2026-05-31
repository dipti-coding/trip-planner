import React, {useMemo} from 'react';
import {SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from '../components/Icon';
import {useTheme} from '../context/ThemeContext';
import {themes, type ThemeName} from '../theme';
import {radii, spacing, typography} from '../theme';

const THEME_OPTIONS: {name: ThemeName; label: string; description: string}[] = [
  {name: 'midnight', label: 'Midnight',  description: 'Deep Atlantic navy'},
  {name: 'cosmos',   label: 'Cosmos',    description: 'Deep indigo · dark mode'},
  {name: 'lagoon',   label: 'Lagoon',    description: 'Tropical teal & coral'},
];

function ThemeSwatch({name}: {name: ThemeName}) {
  const t = themes[name];
  const swatches = [
    t.primary['700'],
    t.secondary.base,
    t.accent.flight.base,
    t.accent.nature.base,
  ];
  return (
    <View style={swatchStyles.row}>
      {swatches.map((color, i) => (
        <View key={i} style={[swatchStyles.dot, {backgroundColor: color}]} />
      ))}
    </View>
  );
}

const swatchStyles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 4},
  dot: {width: 12, height: 12, borderRadius: 6},
});

export default function AccountScreen() {
  const {theme, colors, glass, themeName, setThemeName} = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container:    {flex: 1, backgroundColor: colors.bgBase},
    header:       {paddingHorizontal: 20, paddingTop: spacing.xl, paddingBottom: spacing.md},
    headerTitle:  {fontSize: typography['3xl'], fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.3},
    sectionLabel: {
      fontSize: typography.xs + 1, fontWeight: typography.medium,
      letterSpacing: 0.4, textTransform: 'uppercase',
      color: colors.textTertiary,
      paddingHorizontal: 20, paddingVertical: spacing.md,
    },
    card: {
      marginHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden',
    },
    optionRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.xl, paddingVertical: spacing.xl,
      gap: spacing.lg,
    },
    optionRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    },
    optionActive: {
      backgroundColor: colors.accentXSubtle,
    },
    primaryDot: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    optionText:    {flex: 1},
    optionLabel:   {fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary},
    optionDesc:    {fontSize: typography.bodySmall, color: colors.textSecondary, marginTop: 2},
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <Text style={styles.sectionLabel}>Appearance</Text>
      <View style={styles.card}>
        {THEME_OPTIONS.map(({name, label, description}, i) => {
          const t = themes[name];
          const active = themeName === name;
          return (
            <TouchableOpacity
              key={name}
              style={[styles.optionRow, i > 0 && styles.optionRowBorder, active && styles.optionActive]}
              onPress={() => setThemeName(name)}
              activeOpacity={0.7}>
              <View style={[styles.primaryDot, {backgroundColor: t.primary['700']}]}>
                <Icon name="globe" size={16} color={glass.textPrimary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{label}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4}}>
                  <Text style={styles.optionDesc}>{description}</Text>
                  <ThemeSwatch name={name} />
                </View>
              </View>
              {active && <Icon name="check" size={18} color={colors.accent} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
