import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { TableStatusBadge } from '@/components/ui/Badge';
import { tableStatusConfig } from '@/constants/status';
import { radius, shadow, space, theme } from '@/constants/theme';
import { formatCurrency } from '@/lib/demo-data';
import { usePosStore } from '@/stores/posStore';
import type { Order, Table, TableStatus } from '@/types';

type KitchenIndicator = 'none' | 'draft' | 'preparing' | 'ready' | 'bill';

function getKitchenIndicator(order: Order | undefined, table: Table): KitchenIndicator {
  if (!order || order.items.length === 0) return 'none';
  if (table.status === 'bill_requested') return 'bill';
  if (order.status === 'open') return 'draft';
  const ready = order.items.filter((i) => i.kitchen_status === 'ready').length;
  if (ready === order.items.length) return 'ready';
  return 'preparing';
}

const KITCHEN_INDICATOR_CONFIG: Record<
  Exclude<KitchenIndicator, 'none'>,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }
> = {
  draft: { icon: 'create-outline', color: theme.mut, bg: theme.surface2, label: 'Sin enviar' },
  preparing: { icon: 'flame', color: theme.a4.ink, bg: theme.a4.soft, label: 'En cocina' },
  ready: { icon: 'checkmark-circle', color: theme.a2.ink, bg: theme.a2.soft, label: 'Listo' },
  bill: { icon: 'receipt-outline', color: theme.a3.ink, bg: theme.a3.soft, label: 'Cuenta' },
};

function minutesSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

interface TableGridProps {
  tables: Table[];
  filter?: TableStatus | 'all';
  staffMemberId?: string | null;
  onTablePress?: (tableId: string) => void;
  onAssignTable?: (tableId: string) => void;
}

const ZONE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Terraza: 'sunny-outline',
  Interior: 'home-outline',
  Barra: 'wine-outline',
  VIP: 'diamond-outline',
};

const CARD_MIN_WIDTH = 220;
const CARD_MIN_HEIGHT = 132;
const GRID_GAP = space.md;
const SCREEN_PAD = space.lg;

function useGridLayout() {
  const { width } = useWindowDimensions();
  const innerWidth = width - SCREEN_PAD * 2;
  const cols = Math.max(1, Math.floor((innerWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)));
  const cardWidth = Math.floor((innerWidth - GRID_GAP * (cols - 1)) / cols);
  return { cardWidth };
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const TableCard = memo(function TableCard({
  table,
  width,
  isMine,
  onPress,
  onAssign,
}: {
  table: Table;
  width: number;
  isMine?: boolean;
  onPress?: () => void;
  onAssign?: () => void;
}) {
  const order = usePosStore((s) =>
    s.orders.find(
      (o) => o.table_id === table.id && o.status !== 'paid' && o.status !== 'cancelled',
    ),
  );
  const waiter = usePosStore((s) =>
    table.assigned_waiter_id
      ? s.staff.find((member) => member.id === table.assigned_waiter_id)
      : undefined,
  );
  const config = tableStatusConfig[table.status];
  const kitchen = getKitchenIndicator(order, table);
  const kitchenConfig = kitchen !== 'none' ? KITCHEN_INDICATOR_CONFIG[kitchen] : null;
  const readyCount = order?.items.filter((i) => i.kitchen_status === 'ready').length ?? 0;
  const kitchenProgress =
    kitchen === 'preparing' && order ? `${readyCount}/${order.items.length}` : null;
  const minutes = table.status !== 'free' ? minutesSince(order?.created_at) : null;

  return (
    <View style={[styles.cardWrap, { width }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { minHeight: CARD_MIN_HEIGHT },
          isMine && styles.cardMine,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.statusStrip, { backgroundColor: config.dot }]} />

        <View style={styles.body}>
          <View style={styles.headRow}>
            <View style={styles.headLeft}>
              <Text style={styles.number}>{table.number}</Text>
              <View style={styles.capacityRow}>
                <Ionicons name="people-outline" size={12} color={theme.mut} />
                <Text style={styles.capacityText}>{table.capacity}</Text>
              </View>
            </View>
            <TableStatusBadge status={table.status} size="sm" />
          </View>

          {kitchenConfig ? (
            <View style={[styles.kitchenBadge, { backgroundColor: kitchenConfig.bg }]}>
              <Ionicons name={kitchenConfig.icon} size={11} color={kitchenConfig.color} />
              <Text style={[styles.kitchenLabel, { color: kitchenConfig.color }]} numberOfLines={1}>
                {kitchenProgress ? `${kitchenConfig.label} · ${kitchenProgress}` : kitchenConfig.label}
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            {waiter ? (
              <View style={[styles.waiterDot, { backgroundColor: waiter.color }]} />
            ) : null}
            <Text style={styles.footerMeta} numberOfLines={1}>
              {table.status === 'free' || table.status === 'reserved'
                ? table.zone ?? '—'
                : `${waiter?.name ?? 'Sin mesero'}${minutes !== null ? ` · ${minutes} min` : ''}`}
            </Text>
            {order && order.total > 0 ? (
              <Text style={styles.footerAmount} numberOfLines={1}>
                {formatCurrency(order.total)}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      {onAssign ? (
        <Pressable style={styles.assignBtn} onPress={onAssign} hitSlop={6}>
          <Ionicons name="person-add" size={14} color={theme.cta} />
        </Pressable>
      ) : null}
    </View>
  );
});

export function TableGrid({ tables, filter = 'all', staffMemberId, onTablePress, onAssignTable }: TableGridProps) {
  const { cardWidth } = useGridLayout();

  const filtered = useMemo(
    () => (filter === 'all' ? tables : tables.filter((t) => t.status === filter)),
    [filter, tables],
  );
  const zones = useMemo(
    () => [...new Set(filtered.map((t) => t.zone ?? 'General'))],
    [filtered],
  );

  const handlePress = useCallback(
    (tableId: string) => onTablePress?.(tableId),
    [onTablePress],
  );
  const handleAssign = useCallback(
    (tableId: string) => onAssignTable?.(tableId),
    [onAssignTable],
  );

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="filter-outline" size={32} color={theme.mut} />
        <Text style={styles.emptyText}>Sin mesas</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {zones.map((zone) => {
        const zoneTables = filtered.filter((t) => (t.zone ?? 'General') === zone);
        return (
          <View key={zone} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name={ZONE_ICONS[zone] ?? 'location-outline'}
                  size={14}
                  color={theme.mut}
                />
              </View>
              <Text style={styles.sectionTitle}>{zone}</Text>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionCount}>{zoneTables.length}</Text>
            </View>

            <View style={styles.grid}>
              {zoneTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  width={cardWidth}
                  isMine={!!staffMemberId && table.assigned_waiter_id === staffMemberId}
                  onPress={onTablePress ? () => handlePress(table.id) : undefined}
                  onAssign={onAssignTable ? () => handleAssign(table.id) : undefined}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: space.xl },
  section: { gap: space.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: theme.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.mut,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.line,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.mut,
    minWidth: 16,
    textAlign: 'right',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cardWrap: { position: 'relative' },
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    ...shadow.sm,
  },
  pressed: { opacity: 0.92 },
  cardMine: { borderWidth: 2, borderColor: theme.cta },
  statusStrip: { width: 4 },
  body: { flex: 1, padding: space.sm + 2, gap: space.xs },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headLeft: { gap: 2 },
  number: { fontSize: 26, fontWeight: '600', color: theme.text, letterSpacing: -0.5, lineHeight: 30 },
  capacityRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  capacityText: { fontSize: 11, fontWeight: '600', color: theme.mut },
  kitchenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    maxWidth: '100%',
  },
  kitchenLabel: { fontSize: 10, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingTop: space.xs,
    borderTopWidth: 1,
    borderTopColor: theme.line,
  },
  waiterDot: { width: 7, height: 7, borderRadius: 4 },
  footerMeta: { flex: 1, fontSize: 11, fontWeight: '600', color: theme.mut },
  footerAmount: { fontSize: 12, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
  assignBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...shadow.sm,
  },
  empty: { alignItems: 'center', paddingVertical: 40, gap: space.sm },
  emptyText: { fontSize: 14, color: theme.mut },
});
