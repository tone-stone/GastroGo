import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { MainHeader } from '@/components/navigation/MainHeader';
import { colors, shadows } from '@/constants/legacyTheme';
import { isAdminRole } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

function TabIcon({
  name,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={name} size={22} color={focused ? colors.primary : colors.textMuted} />
    </View>
  );
}

function OrdersTabIcon({ focused }: { focused: boolean }) {
  const activeCount = usePosStore(
    (s) => s.orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled').length
  );

  return (
    <View>
      <TabIcon name={focused ? 'receipt' : 'receipt-outline'} focused={focused} />
      {activeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabLayout() {
  const role = useSessionStore((s) => s.role);
  const loginMode = useSessionStore((s) => s.loginMode);
  const showAdmin = isAdminRole(role);
  const isSale = loginMode === 'sale';
  const isWaiter = loginMode === 'waiter';
  const isWebSale = Platform.OS === 'web' && isSale;

  return (
    <Tabs
      screenOptions={{
        header: () => <MainHeader />,
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: isWebSale ? styles.tabBarWeb : styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Venta',
          href: isSale ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'cash' : 'cash-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mesero"
        options={{
          title: 'Mesas',
          href: isWaiter ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Órdenes',
          tabBarIcon: ({ focused }) => <OrdersTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: showAdmin ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    ...shadows.sm,
  },
  tabBarWeb: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    height: 52,
    paddingBottom: 6,
    paddingTop: 6,
    ...shadows.sm,
  },
  tabLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  iconWrap: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconWrapActive: { backgroundColor: colors.primaryMuted },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
});
