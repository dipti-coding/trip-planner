import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import {launchImageLibrary} from 'react-native-image-picker';
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

function DayView({date, plans, onDeletePlan}: {date: string; plans: Plan[]; onDeletePlan: (id: string) => void}) {
  return (
    <View style={styles.dayView}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayHeaderDate}>{fmtDow(date)}</Text>
        <Text style={styles.dayHeaderCount}>
          {plans.length} plan{plans.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.planList}>
        {plans.map(p => <PlanCard key={p.id} plan={p} onDelete={() => onDeletePlan(p.id)} />)}
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

  const [addingPlan, setAddingPlan] = useState(false);
  const [inputMode, setInputMode] = useState<'paste' | 'screenshot'>('paste');
  const [rawText, setRawText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const closeModal = () => {
    setAddingPlan(false);
    setInputMode('paste');
    setRawText('');
    setImageUri(null);
    setParseError(null);
  };

  const pickScreenshot = () => {
    launchImageLibrary({mediaType: 'photo', quality: 1}, response => {
      if (response.errorCode === 'permission') {
        Alert.alert(
          'Photo Access Required',
          'Go to Settings > TripPlanner > Photos and select "All Photos" to pick screenshots.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      }
      if (response.assets?.[0]?.uri) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

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

  const handleParseAndCreate = async () => {
    if (inputMode === 'paste' && !rawText.trim()) return;
    if (inputMode === 'screenshot' && !imageUri) return;
    setSubmitting(true);
    setParseError(null);
    try {
      if (inputMode === 'paste') {
        await client.post(`/trips/${tripId}/plans/parse-and-create`, {raw_text: rawText});
      } else {
        const form = new FormData();
        form.append('image', {uri: imageUri, name: 'screenshot.jpg', type: 'image/jpeg'} as any);
        await client.post(`/trips/${tripId}/plans/parse-screenshot`, form, {
          headers: {'Content-Type': 'multipart/form-data'},
        });
      }
      const plansRes = await client.get<Plan[]>(`/trips/${tripId}/plans`);
      setPlans(plansRes.data);
      closeModal();
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      setParseError(
        typeof detail === 'string'
          ? detail
          : 'Could not detect plan type. Try pasting more of the confirmation details.',
      );
    } finally {
      setSubmitting(false);
    }
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
        <DayView date={activeDate} plans={dayPlans} onDeletePlan={handleDeletePlan} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setAddingPlan(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>Add Plan</Text>
      </TouchableOpacity>

      <Modal visible={addingPlan} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={{flex: 1}} onPress={closeModal} activeOpacity={1} />
            <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add Plan</Text>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, inputMode === 'paste' && styles.tabActive]}
                onPress={() => { setInputMode('paste'); setImageUri(null); }}>
                <Text style={[styles.tabText, inputMode === 'paste' && styles.tabTextActive]}>Paste</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, inputMode === 'screenshot' && styles.tabActive]}
                onPress={() => { setInputMode('screenshot'); setRawText(''); }}>
                <Text style={[styles.tabText, inputMode === 'screenshot' && styles.tabTextActive]}>Screenshot</Text>
              </TouchableOpacity>
            </View>
            {inputMode === 'paste' ? (
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Your booking confirmation text..."
                placeholderTextColor="#a8a8a8"
                value={rawText}
                onChangeText={setRawText}
                autoFocus
                textAlignVertical="top"
              />
            ) : (
              <View style={styles.screenshotArea}>
                {imageUri && (
                  <Image source={{uri: imageUri}} style={styles.screenshotThumb} resizeMode="cover" />
                )}
                <TouchableOpacity style={styles.chooseBtn} onPress={pickScreenshot}>
                  <Text style={styles.chooseBtnText}>
                    {imageUri ? 'Change Screenshot' : 'Choose Screenshot'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {parseError ? <Text style={styles.parseError}>{parseError}</Text> : null}
            <TouchableOpacity
              style={[styles.parseBtn, (submitting || (inputMode === 'paste' ? !rawText.trim() : !imageUri)) && styles.parseBtnDisabled]}
              onPress={handleParseAndCreate}
              disabled={submitting || (inputMode === 'paste' ? !rawText.trim() : !imageUri)}
              activeOpacity={0.8}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.parseBtnText}>Add Plan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={closeModal} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    height: 48, borderRadius: 24, paddingHorizontal: 20,
    backgroundColor: '#0f62fe',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0f62fe',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  fabText: {fontSize: 15, color: '#fff', fontWeight: '600'},

  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: {fontSize: 18, fontWeight: '600', color: '#161616', marginBottom: 16},
  tabRow: {
    flexDirection: 'row', backgroundColor: '#f4f4f4',
    borderRadius: 10, padding: 3, marginBottom: 16,
  },
  tab: {flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8},
  tabActive: {backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2},
  tabText: {fontSize: 14, fontWeight: '500', color: '#8d8d8d'},
  tabTextActive: {color: '#161616', fontWeight: '600'},
  screenshotArea: {
    height: 160, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    backgroundColor: '#f4f4f4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, gap: 12,
  },
  screenshotThumb: {width: 80, height: 80, borderRadius: 8},
  chooseBtn: {
    borderWidth: 1, borderColor: '#0f62fe', borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 16,
  },
  chooseBtnText: {fontSize: 14, color: '#0f62fe', fontWeight: '500'},
  textInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 12, height: 160, fontSize: 14, color: '#161616',
    backgroundColor: '#f4f4f4', marginBottom: 12,
  },
  parseError: {fontSize: 13, color: '#da1e28', marginBottom: 12},
  parseBtn: {
    backgroundColor: '#0f62fe', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginBottom: 8,
  },
  parseBtnDisabled: {opacity: 0.45},
  parseBtnText: {fontSize: 15, fontWeight: '600', color: '#fff'},
  cancelBtn: {alignItems: 'center', paddingVertical: 10},
  cancelText: {fontSize: 15, color: '#525252'},

  errorText: {fontSize: 15, color: '#da1e28', textAlign: 'center'},
  backLink: {fontSize: 15, color: '#0f62fe', marginTop: 12},
});
