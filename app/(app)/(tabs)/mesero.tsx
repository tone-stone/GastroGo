import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusFilterBar, type DashboardFilter } from '@/components/dashboard/StatusFilterBar';
import { AssignTableModal } from '@/components/pos/AssignTableModal';
import { AttendCustomerModal } from '@/components/pos/AttendCustomerModal';
import { ServiceFlowSteps } from '@/components/pos/ServiceFlowSteps';
import { TableGrid } from '@/components/pos/TableGrid';
import { Button } from '@/components/ui/Button';
import { LiveClock } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { tableStatusConfig } from '@/constants/status';
import { colors, radius, shadows } from '@/constants/theme';
import { COUNTER_TABLE_ID } from '@/lib/demo-data';
import { isAdminRole } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function WaiterScreen() {
  const router = useRouter();
  const activeRestaurantId = useSessionStore((s) => s.activeRestaurantId);
  const restaurants = useSessionStore((s) => s.restaurants);
  const staffMemberId = useSessionStore((s) => s.staffMemberId);
  const role = useSessionStore((s) => s.role);
  const tables = usePosStore((s) => s.tables);
  const staff = usePosStore((s) => s.staff);
  const loadRestaurantData = usePosStore((s) => s.loadRestaurantData);

  const [filter, setFilter] = useState<DashboardFilter>('free');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTableId, setAssignTableId] = useState<string | undefined>();
  const [attendOpen, setAttendOpen] = useState(false);
  const [attendTableId, setAttendTableId] = useState<string | undefined>();

  const restaurant = restaurants.find((r) => r.id === activeRestaurantId);
  const waiter = useMemo(
    () => (staffMemberId ? staff.find((s) => s.id === staffMemberId) ?? null : null),
    [staff, staffMemberId],
  );
  const myTables = useMemo(
    () =>
      staffMemberId
        ? tables.filter((t) => t.assigned_waiter_id === staffMemberId && t.status !== 'free')
        : [],
    [staffMemberId, tables],
  );
  const canReassign = isAdminRole(role);
  const diningTables = useMemo(
    () => tables.filter((t) => t.id !== COUNTER_TABLE_ID),
    [tables],
  );

  const freeTables = useMemo(
    () => diningTables.filter((t) => t.status === 'free' || t.status === 'reserved'),
    [diningTables],
  );

  useEffect(() => {
    if (activeRestaurantId) loadRestaurantData(activeRestaurantId);
  }, [activeRestaurantId, loadRestaurantData]);

  const counts = useMemo(
    () => ({
      all: diningTables.length,
      free: diningTables.filter((t) => t.status === 'free').length,
      occupied: diningTables.filter((t) => t.status === 'occupied').length,
      bill_requested: diningTables.filter((t) => t.status === 'bill_requested').length,
      reserved: diningTables.filter((t) => t.status === 'reserved').length,
    }),
    [diningTables],
  );

  const openAssign = (tableId?: string) => {
    setAssignTableId(tableId);
    setAssignOpen(true);
  };

  const openAttend = (tableId?: string) => {
    setAttendTableId(tableId);
    setAttendOpen(true);
  };

  const handleTablePress = useCallback(
    (tableId: string) => {
      const table = diningTables.find((t) => t.id === tableId);
      if (!table || !staffMemberId) return;

      const isMine = table.assigned_waiter_id === staffMemberId;
      const isFree = table.status === 'free' || table.status === 'reserved';

      if (isFree) {
        setAttendTableId(tableId);
        setAttendOpen(true);
        return;
      }

      if (isMine) {
        router.push(`/table/${tableId}`);
        return;
      }

      if (canReassign) {
        setAssignTableId(tableId);
        setAssignOpen(true);
      }
    },
    [canReassign, diningTables, router, staffMemberId],
  );

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.titleBlock}>
            <View style={styles.badge}>
              <Ionicons name="restaurant-outline" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>Mesero</Text>
            </View>
            <Text style={styles.title}>Atender y tomar orden</Text>
            <View style={styles.locationRow}>
              <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
              <Text style={styles.locationName} numberOfLines={1}>
                {restaurant?.name ?? 'GastroGo'}
              </Text>
            </View>
          </View>
          <LiveClock />
        </View>

        <View style={styles.flowCard}>
          <ServiceFlowSteps activeStep="assign" compact />
          <Text style={styles.flowHint}>Asigna mesa → toma orden → envía a cocina</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardFree]}>
            <Text style={styles.statNum}>{counts.free}</Text>
            <Text style={styles.statLabel}>Libres</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{counts.occupied}</Text>
            <Text style={styles.statLabel}>Ocupadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, styles.statNumMine]}>{myTables.length}</Text>
            <Text style={styles.statLabel}>Mis mesas</Text>
          </View>
        </View>

        {waiter ? (
          <View style={[styles.waiterStrip, { borderColor: waiter.color }]}>
            <View style={[styles.waiterAvatar, { backgroundColor: waiter.color }]}>
              <Text style={styles.waiterInitials}>
                {waiter.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </Text>
            </View>
            <View style={styles.waiterInfo}>
              <Text style={styles.waiterLabel}>Mesero en turno</Text>
              <Text style={styles.waiterName}>{waiter.name}</Text>
            </View>
          </View>
        ) : null}

        <Button
          title={freeTables.length > 0 ? `Atender cliente (${freeTables.length} libres)` : 'Atender cliente'}
          onPress={() => openAttend()}
          icon="restaurant-outline"
          size="lg"
          disabled={freeTables.length === 0}
        />
      </View>

      {freeTables.length > 0 ? (
        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Mesas disponibles — toca para sentar</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
            {freeTables.map((table) => {
              const config = tableStatusConfig[table.status];
              return (
                <Pressable
                  key={table.id}
                  style={[styles.quickCard, { borderColor: config.border }]}
                  onPress={() => openAttend(table.id)}
                >
                  <Text style={styles.quickNum}>{table.number}</Text>
                  <Text style={styles.quickZone}>{table.zone}</Text>
                  <View style={styles.quickMeta}>
                    <Ionicons name="people-outline" size={11} color={colors.textMuted} />
                    <Text style={styles.quickCap}>{table.capacity}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mapa de mesas</Text>
        <StatusFilterBar filter={filter} counts={counts} onChange={setFilter} />
        <View style={styles.kitchenLegend}>
          <View style={styles.legendItem}>
            <Ionicons name="create-outline" size={13} color={colors.coffee} />
            <Text style={styles.legendText}>Sin enviar</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="flame" size={13} color={colors.info} />
            <Text style={styles.legendText}>En cocina</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={13} color={colors.success} />
            <Text style={styles.legendText}>Listo</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="receipt-outline" size={13} color={colors.warning} />
            <Text style={styles.legendText}>Cuenta</Text>
          </View>
        </View>
        <TableGrid
          tables={diningTables}
          filter={filter}
          staffMemberId={staffMemberId}
          onTablePress={handleTablePress}
          onAssignTable={canReassign ? (id) => openAssign(id) : undefined}
        />
      </View>

      {myTables.length > 0 ? (
        <View style={styles.myTablesSection}>
          <Text style={styles.sectionTitle}>Mis mesas activas — continuar orden</Text>
          <View style={styles.myTablesRow}>
            {myTables.map((table) => (
              <Pressable
                key={table.id}
                style={styles.myTableChip}
                onPress={() => router.push(`/table/${table.id}`)}
              >
                <Text style={styles.myTableNum}>{table.number}</Text>
                <Text style={styles.myTableZone}>{table.zone}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {canReassign ? (
        <Pressable style={styles.assignBar} onPress={() => openAssign()}>
          <View style={styles.assignBarIcon}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          <View style={styles.assignBarText}>
            <Text style={styles.assignBarTitle}>Reasignar mesas</Text>
            <Text style={styles.assignBarSub}>
              {diningTables.filter((t) => t.assigned_waiter_id).length}/{diningTables.length} asignadas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}

      <AttendCustomerModal
        visible={attendOpen}
        onClose={() => setAttendOpen(false)}
        initialTableId={attendTableId}
      />

      <AssignTableModal
        visible={assignOpen}
        onClose={() => setAssignOpen(false)}
        initialTableId={assignTableId}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: { flex: 1, gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationName: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  flowCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  flowHint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardFree: { backgroundColor: colors.successBg, borderColor: colors.success },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.text },
  statNumMine: { color: colors.primary },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
  waiterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderLeftWidth: 4,
  },
  waiterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiterInitials: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  waiterInfo: { flex: 1 },
  waiterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  waiterName: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 1 },
  quickSection: { marginBottom: 16, gap: 10 },
  quickRow: { gap: 10, paddingVertical: 2 },
  quickCard: {
    width: 80,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 3,
    ...shadows.sm,
  },
  quickNum: { fontSize: 22, fontWeight: '800', color: colors.primary },
  quickZone: { fontSize: 10, color: colors.textMuted },
  quickMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  quickCap: { fontSize: 10, color: colors.textMuted },
  section: { gap: 12, marginBottom: 16 },
  kitchenLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.coffee,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myTablesSection: { marginBottom: 16, gap: 10 },
  myTablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  myTableChip: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 64,
    ...shadows.sm,
  },
  myTableNum: { fontSize: 20, fontWeight: '800', color: colors.primary },
  myTableZone: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  assignBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: radius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  assignBarIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignBarText: { flex: 1 },
  assignBarTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  assignBarSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
});
