import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '../components/Icon';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import {themes, type ThemeName} from '../theme';
import {radii, spacing, typography} from '../theme';
import client from '../api/client';

type UserProfile = {
  email: string | null;
  home_city: string | null;
  activity_preferences: string[];
};

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
  const {signOut} = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    client.get<UserProfile>('/users/me')
      .then(res => setProfile(res.data))
      .catch(() => {/* non-critical — screen still usable without profile */});
  }, []);

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign out', style: 'destructive', onPress: signOut},
    ]);
  }

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
    profileCard: {
      marginHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      borderWidth: 1, borderColor: colors.border,
      padding: spacing.xl,
      gap: spacing.lg,
    },
    profileRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    },
    profileIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.accentXSubtle,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    profileLabel:      {fontSize: typography.xs + 1, color: colors.textTertiary, fontWeight: typography.medium, marginBottom: 2},
    profileValue:      {fontSize: typography.base, color: colors.textPrimary, fontWeight: typography.semibold},
    profileValueEmpty: {fontSize: typography.base, color: colors.textTertiary},
    chipsRow:          {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs},
    chip: {
      paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
      backgroundColor: colors.accentXSubtle,
      borderRadius: radii.chip,
      borderWidth: 1, borderColor: colors.accentSubtle,
    },
    chipText:    {fontSize: typography.bodySmall, color: colors.accent, fontWeight: typography.medium},
    divider:     {height: StyleSheet.hairlineWidth, backgroundColor: colors.border},
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
    optionText:   {flex: 1},
    optionLabel:  {fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary},
    optionDesc:   {fontSize: typography.bodySmall, color: colors.textSecondary, marginTop: 2},
    settingValue: {fontSize: typography.bodySmall, color: colors.textTertiary},
    logoutButton: {
      marginHorizontal: 20, marginTop: spacing.xl,
      paddingVertical: spacing.lg,
      borderRadius: radii.card,
      borderWidth: 1, borderColor: '#000',
      alignItems: 'center',
    },
    logoutText: {fontSize: typography.base, fontWeight: typography.semibold, color: '#000'},
  }), [theme]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* ── Profile ──────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileIcon}>
              <Icon name="map-pin" size={16} color={colors.accent} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.profileLabel}>Home City</Text>
              {profile?.home_city
                ? <Text style={styles.profileValue}>{profile.home_city}</Text>
                : <Text style={styles.profileValueEmpty}>Not set</Text>}
            </View>
          </View>

          <View style={styles.divider} />

          <View>
            <View style={styles.profileRow}>
              <View style={styles.profileIcon}>
                <Icon name="zap" size={16} color={colors.accent} />
              </View>
              <Text style={styles.profileLabel}>Activity Preferences</Text>
            </View>
            {profile && profile.activity_preferences.length > 0
              ? (
                <View style={styles.chipsRow}>
                  {profile.activity_preferences.map(pref => (
                    <View key={pref} style={styles.chip}>
                      <Text style={styles.chipText}>{pref}</Text>
                    </View>
                  ))}
                </View>
              )
              : <Text style={[styles.profileValueEmpty, {marginTop: spacing.xs}]}>None selected</Text>}
          </View>
        </View>

        {/* ── Preferences ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.optionRow}>
            <View style={[styles.primaryDot, {backgroundColor: colors.accentXSubtle}]}>
              <Icon name="thermometer" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.optionText, styles.optionLabel]}>Temperature</Text>
            <Text style={styles.settingValue}>°C</Text>
          </View>

          <View style={[styles.optionRow, styles.optionRowBorder]}>
            <View style={[styles.primaryDot, {backgroundColor: colors.accentXSubtle}]}>
              <Icon name="wallet" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.optionText, styles.optionLabel]}>Home Currency</Text>
            <Text style={styles.settingValue}>USD</Text>
          </View>

          <View style={[styles.optionRow, styles.optionRowBorder]}>
            <View style={[styles.primaryDot, {backgroundColor: colors.accentXSubtle}]}>
              <Icon name="clock" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.optionText, styles.optionLabel]}>Time Format</Text>
            <Text style={styles.settingValue}>12h</Text>
          </View>
        </View>

        {/* ── Appearance ───────────────────────────────────── */}
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

        {/* ── About ────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => Linking.openURL('https://planmytrip.app/privacy')}
            activeOpacity={0.7}>
            <View style={[styles.primaryDot, {backgroundColor: colors.accentXSubtle}]}>
              <Icon name="shield" size={16} color={colors.accent} />
            </View>
            <Text style={[styles.optionText, styles.optionLabel]}>Privacy Policy</Text>
            <Icon name="chev-right" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        <View style={{height: spacing.xl}} />
      </ScrollView>
    </SafeAreaView>
  );
}
