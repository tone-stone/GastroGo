import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '@/components/admin/AdminListRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { colors, radius } from '@/constants/legacyTheme';
import { formatCurrency } from '@/lib/demo-data';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function AdminMenuScreen() {
  const { activeRestaurantId } = useSessionStore();
  const {
    categories,
    menuItems,
    createCategory,
    createMenuItem,
    toggleMenuItem,
    deleteMenuItem,
  } = usePosStore();

  const [tab, setTab] = useState<'items' | 'categories'>('items');
  const [showForm, setShowForm] = useState(false);

  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');

  const [categoryName, setCategoryName] = useState('');

  const restaurantCategories = categories
    .filter((c) => c.restaurant_id === activeRestaurantId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const restaurantItems = menuItems.filter((m) => m.restaurant_id === activeRestaurantId);

  const defaultCategoryId = itemCategoryId || restaurantCategories[0]?.id || '';

  const handleCreateItem = () => {
    const price = parseFloat(itemPrice);
    if (!itemName.trim() || !activeRestaurantId || !defaultCategoryId || !price) return;
    createMenuItem({
      restaurant_id: activeRestaurantId,
      category_id: defaultCategoryId,
      name: itemName.trim(),
      description: itemDesc.trim() || undefined,
      price,
      is_available: true,
    });
    setItemName('');
    setItemDesc('');
    setItemPrice('');
    setShowForm(false);
  };

  const handleCreateCategory = () => {
    if (!categoryName.trim() || !activeRestaurantId) return;
    createCategory({ restaurant_id: activeRestaurantId, name: categoryName.trim() });
    setCategoryName('');
    setShowForm(false);
  };

  const confirmDeleteItem = (id: string, name: string) => {
    Alert.alert('Eliminar platillo', `¿Eliminar ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteMenuItem(id) },
    ]);
  };

  return (
    <Screen scroll>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'items' && styles.tabActive]}
          onPress={() => { setTab('items'); setShowForm(false); }}
        >
          <Text style={[styles.tabText, tab === 'items' && styles.tabTextActive]}>Platillos</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'categories' && styles.tabActive]}
          onPress={() => { setTab('categories'); setShowForm(false); }}
        >
          <Text style={[styles.tabText, tab === 'categories' && styles.tabTextActive]}>Categorías</Text>
        </Pressable>
      </View>

      <Button
        title={showForm ? 'Cancelar' : tab === 'items' ? 'Nuevo platillo' : 'Nueva categoría'}
        variant={showForm ? 'outline' : 'primary'}
        icon={showForm ? 'close-outline' : 'add-outline'}
        onPress={() => setShowForm((v) => !v)}
        containerStyle={styles.addBtn}
      />

      {showForm && tab === 'items' ? (
        <View style={styles.form}>
          <Input label="Nombre" value={itemName} onChangeText={setItemName} icon="restaurant-outline" />
          <Input label="Descripción (opcional)" value={itemDesc} onChangeText={setItemDesc} />
          <Input
            label="Precio"
            value={itemPrice}
            onChangeText={setItemPrice}
            keyboardType="decimal-pad"
            icon="cash-outline"
          />
          <Text style={styles.fieldLabel}>Categoría</Text>
          <View style={styles.chipRow}>
            {restaurantCategories.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.chip, defaultCategoryId === c.id && styles.chipActive]}
                onPress={() => setItemCategoryId(c.id)}
              >
                <Text style={[styles.chipText, defaultCategoryId === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button title="Guardar platillo" onPress={handleCreateItem} icon="checkmark-outline" />
        </View>
      ) : null}

      {showForm && tab === 'categories' ? (
        <View style={styles.form}>
          <Input label="Nombre de categoría" value={categoryName} onChangeText={setCategoryName} />
          <Button title="Guardar categoría" onPress={handleCreateCategory} icon="checkmark-outline" />
        </View>
      ) : null}

      {tab === 'items' ? (
        <>
          <Text style={styles.listTitle}>{restaurantItems.length} platillos</Text>
          <View style={styles.list}>
            {restaurantItems.map((item) => {
              const cat = restaurantCategories.find((c) => c.id === item.category_id);
              return (
                <AdminListRow
                  key={item.id}
                  title={item.name}
                  subtitle={`${cat?.name ?? '—'} · ${formatCurrency(item.price)}`}
                  badge={item.is_available ? 'Disponible' : 'Agotado'}
                  badgeColor={item.is_available ? colors.success : colors.textMuted}
                  toggleActive={item.is_available}
                  onToggle={() => toggleMenuItem(item.id)}
                  onDelete={() => confirmDeleteItem(item.id, item.name)}
                />
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.listTitle}>{restaurantCategories.length} categorías</Text>
          <View style={styles.list}>
            {restaurantCategories.map((cat) => {
              const count = restaurantItems.filter((i) => i.category_id === cat.id).length;
              return (
                <AdminListRow
                  key={cat.id}
                  title={cat.name}
                  subtitle={`${count} platillo${count !== 1 ? 's' : ''}`}
                  badge={`#${cat.sort_order}`}
                />
              );
            })}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primaryMuted },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  addBtn: { marginBottom: 16 },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.primary },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: { gap: 8, paddingBottom: 24 },
});
