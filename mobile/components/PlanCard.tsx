import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import type {Plan} from '../types';

type PlanTypeMeta = {
  colors: [string, string];
  icon: string;
  label: string;
};

const TYPE_META: Record<string, PlanTypeMeta> = {
  Flight:        {colors: ['#4589ff', '#0f62fe'], icon: '✈', label: 'Flight'},
  Hotel:         {colors: ['#be95ff', '#8a3ffc'], icon: '🏨', label: 'Stay'},
  Restaurant:    {colors: ['#f1a266', '#d2691e'], icon: '🍴', label: 'Food'},
  Activity:      {colors: ['#42be65', '#198038'], icon: '📍', label: 'Activity'},
  Tour:          {colors: ['#42be65', '#198038'], icon: '🗺', label: 'Tour'},
  LocalEvent:    {colors: ['#42be65', '#198038'], icon: '🎪', label: 'Event'},
  CarReservation:{colors: ['#4589ff', '#0f62fe'], icon: '🚗', label: 'Car'},
  RailwayRide:   {colors: ['#4589ff', '#0f62fe'], icon: '🚅', label: 'Train'},
  BusRide:       {colors: ['#8d8d8d', '#525252'], icon: '🚌', label: 'Bus'},
  Ferry:         {colors: ['#4589ff', '#0f62fe'], icon: '⛴', label: 'Ferry'},
  Cruise:        {colors: ['#4589ff', '#0f62fe'], icon: '🚢', label: 'Cruise'},
  MapDestination:{colors: ['#8d8d8d', '#525252'], icon: '📍', label: 'Place'},
  Meeting:       {colors: ['#8d8d8d', '#525252'], icon: '🤝', label: 'Meeting'},
};

const DEFAULT_META: PlanTypeMeta = {
  colors: ['#8d8d8d', '#525252'],
  icon: '⭐',
  label: 'Plan',
};

function fmtTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false});
}

function fmtDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function planSubtitle(plan: Plan): string {
  const d = plan.details;
  if (!d) return '';
  switch (plan.type) {
    case 'Flight':
      return [d.airline, d.flight_number].filter(Boolean).join(' · ') as string;
    case 'Hotel':
      return d.room_type as string || d.confirmation as string || '';
    case 'Restaurant':
      return d.reservation_name as string || '';
    case 'RailwayRide':
      return [d.departure_station, d.arrival_station].filter(Boolean).join(' → ') as string;
    case 'CarReservation':
      return d.pickup_location as string || '';
    case 'Tour':
      return d.operator_name as string || '';
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
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={[styles.thumb, {backgroundColor: meta.colors[1]}]}>
          <Text style={styles.thumbIcon}>{meta.icon}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <Text style={styles.timeText}>
              {time}
              {dur ? (
                <Text style={styles.durText}>{'  ·  ' + dur}</Text>
              ) : null}
            </Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {plan.title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#161616',
  },
  durText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#525252',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#161616',
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 12,
    color: '#525252',
    marginTop: 1,
  },
});
