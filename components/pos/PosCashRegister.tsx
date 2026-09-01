import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChannelTabs, type ChannelTabItem } from '@/components/pos/ChannelTabs';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { MenuList } from '@/components/pos/MenuList';
import { PaymentMethodStepper } from '@/components/pos/PaymentMethodStepper';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { SplitBillModal } from '@/components/pos/SplitBillModal';
import { useTheme } from '@/components/theme/ThemeProvider';
import { CHANNEL_LABELS } from '@/constants/channels';
import { radius, shadow, space, type Palette } from '@/constants/theme';
import { formatCurrency, isCounterTable } from '@/lib/demo-data';
import { usePosStore } from '@/stores/posStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useToastStore } from '@/stores/toastStore';
import type { Order, PaymentMethod } from '@/types';

const TIP_OPTIONS = [0, 10, 15, 20];
const CASH_SHORTCUTS = [200, 500, 1000];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'cash', label: 'Efectivo', sub: 'Caja', icon: 'cash-outline' },
  { id: 'card', label: 'Tarjeta', sub: 'Terminal BBVA', icon: 'card-outline' },
  { id: 'mp', label: 'Mercado Pago', sub: 'QR / link', icon: 'qr-code-outline' },
  { id: 'apple', label: 'Apple Pay', sub: 'Contactless', icon: 'logo-apple' },
];

const NUMPAD = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['C', '0', '⌫'],
] as const;


interface PosCashRegisterProps {
  staffMemberId?: string | null;
  orderId?: string;
  saleMode?: boolean;
  includeTableBills?: boolean;
  paymentTargetId?: string;
  onPaymentTargetChange?: (orderId: string) => void;
  onPaid?: (paidOrderId: string) => void;
  embedded?: boolean;
  hero?: boolean;
}

export function PosCashRegister({
  staffMemberId,
  orderId,
  saleMode = false,
  includeTableBills = false,
  paymentTargetId: paymentTargetIdProp,
  onPaymentTargetChange,
  onPaid,
  embedded = false,
  hero = false,
}: PosCashRegisterProps) {
  const router = useRouter();
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const user = useSessionStore((s) => s.user);
  const activeRestaurantId = useSessionStore((s) => s.activeRestaurantId);
  const restaurants = useSessionStore((s) => s.restaurants);
  const restaurantName = restaurants.find((r) => r.id === activeRestaurantId)?.name;
  const orders = usePosStore((s) => s.orders);
  const tables = usePosStore((s) => s.tables);
  const staff = usePosStore((s) => s.staff);
  const categories = usePosStore((s) => s.categories);
  const menuItemsAll = usePosStore((s) => s.menuItems);
  const payOrder = usePosStore((s) => s.payOrder);
  const updateItemQuantity = usePosStore((s) => s.updateItemQuantity);
  const applyDiscount = usePosStore((s) => s.applyDiscount);
  const removeDiscount = usePosStore((s) => s.removeDiscount);
  const startChannelOrder = usePosStore((s) => s.startChannelOrder);
  const addItemToOrder = usePosStore((s) => s.addItemToOrder);
  const showToast = useToastStore((s) => s.show);

  const getTable = useCallback((id: string) => tables.find((t) => t.id === id), [tables]);
  const getStaff = useCallback((id: string) => staff.find((s) => s.id === id), [staff]);

  const payableOrders = useMemo(() => {
    const open = orders.filter((o) => o.status !== 'paid' && o.status !== 'cancelled' && o.items.length > 0);
    if (orderId && saleMode && !includeTableBills) {
      const locked = open.find((o) => o.id === orderId);
      return locked ? [locked] : [];
    }
    if (orderId && !saleMode) {
      const locked = open.find((o) => o.id === orderId);
      return locked ? [locked] : [];
    }
    return open
      .filter((o) => {
        const table = getTable(o.table_id);
        return table && table.number > 0;
      })
      .sort((a, b) => {
        const tableA = getTable(a.table_id);
        const tableB = getTable(b.table_id);
        const priA = tableA?.status === 'bill_requested' ? 0 : 1;
        const priB = tableB?.status === 'bill_requested' ? 0 : 1;
        return priA - priB || b.total - a.total;
      });
  }, [orders, getTable, orderId, saleMode, includeTableBills]);

  const counterOrders = useMemo(() => {
    if (!saleMode || !includeTableBills) return [];
    return orders.filter(
      (o) => o.status !== 'paid' && o.status !== 'cancelled' && isCounterTable(o.table_id),
    );
  }, [orders, saleMode, includeTableBills]);

  const tableBillOrders = useMemo(() => {
    if (!saleMode || !includeTableBills) return [];
    return orders
      .filter(
        (o) =>
          o.status !== 'paid' &&
          o.status !== 'cancelled' &&
          o.items.length > 0 &&
          !isCounterTable(o.table_id) &&
          getTable(o.table_id)?.status === 'bill_requested',
      )
      .sort((a, b) => b.total - a.total);
  }, [orders, getTable, saleMode, includeTableBills]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [internalPaymentTargetId, setInternalPaymentTargetId] = useState(orderId ?? '');
  const paymentTargetId = paymentTargetIdProp ?? internalPaymentTargetId;

  const setPaymentTargetId = (id: string) => {
    if (onPaymentTargetChange) onPaymentTargetChange(id);
    else setInternalPaymentTargetId(id);
  };

  const [tipPercent, setTipPercent] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [split, setSplit] = useState<{ parts: number[]; paid: boolean[] } | null>(null);
  const [activePartIdx, setActivePartIdx] = useState(0);
  const [quickCategoryId, setQuickCategoryId] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  const lockedSaleOrder = useMemo(() => {
    if (!saleMode || !orderId) return undefined;
    return orders.find((o) => o.id === orderId && o.status !== 'paid' && o.status !== 'cancelled');
  }, [orders, orderId, saleMode]);

  const order = useMemo(() => {
    if (saleMode) {
      if (paymentTargetId && paymentTargetId !== orderId) {
        return orders.find((o) => o.id === paymentTargetId && o.status !== 'paid' && o.status !== 'cancelled');
      }
      if (lockedSaleOrder) return lockedSaleOrder;
    }
    return payableOrders.find((o) => o.id === selectedOrderId) ?? payableOrders[0];
  }, [saleMode, paymentTargetId, orderId, lockedSaleOrder, orders, payableOrders, selectedOrderId]);

  useEffect(() => {
    if (orderId && !paymentTargetIdProp && !internalPaymentTargetId) {
      setInternalPaymentTargetId(orderId);
    }
  }, [orderId, paymentTargetIdProp, internalPaymentTargetId]);

  const isCounterPayment = !!order && isCounterTable(order.table_id);
  const table = order ? getTable(order.table_id) : undefined;
  const waiter = order?.waiter_id ? getStaff(order.waiter_id) : null;
  const cashierName = (saleMode ? user?.full_name : waiter?.name) ?? 'Cajero';

  const quickMenuCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );
  useEffect(() => {
    if (quickMenuCategories.length && !quickCategoryId) {
      setQuickCategoryId(quickMenuCategories[0].id);
    }
  }, [quickMenuCategories, quickCategoryId]);
  const quickMenuItems = useMemo(
    () => menuItemsAll.filter((m) => m.category_id === quickCategoryId && m.is_available),
    [menuItemsAll, quickCategoryId],
  );

  useEffect(() => {
    if (payableOrders.length && !payableOrders.some((o) => o.id === selectedOrderId)) {
      setSelectedOrderId(payableOrders[0].id);
    }
  }, [payableOrders, selectedOrderId]);

  useEffect(() => {
    setInput('');
  }, [selectedOrderId, paymentTargetId, tipPercent, paymentMethod, activePartIdx]);

  useEffect(() => {
    // Cambiar de cuenta cancela cualquier división en curso.
    setSplit(null);
    setActivePartIdx(0);
  }, [order?.id]);

  const tipAmount = order ? Math.round(order.subtotal * (tipPercent / 100) * 100) / 100 : 0;
  const amountDue = order ? order.subtotal - (order.discount?.amount ?? 0) + order.tax + tipAmount : 0;
  const partDue = split ? amountDue * split.parts[activePartIdx] : amountDue;
  const amountReceived = parseFloat(input) || 0;
  const change = paymentMethod === 'cash' && amountReceived > 0 ? Math.max(0, amountReceived - partDue) : 0;
  const canPay = !!order && (paymentMethod !== 'cash' || amountReceived >= partDue) && partDue > 0;

  const platformLocked = order?.channel === 'didi' || order?.channel === 'uber';

  const handleKey = (key: string) => {
    if (key === 'C') {
      setInput('');
      return;
    }
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '.' && input.includes('.')) return;
    if (key === '.' && !input) {
      setInput('0.');
      return;
    }
    setInput((prev) => {
      const next = prev + key;
      if (next.includes('.')) {
        const [, dec] = next.split('.');
        if (dec && dec.length > 2) return prev;
      }
      return next.replace(/^0+(?=\d)/, '');
    });
  };

  const handleExact = () => {
    if (partDue > 0) setInput(partDue.toFixed(2));
  };

  const completeCharge = useCallback(() => {
    if (!order) return;
    if (split) {
      const nextPaid = [...split.paid];
      nextPaid[activePartIdx] = true;
      if (nextPaid.every(Boolean)) {
        setLoading(true);
        payOrder(order.id, tipAmount, paymentMethod);
        setLoading(false);
        setSplit(null);
        setInput('');
        setReceiptOrder({
          ...order,
          tip: tipAmount,
          status: 'paid',
          payment_method: paymentMethod,
          closed_at: new Date().toISOString(),
          total: amountDue,
        });
        if (saleMode) {
          onPaid?.(order.id);
          if (!isCounterPayment) setPaymentTargetId(orderId ?? '');
        } else {
          router.push('/(app)/(tabs)/mesero');
        }
      } else {
        const nextIdx = nextPaid.findIndex((p) => !p);
        setSplit({ ...split, paid: nextPaid });
        setActivePartIdx(nextIdx);
        setInput('');
        showToast(`Cuenta ${activePartIdx + 1} cobrada — sigue la cuenta ${nextIdx + 1}`, 'ok');
      }
      return;
    }

    setLoading(true);
    payOrder(order.id, tipAmount, paymentMethod);
    setInput('');
    setLoading(false);
    setReceiptOrder({
      ...order,
      tip: tipAmount,
      status: 'paid',
      payment_method: paymentMethod,
      closed_at: new Date().toISOString(),
      total: amountDue,
    });
    if (saleMode) {
      onPaid?.(order.id);
      if (!isCounterPayment) setPaymentTargetId(orderId ?? '');
    } else {
      router.push('/(app)/(tabs)/mesero');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, split, activePartIdx, tipAmount, paymentMethod, amountDue, saleMode, isCounterPayment, orderId]);

  const handlePay = () => {
    if (!order || !canPay) return;
    completeCharge();
  };

  const handleAddTakeaway = () => {
    if (!activeRestaurantId) return;
    const newOrder = startChannelOrder(activeRestaurantId, 'takeaway', staffMemberId ?? undefined);
    setPaymentTargetId(newOrder.id);
  };

  const handleQuickAdd = (item: (typeof quickMenuItems)[number]) => {
    if (!order) return;
    if (platformLocked) {
      showToast('Los pedidos de plataforma no se editan desde el POS', 'warn');
      return;
    }
    addItemToOrder(order.id, item);
  };

  const showCalculator = saleMode || payableOrders.length > 0;

  const channelTabItems: ChannelTabItem[] = useMemo(() => {
    if (!saleMode || !includeTableBills || !orderId) return [];
    const items: ChannelTabItem[] = counterOrders.map((o) => ({
      id: o.id,
      label: CHANNEL_LABELS[o.channel],
      total: o.total,
      active: o.id === (paymentTargetId || orderId),
      onPress: () => setPaymentTargetId(o.id),
    }));
    tableBillOrders.forEach((o) => {
      const t = getTable(o.table_id);
      items.push({
        id: o.id,
        label: `Mesa ${t?.number ?? '?'}`,
        total: o.total,
        active: o.id === order?.id,
        badge: 'Cuenta',
        onPress: () => setPaymentTargetId(o.id),
      });
    });
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleMode, includeTableBills, orderId, counterOrders, tableBillOrders, paymentTargetId, order?.id]);

  return (
    <View style={[styles.register, embedded && styles.registerEmbedded, hero && styles.registerHero]}>
      {!showCalculator ? (
        <View style={styles.empty}>
          <Ionicons name="receipt-outline" size={28} color={theme.mut} />
          <Text style={styles.emptyText}>{saleMode ? 'Agrega platillos para cobrar' : 'Sin cuentas por cobrar'}</Text>
          <Text style={styles.emptySub}>
            {saleMode ? 'Selecciona del menú y cobra aquí mismo' : 'Abre una comanda y envíala a cobro desde una mesa'}
          </Text>
        </View>
      ) : (
        <>
          {channelTabItems.length > 0 ? (
            <ChannelTabs items={channelTabItems} onAddTakeaway={handleAddTakeaway} />
          ) : null}

          {!saleMode && payableOrders.length > 1 ? (
            <ScrollView
              horizontal
              style={styles.orderTabsScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.orderTabs}
            >
              {payableOrders.map((o) => {
                const t = getTable(o.table_id);
                const active = o.id === order?.id;
                const billReady = t?.status === 'bill_requested';
                return (
                  <Pressable
                    key={o.id}
                    style={[styles.orderTab, active && styles.orderTabActive]}
                    onPress={() => setSelectedOrderId(o.id)}
                  >
                    <Text style={[styles.orderTabNum, active && styles.orderTabTextActive]}>Mesa {t?.number ?? '?'}</Text>
                    <Text style={[styles.orderTabTotal, active && styles.orderTabTextActive]}>{formatCurrency(o.total)}</Text>
                    {billReady ? (
                      <View style={styles.billTag}>
                        <Text style={styles.billTagText}>Cuenta</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {order ? (
            <View style={styles.contextRow}>
              <Text style={styles.contextTitle} numberOfLines={1}>
                {isCounterPayment ? `${CHANNEL_LABELS[order.channel]} · venta rápida` : `Mesa ${table?.number ?? '?'} · ${table?.zone ?? ''}`}
              </Text>
              <Text style={styles.contextSub} numberOfLines={1}>{saleMode ? 'Cajero' : 'Mesero'} · {cashierName}</Text>
            </View>
          ) : null}

          {platformLocked ? (
            <View style={styles.lockedNotice}>
              <Ionicons name="alert-circle" size={16} color={theme.a4.ink} />
              <Text style={styles.lockedNoticeText}>Pedido de plataforma — llega pagado, solo pasa por cocina</Text>
            </View>
          ) : null}

          {order && order.items.length > 0 ? (
            <View style={styles.itemsList}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {!platformLocked ? (
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => updateItemQuantity(order.id, item.id, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={14} color={theme.text} />
                      </Pressable>
                      <Text style={styles.stepperValue}>{item.quantity}</Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => updateItemQuantity(order.id, item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={14} color={theme.text} />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.itemQtyLocked}>{item.quantity}×</Text>
                  )}
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{formatCurrency(item.unit_price * item.quantity)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {isCounterPayment && !platformLocked && order ? (
            <View style={styles.quickMenu}>
              <Text style={styles.quickMenuLabel}>Venta rápida</Text>
              <MenuList
                categories={quickMenuCategories}
                items={quickMenuItems}
                selectedCategoryId={quickCategoryId}
                onSelectCategory={setQuickCategoryId}
                onAddItem={handleQuickAdd}
                layout="quick"
                columns={2}
              />
            </View>
          ) : null}

          {order?.discount ? (
            <View style={styles.discountLine}>
              <Ionicons name="pricetag" size={14} color={theme.a3.ink} />
              <Text style={styles.discountLabel} numberOfLines={1}>{order.discount.reason}</Text>
              <Text style={styles.discountValue}>−{formatCurrency(order.discount.amount)}</Text>
              <Pressable onPress={() => removeDiscount(order.id)} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={theme.mut} />
              </Pressable>
            </View>
          ) : null}

          <View style={[styles.display, hero && styles.displayHero]}>
            <View style={styles.displayRow}>
              <Text style={styles.displayLabel}>{split ? `CUENTA ${activePartIdx + 1} DE ${split.parts.length}` : 'TOTAL A COBRAR'}</Text>
              <Text style={[styles.displayMain, hero && styles.displayMainHero]}>{formatCurrency(partDue)}</Text>
            </View>
            {paymentMethod === 'cash' ? (
              <>
                <View style={styles.displayDivider} />
                <View style={styles.displayRow}>
                  <Text style={styles.displayLabel}>RECIBIDO</Text>
                  <Text style={[styles.displaySub, hero && styles.displaySubHero]}>
                    {input ? formatCurrency(amountReceived) : formatCurrency(0)}
                  </Text>
                </View>
                <View style={styles.displayRow}>
                  <Text style={styles.displayLabel}>CAMBIO</Text>
                  <Text style={[styles.displayChange, change > 0 && styles.displayChangeActive, hero && styles.displaySubHero]}>
                    {formatCurrency(change)}
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {split ? (
            <View style={styles.splitPills}>
              {split.parts.map((p, i) => (
                <Pressable
                  key={i}
                  style={[styles.splitPill, i === activePartIdx && styles.splitPillActive, split.paid[i] && styles.splitPillPaid]}
                  onPress={() => setActivePartIdx(i)}
                >
                  {split.paid[i] ? <Ionicons name="checkmark" size={12} color={theme.a1.on} /> : null}
                  <Text style={[styles.splitPillText, (i === activePartIdx || split.paid[i]) && styles.splitPillTextActive]}>
                    Cuenta {i + 1} · {formatCurrency(amountDue * p)}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {isCounterPayment && !platformLocked && order && order.items.length === 0 ? (
            <View style={styles.saleHint}>
              <Ionicons name="restaurant-outline" size={20} color={theme.mut} />
              <Text style={styles.saleHintText}>Agrega platillos de venta rápida para cobrar</Text>
            </View>
          ) : null}

          {order && order.items.length > 0 && !platformLocked ? (
            <>
              <View style={styles.tipRow}>
                {TIP_OPTIONS.map((pct) => (
                  <Pressable key={pct} style={[styles.tipBtn, tipPercent === pct && styles.tipBtnActive]} onPress={() => setTipPercent(pct)}>
                    <Text style={[styles.tipBtnText, tipPercent === pct && styles.tipBtnTextActive]}>{pct}%</Text>
                  </Pressable>
                ))}
                <View style={styles.tipExtra}>
                  <Text style={styles.tipExtraText}>+ {formatCurrency(tipAmount)}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.actionBtn, split && styles.actionBtnActive]}
                  onPress={() => setSplitOpen(true)}
                >
                  <Ionicons name="people-outline" size={16} color={split ? theme.a4.on : theme.text} />
                  <Text style={[styles.actionBtnText, split && styles.actionBtnTextActive]}>
                    {split ? `Dividido en ${split.parts.length}` : 'Dividir cuenta'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionBtn, order.discount && styles.actionBtnDiscountActive]}
                  onPress={() => setDiscountOpen(true)}
                >
                  <Ionicons name="pricetag-outline" size={16} color={order.discount ? theme.a3.on : theme.text} />
                  <Text style={[styles.actionBtnText, order.discount && styles.actionBtnTextActive]}>
                    {order.discount ? formatCurrency(order.discount.amount) : 'Descuento'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.payMethods}>
                {PAYMENT_METHODS.map((m) => (
                  <Pressable
                    key={m.id}
                    style={[styles.payBtn, paymentMethod === m.id && styles.payBtnActive]}
                    onPress={() => setPaymentMethod(m.id)}
                  >
                    <Ionicons name={m.icon} size={20} color={paymentMethod === m.id ? theme.ctaOn : theme.text} />
                    <Text style={[styles.payBtnText, paymentMethod === m.id && styles.payBtnTextActive]}>{m.label}</Text>
                    <Text style={[styles.payBtnSub, paymentMethod === m.id && styles.payBtnTextActive]}>{m.sub}</Text>
                  </Pressable>
                ))}
              </View>

              {paymentMethod === 'cash' ? (
                <>
                  <View style={styles.cashShortcuts}>
                    <Pressable style={styles.shortcutBtn} onPress={handleExact}>
                      <Text style={styles.shortcutText}>Exacto</Text>
                    </Pressable>
                    {CASH_SHORTCUTS.map((v) => (
                      <Pressable key={v} style={styles.shortcutBtn} onPress={() => setInput(String(v))}>
                        <Text style={styles.shortcutText}>${v}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.numpad}>
                    {NUMPAD.map((row, ri) => (
                      <View key={ri} style={styles.numpadRow}>
                        {row.map((key) => (
                          <Pressable
                            key={key}
                            style={[styles.key, hero && styles.keyHero, key === 'C' && styles.keyClear]}
                            onPress={() => handleKey(key)}
                          >
                            <Text style={[styles.keyText, hero && styles.keyTextHero, key === 'C' && styles.keyClearText]}>{key}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}
                  </View>

                  <Pressable style={[styles.payBigBtn, !canPay && styles.payBigBtnDisabled]} onPress={handlePay} disabled={!canPay || loading}>
                    <Ionicons name="cash" size={18} color={theme.ctaOn} />
                    <Text style={styles.payBigBtnText}>Cobrar {formatCurrency(partDue)}</Text>
                  </Pressable>
                </>
              ) : (
                <PaymentMethodStepper method={paymentMethod} amount={partDue} orderId={order.id} onConfirmed={completeCharge} />
              )}
            </>
          ) : null}

          {order && !saleMode ? (
            <Pressable style={styles.detailLink} onPress={() => router.push(`/checkout/${order.id}`)}>
              <Text style={styles.detailLinkText}>Ver detalle de cuenta</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.cta} />
            </Pressable>
          ) : null}
        </>
      )}

      {order ? (
        <>
          <DiscountModal
            visible={discountOpen}
            onClose={() => setDiscountOpen(false)}
            subtotal={order.subtotal}
            contextLabel={isCounterPayment ? `${CHANNEL_LABELS[order.channel]} · venta rápida` : `Mesa ${table?.number ?? '?'}`}
            cashierName={cashierName}
            onApply={(discount) => applyDiscount(order.id, discount)}
          />
          <SplitBillModal
            visible={splitOpen}
            onClose={() => setSplitOpen(false)}
            contextLabel={isCounterPayment ? `${CHANNEL_LABELS[order.channel]} · venta rápida` : `Mesa ${table?.number ?? '?'}`}
            total={amountDue}
            items={order.items}
            onApply={(parts) => {
              setSplit({ parts, paid: parts.map(() => false) });
              setActivePartIdx(0);
            }}
          />
        </>
      ) : null}

      <ReceiptModal
        visible={!!receiptOrder}
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        table={receiptOrder ? getTable(receiptOrder.table_id) : undefined}
        restaurantName={restaurantName}
        cashierName={cashierName}
      />
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    register: {
      backgroundColor: theme.surface,
      borderRadius: radius.panel,
      padding: space.md + 2,
      gap: space.sm + 2,
    },
    registerEmbedded: { flex: 1, borderRadius: radius.lg },
    registerHero: { padding: space.lg, gap: space.md },
    empty: { alignItems: 'center', paddingVertical: space.xl, gap: space.xs },
    emptyText: { fontSize: 15, fontWeight: '600', color: theme.text },
    emptySub: { fontSize: 12, color: theme.mut, textAlign: 'center' },
    orderTabsScroll: { flexGrow: 0, flexShrink: 0 },
    orderTabs: { gap: space.sm, paddingVertical: 2 },
    orderTab: {
      paddingHorizontal: space.sm + 2,
      paddingVertical: space.sm,
      borderRadius: radius.lg,
      backgroundColor: theme.surface2,
      borderWidth: 1,
      borderColor: theme.line,
      minWidth: 88,
      alignItems: 'center',
      gap: 2,
    },
    orderTabActive: { backgroundColor: theme.a2.solid, borderColor: theme.a2.solid },
    orderTabNum: { fontSize: 12, fontWeight: '700', color: theme.mut },
    orderTabTotal: { fontSize: 15, fontWeight: '600', color: theme.text },
    orderTabTextActive: { color: theme.a2.on },
    billTag: { backgroundColor: theme.a2.soft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill, marginTop: 2 },
    billTagText: { fontSize: 9, fontWeight: '700', color: theme.a2.ink },
    contextRow: { gap: 1 },
    contextTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
    contextSub: { fontSize: 12, color: theme.mut },
    lockedNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      backgroundColor: theme.a4.soft,
      padding: space.sm,
      borderRadius: radius.md,
    },
    lockedNoticeText: { flex: 1, fontSize: 12, fontWeight: '600', color: theme.a4.ink },
    itemsList: { gap: space.xs },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      backgroundColor: theme.surface2,
      borderRadius: radius.pill,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    stepperBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    stepperValue: { fontSize: 13, fontWeight: '700', color: theme.text, minWidth: 16, textAlign: 'center' },
    itemQtyLocked: { fontSize: 13, fontWeight: '700', color: theme.mut, minWidth: 28 },
    itemName: { flex: 1, fontSize: 13, color: theme.text },
    itemPrice: { fontSize: 13, fontWeight: '600', color: theme.text, fontVariant: ['tabular-nums'] },
    quickMenu: { gap: space.xs, borderTopWidth: 1, borderTopColor: theme.line, paddingTop: space.sm + 2 },
    quickMenuLabel: { fontSize: 11, fontWeight: '700', color: theme.mut, textTransform: 'uppercase', letterSpacing: 0.6 },
    discountLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      backgroundColor: theme.a3.soft,
      padding: space.sm,
      borderRadius: radius.md,
    },
    discountLabel: { flex: 1, fontSize: 12, fontWeight: '600', color: theme.a3.ink },
    discountValue: { fontSize: 13, fontWeight: '700', color: theme.a3.ink },
    display: { backgroundColor: theme.ink, borderRadius: radius.panel, padding: space.md + 2, gap: space.sm },
    displayHero: { padding: space.lg },
    displayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    displayLabel: { fontSize: 11, fontWeight: '700', color: theme.onInkMut, letterSpacing: 1 },
    displayMain: { fontSize: 32, fontWeight: '600', color: theme.onInk, fontVariant: ['tabular-nums'] },
    displayMainHero: { fontSize: 40 },
    displayDivider: { height: 1, backgroundColor: theme.inkLine },
    displaySub: { fontSize: 20, fontWeight: '600', color: theme.onInk, fontVariant: ['tabular-nums'] },
    displaySubHero: { fontSize: 24 },
    displayChange: { fontSize: 20, fontWeight: '600', color: theme.onInkMut, fontVariant: ['tabular-nums'] },
    displayChangeActive: { color: theme.a2.solid },
    splitPills: { gap: space.xs },
    splitPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: space.xs + 2,
      paddingHorizontal: space.sm + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.surface,
    },
    splitPillActive: { borderColor: theme.a4.solid, backgroundColor: theme.a4.soft },
    splitPillPaid: { backgroundColor: theme.a1.solid, borderColor: theme.a1.solid },
    splitPillText: { fontSize: 12, fontWeight: '600', color: theme.text },
    splitPillTextActive: { color: theme.a1.on },
    saleHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      paddingVertical: space.sm + 2,
      backgroundColor: theme.surface2,
      borderRadius: radius.md,
    },
    saleHintText: { fontSize: 13, color: theme.mut, fontWeight: '600' },
    tipRow: { flexDirection: 'row', gap: space.xs, alignItems: 'center' },
    tipBtn: {
      flex: 1,
      paddingVertical: space.xs + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      alignItems: 'center',
      backgroundColor: theme.surface,
    },
    tipBtnActive: { backgroundColor: theme.cta, borderColor: theme.cta },
    tipBtnText: { fontSize: 12, fontWeight: '700', color: theme.mut },
    tipBtnTextActive: { color: theme.ctaOn },
    tipExtra: { paddingHorizontal: space.xs },
    tipExtraText: { fontSize: 11, color: theme.mut, fontWeight: '600' },
    actionRow: { flexDirection: 'row', gap: space.sm },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.surface,
    },
    actionBtnActive: { backgroundColor: theme.a4.solid, borderColor: theme.a4.solid },
    actionBtnDiscountActive: { backgroundColor: theme.a3.solid, borderColor: theme.a3.solid },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: theme.text },
    actionBtnTextActive: { color: theme.a4.on },
    payMethods: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
    payBtn: {
      flexBasis: '48%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: space.sm + 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.surface,
    },
    payBtnActive: { backgroundColor: theme.cta, borderColor: theme.cta },
    payBtnText: { fontSize: 12, fontWeight: '700', color: theme.text },
    payBtnSub: { fontSize: 10, color: theme.mut },
    payBtnTextActive: { color: theme.ctaOn },
    cashShortcuts: { flexDirection: 'row', gap: space.xs },
    shortcutBtn: {
      flex: 1,
      paddingVertical: space.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.line,
      alignItems: 'center',
      backgroundColor: theme.surface2,
    },
    shortcutText: { fontSize: 13, fontWeight: '700', color: theme.text },
    numpad: { gap: space.xs },
    numpadRow: { flexDirection: 'row', gap: space.xs },
    key: {
      flex: 1,
      aspectRatio: 1.6,
      maxHeight: 62,
      backgroundColor: theme.surface2,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyHero: { maxHeight: 62 },
    keyText: { fontSize: 22, fontWeight: '600', color: theme.text },
    keyTextHero: { fontSize: 24 },
    keyClear: { backgroundColor: theme.a3.soft },
    keyClearText: { color: theme.a3.ink },
    payBigBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      backgroundColor: theme.cta,
      paddingVertical: space.sm + 4,
      borderRadius: radius.lg,
      ...shadow.sm,
    },
    payBigBtnDisabled: { opacity: 0.45 },
    payBigBtnText: { fontSize: 15, fontWeight: '700', color: theme.ctaOn },
    detailLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: space.xs },
    detailLinkText: { fontSize: 13, fontWeight: '600', color: theme.cta },
  });
}
