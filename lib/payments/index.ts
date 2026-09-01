import type { PaymentMethod } from '@/types';

/**
 * Punto de extensión para pasarelas reales (Mercado Pago, BBVA/Apple Pay vía SDK del
 * adquirente). Hoy solo hay una simulación local — ver design_handoff_gastrogo_pos/
 * README.md ("Pagos con tarjeta"): createIntent(amount, orderId) → status stream → confirm.
 */

export type PaymentIntentStatus = 'sent' | 'authorized' | 'confirmed';

export interface PaymentIntent {
  method: PaymentMethod;
  amount: number;
  orderId: string;
  subscribe: (onStatus: (status: PaymentIntentStatus) => void) => void;
  cancel: () => void;
}

const STEP_DELAY_MS = 1400;

const METHOD_COPY: Partial<Record<PaymentMethod, { label: string; hint: string }>> = {
  card: {
    label: 'Terminal BBVA vinculada — Caja 1',
    hint: 'El monto se envía a la terminal por Bluetooth; la app espera el código de autorización y cierra la mesa sola.',
  },
  mp: {
    label: 'Mercado Pago — QR dinámico',
    hint: 'Se genera un QR con el monto; en cuanto el cliente paga, el webhook marca la orden como cobrada.',
  },
  apple: {
    label: 'Apple Pay — contactless',
    hint: 'Acerca el teléfono o la tarjeta a la terminal; la app espera el código de autorización.',
  },
};

export function getPaymentMethodCopy(method: PaymentMethod) {
  return METHOD_COPY[method] ?? { label: 'Pasarela', hint: '' };
}

/** Simulación local del flujo de 3 pasos — sin SDK real todavía. */
export function createIntent(amount: number, orderId: string, method: PaymentMethod): PaymentIntent {
  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];

  return {
    method,
    amount,
    orderId,
    subscribe(onStatus) {
      onStatus('sent');
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          onStatus('authorized');
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              onStatus('confirmed');
            }, STEP_DELAY_MS),
          );
        }, STEP_DELAY_MS),
      );
    },
    cancel() {
      cancelled = true;
      timers.forEach(clearTimeout);
    },
  };
}
