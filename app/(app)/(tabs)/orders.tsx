import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OrderStatusBadge } from '@/components/ui/Badge';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { COUNTER_TABLE_ID, formatCurrency } from '@/lib/demo-data';
import { colors, radius, shadows, typography } from '@/constants/theme';
import { usePosStore } from '@/stores/posStore';

export default function OrdersScreen() {
  const { orders, getTable } = usePosStore();
  const activeOrders = orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled');

  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const itemCount = activeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  return (
    <Screen scroll>
      <AppHeader
        title="Órdenes activas"
        subtitle={`${activeOrders.length} comanda${activeOrders.length !== 1 ? 's' : ''} · ${itemCount} platillos`}
      />

      {activeOrders.length > 0 ? (
        <View style={styles.summary}>
          <Ionicons name="trending-up" size={18} color={colors.primary} />
          <Text style={styles.summaryText}>
            Total en curso: <Text style={styles.summaryAmount}>{formatCurrency(totalRevenue)}</Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {activeOrders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="Sin órdenes activas"
            description="Cuando abras una comanda en una mesa, aparecerá aquí para seguimiento rápido."
          />
        ) : (
          activeOrders.map((order) => {
            const table = getTable(order.table_id);
            const isCounter = order.table_id === COUNTER_TABLE_ID;
            const readyCount = order.items.filter((i) => i.kitchen_status === 'ready').length;
            const kitchenLabel =
              order.status === 'open'
                ? 'Pendiente de envío'
                : readyCount === order.items.length && order.items.length > 0
                  ? 'Listo en cocina'
                  : `${readyCount}/${order.items.length} en cocina`;
            const itemsPreview = order.items
              .map((i) => {
                const base = `${i.quantity}× ${i.name}`;
                return i.notes ? `${base} (${i.notes})` : base;
              })
              .join(' · ');

            return (
              <Link
                key={order.id}
                href={isCounter ? '/(app)/(tabs)' : `/table/${order.table_id}`}
                asChild
              >
                <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                  <View style={styles.cardTop}>
                    <View style={styles.tableBadge}>
                      <Text style={styles.tableNumber}>
                        {isCounter ? 'M' : (table?.number ?? '?')}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.tableName}>
                        {isCounter ? 'Mostrador' : (table?.name ?? 'Mesa')}
                      </Text>
                      <Text style={styles.zone}>
                        {isCounter ? 'Venta directa' : (table?.zone ?? 'General')}
                      </Text>
                    </View>
                    <OrderStatusBadge status={order.status} size="sm" />
                  </View>

                  {order.items.length > 0 ? (
                    <View style={styles.kitchenRow}>
                      <Ionicons
                        name={readyCount === order.items.length ? 'checkmark-circle' : 'flame-outline'}
                        size={14}
                        color={readyCount === order.items.length ? colors.success : colors.info}
                      />
                      <Text style={styles.kitchenText}>{kitchenLabel}</Text>
                      {table?.status === 'bill_requested' ? (
                        <View style={styles.billChip}>
                          <Text style={styles.billChipText}>Por cobrar</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  {itemsPreview ? (
                    <Text style={styles.items} numberOfLines={2}>{itemsPreview}</Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.itemCount}>
                      {order.items.reduce((s, i) => s + i.quantity, 0)} artículos
                    </Text>
                    <Text style={styles.total}>{formatCurrency(order.total)}</Text>
                  </View>

                  <View style={styles.cardAction}>
                    <Text style={styles.actionText}>Ver comanda</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              </Link>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryMuted,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 16,
  },
  summaryText: { fontSize: 14, color: colors.textSecondary },
  summaryAmount: { fontWeight: '800', color: colors.primary },
  list: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 10,
    ...shadows.sm,
  },
  pressed: { opacity: 0.94, transform: [{ scale: 0.995 }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tableBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumber: { fontSize: 18, fontWeight: '800', color: colors.primary },
  cardInfo: { flex: 1 },
  tableName: { fontSize: 16, fontWeight: '700', color: colors.text },
  zone: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  kitchenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  kitchenText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  billChip: {
    backgroundColor: colors.goldMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  billChipText: { fontSize: 10, fontWeight: '800', color: colors.coffee },
  items: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCount: { fontSize: 12, color: colors.textMuted },
  total: { fontSize: 20, fontWeight: '800', color: colors.primary },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
