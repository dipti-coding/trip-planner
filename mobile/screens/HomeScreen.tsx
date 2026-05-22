import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
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
import {BUILDINGS, COVER_SKY, BUILDING_COLOR} from '../assets/skyline';
import type {Trip} from '../types';
import {dayCount, fmtShort, tripStatus} from '../utils/dates';
import type {RootStackParamList} from '../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

type TripStatus = 'current' | 'future' | 'past';
type TripWithStatus = Trip & {status: TripStatus};

function CitySkyline() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BUILDINGS.map((b, i) => (
        <View
          key={i}
          style={[styles.building, {left: b.l, width: b.w, height: b.h}]}
        />
      ))}
      <View style={styles.towerLeft} />
      <View style={styles.towerRight} />
    </View>
  );
}

function StatusBadge({status}: {status: TripStatus}) {
  if (status === 'current') {
    return (
      <View style={styles.badgeCurrent}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeTextCurrent}>In progress</Text>
      </View>
    );
  }
  if (status === 'past') {
    return (
      <View style={styles.badgePast}>
        <Text style={styles.badgeTextPast}>Past</Text>
      </View>
    );
  }
  return null;
}

function TripCard({trip, onPress}: {trip: TripWithStatus; onPress: () => void}) {
  const days = dayCount(trip.start_date, trip.end_date);
  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cover}>
        <CitySkyline />
        <View style={[StyleSheet.absoluteFill, styles.coverScrim]} />
        <View style={styles.coverTop}>
          <View style={styles.coverTitleBlock}>
            <Text style={styles.coverDest} numberOfLines={1}>
              {trip.destination_city.toUpperCase()}
            </Text>
            <Text style={styles.coverTitle} numberOfLines={1}>
              {trip.name}
            </Text>
          </View>
          <StatusBadge status={trip.status} />
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.coverDateRange}>
            {fmtShort(trip.start_date)} – {fmtShort(trip.end_date)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.metaText}>📅 {days} days</Text>
        <Text style={styles.metaText}>📍 {trip.destination_city}</Text>
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

  const sections = useMemo(() => {
    const q = query.toLowerCase();
    const withStatus: TripWithStatus[] = trips.map(t => ({
      ...t,
      status: tripStatus(t.start_date, t.end_date),
    }));
    const filtered = q
      ? withStatus.filter(
          t =>
            t.name.toLowerCase().includes(q) ||
            t.destination_city.toLowerCase().includes(q),
        )
      : withStatus;
    const current = filtered.filter(t => t.status === 'current');
    const future = filtered.filter(t => t.status === 'future');
    const past = filtered.filter(t => t.status === 'past');
    return [
      ...(current.length ? [{label: 'Happening now', data: current}] : []),
      ...(future.length ? [{label: `Upcoming · ${future.length}`, data: future}] : []),
      ...(past.length ? [{label: 'Memories', data: past}] : []),
    ];
  }, [trips, query]);

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
        <Text style={styles.hintText}>Make sure the API is running: just up</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}
          </Text>
          <Text style={styles.headerTitle}>Trips</Text>
        </View>
        <View style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </View>
      </View>

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
        contentContainerStyle={styles.listContent}
        renderItem={({item: section}) => (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.data.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onPress={() =>
                  navigation.navigate('TripDetail', {tripId: trip.id, tripName: trip.name})
                }
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
  listContent: {paddingBottom: 40},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerLeft: {flex: 1},
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
  cover: {height: 140, backgroundColor: COVER_SKY, overflow: 'hidden'},
  coverScrim: {backgroundColor: 'rgba(0,0,0,0.25)'},
  coverTop: {
    position: 'absolute', top: 12, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1,
  },
  coverTitleBlock: {flex: 1, minWidth: 0},
  coverDest: {fontSize: 11, fontWeight: '500', letterSpacing: 0.4, color: 'rgba(255,255,255,0.9)'},
  coverTitle: {fontSize: 22, fontWeight: '600', color: '#fff', letterSpacing: -0.2, marginTop: 2},
  coverBottom: {position: 'absolute', bottom: 10, left: 14, right: 14, zIndex: 1},
  coverDateRange: {fontSize: 13, color: 'rgba(255,255,255,0.9)'},

  badgeCurrent: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: '#defbe6',
  },
  badgePast: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  badgeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#198038'},
  badgeTextCurrent: {fontSize: 12, fontWeight: '500', color: '#198038'},
  badgeTextPast: {fontSize: 12, fontWeight: '500', color: '#525252'},

  cardBottom: {flexDirection: 'row', gap: 12, padding: 12, paddingTop: 10},
  metaText: {fontSize: 13, color: '#525252'},

  building: {position: 'absolute', bottom: 0, backgroundColor: BUILDING_COLOR},
  towerLeft: {
    position: 'absolute', bottom: 0, left: 97,
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 80,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: BUILDING_COLOR,
  },
  towerRight: {
    position: 'absolute', bottom: 0, left: 170,
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 100,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: BUILDING_COLOR,
  },

  errorText: {fontSize: 15, color: '#da1e28', textAlign: 'center'},
  hintText: {fontSize: 13, color: '#8d8d8d', marginTop: 8, textAlign: 'center'},
  emptyText: {fontSize: 16, color: '#525252', fontWeight: '500'},
});
