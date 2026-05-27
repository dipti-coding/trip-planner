import React from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {TYPE_META, DEFAULT_META} from '../assets/planTypes';
import type {Plan} from '../types';
import {fmtTime, fmtDuration} from '../utils/dates';
import {colors, coverGradient, radii, spacing, typography} from '../theme';

type Props = {
  plan: Plan | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

function DetailRow({icon, label, value}: {icon: string; label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function LinkRow({icon, label, url}: {icon: string; label: string; url: string}) {
  return (
    <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(url)} activeOpacity={0.7}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.linkArrow}>↗</Text>
    </TouchableOpacity>
  );
}

export default function PlanDetailSheet({plan, onClose, onDelete}: Props) {
  if (!plan) return null;

  const meta = TYPE_META[plan.type] ?? DEFAULT_META;
  const time = fmtTime(plan.start_datetime);
  const dur = fmtDuration(plan.start_datetime, plan.end_datetime);
  const heroGradient = coverGradient(plan.title);

  const d = plan.details ?? {};
  const address = d.address as string | undefined;
  const phone = d.phone as string | undefined;
  const hours = d.hours as string | undefined;
  const url = d.url as string | undefined;

  return (
    <Modal visible={!!plan} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
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
                <Text style={styles.closeBtnText}>×</Text>
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
                  <Text style={styles.actionPrimaryText}>🧭 Directions</Text>
                </TouchableOpacity>
              )}
              {phone && (
                <TouchableOpacity
                  style={styles.actionSecondary}
                  onPress={() => Linking.openURL(`tel:${phone}`)}
                  activeOpacity={0.8}>
                  <Text style={styles.actionSecondaryText}>📞 Call</Text>
                </TouchableOpacity>
              )}
              {url && (
                <TouchableOpacity
                  style={styles.actionSecondary}
                  onPress={() => Linking.openURL(url)}
                  activeOpacity={0.8}>
                  <Text style={styles.actionSecondaryText}>🌐 Site</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Detail rows */}
            {(address || hours || phone) && (
              <View style={styles.detailSection}>
                {address && <DetailRow icon="📍" label="Address" value={address} />}
                {hours && <DetailRow icon="🕐" label="Hours" value={hours} />}
                {phone && <DetailRow icon="📞" label="Phone" value={phone} />}
              </View>
            )}

            {/* Link rows */}
            <View style={styles.linkSection}>
              {url && <LinkRow icon="🌐" label={url.replace(/^https?:\/\//, '')} url={url} />}
              <LinkRow
                icon="📅"
                label="Add to calendar"
                url={`calshow:${new Date(plan.start_datetime ?? '').getTime() / 1000}`}
              />
            </View>

            {/* Bottom actions */}
            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
                <Text style={styles.editBtnText}>✏  Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => { onDelete(plan.id); onClose(); }}
                activeOpacity={0.7}>
                <Text style={styles.removeBtnText}>✕  Remove</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
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
  closeBtnText: {fontSize: 20, color: colors.surface, lineHeight: 24},
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
  },
  actionPrimaryText: {fontSize: typography.base, color: colors.surface, fontWeight: typography.medium},
  actionSecondary: {
    paddingHorizontal: spacing.xl, paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
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
  detailIcon: {fontSize: typography.lg, width: 22},
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
  linkArrow: {fontSize: typography.base, color: colors.textTertiary},

  // Bottom actions
  bottomActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    marginTop: spacing.xl,
  },
  editBtn: {
    flex: 1, paddingVertical: spacing.xl,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border,
  },
  editBtnText: {fontSize: typography.base, color: colors.textPrimary},
  removeBtn: {
    flex: 1, paddingVertical: spacing.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: {fontSize: typography.base, color: colors.danger},
});
