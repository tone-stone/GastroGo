import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Breadcrumb } from '@/components/navigation/Breadcrumb';
import { AttendCustomerModal } from '@/components/pos/AttendCustomerModal';
import { ItemNotesModal } from '@/components/pos/ItemNotesModal';
import { MenuList } from '@/components/pos/MenuList';
import { OrderSummary } from '@/components/pos/OrderSummary';
import { ServiceFlowSteps } from '@/components/pos/ServiceFlowSteps';
import { Button } from '@/components/ui/Button';
import { TableStatusBadge } from '@/components/ui/Badge';
import { Screen } from '@/components/ui/Screen';
import { getActiveStepFromOrder } from '@/constants/serviceFlow';
import { useTableStatusConfig } from '@/constants/status';
import { colors, headerStyle, radius } from '@/constants/legacyTheme';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { MenuItem } from '@/types';

type NotesModalState =
  | { mode: 'add'; item: MenuItem }
  | { mode: 'edit'; itemId: string; itemName: string; notes?: string }
  | null;

export default function TableOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const activeRestaurantId = useSessionStore((s) => s.activeRestaurantId);
  const staffMemberId = useSessionStore((s) => s.staffMemberId);
  const tables = usePosStore((s) => s.tables);
  const orders = usePosStore((s) => s.orders);
  const staff = usePosStore((s) => s.staff);
  const categories = usePosStore((s) => s.categories);
  const menuItemsAll = usePosStore((s) => s.menuItems);
  const addItemToOrder = usePosStore((s) => s.addItemToOrder);
  const updateItemNotes = usePosStore((s) => s.updateItemNotes);
  const updateItemQuantity = usePosStore((s) => s.updateItemQuantity);
  const sendToKitchen = usePosStore((s) => s.sendToKitchen);
  const requestBill = usePosStore((s) => s.requestBill);
  const tableStatusConfig = useTableStatusConfig();

  const table = id ? tables.find((t) => t.id === id) : undefined;
  const order = id
    ? orders.find(
        (o) => o.table_id === id && o.status !== 'paid' && o.status !== 'cancelled',
      )
    : undefined;
  const waiter = table?.assigned_waiter_id
    ? staff.find((s) => s.id === table.assigned_waiter_id) ?? null
    : null;
  const isMyTable = !!staffMemberId && table?.assigned_waiter_id === staffMemberId;
  const needsAssignment = table && (table.status === 'free' || !table.assigned_waiter_id || !isMyTable);

  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [attendOpen, setAttendOpen] = useState(false);
  const [notesModal, setNotesModal] = useState<NotesModalState>(null);

  useEffect(() => {
    if (categories.length && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  if (!table) {
    return (
      <Screen>
        <Text>Mesa no encontrada</Text>
      </Screen>
    );
  }

  if (needsAssignment) {
    return (
      <>
        <Stack.Screen
          options={{
            title: table.name,
            headerStyle: headerStyle,
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Screen scroll>
          <View style={styles.blockedCard}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.coffee} />
            <Text style={styles.blockedTitle}>Mesa sin asignar</Text>
            <Text style={styles.blockedText}>
              {table.assigned_waiter_id && !isMyTable
                ? `Esta mesa está asignada a ${waiter?.name ?? 'otro mesero'}.`
                : 'Asigna la mesa a tu usuario antes de tomar la orden.'}
            </Text>
            {(!table.assigned_waiter_id || table.status === 'free') && staffMemberId ? (
              <>
                <Button
                  title="Atender cliente en esta mesa"
                  onPress={() => setAttendOpen(true)}
                  icon="restaurant-outline"
                  size="lg"
                />
                <AttendCustomerModal
                  visible={attendOpen}
                  onClose={() => setAttendOpen(false)}
                  initialTableId={table.id}
                />
              </>
            ) : null}
            <Button
              title="Volver a mesas"
              variant="outline"
              onPress={() => router.back()}
              containerStyle={styles.backBtn}
            />
          </View>
        </Screen>
      </>
    );
  }

  if (!order) {
    return (
      <Screen>
        <Text>Cargando comanda...</Text>
      </Screen>
    );
  }

  const menuItems = useMemo(
    () => menuItemsAll.filter(
      (item) => item.category_id === selectedCategoryId && item.is_available,
    ),
    [menuItemsAll, selectedCategoryId],
  );
  const statusConfig = tableStatusConfig[table.status];
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const activeStep = getActiveStepFromOrder(table.status, order.status, itemCount > 0);

  const handleAddMenuItem = (item: MenuItem) => {
    setNotesModal({ mode: 'add', item });
  };

  const handleNotesModalClose = () => {
    if (notesModal?.mode === 'add' && order) {
      addItemToOrder(order.id, notesModal.item);
    }
    setNotesModal(null);
  };

  const handleNotesModalSave = (notes: string) => {
    if (!order || !notesModal) return;
    if (notesModal.mode === 'add') {
      addItemToOrder(order.id, notesModal.item, notes);
    } else {
      updateItemNotes(order.id, notesModal.itemId, notes);
    }
    setNotesModal(null);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: table.name,
          headerStyle: headerStyle,
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Screen padded={false} scroll={!isWide}>
        <View style={styles.breadcrumbBar}>
          <Breadcrumb
            items={[
              { label: 'Mesas', href: '/(app)/(tabs)/mesero' },
              { label: table.name },
            ]}
          />
        </View>

        <View style={styles.flowBar}>
          <ServiceFlowSteps activeStep={activeStep} />
        </View>

        <View style={[styles.infoBar, { backgroundColor: statusConfig.bg }]}>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={14} color={statusConfig.color} />
            <Text style={[styles.infoText, { color: statusConfig.color }]}>
              {table.capacity} personas
            </Text>
          </View>
          <View style={styles.infoDot} />
          <Text style={[styles.infoText, { color: statusConfig.color }]}>{table.zone}</Text>
          {waiter ? (
            <>
              <View style={styles.infoDot} />
              <View style={styles.infoItem}>
                <Ionicons name="person-outline" size={14} color={statusConfig.color} />
                <Text style={[styles.infoText, { color: statusConfig.color }]}>{waiter.name}</Text>
              </View>
            </>
          ) : null}
          <View style={{ flex: 1 }} />
          <TableStatusBadge status={table.status} size="sm" />
        </View>

        <View style={[styles.container, isWide && styles.containerWide]}>
          <View style={[styles.menuSection, isWide && styles.menuSectionWide]}>
            <Text style={styles.sectionTitle}>Menú — Tomar orden</Text>
            <MenuList
              categories={categories}
              items={menuItems}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              onAddItem={handleAddMenuItem}
            />
          </View>

          <View style={[styles.orderSection, isWide && styles.orderSectionWide]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.orderScroll}>
              <OrderSummary
                order={order}
                tableName={table.name}
                onIncrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
                onDecrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
                onEditNotes={(itemId, itemName, currentNotes) =>
                  setNotesModal({ mode: 'edit', itemId, itemName, notes: currentNotes })
                }
                onSendToKitchen={() => sendToKitchen(order.id)}
                onRequestBill={() => requestBill(table.id)}
                billRequested={table.status === 'bill_requested'}
              />
            </ScrollView>
          </View>
        </View>

        <ItemNotesModal
          visible={notesModal !== null}
          itemName={notesModal?.mode === 'add' ? notesModal.item.name : notesModal?.itemName ?? ''}
          initialNotes={notesModal?.mode === 'edit' ? notesModal.notes : ''}
          mode={notesModal?.mode ?? 'add'}
          onClose={handleNotesModalClose}
          onSave={handleNotesModalSave}
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  breadcrumbBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  flowBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13, fontWeight: '600' },
  infoDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted },
  container: { flex: 1, gap: 16, padding: 16 },
  containerWide: { flexDirection: 'row', gap: 20, padding: 20 },
  menuSection: { flex: 1 },
  menuSectionWide: { flex: 3 },
  orderSection: { flex: 1 },
  orderSectionWide: { flex: 2, maxWidth: 420 },
  orderScroll: { paddingBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  blockedCard: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
    margin: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  blockedTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  blockedText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  backBtn: { marginTop: 8, alignSelf: 'stretch' },
});
