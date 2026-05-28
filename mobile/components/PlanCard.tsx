/**
 * PlanCard — redesigned as "PlanItem" from the shared UI spec.
 * Layout: 38×38 icon badge | time · dur (left) + cost (right) / title / subtitle
 */
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icon from './Icon';
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';
import {colors, radii, spacing, typography} from '../theme';

function planSubtitle(plan: Plan): string {
  const d = plan.details;
  if (!d) return '';
  switch (plan.type) {
    case 'Flight':
      return [d.departure_airport, d.arrival_airport].filter(Boolean).join(' → ') as string;
    case 'Hotel':
      return (d.room_type ?? d.confirmation ?? '') as string;
    case 'Restaurant':
      return [d.reservation_name, d.party_size ? `Party of ${d.party_size}` : null].filter(Boolean).join(' · ') as string;
    case 'RailwayRide':
      return [d.departure_station, d.arrival_station].filter(Boolean).join(' → ') as string;
    case 'CarReservation':
      return (d.pickup_location ?? '') as string;
    case 'Tour':
      return (d.operator ?? d.meeting_point ?? '') as string;
    case 'Activity':
      return (d.location ?? '') as string;
    default:
      return '';
  }
}

type Props = {
  plan: Plan;
  onPress?: () => void;
};

export default function PlanCard({plan, onPress}: Props) {
  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur  = fmtDuration(plan.start_datetime, plan.end_datetime);
  const sub  = planSubtitle(plan);
  const cost = typeof (plan.details as any)?.cost === 'number' ? (plan.details as any).cost as number : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.badge, {backgroundColor: meta.color}]}>
        <Icon name={meta.icon} size={18} color="#fff"/>
      </View>

      <View style={styles.content}>
        {(time || cost > 0) && (
          <View style={styles.topRow}>
            {time ? (
              <Text style={styles.timeText}>
                {time}
                {dur ? <Text style={styles.durText}>{'  ·  ' + dur}</Text> : null}
              </Text>
            ) : <View/>}
            {cost > 0 && <Text style={styles.costText}>${cost}</Text>}
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
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
  topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3},
  timeText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: colors.textSecondary},
  durText:  {fontSize: typography.bodySmall, fontWeight: typography.regular, color: colors.textTertiary},
  costText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: colors.textPrimary},
  title:    {fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.1},
  sub:      {fontSize: typography.sm, color: colors.textSecondary, marginTop: 1},
});
