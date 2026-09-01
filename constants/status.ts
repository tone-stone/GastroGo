import { colors } from '@/constants/legacyTheme';
import { theme, tableStatus } from '@/constants/theme';
import type { OrderStatus, TableStatus } from '@/types';

const tableTokens = tableStatus(theme);

export const tableStatusConfig: Record<
  TableStatus,
  { label: string; bg: string; color: string; border: string; dot: string }
> = {
  free: {
    label: tableTokens.free.label,
    bg: tableTokens.free.bg,
    color: tableTokens.free.fg,
    border: theme.a1.line,
    dot: tableTokens.free.dot,
  },
  occupied: {
    label: tableTokens.occupied.label,
    bg: tableTokens.occupied.bg,
    color: tableTokens.occupied.fg,
    border: theme.a1.line,
    dot: tableTokens.occupied.dot,
  },
  bill_requested: {
    label: tableTokens.bill.label,
    bg: tableTokens.bill.bg,
    color: tableTokens.bill.fg,
    border: theme.a2.line,
    dot: tableTokens.bill.dot,
  },
  reserved: {
    label: tableTokens.reserved.label,
    bg: tableTokens.reserved.bg,
    color: tableTokens.reserved.fg,
    border: theme.a4.line,
    dot: tableTokens.reserved.dot,
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
