import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/components/theme/ThemeProvider';
import { radius, shadow, space, type Palette } from '@/constants/theme';
import { COUNTER_TABLE_ID, formatCurrency, isCounterTable } from '@/lib/demo-data';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useShiftStore } from '@/stores/shiftStore';
import { useToastStore } from '@/stores/toastStore';
import type { Order, PaymentMethod } from '@/types';

const DENOMS = [1000, 500, 200, 100, 50, 20];

type ChannelBucket = 'table' | 'counter' | 'takeaway' | 'platform';

function bucketFor(order: Order): ChannelBucket {
  if (order.channel === 'didi' || order.channel === 'uber') return 'platform';
  if (order.channel === 'takeaway') return 'takeaway';
  return isCounterTable(order.table_id) ? 'counter' : 'table';
}

export default function CorteScreen() {
  const insets = useSafeAreaInsets();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const showToast = useToastStore((s) => s.show);

  const activeRestaurantId = useSessionStore((s) => s.activeRestaurantId);
  const user = useSessionStore((s) => s.user);
  const staffMemberId = useSessionStore((s) => s.staffMemberId);

  const orders = usePosStore((s) => s.orders);
  const tables = usePosStore((s) => s.tables);
  const loadRestaurantData = usePosStore((s) => s.loadRestaurantData);

  const shifts = useShiftStore((s) => s.shifts);
  const activeShiftId = useShiftStore((s) => s.activeShiftId);
  const loadShiftData = useShiftStore((s) => s.loadShiftData);
  const openShift = useShiftStore((s) => s.openShift);
  const addWithdrawal = useShiftStore((s) => s.addWithdrawal);
  const closeShift = useShiftStore((s) => s.closeShift);

  const shift = useMemo(() => shifts.find((s) => s.id === activeShiftId), [shifts, activeShiftId]);

  const [floatInput, setFloatInput] = useState('1500');
  const [bills, setBills] = useState<Record<number, number>>({});
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');

  useEffect(() => {
    if (activeRestaurantId) {
      loadRestaurantData(activeRestaurantId);
      loadShiftData(activeRestaurantId);
    }
  }, [activeRestaurantId, loadRestaurantData, loadShiftData]);

  const diningTables = useMemo(
    () => tables.filter((t) => t.id !== COUNTER_TABLE_ID && t.restaurant_id === activeRestaurantId),
    [tables, activeRestaurantId],
  );
  const openTables = useMemo(() => diningTables.filter((t) => t.status !== 'free'), [diningTables]);

  const shiftOrders = useMemo(() => {
    if (!shift) return [];
    return orders.filter(
      (o) =>
        o.restaurant_id === activeRestaurantId &&
        o.status === 'paid' &&
        !!o.closed_at &&
        o.closed_at >= shift.opened_at,
    );
  }, [orders, shift, activeRestaurantId]);

  const salesTotal = shiftOrders.reduce((s, o) => s + o.total, 0);
  const salesCount = shiftOrders.length;
  const ticketAvg = salesCount > 0 ? salesTotal / salesCount : 0;
  const tipsTotal = shiftOrders.reduce((s, o) => s + o.tip, 0);
  const cashSales = shiftOrders
    .filter((o) => o.payment_method === 'cash')
    .reduce((s, o) => s + o.total, 0);
  const withdrawalsTotal = shift?.withdrawals.reduce((s, w) => s + w.amount, 0) ?? 0;
  const cashExpected = (shift?.opening_float ?? 0) + cashSales - withdrawalsTotal;
  const countedTotal = DENOMS.reduce((s, d) => s + d * (bills[d] ?? 0), 0);
  const diff = Math.round((countedTotal - cashExpected) * 100) / 100;

  const methodMeta: Record<PaymentMethod, { label: string; icon: keyof typeof Ionicons.glyphMap; dot: string }> = {
    cash: { label: 'Efectivo', icon: 'cash-outline', dot: theme.cta },
    card: { label: 'Tarjeta · Terminal', icon: 'card-outline', dot: theme.a1.solid },
    mp: { label: 'Mercado Pago', icon: 'qr-code-outline', dot: theme.a2.solid },
    apple: { label: 'Apple Pay', icon: 'logo-apple', dot: theme.a4.solid },
    transfer: { label: 'Transferencia', icon: 'phone-portrait-outline', dot: theme.mut },
  };

  const methodBreakdown = useMemo(() => {
    const map = new Map<PaymentMethod, { count: number; total: number }>();
    shiftOrders.forEach((o) => {
      if (!o.payment_method) return;
      const cur = map.get(o.payment_method) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += o.total;
      map.set(o.payment_method, cur);
    });
    return Array.from(map.entries())
      .map(([method, v]) => ({
        method,
        ...v,
        pct: salesTotal > 0 ? Math.round((v.total / salesTotal) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [shiftOrders, salesTotal]);

  const CHANNEL_META: Record<ChannelBucket, { label: string; dot: string }> = {
    table: { label: 'En mesa', dot: theme.a1.solid },
    counter: { label: 'Mostrador', dot: theme.cta },
    takeaway: { label: 'Para llevar', dot: theme.a2.solid },
    platform: { label: 'DiDi y Uber', dot: theme.a3.solid },
  };

  const channelBreakdown = useMemo(() => {
    const map = new Map<ChannelBucket, { count: number; total: number }>();
    shiftOrders.forEach((o) => {
      const bucket = bucketFor(o);
      const cur = map.get(bucket) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += o.total;
      map.set(bucket, cur);
    });
    return Array.from(map.entries()).map(([bucket, v]) => ({ bucket, ...v }));
  }, [shiftOrders]);

  const openTablesLabel = useMemo(() => {
    if (openTables.length === 0) return 'Ninguna mesa abierta';
    const names = openTables.map((t) => `Mesa ${t.number}`);
    if (names.length === 1) return names[0];
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  }, [openTables]);

  const kpis = [
    { label: 'Ventas', value: formatCurrency(salesTotal), meta: `${salesCount} órdenes cobradas`, dot: theme.cta },
    { label: 'Ticket promedio', value: formatCurrency(ticketAvg), meta: `${salesCount} cuentas`, dot: theme.a2.solid },
    { label: 'Propinas', value: formatCurrency(tipsTotal), meta: 'Del turno actual', dot: theme.a4.solid },
    { label: 'Cuentas abiertas', value: String(openTables.length), meta: openTablesLabel, dot: theme.a3.solid },
  ];

  const shiftHint =
    countedTotal === 0
      ? 'Toca las denominaciones para contar el efectivo'
      : diff === 0
        ? 'La caja cuadra con lo esperado'
        : 'Revisa retiros y propinas antes de cerrar';

  const canClose = openTables.length === 0;

  const handleOpenShift = () => {
    const value = parseFloat(floatInput);
    if (!activeRestaurantId || Number.isNaN(value) || value < 0) return;
    openShift(activeRestaurantId, value, staffMemberId ?? undefined);
    showToast('Turno abierto', 'ok');
  };

  const handleAddWithdrawal = () => {
    const amount = parseFloat(withdrawAmount);
    if (Number.isNaN(amount) || amount <= 0 || !withdrawReason.trim()) return;
    addWithdrawal(amount, withdrawReason.trim());
    setWithdrawAmount('');
    setWithdrawReason('');
    showToast('Retiro registrado', 'ok');
  };

  const handleCloseShift = () => {
    if (!canClose) {
      showToast('No se puede cerrar con mesas abiertas', 'warn');
      return;
    }
    closeShift({
      countedBills: bills,
      countedTotal,
      salesTotal,
      salesCount,
      tipsTotal,
      cashExpected,
      closedBy: user?.full_name,
    });
    setBills({});
    showToast(
      diff === 0 ? 'Turno cerrado — caja cuadrada' : `Turno cerrado con diferencia de ${formatCurrency(Math.abs(diff))}`,
      diff === 0 ? 'ok' : 'warn',
    );
  };

  if (!shift) {
    return (
      <View style={styles.root}>
        <View style={styles.openWrap}>
          <View style={styles.openCard}>
            <View style={styles.openIcon}>
              <Ionicons name="wallet-outline" size={24} color={theme.cta} />
            </View>
            <Text style={styles.openTitle}>Abrir turno</Text>
            <Text style={styles.openSub}>
              Captura el fondo inicial de caja para empezar el corte de hoy.
            </Text>
            <Text style={styles.fieldLabel}>Fondo inicial</Text>
            <TextInput
              value={floatInput}
              onChangeText={setFloatInput}
              keyboardType="numeric"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={theme.mut}
            />
            <Pressable style={styles.primaryBtn} onPress={handleOpenShift}>
              <Text style={styles.primaryBtnText}>Abrir turno</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.columns}>
        <View style={styles.leftCol}>
          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} style={[styles.kpiCard, { borderTopColor: k.dot }]}>
                <Text style={styles.kpiLabel}>{k.label}</Text>
                <Text style={styles.kpiValue}>{k.value}</Text>
                <Text style={styles.kpiMeta} numberOfLines={1}>{k.meta}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ventas por método</Text>
            {methodBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>Sin ventas todavía en este turno.</Text>
            ) : (
              methodBreakdown.map((m) => {
                const meta = methodMeta[m.method];
                return (
                  <View key={m.method} style={styles.methodRow}>
                    <View style={styles.methodHead}>
                      <Ionicons name={meta.icon} size={16} color={meta.dot} />
                      <Text style={styles.methodLabel}>{meta.label}</Text>
                      <Text style={styles.methodCount}>{m.count} pagos</Text>
                      <Text style={styles.methodTotal}>{formatCurrency(m.total)}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${m.pct}%`, backgroundColor: meta.dot }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ventas por canal</Text>
            {channelBreakdown.length === 0 ? (
              <Text style={styles.emptyText}>Sin ventas todavía en este turno.</Text>
            ) : (
              channelBreakdown.map((c) => {
                const meta = CHANNEL_META[c.bucket];
                return (
                  <View key={c.bucket} style={styles.channelRow}>
                    <View style={[styles.dot, { backgroundColor: meta.dot }]} />
                    <Text style={styles.methodLabel}>{meta.label}</Text>
                    <Text style={styles.methodCount}>{c.count} órdenes</Text>
                    <Text style={styles.methodTotal}>{formatCurrency(c.total)}</Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.cashDisplay}>
            <Text style={styles.cashLabel}>EFECTIVO EN CAJA</Text>
            <Text style={styles.cashValue}>{formatCurrency(cashExpected)}</Text>
            <View style={styles.cashRow}>
              <Text style={styles.cashRowLabel}>Fondo inicial</Text>
              <Text style={styles.cashRowValue}>{formatCurrency(shift.opening_float)}</Text>
            </View>
            <View style={styles.cashRow}>
              <Text style={styles.cashRowLabel}>Ventas en efectivo</Text>
              <Text style={[styles.cashRowValue, { color: theme.a1.solid }]}>+ {formatCurrency(cashSales)}</Text>
            </View>
            <View style={styles.cashRow}>
              <Text style={styles.cashRowLabel}>Retiros parciales</Text>
              <Text style={[styles.cashRowValue, { color: theme.a3.solid }]}>− {formatCurrency(withdrawalsTotal)}</Text>
            </View>

            <View style={styles.withdrawRow}>
              <TextInput
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="numeric"
                placeholder="Monto"
                placeholderTextColor={theme.onInkMut}
                style={styles.withdrawInput}
              />
              <TextInput
                value={withdrawReason}
                onChangeText={setWithdrawReason}
                placeholder="Motivo del retiro"
                placeholderTextColor={theme.onInkMut}
                style={[styles.withdrawInput, { flex: 1.4 }]}
              />
              <Pressable style={styles.withdrawBtn} onPress={handleAddWithdrawal}>
                <Ionicons name="add" size={16} color={theme.onInk} />
              </Pressable>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contar caja</Text>
            <View style={styles.denomGrid}>
              {DENOMS.map((d) => (
                <View key={d} style={styles.denomCard}>
                  <Text style={styles.denomLabel}>${d}</Text>
                  <View style={styles.denomStepper}>
                    <Pressable
                      style={styles.denomBtn}
                      onPress={() => setBills((b) => ({ ...b, [d]: Math.max(0, (b[d] ?? 0) - 1) }))}
                    >
                      <Ionicons name="remove" size={14} color={theme.text} />
                    </Pressable>
                    <Text style={styles.denomCount}>{bills[d] ?? 0}</Text>
                    <Pressable
                      style={styles.denomBtn}
                      onPress={() => setBills((b) => ({ ...b, [d]: (b[d] ?? 0) + 1 }))}
                    >
                      <Ionicons name="add" size={14} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.countedRow}>
              <Text style={styles.countedLabel}>Contado</Text>
              <Text style={styles.countedValue}>{formatCurrency(countedTotal)}</Text>
            </View>
            {countedTotal > 0 ? (
              <View style={styles.countedRow}>
                <Text style={styles.countedLabel}>Diferencia</Text>
                <Text style={[styles.countedValue, { color: diff === 0 ? theme.a1.solid : theme.a3.solid }]}>
                  {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                </Text>
              </View>
            ) : null}

            {!canClose ? (
              <View style={styles.blockNotice}>
                <Ionicons name="alert-circle" size={14} color={theme.a3.ink} />
                <Text style={styles.blockNoticeText}>No se puede cerrar con mesas abiertas: {openTablesLabel}</Text>
              </View>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable style={styles.secondaryBtn} onPress={() => setBills({})}>
                <Text style={styles.secondaryBtnText}>Reiniciar</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, !canClose && styles.primaryBtnDisabled]}
                onPress={handleCloseShift}
                disabled={!canClose}
              >
                <Text style={styles.primaryBtnText}>Cerrar turno</Text>
              </Pressable>
            </View>
            <Text style={styles.hintText}>{shiftHint}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    scrollContent: { padding: space.lg },
    columns: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, alignItems: 'flex-start' },
    leftCol: { flex: 1, minWidth: 340, gap: space.md },
    rightCol: { flex: 1, minWidth: 320, gap: space.md },

    openWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.lg },
    openCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.surface,
      borderRadius: radius.panel,
      padding: space.lg,
      gap: space.sm,
      borderWidth: 1,
      borderColor: theme.line,
      ...shadow.md,
    },
    openIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: theme.a1.soft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: space.xs,
    },
    openTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
    openSub: { fontSize: 13, color: theme.mut, marginBottom: space.xs },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.mut, textTransform: 'uppercase', letterSpacing: 0.6 },
    input: {
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.line,
      borderRadius: radius.md,
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.sm + 2,
      fontSize: 15,
      color: theme.text,
    },

    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm + 2 },
    kpiCard: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: space.sm + 2,
      gap: 4,
      borderTopWidth: 3,
      ...shadow.sm,
    },
    kpiLabel: { fontSize: 11, fontWeight: '700', color: theme.mut, textTransform: 'uppercase', letterSpacing: 0.6 },
    kpiValue: { fontSize: 22, fontWeight: '600', color: theme.text, letterSpacing: -0.3 },
    kpiMeta: { fontSize: 11, color: theme.mut },

    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.panel,
      padding: space.md + 2,
      gap: space.sm,
      borderWidth: 1,
      borderColor: theme.line,
    },
    cardTitle: { fontSize: 13, fontWeight: '700', color: theme.text },
    emptyText: { fontSize: 12, color: theme.mut },

    methodRow: { gap: 4 },
    methodHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    methodLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.text },
    methodCount: { fontSize: 11, color: theme.mut },
    methodTotal: { fontSize: 13, fontWeight: '700', color: theme.text, fontVariant: ['tabular-nums'] },
    barTrack: { height: 4, borderRadius: 2, backgroundColor: theme.surface2, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 2 },

    channelRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingVertical: 2 },
    dot: { width: 8, height: 8, borderRadius: 4 },

    cashDisplay: { backgroundColor: theme.ink, borderRadius: radius.panel, padding: space.md + 2, gap: space.xs },
    cashLabel: { fontSize: 11, fontWeight: '700', color: theme.onInkMut, letterSpacing: 1 },
    cashValue: { fontSize: 32, fontWeight: '600', color: theme.onInk, fontVariant: ['tabular-nums'], marginBottom: space.xs },
    cashRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: space.xs,
      borderTopWidth: 1,
      borderTopColor: theme.inkLine,
    },
    cashRowLabel: { fontSize: 12, color: theme.onInkMut },
    cashRowValue: { fontSize: 13, fontWeight: '600', color: theme.onInk, fontVariant: ['tabular-nums'] },
    withdrawRow: { flexDirection: 'row', gap: space.xs, marginTop: space.sm },
    withdrawInput: {
      flex: 1,
      backgroundColor: theme.inkSoft,
      borderRadius: radius.sm,
      paddingHorizontal: space.sm,
      paddingVertical: 8,
      fontSize: 12,
      color: theme.onInk,
    },
    withdrawBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      backgroundColor: theme.cta,
      alignItems: 'center',
      justifyContent: 'center',
    },

    denomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    denomCard: {
      flexBasis: '30%',
      flexGrow: 1,
      backgroundColor: theme.surface2,
      borderRadius: radius.md,
      padding: space.xs + 2,
      alignItems: 'center',
      gap: 4,
    },
    denomLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    denomStepper: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
    denomBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    denomCount: { fontSize: 13, fontWeight: '600', color: theme.text, minWidth: 16, textAlign: 'center' },

    countedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: space.xs },
    countedLabel: { fontSize: 12, fontWeight: '600', color: theme.mut },
    countedValue: { fontSize: 14, fontWeight: '700', color: theme.text, fontVariant: ['tabular-nums'] },

    blockNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.a3.soft,
      borderRadius: radius.sm,
      padding: space.xs + 2,
    },
    blockNoticeText: { flex: 1, fontSize: 11, fontWeight: '600', color: theme.a3.ink },

    actionsRow: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
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
      flex: 1.4,
      paddingVertical: space.sm + 2,
      borderRadius: radius.lg,
      backgroundColor: theme.cta,
      alignItems: 'center',
    },
    primaryBtnDisabled: { backgroundColor: theme.line },
    primaryBtnText: { fontSize: 13, fontWeight: '700', color: theme.ctaOn },
    hintText: { fontSize: 11, color: theme.mut, textAlign: 'center', marginTop: space.xs },
  });
}
