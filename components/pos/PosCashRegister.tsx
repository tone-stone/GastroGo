import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/demo-data';
import { colors, radius, shadows } from '@/constants/theme';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { Order, PaymentMethod } from '@/types';

const TIP_OPTIONS = [0, 10, 15, 20];
const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'cash', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'card', label: 'Tarjeta', icon: 'card-outline' },
  { id: 'transfer', label: 'Transf.', icon: 'phone-portrait-outline' },
];

const NUMPAD = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['C', '0', '.'],
] as const;

interface PosCashRegisterProps {
  staffMemberId?: string | null;
  orderId?: string;
  saleMode?: boolean;
  onPaid?: () => void;
}

export function PosCashRegister({
  staffMemberId: _staffMemberId,
  orderId,
  saleMode = false,
  onPaid,
}: PosCashRegisterProps) {
  const router = useRouter();
  const { user } = useSessionStore();
  const { orders, getTable, getStaff, payOrder } = usePosStore();

  const payableOrders = useMemo(() => {
    const open = orders.filter(
      (o) => o.status !== 'paid' && o.status !== 'cancelled' && o.items.length > 0,
    );
    if (orderId) {
      const locked = open.find((o) => o.id === orderId);
      return locked ? [locked] : [];
    }
    return open
      .filter((o) => {
        const table = getTable(o.table_id);
        return table && table.number > 0;
      })
      .sort((a, b) => {
        const tableA = getTable(a.table_id);
        const tableB = getTable(b.table_id);
        const priA = tableA?.status === 'bill_requested' ? 0 : 1;
        const priB = tableB?.status === 'bill_requested' ? 0 : 1;
        return priA - priB || b.total - a.total;
      });
  }, [orders, getTable, orderId]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [tipPercent, setTipPercent] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const order = payableOrders.find((o) => o.id === selectedOrderId) ?? payableOrders[0];
  const table = order ? getTable(order.table_id) : undefined;
  const waiter = order?.waiter_id ? getStaff(order.waiter_id) : null;
  const cashierName = saleMode ? user?.full_name : waiter?.name;

  useEffect(() => {
    if (payableOrders.length && !payableOrders.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(payableOrders[0].id);
    }
  }, [payableOrders, selectedOrderId]);

  useEffect(() => {
    setInput('');
  }, [selectedOrderId, tipPercent, paymentMethod]);

  const tipAmount = order ? Math.round(order.subtotal * (tipPercent / 100) * 100) / 100 : 0;
  const amountDue = order ? order.subtotal + order.tax + tipAmount : 0;
  const amountReceived = parseFloat(input) || 0;
  const change = paymentMethod === 'cash' && amountReceived > 0 ? Math.max(0, amountReceived - amountDue) : 0;
  const canPay =
    !!order &&
    (paymentMethod !== 'cash' || amountReceived >= amountDue) &&
    amountDue > 0;

  const handleKey = (key: string) => {
    if (key === 'C') {
      setInput('');
      return;
    }
    if (key === '.' && input.includes('.')) return;
    if (key === '.' && !input) {
      setInput('0.');
      return;
    }
    setInput((prev) => {
      const next = prev + key;
      if (next.includes('.')) {
        const [, dec] = next.split('.');
        if (dec && dec.length > 2) return prev;
      }
      return next.replace(/^0+(?=\d)/, '');
    });
  };

  const handleExact = () => {
    if (amountDue > 0) setInput(amountDue.toFixed(2));
  };

  const handlePay = () => {
    if (!order || !canPay) return;
    setLoading(true);
    payOrder(order.id, tipAmount, paymentMethod);
    setInput('');
    setLoading(false);
    if (saleMode) {
      onPaid?.();
    } else {
      router.push('/(app)/(tabs)/mesero');
    }
  };

  return (
    <View style={styles.register}>
      <View style={styles.registerHeader}>
        <Ionicons name="calculator-outline" size={18} color={LCD_TEXT} />
        <Text style={styles.registerTitle}>Caja — Cobrar</Text>
      </View>

      {payableOrders.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            {saleMode ? 'Agrega platillos para cobrar' : 'Sin cuentas por cobrar'}
          </Text>
          <Text style={styles.emptySub}>
            {saleMode
              ? 'Selecciona del menú y cobra aquí mismo'
              : 'Abre una comanda y envíala a cobro desde una mesa'}
          </Text>
        </View>
      ) : (
        <>
          {!saleMode && payableOrders.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderTabs}>
              {payableOrders.map((o) => {
                const t = getTable(o.table_id);
                const active = o.id === order?.id;
                const billReady = t?.status === 'bill_requested';
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.orderTab, active && styles.orderTabActive, billReady && styles.orderTabBill]}
                    onPress={() => setSelectedOrderId(o.id)}
                  >
                    <Text style={[styles.orderTabNum, active && styles.orderTabTextActive]}>
                      Mesa {t?.number ?? '?'}
                    </Text>
                    <Text style={[styles.orderTabTotal, active && styles.orderTabTextActive]}>
                      {formatCurrency(o.total)}
                    </Text>
                    {billReady ? (
                      <View style={styles.billTag}>
                        <Text style={styles.billTagText}>Cuenta</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {order && table ? (
            <View style={styles.orderMeta}>
              <Text style={styles.metaItem}>
                <Text style={styles.metaLabel}>{saleMode ? 'Canal ' : 'Mesa '}</Text>
                {saleMode ? 'Mostrador' : `${table.name} · ${table.zone}`}
              </Text>
              {cashierName ? (
                <Text style={styles.metaItem}>
                  <Text style={styles.metaLabel}>{saleMode ? 'Cajero ' : 'Mesero '}</Text>
                  {cashierName}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.display}>
            <View style={styles.displayRow}>
              <Text style={styles.displayLabel}>TOTAL</Text>
              <Text style={styles.displayMain}>{formatCurrency(amountDue)}</Text>
            </View>
            {paymentMethod === 'cash' ? (
              <>
                <View style={styles.displayDivider} />
                <View style={styles.displayRow}>
                  <Text style={styles.displayLabel}>RECIBIDO</Text>
                  <Text style={styles.displaySub}>
                    {input ? formatCurrency(amountReceived) : '$0.00'}
                  </Text>
                </View>
                <View style={styles.displayRow}>
                  <Text style={styles.displayLabel}>CAMBIO</Text>
                  <Text style={[styles.displayChange, change > 0 && styles.displayChangeActive]}>
                    {formatCurrency(change)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          <View style={styles.tipRow}>
            {TIP_OPTIONS.map((pct) => (
              <Pressable
                key={pct}
                style={[styles.tipBtn, tipPercent === pct && styles.tipBtnActive]}
                onPress={() => setTipPercent(pct)}
              >
                <Text style={[styles.tipBtnText, tipPercent === pct && styles.tipBtnTextActive]}>
                  {pct === 0 ? '0%' : `${pct}%`}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.payMethods}>
            {PAYMENT_METHODS.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.payBtn, paymentMethod === m.id && styles.payBtnActive]}
                onPress={() => setPaymentMethod(m.id)}
              >
                <Ionicons
                  name={m.icon}
                  size={18}
                  color={paymentMethod === m.id ? '#FFF' : colors.textSecondary}
                />
                <Text style={[styles.payBtnText, paymentMethod === m.id && styles.payBtnTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.numpad}>
            {NUMPAD.map((row, ri) => (
              <View key={ri} style={styles.numpadRow}>
                {row.map((key) => (
                  <Pressable
                    key={key}
                    style={[styles.key, key === 'C' && styles.keyClear]}
                    onPress={() => handleKey(key)}
                  >
                    <Text style={[styles.keyText, key === 'C' && styles.keyClearText]}>{key}</Text>
                  </Pressable>
                ))}
              </View>
            ))}
            <View style={styles.numpadActions}>
              <Pressable style={styles.actionKey} onPress={handleExact}>
                <Text style={styles.actionKeyText}>Monto exacto</Text>
              </Pressable>
              <Pressable
                style={[styles.actionKey, styles.actionKeyPay, !canPay && styles.keyPayDisabled]}
                onPress={handlePay}
                disabled={!canPay || loading}
              >
                <Ionicons name="cash" size={20} color="#FFF" />
                <Text style={styles.actionKeyPayText}>Cobrar</Text>
              </Pressable>
            </View>
          </View>

          <Button
            title={`Cobrar ${formatCurrency(amountDue)}`}
            onPress={handlePay}
            loading={loading}
            disabled={!canPay}
            size="lg"
            icon="cash-outline"
            containerStyle={styles.cobrarBtn}
          />

          {order ? (
            <Pressable style={styles.detailLink} onPress={() => router.push(`/checkout/${order.id}`)}>
              <Text style={styles.detailLinkText}>Ver detalle de cuenta</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const LCD_BG = '#1A2420';
const LCD_TEXT = '#7DFFAF';

const styles = StyleSheet.create({
  register: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  registerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  registerTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyText: { fontSize: 15, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  orderTabs: { gap: 8, paddingVertical: 2 },
  orderTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 88,
    alignItems: 'center',
    gap: 2,
  },
  orderTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  orderTabBill: { borderColor: colors.gold },
  orderTabNum: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  orderTabTotal: { fontSize: 15, fontWeight: '800', color: colors.text },
  orderTabTextActive: { color: '#FFF' },
  billTag: {
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    marginTop: 2,
  },
  billTagText: { fontSize: 9, fontWeight: '800', color: colors.coffee },
  orderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: colors.primaryMuted,
    padding: 10,
    borderRadius: radius.md,
  },
  metaItem: { fontSize: 13, fontWeight: '600', color: colors.text },
  metaLabel: { fontWeight: '700', color: colors.primary },
  display: {
    backgroundColor: LCD_BG,
    borderRadius: radius.lg,
    padding: 16,
    gap: 8,
    borderWidth: 3,
    borderColor: '#2A3530',
    ...shadows.sm,
  },
  displayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  displayLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(125,255,175,0.6)', letterSpacing: 1 },
  displayMain: { fontSize: 32, fontWeight: '800', color: LCD_TEXT, fontVariant: ['tabular-nums'] },
  displayDivider: { height: 1, backgroundColor: 'rgba(125,255,175,0.15)' },
  displaySub: { fontSize: 22, fontWeight: '700', color: LCD_TEXT, fontVariant: ['tabular-nums'] },
  displayChange: { fontSize: 22, fontWeight: '700', color: 'rgba(125,255,175,0.5)', fontVariant: ['tabular-nums'] },
  displayChangeActive: { color: '#FFD166' },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  tipBtnActive: { backgroundColor: colors.coffee, borderColor: colors.coffee },
  tipBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  tipBtnTextActive: { color: '#FFF' },
  payMethods: { flexDirection: 'row', gap: 8 },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  payBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  payBtnText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  payBtnTextActive: { color: '#FFF' },
  numpad: { gap: 8 },
  numpadRow: { flexDirection: 'row', gap: 8 },
  key: {
    flex: 1,
    aspectRatio: 1.6,
    maxHeight: 52,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  keyText: { fontSize: 22, fontWeight: '700', color: colors.text },
  keyClear: { backgroundColor: colors.dangerBg, borderColor: colors.danger },
  keyClearText: { color: colors.danger, fontSize: 18 },
  numpadActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionKey: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coffeeMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionKeyText: { fontSize: 13, fontWeight: '800', color: colors.coffee },
  actionKeyPay: { flex: 1.2, backgroundColor: colors.primary, borderColor: colors.primaryDark, flexDirection: 'row', gap: 8 },
  actionKeyPayText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  keyPayDisabled: { opacity: 0.45 },
  cobrarBtn: { marginTop: 4 },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  detailLinkText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
