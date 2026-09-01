import { Ionicons } from '@expo/vector-icons';
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

import { Button } from '@/components/ui/Button';
import { useTableStatusConfig } from '@/constants/status';
import { colors, radius, shadows } from '@/constants/legacyTheme';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import type { TableStatus } from '@/types';

interface AssignTableModalProps {
  visible: boolean;
  onClose: () => void;
  initialTableId?: string;
}

const STATUS_OPTIONS: { id: TableStatus; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'free', icon: 'checkmark-circle-outline', label: 'Libre' },
  { id: 'occupied', icon: 'flame-outline', label: 'Ocupada' },
  { id: 'bill_requested', icon: 'receipt-outline', label: 'Cuenta' },
  { id: 'reserved', icon: 'bookmark-outline', label: 'Reservada' },
];

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function AssignTableModal({ visible, onClose, initialTableId }: AssignTableModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useSessionStore();
  const { tables, staff, assignTable, getStaff, getOrderByTable } = usePosStore();
  const tableStatusConfig = useTableStatusConfig();

  const [selectedTableId, setSelectedTableId] = useState(initialTableId ?? tables[0]?.id ?? '');
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TableStatus>('occupied');

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const hasActiveOrder = selectedTableId ? Boolean(getOrderByTable(selectedTableId)) : false;

  useEffect(() => {
    if (visible && initialTableId) {
      setSelectedTableId(initialTableId);
    }
  }, [visible, initialTableId]);

  useEffect(() => {
    if (selectedTable) {
      setSelectedWaiterId(selectedTable.assigned_waiter_id ?? null);
      setSelectedStatus(selectedTable.status);
    }
  }, [selectedTableId, visible, selectedTable?.assigned_waiter_id, selectedTable?.status]);

  const handleConfirm = () => {
    if (!selectedTableId) return;
    assignTable(selectedTableId, selectedWaiterId, selectedStatus);
    onClose();
  };

  const handleAssignMe = () => {
    const demoWaiter = staff.find((s) => s.name.includes(user?.full_name?.split(' ')[0] ?? ''));
    setSelectedWaiterId(demoWaiter?.id ?? staff[0]?.id ?? null);
  };

  const handleClear = () => {
    setSelectedWaiterId(null);
    if (!hasActiveOrder) setSelectedStatus('free');
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
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Asignar mesa</Text>
              <Text style={styles.subtitle}>Mesero y estado</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Mesa</Text>
          <ScrollView
            horizontal
            style={styles.tableRowScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tableRow}
          >
            {tables.map((table) => {
              const active = table.id === selectedTableId;
              const config = tableStatusConfig[table.status];
              const waiter = table.assigned_waiter_id ? getStaff(table.assigned_waiter_id) : null;

              return (
                <Pressable
                  key={table.id}
                  style={[
                    styles.tableBtn,
                    active && styles.tableBtnActive,
                    { borderColor: active ? colors.primary : config.border },
                  ]}
                  onPress={() => setSelectedTableId(table.id)}
                >
                  <Text style={[styles.tableNum, active && styles.tableNumActive]}>{table.number}</Text>
                  {waiter ? (
                    <View style={[styles.tableWaiterDot, { backgroundColor: waiter.color }]}>
                      <Text style={styles.tableWaiterInitials}>{getInitials(waiter.name)}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.sectionLabel}>Mesero</Text>
          <View style={styles.waiterGrid}>
            <Pressable
              style={[styles.waiterCard, !selectedWaiterId && styles.waiterCardActive]}
              onPress={handleClear}
            >
              <View style={[styles.waiterAvatar, styles.waiterAvatarEmpty]}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </View>
              <Text style={styles.waiterName}>Sin asignar</Text>
            </Pressable>

            {staff.map((member) => {
              const active = selectedWaiterId === member.id;
              return (
                <Pressable
                  key={member.id}
                  style={[styles.waiterCard, active && styles.waiterCardActive]}
                  onPress={() => setSelectedWaiterId(member.id)}
                >
                  <View style={[styles.waiterAvatar, { backgroundColor: member.color }]}>
                    <Text style={styles.waiterInitials}>{getInitials(member.name)}</Text>
                  </View>
                  <Text style={styles.waiterName} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.meBtn} onPress={handleAssignMe}>
            <Ionicons name="hand-left-outline" size={16} color={colors.primary} />
            <Text style={styles.meBtnText}>Asignarme esta mesa</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Estado</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = selectedStatus === opt.id;
              const disabled = opt.id === 'free' && hasActiveOrder;
              const config = tableStatusConfig[opt.id];

              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.statusBtn,
                    active && { backgroundColor: config.bg, borderColor: config.color },
                    disabled && styles.statusBtnDisabled,
                  ]}
                  onPress={() => !disabled && setSelectedStatus(opt.id)}
                  disabled={disabled}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={active ? config.color : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>

          <Button title="Guardar asignación" onPress={handleConfirm} icon="checkmark-circle-outline" size="lg" />
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
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  closeBtn: { padding: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  tableRowScroll: { flexGrow: 0, flexShrink: 0 },
  tableRow: { gap: 8, paddingBottom: 16 },
  tableBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    position: 'relative',
  },
  tableBtnActive: { backgroundColor: colors.primaryMuted },
  tableNum: { fontSize: 18, fontWeight: '800', color: colors.textSecondary },
  tableNumActive: { color: colors.primary },
  tableWaiterDot: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  tableWaiterInitials: { fontSize: 8, fontWeight: '800', color: '#FFF' },
  waiterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  waiterCard: {
    width: 72,
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  waiterCardActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  waiterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waiterAvatarEmpty: { backgroundColor: colors.borderLight },
  waiterInitials: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  waiterName: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, textAlign: 'center' },
  meBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.md,
  },
  meBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  statusRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statusBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  statusBtnDisabled: { opacity: 0.35 },
});
