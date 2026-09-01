import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatusFilterBar, type DashboardFilter } from '@/components/dashboard/StatusFilterBar';
import { AssignTableModal } from '@/components/pos/AssignTableModal';
import { AttendCustomerModal } from '@/components/pos/AttendCustomerModal';
import { ServiceFlowSteps } from '@/components/pos/ServiceFlowSteps';
import { TableGrid } from '@/components/pos/TableGrid';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { LiveClock } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { useTableStatusConfig } from '@/constants/status';
import { radius, shadow, space, type Palette } from '@/constants/theme';
import { COUNTER_TABLE_ID } from '@/lib/demo-data';
import { isAdminRole } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function WaiterScreen() {
  const router = useRouter();
  const { palette: theme } = useTheme();
  const tableStatusConfig = useTableStatusConfig();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
              <Ionicons name="restaurant-outline" size={14} color={theme.cta} />
              <Text style={styles.badgeText}>Mesero</Text>
            </View>
            <Text style={styles.title}>Atender y tomar orden</Text>
            <View style={styles.locationRow}>
              <Ionicons name="storefront-outline" size={14} color={theme.mut} />
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
          <ScrollView
            horizontal
            style={styles.quickRowScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
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
                    <Ionicons name="people-outline" size={11} color={theme.mut} />
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
            <Ionicons name="create-outline" size={13} color={theme.mut} />
            <Text style={styles.legendText}>Sin enviar</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="flame" size={13} color={theme.a4.ink} />
            <Text style={styles.legendText}>En cocina</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={13} color={theme.a2.ink} />
            <Text style={styles.legendText}>Listo</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="receipt-outline" size={13} color={theme.a3.ink} />
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
            <Ionicons name="people" size={20} color={theme.cta} />
          </View>
          <View style={styles.assignBarText}>
            <Text style={styles.assignBarTitle}>Reasignar mesas</Text>
            <Text style={styles.assignBarSub}>
              {diningTables.filter((t) => t.assigned_waiter_id).length}/{diningTables.length} asignadas
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.mut} />
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

function makeStyles(theme: Palette) {
  return StyleSheet.create({
  hero: {
    backgroundColor: theme.surface,
    borderRadius: radius.panel,
    padding: space.lg,
    marginBottom: space.md,
    gap: space.md + 2,
    borderWidth: 1,
    borderColor: theme.line,
    ...shadow.sm,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
  },
  titleBlock: { flex: 1, gap: space.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'flex-start',
    backgroundColor: theme.a1.soft,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.a1.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  title: { fontSize: 22, fontWeight: '600', color: theme.text, letterSpacing: -0.3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  locationName: { fontSize: 13, color: theme.mut, flex: 1 },
  flowCard: {
    backgroundColor: theme.surface2,
    borderRadius: radius.lg,
    padding: space.md,
    gap: space.sm,
    borderWidth: 1,
    borderColor: theme.line,
  },
  flowHint: { fontSize: 12, color: theme.mut, textAlign: 'center', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: space.sm + 2 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.line,
  },
  statCardFree: { backgroundColor: theme.a1.soft, borderColor: theme.a1.line },
  statNum: { fontSize: 22, fontWeight: '600', color: theme.text },
  statNumMine: { color: theme.cta },
  statLabel: { fontSize: 10, fontWeight: '700', color: theme.mut, marginTop: 2 },
  waiterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: theme.bg,
    padding: space.md,
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
  waiterInitials: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  waiterInfo: { flex: 1 },
  waiterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.mut,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  waiterName: { fontSize: 16, fontWeight: '600', color: theme.text, marginTop: 1 },
  quickSection: { marginBottom: space.lg, gap: space.sm + 2 },
  quickRowScroll: { flexGrow: 0, flexShrink: 0 },
  quickRow: { gap: space.sm + 2, paddingVertical: 2 },
  quickCard: {
    width: 80,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: theme.surface,
    alignItems: 'center',
    gap: 3,
    ...shadow.sm,
  },
  quickNum: { fontSize: 22, fontWeight: '600', color: theme.cta },
  quickZone: { fontSize: 10, color: theme.mut },
  quickMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  quickCap: { fontSize: 10, color: theme.mut },
  section: { gap: space.md, marginBottom: space.lg },
  kitchenLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm + 2,
    backgroundColor: theme.bg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: theme.line,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: 11, fontWeight: '600', color: theme.mut },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.mut,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  myTablesSection: { marginBottom: space.lg, gap: space.sm + 2 },
  myTablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  myTableChip: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.a1.line,
    borderRadius: radius.lg,
    paddingVertical: space.sm + 2,
    paddingHorizontal: space.md + 2,
    alignItems: 'center',
    minWidth: 64,
    ...shadow.sm,
  },
  myTableNum: { fontSize: 20, fontWeight: '600', color: theme.cta },
  myTableZone: { fontSize: 10, color: theme.mut, marginTop: 2 },
  assignBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: theme.surface,
    padding: space.md,
    borderRadius: radius.lg,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: theme.a2.line,
  },
  assignBarIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: theme.a1.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignBarText: { flex: 1 },
  assignBarTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  assignBarSub: { fontSize: 12, color: theme.mut, marginTop: 1 },
  });
}
