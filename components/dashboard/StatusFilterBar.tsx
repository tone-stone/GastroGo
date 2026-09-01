import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tableStatusConfig } from '@/constants/status';
import { radius, shadow, space, theme } from '@/constants/theme';
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
  { id: 'all', icon: 'grid-outline', activeIcon: 'grid', color: theme.text, bg: theme.surface2 },
  { id: 'free', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle', color: tableStatusConfig.free.color, bg: tableStatusConfig.free.bg },
  { id: 'occupied', icon: 'flame-outline', activeIcon: 'flame', color: tableStatusConfig.occupied.color, bg: tableStatusConfig.occupied.bg },
  { id: 'bill_requested', icon: 'receipt-outline', activeIcon: 'receipt', color: tableStatusConfig.bill_requested.color, bg: tableStatusConfig.bill_requested.bg },
  { id: 'reserved', icon: 'bookmark-outline', activeIcon: 'bookmark', color: tableStatusConfig.reserved.color, bg: tableStatusConfig.reserved.bg },
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
              color={active ? item.color : theme.mut}
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
    gap: space.sm,
    marginBottom: space.lg + 4,
    padding: space.sm,
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: theme.line,
    ...shadow.sm,
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
    backgroundColor: theme.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 9, fontWeight: '700', color: theme.mut },
  badgeTextActive: { color: '#FFF' },
});
