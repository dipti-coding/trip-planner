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
import {DestinationCover} from '../components/DestinationCovers';
import {PlaneSpinner} from '../components/Spinner';
import {useTheme} from '../context/ThemeContext';
import type {Trip} from '../types';
import {dayCount, fmtShort, tripStatus} from '../utils/dates';
import type {RootStackParamList} from '../App';
import {radii, spacing, typography} from '../theme';
import {findDestination, searchDestinations} from '../utils/destinations';
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
  return Math.floor((Date.now() - start.getTime()) / 86400000);
}

function StatusBadge({trip}: {trip: TripWithStatus}) {
  const {theme, colors, glass} = useTheme();
  const s = useMemo(() => StyleSheet.create({
    badgeCurrent:     {flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.successSubtle},
    badgeFuture:      {borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: glass.coverBadgeBg},
    badgePast:        {borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: glass.coverBadgeBg},
    badgeDot:         {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success},
    badgeTextCurrent: {fontSize: typography.sm, fontWeight: typography.medium, color: colors.success},
    badgeTextFuture:  {fontSize: typography.sm, fontWeight: typography.medium, color: glass.activePillText},
    badgeTextPast:    {fontSize: typography.sm, fontWeight: typography.medium, color: glass.activePillText},
  }), [theme]);

  if (trip.status === 'current') {
    const day = daysSince(trip.start_date) + 1;
    return (
      <View style={s.badgeCurrent}>
        <View style={s.badgeDot}/>
        <Text style={s.badgeTextCurrent}>In progress · Day {day}</Text>
      </View>
    );
  }
  if (trip.status === 'future') {
    const daysAway = Math.ceil((new Date(trip.start_date).getTime() - Date.now()) / 86400000);
    return (
      <View style={s.badgeFuture}>
        <Text style={s.badgeTextFuture}>In {daysAway} days</Text>
      </View>
    );
  }
  return (
    <View style={s.badgePast}>
      <Text style={s.badgeTextPast}>Past</Text>
    </View>
  );
}

function TripCard({trip, onPress}: {trip: TripWithStatus; onPress: () => void}) {
  const {theme, colors, glass, tripTint} = useTheme();
  const days = dayCount(trip.start_date, trip.end_date);
  const dest = findDestination(trip.destination_city);
  const tint = tripTint(trip.id);
  const pct  = trip.percent_planned;

  const s = useMemo(() => StyleSheet.create({
    tripCard:      {backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.lg},
    cover:         {height: 140, overflow: 'hidden'},
    coverTop:      {position: 'absolute', top: 12, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1},
    coverTitleBlock: {flex: 1, minWidth: 0},
    coverDest:     {fontSize: typography.xs + 1, fontWeight: typography.medium, letterSpacing: 0.4, color: glass.coverText},
    coverTitle:    {fontSize: typography['2xl'], fontWeight: typography.semibold, color: glass.textPrimary, letterSpacing: -0.2, marginTop: 2},
    coverBottom:   {position: 'absolute', bottom: 10, left: 14, right: 14, zIndex: 1},
    coverDateRange: {fontSize: typography.bodySmall, color: glass.coverText},
    cardBottom:    {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 10, gap: spacing.lg},
    metaItem:      {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
    metaText:      {fontSize: typography.bodySmall, color: colors.textSecondary},
    progressWrap:  {marginLeft: 'auto', alignItems: 'flex-end', gap: 3},
    progressTrack: {width: 80, height: 3, borderRadius: radii.sm, backgroundColor: colors.borderStrong, overflow: 'hidden'},
    progressBar:   {height: 3, backgroundColor: colors.accent, borderRadius: radii.sm},
    progressLabel: {fontSize: typography.xs, color: colors.textTertiary},
  }), [theme]);

  return (
    <TouchableOpacity style={s.tripCard} onPress={onPress} activeOpacity={0.85}>
      <View style={s.cover}>
        <DestinationCover type={dest?.type ?? 'other'}/>
        <View style={[StyleSheet.absoluteFill, {backgroundColor: tint, opacity: 0.18}]}/>
        <LinearGradient colors={glass.cardScrim} locations={[0, 0.4, 0.6, 1]} style={StyleSheet.absoluteFill}/>
        <View style={s.coverTop}>
          <View style={s.coverTitleBlock}>
            <Text style={s.coverDest} numberOfLines={1}>{trip.destination_city.toUpperCase()}</Text>
            <Text style={s.coverTitle} numberOfLines={1}>{trip.name}</Text>
          </View>
          <StatusBadge trip={trip}/>
        </View>
        <View style={s.coverBottom}>
          <Text style={s.coverDateRange}>{fmtShort(trip.start_date)} – {fmtShort(trip.end_date)}</Text>
        </View>
      </View>
      <View style={s.cardBottom}>
        <View style={s.metaItem}><Icon name="calendar" size={13} color={colors.textSecondary}/><Text style={s.metaText}>{days} days</Text></View>
        <View style={s.metaItem}><Icon name="map-pin" size={13} color={colors.textSecondary}/><Text style={s.metaText}>{trip.plan_count} plan{trip.plan_count !== 1 ? 's' : ''}</Text></View>
        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <View style={[s.progressBar, {width: `${pct}%`}]}/>
          </View>
          <Text style={s.progressLabel}>{pct}% planned</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Add Trip Wizard ─────────────────────────────────────────────────────────

type AddTripStep = 'destination' | 'dates' | 'confirm';
type SelectedDest = {city: string; country: string; dest: Destination | null};

function StepIndicator({total, current}: {total: number; current: number}) {
  const {theme, colors} = useTheme();
  const s = useMemo(() => StyleSheet.create({
    row:    {flex: 1, flexDirection: 'row', gap: 4, marginHorizontal: spacing.lg},
    bar:    {flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.bgBase3},
    active: {backgroundColor: colors.accent},
  }), [theme]);
  return (
    <View style={s.row}>
      {Array.from({length: total}).map((_, i) => (
        <View key={i} style={[s.bar, i <= current && s.active]}/>
      ))}
    </View>
  );
}

function CalendarPicker({onRange}: {onRange: (s: string | null, e: string | null) => void}) {
  const {theme, colors, glass} = useTheme();
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd]     = useState<string | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const months = Array.from({length: 12}, (_, o) => new Date(today.getFullYear(), today.getMonth() + o, 1));

  const s = useMemo(() => StyleSheet.create({
    month:       {marginBottom: spacing.xl},
    monthLabel:  {fontSize: typography.base, fontWeight: typography.semibold, color: colors.textPrimary, marginBottom: spacing.md},
    dowRow:      {flexDirection: 'row', marginBottom: spacing.sm},
    dow:         {flex: 1, textAlign: 'center', fontSize: typography.bodySmall, color: colors.textTertiary},
    week:        {flexDirection: 'row', marginBottom: 2},
    cell:        {flex: 1, height: 36, alignItems: 'center', justifyContent: 'center'},
    cellInRange: {backgroundColor: colors.accentSubtle},
    cellEdge:    {backgroundColor: colors.accent, borderRadius: radii.chip},
    dayText:     {fontSize: typography.base, color: colors.textPrimary},
    dayPast:     {color: colors.textTertiary},
    dayEdge:     {color: glass.textPrimary, fontWeight: typography.semibold},
  }), [theme]);

  function toKey(d: Date) { return d.toISOString().slice(0, 10); }

  function handleDay(key: string) {
    if (!start || (start && end)) { setStart(key); setEnd(null); onRange(key, null); }
    else if (key < start) { setStart(key); setEnd(null); onRange(key, null); }
    else { setEnd(key); onRange(start, key); }
  }

  function renderMonth(base: Date) {
    const year = base.getFullYear(), month = base.getMonth();
    const label = base.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(toKey(new Date(year, month, d)));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return (
      <View key={label} style={s.month}>
        <Text style={s.monthLabel}>{label}</Text>
        <View style={s.dowRow}>
          {['S','M','T','W','T','F','S'].map((d, i) => <Text key={i} style={s.dow}>{d}</Text>)}
        </View>
        {weeks.map((week, wi) => (
          <View key={wi} style={s.week}>
            {week.map((key, di) => {
              if (!key) return <View key={di} style={s.cell}/>;
              const isPast = key < toKey(today);
              const isEdge = key === start || key === end;
              const inRange = start && end && key > start && key < end;
              return (
                <TouchableOpacity key={di} style={[s.cell, inRange && s.cellInRange, isEdge && s.cellEdge]} onPress={() => !isPast && handleDay(key)} disabled={isPast} activeOpacity={0.7}>
                  <Text style={[s.dayText, isPast && s.dayPast, isEdge && s.dayEdge]}>{parseInt(key.slice(8), 10)}</Text>
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

function AddTripWizard({visible, onClose, onCreated}: {visible: boolean; onClose: () => void; onCreated: (trip: Trip) => void}) {
  const {theme, colors, glass} = useTheme();
  const [step, setStep]           = useState<AddTripStep>('destination');
  const [dests, setDests]         = useState<SelectedDest[]>([]);
  const [destSearch, setDestSearch] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate]     = useState<string | null>(null);
  const [tripName, setTripName]   = useState('');
  const [creating, setCreating]   = useState(false);

  const s = useMemo(() => StyleSheet.create({
    overlay:    {flex: 1, justifyContent: 'flex-end', backgroundColor: glass.modalBg},
    sheet:      {backgroundColor: colors.bgBase, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', flex: 1},
    handle:     {width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 4},
    nav:        {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md},
    closeBtn:   {width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgBase3, alignItems: 'center', justifyContent: 'center'},
    backBtn:    {flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 56},
    backBtnText: {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
    navSpacer:  {minWidth: 56},
    scroll:     {paddingHorizontal: spacing.xl, paddingBottom: spacing.xl},
    footer:     {paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing['2xl'], backgroundColor: colors.bgBase},
    title:      {fontSize: typography['3xl'], fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.3, marginBottom: 4, marginTop: spacing.md},
    sub:        {fontSize: typography.base, color: colors.textSecondary, marginBottom: spacing.xl},
    destChips:  {marginBottom: spacing.lg, gap: spacing.sm},
    destChip:   {flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radii.row, padding: spacing.md, borderWidth: 1, borderColor: colors.borderStrong},
    destChipThumb: {width: 28, height: 28, borderRadius: radii.md, overflow: 'hidden'},
    destChipText: {flex: 1, fontSize: typography.base, color: colors.textPrimary},
    destChipRmv: {padding: spacing.xs},
    searchWrap: {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radii.xl, marginBottom: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: 10, gap: spacing.md, borderWidth: 1, borderColor: colors.border},
    searchInput: {flex: 1, fontSize: typography.md, color: colors.textPrimary},
    sectionLabel: {fontSize: typography.xs + 1, fontWeight: typography.medium, letterSpacing: 0.32, textTransform: 'uppercase', color: colors.textTertiary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, marginBottom: spacing.xs},
    destRow:    {flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radii.row, borderWidth: 1, borderColor: colors.borderStrong, marginBottom: spacing.sm},
    destThumb:  {width: 44, height: 44, borderRadius: radii.lg, overflow: 'hidden'},
    destInfo:   {flex: 1},
    destCity:   {fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
    destCountry: {fontSize: typography.bodySmall, color: colors.textSecondary},
    confirmCard: {backgroundColor: colors.surface, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.borderStrong, padding: spacing.xl, marginBottom: spacing.xl, gap: spacing.sm},
    confirmLabel: {fontSize: typography.xs + 1, fontWeight: typography.medium, letterSpacing: 0.32, textTransform: 'uppercase', color: colors.textTertiary, marginBottom: 2},
    confirmValue: {fontSize: typography.base, color: colors.textPrimary},
    confirmValueBold: {fontWeight: typography.semibold, color: colors.textPrimary},
    confirmDivider: {height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm},
    fieldLabel: {fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm},
    nameInput:  {borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md, fontSize: typography.base, color: colors.textPrimary, marginBottom: spacing.xl},
    primaryBtn: {backgroundColor: colors.accent, borderRadius: radii.xl, paddingVertical: 14, alignItems: 'center', marginBottom: spacing.md},
    primaryBtnDisabled: {opacity: 0.4},
    primaryBtnText: {fontSize: typography.md, fontWeight: typography.semibold, color: glass.textPrimary},
    skipBtn:    {alignItems: 'center', paddingVertical: spacing.md},
    skipBtnText: {fontSize: typography.base, color: colors.textSecondary},
  }), [theme]);

  function reset() { setStep('destination'); setDests([]); setDestSearch(''); setStartDate(null); setEndDate(null); setTripName(''); setCreating(false); }
  function handleClose() { reset(); onClose(); }
  function toggleDest(d: SelectedDest) {
    setDests(prev => prev.some(x => x.city === d.city) ? prev.filter(x => x.city !== d.city) : [...prev, d]);
  }
  const defaultName = dests.length > 0 ? dests[0].city : 'My trip';

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
    } catch { Alert.alert('Error', 'Could not create trip. Please try again.'); }
    finally { setCreating(false); }
  }

  const searchResults = useMemo(() => searchDestinations(destSearch, 20), [destSearch]);
  const stepIndex = step === 'destination' ? 0 : step === 'dates' ? 1 : 2;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={s.overlay} onPress={handleClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.handle}/>
          <View style={s.nav}>
            {step === 'destination' ? (
              <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
                <Icon name="x" size={14} color={colors.textPrimary} stroke={2.5}/>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setStep(step === 'confirm' ? 'dates' : 'destination')} style={s.backBtn}>
                <Icon name="chev-left" size={18} color={colors.textPrimary} stroke={2}/>
                <Text style={s.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <StepIndicator total={3} current={stepIndex}/>
            <View style={s.navSpacer}/>
          </View>

          {step === 'destination' && (
            <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView style={{flex: 1}} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={s.title}>Where to?</Text>
                <Text style={s.sub}>Add one or more destinations.</Text>
                {dests.length > 0 && (
                  <View style={s.destChips}>
                    {dests.map((d, i) => (
                      <View key={d.city} style={s.destChip}>
                        <View style={s.destChipThumb}><DestinationCover type={d.dest?.type ?? 'other'}/></View>
                        <Text style={s.destChipText}>Stop {i + 1} · {d.city}</Text>
                        <TouchableOpacity onPress={() => toggleDest(d)} style={s.destChipRmv}>
                          <Icon name="x" size={14} color={colors.textTertiary} stroke={2}/>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <View style={s.searchWrap}>
                  <Icon name="search" size={16} color={colors.textTertiary}/>
                  <TextInput style={s.searchInput} placeholder={dests.length > 0 ? 'Add another stop' : 'City, country or region'} placeholderTextColor={colors.textTertiary} value={destSearch} onChangeText={setDestSearch}/>
                </View>
                <Text style={s.sectionLabel}>{destSearch.trim() ? 'RESULTS' : 'TOP DESTINATIONS'}</Text>
                {searchResults.map(item => {
                  const selected = dests.some(d => d.city === item.name);
                  return (
                    <TouchableOpacity key={item.id} style={s.destRow} onPress={() => toggleDest({city: item.name, country: item.country, dest: item})} activeOpacity={0.7}>
                      <View style={s.destThumb}><DestinationCover type={item.type ?? 'other'}/></View>
                      <View style={s.destInfo}>
                        <Text style={s.destCity}>{item.name}</Text>
                        <Text style={s.destCountry}>{item.country}</Text>
                      </View>
                      {selected ? <Icon name="check" size={18} color={colors.success}/> : <Icon name="plus" size={18} color={colors.accent}/>}
                    </TouchableOpacity>
                  );
                })}
                {destSearch.trim().length > 0 && (
                  <TouchableOpacity style={s.destRow} onPress={() => toggleDest({city: destSearch.trim(), country: '', dest: null})} activeOpacity={0.7}>
                    <View style={s.destThumb}><DestinationCover type="city"/></View>
                    <View style={s.destInfo}>
                      <Text style={s.destCity}>Use "{destSearch.trim()}"</Text>
                      <Text style={s.destCountry}>Custom location</Text>
                    </View>
                    <Icon name="plus" size={18} color={colors.accent}/>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <View style={s.footer}>
                <TouchableOpacity style={[s.primaryBtn, dests.length === 0 && s.primaryBtnDisabled]} onPress={() => setStep('dates')} disabled={dests.length === 0}>
                  <Text style={s.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}

          {step === 'dates' && (
            <View style={{flex: 1}}>
              <ScrollView style={{flex: 1}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Text style={s.title}>When?</Text>
                <Text style={s.sub}>Tap a start date, then an end date.</Text>
                <CalendarPicker onRange={(st, e) => { setStartDate(st); setEndDate(e); }}/>
              </ScrollView>
              <View style={s.footer}>
                <TouchableOpacity style={[s.primaryBtn, (!startDate || !endDate) && s.primaryBtnDisabled]} onPress={() => setStep('confirm')} disabled={!startDate || !endDate}>
                  <Text style={s.primaryBtnText}>Continue</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('confirm')} style={s.skipBtn}>
                  <Text style={s.skipBtnText}>Skip dates</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'confirm' && (
            <View style={{flex: 1}}>
              <ScrollView style={{flex: 1}} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                <Text style={s.title}>Looks good?</Text>
                <Text style={s.sub}>We'll create an empty trip. You can add plans next.</Text>
                <View style={s.confirmCard}>
                  <Text style={s.confirmLabel}>DESTINATIONS</Text>
                  {dests.map((d, i) => (
                    <Text key={d.city} style={s.confirmValue}>
                      {i + 1}.{'  '}<Text style={s.confirmValueBold}>{d.city}</Text>{d.country ? `  ${d.country}` : ''}
                    </Text>
                  ))}
                  <View style={s.confirmDivider}/>
                  <Text style={s.confirmLabel}>DATES</Text>
                  <Text style={s.confirmValue}>
                    {startDate && endDate ? `${fmtShort(startDate)} – ${fmtShort(endDate)} · ${dayCount(startDate, endDate)} days` : 'No dates yet — add them later'}
                  </Text>
                </View>
                <Text style={s.fieldLabel}>Trip name (optional)</Text>
                <TextInput style={s.nameInput} placeholder={defaultName} placeholderTextColor={colors.textTertiary} value={tripName} onChangeText={setTripName}/>
              </ScrollView>
              <View style={s.footer}>
                <TouchableOpacity style={[s.primaryBtn, creating && s.primaryBtnDisabled]} onPress={handleCreate} disabled={creating}>
                  {creating ? <ActivityIndicator color={glass.textPrimary}/> : <Text style={s.primaryBtnText}>Create trip</Text>}
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
  const {theme, colors} = useTheme();
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [query, setQuery]       = useState('');
  const [addingTrip, setAddingTrip] = useState(false);

  const s = useMemo(() => StyleSheet.create({
    container:   {flex: 1, backgroundColor: colors.bgBase},
    centered:    {flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], backgroundColor: colors.bgBase},
    listContent: {paddingBottom: 40},
    header:      {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.xl},
    headerLeft:  {flex: 1},
    headerDate:  {fontSize: typography.bodySmall, color: colors.textSecondary},
    headerTitle: {fontSize: typography['3xl'], fontWeight: typography.bold, color: colors.textPrimary, letterSpacing: -0.32, marginTop: 2},
    addBtn:      {width: 38, height: 38, borderRadius: radii.xl, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center'},
    addBtnText:  {fontSize: typography['2xl'], color: colors.surface, fontWeight: typography.light, lineHeight: 28},
    searchWrap:  {flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgBase3, borderRadius: radii.xl, marginHorizontal: 20, marginBottom: 20, paddingHorizontal: spacing.lg, paddingVertical: 10, gap: spacing.md},
    searchInput: {flex: 1, fontSize: typography.md, color: colors.textPrimary},
    section:     {paddingHorizontal: 20, marginBottom: spacing['2xl']},
    sectionLabel: {fontSize: typography.xs + 1, fontWeight: typography.medium, letterSpacing: 0.32, textTransform: 'uppercase', color: colors.textTertiary, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, marginBottom: spacing.xs},
    errorText:   {fontSize: typography.md, color: colors.danger, textAlign: 'center'},
    hintText:    {fontSize: typography.bodySmall, color: colors.textTertiary, marginTop: spacing.md, textAlign: 'center'},
    emptyText:   {fontSize: typography.lg, color: colors.textSecondary, fontWeight: typography.medium},
  }), [theme]);

  useEffect(() => {
    client.get<Trip[]>('/trips')
      .then(r => setTrips(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    return navigation.addListener('focus', () => {
      client.get<Trip[]>('/trips').then(r => setTrips(r.data)).catch(() => {});
    });
  }, [navigation]);

  const sections = useMemo(() => {
    const q = query.toLowerCase();
    const withStatus: TripWithStatus[] = trips.map(t => ({...t, status: tripStatus(t.start_date, t.end_date)}));
    const filtered = q ? withStatus.filter(t => t.name.toLowerCase().includes(q) || t.destination_city.toLowerCase().includes(q)) : withStatus;
    const current = filtered.filter(t => t.status === 'current');
    const future  = filtered.filter(t => t.status === 'future');
    const past    = filtered.filter(t => t.status === 'past');
    return [
      ...(current.length ? [{label: 'HAPPENING NOW',            data: current}] : []),
      ...(future.length  ? [{label: `UPCOMING · ${future.length}`, data: future}]  : []),
      ...(past.length    ? [{label: 'MEMORIES',                  data: past}]    : []),
    ];
  }, [trips, query]);

  if (loading) return <SafeAreaView style={s.centered}><PlaneSpinner/></SafeAreaView>;
  if (error)   return (
    <SafeAreaView style={s.centered}>
      <Text style={s.errorText}>{error}</Text>
      <Text style={s.hintText}>Make sure the API is running: just up</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerDate}>{new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'})}</Text>
          <Text style={s.headerTitle}>Trips</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setAddingTrip(true)} activeOpacity={0.8}>
          <Text style={s.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <Icon name="search" size={16} color={colors.textTertiary}/>
        <TextInput style={s.searchInput} placeholder="Search trips, places, plans" placeholderTextColor={colors.textTertiary} value={query} onChangeText={setQuery}/>
      </View>

      <FlatList
        data={sections}
        keyExtractor={sec => sec.label}
        contentContainerStyle={s.listContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        renderItem={({item: section}) => (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{section.label}</Text>
            {section.data.map(trip => (
              <TripCard key={trip.id} trip={trip} onPress={() => navigation.navigate('TripDetail', {tripId: trip.id, tripName: trip.name})}/>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.centered}>
            <Text style={s.emptyText}>No trips yet</Text>
            <Text style={s.hintText}>Tap + to plan your first trip</Text>
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
