import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { KitchenItemTicket } from '@/components/kitchen/KitchenItemTicket';
import { useSignOut } from '@/components/navigation/NavButtons';
import { LiveClock } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors, kitchenAccent, radius, shadows } from '@/constants/theme';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { Order, OrderItem } from '@/types';

type KitchenFilter = 'active' | 'all';

interface KitchenTicketEntry {
  order: Order;
  item: OrderItem;
}

export default function KitchenDashboardScreen() {
  const confirmSignOut = useSignOut();
  const { loginMode, user, restaurants, activeRestaurantId } = useSessionStore();
  const { getKitchenOrders, getTable, getStaff } = usePosStore();
  const [filter, setFilter] = useState<KitchenFilter>('active');
  const [, setTick] = useState(0);

  const restaurant = restaurants.find((r) => r.id === activeRestaurantId);
  const allOrders = getKitchenOrders().filter((o) => o.restaurant_id === activeRestaurantId);

  const tickets = useMemo(() => {
    const entries: KitchenTicketEntry[] = allOrders.flatMap((order) =>
      order.items.map((item) => ({ order, item }))
    );

    const filtered =
      filter === 'active'
        ? entries.filter(({ item }) => item.kitchen_status !== 'ready')
        : entries;

    return filtered.sort((a, b) => {
      const timeA = new Date(a.order.kitchen_sent_at ?? a.order.created_at).getTime();
      const timeB = new Date(b.order.kitchen_sent_at ?? b.order.created_at).getTime();
      return timeA - timeB;
    });
  }, [allOrders, filter]);

  const pendingItems = allOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.kitchen_status !== 'ready').length,
    0,
  );

  if (loginMode !== 'kitchen') {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Screen scroll padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="flame" size={22} color="#FFF" />
          </View>
          <View>
            <Text style={styles.title}>Cocina</Text>
            <Text style={styles.subtitle}>{restaurant?.name ?? 'GastroGo'}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <LiveClock />
          <Pressable style={styles.signOutBtn} onPress={confirmSignOut} hitSlop={8}>
            <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{pendingItems}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>{tickets.length}</Text>
          <Text style={styles.statLabel}>{filter === 'active' ? 'Comandas' : 'Total'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum} numberOfLines={1}>{user?.full_name?.split(' ')[0]}</Text>
          <Text style={styles.statLabel}>Chef</Text>
        </View>
      </View>

      <View style={styles.filters}>
        <Pressable
          style={[styles.filterChip, filter === 'active' && styles.filterChipActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            En preparación
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Todas
          </Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {tickets.length === 0 ? (
          <EmptyState
            icon="flame-outline"
            title="Sin comandas pendientes"
            description="Cuando el mesero envíe órdenes a cocina, aparecerán aquí con mesa, mesero y hora."
          />
        ) : (
          tickets.map(({ order, item }) => (
            <KitchenItemTicket
              key={item.id}
              order={order}
              item={item}
              table={getTable(order.table_id)}
              waiter={order.waiter_id ? getStaff(order.waiter_id) : undefined}
              onItemReady={() => setTick((t) => t + 1)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: kitchenAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: `${kitchenAccent}12`,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: `${kitchenAccent}30`,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800', color: kitchenAccent },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 32, backgroundColor: `${kitchenAccent}30` },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: `${kitchenAccent}18`, borderColor: kitchenAccent },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: kitchenAccent, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
});
