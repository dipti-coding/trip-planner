import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from './Icon';
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';
import {getPlanLines} from '../utils/planLines';
import {colors, radii, spacing, typography} from '../theme';

type Props = {
  plan: Plan;
  onPress?: () => void;
};

export default function PlanCard({plan, onPress}: Props) {
  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur  = fmtDuration(plan.start_datetime, plan.end_datetime);
  const {heading, company, location} = getPlanLines(plan);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient
        colors={meta.bg}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.thumb}>
        <Icon name={meta.icon} size={24} color="#fff"/>
      </LinearGradient>

      <View style={styles.content}>
        {time ? (
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{time}</Text>
            {dur ? <Text style={styles.durText}>{' · ' + dur}</Text> : null}
          </View>
        ) : null}
        <Text style={styles.heading} numberOfLines={1}>{heading}</Text>
        {company   ? <Text style={styles.company}  numberOfLines={1}>{company}</Text>  : null}
        {location  ? <Text style={styles.location} numberOfLines={1}>{location}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  thumb: {
    width: 56, height: 56,
    borderRadius: radii.lg,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  content: {flex: 1, minWidth: 0},
  timeRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 3},
  timeText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: colors.textPrimary},
  durText:  {fontSize: typography.bodySmall, color: colors.textTertiary},
  heading:  {fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.1},
  company:  {fontSize: typography.sm, color: colors.textSecondary, marginTop: 2},
  location: {fontSize: typography.sm, color: colors.textTertiary, marginTop: 1},
});
