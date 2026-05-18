import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import client from '../api/client';
import PlanCard from '../components/PlanCard';
import type {Plan, Trip} from '../types';
import {dateRange, fmtDow, fmtDayLabel, fmtDayNum, fmtShort} from '../utils/dates';
import type {RootStackParamList} from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
  route: RouteProp<RootStackParamList, 'TripDetail'>;
};

function DayPill({date, active, onPress}: {date: string; active: boolean; onPress: () => void}) {
  return (
    <TouchableOpacity
      style={[styles.dayPill, active && styles.dayPillActive]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.dayPillLabel, active && styles.dayPillLabelActive]}>
        {fmtDayLabel(date)}
      </Text>
      <Text style={[styles.dayPillNum, active && styles.dayPillNumActive]}>
        {fmtDayNum(date)}
      </Text>
    </TouchableOpacity>
  );
}

function DayView({date, plans}: {date: string; plans: Plan[]}) {
  return (
    <View style={styles.dayView}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderDate}>{fmtDow(date)}</Text>
        <Text style={styles.dayHeaderCount}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.planList}>
        {plans.map(p => <PlanCard key={p.id} plan={p} />)}
        {plans.length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>Nothing planned yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TripDetailScreen({navigation, route}: Props) {
  const {tripId} = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const stripRef = useRef<ScrollView>(null);

  useEffect(() => {
    Promise.all([
      client.get<Trip>(`/trips/${tripId}`),
      client.get<Plan[]>(`/trips/${tripId}/plans`),
    ])
      .then(([tripRes, plansRes]) => {
        setTrip(tripRes.data);
        setPlans(plansRes.data);
        const dates = dateRange(tripRes.data.start_date, tripRes.data.end_date);
        const firstWithPlans = plansRes.data[0]
          ? dates.findIndex(d => d === plansRes.data[0].start_datetime?.slice(0, 10))
          : 0;
        setDayIdx(Math.max(0, firstWithPlans));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tripId]);

  const days = useMemo(
    () => (trip ? dateRange(trip.start_date, trip.end_date) : []),
    [trip?.start_date, trip?.end_date],
  );

  const activeDate = days[dayIdx] ?? days[0];

  const dayPlans = useMemo(
    () => plans.filter(p => p.start_datetime?.slice(0, 10) === activeDate),
    [plans, activeDate],
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const top = e.nativeEvent.contentOffset.y;
    if (!scrolled && top > 56) setScrolled(true);
    else if (scrolled && top < 20) setScrolled(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </SafeAreaView>
    );
  }

  if (error || !trip) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'Trip not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.glassBtnText}>‹</Text>
            </TouchableOpacity>
            {scrolled && (
              <Text style={styles.navTitle} numberOfLines={1}>
                {trip.name}
              </Text>
            )}
            <View style={styles.glassBtnWide}>
              <Text style={styles.glassBtnWideText}>📄 PDF</Text>
            </View>
          </View>

          {!scrolled && (
            <View style={styles.titleBlock}>
              <Text style={styles.destLabel}>{trip.destination_city.toUpperCase()}</Text>
              <Text style={styles.tripTitle} numberOfLines={1}>{trip.name}</Text>
              <Text style={styles.tripMeta}>
                {fmtShort(trip.start_date)} – {fmtShort(trip.end_date)}
              </Text>
            </View>
          )}

          <ScrollView
            ref={stripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayStrip}
            style={styles.dayStripScroll}>
            {days.map((date, i) => (
              <DayPill
                key={date}
                date={date}
                active={i === dayIdx}
                onPress={() => setDayIdx(i)}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}>
        <DayView date={activeDate} plans={dayPlans} />
      </ScrollView>

      <View style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </View>
    </View>
  );
}

const HEADER_BG = '#1a6fad';

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f4f4'},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},

  header: {
    backgroundColor: HEADER_BG,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
  },
  glassBtn: {
    width: 38, height: 38, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  glassBtnText: {fontSize: 24, color: '#fff', lineHeight: 32, marginTop: -2},
  navTitle: {
    flex: 1, fontSize: 15, fontWeight: '600', color: '#fff',
    textAlign: 'center', letterSpacing: -0.1,
  },
  glassBtnWide: {
    height: 38, borderRadius: 999, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  glassBtnWideText: {fontSize: 13, color: '#fff', fontWeight: '600'},

  titleBlock: {paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8},
  destLabel: {
    fontSize: 10, fontWeight: '500', letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase',
  },
  tripTitle: {fontSize: 24, fontWeight: '600', color: '#fff', letterSpacing: -0.3, marginTop: 3},
  tripMeta: {fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 4},

  dayStripScroll: {flexShrink: 0},
  dayStrip: {flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, paddingTop: 2, gap: 8},
  dayPill: {
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', minWidth: 52,
  },
  dayPillActive: {backgroundColor: '#fff'},
  dayPillLabel: {
    fontSize: 10, fontWeight: '500', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  dayPillLabelActive: {color: HEADER_BG},
  dayPillNum: {fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.95)', marginTop: 2},
  dayPillNumActive: {color: HEADER_BG},

  scroll: {flex: 1},
  scrollContent: {paddingBottom: 100},

  dayView: {padding: 16},
  dayHeader: {paddingHorizontal: 4, marginBottom: 12},
  dayHeaderDate: {fontSize: 13, color: '#525252'},
  dayHeaderCount: {fontSize: 18, fontWeight: '600', color: '#161616', letterSpacing: -0.05, marginTop: 2},
  planList: {gap: 8},
  emptyDay: {
    backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 1, borderColor: '#e0e0e0',
    padding: 24, alignItems: 'center',
  },
  emptyDayText: {fontSize: 14, color: '#8d8d8d'},

  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#0f62fe',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0f62fe',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: {fontSize: 28, color: '#fff', fontWeight: '300', lineHeight: 36},

  errorText: {fontSize: 15, color: '#da1e28', textAlign: 'center'},
  backLink: {fontSize: 15, color: '#0f62fe', marginTop: 12},
});
