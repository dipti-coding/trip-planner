import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import client from '../api/client';
import type {Trip} from '../types';
import type {RootStackParamList} from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

function fmtDate(iso: string, short = true): string {
  const d = new Date(iso + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (short) return `${months[d.getMonth()]} ${d.getDate()}`;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function dayCount(start: string, end: string): number {
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

function tripStatus(start: string, end: string): 'current' | 'future' | 'past' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (today >= s && today <= e) return 'current';
  if (today < s) return 'future';
  return 'past';
}

// Simple city skyline using SVG-like shapes via React Native Views
function CitySkyline() {
  const buildings = [
    {l: 0, w: 40, h: 48}, {l: 40, w: 22, h: 62}, {l: 62, w: 32, h: 54},
    {l: 118, w: 26, h: 66}, {l: 144, w: 20, h: 56},
    {l: 196, w: 34, h: 58}, {l: 232, w: 18, h: 48},
    {l: 250, w: 38, h: 70}, {l: 288, w: 24, h: 54},
    {l: 312, w: 30, h: 62}, {l: 342, w: 18, h: 48},
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {buildings.map((b, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            left: b.l,
            width: b.w,
            height: b.h,
            backgroundColor: 'rgba(20,18,30,0.55)',
          }}
        />
      ))}
      {/* Tower */}
      <View style={{position:'absolute', bottom: 0, left: 97, width: 0, height: 0,
        borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 80,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: 'rgba(20,18,30,0.55)'}}/>
      <View style={{position:'absolute', bottom: 0, left: 170, width: 0, height: 0,
        borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 100,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: 'rgba(20,18,30,0.55)'}}/>
    </View>
  );
}

function StatusBadge({status}: {status: 'current' | 'future' | 'past'}) {
  if (status === 'current') {
    return (
      <View style={[styles.badge, {backgroundColor: '#defbe6'}]}>
        <View style={styles.badgeDot} />
        <Text style={[styles.badgeText, {color: '#198038'}]}>In progress</Text>
      </View>
    );
  }
  if (status === 'past') {
    return (
      <View style={[styles.badge, {backgroundColor: 'rgba(255,255,255,0.85)'}]}>
        <Text style={[styles.badgeText, {color: '#525252'}]}>Past</Text>
      </View>
    );
  }
  return null;
}

function TripCard({trip, onPress}: {trip: Trip; onPress: () => void}) {
  const status = tripStatus(trip.start_date, trip.end_date);
  const days = dayCount(trip.start_date, trip.end_date);

  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress} activeOpacity={0.85}>
      {/* Cover */}
      <View style={styles.cover}>
        <CitySkyline />
        <View style={[StyleSheet.absoluteFill, styles.coverScrim]} />
        <View style={styles.coverTop}>
          <View style={{flex: 1, minWidth: 0}}>
            <Text style={styles.coverDest} numberOfLines={1}>
              {trip.destination_city.toUpperCase()}
            </Text>
            <Text style={styles.coverTitle} numberOfLines={1}>
              {trip.name}
            </Text>
          </View>
          <StatusBadge status={status} />
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.coverDateRange}>
            {fmtDate(trip.start_date)} – {fmtDate(trip.end_date)}
          </Text>
        </View>
      </View>
      {/* Bottom row */}
      <View style={styles.cardBottom}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>📅 {days} days</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>📍 {trip.destination_city}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({navigation}: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    client.get<Trip[]>('/trips')
      .then(r => setTrips(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = trips.filter(t =>
    !query ||
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.destination_city.toLowerCase().includes(query.toLowerCase()),
  );

  const current = filtered.filter(t => tripStatus(t.start_date, t.end_date) === 'current');
  const future  = filtered.filter(t => tripStatus(t.start_date, t.end_date) === 'future');
  const past    = filtered.filter(t => tripStatus(t.start_date, t.end_date) === 'past');

  const sections: {label: string; data: Trip[]}[] = [];
  if (current.length) sections.push({label: 'Happening now', data: current});
  if (future.length)  sections.push({label: `Upcoming · ${future.length}`, data: future});
  if (past.length)    sections.push({label: 'Memories', data: past});

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#0f62fe" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.hintText}>Make sure the API is running: just dev</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{flex: 1}}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
          </Text>
          <Text style={styles.headerTitle}>Trips</Text>
        </View>
        <View style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search trips, places…"
          placeholderTextColor="#8d8d8d"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={sections}
        keyExtractor={s => s.label}
        contentContainerStyle={{paddingBottom: 40}}
        renderItem={({item: section}) => (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.data.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() => navigation.navigate('TripDetail', {tripId: trip.id, tripName: trip.name})}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No trips found</Text>
            <Text style={styles.hintText}>Run: just seed</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f4f4'},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerDate: {fontSize: 13, color: '#525252'},
  headerTitle: {fontSize: 28, fontWeight: '700', color: '#161616', letterSpacing: -0.32, marginTop: 2},
  addBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#0f62fe',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: {fontSize: 22, color: '#fff', fontWeight: '300', lineHeight: 28},
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#e8e8e8', borderRadius: 12,
    marginHorizontal: 20, marginBottom: 20,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchIcon: {fontSize: 16},
  searchInput: {flex: 1, fontSize: 15, color: '#161616'},
  section: {paddingHorizontal: 20, marginBottom: 24},
  sectionLabel: {
    fontSize: 11, fontWeight: '500', letterSpacing: 0.32,
    textTransform: 'uppercase', color: '#8d8d8d',
    paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4,
  },
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  cover: {
    height: 140,
    backgroundColor: '#2a1f3d',
    overflow: 'hidden',
    position: 'relative',
  },
  coverScrim: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  coverTop: {
    position: 'absolute',
    top: 12, left: 14, right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  coverDest: {
    fontSize: 11, fontWeight: '500', letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.9)',
  },
  coverTitle: {
    fontSize: 22, fontWeight: '600', color: '#fff',
    letterSpacing: -0.2, marginTop: 2,
  },
  coverBottom: {
    position: 'absolute',
    bottom: 10, left: 14, right: 14,
    zIndex: 1,
  },
  coverDateRange: {
    fontSize: 13, color: 'rgba(255,255,255,0.9)',
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#198038',
  },
  badgeText: {fontSize: 12, fontWeight: '500'},
  cardBottom: {
    flexDirection: 'row', gap: 12,
    padding: 12, paddingTop: 10,
  },
  metaPill: {flexDirection: 'row', alignItems: 'center'},
  metaText: {fontSize: 13, color: '#525252'},
  errorText: {fontSize: 15, color: '#da1e28', textAlign: 'center'},
  hintText: {fontSize: 13, color: '#8d8d8d', marginTop: 8, textAlign: 'center'},
  emptyText: {fontSize: 16, color: '#525252', fontWeight: '500'},
});
