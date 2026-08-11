import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '@/components/admin/AdminListRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { colors, radius } from '@/constants/theme';
import { ROLE_LABELS } from '@/lib/roles';
import { useAdminStore } from '@/stores/adminStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['waiter', 'cashier', 'manager', 'owner'];

export default function AdminUsersScreen() {
  const { activeRestaurantId } = useSessionStore();
  const { users, loadUsers, createUser, toggleUserActive, deleteUser } = useAdminStore();

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('waiter');

  useEffect(() => {
    if (activeRestaurantId) loadUsers(activeRestaurantId);
  }, [activeRestaurantId, loadUsers]);

  const restaurantUsers = users.filter((u) => u.restaurant_id === activeRestaurantId);

  const handleCreate = async () => {
    if (!fullName.trim() || !email.trim() || !activeRestaurantId) return;
    if (restaurantUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      Alert.alert('Error', 'Ya existe un usuario con ese correo');
      return;
    }
    try {
      await createUser({
        restaurant_id: activeRestaurantId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
      });
      setFullName('');
      setEmail('');
      setRole('waiter');
      setShowForm(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear el usuario');
    }
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Eliminar usuario', `¿Eliminar a ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteUser(id) },
    ]);
  };

  return (
    <Screen scroll>
      <Button
        title={showForm ? 'Cancelar' : 'Nuevo usuario'}
        variant={showForm ? 'outline' : 'primary'}
        icon={showForm ? 'close-outline' : 'person-add-outline'}
        onPress={() => setShowForm((v) => !v)}
        containerStyle={styles.addBtn}
      />

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Crear usuario</Text>
          <Input label="Nombre completo" value={fullName} onChangeText={setFullName} icon="person-outline" />
          <Input
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            icon="mail-outline"
          />
          <Text style={styles.fieldLabel}>Rol</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <Pressable
                key={r}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                  {ROLE_LABELS[r]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Button title="Guardar usuario" onPress={handleCreate} icon="checkmark-outline" />
        </View>
      ) : null}

      <Text style={styles.listTitle}>{restaurantUsers.length} usuarios</Text>
      <View style={styles.list}>
        {restaurantUsers.map((u) => (
          <AdminListRow
            key={u.id}
            title={u.full_name}
            subtitle={u.email}
            badge={ROLE_LABELS[u.role]}
            badgeColor={u.is_active ? colors.primary : colors.textMuted}
            avatarText={u.full_name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            avatarColor={u.is_active ? colors.primary : colors.textMuted}
            toggleActive={u.is_active}
            onToggle={() => toggleUserActive(u.id)}
            onDelete={() => confirmDelete(u.id, u.full_name)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  formTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  roleChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  roleChipTextActive: { color: colors.primary },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: { gap: 8, paddingBottom: 24 },
});
