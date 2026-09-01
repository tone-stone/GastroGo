import { useMemo } from 'react';

import { colors } from '@/constants/legacyTheme';
import { tableStatus, type Palette } from '@/constants/theme';
import { useTheme } from '@/components/theme/ThemeProvider';
import type { OrderStatus, TableStatus } from '@/types';

export type TableStatusConfig = Record<
  TableStatus,
  { label: string; bg: string; color: string; border: string; dot: string }
>;

export function buildTableStatusConfig(theme: Palette): TableStatusConfig {
  const tableTokens = tableStatus(theme);
  return {
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
}

/** Colores de estado de mesa para la paleta activa — reactivo al selector de paleta. */
export function useTableStatusConfig(): TableStatusConfig {
  const { palette } = useTheme();
  return useMemo(() => buildTableStatusConfig(palette), [palette]);
}

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
