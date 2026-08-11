import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusFilterBar, type DashboardFilter } from '@/components/dashboard/StatusFilterBar';
import { AssignTableModal } from '@/components/pos/AssignTableModal';
import { AttendCustomerModal } from '@/components/pos/AttendCustomerModal';
import { PosCashRegister } from '@/components/pos/PosCashRegister';
import { TableGrid } from '@/components/pos/TableGrid';
import { Button } from '@/components/ui/Button';
import { LiveClock } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, shadows } from '@/constants/theme';
import { COUNTER_TABLE_ID } from '@/lib/demo-data';
import { isAdminRole } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function WaiterScreen() {
  const router = useRouter();
  const { activeRestaurantId, restaurants, staffMemberId, role } = useSessionStore();
  const { tables, loadRestaurantData, getStaff, getMyTables } = usePosStore();

  const [filter, setFilter] = useState<DashboardFilter>('all');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTableId, setAssignTableId] = useState<string | undefined>();
  const [attendOpen, setAttendOpen] = useState(false);
  const [attendTableId, setAttendTableId] = useState<string | undefined>();

  const restaurant = restaurants.find((r) => r.id === activeRestaurantId);
  const waiter = staffMemberId ? getStaff(staffMemberId) : null;
  const myTables = staffMemberId ? getMyTables(staffMemberId) : [];
  const canReassign = isAdminRole(role);
  const diningTables = useMemo(
    () => tables.filter((t) => t.id !== COUNTER_TABLE_ID),
    [tables],
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

  const handleTablePress = (tableId: string) => {
    const table = diningTables.find((t) => t.id === tableId);
    if (!table || !staffMemberId) return;

    const isMine = table.assigned_waiter_id === staffMemberId;
    const isFree = table.status === 'free' || table.status === 'reserved';

    if (isFree) {
      openAttend(tableId);
      return;
    }

    if (isMine) {
      router.push(`/table/${tableId}`);
      return;
    }

    if (canReassign) openAssign(tableId);
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.titleBlock}>
            <View style={styles.badge}>
              <Ionicons name="restaurant-outline" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>Mesero</Text>
            </View>
            <Text style={styles.title}>Mesas y comandas</Text>
            <View style={styles.locationRow}>
              <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
              <Text style={styles.locationName} numberOfLines={1}>
                {restaurant?.name ?? 'GastroGo'}
              </Text>
            </View>
          </View>
          <LiveClock />
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
            <View style={styles.waiterStat}>
              <Text style={styles.waiterStatNum}>{myTables.length}</Text>
              <Text style={styles.waiterStatLabel}>mesas</Text>
            </View>
          </View>
        ) : null}

        <Button
          title="Atender cliente"
          onPress={() => openAttend()}
          icon="restaurant-outline"
          size="lg"
          variant="outline"
        />
      </View>

      <PosCashRegister staffMemberId={staffMemberId} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mapa de mesas</Text>
        <StatusFilterBar filter={filter} counts={counts} onChange={setFilter} />
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
          <Text style={styles.sectionTitle}>Mis mesas activas</Text>
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
  waiterStat: { alignItems: 'center', paddingHorizontal: 8 },
  waiterStatNum: { fontSize: 20, fontWeight: '800', color: colors.primary },
  waiterStatLabel: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
  section: { gap: 12, marginBottom: 16 },
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
