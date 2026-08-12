import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { tableStatusConfig } from '@/constants/status';
import { colors, radius, shadows } from '@/constants/theme';
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
  draft: {
    icon: 'create-outline',
    color: colors.coffee,
    bg: colors.coffeeMuted,
    label: 'Sin enviar',
  },
  preparing: {
    icon: 'flame',
    color: colors.info,
    bg: colors.infoBg,
    label: 'En cocina',
  },
  ready: {
    icon: 'checkmark-circle',
    color: colors.success,
    bg: colors.successBg,
    label: 'Listo',
  },
  bill: {
    icon: 'receipt-outline',
    color: colors.warning,
    bg: colors.warningBg,
    label: 'Cuenta',
  },
};

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

const GRID_GAP = 10;
const SCREEN_PAD = 16;

function useGridLayout() {
  const { width } = useWindowDimensions();
  const cols = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const innerWidth = width - SCREEN_PAD * 2;
  const cardSize = Math.floor((innerWidth - GRID_GAP * (cols - 1)) / cols);
  return { cardSize };
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function TableCard({
  table,
  size,
  isMine,
  onPress,
  onAssign,
}: {
  table: Table;
  size: number;
  isMine?: boolean;
  onPress?: () => void;
  onAssign?: () => void;
}) {
  const getOrderByTable = usePosStore((s) => s.getOrderByTable);
  const getStaff = usePosStore((s) => s.getStaff);
  const order = getOrderByTable(table.id);
  const waiter = table.assigned_waiter_id ? getStaff(table.assigned_waiter_id) : null;
  const config = tableStatusConfig[table.status];
  const itemCount = order?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const kitchen = getKitchenIndicator(order, table);
  const kitchenConfig = kitchen !== 'none' ? KITCHEN_INDICATOR_CONFIG[kitchen] : null;
  const readyCount = order?.items.filter((i) => i.kitchen_status === 'ready').length ?? 0;
  const kitchenProgress =
    kitchen === 'preparing' && order
      ? `${readyCount}/${order.items.length}`
      : null;

  return (
    <View style={[styles.cardWrap, { width: size, height: size }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            borderColor: config.border,
          },
          isMine && styles.cardMine,
          kitchen === 'preparing' && styles.cardPreparing,
          kitchen === 'ready' && styles.cardReady,
          pressed && styles.pressed,
        ]}
      >
          <View style={[styles.statusStrip, { backgroundColor: config.dot }]} />

          <View style={styles.cardTop}>
            {waiter ? (
              <View style={[styles.waiterBadge, { backgroundColor: waiter.color }]}>
                <Text style={styles.waiterInitials}>{getInitials(waiter.name)}</Text>
              </View>
            ) : itemCount > 0 ? (
              <View style={[styles.chip, { backgroundColor: config.bg }]}>
                <Ionicons name="restaurant-outline" size={10} color={config.color} />
                <Text style={[styles.chipText, { color: config.color }]}>{itemCount}</Text>
              </View>
            ) : (
              <View />
            )}

            {kitchenConfig ? (
              <View style={[styles.kitchenBadge, { backgroundColor: kitchenConfig.bg }]}>
                <Ionicons name={kitchenConfig.icon} size={11} color={kitchenConfig.color} />
                {kitchenProgress ? (
                  <Text style={[styles.kitchenProgress, { color: kitchenConfig.color }]}>
                    {kitchenProgress}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.center}>
            <Text style={[styles.number, { color: config.color }]}>{table.number}</Text>
          </View>

          <View style={styles.cardBottom}>
            <View style={styles.meta}>
              <Ionicons name="people-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{table.capacity}</Text>
            </View>
            {kitchenConfig ? (
              <Text style={[styles.kitchenLabel, { color: kitchenConfig.color }]} numberOfLines={1}>
                {kitchenConfig.label}
              </Text>
            ) : order && order.total > 0 ? (
              <Text style={styles.total} numberOfLines={1}>
                {formatCurrency(order.total)}
              </Text>
            ) : null}
          </View>
        </Pressable>

      {onAssign ? (
        <Pressable style={styles.assignBtn} onPress={onAssign} hitSlop={6}>
          <Ionicons name="person-add" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function TableGrid({ tables, filter = 'all', staffMemberId, onTablePress, onAssignTable }: TableGridProps) {
  const { cardSize } = useGridLayout();

  const filtered = filter === 'all' ? tables : tables.filter((t) => t.status === filter);
  const zones = [...new Set(filtered.map((t) => t.zone ?? 'General'))];

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="filter-outline" size={32} color={colors.textMuted} />
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
                  size={16}
                  color={colors.primary}
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
                  size={cardSize}
                  isMine={!!staffMemberId && table.assigned_waiter_id === staffMemberId}
                  onPress={onTablePress ? () => onTablePress(table.id) : undefined}
                  onAssign={onAssignTable ? () => onAssignTable(table.id) : undefined}
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
  container: { gap: 24 },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
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
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.97 }] },
  cardMine: { borderWidth: 2, borderColor: colors.primary },
  cardPreparing: { borderColor: colors.info },
  cardReady: { borderColor: colors.success },
  assignBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...shadows.sm,
  },
  statusStrip: { height: 3, width: '100%' },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    minHeight: 24,
  },
  kitchenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  kitchenProgress: { fontSize: 9, fontWeight: '800' },
  kitchenLabel: { fontSize: 10, fontWeight: '700', maxWidth: '58%' },
  waiterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiterInitials: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  chipText: { fontSize: 10, fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  number: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 2,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  total: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    maxWidth: '60%',
  },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted },
});
