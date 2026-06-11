import React, {useMemo} from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from './Icon';
import {useTheme} from '../context/ThemeContext';
import type {Plan} from '../types';
import {fmtTime} from '../utils/dates';
import {getPlanLines, getDetailRows, getMapsQuery} from '../utils/planLines';
import {radii, spacing, typography} from '../theme';

type Props = {
  plan: Plan | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (plan: Plan) => void;
};

export default function PlanDetailSheet({plan, onClose, onDelete, onEdit}: Props) {
  const {theme, colors, glass, primary, typeMeta, defaultMeta} = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    overlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: glass.modalBg},
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      maxHeight: '88%', overflow: 'hidden',
    },
    hero:      {height: 220, justifyContent: 'flex-end'},
    watermark: {position: 'absolute', right: 20, bottom: 20, opacity: 1},
    handle: {
      position: 'absolute', top: 12, alignSelf: 'center',
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: glass.textTertiary,
      zIndex: 2, left: '50%', marginLeft: -18,
    },
    heroTopRow: {
      position: 'absolute', top: 16, left: 16, right: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 2,
    },
    closeBtn: {
      width: 32, height: 32, borderRadius: radii.chip,
      backgroundColor: glass.closeBtnBg, alignItems: 'center', justifyContent: 'center',
    },
    typeChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: glass.chipBg, borderRadius: radii.chip,
      paddingHorizontal: 10, paddingVertical: 4, borderWidth: 0.5,
    },
    typeChipText: {fontSize: typography.sm, fontWeight: typography.semibold},
    heroContent:  {padding: spacing.xl, zIndex: 1},
    heroTime:     {fontSize: typography.bodySmall, color: colors.textSecondary, marginBottom: 4},
    heroHeading:  {fontSize: 26, fontWeight: typography.semibold, color: colors.textPrimary, letterSpacing: -0.3, lineHeight: 32},
    heroCompany:  {fontSize: typography.base, color: colors.textSecondary, marginTop: 4},
    actions: {
      flexDirection: 'row', gap: spacing.md,
      paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md,
    },
    actionPrimary: {
      flex: 1, backgroundColor: colors.accent,
      borderRadius: radii.xl, paddingVertical: 12,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: spacing.sm,
    },
    actionPrimaryText: {fontSize: typography.base, color: glass.textPrimary, fontWeight: typography.medium},
    detailCard: {
      marginHorizontal: spacing.xl, marginTop: spacing.xl,
      backgroundColor: colors.surface, borderRadius: radii.row,
      borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    detailRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 13, paddingHorizontal: spacing.xl,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: spacing.lg,
    },
    detailRowFirst:    {borderTopWidth: 0},
    detailLabel:       {width: 104, fontSize: typography.bodySmall, color: colors.textSecondary, flexShrink: 0},
    detailValue:       {flex: 1, fontSize: typography.bodySmall, color: colors.textPrimary, fontWeight: typography.medium, textAlign: 'right'},
    detailValueMono:   {fontFamily: typography.fontMono, letterSpacing: 0.3},
    linkSection:       {marginHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.sm},
    linkRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
      backgroundColor: colors.surface, borderRadius: radii.xl,
      borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12,
    },
    linkIcon: {
      width: 22, height: 22, borderRadius: 6,
      backgroundColor: colors.bgBase3, alignItems: 'center', justifyContent: 'center',
    },
    linkLabel:     {flex: 1, fontSize: typography.base, fontWeight: typography.medium, color: colors.textPrimary},
    bottomActions: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
      marginTop: spacing.xl, paddingBottom: 34,
    },
    bottomBtn:     {flex: 1, paddingVertical: spacing.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm},
    bottomDivider: {width: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 8},
    bottomBtnText: {fontSize: typography.base, color: colors.textPrimary},
  }), [theme]);

  if (!plan) return null;

  const meta      = typeMeta[plan.type] ?? defaultMeta;
  const time      = fmtTime(plan.start_datetime);
  const {heading, company} = getPlanLines(plan);
  const rows      = getDetailRows(plan);
  const mapsQuery = getMapsQuery(plan);
  const meetingLink = (plan.details as Record<string, any>).meeting_link as string | undefined;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <LinearGradient
                colors={[primary['700'], primary['50']]}
                start={{x: 0, y: 0}}
                end={{x: 0, y: 1}}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.watermark} pointerEvents="none">
                <Icon name={meta.icon} size={84} color={glass.watermark}/>
              </View>
              <View style={styles.handle}/>
              <View style={styles.heroTopRow}>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Icon name="x" size={18} color={glass.textPrimary} stroke={2}/>
                </TouchableOpacity>
                <View style={[styles.typeChip, {borderColor: glass.chipBorder}]}>
                  <Icon name={meta.icon} size={12} color={meta.color}/>
                  <Text style={[styles.typeChipText, {color: meta.color}]}>{plan.type}</Text>
                </View>
              </View>
              <View style={styles.heroContent}>
                {time ? (
                  <Text style={styles.heroTime}>{time}</Text>
                ) : null}
                <Text style={styles.heroHeading} numberOfLines={2}>{heading}</Text>
                {company ? <Text style={styles.heroCompany} numberOfLines={1}>{company}</Text> : null}
              </View>
            </View>

            {(mapsQuery || meetingLink) ? (
              <View style={styles.actions}>
                {mapsQuery ? (
                  <TouchableOpacity
                    style={styles.actionPrimary}
                    onPress={() => Linking.openURL(`maps://?q=${encodeURIComponent(mapsQuery)}`)}
                    activeOpacity={0.8}>
                    <Icon name="map-pin" size={16} color={glass.textPrimary}/>
                    <Text style={styles.actionPrimaryText}>Directions</Text>
                  </TouchableOpacity>
                ) : null}
                {meetingLink ? (
                  <TouchableOpacity
                    style={styles.actionPrimary}
                    onPress={() => Linking.openURL(meetingLink)}
                    activeOpacity={0.8}>
                    <Icon name="globe" size={16} color={glass.textPrimary}/>
                    <Text style={styles.actionPrimaryText}>Join</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {rows.length > 0 ? (
              <View style={styles.detailCard}>
                {rows.map((row, i) => (
                  <View key={i} style={[styles.detailRow, i === 0 && styles.detailRowFirst]}>
                    <Icon name={row.icon} size={16} color={colors.textTertiary}/>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={[styles.detailValue, row.mono && styles.detailValueMono]} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.linkSection}>
              {plan.start_datetime ? (
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => Linking.openURL(`calshow:${new Date(plan.start_datetime!).getTime() / 1000}`)}
                  activeOpacity={0.7}>
                  <View style={styles.linkIcon}>
                    <Icon name="calendar" size={14} color={colors.textSecondary}/>
                  </View>
                  <Text style={styles.linkLabel}>Add to calendar</Text>
                  <Icon name="arrow-up-right" size={15} color={colors.textTertiary}/>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.bottomBtn} onPress={() => { onEdit(plan); onClose(); }} activeOpacity={0.7}>
                <Icon name="edit" size={16} color={colors.textPrimary}/>
                <Text style={styles.bottomBtnText}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.bottomDivider}/>
              <TouchableOpacity
                style={styles.bottomBtn}
                onPress={() => { onDelete(plan.id); onClose(); }}
                activeOpacity={0.7}>
                <Icon name="x" size={16} color={colors.danger}/>
                <Text style={[styles.bottomBtnText, {color: colors.danger}]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
