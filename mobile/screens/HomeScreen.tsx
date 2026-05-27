import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import client from '../api/client';
import type {Trip} from '../types';
import {dayCount, fmtShort, tripStatus} from '../utils/dates';
import type {RootStackParamList} from '../App';
import {colors, coverGradient, radii, spacing, typography} from '../theme';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<{Trips: undefined; Documents: undefined; Account: undefined}, 'Trips'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

type TripStatus = 'current' | 'future' | 'past';
type TripWithStatus = Trip & {status: TripStatus};

// Popular destinations shown in the Add Trip wizard
const POPULAR_DESTINATIONS = [
  {city: 'Lisbon', country: 'Portugal'},
  {city: 'Kyoto', country: 'Japan'},
  {city: 'Barcelona', country: 'Spain'},
  {city: 'Cinque Terre', country: 'Italy'},
  {city: 'Porto', country: 'Portugal'},
  {city: 'Amalfi Coast', country: 'Italy'},
  {city: 'Oaxaca', country: 'Mexico'},
  {city: 'Copenhagen', country: 'Denmark'},
];

function daysSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function StatusBadge({trip}: {trip: TripWithStatus}) {
  if (trip.status === 'current') {
    const day = daysSince(trip.start_date) + 1;
    return (
      <View style={styles.badgeCurrent}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeTextCurrent}>In progress · Day {day}</Text>
      </View>
    );
  }
  if (trip.status === 'future') {
    const daysAway = Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000);
    return (
      <View style={styles.badgeFuture}>
        <Text style={styles.badgeTextFuture}>In {daysAway} days</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgePast}>
      <Text style={styles.badgeTextPast}>Past</Text>
    </View>
  );
}

function TripCard({trip, onPress}: {trip: TripWithStatus; onPress: () => void}) {
  const days = dayCount(trip.start_date, trip.end_date);
  const gradient = coverGradient(trip.destination_city);
  const scrim: string[] = ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)'];
  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cover}>
        <LinearGradient colors={gradient} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={scrim} locations={[0, 0.4, 0.6, 1]} style={StyleSheet.absoluteFill} />
        <View style={styles.coverTop}>
          <View style={styles.coverTitleBlock}>
            <Text style={styles.coverDest} numberOfLines={1}>
              {trip.destination_city.toUpperCase()}
            </Text>
            <Text style={styles.coverTitle} numberOfLines={1}>
              {trip.name}
            </Text>
          </View>
          <StatusBadge trip={trip} />
        </View>
        <View style={styles.coverBottom}>
          <Text style={styles.coverDateRange}>
            {fmtShort(trip.start_date)} – {fmtShort(trip.end_date)}
          </Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.metaText}>🗓 {days} days</Text>
        <Text style={styles.metaText}>📍 0 plans</Text>
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, {width: '0%'}]} />
          </View>
          <Text style={styles.progressLabel}>0% planned</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Add Trip Wizard ─────────────────────────────────────────────────────────

type AddTripStep = 'destination' | 'dates' | 'confirm';

type SelectedDest = {city: string; country: string};

function StepIndicator({total, current}: {total: number; current: number}) {
  return (
    <View style={styles.stepRow}>
      {Array.from({length: total}).map((_, i) => (
        <View key={i} style={[styles.stepDot, i <= current && styles.stepDotActive]} />
      ))}
    </View>
  );
}

// Minimal calendar for date range picking
function CalendarPicker({
  onRange,
}: {
  onRange: (start: string | null, end: string | null) => void;
}) {
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Render two months
  const months = [0, 1].map(offset => {
    const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return d;
  });

  function toKey(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  function handleDay(key: string) {
    if (!start || (start && end)) {
      setStart(key);
      setEnd(null);
      onRange(key, null);
    } else {
      if (key < start) {
        setStart(key);
        setEnd(null);
        onRange(key, null);
      } else {
        setEnd(key);
        onRange(start, key);
      }
    }
  }

  function renderMonth(base: Date) {
    const year = base.getFullYear();
    const month = base.getMonth();
    const label = base.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toKey(new Date(year, month, d)));
    }
    // pad to full weeks
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return (
      <View key={label} style={styles.calMonth}>
        <Text style={styles.calMonthLabel}>{label}</Text>
        <View style={styles.calDowRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => (
            <Text key={i} style={styles.calDow}>{d}</Text>
          ))}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.calWeek}>
            {week.map((key, di) => {
              if (!key) return <View key={di} style={styles.calCell} />;
              const isPast = key < toKey(today);
              const isStart = key === start;
              const isEnd = key === end;
              const isEdge = isStart || isEnd;
              const inRange = start && end && key > start && key < end;
              return (
                <TouchableOpacity
                  key={di}
                  style={[
                    styles.calCell,
                    inRange && styles.calCellInRange,
                    isEdge && styles.calCellEdge,
                  ]}
                  onPress={() => !isPast && handleDay(key)}
                  disabled={isPast}
                  activeOpacity={0.7}>
                  <Text style={[
                    styles.calDayText,
                    isPast && styles.calDayPast,
                    isEdge && styles.calDayEdge,
                  ]}>
                    {parseInt(key.slice(8), 10)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  return <ScrollView>{months.map(renderMonth)}</ScrollView>;
}

function AddTripWizard({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}) {
  const [step, setStep] = useState<AddTripStep>('destination');
  const [dests, setDests] = useState<SelectedDest[]>([]);
  const [destSearch, setDestSearch] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [tripName, setTripName] = useState('');
  const [creating, setCreating] = useState(false);

  function reset() {
    setStep('destination');
    setDests([]);
    setDestSearch('');
    setStartDate(null);
    setEndDate(null);
    setTripName('');
    setCreating(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function toggleDest(dest: SelectedDest) {
    setDests(prev => {
      const exists = prev.some(d => d.city === dest.city);
      return exists ? prev.filter(d => d.city !== dest.city) : [...prev, dest];
    });
  }

  const defaultName = dests.length > 0 ? `${dests[0].city} trip` : 'My trip';

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await client.post<Trip>('/trips', {
        name: tripName.trim() || defaultName,
        destination_city: dests.map(d => d.city).join(', '),
        start_date: startDate ?? new Date().toISOString().slice(0, 10),
        end_date: endDate ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      });
      reset();
      onCreated(res.data);
    } catch {
      Alert.alert('Error', 'Could not create trip. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  const filteredDests = POPULAR_DESTINATIONS.filter(
    d =>
      !destSearch ||
      d.city.toLowerCase().includes(destSearch.toLowerCase()) ||
      d.country.toLowerCase().includes(destSearch.toLowerCase()),
  );

  const stepIndex = step === 'destination' ? 0 : step === 'dates' ? 1 : 2;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.wizardOverlay}>
        <View style={styles.wizardSheet}>
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          {/* Nav bar */}
          <View style={styles.wizardNav}>
            {step === 'destination' ? (
              <TouchableOpacity onPress={handleClose} style={styles.wizardNavBtn}>
                <Text style={styles.wizardNavBtnText}>✕</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setStep(step === 'confirm' ? 'dates' : 'destination')}
                style={styles.wizardNavBtn}>
                <Text style={styles.wizardNavBtnText}>‹ Back</Text>
              </TouchableOpacity>
            )}
            <StepIndicator total={3} current={stepIndex} />
            <View style={styles.wizardNavBtn} />
          </View>

          {/* Step content */}
          {step === 'destination' && (
            <KeyboardAvoidingView
              style={styles.wizardContent}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <Text style={styles.wizardTitle}>Where to?</Text>
              <Text style={styles.wizardSub}>Add one or more destinations.</Text>

              {/* Selected chips */}
              {dests.length > 0 && (
                <View style={styles.destChips}>
                  {dests.map((d, i) => (
                    <View key={d.city} style={styles.destChip}>
                      <LinearGradient
                        colors={coverGradient(d.city)}
                        style={styles.destChipThumb}
                      />
                      <Text style={styles.destChipText}>
                        Stop {i + 1} · {d.city}
                      </Text>
                      <TouchableOpacity onPress={() => toggleDest(d)}>
                        <Text style={styles.destChipRemove}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.searchWrap}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={dests.length > 0 ? 'Add another stop' : 'City, country or region'}
                  placeholderTextColor={colors.textTertiary}
                  value={destSearch}
                  onChangeText={setDestSearch}
                />
              </View>

              <Text style={styles.sectionLabel}>POPULAR THIS SEASON</Text>
              <FlatList
                data={filteredDests}
                keyExtractor={d => d.city}
                style={styles.destList}
                renderItem={({item}) => {
                  const selected = dests.some(d => d.city === item.city);
                  return (
                    <TouchableOpacity
                      style={styles.destRow}
                      onPress={() => toggleDest(item)}
                      activeOpacity={0.7}>
                      <LinearGradient
                        colors={coverGradient(item.city)}
                        style={styles.destThumb}
                      />
                      <View style={styles.destInfo}>
                        <Text style={styles.destCity}>{item.city}</Text>
                        <Text style={styles.destCountry}>{item.country}</Text>
                      </View>
                      <Text style={[styles.destAdd, selected && styles.destAdded]}>
                        {selected ? '✓' : '+'}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, dests.length === 0 && styles.primaryBtnDisabled]}
                onPress={() => setStep('dates')}
                disabled={dests.length === 0}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}

          {step === 'dates' && (
            <View style={styles.wizardContent}>
              <Text style={styles.wizardTitle}>When?</Text>
              <Text style={styles.wizardSub}>Tap a start date, then an end date.</Text>
              <CalendarPicker onRange={(s, e) => { setStartDate(s); setEndDate(e); }} />
              <TouchableOpacity
                style={[styles.primaryBtn, (!startDate || !endDate) && styles.primaryBtnDisabled]}
                onPress={() => setStep('confirm')}
                disabled={!startDate || !endDate}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('confirm')} style={styles.skipBtn}>
                <Text style={styles.skipBtnText}>Skip dates</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'confirm' && (
            <View style={styles.wizardContent}>
              <Text style={styles.wizardTitle}>Looks good?</Text>
              <Text style={styles.wizardSub}>We'll create an empty trip. You can add plans next.</Text>
              <View style={styles.confirmCard}>
                <Text style={styles.confirmLabel}>DESTINATIONS</Text>
                {dests.map((d, i) => (
                  <Text key={d.city} style={styles.confirmValue}>
                    {i + 1}. {d.city}, {d.country}
                  </Text>
                ))}
                <View style={styles.confirmDivider} />
                <Text style={styles.confirmLabel}>DATES</Text>
                <Text style={styles.confirmValue}>
                  {startDate && endDate
                    ? `${fmtShort(startDate)} – ${fmtShort(endDate)}`
                    : 'No dates yet — add them later'}
                </Text>
              </View>
              <Text style={styles.fieldLabel}>Trip name (optional)</Text>
              <TextInput
                style={styles.nameInput}
                placeholder={defaultName}
                placeholderTextColor={colors.textTertiary}
                value={tripName}
                onChangeText={setTripName}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, creating && styles.primaryBtnDisabled]}
                onPress={handleCreate}
                disabled={creating}>
                {creating ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryBtnText}>Create trip</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen({navigation}: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [addingTrip, setAddingTrip] = useState(false);

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
      ...(current.length ? [{label: 'HAPPENING NOW', data: current}] : []),
      ...(future.length ? [{label: `UPCOMING · ${future.length}`, data: future}] : []),
      ...(past.length ? [{label: 'MEMORIES', data: past}] : []),
    ];
  }, [trips, query]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
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
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddingTrip(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search trips, places, plans"
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={sections}
        keyExtractor={s => s.label}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
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
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.hintText}>Tap + to plan your first trip</Text>
          </View>
        }
      />

      <AddTripWizard
        visible={addingTrip}
        onClose={() => setAddingTrip(false)}
        onCreated={trip => {
          setTrips(prev => [trip, ...prev]);
          setAddingTrip(false);
          navigation.navigate('TripDetail', {tripId: trip.id, tripName: trip.name});
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bgBase},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl']},
  listContent: {paddingBottom: 40},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerLeft: {flex: 1},
  headerDate: {fontSize: typography.bodySmall, color: colors.textSecondary},
  headerTitle: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.32,
    marginTop: 2,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: radii.xl,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: {fontSize: typography['2xl'], color: colors.surface, fontWeight: typography.light, lineHeight: 28},

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgBase3, borderRadius: radii.xl,
    marginHorizontal: 20, marginBottom: 20,
    paddingHorizontal: spacing.lg, paddingVertical: 10, gap: spacing.md,
  },
  searchIcon: {fontSize: typography.lg},
  searchInput: {flex: 1, fontSize: typography.md, color: colors.textPrimary},

  section: {paddingHorizontal: 20, marginBottom: spacing['2xl']},
  sectionLabel: {
    fontSize: typography.xs + 1,
    fontWeight: typography.medium,
    letterSpacing: 0.32,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },

  // Trip card
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  cover: {height: 140, overflow: 'hidden'},
  coverTop: {
    position: 'absolute', top: 12, left: 14, right: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1,
  },
  coverTitleBlock: {flex: 1, minWidth: 0},
  coverDest: {
    fontSize: typography.xs + 1,
    fontWeight: typography.medium,
    letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.9)',
  },
  coverTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.surface,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  coverBottom: {position: 'absolute', bottom: 10, left: 14, right: 14, zIndex: 1},
  coverDateRange: {fontSize: typography.bodySmall, color: 'rgba(255,255,255,0.9)'},

  // Badges
  badgeCurrent: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.successSubtle,
  },
  badgeFuture: {
    borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  badgePast: {
    borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  badgeDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success},
  badgeTextCurrent: {fontSize: typography.sm, fontWeight: typography.medium, color: colors.success},
  badgeTextFuture: {fontSize: typography.sm, fontWeight: typography.medium, color: colors.textSecondary},
  badgeTextPast: {fontSize: typography.sm, fontWeight: typography.medium, color: colors.textSecondary},

  // Card bottom
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 10,
    gap: spacing.lg,
  },
  metaText: {fontSize: typography.bodySmall, color: colors.textSecondary},
  progressWrap: {marginLeft: 'auto', alignItems: 'flex-end', gap: 3},
  progressTrack: {
    width: 80, height: 3, borderRadius: radii.sm,
    backgroundColor: colors.bgBase3, overflow: 'hidden',
  },
  progressBar: {height: 3, backgroundColor: colors.accent, borderRadius: radii.sm},
  progressLabel: {fontSize: typography.xs, color: colors.textTertiary},

  // Error / empty
  errorText: {fontSize: typography.md, color: colors.danger, textAlign: 'center'},
  hintText: {fontSize: typography.bodySmall, color: colors.textTertiary, marginTop: spacing.md, textAlign: 'center'},
  emptyText: {fontSize: typography.lg, color: colors.textSecondary, fontWeight: typography.medium},

  // ── Add Trip Wizard ─────────────────────────────────────────────────────────
  wizardOverlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)'},
  wizardSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  wizardNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  wizardNavBtn: {minWidth: 56},
  wizardNavBtnText: {fontSize: typography.md, color: colors.accent},
  stepRow: {flexDirection: 'row', gap: 6, alignItems: 'center'},
  stepDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border},
  stepDotActive: {width: 24, height: 6, borderRadius: 3, backgroundColor: colors.accent},

  wizardContent: {paddingHorizontal: spacing.xl, paddingBottom: 40},
  wizardTitle: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  wizardSub: {
    fontSize: typography.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // Destination step
  destChips: {marginBottom: spacing.lg, gap: spacing.sm},
  destChip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bgBase, borderRadius: radii.row,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  destChipThumb: {width: 28, height: 28, borderRadius: radii.md},
  destChipText: {flex: 1, fontSize: typography.base, color: colors.textPrimary},
  destChipRemove: {fontSize: typography.xl, color: colors.textTertiary, paddingHorizontal: 4},
  destList: {maxHeight: 280, marginBottom: spacing.xl},
  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  destThumb: {width: 44, height: 44, borderRadius: radii.lg},
  destInfo: {flex: 1},
  destCity: {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
  destCountry: {fontSize: typography.bodySmall, color: colors.textSecondary},
  destAdd: {fontSize: typography.xl, color: colors.accent, fontWeight: typography.light, width: 24, textAlign: 'center'},
  destAdded: {color: colors.success},

  // Dates step
  calMonth: {marginBottom: spacing.xl},
  calMonthLabel: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  calDowRow: {flexDirection: 'row', marginBottom: spacing.sm},
  calDow: {flex: 1, textAlign: 'center', fontSize: typography.bodySmall, color: colors.textTertiary},
  calWeek: {flexDirection: 'row', marginBottom: 2},
  calCell: {flex: 1, height: 36, alignItems: 'center', justifyContent: 'center'},
  calCellInRange: {backgroundColor: 'rgba(15,98,254,0.1)'},
  calCellEdge: {backgroundColor: colors.accent, borderRadius: radii.chip},
  calDayText: {fontSize: typography.base, color: colors.textPrimary},
  calDayPast: {color: colors.textTertiary},
  calDayEdge: {color: colors.surface, fontWeight: typography.semibold},
  skipBtn: {alignItems: 'center', paddingVertical: spacing.md},
  skipBtnText: {fontSize: typography.base, color: colors.textSecondary},

  // Confirm step
  confirmCard: {
    backgroundColor: colors.bgBase,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  confirmLabel: {
    fontSize: typography.xs + 1,
    fontWeight: typography.medium,
    letterSpacing: 0.32,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginBottom: 2,
  },
  confirmValue: {fontSize: typography.base, color: colors.textPrimary},
  confirmDivider: {height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm},
  fieldLabel: {fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm},
  nameInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl,
    padding: spacing.lg, fontSize: typography.base, color: colors.textPrimary,
    backgroundColor: colors.bgBase, marginBottom: spacing.xl,
  },

  // Shared buttons
  primaryBtn: {
    backgroundColor: colors.accent, borderRadius: radii.xl,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md,
  },
  primaryBtnDisabled: {opacity: 0.4},
  primaryBtnText: {fontSize: typography.md, fontWeight: typography.semibold, color: colors.surface},
});
