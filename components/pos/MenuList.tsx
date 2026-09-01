import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';

import { useTheme } from '@/components/theme/ThemeProvider';
import { formatCurrency } from '@/lib/demo-data';
import { colors, radius, shadows } from '@/constants/legacyTheme';
import { radius as newRadius, space, type Palette } from '@/constants/theme';
import type { MenuCategory, MenuItem } from '@/types';

interface MenuListProps {
  categories: MenuCategory[];
  items: MenuItem[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onAddItem: (item: MenuItem) => void;
  /** 'quick' es la venta rápida embebida en Caja (tokens nuevos, sin descripción ni botón +). */
  layout?: 'list' | 'grid' | 'quick';
  columns?: number;
  /** Cuando true, la lista virtualiza el menú (recomendado si el padre tiene altura acotada). */
  scrollable?: boolean;
}

const MenuQuickItem = memo(function MenuQuickItem({
  item,
  onAddItem,
  styles,
  theme,
}: {
  item: MenuItem;
  onAddItem: (item: MenuItem) => void;
  styles: ReturnType<typeof makeQuickStyles>;
  theme: Palette;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
      onPress={() => onAddItem(item)}
    >
      <View style={styles.quickIcon}>
        <Ionicons name="fast-food-outline" size={16} color={theme.mut} />
      </View>
      <Text style={styles.quickName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.quickPrice}>{formatCurrency(item.price)}</Text>
    </Pressable>
  );
});

const categoryIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  Entradas: 'leaf-outline',
  'Platos fuertes': 'restaurant-outline',
  Bebidas: 'wine-outline',
  Postres: 'ice-cream-outline',
};

const MenuListItem = memo(function MenuListItem({
  item,
  onAddItem,
}: {
  item: MenuItem;
  onAddItem: (item: MenuItem) => void;
}) {
  return (
    <Pressable
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
  );
});

const MenuGridItem = memo(function MenuGridItem({
  item,
  onAddItem,
}: {
  item: MenuItem;
  onAddItem: (item: MenuItem) => void;
}) {
  return (
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
  );
});

export function MenuList({
  categories,
  items,
  selectedCategoryId,
  onSelectCategory,
  onAddItem,
  layout = 'list',
  columns = 2,
  scrollable = false,
}: MenuListProps) {
  const { palette: theme } = useTheme();
  const quickStyles = useMemo(() => makeQuickStyles(theme), [theme]);
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  const isGrid = layout === 'grid';
  const numColumns = isGrid ? columns : 1;

  if (layout === 'quick') {
    return (
      <View style={quickStyles.container}>
        <ScrollView
          horizontal
          style={quickStyles.tabsScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={quickStyles.tabs}
        >
          {sortedCategories.map((cat) => {
            const active = selectedCategoryId === cat.id;
            const icon = categoryIcons[cat.name] ?? 'fast-food-outline';
            return (
              <Pressable
                key={cat.id}
                style={[quickStyles.tab, active && quickStyles.tabActive]}
                onPress={() => onSelectCategory(cat.id)}
              >
                <Ionicons name={icon} size={14} color={active ? theme.a2.on : theme.mut} />
                <Text style={[quickStyles.tabText, active && quickStyles.tabTextActive]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {items.length === 0 ? (
          <Text style={quickStyles.empty}>No hay platillos en esta categoría</Text>
        ) : (
          <View style={quickStyles.grid}>
            {items.map((item) => (
              <View key={item.id} style={[quickStyles.gridCell, { width: `${100 / columns}%` }]}>
                <MenuQuickItem item={item} onAddItem={onAddItem} styles={quickStyles} theme={theme} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  const renderItem: ListRenderItem<MenuItem> = useCallback(
    ({ item }) =>
      isGrid ? (
        <View style={styles.gridCellFlex}>
          <MenuGridItem item={item} onAddItem={onAddItem} />
        </View>
      ) : (
        <MenuListItem item={item} onAddItem={onAddItem} />
      ),
    [isGrid, onAddItem],
  );

  const keyExtractor = useCallback((item: MenuItem) => item.id, []);

  const categoryTabs = (
    <ScrollView
      horizontal
      style={styles.tabsScroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabs}
    >
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
  );

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        {categoryTabs}
        <View style={styles.emptyWrap}>
          <Ionicons name="restaurant-outline" size={36} color={colors.textMuted} />
          <Text style={styles.empty}>No hay platillos en esta categoría</Text>
        </View>
      </View>
    );
  }

  if (scrollable) {
    return (
      <View style={styles.container}>
        {categoryTabs}
        <FlatList
          data={items}
          key={`menu-${layout}-${numColumns}`}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={numColumns}
          style={styles.listFlex}
          contentContainerStyle={isGrid ? undefined : styles.listContent}
          columnWrapperStyle={isGrid ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {categoryTabs}
      {isGrid ? (
        <View style={styles.grid}>
          {items.map((item) => (
            <View key={item.id} style={[styles.gridCell, { width: `${100 / columns}%` }]}>
              <MenuGridItem item={item} onAddItem={onAddItem} />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.items}>
          {items.map((item) => (
            <MenuListItem key={item.id} item={item} onAddItem={onAddItem} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 14 },
  listFlex: { flex: 1 },
  tabsScroll: { flexGrow: 0, flexShrink: 0 },
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
  gridRow: { marginHorizontal: -6 },
  listContent: { gap: 10, paddingBottom: 8 },
  gridCell: { padding: 6 },
  gridCellFlex: { flex: 1, padding: 6 },
  gridCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 148,
    justifyContent: 'space-between',
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

function makeQuickStyles(theme: Palette) {
  return StyleSheet.create({
    container: { gap: space.sm + 2 },
    tabsScroll: { flexGrow: 0, flexShrink: 0 },
    tabs: { gap: space.xs, paddingBottom: 2 },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: space.sm + 2,
      paddingVertical: 8,
      borderRadius: newRadius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.line,
    },
    tabActive: { backgroundColor: theme.a2.solid, borderColor: theme.a2.solid },
    tabText: { fontSize: 12, fontWeight: '600', color: theme.mut },
    tabTextActive: { color: theme.a2.on },
    empty: { fontSize: 13, color: theme.mut, textAlign: 'center', paddingVertical: space.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space.xs },
    gridCell: { padding: space.xs },
    quickCard: {
      backgroundColor: theme.surface,
      borderRadius: newRadius.lg,
      borderWidth: 1,
      borderColor: theme.line,
      padding: space.sm + 2,
      gap: 4,
    },
    quickCardPressed: { backgroundColor: theme.surface2 },
    quickIcon: {
      width: 30,
      height: 30,
      borderRadius: newRadius.sm,
      backgroundColor: theme.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickName: { fontSize: 13, fontWeight: '600', color: theme.text },
    quickPrice: { fontSize: 12, fontWeight: '700', color: theme.a2.ink, fontVariant: ['tabular-nums'] },
  });
}
