import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { formatCurrency } from '@/lib/demo-data';
import { colors, headerStyle, radius, shadows, typography } from '@/constants/theme';
import { usePosStore } from '@/stores/posStore';
import type { PaymentMethod } from '@/types';

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'cash', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'card', label: 'Tarjeta', icon: 'card-outline' },
  { id: 'transfer', label: 'Transferencia', icon: 'phone-portrait-outline' },
];

const tipOptions = [0, 10, 15, 20];

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { orders, payOrder, getTable } = usePosStore();

  const order = orders.find((o) => o.id === orderId);
  const table = order ? getTable(order.table_id) : undefined;

  const [tipPercent, setTipPercent] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  if (!order) {
    return (
      <Screen>
        <Text>Orden no encontrada</Text>
      </Screen>
    );
  }

  const tipAmount = Math.round(order.subtotal * (tipPercent / 100) * 100) / 100;
  const grandTotal = order.subtotal + order.tax + tipAmount;

  const handlePay = () => {
    setLoading(true);
    payOrder(order.id, tipAmount, paymentMethod);
    setPaid(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(app)/(tabs)');
    }, 1200);
  };

  if (paid) {
    return (
      <Screen>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>¡Pago registrado!</Text>
          <Text style={styles.successAmount}>{formatCurrency(grandTotal)}</Text>
          <Text style={styles.successSub}>{table?.name} · Mesa liberada</Text>
        </View>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Cobro — ${table?.name ?? 'Mesa'}`,
          headerStyle: headerStyle,
          headerTintColor: colors.primary,
        }}
      />
      <Screen scroll>
        <View style={styles.breadcrumbWrap}>
          <Breadcrumb
            items={[
              { label: 'Mesas', href: '/(app)/(tabs)' },
              { label: table?.name ?? 'Mesa', href: `/table/${order.table_id}` },
              { label: 'Cobro' },
            ]}
          />
        </View>
        <View style={styles.receipt}>
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.receiptTitle}>Resumen de cuenta</Text>
          </View>

          <View style={styles.items}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>
                  {formatCurrency(item.unit_price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.value}>{formatCurrency(order.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.label}>IVA (16%)</Text>
              <Text style={styles.value}>{formatCurrency(order.tax)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Propina</Text>
        <View style={styles.tipRow}>
          {tipOptions.map((pct) => (
            <Pressable
              key={pct}
              style={[styles.tipBtn, tipPercent === pct && styles.tipBtnActive]}
              onPress={() => setTipPercent(pct)}
            >
              <Text style={[styles.tipText, tipPercent === pct && styles.tipTextActive]}>
                {pct === 0 ? 'Sin' : `${pct}%`}
              </Text>
              {pct > 0 ? (
                <Text style={[styles.tipSub, tipPercent === pct && styles.tipTextActive]}>
                  {formatCurrency(order.subtotal * (pct / 100))}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Método de pago</Text>
        <View style={styles.paymentRow}>
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.id;
            return (
              <Pressable
                key={method.id}
                style={[styles.paymentBtn, active && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={[styles.paymentIcon, active && styles.paymentIconActive]}>
                  <Ionicons
                    name={method.icon}
                    size={22}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text style={[styles.paymentText, active && styles.paymentTextActive]}>
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.grandTotal}>
          <View>
            <Text style={styles.grandLabel}>Total a cobrar</Text>
            {tipAmount > 0 ? (
              <Text style={styles.grandTip}>Incluye propina {formatCurrency(tipAmount)}</Text>
            ) : null}
          </View>
          <Text style={styles.grandValue}>{formatCurrency(grandTotal)}</Text>
        </View>

        <Button
          title={`Cobrar ${formatCurrency(grandTotal)}`}
          onPress={handlePay}
          loading={loading}
          size="lg"
          icon="checkmark-circle-outline"
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  breadcrumbWrap: { marginBottom: 16 },
  receipt: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  receiptTitle: { ...typography.subheading },
  items: { gap: 10, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  itemName: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  itemPrice: { fontSize: 15, fontWeight: '600', color: colors.text },
  totals: { gap: 8, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },
  sectionTitle: { ...typography.label, marginBottom: 10, marginTop: 4 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
    gap: 2,
  },
  tipBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tipText: { fontWeight: '700', fontSize: 15, color: colors.textSecondary },
  tipSub: { fontSize: 10, color: colors.textMuted },
  tipTextActive: { color: '#FFF' },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  paymentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
  },
  paymentBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconActive: { backgroundColor: colors.surface },
  paymentText: { fontWeight: '600', fontSize: 12, color: colors.textSecondary },
  paymentTextActive: { color: colors.primary },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.text,
    padding: 20,
    borderRadius: radius.xl,
    marginBottom: 20,
  },
  grandLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  grandTip: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  grandValue: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32 },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
  successAmount: { fontSize: 36, fontWeight: '900', color: colors.success },
  successSub: { fontSize: 14, color: colors.textMuted },
});
