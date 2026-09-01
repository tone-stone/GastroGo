import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/components/theme/ThemeProvider';
import { radius, space, type Palette } from '@/constants/theme';
import { formatCurrency } from '@/lib/demo-data';
import { createIntent, getPaymentMethodCopy, type PaymentIntent, type PaymentIntentStatus } from '@/lib/payments';
import type { PaymentMethod } from '@/types';

const STEPS = ['Monto enviado al lector', 'Cliente autoriza', 'Recibo y cierre de mesa'];

interface PaymentMethodStepperProps {
  method: PaymentMethod;
  amount: number;
  orderId: string;
  onConfirmed: () => void;
}

export function PaymentMethodStepper({ method, amount, orderId, onConfirmed }: PaymentMethodStepperProps) {
  const { palette: theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [status, setStatus] = useState<PaymentIntentStatus | 'idle'>('idle');
  const intentRef = useRef<PaymentIntent | null>(null);
  const copy = getPaymentMethodCopy(method);

  useEffect(() => {
    setStatus('idle');
    return () => intentRef.current?.cancel();
  }, [method, orderId]);

  useEffect(() => {
    if (status === 'confirmed') onConfirmed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleStart = () => {
    const intent = createIntent(amount, orderId, method);
    intentRef.current = intent;
    intent.subscribe(setStatus);
  };

  const stepIndex = status === 'idle' ? 0 : status === 'sent' ? 1 : status === 'authorized' ? 2 : 3;

  return (
    <View style={styles.wrap}>
      <View style={styles.chip}>
        <Ionicons name="card-outline" size={16} color={theme.a3.ink} />
        <Text style={styles.chipText} numberOfLines={1}>{copy.label}</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = stepIndex > n;
          const active = stepIndex === n;
          return (
            <View key={label} style={styles.step}>
              <View style={[styles.stepDot, (done || active) && styles.stepDotActive]}>
                {done ? (
                  <Ionicons name="checkmark" size={12} color={theme.ctaOn} />
                ) : (
                  <Text style={[styles.stepNum, active && styles.stepNumActive]}>{n}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {copy.hint ? (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>{copy.hint}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.actionBtn, status !== 'idle' && styles.actionBtnDisabled]}
        onPress={handleStart}
        disabled={status !== 'idle'}
      >
        <Ionicons
          name={status === 'confirmed' ? 'checkmark-circle' : 'paper-plane-outline'}
          size={18}
          color={theme.ctaOn}
        />
        <Text style={styles.actionText}>
          {status === 'idle'
            ? `Enviar ${formatCurrency(amount)} al lector`
            : status === 'confirmed'
              ? 'Confirmado'
              : 'Esperando confirmación…'}
        </Text>
      </Pressable>
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    wrap: { gap: space.md },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      alignSelf: 'flex-start',
      backgroundColor: theme.a3.soft,
      paddingHorizontal: space.sm + 2,
      paddingVertical: 8,
      borderRadius: radius.pill,
      maxWidth: '100%',
    },
    chipText: { fontSize: 12, fontWeight: '700', color: theme.a3.ink, flexShrink: 1 },
    steps: { gap: space.sm + 2 },
    step: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    stepDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface2,
      borderWidth: 1,
      borderColor: theme.line,
    },
    stepDotActive: { backgroundColor: theme.cta, borderColor: theme.cta },
    stepNum: { fontSize: 12, fontWeight: '700', color: theme.mut },
    stepNumActive: { color: theme.ctaOn },
    stepLabel: { fontSize: 13, color: theme.mut, fontWeight: '600' },
    stepLabelActive: { color: theme.text },
    hintBox: {
      backgroundColor: theme.surface2,
      borderRadius: radius.md,
      padding: space.sm + 2,
    },
    hintText: { fontSize: 12, color: theme.mut, lineHeight: 17 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.xs,
      backgroundColor: theme.cta,
      paddingVertical: space.sm + 4,
      borderRadius: radius.lg,
    },
    actionBtnDisabled: { backgroundColor: theme.ctaDark, opacity: 0.85 },
    actionText: { fontSize: 15, fontWeight: '700', color: theme.ctaOn },
  });
}
