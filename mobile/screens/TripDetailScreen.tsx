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
import {useTheme} from '../context/ThemeContext';
import type {Plan, Trip} from '../types';
import {dateRange, fmtDow, fmtDayLabel, fmtDayNum, fmtShort, fmtTime, fmtTime24} from '../utils/dates';
import type {RootStackParamList} from '../App';
import {radii, spacing, typography} from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TripDetail'>;
  route: RouteProp<RootStackParamList, 'TripDetail'>;
};

type ViewMode = 'plans' | 'itinerary';
type AddStep = null | 'picker' | 'screenshot' | 'manual';

const DETECT_TYPES = [
  {icon: 'plane',   label: 'Flight',   sub: 'Flight numbers, IATA codes, gate'},
  {icon: 'hotel',   label: 'Stay',     sub: 'Check-in / out, room type'},
  {icon: 'map-pin', label: 'Activity', sub: 'Reservation, tickets, time slot'},
  {icon: 'fork',    label: 'Food',     sub: 'Restaurant, party size, OpenTable'},
];

function toLocalISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function DayPill({date, active, onPress, weatherIcon, tempF}: {
  date: string; active: boolean; onPress: () => void; weatherIcon?: string; tempF?: number;
}) {
  const {theme, colors, glass} = useTheme();
  const s = useMemo(() => StyleSheet.create({
    pill:        {alignItems: 'center', paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, borderRadius: radii.lg, backgroundColor: 'transparent', minWidth: 40},
    pillActive:  {backgroundColor: glass.activePillBg},
    label:       {fontSize: typography.xs, fontWeight: typography.medium, textTransform: 'uppercase', color: glass.textSecondary},
    labelActive: {color: glass.textPrimary},
    num:         {fontSize: typography.lg, fontWeight: typography.semibold, color: glass.textPrimary, marginTop: 2},
    numActive:   {color: glass.textPrimary},
    wx:          {fontSize: typography.xs, color: glass.textTertiary, marginTop: 1},
    wxActive:    {color: glass.textHigh},
  }), [theme]);
  return (
    <TouchableOpacity style={[s.pill, active && s.pillActive]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.label, active && s.labelActive]}>{fmtDayLabel(date)}</Text>
      <Text style={[s.num, active && s.numActive]}>{fmtDayNum(date)}</Text>
      {tempF != null && <Text style={[s.wx, active && s.wxActive]}>{weatherIcon ?? '☀'} {Math.round(tempF)}°</Text>}
    </TouchableOpacity>
  );
}

function DayHeader({date, plans}: {date: string; plans: Plan[]}) {
  const {theme, colors} = useTheme();
  const s = useMemo(() => StyleSheet.create({
    header:      {paddingHorizontal: spacing.xs, marginBottom: spacing.xs},
    headerDate:  {fontSize: typography.bodySmall, color: colors.textSecondary},
    headerCount: {fontSize: typography.xl, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.05, marginTop: 2},
  }), [theme]);
  const totalCost = plans.reduce((sum, p) => {
    const c = (p.details as any)?.cost;
    return sum + (typeof c === 'number' ? c : 0);
  }, 0);
  return (
    <View style={s.header}>
      <Text style={s.headerDate}>{fmtDow(date)}</Text>
      <Text style={s.headerCount}>{plans.length} plan{plans.length !== 1 ? 's' : ''}{totalCost > 0 ? ` · $${totalCost}` : ''}</Text>
    </View>
  );
}

function DayView({date, plans, onSelectPlan}: {date: string; plans: Plan[]; onSelectPlan: (p: Plan) => void}) {
  const {theme, colors} = useTheme();
  const s = useMemo(() => StyleSheet.create({
    view:      {paddingTop: 20, paddingHorizontal: spacing.xl, paddingBottom: 0},
    planList:  {gap: spacing.lg, marginTop: spacing.xs},
    emptyDay:  {backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing['2xl'], alignItems: 'center'},
    emptyText: {fontSize: typography.base, color: colors.textTertiary},
  }), [theme]);
  return (
    <View style={s.view}>
      <DayHeader date={date} plans={plans}/>
      <View style={s.planList}>
        {plans.map(p => <PlanCard key={p.id} plan={p} onPress={() => onSelectPlan(p)}/>)}
        {plans.length === 0 && <View style={s.emptyDay}><Text style={s.emptyText}>Nothing planned yet</Text></View>}
      </View>
    </View>
  );
}

function ItineraryView({trip, plans, days}: {trip: Trip; plans: Plan[]; days: string[]}) {
  const {theme, colors, glass, primary, tripTint} = useTheme();
  const tint = tripTint(trip.id);
  const undated = plans.filter(p => !p.start_datetime);

  const s = useMemo(() => StyleSheet.create({
    content:             {paddingTop: spacing.xl, paddingBottom: 100, gap: spacing.xl},
    dayCard:             {backgroundColor: colors.surface, borderRadius: radii.card, overflow: 'hidden', marginHorizontal: spacing.xl, shadowColor: colors.shadow, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: {width: 0, height: 2}, elevation: 2},
    unscheduledHeader:   {paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md, backgroundColor: colors.textSecondary},
    dayHeader:           {paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md},
    dayNum:              {fontSize: typography.xs, fontWeight: typography.semibold, color: glass.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase'},
    dayDate:             {fontSize: typography.lg, fontWeight: typography.semibold, color: glass.textPrimary, marginTop: 1, letterSpacing: -0.2},
    planRow:             {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: spacing.lg},
    timeText:            {fontSize: typography.bodySmall, color: colors.textSecondary, fontVariant: ['tabular-nums' as any], width: 38, flexShrink: 0},
    planTitle:           {flex: 1, fontSize: typography.base, color: colors.textPrimary, fontWeight: typography.medium},
    empty:               {fontSize: typography.bodySmall, color: colors.textTertiary, padding: spacing.xl, textAlign: 'center'},
    footer:              {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: spacing.xl, paddingVertical: spacing.md},
    footerText:          {fontSize: typography.bodySmall, color: colors.textSecondary},
    footerCost:          {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: colors.textPrimary},
  }), [theme]);

  return (
    <ScrollView style={{flex: 1}} contentContainerStyle={s.content}>
      {undated.length > 0 && (
        <View style={s.dayCard}>
          <View style={s.unscheduledHeader}>
            <Text style={s.dayNum}>UNSCHEDULED</Text>
            <Text style={s.dayDate}>{undated.length} plan{undated.length !== 1 ? 's' : ''}</Text>
          </View>
          {undated.map(p => (
            <View key={p.id} style={s.planRow}>
              <Text style={s.timeText}>—</Text>
              <Text style={s.planTitle} numberOfLines={1}>{p.title}</Text>
            </View>
          ))}
        </View>
      )}
      {days.map((date, i) => {
        const dp = plans.filter(p => p.start_datetime?.slice(0, 10) === date);
        const cost = dp.reduce((sum, p) => sum + (((p.details as any)?.cost ?? 0) as number), 0);
        return (
          <View key={date} style={s.dayCard}>
            <View style={s.dayHeader}>
              <View style={[StyleSheet.absoluteFill, {backgroundColor: primary['700']}]}/>
              <Text style={s.dayNum}>DAY {i + 1} · {fmtDayLabel(date).toUpperCase()}</Text>
              <Text style={s.dayDate}>{fmtShort(date)}</Text>
            </View>
            {dp.length === 0
              ? <Text style={s.empty}>Nothing planned</Text>
              : dp.map(p => (
                  <View key={p.id} style={s.planRow}>
                    <Text style={s.timeText}>{fmtTime24(p.start_datetime)}</Text>
                    <Text style={s.planTitle} numberOfLines={1}>{p.title}</Text>
                  </View>
                ))}
            <View style={s.footer}>
              <Text style={s.footerText}>{dp.length} plan{dp.length !== 1 ? 's' : ''}</Text>
              {cost > 0 && <Text style={s.footerCost}>${cost}</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Add Plan inline overlay ─────────────────────────────────────────────────

function AddPlanOverlay({tripId, trip, defaultDate, onClose, onAdded}: {
  tripId: string; trip: Trip; defaultDate: string;
  onClose: () => void; onAdded: (plans: Plan[]) => void;
}) {
  const {theme, colors, glass, typeMeta} = useTheme();
  const allPlanTypes = useMemo(() => Object.keys(typeMeta), [typeMeta]);
  const insets = useSafeAreaInsets();
  const [addStep, setAddStep]           = useState<Exclude<AddStep, null>>('picker');
  const [imageUri, setImageUri]         = useState<string | null>(null);
  const [imageBase64, setImageBase64]   = useState<string | null>(null);
  const [screenshotAvailable, setScreenshotAvailable] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [parseError, setParseError]     = useState<string | null>(null);
  const [manualType, setManualType]     = useState<string>('Flight');
  const [manualTitle, setManualTitle]   = useState('');
  const [manualDate, setManualDate]     = useState<Date>(() => new Date(defaultDate + 'T12:00:00'));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    BookingParserModule?.isAvailable().then(setScreenshotAvailable).catch(() => {});
  }, []);

  const minDate = new Date(trip.start_date + 'T00:00:00');
  const maxDate = new Date(trip.end_date + 'T23:59:59');
  const canSave = addStep === 'manual' && manualTitle.trim().length > 0;

  const s = useMemo(() => StyleSheet.create({
    overlay:      {position: 'absolute', inset: 0, backgroundColor: colors.bgBase, zIndex: 10},
    navBar:       {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: colors.surface},
    navBtn:       {minWidth: 64, alignItems: 'flex-end'},
    navBackBtn:   {flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 64},
    navCancelText: {fontSize: typography.base, fontWeight: typography.medium, color: colors.accent},
    navBtnText:   {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
    navSaveText:  {fontSize: typography.base, fontWeight: typography.semibold, color: colors.accent},
    navSaveDisabled: {color: colors.textTertiary},
    navTitle:     {fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary},
    content:      {padding: spacing.xl},
    contentSub:   {fontSize: typography.base, color: colors.textSecondary, marginBottom: spacing.xl},
    choiceCard:   {flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: spacing.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.row, marginBottom: spacing.lg},
    choiceIcon:   {width: 44, height: 44, borderRadius: radii.xl, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
    choiceText:   {flex: 1},
    choiceTitle:  {fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: 4},
    choiceSub:    {fontSize: typography.bodySmall, color: colors.textSecondary, lineHeight: 18},
    choiceTags:   {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md},
    choiceTag:    {borderRadius: radii.chip, paddingHorizontal: spacing.md, paddingVertical: 3, backgroundColor: colors.bgBase3},
    choiceTagText: {fontSize: typography.xs, color: colors.textSecondary},
    choiceArrow:  {fontSize: typography.xl, color: colors.textTertiary, alignSelf: 'center'},
    screenshotPreview: {width: '100%', height: 200, borderRadius: radii.card, marginBottom: spacing.sm},
    screenshotReplace: {alignSelf: 'center', marginBottom: spacing.xl},
    screenshotReplaceText: {fontSize: typography.base, color: colors.accent},
    parseError:   {fontSize: typography.bodySmall, color: colors.danger, marginBottom: spacing.lg},
    detectBtn:    {backgroundColor: colors.accent, borderRadius: radii.xl, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.xl},
    detectBtnDisabled: {opacity: 0.45},
    detectBtnText: {fontSize: typography.md, fontWeight: typography.semibold, color: glass.textPrimary},
    detectSectionLabel: {fontSize: typography.xs + 1, fontWeight: typography.medium, letterSpacing: 0.32, textTransform: 'uppercase', color: colors.textTertiary, marginBottom: spacing.lg},
    detectRow:    {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border},
    detectLabel:  {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
    detectSub:    {fontSize: typography.bodySmall, color: colors.textSecondary},
    fieldLabel:   {fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm},
    typeRow:      {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl},
    typeBtn:      {width: '22%', alignItems: 'center', paddingVertical: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, gap: spacing.sm, backgroundColor: colors.surface},
    typeBtnActive: {borderColor: colors.accent, backgroundColor: colors.accentXSubtle},
    typeBtnLabel: {fontSize: typography.bodySmall, color: colors.textSecondary},
    typeBtnLabelActive: {color: colors.accent, fontWeight: typography.semibold},
    manualInput:  {borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, padding: spacing.lg, fontSize: typography.base, color: colors.textPrimary, backgroundColor: colors.bgBase, marginBottom: spacing.xl},
    datePickerRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xl, paddingHorizontal: spacing.lg, paddingVertical: 13, backgroundColor: colors.bgBase, marginBottom: spacing.md},
    datePickerText: {flex: 1, fontSize: typography.base, color: colors.textPrimary},
    datePickerNative: {},
  }), [theme]);

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await client.post(`/trips/${tripId}/plans`, {type: manualType, title: manualTitle.trim(), start_datetime: toLocalISO(manualDate)});
      const res = await client.get<Plan[]>(`/trips/${tripId}/plans`);
      onAdded(res.data); onClose();
    } catch { Alert.alert('Error', 'Could not save plan. Please try again.'); }
    finally { setSubmitting(false); }
  }

  async function handleDetect() {
    if (!imageBase64) return;
    setSubmitting(true); setParseError(null);
    try {
      const text: string = await OCRModule.recognizeText(imageBase64);
      if (!text.trim()) { setParseError('No text found in the screenshot. Try a clearer image.'); return; }
      const parsed = await BookingParserModule.parseBookingText(text);
      await client.post(`/trips/${tripId}/plans/from-parsed`, parsed);
      const res = await client.get<Plan[]>(`/trips/${tripId}/plans`);
      onAdded(res.data); onClose();
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setParseError(typeof detail === 'string' ? detail : e.message ?? 'Could not detect plan type.');
    } finally { setSubmitting(false); }
  }

  function pickScreenshot() {
    launchImageLibrary({mediaType: 'photo', quality: 1, includeBase64: true}, response => {
      if (response.errorCode === 'permission') {
        Alert.alert('Photo Access Required', 'Go to Settings > TripPlanner > Photos and select "All Photos".', [{text: 'Cancel', style: 'cancel'}, {text: 'Open Settings', onPress: () => Linking.openSettings()}]);
        return;
      }
      const asset = response.assets?.[0];
      if (asset?.uri && asset?.base64) { setImageUri(asset.uri); setImageBase64(asset.base64); setAddStep('screenshot'); }
    });
  }

  return (
    <View style={s.overlay}>
      <View style={[s.navBar, {paddingTop: insets.top + spacing.sm}]}>
        {addStep === 'picker' ? (
          <TouchableOpacity onPress={onClose} style={s.navBtn}><Text style={s.navCancelText}>Cancel</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setAddStep('picker')} style={s.navBackBtn}>
            <Icon name="chev-left" size={18} color={colors.textPrimary} stroke={2}/>
            <Text style={s.navBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <Text style={s.navTitle}>{addStep === 'picker' ? 'New plan' : addStep === 'screenshot' ? 'Upload Booking Screenshot' : 'Enter Booking Details'}</Text>
        <TouchableOpacity style={s.navBtn} onPress={handleSave} disabled={!canSave}>
          {submitting ? <ActivityIndicator size="small" color={colors.accent}/> : <Text style={[s.navSaveText, !canSave && s.navSaveDisabled]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled">
        {addStep === 'picker' && (
          <View style={s.content}>
            <Text style={s.contentSub}>How would you like to add this plan?</Text>
            {screenshotAvailable && (
              <TouchableOpacity style={s.choiceCard} onPress={pickScreenshot} activeOpacity={0.8}>
                <View style={[s.choiceIcon, {backgroundColor: colors.accent}]}>
                  <Icon name="doc" size={22} color={glass.textPrimary}/>
                </View>
                <View style={s.choiceText}>
                  <Text style={s.choiceTitle}>Upload Booking Screenshot</Text>
                  <Text style={s.choiceSub}>Drop a booking screenshot. We extract dates, times, confirmation numbers and more.</Text>
                  <View style={s.choiceTags}><View style={s.choiceTag}><Text style={s.choiceTagText}>Screenshot</Text></View></View>
                </View>
                <Text style={s.choiceArrow}>›</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.choiceCard} onPress={() => setAddStep('manual')} activeOpacity={0.8}>
              <View style={[s.choiceIcon, {backgroundColor: colors.textSecondary}]}>
                <Icon name="edit" size={22} color={glass.textPrimary}/>
              </View>
              <View style={s.choiceText}>
                <Text style={s.choiceTitle}>Enter Booking Details</Text>
                <Text style={s.choiceSub}>Type in the details — works for anything.</Text>
              </View>
              <Text style={s.choiceArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {addStep === 'screenshot' && imageUri && (
          <View style={s.content}>
            <Text style={s.contentSub}>Confirm your screenshot and tap Detect to extract booking details.</Text>
            <Image source={{uri: imageUri}} style={s.screenshotPreview} resizeMode="cover"/>
            <TouchableOpacity style={s.screenshotReplace} onPress={pickScreenshot} activeOpacity={0.7}>
              <Text style={s.screenshotReplaceText}>Choose a different photo</Text>
            </TouchableOpacity>
            {parseError && <Text style={s.parseError}>{parseError}</Text>}
            <TouchableOpacity style={[s.detectBtn, submitting && s.detectBtnDisabled]} onPress={handleDetect} disabled={submitting} activeOpacity={0.8}>
              {submitting ? <ActivityIndicator color={glass.textPrimary}/> : <Text style={s.detectBtnText}>Detect & extract</Text>}
            </TouchableOpacity>
            <Text style={s.detectSectionLabel}>WHAT WE DETECT</Text>
            {DETECT_TYPES.map(dt => (
              <View key={dt.label} style={s.detectRow}>
                <Icon name={dt.icon} size={20} color={colors.textSecondary}/>
                <View><Text style={s.detectLabel}>{dt.label}</Text><Text style={s.detectSub}>{dt.sub}</Text></View>
              </View>
            ))}
          </View>
        )}

        {addStep === 'manual' && (
          <View style={s.content}>
            <Text style={s.contentSub}>Select a type, then fill in the details.</Text>
            <Text style={s.fieldLabel}>TYPE</Text>
            <View style={s.typeRow}>
              {allPlanTypes.map(t => (
                <TouchableOpacity key={t} style={[s.typeBtn, manualType === t && s.typeBtnActive]} onPress={() => setManualType(t)} activeOpacity={0.7}>
                  <Icon name={typeMeta[t].icon} size={22} color={manualType === t ? colors.accent : colors.textSecondary}/>
                  <Text style={[s.typeBtnLabel, manualType === t && s.typeBtnLabelActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>TITLE</Text>
            <TextInput style={s.manualInput} placeholder="Plan name" placeholderTextColor={colors.textTertiary} value={manualTitle} onChangeText={setManualTitle} autoFocus/>
            <Text style={s.fieldLabel}>DATE & TIME</Text>
            <TouchableOpacity style={s.datePickerRow} onPress={() => setShowDatePicker(v => !v)} activeOpacity={0.7}>
              <Icon name="calendar" size={17} color={colors.textPrimary}/>
              <Text style={s.datePickerText}>
                {manualDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) + '  ·  ' + manualDate.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'})}
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
                  if (date) setManualDate(date);
                  if (Platform.OS === 'android') setShowDatePicker(false);
                }}
                style={s.datePickerNative}
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
  const {theme, colors, glass, primary, tripTint} = useTheme();

  const [trip, setTrip]           = useState<Trip | null>(null);
  const [plans, setPlans]         = useState<Plan[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [dayIdx, setDayIdx]       = useState(0);
  const [scrolled, setScrolled]   = useState(false);
  const [viewMode, setViewMode]   = useState<ViewMode>('plans');
  const [addingPlan, setAddingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const stripRef = useRef<ScrollView>(null);

  const s = useMemo(() => StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bgBase},
    centered:  {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], backgroundColor: colors.bgBase},
    header:    {overflow: 'hidden'},
    navRow:    {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xs, paddingBottom: spacing.xs, gap: spacing.md},
    navRight:  {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginLeft: 'auto'},
    glassBtn:  {width: 38, height: 38, borderRadius: radii.chip, backgroundColor: glass.buttonBg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: glass.buttonBorder},
    navTitle:  {flex: 1, fontSize: typography.md, fontWeight: typography.semibold, color: glass.textPrimary, textAlign: 'center', letterSpacing: -0.1},
    glassBtnWide: {height: 38, borderRadius: radii.chip, paddingHorizontal: 14, backgroundColor: glass.buttonBg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: glass.buttonBorder},
    glassBtnWideText: {fontSize: typography.bodySmall, color: glass.textPrimary, fontWeight: typography.semibold},
    titleBlock: {paddingHorizontal: 22, paddingTop: spacing.lg, paddingBottom: spacing.md},
    destLabel:  {fontSize: typography.xs, fontWeight: typography.medium, letterSpacing: 0.4, color: glass.textLabel, textTransform: 'uppercase'},
    tripTitle:  {fontSize: typography['3xl'] - 4, fontWeight: typography.semibold, color: glass.textPrimary, letterSpacing: -0.3, marginTop: 3},
    tripMeta:   {fontSize: typography.bodySmall, color: glass.textMeta, marginTop: 4},
    segRow:     {flexDirection: 'row', marginHorizontal: 20, marginTop: spacing.xs, marginBottom: 10, backgroundColor: glass.segControlBg, borderRadius: radii.xl, padding: 4},
    segBtn:     {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: radii.lg, gap: spacing.sm},
    segBtnActive: {backgroundColor: glass.chipBg, shadowColor: colors.shadow, shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: {width: 0, height: 2}, elevation: 3},
    segBtnText: {fontSize: typography.bodySmall, fontWeight: typography.semibold, color: glass.textSecondary},
    segBtnTextActive: {color: glass.activePillText},
    dayStripScroll: {flexShrink: 0},
    dayStrip:   {flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, paddingTop: spacing.xs, gap: spacing.md},
    scroll:     {flex: 1},
    scrollContent: {paddingBottom: 100},
    dayView:    {paddingTop: 20, paddingHorizontal: spacing.xl, paddingBottom: 0},
    dayHeader:  {paddingHorizontal: spacing.xs, marginBottom: spacing.xs},
    dayHeaderDate:  {fontSize: typography.bodySmall, color: colors.textSecondary},
    dayHeaderCount: {fontSize: typography.xl, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.05, marginTop: 2},
    planList:   {gap: spacing.lg, marginTop: spacing.xs},
    unscheduledHeader: {paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md, backgroundColor: colors.textSecondary},
    fab:        {position: 'absolute', bottom: 32, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8},
    errorText:  {fontSize: typography.md, color: colors.danger, textAlign: 'center'},
    backLink:   {fontSize: typography.md, color: colors.accent, marginTop: spacing.lg},
  }), [theme]);

  function handleDeleteTrip() {
    Alert.alert('Delete trip', `Delete "${trip?.name}"? This will also remove all its plans.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/trips/${tripId}`); navigation.goBack(); }
        catch { Alert.alert('Error', 'Could not delete trip. Please try again.'); }
      }},
    ]);
  }

  const handleDeletePlan = (planId: string) => {
    Alert.alert('Delete Plan', 'Remove this plan from the trip?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: async () => {
        try { await client.delete(`/plans/${planId}`); setPlans(prev => prev.filter(p => p.id !== planId)); }
        catch { Alert.alert('Error', 'Could not delete plan. Please try again.'); }
      }},
    ]);
  };

  useEffect(() => {
    Promise.all([client.get<Trip>(`/trips/${tripId}`), client.get<Plan[]>(`/trips/${tripId}/plans`)])
      .then(([tripRes, plansRes]) => {
        setTrip(tripRes.data); setPlans(plansRes.data);
        const dates = dateRange(tripRes.data.start_date, tripRes.data.end_date);
        const first = plansRes.data[0] ? dates.findIndex(d => d === plansRes.data[0].start_datetime?.slice(0, 10)) : 0;
        setDayIdx(Math.max(0, first));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [tripId]);

  const days       = useMemo(() => (trip ? dateRange(trip.start_date, trip.end_date) : []), [trip?.start_date, trip?.end_date]);
  const activeDate = days[dayIdx] ?? days[0];
  const dayPlans   = useMemo(() => plans.filter(p => p.start_datetime?.slice(0, 10) === activeDate), [plans, activeDate]);
  const undated    = useMemo(() => plans.filter(p => !p.start_datetime), [plans]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const top = e.nativeEvent.contentOffset.y;
    if (!scrolled && top > 56) setScrolled(true);
    else if (scrolled && top < 20) setScrolled(false);
  };

  if (loading) return <SafeAreaView style={s.centered}><PlaneSpinner label="Loading trip…"/></SafeAreaView>;
  if (error || !trip) return (
    <SafeAreaView style={s.centered}>
      <Text style={s.errorText}>{error ?? 'Trip not found'}</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backLink}>← Go back</Text></TouchableOpacity>
    </SafeAreaView>
  );

  const dest = findDestination(trip.destination_city);
  const tint = tripTint(trip.id);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <DestinationCover type={dest?.type ?? 'other'}/>
        <View style={[StyleSheet.absoluteFill, {backgroundColor: tint, opacity: 0.22}]}/>
        <SafeAreaView>
          <View style={s.navRow}>
            <TouchableOpacity style={s.glassBtn} onPress={() => navigation.goBack()}>
              <Icon name="chev-left" size={20} color={glass.textPrimary} stroke={2}/>
            </TouchableOpacity>
            {scrolled && <Text style={s.navTitle} numberOfLines={1}>{trip.name}</Text>}
            <View style={s.navRight}>
              <TouchableOpacity style={s.glassBtnWide}>
                <View style={{flexDirection:'row', alignItems:'center', gap: 5}}>
                  <Icon name="doc" size={14} color={glass.textPrimary}/>
                  <Text style={s.glassBtnWideText}>PDF</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={s.glassBtn} onPress={handleDeleteTrip}>
                <Icon name="more" size={18} color={glass.textPrimary}/>
              </TouchableOpacity>
            </View>
          </View>

          {!scrolled && (
            <View style={s.titleBlock}>
              <Text style={s.destLabel}>{trip.destination_city.toUpperCase()}</Text>
              <Text style={s.tripTitle} numberOfLines={1}>{trip.name}</Text>
              <Text style={s.tripMeta}>{fmtShort(trip.start_date)} – {fmtShort(trip.end_date)}</Text>
            </View>
          )}

          <View style={s.segRow}>
            {([{mode: 'plans' as ViewMode, label: 'Daily Plans', icon: 'calendar'}, {mode: 'itinerary' as ViewMode, label: 'Itinerary', icon: 'doc'}]).map(({mode, label, icon}) => {
              const active = viewMode === mode;
              return (
                <TouchableOpacity key={mode} style={[s.segBtn, active && s.segBtnActive]} onPress={() => setViewMode(mode)} activeOpacity={0.8}>
                  <Icon name={icon} size={14} color={active ? colors.accent : glass.textSecondary}/>
                  <Text style={[s.segBtnText, active && s.segBtnTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {viewMode !== 'itinerary' && (
            <ScrollView ref={stripRef} horizontal showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={s.dayStrip} style={s.dayStripScroll}>
              {days.map((date, i) => <DayPill key={date} date={date} active={i === dayIdx} onPress={() => setDayIdx(i)}/>)}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>

      {viewMode === 'plans' && (
        <ScrollView style={s.scroll} onScroll={handleScroll} scrollEventThrottle={16} scrollIndicatorInsets={{bottom: 80}} contentContainerStyle={s.scrollContent}>
          <DayView date={activeDate} plans={dayPlans} onSelectPlan={setSelectedPlan}/>
          {undated.length > 0 && (
            <View style={s.dayView}>
              <View style={s.dayHeader}>
                <Text style={s.dayHeaderDate}>No date</Text>
                <Text style={s.dayHeaderCount}>{undated.length} unscheduled plan{undated.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={s.planList}>
                {undated.map(p => <PlanCard key={p.id} plan={p} onPress={() => setSelectedPlan(p)}/>)}
              </View>
            </View>
          )}
        </ScrollView>
      )}
      {viewMode === 'itinerary' && <ItineraryView trip={trip} plans={plans} days={days}/>}

      {!addingPlan && (
        <TouchableOpacity style={s.fab} onPress={() => setAddingPlan(true)} activeOpacity={0.85}>
          <Icon name="plus" size={24} color={glass.textPrimary}/>
        </TouchableOpacity>
      )}

      {addingPlan && (
        <AddPlanOverlay
          tripId={tripId} trip={trip} defaultDate={activeDate}
          onClose={() => setAddingPlan(false)}
          onAdded={updatedPlans => { setPlans(updatedPlans); setAddingPlan(false); }}
        />
      )}

      <PlanDetailSheet
        plan={selectedPlan}
        onClose={() => setSelectedPlan(null)}
        onDelete={planId => { handleDeletePlan(planId); setSelectedPlan(null); }}
      />
    </View>
  );
}
