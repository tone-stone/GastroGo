import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows } from '@/constants/theme';
import type { TableStatus } from '@/types';

export type DashboardFilter = TableStatus | 'all';

interface FilterOption {
  id: DashboardFilter;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

const FILTERS: FilterOption[] = [
  { id: 'all', icon: 'grid-outline', activeIcon: 'grid', color: colors.text, bg: colors.borderLight },
  { id: 'free', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle', color: colors.success, bg: colors.successBg },
  { id: 'occupied', icon: 'flame-outline', activeIcon: 'flame', color: colors.info, bg: colors.infoBg },
  { id: 'bill_requested', icon: 'receipt-outline', activeIcon: 'receipt', color: colors.warning, bg: colors.warningBg },
  { id: 'reserved', icon: 'bookmark-outline', activeIcon: 'bookmark', color: colors.coffee, bg: colors.coffeeMuted },
];

interface StatusFilterBarProps {
  filter: DashboardFilter;
  counts: Record<DashboardFilter, number>;
  onChange: (filter: DashboardFilter) => void;
}

export function StatusFilterBar({ filter, counts, onChange }: StatusFilterBarProps) {
  const visibleFilters = FILTERS.filter(
    (f) => f.id !== 'reserved' || counts.reserved > 0,
  );

  return (
    <View style={styles.wrap}>
      {visibleFilters.map((item) => {
        const active = filter === item.id;
        const count = counts[item.id];

        return (
          <Pressable
            key={item.id}
            style={[styles.btn, active && { backgroundColor: item.bg, borderColor: item.color }]}
            onPress={() => onChange(item.id)}
            accessibilityLabel={item.id}
          >
            <Ionicons
              name={active ? item.activeIcon : item.icon}
              size={20}
              color={active ? item.color : colors.textMuted}
            />
            <View style={[styles.badge, active && { backgroundColor: item.color }]}>
              <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{count}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: colors.textSecondary },
  badgeTextActive: { color: '#FFF' },
});
