import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
import Icon from '../components/Icon';
import {CitySilhouette} from '../components/CityCovers';
import type {Trip} from '../types';
import {dayCount, fmtShort, tripStatus} from '../utils/dates';
import type {RootStackParamList} from '../App';
import {colors, coverGradient, radii, spacing, typography} from '../theme';
import {
  findDestination,
  getDestinationImage,
  searchDestinations,
} from '../utils/destinations';
import type {Destination} from '../utils/destinations';

type Props = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<{Trips: undefined; Documents: undefined; Account: undefined}, 'Trips'>,
    NativeStackNavigationProp<RootStackParamList>
  >;
};

type TripStatus = 'current' | 'future' | 'past';
type TripWithStatus = Trip & {status: TripStatus};


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
  const scrim: string[] = ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)'];
  const dest = findDestination(trip.destination_city);
  const photo = getDestinationImage(dest);
  return (
    <TouchableOpacity style={styles.tripCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cover}>
        {photo ? (
          <Image source={photo} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <>
            <LinearGradient colors={coverGradient(trip.destination_city)} style={StyleSheet.absoluteFill} />
            <CitySilhouette city={trip.destination_city} />
          </>
        )}
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
        <View style={styles.metaItem}><Icon name="calendar" size={13} color={colors.textSecondary}/><Text style={styles.metaText}>{days} days</Text></View>
        <View style={styles.metaItem}><Icon name="map-pin" size={13} color={colors.textSecondary}/><Text style={styles.metaText}>0 plans</Text></View>
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

type SelectedDest = {city: string; country: string; dest: Destination | null};

function StepIndicator({total, current}: {total: number; current: number}) {
  return (
    <View style={styles.stepRow}>
      {Array.from({length: total}).map((_, i) => (
        <View key={i} style={[styles.stepBar, i <= current && styles.stepBarActive]} />
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

  const defaultName = dests.length > 0 ? `${dests[0].city}` : 'My trip';

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await client.post<Trip>('/trips', {
        user_id: '96a84b90-d7d7-4f6a-8691-d084deda8991',
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

  const searchResults = useMemo(
    () => searchDestinations(destSearch, 20),
    [destSearch],
  );

  const stepIndex = step === 'destination' ? 0 : step === 'dates' ? 1 : 2;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.wizardOverlay} onPress={handleClose}>
        <Pressable style={styles.wizardSheet} onPress={() => {}}>
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          {/* Nav bar */}
          <View style={styles.wizardNav}>
            {step === 'destination' ? (
              <TouchableOpacity onPress={handleClose} style={styles.wizardCloseBtn}>
                <Icon name="x" size={14} color={colors.textPrimary} stroke={2.5}/>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setStep(step === 'confirm' ? 'dates' : 'destination')}
                style={styles.wizardNavBackBtn}>
                <Icon name="chev-left" size={18} color={colors.textPrimary} stroke={2}/>
                <Text style={styles.wizardNavBackBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <StepIndicator total={3} current={stepIndex} />
            <View style={styles.wizardNavSpacer} />
          </View>

          {/* Step content */}
          {step === 'destination' && (
            <KeyboardAvoidingView
              style={{flex: 1}}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={styles.wizardScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <Text style={styles.wizardTitle}>Where to?</Text>
                <Text style={styles.wizardSub}>Add one or more destinations.</Text>

                {/* Selected chips */}
                {dests.length > 0 && (
                  <View style={styles.destChips}>
                    {dests.map((d, i) => {
                      const chipPhoto = getDestinationImage(d.dest);
                      return (
                        <View key={d.city} style={styles.destChip}>
                          {chipPhoto ? (
                            <Image source={chipPhoto} style={styles.destChipThumb} resizeMode="cover" />
                          ) : (
                            <LinearGradient
                              colors={coverGradient(d.city)}
                              style={styles.destChipThumb}
                            />
                          )}
                          <Text style={styles.destChipText}>
                            Stop {i + 1} · {d.city}
                          </Text>
                          <TouchableOpacity onPress={() => toggleDest(d)} style={styles.destChipRemoveBtn}>
                            <Icon name="x" size={14} color={colors.textTertiary} stroke={2}/>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                <View style={styles.destSearchWrap}>
                  <Icon name="search" size={16} color={colors.textTertiary}/>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={dests.length > 0 ? 'Add another stop' : 'City, country or region'}
                    placeholderTextColor={colors.textTertiary}
                    value={destSearch}
                    onChangeText={setDestSearch}
                  />
                </View>

                <Text style={styles.sectionLabel}>
                  {destSearch.trim() ? 'RESULTS' : 'TOP DESTINATIONS'}
                </Text>
                {searchResults.map(item => {
                  const selected = dests.some(d => d.city === item.name);
                  const rowPhoto = getDestinationImage(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.destRow}
                      onPress={() =>
                        toggleDest({city: item.name, country: item.country, dest: item})
                      }
                      activeOpacity={0.7}>
                      {rowPhoto ? (
                        <Image source={rowPhoto} style={styles.destThumb} resizeMode="cover" />
                      ) : (
                        <LinearGradient
                          colors={coverGradient(item.name)}
                          style={styles.destThumb}
                        />
                      )}
                      <View style={styles.destInfo}>
                        <Text style={styles.destCity}>{item.name}</Text>
                        <Text style={styles.destCountry}>{item.country}</Text>
                      </View>
                      {selected ? (
                        <Icon name="check" size={18} color={colors.success}/>
                      ) : (
                        <Icon name="plus" size={18} color={colors.accent}/>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {destSearch.trim().length > 0 && (
                  <TouchableOpacity
                    style={styles.destRow}
                    onPress={() =>
                      toggleDest({city: destSearch.trim(), country: '', dest: null})
                    }
                    activeOpacity={0.7}>
                    <View style={[styles.destThumb, styles.destThumbCustom]} />
                    <View style={styles.destInfo}>
                      <Text style={styles.destCity}>Use "{destSearch.trim()}"</Text>
                      <Text style={styles.destCountry}>Custom location</Text>
                    </View>
                    <Icon name="plus" size={18} color={colors.accent}/>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <View style={styles.wizardFooter}>
                <TouchableOpacity
                  style={[styles.primaryBtn, dests.length === 0 && styles.primaryBtnDisabled]}
                  onPress={() => setStep('dates')}
                  disabled={dests.length === 0}>
                  <Text style={styles.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {step === 'dates' && (
            <View style={{flex: 1}}>
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={styles.wizardScrollContent}
                showsVerticalScrollIndicator={false}>
                <Text style={styles.wizardTitle}>When?</Text>
                <Text style={styles.wizardSub}>Tap a start date, then an end date.</Text>
                <CalendarPicker onRange={(s, e) => { setStartDate(s); setEndDate(e); }} />
              </ScrollView>
              <View style={styles.wizardFooter}>
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
            </View>
          )}

          {step === 'confirm' && (
            <View style={{flex: 1}}>
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={styles.wizardScrollContent}
                showsVerticalScrollIndicator={false}>
                <Text style={styles.wizardTitle}>Looks good?</Text>
                <Text style={styles.wizardSub}>We'll create an empty trip. You can add plans next.</Text>
                <View style={styles.confirmCard}>
                  <Text style={styles.confirmLabel}>DESTINATIONS</Text>
                  {dests.map((d, i) => (
                    <Text key={d.city} style={styles.confirmValue}>
                      {i + 1}.{'  '}
                      <Text style={styles.confirmValueBold}>{d.city}</Text>
                      {d.country ? `  ${d.country}` : ''}
                    </Text>
                  ))}
                  <View style={styles.confirmDivider} />
                  <Text style={styles.confirmLabel}>DATES</Text>
                  <Text style={styles.confirmValue}>
                    {startDate && endDate
                      ? `${fmtShort(startDate)} – ${fmtShort(endDate)} · ${dayCount(startDate, endDate)} days`
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
              </ScrollView>
              <View style={styles.wizardFooter}>
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
            </View>
          )}
        </Pressable>
      </Pressable>
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

  useEffect(() => {
    return navigation.addListener('focus', () => {
      client.get<Trip[]>('/trips')
        .then(r => setTrips(r.data))
        .catch(() => {});
    });
  }, [navigation]);

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
        <Icon name="search" size={16} color={colors.textTertiary}/>
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
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
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
    backgroundColor: colors.bgBase,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    flex: 1,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  wizardNav: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  wizardCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.bgBase3,
    alignItems: 'center', justifyContent: 'center',
  },
  wizardNavBtn: {minWidth: 56},
  wizardNavBtnText: {fontSize: typography.base, fontWeight: typography.medium, color: colors.accent},
  wizardNavBackBtn: {flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 56},
  wizardNavBackBtnText: {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
  wizardNavSpacer: {minWidth: 56},
  stepRow: {flex: 1, flexDirection: 'row', gap: 4, marginHorizontal: spacing.lg},
  stepBar: {flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.bgBase3},
  stepBarActive: {backgroundColor: colors.accent},

  wizardScrollContent: {paddingHorizontal: spacing.xl, paddingBottom: spacing.xl},
  wizardFooter: {
    paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing['2xl'],
    backgroundColor: colors.bgBase,
  },
  wizardTitle: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
    marginTop: spacing.md,
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
    backgroundColor: colors.surface, borderRadius: radii.row,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  destChipThumb: {width: 28, height: 28, borderRadius: radii.md},
  destChipText: {flex: 1, fontSize: typography.base, color: colors.textPrimary},
  destChipRemoveBtn: {padding: spacing.xs},
  destSearchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radii.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg, paddingVertical: 10, gap: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  destRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.row,
    borderWidth: 1, borderColor: colors.borderStrong,
    marginBottom: spacing.sm,
  },
  destThumb: {width: 44, height: 44, borderRadius: radii.lg},
  destThumbCustom: {backgroundColor: colors.bgBase3},
  destInfo: {flex: 1},
  destCity: {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
  destCountry: {fontSize: typography.bodySmall, color: colors.textSecondary},
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
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
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
  confirmValueBold: {fontWeight: typography.semibold, color: colors.textPrimary},
  confirmDivider: {height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm},
  fieldLabel: {fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm},
  nameInput: {
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: spacing.md,
    fontSize: typography.base, color: colors.textPrimary,
    marginBottom: spacing.xl,
  },

  // Shared buttons
  primaryBtn: {
    backgroundColor: colors.accent, borderRadius: radii.xl,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md,
  },
  primaryBtnDisabled: {opacity: 0.4},
  primaryBtnText: {fontSize: typography.md, fontWeight: typography.semibold, color: colors.surface},
});
