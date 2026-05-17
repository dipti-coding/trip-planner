import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
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
};

export default function PlanCard({plan, onPress}: Props) {
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  row: {flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12},
  thumb: {
    width: 56, height: 56, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  thumbIcon: {fontSize: 24},
  content: {flex: 1, minWidth: 0},
  timeText: {fontSize: 13, fontWeight: '600', color: '#161616', marginBottom: 3},
  durText: {fontSize: 13, fontWeight: '400', color: '#525252'},
  title: {fontSize: 15, fontWeight: '600', color: '#161616', letterSpacing: -0.1},
  subtitle: {fontSize: 12, color: '#525252', marginTop: 1},
});
