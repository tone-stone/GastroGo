import { colors } from '@/constants/theme';
import type { OrderStatus, TableStatus } from '@/types';

export const tableStatusConfig: Record<
  TableStatus,
  { label: string; bg: string; color: string; border: string; dot: string }
> = {
  free: {
    label: 'Libre',
    bg: colors.successBg,
    color: colors.success,
    border: '#B7DCC8',
    dot: colors.success,
  },
  occupied: {
    label: 'Ocupada',
    bg: colors.infoBg,
    color: colors.info,
    border: '#C5D4CC',
    dot: colors.info,
  },
  bill_requested: {
    label: 'Pide cuenta',
    bg: colors.goldMuted,
    color: colors.gold,
    border: colors.goldLight,
    dot: colors.gold,
  },
  reserved: {
    label: 'Reservada',
    bg: colors.coffeeMuted,
    color: colors.coffee,
    border: '#D4C4B0',
    dot: colors.coffeeLight,
  },
};

export const orderStatusConfig: Record<
  OrderStatus,
  { label: string; bg: string; color: string }
> = {
  open: { label: 'Abierta', bg: colors.primaryMuted, color: colors.primary },
  sent_to_kitchen: { label: 'En cocina', bg: colors.coffeeMuted, color: colors.coffee },
  ready: { label: 'Lista', bg: colors.successBg, color: colors.success },
  paid: { label: 'Pagada', bg: colors.borderLight, color: colors.textSecondary },
  cancelled: { label: 'Cancelada', bg: colors.dangerBg, color: colors.danger },
};
