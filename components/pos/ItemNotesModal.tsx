import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, radius, shadows } from '@/constants/legacyTheme';

interface ItemNotesModalProps {
  visible: boolean;
  itemName: string;
  initialNotes?: string;
  mode?: 'add' | 'edit';
  onClose: () => void;
  onSave: (notes: string) => void;
}

const QUICK_NOTES = ['Sin cebolla', 'Sin picante', 'Extra queso', 'Bien cocido', 'Término medio'];

export function ItemNotesModal({
  visible,
  itemName,
  initialNotes = '',
  mode = 'add',
  onClose,
  onSave,
}: ItemNotesModalProps) {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    if (visible) setNotes(initialNotes);
  }, [visible, initialNotes]);

  const handleSave = () => {
    onSave(notes.trim());
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, shadows.md]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="flame-outline" size={20} color={colors.coffee} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Comentario para cocina</Text>
              <Text style={styles.subtitle}>{itemName}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Input
            label="Instrucciones especiales"
            value={notes}
            onChangeText={setNotes}
            placeholder="Ej. sin cebolla, extra picante..."
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <Text style={styles.quickLabel}>Atajos rápidos</Text>
          <View style={styles.quickRow}>
            {QUICK_NOTES.map((note) => (
              <Pressable
                key={note}
                style={styles.quickChip}
                onPress={() => setNotes((prev) => (prev ? `${prev}, ${note.toLowerCase()}` : note))}
              >
                <Text style={styles.quickChipText}>{note}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            {mode === 'add' ? (
              <Button title="Sin comentario" variant="ghost" onPress={onClose} containerStyle={styles.actionBtn} />
            ) : (
              <Button title="Cancelar" variant="ghost" onPress={onClose} containerStyle={styles.actionBtn} />
            )}
            <Button
              title={mode === 'add' ? 'Agregar a comanda' : 'Guardar comentario'}
              onPress={handleSave}
              icon="checkmark-outline"
              containerStyle={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.coffeeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 8,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1 },
});
