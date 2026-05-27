import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {colors, radii, spacing, typography} from '../theme';
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';

function planSubtitle(plan: Plan): string {
  const d = plan.details;
  if (!d) return '';
  switch (plan.type) {
    case 'Flight':
      return [d.airline, d.flight_number].filter(Boolean).join(' · ') as string;
    case 'Hotel':
      return (d.room_type ?? d.confirmation ?? '') as string;
    case 'Restaurant':
      return (d.reservation_name ?? '') as string;
    case 'RailwayRide':
      return [d.departure_station, d.arrival_station].filter(Boolean).join(' → ') as string;
    case 'CarReservation':
      return (d.pickup_location ?? '') as string;
    case 'Tour':
      return (d.operator_name ?? '') as string;
    default:
      return '';
  }
}

type Props = {
  plan: Plan;
  onPress?: () => void;
  onDelete?: () => void;
};

export default function PlanCard({plan, onPress, onDelete}: Props) {
  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur = fmtDuration(plan.start_datetime, plan.end_datetime);
  const subtitle = planSubtitle(plan);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={[styles.thumb, {backgroundColor: meta.color}]}>
          <Text style={styles.thumbIcon}>{meta.icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.timeText}>
            {time}
            {dur ? <Text style={styles.durText}>{'  ·  ' + dur}</Text> : null}
          </Text>
          <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        {onDelete && (
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
            <Text style={styles.deleteBtnText}>−</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.lg},
  thumb: {
    width: 56, height: 56, borderRadius: radii.lg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  thumbIcon: {fontSize: typography.xl},
  content: {flex: 1, minWidth: 0},
  timeText: {fontSize: typography.sm + 1, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: 3},
  durText: {fontSize: typography.sm + 1, fontWeight: typography.regular, color: colors.textSecondary},
  title: {fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.1},
  subtitle: {fontSize: typography.sm, color: colors.textSecondary, marginTop: 1},
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.dangerSubtle,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deleteBtnText: {fontSize: typography.xl, color: colors.danger, fontWeight: typography.regular},
});
