import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  NativeModules,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const {OCRModule, BookingParserModule} = NativeModules;
import DateTimePicker from '@react-native-community/datetimepicker';
import {DestinationCover} from '../components/DestinationCovers';
import {findDestination} from '../utils/destinations';
import {launchImageLibrary} from 'react-native-image-picker';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import client from '../api/client';
import Icon from '../components/Icon';
import PlanCard from '../components/PlanCard';
import PlanDetailSheet from '../components/PlanDetailSheet';
import {PlaneSpinner} from '../components/Spinner';
import type {Plan, Trip} from '../types';
import {dateRange, fmtDow, fmtDayLabel, fmtDayNum, fmtShort, fmtTime, fmtTime24} from '../utils/dates';
import type {RootStackParamList} from '../App';
import {colors, tripTint, lightTint, radii, spacing, typography} from '../theme';
import {TYPE_META} from '../assets/planTypes';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
  route: RouteProp<RootStackParamList, 'TripDetail'>;
};

type ViewMode = 'plans' | 'itinerary';
type AddStep = null | 'picker' | 'screenshot' | 'manual';

const ALL_PLAN_TYPES = Object.keys(TYPE_META);

const DETECT_TYPES = [
  {icon: 'plane',   label: 'Flight',   sub: 'Flight numbers, IATA codes, gate'},
  {icon: 'hotel',   label: 'Stay',     sub: 'Check-in / out, room type'},
  {icon: 'map-pin', label: 'Activity', sub: 'Reservation, tickets, time slot'},
  {icon: 'fork',    label: 'Food',     sub: 'Restaurant, party size, OpenTable'},
];

/** Format a JS Date as a local-time ISO string (no UTC conversion). */
function toLocalISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function DayPill({date, active, onPress, weatherIcon, tempF}: {
  date: string;
  active: boolean;
  onPress: () => void;
  weatherIcon?: string;
  tempF?: number;
}) {
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
      {tempF != null && (
        <Text style={[styles.dayPillWx, active && styles.dayPillWxActive]}>
          {weatherIcon ?? '☀'} {Math.round(tempF)}°
        </Text>
      )}
    </TouchableOpacity>
  );
}

function DayHeader({date, plans}: {date: string; plans: Plan[]}) {
  const totalCost = plans.reduce((sum, p) => {
    const c = (p.details as any)?.cost;
    return sum + (typeof c === 'number' ? c : 0);
  }, 0);
  return (
    <View style={styles.dayHeader}>
      <Text style={styles.dayHeaderDate}>{fmtDow(date)}</Text>
      <Text style={styles.dayHeaderCount}>
        {plans.length} plan{plans.length !== 1 ? 's' : ''}
        {totalCost > 0 ? ` · $${totalCost}` : ''}
      </Text>
    </View>
  );
}

function DayView({date, plans, onSelectPlan}: {
  date: string;
  plans: Plan[];
  onSelectPlan: (plan: Plan) => void;
}) {
  return (
    <View style={styles.dayView}>
      <DayHeader date={date} plans={plans} />
      <View style={styles.planList}>
        {plans.map(p => (
          <PlanCard
            key={p.id}
            plan={p}
            onPress={() => onSelectPlan(p)}
          />
        ))}
        {plans.length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>Nothing planned yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}


function ItineraryView({trip, plans, days}: {
  trip: Trip;
  plans: Plan[];
  days: string[];
}) {
  const tint = tripTint(trip.id);
  const undated = plans.filter(p => !p.start_datetime);
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.itinContent}>
      {undated.length > 0 && (
        <View style={styles.itinDayCard}>
          <View style={styles.itinUnscheduledHeader}>
            <Text style={styles.itinDayNum}>UNSCHEDULED</Text>
            <Text style={styles.itinDayDate}>{undated.length} plan{undated.length !== 1 ? 's' : ''}</Text>
          </View>
          {undated.map(p => (
            <View key={p.id} style={styles.itinPlanRow}>
              <Text style={styles.itinTime}>—</Text>
              <Text style={styles.itinTitle} numberOfLines={1}>{p.title}</Text>
            </View>
          ))}
        </View>
      )}
      {days.map((date, i) => {
        const dp = plans.filter(p => p.start_datetime?.slice(0, 10) === date);
        const cost = dp.reduce((s, p) => s + (((p.details as any)?.cost ?? 0) as number), 0);
        return (
          <View key={date} style={styles.itinDayCard}>
            <View style={styles.itinDayHeader}>
              <View style={[StyleSheet.absoluteFill, {backgroundColor: lightTint(tint)}]} />
              <Text style={styles.itinDayNum}>
                DAY {i + 1} · {fmtDayLabel(date).toUpperCase()}
              </Text>
              <Text style={styles.itinDayDate}>{fmtShort(date)}</Text>
            </View>
            {dp.length === 0 ? (
              <Text style={styles.itinEmpty}>Nothing planned</Text>
            ) : (
              dp.map(p => (
                <View key={p.id} style={styles.itinPlanRow}>
                  <Text style={styles.itinTime}>{fmtTime24(p.start_datetime)}</Text>
                  <Text style={styles.itinTitle} numberOfLines={1}>{p.title}</Text>
                </View>
              ))
            )}
            <View style={styles.itinFooter}>
              <Text style={styles.itinFooterText}>
                {dp.length} plan{dp.length !== 1 ? 's' : ''}
              </Text>
              {cost > 0 && <Text style={styles.itinFooterCost}>${cost}</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Add Plan inline overlay ─────────────────────────────────────────────────

function AddPlanOverlay({
  tripId,
  trip,
  defaultDate,
  onClose,
  onAdded,
}: {
  tripId: string;
  trip: Trip;
  defaultDate: string;
  onClose: () => void;
  onAdded: (plans: Plan[]) => void;
}) {
  const insets = useSafeAreaInsets();
  const [addStep, setAddStep] = useState<Exclude<AddStep, null>>('picker');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [screenshotAvailable, setScreenshotAvailable] = useState(false);

  useEffect(() => {
    BookingParserModule?.isAvailable().then(setScreenshotAvailable).catch(() => {});
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [manualType, setManualType] = useState<string>('Flight');
  const [manualTitle, setManualTitle] = useState('');
  // Default to noon on the active day
  const [manualDate, setManualDate] = useState<Date>(() => {
    const d = new Date(defaultDate + 'T12:00:00');
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const minDate = new Date(trip.start_date + 'T00:00:00');
  const maxDate = new Date(trip.end_date + 'T23:59:59');

  const canSave = addStep === 'manual' && manualTitle.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await client.post(`/trips/${tripId}/plans`, {
        type: manualType,
        title: manualTitle.trim(),
        start_datetime: toLocalISO(manualDate),
      });
      const res = await client.get<Plan[]>(`/trips/${tripId}/plans`);
      onAdded(res.data);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not save plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDetect() {
    if (!imageBase64) return;
    setSubmitting(true);
    setParseError(null);
    try {
      const text: string = await OCRModule.recognizeText(imageBase64);
      if (!text.trim()) {
        setParseError('No text found in the screenshot. Try a clearer image.');
        return;
      }
      const parsed = await BookingParserModule.parseBookingText(text);
      await client.post(`/trips/${tripId}/plans/from-parsed`, parsed);
      const res = await client.get<Plan[]>(`/trips/${tripId}/plans`);
      onAdded(res.data);
      onClose();
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (typeof detail === 'string') {
        setParseError(detail);
      } else if (e.message) {
        setParseError(e.message);
      } else {
        setParseError('Could not detect plan type. Try a clearer screenshot of the booking confirmation.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function pickScreenshot() {
    launchImageLibrary({mediaType: 'photo', quality: 1, includeBase64: true}, response => {
      if (response.errorCode === 'permission') {
        Alert.alert(
          'Photo Access Required',
          'Go to Settings > TripPlanner > Photos and select "All Photos".',
          [{text: 'Cancel', style: 'cancel'}, {text: 'Open Settings', onPress: () => Linking.openSettings()}],
        );
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri && asset?.base64) {
        setImageUri(asset.uri);
        setImageBase64(asset.base64);
        setAddStep('screenshot');
      }
    });
  }

  return (
    <View style={styles.addOverlay}>
      {/* Nav bar — padded below status bar / dynamic island */}
      <View style={[styles.addNavBar, {paddingTop: insets.top + spacing.sm}]}>
        {addStep === 'picker' ? (
          <TouchableOpacity onPress={onClose} style={styles.addNavBtn}>
            <Text style={styles.addNavCancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setAddStep('picker')} style={styles.addNavBackBtn}>
            <Icon name="chev-left" size={18} color={colors.textPrimary} stroke={2}/>
            <Text style={styles.addNavBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.addNavTitle}>
          {addStep === 'picker' ? 'New plan' : addStep === 'screenshot' ? 'Upload Booking Screenshot' : 'Enter Booking Details'}
        </Text>
        <TouchableOpacity
          style={styles.addNavBtn}
          onPress={handleSave}
          disabled={!canSave}>
          {submitting
            ? <ActivityIndicator size="small" color={colors.accent}/>
            : <Text style={[styles.addNavSaveText, !canSave && styles.addNavSaveDisabled]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {addStep === 'picker' && (
          <View style={styles.addPickerContent}>
            <Text style={styles.addPickerSub}>How would you like to add this plan?</Text>

            {screenshotAvailable && (
              <TouchableOpacity style={styles.choiceCard} onPress={pickScreenshot} activeOpacity={0.8}>
                <View style={[styles.choiceIcon, {backgroundColor: colors.accent}]}>
                  <Icon name="doc" size={22} color={colors.surface}/>
                </View>
                <View style={styles.choiceText}>
                  <Text style={styles.choiceTitle}>Upload Booking Screenshot</Text>
                  <Text style={styles.choiceSub}>Drop a booking screenshot. We extract dates, times, confirmation numbers and more.</Text>
                  <View style={styles.choiceTags}>
                    <View style={styles.choiceTag}><Text style={styles.choiceTagText}>Screenshot</Text></View>
                  </View>
                </View>
                <Text style={styles.choiceArrow}>›</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.choiceCard} onPress={() => setAddStep('manual')} activeOpacity={0.8}>
              <View style={[styles.choiceIcon, {backgroundColor: colors.textSecondary}]}>
                <Icon name="edit" size={22} color={colors.surface}/>
              </View>
              <View style={styles.choiceText}>
                <Text style={styles.choiceTitle}>Enter Booking Details</Text>
                <Text style={styles.choiceSub}>Type in the details — works for anything.</Text>
              </View>
              <Text style={styles.choiceArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {addStep === 'screenshot' && imageUri && (
          <View style={styles.addPickerContent}>
            <Text style={styles.addPickerSub}>
              Confirm your screenshot and tap Detect to extract booking details.
            </Text>
            <Image source={{uri: imageUri}} style={styles.screenshotPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.screenshotReplace} onPress={pickScreenshot} activeOpacity={0.7}>
              <Text style={styles.screenshotReplaceText}>Choose a different photo</Text>
            </TouchableOpacity>
            {parseError && <Text style={styles.parseError}>{parseError}</Text>}
            <TouchableOpacity
              style={[styles.detectBtn, submitting && styles.detectBtnDisabled]}
              onPress={handleDetect}
              disabled={submitting}
              activeOpacity={0.8}>
              {submitting
                ? <ActivityIndicator color={colors.surface} />
                : <Text style={styles.detectBtnText}>Detect & extract</Text>}
            </TouchableOpacity>
            <Text style={styles.detectSectionLabel}>WHAT WE DETECT</Text>
            {DETECT_TYPES.map(dt => (
              <View key={dt.label} style={styles.detectRow}>
                <Icon name={dt.icon} size={20} color={colors.textSecondary}/>
                <View>
                  <Text style={styles.detectLabel}>{dt.label}</Text>
                  <Text style={styles.detectSub}>{dt.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {addStep === 'manual' && (
          <View style={styles.addPickerContent}>
            <Text style={styles.addPickerSub}>Select a type, then fill in the details.</Text>
            <Text style={styles.fieldLabel}>TYPE</Text>
            <View style={styles.typeRow}>
              {ALL_PLAN_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, manualType === t && styles.typeBtnActive]}
                  onPress={() => setManualType(t)}
                  activeOpacity={0.7}>
                  <Icon name={TYPE_META[t].icon} size={22} color={manualType === t ? colors.accent : colors.textSecondary}/>
                  <Text style={[styles.typeBtnLabel, manualType === t && styles.typeBtnLabelActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>TITLE</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="Plan name"
              placeholderTextColor={colors.textTertiary}
              value={manualTitle}
              onChangeText={setManualTitle}
              autoFocus
            />
            <Text style={styles.fieldLabel}>DATE & TIME</Text>
            <TouchableOpacity
              style={styles.datePickerRow}
              onPress={() => setShowDatePicker(v => !v)}
              activeOpacity={0.7}>
              <Icon name="calendar" size={17} color={colors.textPrimary}/>
              <Text style={styles.datePickerText}>
                {manualDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) +
                  '  ·  ' +
                  manualDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
              </Text>
              <Icon name="chev-down" size={17} color={colors.textTertiary}/>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={manualDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={(_e, date) => {
                  if (date) { setManualDate(date); }
                  if (Platform.OS === 'android') { setShowDatePicker(false); }
                }}
                style={styles.datePickerNative}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function TripDetailScreen({navigation, route}: Props) {
  const {tripId} = route.params;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('plans');
  const [addingPlan, setAddingPlan] = useState(false);

  function handleDeleteTrip() {
    Alert.alert(
      'Delete trip',
      `Delete "${trip?.name}"? This will also remove all its plans.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/trips/${tripId}`);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not delete trip. Please try again.');
            }
          },
        },
      ],
    );
  }
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const stripRef = useRef<ScrollView>(null);

  const handleDeletePlan = (planId: string) => {
    Alert.alert('Delete Plan', 'Remove this plan from the trip?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await client.delete(`/plans/${planId}`);
            setPlans(prev => prev.filter(p => p.id !== planId));
          } catch {
            Alert.alert('Error', 'Could not delete plan. Please try again.');
          }
        },
      },
    ]);
  };

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

  const undatedPlans = useMemo(
    () => plans.filter(p => !p.start_datetime),
    [plans],
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const top = e.nativeEvent.contentOffset.y;
    if (!scrolled && top > 56) setScrolled(true);
    else if (scrolled && top < 20) setScrolled(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <PlaneSpinner label="Loading trip…"/>
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

  const dest = findDestination(trip.destination_city);
  const tint = tripTint(trip.id);

  return (
    <View style={styles.container}>
      {/* Header with SVG cover + trip tint */}
      <View style={styles.header}>
        <DestinationCover type={dest?.type ?? 'other'} />
        <View style={[StyleSheet.absoluteFill, {backgroundColor: tint, opacity: 0.22}]} />
        <SafeAreaView>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.glassBtn} onPress={() => navigation.goBack()}>
              <Icon name="chev-left" size={20} color={colors.surface} stroke={2}/>
            </TouchableOpacity>
            {scrolled && (
              <Text style={styles.navTitle} numberOfLines={1}>
                {trip.name}
              </Text>
            )}
            <View style={styles.navRight}>
              <TouchableOpacity style={styles.glassBtnWide}>
                <View style={{flexDirection:'row', alignItems:'center', gap: 5}}>
                  <Icon name="doc" size={14} color={colors.surface}/>
                  <Text style={styles.glassBtnWideText}>PDF</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.glassBtn} onPress={handleDeleteTrip}>
                <Icon name="more" size={18} color={colors.surface}/>
              </TouchableOpacity>
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

          {/* Segmented tabs */}
          <View style={styles.segRow}>
            {([
              {mode: 'plans'     as ViewMode, label: 'Daily Plans', icon: 'calendar'},
              {mode: 'itinerary' as ViewMode, label: 'Itinerary',   icon: 'doc'},
            ]).map(({mode, label, icon}) => {
              const active = viewMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.segBtn, active && styles.segBtnActive]}
                  onPress={() => setViewMode(mode)}
                  activeOpacity={0.8}>
                  <Icon
                    name={icon}
                    size={14}
                    color={active ? colors.accent : 'rgba(255,255,255,0.75)'}
                  />
                  <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Day strip — hidden in itinerary mode */}
          {viewMode !== 'itinerary' && (
            <ScrollView
              ref={stripRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
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
          )}
        </SafeAreaView>
      </View>

      {/* Content */}
      {viewMode === 'plans' && (
        <ScrollView
          style={styles.scroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          scrollIndicatorInsets={{bottom: 80}}
          contentContainerStyle={styles.scrollContent}>
          <DayView
            date={activeDate}
            plans={dayPlans}
            onSelectPlan={setSelectedPlan}
          />
          {undatedPlans.length > 0 && (
            <View style={styles.dayView}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderDate}>No date</Text>
                <Text style={styles.dayHeaderCount}>
                  {undatedPlans.length} unscheduled plan{undatedPlans.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.planList}>
                {undatedPlans.map(p => (
                  <PlanCard key={p.id} plan={p} onPress={() => setSelectedPlan(p)} />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
{viewMode === 'itinerary' && (
        <ItineraryView trip={trip} plans={plans} days={days} />
      )}

      {/* Circular FAB */}
      {!addingPlan && (
        <TouchableOpacity style={styles.fab} onPress={() => setAddingPlan(true)} activeOpacity={0.85}>
          <Icon name="plus" size={24} color={colors.surface}/>
        </TouchableOpacity>
      )}

      {/* Add Plan inline overlay */}
      {addingPlan && (
        <AddPlanOverlay
          tripId={tripId}
          trip={trip}
          defaultDate={activeDate}
          onClose={() => setAddingPlan(false)}
          onAdded={updatedPlans => {
            setPlans(updatedPlans);
            setAddingPlan(false);
          }}
        />
      )}

      {/* Plan Detail sheet */}
      <PlanDetailSheet
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onDelete={planId => {
          handleDeletePlan(planId);
          setSelectedPlan(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bgBase},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl']},

  // Header
  header: {overflow: 'hidden'},
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: spacing.md,
  },
  navRight: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 'auto',
  },
  glassBtn: {
    width: 38, height: 38, borderRadius: radii.chip,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  navTitle: {
    flex: 1, fontSize: typography.md, fontWeight: typography.semibold, color: colors.surface,
    textAlign: 'center', letterSpacing: -0.1,
  },
  glassBtnWide: {
    height: 38, borderRadius: radii.chip, paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  glassBtnWideText: {fontSize: typography.bodySmall, color: colors.surface, fontWeight: typography.semibold},

  titleBlock: {paddingHorizontal: 22, paddingTop: spacing.lg, paddingBottom: spacing.md},
  destLabel: {
    fontSize: typography.xs, fontWeight: typography.medium, letterSpacing: 0.4,
    color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase',
  },
  tripTitle: {
    fontSize: typography['3xl'] - 4,
    fontWeight: typography.semibold,
    color: colors.surface,
    letterSpacing: -0.3,
    marginTop: 3,
  },
  tripMeta: {fontSize: typography.bodySmall, color: 'rgba(255,255,255,0.88)', marginTop: 4},

  // Segmented control
  segRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: spacing.xs,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderRadius: radii.xl,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.lg,
    gap: spacing.sm,
  },
  segBtnActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  segBtnText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: 'rgba(255,255,255,0.72)'},
  segBtnTextActive: {color: colors.textPrimary},

  // Day strip
  dayStripScroll: {flexShrink: 0},
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: spacing.xs,
    gap: spacing.md,
  },
  dayPill: {
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: 'transparent',
    minWidth: 40,
  },
  dayPillActive: {backgroundColor: 'rgba(255,255,255,0.22)'},
  dayPillLabel: {
    fontSize: typography.xs, fontWeight: typography.medium, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  dayPillLabelActive: {color: colors.surface},
  dayPillNum: {fontSize: typography.lg, fontWeight: typography.semibold, color: 'rgba(255,255,255,0.95)', marginTop: 2},
  dayPillNumActive: {color: colors.surface},
  dayPillWx: {fontSize: typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: 1},
  dayPillWxActive: {color: 'rgba(255,255,255,0.9)'},

  // Day view
  scroll: {flex: 1},
  scrollContent: {paddingBottom: 100},
  dayView: {
    paddingTop: 20,
    paddingHorizontal: spacing.xl,
    paddingBottom: 0,
  },
  dayHeader: {paddingHorizontal: spacing.xs, marginBottom: spacing.xs},
  dayHeaderDate: {fontSize: typography.bodySmall, color: colors.textSecondary},
  dayHeaderCount: {
    fontSize: typography.xl, fontWeight: typography.semibold,
    color: colors.textPrimary, letterSpacing: -0.05, marginTop: 2,
  },
  planList: {gap: spacing.lg, marginTop: spacing.xs},
  itinUnscheduledHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.textSecondary,
  },
  emptyDay: {
    backgroundColor: colors.surface, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing['2xl'], alignItems: 'center',
  },
  emptyDayText: {fontSize: typography.base, color: colors.textTertiary},

  // Itinerary view
  itinContent: {paddingTop: spacing.xl, paddingBottom: 100, gap: spacing.xl},
  itinDayCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    overflow: 'hidden',
    marginHorizontal: spacing.xl,
    // Shadow instead of border — border + overflow:hidden + borderRadius
    // leaves a 1-px inset ring that makes the gradient look like a rectangle
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  itinDayHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  itinDayNum: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  itinDayDate: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.surface,
    marginTop: 1,
    letterSpacing: -0.2,
  },
  itinPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.lg,
  },
  itinTime: {
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums' as any],
    width: 38,
    flexShrink: 0,
  },
  itinTitle: {
    flex: 1,
    fontSize: typography.base,
    color: colors.textPrimary,
    fontWeight: typography.medium,
  },
  itinEmpty: {
    fontSize: typography.bodySmall,
    color: colors.textTertiary,
    padding: spacing.xl,
    textAlign: 'center',
  },
  itinFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  itinFooterText: {
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  itinFooterCost: {
    fontSize: typography.bodySmall,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },

  // Circular FAB
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  // Error
  errorText: {fontSize: typography.md, color: colors.danger, textAlign: 'center'},
  backLink: {fontSize: typography.md, color: colors.accent, marginTop: spacing.lg},

  // ── Add Plan overlay ─────────────────────────────────────────────────────────
  addOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: colors.bgBase,
    zIndex: 10,
  },
  addNavBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  addNavBtn: {minWidth: 64, alignItems: 'flex-end'},
  addNavBackBtn: {flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 64},
  addNavCancelText: {fontSize: typography.base, fontWeight: typography.medium, color: colors.accent},
  addNavBtnText: {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
  addNavSaveText: {fontSize: typography.base, fontWeight: typography.semibold, color: colors.accent},
  addNavSaveDisabled: {color: colors.textTertiary},
  addNavTitle: {
    fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary,
  },

  addPickerContent: {padding: spacing.xl},
  addPickerSub: {
    fontSize: typography.base, color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // Choice cards
  choiceCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.row,
    marginBottom: spacing.lg,
  },
  choiceIcon: {
    width: 44, height: 44, borderRadius: radii.xl,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  choiceIconText: {fontSize: typography.xl},
  choiceText: {flex: 1},
  choiceTitle: {fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: 4},
  choiceSub: {fontSize: typography.bodySmall, color: colors.textSecondary, lineHeight: 18},
  choiceTags: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
  choiceTag: {
    borderRadius: radii.chip, paddingHorizontal: spacing.md, paddingVertical: 3,
    backgroundColor: colors.bgBase3,
  },
  choiceTagText: {fontSize: typography.xs, color: colors.textSecondary},
  choiceArrow: {fontSize: typography.xl, color: colors.textTertiary, alignSelf: 'center'},

  // Type picker
  typePickerLabel: {
    fontSize: typography.xs + 1, fontWeight: typography.medium,
    letterSpacing: 0.32, textTransform: 'uppercase',
    color: colors.textTertiary, marginBottom: spacing.lg,
  },
  typeRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl},
  typeBtn: {
    width: '22%', alignItems: 'center', paddingVertical: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.xl, gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  typeBtnActive: {borderColor: colors.accent, backgroundColor: 'rgba(15,98,254,0.06)'},
  typeBtnLabel: {fontSize: typography.bodySmall, color: colors.textSecondary},
  typeBtnLabelActive: {color: colors.accent, fontWeight: typography.semibold},

  // Paste step
  fieldLabel: {
    fontSize: typography.bodySmall, color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  screenshotPreview: {
    width: '100%', height: 200, borderRadius: radii.card, marginBottom: spacing.sm,
  },
  screenshotReplace: {alignSelf: 'center', marginBottom: spacing.xl},
  screenshotReplaceText: {fontSize: typography.base, color: colors.accent},
  parseError: {fontSize: typography.bodySmall, color: colors.danger, marginBottom: spacing.lg},
  detectBtn: {
    backgroundColor: colors.accent, borderRadius: radii.xl,
    paddingVertical: 14, alignItems: 'center', marginBottom: spacing.xl,
  },
  detectBtnDisabled: {opacity: 0.45},
  detectBtnText: {fontSize: typography.md, fontWeight: typography.semibold, color: colors.surface},
  detectSectionLabel: {
    fontSize: typography.xs + 1, fontWeight: typography.medium,
    letterSpacing: 0.32, textTransform: 'uppercase',
    color: colors.textTertiary, marginBottom: spacing.lg,
  },
  detectRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  detectLabel: {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
  detectSub: {fontSize: typography.bodySmall, color: colors.textSecondary},

  // Manual entry
  manualInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl,
    padding: spacing.lg, fontSize: typography.base,
    color: colors.textPrimary, backgroundColor: colors.bgBase,
    marginBottom: spacing.xl,
  },
  datePickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl,
    paddingHorizontal: spacing.lg, paddingVertical: 13,
    backgroundColor: colors.bgBase,
    marginBottom: spacing.md,
  },
  datePickerText: {
    flex: 1, fontSize: typography.base, color: colors.textPrimary,
  },
  datePickerNative: {
    marginBottom: spacing.xl,
    // On iOS `inline` display is full-width; let it size itself naturally
  },
});
