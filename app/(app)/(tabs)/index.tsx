import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { ActiveOrdersPanel } from '@/components/pos/ActiveOrdersPanel';
import { ItemNotesModal } from '@/components/pos/ItemNotesModal';
import { MenuList } from '@/components/pos/MenuList';
import { OrderSummary } from '@/components/pos/OrderSummary';
import { PosCashRegister } from '@/components/pos/PosCashRegister';
import { ServiceFlowSteps } from '@/components/pos/ServiceFlowSteps';
import { Screen } from '@/components/ui/Screen';
import { getActiveStepFromOrder } from '@/constants/serviceFlow';
import { colors, radius, shadows } from '@/constants/legacyTheme';
import { formatCurrency, isCounterTable } from '@/lib/demo-data';
import { confirmAction } from '@/lib/confirm';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { MenuItem } from '@/types';

type NotesModalState =
  | { mode: 'add'; item: MenuItem }
  | { mode: 'edit'; itemId: string; itemName: string; notes?: string }
  | null;

function getMenuColumns(width: number): number {
  if (width >= 1400) return 4;
  if (width >= 1100) return 3;
  if (width >= 768) return 2;
  return 1;
}

export default function SaleScreen() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isWide = width >= 768;
  const isDesktop = width >= 1100;
  const router = useRouter();
  const [ordersCollapsed, setOrdersCollapsed] = useState(false);

  const activeRestaurantId = useSessionStore((s) => s.activeRestaurantId);
  const restaurants = useSessionStore((s) => s.restaurants);

  const categories = usePosStore((s) => s.categories);
  const menuItemsAll = usePosStore((s) => s.menuItems);
  const orders = usePosStore((s) => s.orders);
  const tables = usePosStore((s) => s.tables);
  const activeSaleOrderId = usePosStore((s) => s.activeSaleOrderId);
  const startSaleOrder = usePosStore((s) => s.startSaleOrder);
  const resetSaleOrder = usePosStore((s) => s.resetSaleOrder);
  const cancelOrder = usePosStore((s) => s.cancelOrder);
  const addItemToOrder = usePosStore((s) => s.addItemToOrder);
  const updateItemNotes = usePosStore((s) => s.updateItemNotes);
  const updateItemQuantity = usePosStore((s) => s.updateItemQuantity);
  const sendToKitchen = usePosStore((s) => s.sendToKitchen);
  const loadRestaurantData = usePosStore((s) => s.loadRestaurantData);

  const restaurant = restaurants.find((r) => r.id === activeRestaurantId);
  const order = useMemo(
    () =>
      orders.find(
        (o) =>
          o.id === activeSaleOrderId &&
          o.status !== 'paid' &&
          o.status !== 'cancelled' &&
          isCounterTable(o.table_id),
      ),
    [activeSaleOrderId, orders],
  );
  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [notesModal, setNotesModal] = useState<NotesModalState>(null);
  const [paymentTargetId, setPaymentTargetId] = useState<string>('');

  useEffect(() => {
    if (activeRestaurantId) loadRestaurantData(activeRestaurantId);
  }, [activeRestaurantId, loadRestaurantData]);

  useEffect(() => {
    if (activeRestaurantId && !order) {
      startSaleOrder(activeRestaurantId);
    }
  }, [activeRestaurantId, order, startSaleOrder]);

  useEffect(() => {
    if (categories.length && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId]);

  const menuItems = useMemo(
    () => menuItemsAll.filter((item) => item.category_id === selectedCategoryId && item.is_available),
    [menuItemsAll, selectedCategoryId],
  );
  const menuColumns = getMenuColumns(width);
  const itemCount = order?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const counterStep = getActiveStepFromOrder('occupied', order?.status, itemCount > 0);

  useEffect(() => {
    if (order?.id) setPaymentTargetId((prev) => (prev === '' || prev === order.id ? order.id : prev));
  }, [order?.id]);

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

  const handleNewSale = useCallback(async () => {
    if (!order || order.items.length === 0) {
      resetSaleOrder();
      if (activeRestaurantId) startSaleOrder(activeRestaurantId);
      return;
    }

    const ok = await confirmAction(
      'Nueva venta',
      'Se descartará el pedido actual sin cobrar. ¿Continuar?',
    );
    if (!ok) return;
    cancelOrder(order.id);
    if (activeRestaurantId) startSaleOrder(activeRestaurantId);
  }, [activeRestaurantId, cancelOrder, order, resetSaleOrder, startSaleOrder]);

  const handlePaid = (paidOrderId: string) => {
    if (paidOrderId === order?.id && activeRestaurantId) {
      startSaleOrder(activeRestaurantId);
      setPaymentTargetId('');
    } else {
      setPaymentTargetId(order?.id ?? '');
    }
  };

  const handleSelectTableOrder = useCallback(
    (tableOrderId: string) => {
      const tableOrder = orders.find((o) => o.id === tableOrderId);
      const table = tableOrder ? tableById.get(tableOrder.table_id) : undefined;
      if (table?.status === 'bill_requested') {
        setPaymentTargetId(tableOrderId);
      }
    },
    [orders, tableById],
  );

  const handleLongPressOrder = useCallback(
    (tableOrderId: string) => {
      const tableOrder = orders.find((o) => o.id === tableOrderId);
      if (tableOrder) router.push(`/table/${tableOrder.table_id}`);
    },
    [orders, router],
  );

  const handleAddMenuItem = useCallback((item: MenuItem) => {
    setNotesModal({ mode: 'add', item });
  }, []);

  const newSaleBtn = (
    <Pressable style={styles.newSaleBtn} onPress={handleNewSale}>
      <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
      <Text style={styles.newSaleText}>Nueva venta</Text>
    </Pressable>
  );

  if (!order) {
    return (
      <Screen>
        <Text style={styles.loading}>Preparando venta...</Text>
      </Screen>
    );
  }

  if (isDesktop) {
    return (
      <Screen padded={false} scroll={false} style={styles.screenRoot}>
        <View style={styles.ordersBar}>
          <Pressable
            style={styles.ordersToggle}
            onPress={() => setOrdersCollapsed((c) => !c)}
            hitSlop={8}
          >
            <Ionicons
              name={ordersCollapsed ? 'chevron-forward' : 'chevron-down'}
              size={16}
              color={colors.primary}
            />
            <Text style={styles.ordersToggleText}>Ventas abiertas</Text>
          </Pressable>
          {!ordersCollapsed ? (
            <View style={styles.ordersBarPanel}>
              <ActiveOrdersPanel
                compact
                selectedOrderId={paymentTargetId !== order?.id ? paymentTargetId : undefined}
                onSelectOrder={handleSelectTableOrder}
                onLongPressOrder={handleLongPressOrder}
              />
            </View>
          ) : (
            <View style={styles.ordersBarSpacer} />
          )}
          {newSaleBtn}
        </View>

        <View style={styles.desktopBody}>
          <View style={styles.registerPanel}>
            <ScrollView
              style={styles.registerScroll}
              contentContainerStyle={styles.registerScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <PosCashRegister
                orderId={order.id}
                saleMode
                hero
                includeTableBills
                paymentTargetId={paymentTargetId || order.id}
                onPaymentTargetChange={setPaymentTargetId}
                onPaid={handlePaid}
              />
            </ScrollView>
          </View>

          <View style={styles.ticketPanel}>
            <View style={styles.panelHeader}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
              <Text style={styles.panelTitle}>Comanda · Mostrador</Text>
            </View>
            <View style={styles.flowStrip}>
              <ServiceFlowSteps activeStep={counterStep} compact />
            </View>
            <View style={styles.ticketPanelBody}>
              <OrderSummary
              order={order}
              tableName="Mostrador"
              variant="panel"
              maxItemsHeight={Math.min(280, height * 0.3)}
              onIncrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
              onDecrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
              onEditNotes={(itemId, itemName, currentNotes) =>
                setNotesModal({ mode: 'edit', itemId, itemName, notes: currentNotes })
              }
              onSendToKitchen={() => sendToKitchen(order.id)}
            />
            </View>
          </View>

          <View style={styles.menuPanel}>
            <View style={styles.panelHeader}>
              <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
              <Text style={styles.panelTitle}>Menú</Text>
            </View>
            <View style={styles.menuScroll}>
              <MenuList
                categories={categories}
                items={menuItems}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                onAddItem={handleAddMenuItem}
                layout="grid"
                columns={menuColumns}
                scrollable
              />
            </View>
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
    );
  }

  return (
    <Screen padded={false} scroll={!isWide} style={isWeb ? styles.screenRoot : undefined}>
      {!isWide ? (
        <View style={styles.mobileHero}>
          <View style={styles.mobileHeroTop}>
            <View>
              <Text style={styles.mobileTitle}>Punto de venta</Text>
              <Text style={styles.mobileSub}>{restaurant?.name ?? 'GastroGo'}</Text>
            </View>
            <View style={styles.mobileHeroStats}>
              <Text style={styles.mobileStatTotal}>{formatCurrency(order?.total ?? 0)}</Text>
              <Text style={styles.mobileStatLabel}>{itemCount} artículos</Text>
            </View>
          </View>
          {newSaleBtn}
        </View>
      ) : null}

      {isWide ? <View style={styles.tabletActionRow}>{newSaleBtn}</View> : null}

      <View style={[styles.container, isWide && styles.containerWide]}>
        {!isWide ? (
          <>
            <View style={styles.registerSectionMobile}>
              <PosCashRegister
                orderId={order.id}
                saleMode
                hero
                includeTableBills
                paymentTargetId={paymentTargetId || order.id}
                onPaymentTargetChange={setPaymentTargetId}
                onPaid={handlePaid}
              />
            </View>
            <ActiveOrdersPanel
              selectedOrderId={paymentTargetId !== order?.id ? paymentTargetId : undefined}
              onSelectOrder={handleSelectTableOrder}
            />
          </>
        ) : null}

        <View style={[styles.orderSection, isWide && styles.orderSectionWide]}>
          {isWide ? (
            <View style={styles.registerSectionWide}>
              <PosCashRegister
                orderId={order.id}
                saleMode
                hero
                includeTableBills
                paymentTargetId={paymentTargetId || order.id}
                onPaymentTargetChange={setPaymentTargetId}
                onPaid={handlePaid}
              />
            </View>
          ) : null}

          <View style={styles.flowStripMobile}>
            <ServiceFlowSteps activeStep={counterStep} compact />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.orderScroll}
          >
            <OrderSummary
              order={order}
              tableName="Mostrador"
              variant={isWide ? 'panel' : 'default'}
              maxItemsHeight={isWide ? undefined : 200}
              onIncrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
              onDecrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
              onEditNotes={(itemId, itemName, currentNotes) =>
                setNotesModal({ mode: 'edit', itemId, itemName, notes: currentNotes })
              }
              onSendToKitchen={() => sendToKitchen(order.id)}
            />
          </ScrollView>
        </View>

        <View style={[styles.menuSection, isWide && styles.menuSectionWide]}>
          {!isWide ? <Text style={styles.sectionTitle}>Menú</Text> : null}
          <MenuList
            categories={categories}
            items={menuItems}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            onAddItem={handleAddMenuItem}
            layout={isWide ? 'grid' : 'list'}
            columns={menuColumns}
          />
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
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: colors.backgroundWarm },
  loading: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 40 },

  newSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  newSaleText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  ordersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ordersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ordersToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ordersBarPanel: { flex: 1 },
  ordersBarSpacer: { flex: 1 },
  tabletActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  flowStrip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.primaryMuted,
  },
  flowStripMobile: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: 10,
  },

  desktopBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
  },
  menuPanel: {
    flex: 0.95,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.md,
  },
  ticketPanel: {
    flex: 0.65,
    minWidth: 280,
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.md,
  },
  ticketPanelBody: { flex: 1, padding: 12 },
  registerPanel: {
    flex: 1.55,
    minWidth: 380,
    maxWidth: 620,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    ...shadows.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  panelTitle: { fontSize: 14, fontWeight: '800', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.4 },
  menuScroll: { flex: 1 },
  menuScrollContent: { padding: 16, paddingBottom: 24 },
  registerScroll: { flex: 1 },
  registerScrollContent: { padding: 16, paddingBottom: 20 },

  registerSectionMobile: { marginBottom: 4 },
  registerSectionWide: { marginBottom: 16 },
  mobileHeroStats: { alignItems: 'flex-end' },
  mobileStatTotal: { fontSize: 22, fontWeight: '800', color: colors.primary },
  mobileStatLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 2 },

  mobileHero: {
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  mobileHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  mobileTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  mobileSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },

  container: { flex: 1, gap: 16, padding: 16 },
  containerWide: { flexDirection: 'row', gap: 20, padding: 20 },
  menuSection: { flex: 1 },
  menuSectionWide: { flex: 2.5 },
  orderSection: { flex: 1, gap: 12 },
  orderSectionWide: { flex: 1.2, maxWidth: 420 },
  orderScroll: { paddingBottom: 32, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
});
