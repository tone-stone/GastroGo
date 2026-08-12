import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/demo-data';
import { colors, radius, shadows } from '@/constants/theme';
import type { Order } from '@/types';

interface OrderSummaryProps {
  order: Order;
  tableName?: string;
  onIncrement: (itemId: string, quantity: number) => void;
  onDecrement: (itemId: string, quantity: number) => void;
  onEditNotes?: (itemId: string, itemName: string, currentNotes?: string) => void;
  onSendToKitchen?: () => void;
  onRequestBill?: () => void;
  onCheckout?: () => void;
  billRequested?: boolean;
  variant?: 'default' | 'panel';
  maxItemsHeight?: number;
}

export function OrderSummary({
  order,
  tableName,
  onIncrement,
  onDecrement,
  onEditNotes,
  onSendToKitchen,
  onRequestBill,
  onCheckout,
  billRequested = false,
  variant = 'default',
  maxItemsHeight,
}: OrderSummaryProps) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const canEdit = order.status === 'open';
  const isPanel = variant === 'panel';

  const itemsBlock = order.items.length === 0 ? (
    <View style={styles.emptyWrap}>
      <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>Comanda vacía</Text>
      <Text style={styles.empty}>Selecciona platillos del menú para comenzar</Text>
    </View>
  ) : (
    <>
      <Text style={styles.itemCount}>{itemCount} artículo{itemCount !== 1 ? 's' : ''}</Text>
      <View style={styles.items}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.qtyControls}>
              <Pressable
                style={styles.qtyBtn}
                onPress={() => onDecrement(item.id, item.quantity - 1)}
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Pressable
                style={[styles.qtyBtn, styles.qtyBtnAdd]}
                onPress={() => onIncrement(item.id, item.quantity + 1)}
              >
                <Ionicons name="add" size={16} color="#FFF" />
              </Pressable>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemUnit}>
                {formatCurrency(item.unit_price)} c/u
              </Text>
              {item.notes ? (
                <View style={styles.notesBadge}>
                  <Ionicons name="flame-outline" size={12} color={colors.coffee} />
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
              {item.kitchen_status === 'ready' ? (
                <View style={styles.readyServeBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.readyServeText}>Listo en cocina — servir</Text>
                </View>
              ) : null}
              {canEdit && onEditNotes ? (
                <Pressable
                  style={styles.notesBtn}
                  onPress={() => onEditNotes(item.id, item.name, item.notes)}
                >
                  <Ionicons
                    name={item.notes ? 'create-outline' : 'chatbubble-ellipses-outline'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.notesBtnText}>
                    {item.notes ? 'Editar comentario' : 'Comentario cocina'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              {formatCurrency(item.unit_price * item.quantity)}
            </Text>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <View style={[styles.container, isPanel && styles.containerPanel]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Comanda</Text>
          {tableName ? <Text style={styles.subtitle}>{tableName}</Text> : null}
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      {maxItemsHeight ? (
        <ScrollView
          style={{ maxHeight: maxItemsHeight }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {itemsBlock}
        </ScrollView>
      ) : (
        itemsBlock
      )}

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA (16%)</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.tax)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatCurrency(order.total)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {onSendToKitchen && order.items.length > 0 && order.status === 'open' ? (
          <Button
            title="Enviar a cocina"
            variant="secondary"
            icon="flame-outline"
            onPress={onSendToKitchen}
          />
        ) : null}
        {order.status === 'sent_to_kitchen' ? (
          <View style={styles.kitchenSent}>
            <Ionicons name="checkmark-circle" size={16} color={colors.info} />
            <Text style={styles.kitchenSentText}>Enviado a cocina — en preparación</Text>
          </View>
        ) : null}
        {billRequested ? (
          <View style={styles.billRequested}>
            <Ionicons name="receipt-outline" size={16} color={colors.warning} />
            <Text style={styles.billRequestedText}>Cuenta solicitada — cobro en caja</Text>
          </View>
        ) : null}
        {onRequestBill && order.items.length > 0 && order.status !== 'open' && !billRequested ? (
          <Button
            title="Pedir cuenta"
            variant="outline"
            icon="receipt-outline"
            onPress={onRequestBill}
          />
        ) : null}
        {onCheckout && order.items.length > 0 ? (
          <Button title="Cobrar cuenta" icon="card-outline" onPress={onCheckout} size="lg" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  containerPanel: {
    flex: 1,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  itemCount: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyWrap: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  items: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: colors.primary, borderColor: colors.primary },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 22, textAlign: 'center' },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontWeight: '600', color: colors.text },
  itemUnit: { fontSize: 11, color: colors.textMuted },
  notesBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    backgroundColor: colors.coffeeMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  notesText: { flex: 1, fontSize: 12, fontWeight: '600', color: colors.coffee, lineHeight: 16 },
  notesBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  notesBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  readyServeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  readyServeText: { fontSize: 11, fontWeight: '700', color: colors.success },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 2 },
  totals: { gap: 8, backgroundColor: colors.background, borderRadius: radius.md, padding: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: colors.textSecondary },
  totalValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  grandTotal: { marginTop: 2 },
  grandLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  grandValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  actions: { gap: 10 },
  kitchenSent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: colors.infoBg,
    borderRadius: radius.md,
  },
  kitchenSentText: { fontSize: 13, fontWeight: '600', color: colors.info },
  billRequested: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
  },
  billRequestedText: { fontSize: 13, fontWeight: '600', color: colors.warning },
});
