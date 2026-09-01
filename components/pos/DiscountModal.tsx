import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/theme/ThemeProvider';
import { discountRules, radius, shadow, space, type Palette } from '@/constants/theme';
import { formatCurrency } from '@/lib/demo-data';
import type { DiscountType, OrderDiscount } from '@/types';

const TYPE_OPTIONS: { id: DiscountType; label: string }[] = [
  { id: 'percent', label: 'Porcentaje' },
  { id: 'fixed', label: 'Monto fijo' },
  { id: 'comp', label: 'Cortesía total' },
];

const PERCENT_SHORTCUTS = [5, 10, 15, 20];
const FIXED_SHORTCUTS = [20, 50, 100, 200];

const REASONS = ['Cortesía de la casa', 'Cliente frecuente', 'Error de cocina', 'Promoción del día', 'Personal'];

interface DiscountModalProps {
  visible: boolean;
  onClose: () => void;
  subtotal: number;
  contextLabel: string;
  cashierName: string;
  onApply: (discount: OrderDiscount) => void;
}

export function DiscountModal({ visible, onClose, subtotal, contextLabel, cashierName, onApply }: DiscountModalProps) {
  const insets = useSafeAreaInsets();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [type, setType] = useState<DiscountType>('percent');
  const [percentValue, setPercentValue] = useState(10);
  const [fixedValue, setFixedValue] = useState(50);
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');

  const amount = useMemo(() => {
    if (type === 'comp') return subtotal;
    if (type === 'percent') return Math.round(subtotal * (percentValue / 100) * 100) / 100;
    return Math.min(fixedValue, subtotal);
  }, [type, percentValue, fixedValue, subtotal]);

  const ratio = subtotal > 0 ? amount / subtotal : 0;
  const needsPin = type === 'comp' || ratio > discountRules.cashierMaxRatio;
  const canApply = reason.length > 0 && amount > 0 && (!needsPin || pin.trim().length >= 4);

  const handleClose = () => {
    setType('percent');
    setPercentValue(10);
    setFixedValue(50);
    setReason('');
    setPin('');
    onClose();
  };

  const handleApply = () => {
    if (!canApply) return;
    onApply({
      type,
      value: type === 'percent' ? percentValue : type === 'fixed' ? fixedValue : 100,
      amount,
      reason,
      authorizedBy: needsPin ? 'Gerencia (PIN)' : cashierName,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="pricetag-outline" size={18} color={theme.a2.ink} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Aplicar descuento</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {contextLabel} · subtotal {formatCurrency(subtotal)}
              </Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.mut} />
            </Pressable>
          </View>

          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => {
              const active = opt.id === type;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setType(opt.id)}
                >
                  <Text style={[styles.typeText, active && styles.typeTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {type !== 'comp' ? (
            <View style={styles.shortcutRow}>
              {(type === 'percent' ? PERCENT_SHORTCUTS : FIXED_SHORTCUTS).map((v) => {
                const active = type === 'percent' ? v === percentValue : v === fixedValue;
                return (
                  <Pressable
                    key={v}
                    style={[styles.shortcutBtn, active && styles.shortcutBtnActive]}
                    onPress={() => (type === 'percent' ? setPercentValue(v) : setFixedValue(v))}
                  >
                    <Text style={[styles.shortcutText, active && styles.shortcutTextActive]}>
                      {type === 'percent' ? `${v}%` : formatCurrency(v)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Motivo (obligatorio)</Text>
          <View style={styles.reasonRow}>
            {REASONS.map((r) => {
              const active = r === reason;
              return (
                <Pressable
                  key={r}
                  style={[styles.reasonPill, active && styles.reasonPillActive]}
                  onPress={() => setReason(r)}
                >
                  <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{r}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.authBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.a3.ink} />
            <View style={styles.authText}>
              <Text style={styles.authTitle}>Autorización de gerencia</Text>
              <Text style={styles.authSub}>
                {needsPin
                  ? 'Este descuento requiere PIN de gerencia'
                  : `${cashierName} puede aplicar hasta ${Math.round(discountRules.cashierMaxRatio * 100)}% sin PIN`}
              </Text>
            </View>
            {needsPin ? (
              <TextInput
                value={pin}
                onChangeText={setPin}
                placeholder="••••"
                placeholderTextColor={theme.mut}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={6}
                style={styles.pinInput}
              />
            ) : null}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Descuento</Text>
            <Text style={styles.summaryValue}>−{formatCurrency(amount)}</Text>
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={!canApply}
            >
              <Text style={styles.applyText}>Aplicar descuento</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(43,46,36,0.32)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
    },
    card: {
      width: '100%',
      maxWidth: 540,
      maxHeight: '100%',
      backgroundColor: theme.surface,
      borderRadius: radius.dialog,
      padding: space.lg,
      gap: space.md,
      ...shadow.lg,
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: theme.a2.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: { fontSize: 17, fontWeight: '600', color: theme.text },
    subtitle: { fontSize: 12, color: theme.mut, marginTop: 1 },
    typeRow: { flexDirection: 'row', gap: space.xs },
    typeBtn: {
      flex: 1,
      paddingVertical: space.sm + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      alignItems: 'center',
    },
    typeBtnActive: { backgroundColor: theme.cta, borderColor: theme.cta },
    typeText: { fontSize: 13, fontWeight: '700', color: theme.text },
    typeTextActive: { color: theme.ctaOn },
    shortcutRow: { flexDirection: 'row', gap: space.xs },
    shortcutBtn: {
      flex: 1,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      alignItems: 'center',
    },
    shortcutBtnActive: { backgroundColor: theme.a2.soft, borderColor: theme.a2.solid },
    shortcutText: { fontSize: 13, fontWeight: '700', color: theme.text },
    shortcutTextActive: { color: theme.a2.ink },
    sectionLabel: { fontSize: 11, fontWeight: '700', color: theme.mut, textTransform: 'uppercase', letterSpacing: 0.6 },
    reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    reasonPill: {
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.line,
    },
    reasonPillActive: { backgroundColor: theme.a3.solid, borderColor: theme.a3.solid },
    reasonText: { fontSize: 12, fontWeight: '600', color: theme.text },
    reasonTextActive: { color: theme.a3.on },
    authBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
      backgroundColor: theme.a3.soft,
      borderRadius: radius.md,
      padding: space.sm + 2,
    },
    authText: { flex: 1 },
    authTitle: { fontSize: 13, fontWeight: '700', color: theme.a3.ink },
    authSub: { fontSize: 11, color: theme.a3.ink, marginTop: 1 },
    pinInput: {
      width: 70,
      backgroundColor: theme.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: theme.a3.line,
      paddingHorizontal: space.sm,
      paddingVertical: 8,
      fontSize: 14,
      textAlign: 'center',
      color: theme.text,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 13, fontWeight: '600', color: theme.mut },
    summaryValue: { fontSize: 18, fontWeight: '600', color: theme.a3.ink, fontVariant: ['tabular-nums'] },
    footer: { flexDirection: 'row', gap: space.sm },
    cancelBtn: {
      flex: 1,
      paddingVertical: space.sm + 4,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.line,
      alignItems: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: theme.text },
    applyBtn: {
      flex: 1.4,
      paddingVertical: space.sm + 4,
      borderRadius: radius.lg,
      backgroundColor: theme.cta,
      alignItems: 'center',
    },
    applyBtnDisabled: { backgroundColor: theme.line },
    applyText: { fontSize: 14, fontWeight: '700', color: theme.ctaOn },
  });
}
