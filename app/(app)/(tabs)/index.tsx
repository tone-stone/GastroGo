import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ItemNotesModal } from '@/components/pos/ItemNotesModal';
import { MenuList } from '@/components/pos/MenuList';
import { OrderSummary } from '@/components/pos/OrderSummary';
import { PosCashRegister } from '@/components/pos/PosCashRegister';
import { Button } from '@/components/ui/Button';
import { LiveClock } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, shadows } from '@/constants/theme';
import { confirmAction } from '@/lib/confirm';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { MenuItem } from '@/types';

type NotesModalState =
  | { mode: 'add'; item: MenuItem }
  | { mode: 'edit'; itemId: string; itemName: string; notes?: string }
  | null;

export default function SaleScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const { activeRestaurantId, restaurants } = useSessionStore();
  const {
    categories,
    getMenuByCategory,
    getActiveSaleOrder,
    startSaleOrder,
    resetSaleOrder,
    cancelOrder,
    addItemToOrder,
    updateItemNotes,
    updateItemQuantity,
    sendToKitchen,
    loadRestaurantData,
  } = usePosStore();

  const restaurant = restaurants.find((r) => r.id === activeRestaurantId);
  const order = getActiveSaleOrder();

  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? '');
  const [notesModal, setNotesModal] = useState<NotesModalState>(null);

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

  const menuItems = getMenuByCategory(selectedCategoryId);

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

  const handleNewSale = async () => {
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
  };

  const handlePaid = () => {
    if (activeRestaurantId) startSaleOrder(activeRestaurantId);
  };

  if (!order) {
    return (
      <Screen>
        <Text style={styles.loading}>Preparando venta...</Text>
      </Screen>
    );
  }

  return (
    <Screen padded={false} scroll={!isWide}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.titleBlock}>
            <View style={styles.badge}>
              <Ionicons name="cash-outline" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>Venta directa</Text>
            </View>
            <Text style={styles.title}>Mostrador</Text>
            <View style={styles.locationRow}>
              <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
              <Text style={styles.locationName} numberOfLines={1}>
                {restaurant?.name ?? 'GastroGo'}
              </Text>
            </View>
          </View>
          <LiveClock />
        </View>

        <View style={styles.heroActions}>
          <Button
            title="Nueva venta"
            variant="outline"
            icon="add-circle-outline"
            onPress={handleNewSale}
          />
        </View>
      </View>

      <View style={[styles.container, isWide && styles.containerWide]}>
        <View style={[styles.menuSection, isWide && styles.menuSectionWide]}>
          <Text style={styles.sectionTitle}>Menú</Text>
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
              tableName="Mostrador"
              onIncrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
              onDecrement={(itemId, qty) => updateItemQuantity(order.id, itemId, qty)}
              onEditNotes={(itemId, itemName, currentNotes) =>
                setNotesModal({ mode: 'edit', itemId, itemName, notes: currentNotes })
              }
              onSendToKitchen={() => sendToKitchen(order.id)}
            />

            <View style={styles.registerWrap}>
              <PosCashRegister
                orderId={order.id}
                saleMode
                onPaid={handlePaid}
              />
            </View>
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
  );
}

const styles = StyleSheet.create({
  loading: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  hero: {
    backgroundColor: colors.surface,
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
  heroActions: { flexDirection: 'row' },
  container: { flex: 1, gap: 16, padding: 16 },
  containerWide: { flexDirection: 'row', gap: 20, padding: 20 },
  menuSection: { flex: 1 },
  menuSectionWide: { flex: 3 },
  orderSection: { flex: 1 },
  orderSectionWide: { flex: 2, maxWidth: 440 },
  orderScroll: { paddingBottom: 32, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  registerWrap: { marginTop: 4 },
});
