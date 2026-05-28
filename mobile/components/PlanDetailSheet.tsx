import React from 'react';
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
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import Icon from './Icon';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';
import {colors, radii, spacing, typography} from '../theme';

type Props = {
  plan: Plan | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

function DetailRow({icon, label, value}: {icon: string; label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={18} color={colors.textSecondary}/>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function LinkRow({icon, label, url}: {icon: string; label: string; url: string}) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      <Icon name={icon} size={18} color={colors.textSecondary}/>
      <Text style={styles.linkLabel}>{label}</Text>
      <Icon name="arrow-up-right" size={16} color={colors.textTertiary}/>
    </TouchableOpacity>
  );
}

export default function PlanDetailSheet({plan, onClose, onDelete}: Props) {
  if (!plan) return null;

  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur = fmtDuration(plan.start_datetime, plan.end_datetime);

  const d = plan.details ?? {};
  const address = d.address as string | undefined;
  const phone = d.phone as string | undefined;
  const hours = d.hours as string | undefined;
  const url = d.url as string | undefined;

  return (
    <Modal visible={!!plan} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <View style={styles.hero}>
              <LinearGradient colors={[meta.color, '#1a1a2e']} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
              {/* Close button */}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Icon name="x" size={18} color={colors.surface} stroke={2}/>
              </TouchableOpacity>
              {/* Type badge */}
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{plan.type}</Text>
              </View>
              {/* Title overlay */}
              <View style={styles.heroContent}>
                <Text style={styles.heroTime}>
                  {time}{dur ? `  ·  ${dur}` : ''}
                </Text>
                <Text style={styles.heroTitle}>{plan.title}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              {address && (
                <TouchableOpacity
                  style={styles.actionPrimary}
                  onPress={() => Linking.openURL(`maps://?q=${encodeURIComponent(address)}`)}
                  activeOpacity={0.8}>
                  <Icon name="map-pin" size={16} color={colors.surface}/>
                  <Text style={styles.actionPrimaryText}>Directions</Text>
                </TouchableOpacity>
              )}
              {phone && (
                <TouchableOpacity
                  style={styles.actionSecondary}
                  onPress={() => Linking.openURL(`tel:${phone}`)}
                  activeOpacity={0.8}>
                  <Icon name="share" size={16} color={colors.textPrimary}/>
                  <Text style={styles.actionSecondaryText}>Call</Text>
                </TouchableOpacity>
              )}
              {url && (
                <TouchableOpacity
                  style={styles.actionSecondary}
                  onPress={() => Linking.openURL(url)}
                  activeOpacity={0.8}>
                  <Icon name="globe" size={16} color={colors.textPrimary}/>
                  <Text style={styles.actionSecondaryText}>Site</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Detail rows */}
            {(address || hours || phone) && (
              <View style={styles.detailSection}>
                {address && <DetailRow icon="map-pin" label="Address" value={address} />}
                {hours && <DetailRow icon="clock" label="Hours" value={hours} />}
                {phone && <DetailRow icon="share" label="Phone" value={phone} />}
              </View>
            )}

            {/* Link rows */}
            <View style={styles.linkSection}>
              {url && <LinkRow icon="globe" label={url.replace(/^https?:\/\//, '')} url={url} />}
              <LinkRow
                icon="calendar"
                label="Add to calendar"
                url={`calshow:${new Date(plan.start_datetime ?? '').getTime() / 1000}`}
              />
            </View>

            {/* Bottom actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
                <Icon name="edit" size={16} color={colors.textPrimary}/>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => { onDelete(plan.id); onClose(); }}
                activeOpacity={0.7}>
                <Icon name="x" size={16} color={colors.danger}/>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)'},
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 0,
    position: 'absolute', top: 0, zIndex: 10,
  },

  // Hero
  hero: {height: 220, justifyContent: 'flex-end'},
  closeBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 32, height: 32, borderRadius: radii.chip,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  typeBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radii.chip, paddingHorizontal: 10, paddingVertical: 4,
    zIndex: 2,
  },
  typeBadgeText: {fontSize: typography.sm, color: colors.surface, fontWeight: typography.medium},
  heroContent: {padding: spacing.xl, zIndex: 1},
  heroTime: {fontSize: typography.bodySmall, color: 'rgba(255,255,255,0.8)', marginBottom: 4},
  heroTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.surface,
    letterSpacing: -0.2,
  },

  // Actions
  actions: {
    flexDirection: 'row', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.xl,
  },
  actionPrimary: {
    flex: 1, backgroundColor: colors.accent,
    borderRadius: radii.md, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.sm,
  },
  actionPrimaryText: {fontSize: typography.base, color: colors.surface, fontWeight: typography.medium},
  actionSecondary: {
    paddingHorizontal: spacing.xl, paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.sm,
  },
  actionSecondaryText: {fontSize: typography.base, color: colors.textPrimary},

  // Detail rows
  detailSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    gap: spacing.lg,
  },
  detailLabel: {
    flex: 1, fontSize: typography.base,
    color: colors.textSecondary,
  },
  detailValue: {fontSize: typography.base, color: colors.textPrimary, textAlign: 'right', flex: 1},

  // Link rows
  linkSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    gap: spacing.lg,
  },
  linkLabel: {flex: 1, fontSize: typography.base, color: colors.textPrimary},

  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    marginTop: spacing.xl,
    paddingBottom: 34,
  },
  editBtn: {
    flex: 1, paddingVertical: spacing.xl,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border,
    flexDirection: 'row', gap: spacing.sm,
  },
  editBtnText: {fontSize: typography.base, color: colors.textPrimary},
  removeBtn: {
    flex: 1, paddingVertical: spacing.xl,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: spacing.sm,
  },
  removeBtnText: {fontSize: typography.base, color: colors.danger},
});
