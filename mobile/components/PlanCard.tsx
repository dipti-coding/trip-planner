import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from './Icon';
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';
import {colors, radii, spacing, typography} from '../theme';

type Props = {
  plan: Plan;
  onPress?: () => void;
};

export default function PlanCard({plan, onPress}: Props) {
  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur  = fmtDuration(plan.start_datetime, plan.end_datetime);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.badge, {backgroundColor: meta.color}]}>
        <Icon name={meta.icon} size={18} color="#fff"/>
      </View>

      <View style={styles.content}>
        {time && (
          <Text style={styles.timeText}>
            {time}
            {dur ? <Text style={styles.durText}>{'  ·  ' + dur}</Text> : null}
          </Text>
        )}
        <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
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
  badge: {
    width: 38, height: 38,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  content: {flex: 1, minWidth: 0},
  timeText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: colors.textSecondary, marginBottom: 3},
  durText:  {fontSize: typography.bodySmall, fontWeight: typography.regular, color: colors.textTertiary},
  title:    {fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.1},
});
