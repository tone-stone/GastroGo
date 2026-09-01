import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, radius } from '@/constants/legacyTheme';
import { isAdminRole, ROLE_LABELS } from '@/lib/roles';
import { useAdminStore } from '@/stores/adminStore';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { role, user, activeRestaurantId } = useSessionStore();
  const { users, loadUsers } = useAdminStore();
  const { tables, staff, menuItems } = usePosStore();

  useEffect(() => {
    if (activeRestaurantId) loadUsers(activeRestaurantId);
  }, [activeRestaurantId, loadUsers]);

  if (!isAdminRole(role)) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  const restaurantUsers = users.filter((u) => u.restaurant_id === activeRestaurantId);
  const restaurantStaff = staff.filter((s) => s.restaurant_id === activeRestaurantId);
  const restaurantTables = tables.filter((t) => t.restaurant_id === activeRestaurantId);
  const restaurantItems = menuItems.filter((m) => m.restaurant_id === activeRestaurantId);

  return (
    <Screen scroll>
      <AppHeader
        title="Administración"
        subtitle="Configura usuarios, mesas y menú del local"
      />

      <View style={styles.roleBanner}>
        <Text style={styles.roleLabel}>Sesión como</Text>
        <Text style={styles.roleValue}>{ROLE_LABELS[role]} · {user?.full_name}</Text>
      </View>

      <Text style={styles.sectionTitle}>Gestión del local</Text>
      <View style={styles.cards}>
        <AdminSectionCard
          title="Usuarios"
          description="Crear cuentas de acceso y asignar roles"
          icon="people-outline"
          count={restaurantUsers.length}
          color={colors.coffee}
          onPress={() => router.push('/admin/users')}
        />
        <AdminSectionCard
          title="Meseros y staff"
          description="Dar de alta meseros, cajeros y gerentes"
          icon="person-add-outline"
          count={restaurantStaff.length}
          color={colors.primary}
          onPress={() => router.push('/admin/staff')}
        />
        <AdminSectionCard
          title="Mesas"
          description="Registrar mesas, zonas y capacidad"
          icon="grid-outline"
          count={restaurantTables.length}
          color={colors.gold}
          onPress={() => router.push('/admin/tables')}
        />
        <AdminSectionCard
          title="Menú"
          description="Categorías, platillos y precios"
          icon="restaurant-outline"
          count={restaurantItems.length}
          color={colors.success}
          onPress={() => router.push('/admin/menu')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  roleBanner: {
    backgroundColor: colors.coffeeMuted,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleLabel: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
  roleValue: { fontSize: 15, fontWeight: '700', color: colors.coffee, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  cards: { gap: 10 },
});
