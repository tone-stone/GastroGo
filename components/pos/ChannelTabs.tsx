import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/theme/ThemeProvider';
import { radius, space, type Palette } from '@/constants/theme';
import { formatCurrency } from '@/lib/demo-data';

export interface ChannelTabItem {
  id: string;
  label: string;
  sublabel?: string;
  total: number;
  active: boolean;
  badge?: string;
  onPress: () => void;
}

interface ChannelTabsProps {
  items: ChannelTabItem[];
  onAddTakeaway?: () => void;
}

export function ChannelTabs({ items, onAddTakeaway }: ChannelTabsProps) {
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.tab, item.active && styles.tabActive]}
          onPress={item.onPress}
        >
          <Text style={[styles.label, item.active && styles.labelActive]} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[styles.total, item.active && styles.totalActive]} numberOfLines={1}>
            {formatCurrency(item.total)}
          </Text>
          {item.badge ? (
            <View style={[styles.badge, item.active && styles.badgeActive]}>
              <Text style={[styles.badgeText, item.active && styles.badgeTextActive]}>{item.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}

      {onAddTakeaway ? (
        <Pressable style={styles.addBtn} onPress={onAddTakeaway} accessibilityLabel="Nueva venta para llevar">
          <Ionicons name="add" size={16} color={theme.mut} />
          <Text style={styles.addText}>Para llevar</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    scroll: { flexGrow: 0, flexShrink: 0 },
    row: { gap: space.sm, paddingVertical: 2, paddingRight: space.xs },
    tab: {
      minWidth: 120,
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.sm,
      borderRadius: radius.lg,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.line,
      gap: 2,
    },
    tabActive: { backgroundColor: theme.a2.solid, borderColor: theme.a2.solid },
    label: { fontSize: 12, fontWeight: '600', color: theme.mut },
    labelActive: { color: theme.a2.on },
    total: { fontSize: 15, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    totalActive: { color: theme.a2.on },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: theme.a2.soft,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginTop: 2,
    },
    badgeActive: { backgroundColor: 'rgba(0,0,0,0.15)' },
    badgeText: { fontSize: 9, fontWeight: '700', color: theme.a2.ink },
    badgeTextActive: { color: theme.a2.on },
    addBtn: {
      minWidth: 100,
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.line,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    addText: { fontSize: 12, fontWeight: '600', color: theme.mut },
  });
}
