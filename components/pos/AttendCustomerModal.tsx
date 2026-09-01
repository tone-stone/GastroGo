import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ServiceFlowSteps } from '@/components/pos/ServiceFlowSteps';
import { Button } from '@/components/ui/Button';
import { useTableStatusConfig } from '@/constants/status';
import { colors, radius, shadows } from '@/constants/legacyTheme';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';

interface AttendCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  initialTableId?: string;
}

export function AttendCustomerModal({ visible, onClose, initialTableId }: AttendCustomerModalProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { staffMemberId, activeRestaurantId } = useSessionStore();
  const { tables, startTableService, getStaff } = usePosStore();
  const tableStatusConfig = useTableStatusConfig();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTableId, setSelectedTableId] = useState<string>('');

  const waiter = staffMemberId ? getStaff(staffMemberId) : null;
  const freeTables = tables.filter((t) => t.status === 'free' || t.status === 'reserved');
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  useEffect(() => {
    if (visible) {
      setStep(initialTableId ? 2 : 1);
      setSelectedTableId(initialTableId ?? freeTables[0]?.id ?? '');
    }
  }, [visible, initialTableId, freeTables]);

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setStep(2);
  };

  const handleStartService = () => {
    if (!selectedTableId || !staffMemberId || !activeRestaurantId) return;
    startTableService(selectedTableId, staffMemberId, activeRestaurantId);
    onClose();
    router.push(`/table/${selectedTableId}`);
  };

  if (!waiter || !staffMemberId) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }, shadows.md]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={[styles.waiterAvatar, { backgroundColor: waiter.color }]}>
              <Text style={styles.waiterInitials}>
                {waiter.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Atender cliente</Text>
              <Text style={styles.subtitle}>{waiter.name} · Mesero</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.flowCard}>
            <ServiceFlowSteps activeStep={step === 1 ? 'assign' : 'order'} />
          </View>

          {step === 1 ? (
            <>
              <Text style={styles.sectionLabel}>Paso 1 — Elige una mesa libre</Text>
              {freeTables.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="sad-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No hay mesas libres</Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  style={styles.tableRowScroll}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tableRow}
                >
                  {freeTables.map((table) => {
                    const config = tableStatusConfig[table.status];
                    return (
                      <Pressable
                        key={table.id}
                        style={[styles.tableCard, { borderColor: config.border }]}
                        onPress={() => handleSelectTable(table.id)}
                      >
                        <Text style={styles.tableNum}>{table.number}</Text>
                        <Text style={styles.tableZone}>{table.zone}</Text>
                        <View style={styles.tableMeta}>
                          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
                          <Text style={styles.tableCap}>{table.capacity}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Paso 2 — Confirmar y abrir comanda</Text>
              {selectedTable ? (
                <View style={styles.confirmCard}>
                  <View style={styles.confirmRow}>
                    <Ionicons name="grid-outline" size={20} color={colors.primary} />
                    <View>
                      <Text style={styles.confirmTitle}>Mesa {selectedTable.number}</Text>
                      <Text style={styles.confirmSub}>
                        {selectedTable.zone} · {selectedTable.capacity} personas
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.confirmRow}>
                    <Ionicons name="person-outline" size={20} color={colors.coffee} />
                    <View>
                      <Text style={styles.confirmTitle}>{waiter.name}</Text>
                      <Text style={styles.confirmSub}>Mesero asignado</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              <Button
                title="Abrir comanda y tomar orden"
                onPress={handleStartService}
                icon="restaurant-outline"
                size="lg"
              />
              <Text style={styles.kitchenHint}>
                La orden se envía a cocina desde el menú de la mesa
              </Text>
              <Pressable style={styles.backBtn} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={styles.backText}>Cambiar mesa</Text>
              </Pressable>
            </>
          )}
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
    maxHeight: '88%',
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
  waiterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiterInitials: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  flowCard: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.coffee,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tableRowScroll: { flexGrow: 0, flexShrink: 0 },
  tableRow: { gap: 10, paddingBottom: 20 },
  tableCard: {
    width: 88,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
    ...shadows.sm,
  },
  tableNum: { fontSize: 24, fontWeight: '800', color: colors.primary },
  tableZone: { fontSize: 11, color: colors.textMuted },
  tableMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  tableCap: { fontSize: 11, color: colors.textMuted },
  confirmCard: {
    backgroundColor: colors.coffeeMuted,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  confirmTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  confirmSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  backText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  kitchenHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 4,
  },
  empty: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
