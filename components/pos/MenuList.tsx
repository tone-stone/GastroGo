import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/demo-data';
import { colors, radius, shadows } from '@/constants/theme';
import type { MenuCategory, MenuItem } from '@/types';

interface MenuListProps {
  categories: MenuCategory[];
  items: MenuItem[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onAddItem: (item: MenuItem) => void;
  layout?: 'list' | 'grid';
  columns?: number;
}

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Entradas: 'leaf-outline',
  'Platos fuertes': 'restaurant-outline',
  Bebidas: 'wine-outline',
  Postres: 'ice-cream-outline',
};

export function MenuList({
  categories,
  items,
  selectedCategoryId,
  onSelectCategory,
  onAddItem,
  layout = 'list',
  columns = 2,
}: MenuListProps) {
  const sortedCategories = [...categories].sort((a, b) => a.sort_order - b.sort_order);
  const isGrid = layout === 'grid';

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {sortedCategories.map((cat) => {
          const active = selectedCategoryId === cat.id;
          const icon = categoryIcons[cat.name] ?? 'fast-food-outline';
          return (
            <Pressable
              key={cat.id}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => onSelectCategory(cat.id)}
            >
              <Ionicons name={icon} size={16} color={active ? '#FFF' : colors.textSecondary} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="restaurant-outline" size={36} color={colors.textMuted} />
          <Text style={styles.empty}>No hay platillos en esta categoría</Text>
        </View>
      ) : isGrid ? (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.id} style={[styles.gridCell, { width: `${100 / columns}%` }]}>
              <Pressable
                style={({ pressed }) => [styles.gridCard, pressed && styles.itemPressed]}
                onPress={() => onAddItem(item)}
              >
                <View style={styles.gridIcon}>
                  <Ionicons name="fast-food-outline" size={22} color={colors.primary} />
                </View>
                <Text style={styles.gridName} numberOfLines={2}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.gridDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.gridFooter}>
                  <Text style={styles.gridPrice}>{formatCurrency(item.price)}</Text>
                  <View style={styles.addBtn}>
                    <Ionicons name="add" size={18} color="#FFF" />
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.items}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => onAddItem(item)}
            >
              <View style={styles.itemLeft}>
                <View style={styles.itemIcon}>
                  <Ionicons name="fast-food-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.itemRight}>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                <View style={styles.addBtn}>
                  <Ionicons name="add" size={18} color="#FFF" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 14 },
  tabs: { gap: 8, paddingBottom: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadows.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  tabTextActive: { color: '#FFF' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridCell: { padding: 6 },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 148,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gridName: { fontSize: 15, fontWeight: '700', color: colors.text, lineHeight: 20 },
  gridDesc: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
  gridFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  gridPrice: { fontSize: 16, fontWeight: '800', color: colors.primary },
  items: { gap: 10 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  itemPressed: { backgroundColor: colors.primaryMuted, borderColor: colors.primaryLight },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text },
  itemDesc: { fontSize: 12, color: colors.textMuted },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.text },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
