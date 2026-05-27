import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';
import {colors, radii, spacing, typography} from '../theme';

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
  // Optional rich display props (populated when backend provides them)
  thumbnail?: string;
  address?: string;
  rating?: number;
  cost?: number;
  tempF?: number;
};

export default function PlanCard({plan, onPress, onDelete, thumbnail, address, rating, cost, tempF}: Props) {
  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur = fmtDuration(plan.start_datetime, plan.end_datetime);
  const subtitle = planSubtitle(plan);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        {/* Thumbnail or type icon */}
        {thumbnail ? (
          <Image source={{uri: thumbnail}} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, {backgroundColor: meta.color}]}>
            <Text style={styles.thumbIcon}>{meta.icon}</Text>
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.timeText}>
              {time}
              {dur ? <Text style={styles.durText}>{'  ·  ' + dur}</Text> : null}
            </Text>
            {tempF != null && (
              <View style={styles.tempChip}>
                <Text style={styles.tempText}>{Math.round(tempF)}°</Text>
              </View>
            )}
          </View>
          <Text style={styles.title} numberOfLines={1}>{plan.title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
          {address ? (
            <Text style={styles.address} numberOfLines={1}>{address}</Text>
          ) : null}
          {(rating != null || cost != null) && (
            <View style={styles.metaRow}>
              {rating != null && (
                <Text style={styles.metaItem}>⭐ {rating.toFixed(1)}</Text>
              )}
              {cost != null && (
                <Text style={styles.metaItem}>${cost}</Text>
              )}
            </View>
          )}
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
    overflow: 'hidden',
  },
  thumbIcon: {fontSize: typography.xl},
  content: {flex: 1, minWidth: 0},
  topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  timeText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: 3},
  durText: {fontSize: typography.bodySmall, fontWeight: typography.regular, color: colors.textSecondary},
  title: {fontSize: typography.md, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.1},
  subtitle: {fontSize: typography.sm, color: colors.textSecondary, marginTop: 1},
  address: {fontSize: typography.sm, color: colors.textTertiary, marginTop: 2},
  metaRow: {flexDirection: 'row', gap: spacing.md, marginTop: 3},
  metaItem: {fontSize: typography.xs + 1, color: colors.textSecondary},
  tempChip: {
    backgroundColor: 'rgba(255,140,0,0.12)',
    borderRadius: radii.chip,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tempText: {fontSize: typography.xs + 1, color: '#E07B39', fontWeight: typography.semibold},
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.dangerSubtle,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  deleteBtnText: {fontSize: typography.xl, color: colors.danger, fontWeight: typography.regular},
});
