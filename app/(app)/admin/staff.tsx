import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '@/components/admin/AdminListRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { colors, radius } from '@/constants/theme';
import { ROLE_LABELS, STAFF_COLORS } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { UserRole } from '@/types';

const STAFF_ROLES: UserRole[] = ['waiter', 'cashier', 'manager'];

export default function AdminStaffScreen() {
  const { activeRestaurantId } = useSessionStore();
  const { staff, createStaff, deleteStaff } = usePosStore();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('waiter');
  const [color, setColor] = useState(STAFF_COLORS[0]);

  const restaurantStaff = staff.filter((s) => s.restaurant_id === activeRestaurantId);

  const handleCreate = () => {
    if (!name.trim() || !activeRestaurantId) return;
    createStaff({
      restaurant_id: activeRestaurantId,
      name: name.trim(),
      role,
      color,
    });
    setName('');
    setRole('waiter');
    setColor(STAFF_COLORS[(restaurantStaff.length + 1) % STAFF_COLORS.length]);
    setShowForm(false);
  };

  const confirmDelete = (id: string, staffName: string) => {
    Alert.alert('Eliminar staff', `¿Eliminar a ${staffName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteStaff(id) },
    ]);
  };

  return (
    <Screen scroll>
      <Button
        title={showForm ? 'Cancelar' : 'Nuevo mesero / staff'}
        variant={showForm ? 'outline' : 'primary'}
        icon={showForm ? 'close-outline' : 'person-add-outline'}
        onPress={() => setShowForm((v) => !v)}
        containerStyle={styles.addBtn}
      />

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Alta de staff</Text>
          <Input label="Nombre" value={name} onChangeText={setName} icon="person-outline" />
          <Text style={styles.fieldLabel}>Rol operativo</Text>
          <View style={styles.roleRow}>
            {STAFF_ROLES.map((r) => (
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
          <Text style={styles.fieldLabel}>Color en mesas</Text>
          <View style={styles.colorRow}>
            {STAFF_COLORS.map((c) => (
              <Pressable
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
          <Button title="Guardar" onPress={handleCreate} icon="checkmark-outline" />
        </View>
      ) : null}

      <Text style={styles.listTitle}>{restaurantStaff.length} en el equipo</Text>
      <View style={styles.list}>
        {restaurantStaff.map((s) => (
          <AdminListRow
            key={s.id}
            title={s.name}
            subtitle={ROLE_LABELS[s.role]}
            badge={ROLE_LABELS[s.role]}
            badgeColor={s.color}
            avatarText={s.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            avatarColor={s.color}
            onDelete={() => confirmDelete(s.id, s.name)}
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
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: colors.text },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: { gap: 8, paddingBottom: 24 },
});
