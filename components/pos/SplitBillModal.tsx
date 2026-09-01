import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/theme/ThemeProvider';
import { radius, shadow, space, type Palette } from '@/constants/theme';
import { formatCurrency } from '@/lib/demo-data';
import type { OrderItem } from '@/types';

type SplitMode = 'equal' | 'item' | 'guest';

const MODES: { id: SplitMode; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'equal', label: 'En partes iguales', hint: 'Divide el total entre N personas', icon: 'people-outline' },
  { id: 'item', label: 'Por artículo', hint: 'Marca qué paga cada cuenta', icon: 'list-outline' },
  { id: 'guest', label: 'Por comensal', hint: 'Usa el comensal capturado en la comanda', icon: 'person-outline' },
];

interface SplitBillModalProps {
  visible: boolean;
  onClose: () => void;
  contextLabel: string;
  total: number;
  items: OrderItem[];
  onApply: (parts: number[]) => void;
}

export function SplitBillModal({ visible, onClose, contextLabel, total, items, onApply }: SplitBillModalProps) {
  const insets = useSafeAreaInsets();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [mode, setMode] = useState<SplitMode>('equal');
  const [people, setPeople] = useState(2);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const itemSplit = useMemo(() => {
    const subtotalAll = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const account1 = items
      .filter((i) => checked[i.id])
      .reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const ratio1 = subtotalAll > 0 ? account1 / subtotalAll : 0.5;
    return [ratio1, 1 - ratio1];
  }, [items, checked]);

  const handleClose = () => {
    setMode('equal');
    setPeople(2);
    setChecked({});
    onClose();
  };

  const handleApply = () => {
    if (mode === 'equal') {
      onApply(Array.from({ length: people }, () => 1 / people));
    } else if (mode === 'item') {
      onApply(itemSplit);
    }
    handleClose();
  };

  const perPerson = total / people;
  const canApply = mode === 'equal' || mode === 'item';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="people-circle-outline" size={18} color={theme.a4.ink} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Dividir la cuenta</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{contextLabel} · {formatCurrency(total)}</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.mut} />
            </Pressable>
          </View>

          <View style={styles.modeRow}>
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <Pressable key={m.id} style={[styles.modeBtn, active && styles.modeBtnActive]} onPress={() => setMode(m.id)}>
                  <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{m.label}</Text>
                  <Text style={[styles.modeHint, active && styles.modeHintActive]}>{m.hint}</Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'equal' ? (
            <View style={styles.panel}>
              <Text style={styles.panelQuestion}>¿Entre cuántas personas?</Text>
              <View style={styles.stepperRow}>
                <View style={styles.stepper}>
                  <Pressable style={styles.stepperBtn} onPress={() => setPeople((p) => Math.max(2, p - 1))}>
                    <Ionicons name="remove" size={18} color={theme.text} />
                  </Pressable>
                  <Text style={styles.stepperValue}>{people}</Text>
                  <Pressable style={styles.stepperBtn} onPress={() => setPeople((p) => Math.min(12, p + 1))}>
                    <Ionicons name="add" size={18} color={theme.text} />
                  </Pressable>
                </View>
                <View style={styles.perPerson}>
                  <Text style={styles.perPersonLabel}>Cada uno</Text>
                  <Text style={styles.perPersonValue}>{formatCurrency(perPerson)}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {mode === 'item' ? (
            <View style={styles.panel}>
              <Text style={styles.panelQuestion}>Marca lo que paga la cuenta 1 — el resto queda en la cuenta 2</Text>
              <ScrollView style={styles.itemScroll}>
                {items.map((item) => {
                  const isChecked = !!checked[item.id];
                  return (
                    <Pressable
                      key={item.id}
                      style={styles.itemRow}
                      onPress={() => setChecked((c) => ({ ...c, [item.id]: !c[item.id] }))}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                        {isChecked ? <Ionicons name="checkmark" size={13} color={theme.ctaOn} /> : null}
                      </View>
                      <Text style={styles.itemName} numberOfLines={1}>{item.quantity}× {item.name}</Text>
                      <Text style={styles.itemPrice}>{formatCurrency(item.unit_price * item.quantity)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.splitPreview}>
                <Text style={styles.splitPreviewText}>Cuenta 1 {formatCurrency(total * itemSplit[0])}</Text>
                <Text style={styles.splitPreviewText}>Cuenta 2 {formatCurrency(total * itemSplit[1])}</Text>
              </View>
            </View>
          ) : null}

          {mode === 'guest' ? (
            <View style={styles.panel}>
              <Text style={styles.panelEmpty}>
                Próximamente — requiere capturar el comensal de cada platillo en la comanda.
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.applyBtn, !canApply && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={!canApply}
            >
              <Text style={styles.applyText}>
                Dividir en {mode === 'equal' ? people : 2}
              </Text>
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
      maxWidth: 600,
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
      backgroundColor: theme.a4.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: { fontSize: 17, fontWeight: '600', color: theme.text },
    subtitle: { fontSize: 12, color: theme.mut, marginTop: 1 },
    modeRow: { flexDirection: 'row', gap: space.xs },
    modeBtn: {
      flex: 1,
      padding: space.sm + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      gap: 2,
    },
    modeBtnActive: { backgroundColor: theme.a4.solid, borderColor: theme.a4.solid },
    modeLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    modeLabelActive: { color: theme.a4.on },
    modeHint: { fontSize: 10, color: theme.mut },
    modeHintActive: { color: theme.a4.on, opacity: 0.85 },
    panel: { backgroundColor: theme.surface2, borderRadius: radius.md, padding: space.md, gap: space.sm },
    panelQuestion: { fontSize: 13, fontWeight: '600', color: theme.text },
    panelEmpty: { fontSize: 13, color: theme.mut, textAlign: 'center', paddingVertical: space.md },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
      borderWidth: 1,
      borderColor: theme.line,
    },
    stepperBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
    stepperValue: { fontSize: 18, fontWeight: '700', color: theme.text, minWidth: 24, textAlign: 'center' },
    perPerson: { alignItems: 'flex-end' },
    perPersonLabel: { fontSize: 10, fontWeight: '700', color: theme.mut, textTransform: 'uppercase' },
    perPersonValue: { fontSize: 20, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    itemScroll: { maxHeight: 180 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: theme.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface,
    },
    checkboxActive: { backgroundColor: theme.cta, borderColor: theme.cta },
    itemName: { flex: 1, fontSize: 13, color: theme.text },
    itemPrice: { fontSize: 13, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    splitPreview: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: space.xs, borderTopWidth: 1, borderTopColor: theme.line },
    splitPreviewText: { fontSize: 12, fontWeight: '700', color: theme.mut },
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
