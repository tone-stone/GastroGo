import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminListRow } from '@/components/admin/AdminListRow';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { tableStatusConfig } from '@/constants/status';
import { colors, radius } from '@/constants/theme';
import { TABLE_ZONES } from '@/lib/roles';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function AdminTablesScreen() {
  const { activeRestaurantId } = useSessionStore();
  const { tables, createTable, deleteTable } = usePosStore();

  const [showForm, setShowForm] = useState(false);
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [zone, setZone] = useState(TABLE_ZONES[0]);

  const restaurantTables = tables
    .filter((t) => t.restaurant_id === activeRestaurantId)
    .sort((a, b) => a.number - b.number);

  const handleCreate = () => {
    const num = parseInt(number, 10);
    const cap = parseInt(capacity, 10);
    if (!activeRestaurantId || !num || !cap) return;
    if (restaurantTables.some((t) => t.number === num)) {
      Alert.alert('Error', 'Ya existe una mesa con ese número');
      return;
    }
    createTable({
      restaurant_id: activeRestaurantId,
      number: num,
      capacity: cap,
      zone,
    });
    setNumber('');
    setCapacity('4');
    setShowForm(false);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Eliminar mesa', `¿Eliminar ${name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const table = tables.find((t) => t.id === id);
          if (table && table.status !== 'free') {
            Alert.alert('No se puede eliminar', 'La mesa tiene una orden activa');
            return;
          }
          deleteTable(id);
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <Button
        title={showForm ? 'Cancelar' : 'Nueva mesa'}
        variant={showForm ? 'outline' : 'primary'}
        icon={showForm ? 'close-outline' : 'add-outline'}
        onPress={() => setShowForm((v) => !v)}
        containerStyle={styles.addBtn}
      />

      {showForm ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Alta de mesa</Text>
          <Input
            label="Número de mesa"
            value={number}
            onChangeText={setNumber}
            keyboardType="number-pad"
            icon="grid-outline"
          />
          <Input
            label="Capacidad (personas)"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
            icon="people-outline"
          />
          <Text style={styles.fieldLabel}>Zona</Text>
          <View style={styles.zoneRow}>
            {TABLE_ZONES.map((z) => (
              <Pressable
                key={z}
                style={[styles.zoneChip, zone === z && styles.zoneChipActive]}
                onPress={() => setZone(z)}
              >
                <Text style={[styles.zoneChipText, zone === z && styles.zoneChipTextActive]}>{z}</Text>
              </Pressable>
            ))}
          </View>
          <Button title="Registrar mesa" onPress={handleCreate} icon="checkmark-outline" />
        </View>
      ) : null}

      <Text style={styles.listTitle}>{restaurantTables.length} mesas</Text>
      <View style={styles.list}>
        {restaurantTables.map((t) => {
          const status = tableStatusConfig[t.status];
          return (
            <AdminListRow
              key={t.id}
              title={`Mesa ${t.number}`}
              subtitle={`${t.zone} · ${t.capacity} personas`}
              badge={status.label}
              badgeColor={status.color}
              onDelete={t.status === 'free' ? () => confirmDelete(t.id, t.name) : undefined}
            />
          );
        })}
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
  zoneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zoneChipActive: { backgroundColor: colors.goldMuted, borderColor: colors.gold },
  zoneChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  zoneChipTextActive: { color: colors.coffee },
  listTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  list: { gap: 8, paddingBottom: 24 },
});
