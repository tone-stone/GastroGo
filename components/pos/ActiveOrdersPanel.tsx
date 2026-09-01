import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { OrderStatusBadge } from '@/components/ui/Badge';
import { colors, radius, shadows } from '@/constants/legacyTheme';
import { COUNTER_TABLE_ID, formatCurrency } from '@/lib/demo-data';
import { usePosStore } from '@/stores/posStore';
import type { Order, Table } from '@/types';

function getKitchenProgress(order: Order) {
  const total = order.items.length;
  if (total === 0) return { ready: 0, total: 0, label: 'Sin platillos' };
  const ready = order.items.filter((i) => i.kitchen_status === 'ready').length;
  if (order.status === 'open') return { ready, total, label: 'Sin enviar' };
  if (ready === total) return { ready, total, label: 'Listo en cocina' };
  return { ready, total, label: `${ready}/${total} listos` };
}

const ActiveOrderCard = memo(function ActiveOrderCard({
  order,
  table,
  selected,
  compact,
  onSelectOrder,
  onLongPressOrder,
}: {
  order: Order;
  table?: Table;
  selected: boolean;
  compact: boolean;
  onSelectOrder?: (orderId: string) => void;
  onLongPressOrder?: (orderId: string) => void;
}) {
  const progress = getKitchenProgress(order);
  const isBill = table?.status === 'bill_requested';
  const allReady = progress.total > 0 && progress.ready === progress.total;

  return (
    <Pressable
      style={[
        styles.card,
        compact && styles.cardCompact,
        isBill && styles.cardBill,
        selected && styles.cardSelected,
      ]}
      onPress={() => onSelectOrder?.(order.id)}
      onLongPress={onLongPressOrder ? () => onLongPressOrder(order.id) : undefined}
      delayLongPress={350}
      disabled={!onSelectOrder}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.tableNum, selected && styles.tableNumSelected]}>
          {table?.number ?? '?'}
        </Text>
        <OrderStatusBadge status={order.status} size="sm" />
      </View>
      {!compact ? (
        <Text style={styles.zone} numberOfLines={1}>
          {table?.zone ?? 'Mesa'}
        </Text>
      ) : null}
      <View style={styles.progressRow}>
        <Ionicons
          name={allReady ? 'checkmark-circle' : 'flame-outline'}
          size={13}
          color={allReady ? colors.success : colors.info}
        />
        <Text style={[styles.progressText, allReady && styles.progressReady]} numberOfLines={1}>
          {progress.label}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.total}>{formatCurrency(order.total)}</Text>
        {isBill ? (
          <View style={styles.payTag}>
            <Text style={styles.payTagText}>Cobrar</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

interface ActiveOrdersPanelProps {
  selectedOrderId?: string;
  onSelectOrder?: (orderId: string) => void;
  onLongPressOrder?: (orderId: string) => void;
  compact?: boolean;
}

export function ActiveOrdersPanel({
  selectedOrderId,
  onSelectOrder,
  onLongPressOrder,
  compact = false,
}: ActiveOrdersPanelProps) {
  const orders = usePosStore((s) => s.orders);
  const tables = usePosStore((s) => s.tables);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== 'paid' &&
          o.status !== 'cancelled' &&
          o.table_id !== COUNTER_TABLE_ID &&
          o.items.length > 0,
      ),
    [orders],
  );

  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const billReadyCount = useMemo(
    () =>
      activeOrders.filter((o) => tableById.get(o.table_id)?.status === 'bill_requested').length,
    [activeOrders, tableById],
  );

  if (activeOrders.length === 0) {
    return (
      <View style={[styles.empty, compact && styles.emptyCompact]}>
        <Ionicons name="restaurant-outline" size={compact ? 18 : 22} color={colors.textMuted} />
        <Text style={styles.emptyText}>Sin comandas de mesa activas</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {!compact ? (
        <View style={styles.header}>
          <Text style={styles.title}>Mesas en servicio</Text>
          {billReadyCount > 0 ? (
            <View style={styles.billBadge}>
              <Ionicons name="receipt-outline" size={12} color={colors.coffee} />
              <Text style={styles.billBadgeText}>{billReadyCount} por cobrar</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal={compact}
        style={compact ? styles.listScrollCompact : undefined}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.list, compact && styles.listCompact]}
      >
        {activeOrders.map((order) => (
          <ActiveOrderCard
            key={order.id}
            order={order}
            table={tableById.get(order.table_id)}
            selected={selectedOrderId === order.id}
            compact={compact}
            onSelectOrder={onSelectOrder}
            onLongPressOrder={onLongPressOrder}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.coffee,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  billBadgeText: { fontSize: 10, fontWeight: '800', color: colors.coffee },
  list: { gap: 8 },
  listCompact: { paddingVertical: 2 },
  listScrollCompact: { flexGrow: 0, flexShrink: 0 },
  card: {
    width: 132,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: 10,
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardCompact: { width: 112, padding: 7, gap: 2 },
  cardBill: { borderColor: colors.gold, backgroundColor: colors.goldMuted },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tableNum: { fontSize: 20, fontWeight: '800', color: colors.primary },
  tableNumSelected: { color: colors.coffee },
  zone: { fontSize: 10, color: colors.textMuted },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  progressText: { fontSize: 10, fontWeight: '600', color: colors.info },
  progressReady: { color: colors.success },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  total: { fontSize: 13, fontWeight: '800', color: colors.text },
  payTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  payTagText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
  empty: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },
  emptyCompact: { paddingVertical: 10, flexDirection: 'row' },
  emptyText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
});
