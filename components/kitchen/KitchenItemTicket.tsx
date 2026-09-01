import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { colors, kitchenAccent, radius, shadows } from '@/constants/legacyTheme';
import { formatOrderTime } from '@/lib/demo-data';
import { showKitchenReadyAlert } from '@/lib/notify';
import { usePosStore } from '@/stores/posStore';
import type { Order, OrderItem, StaffMember, Table } from '@/types';

interface KitchenItemTicketProps {
  order: Order;
  item: OrderItem;
  table?: Table;
  waiter?: StaffMember;
  onItemReady?: () => void;
}

export const KitchenItemTicket = memo(function KitchenItemTicket({
  order,
  item,
  table,
  waiter,
  onItemReady,
}: KitchenItemTicketProps) {
  const markKitchenItemReady = usePosStore((s) => s.markKitchenItemReady);
  const isReady = item.kitchen_status === 'ready';
  const orderTime = order.kitchen_sent_at ?? order.created_at;

  const handleMarkReady = () => {
    const result = markKitchenItemReady(order.id, item.id);
    if (result) {
      showKitchenReadyAlert(result.tableName, result.itemName, result.quantity);
      onItemReady?.();
    }
  };

  return (
    <View style={[styles.ticket, isReady && styles.ticketDone]}>
      <View style={styles.ticketHeader}>
        <View style={styles.platilloRow}>
          <View style={styles.qtyBadge}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </View>
          <Text style={[styles.platillo, isReady && styles.platilloReady]}>{item.name}</Text>
        </View>
        {isReady ? (
          <View style={styles.readyPill}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.readyPillText}>Listo</Text>
          </View>
        ) : null}
      </View>

      {item.notes ? (
        <View style={styles.notesBox}>
          <Ionicons name="alert-circle" size={14} color={colors.coffee} />
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      ) : null}

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="grid-outline" size={14} color={kitchenAccent} />
          <View>
            <Text style={styles.metaLabel}>Mesa</Text>
            <Text style={styles.metaValue}>
              {table?.name ?? '—'} {table?.zone ? `· ${table.zone}` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color={kitchenAccent} />
          <View>
            <Text style={styles.metaLabel}>Mesero</Text>
            <Text style={styles.metaValue}>{waiter?.name ?? 'Sin asignar'}</Text>
          </View>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={kitchenAccent} />
          <View>
            <Text style={styles.metaLabel}>Pedido</Text>
            <Text style={styles.metaValue}>{formatOrderTime(orderTime)}</Text>
          </View>
        </View>
      </View>

      {!isReady ? (
        <Button
          title="Notificar — platillo listo"
          size="md"
          icon="notifications-outline"
          onPress={handleMarkReady}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    gap: 12,
    borderWidth: 1.5,
    borderLeftWidth: 4,
    borderLeftColor: kitchenAccent,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  ticketDone: {
    borderLeftColor: colors.success,
    backgroundColor: colors.successBg,
    opacity: 0.9,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  platilloRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  qtyBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: kitchenAccent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  qtyText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  platillo: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text, lineHeight: 26 },
  platilloReady: { textDecorationLine: 'line-through', color: colors.textMuted },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#B7DCC8',
  },
  readyPillText: { fontSize: 12, fontWeight: '700', color: colors.success },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.coffeeMuted,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.coffee, lineHeight: 18 },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: '45%',
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 1 },
});
