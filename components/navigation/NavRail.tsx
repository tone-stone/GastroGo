import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/theme/ThemeProvider';
import { radius, space, type Palette } from '@/constants/theme';
import { isAdminRole } from '@/lib/roles';
import { useToastStore } from '@/stores/toastStore';
import { useSessionStore } from '@/stores/sessionStore';

interface RailItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href?: string;
  match?: (pathname: string) => boolean;
  comingSoon?: boolean;
}

export function NavRail() {
  const router = useRouter();
  const pathname = usePathname();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const role = useSessionStore((s) => s.role);
  const showToast = useToastStore((s) => s.show);
  const showAdmin = isAdminRole(role);

  const items: RailItem[] = [
    { key: 'mesas', label: 'Mesas', icon: 'grid-outline', href: '/(app)/(tabs)/mesero', match: (p) => p === '/mesero' },
    { key: 'comanda', label: 'Comanda', icon: 'create-outline', href: '/(app)/(tabs)/mesero', match: (p) => p.startsWith('/table/') },
    { key: 'caja', label: 'Caja', icon: 'calculator-outline', href: '/(app)/(tabs)', match: (p) => p === '/' || p === '' },
    { key: 'cocina', label: 'Cocina', icon: 'flame-outline', href: '/kitchen', match: (p) => p.startsWith('/kitchen') },
    { key: 'ordenes', label: 'Órdenes', icon: 'document-text-outline', href: '/(app)/(tabs)/orders', match: (p) => p === '/orders' },
    { key: 'insumos', label: 'Insumos', icon: 'cube-outline', comingSoon: true },
    { key: 'corte', label: 'Corte', icon: 'wallet-outline', href: '/corte', match: (p) => p.startsWith('/corte') },
    ...(showAdmin
      ? [{ key: 'admin', label: 'Admin', icon: 'shield-outline' as const, href: '/admin', match: (p: string) => p.startsWith('/admin') }]
      : []),
    { key: 'notas', label: 'Notas', icon: 'document-outline', comingSoon: true },
  ];

  const handlePress = (item: RailItem) => {
    if (item.comingSoon || !item.href) {
      showToast(`${item.label} — próximamente`, 'warn');
      return;
    }
    router.push(item.href as never);
  };

  return (
    <View style={styles.rail}>
      <View style={styles.logo}>
        <Ionicons name="restaurant" size={20} color={theme.ctaOn} />
      </View>

      <View style={styles.items}>
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : false;
          return (
            <Pressable
              key={item.key}
              onPress={() => handlePress(item)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && !active && styles.itemPressed,
              ]}
              accessibilityLabel={item.label}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? theme.surface2 : item.comingSoon ? theme.onInkMut : theme.onInk}
              />
              <Text
                style={[
                  styles.itemLabel,
                  active && styles.itemLabelActive,
                  item.comingSoon && styles.itemLabelMuted,
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    rail: {
      width: 88,
      backgroundColor: theme.ink,
      alignItems: 'center',
      paddingVertical: space.md,
      gap: space.md,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: theme.cta,
      alignItems: 'center',
      justifyContent: 'center',
    },
    items: { width: '100%', alignItems: 'center', gap: space.xs },
    item: {
      width: 64,
      paddingVertical: space.xs + 2,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    itemPressed: { backgroundColor: theme.inkSoft },
    itemActive: { backgroundColor: theme.cta },
    itemLabel: { fontSize: 11, fontWeight: '600', color: theme.onInk },
    itemLabelActive: { color: theme.surface2 },
    itemLabelMuted: { color: theme.onInkMut },
  });
}
