import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/theme/ThemeProvider';
import { CHANNEL_LABELS } from '@/constants/channels';
import { radius, shadow, space, type Palette } from '@/constants/theme';
import { formatCurrency, isCounterTable } from '@/lib/demo-data';
import type { Order, PaymentMethod, Table } from '@/types';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta · Terminal',
  mp: 'Mercado Pago',
  apple: 'Apple Pay',
  transfer: 'Transferencia',
};

function folioFor(order: Order): string {
  const alnum = order.id.replace(/[^a-zA-Z0-9]/g, '');
  return `#${alnum.slice(-6).toUpperCase()}`;
}

interface ReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  table?: Table;
  restaurantName?: string;
  cashierName?: string;
}

export function ReceiptModal({ visible, onClose, order, table, restaurantName, cashierName }: ReceiptModalProps) {
  const insets = useSafeAreaInsets();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!order) return null;

  const when = new Date(order.closed_at ?? order.created_at);
  const dateLabel = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(when);
  const contextLabel = isCounterTable(order.table_id)
    ? CHANNEL_LABELS[order.channel]
    : `Mesa ${table?.number ?? '?'}${table?.zone ? ` · ${table.zone}` : ''}`;

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="checkmark-circle" size={20} color={theme.a1.solid} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Venta cobrada</Text>
              <Text style={styles.subtitle}>{folioFor(order)} · {dateLabel}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={theme.mut} />
            </Pressable>
          </View>

          <ScrollView style={styles.receiptScroll}>
            <View style={styles.receipt}>
              <Text style={styles.restaurantName}>{restaurantName ?? 'GastroGo'}</Text>
              <Text style={styles.contextLabel}>{contextLabel}</Text>
              {cashierName ? <Text style={styles.cashierLabel}>Cajero · {cashierName}</Text> : null}

              <View style={styles.divider} />

              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.unit_price * item.quantity)}</Text>
                </View>
              ))}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
              </View>
              {order.discount ? (
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.a3.ink }]}>Descuento · {order.discount.reason}</Text>
                  <Text style={[styles.totalValue, { color: theme.a3.ink }]}>−{formatCurrency(order.discount.amount)}</Text>
                </View>
              ) : null}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IVA (16%)</Text>
                <Text style={styles.totalValue}>{formatCurrency(order.tax)}</Text>
              </View>
              {order.tip > 0 ? (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Propina</Text>
                  <Text style={styles.totalValue}>{formatCurrency(order.tip)}</Text>
                </View>
              ) : null}

              <View style={styles.divider} />

              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>Total</Text>
                <Text style={styles.grandValue}>{formatCurrency(order.total)}</Text>
              </View>

              {order.payment_method ? (
                <Text style={styles.methodLabel}>Pagado con {METHOD_LABELS[order.payment_method]}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Cerrar</Text>
            </Pressable>
            {Platform.OS === 'web' ? (
              <Pressable style={styles.primaryBtn} onPress={handlePrint}>
                <Ionicons name="print-outline" size={16} color={theme.ctaOn} />
                <Text style={styles.primaryBtnText}>Imprimir</Text>
              </Pressable>
            ) : null}
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
      maxWidth: 380,
      maxHeight: '100%',
      backgroundColor: theme.surface,
      borderRadius: radius.dialog,
      padding: space.lg,
      gap: space.sm,
      ...shadow.lg,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    headerIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      backgroundColor: theme.a1.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: theme.text },
    subtitle: { fontSize: 11, color: theme.mut, fontVariant: ['tabular-nums'] },
    receiptScroll: { maxHeight: 420 },
    receipt: { gap: space.xs, paddingVertical: space.sm },
    restaurantName: { fontSize: 15, fontWeight: '700', color: theme.text, textAlign: 'center' },
    contextLabel: { fontSize: 12, color: theme.mut, textAlign: 'center' },
    cashierLabel: { fontSize: 11, color: theme.mut, textAlign: 'center' },
    divider: { height: 1, backgroundColor: theme.line, marginVertical: space.xs },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs, paddingVertical: 2 },
    itemQty: { fontSize: 12, fontWeight: '700', color: theme.mut, minWidth: 22 },
    itemName: { flex: 1, fontSize: 13, color: theme.text },
    itemPrice: { fontSize: 13, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
    totalLabel: { fontSize: 12, color: theme.mut, flexShrink: 1 },
    totalValue: { fontSize: 12, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    grandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    grandLabel: { fontSize: 15, fontWeight: '700', color: theme.text },
    grandValue: { fontSize: 20, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    methodLabel: { fontSize: 12, color: theme.mut, textAlign: 'center', marginTop: space.xs },
    footer: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
    secondaryBtn: {
      flex: 1,
      paddingVertical: space.sm + 2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.line,
      alignItems: 'center',
    },
    secondaryBtnText: { fontSize: 13, fontWeight: '700', color: theme.text },
    primaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: space.sm + 2,
      borderRadius: radius.lg,
      backgroundColor: theme.cta,
    },
    primaryBtnText: { fontSize: 13, fontWeight: '700', color: theme.ctaOn },
  });
}
