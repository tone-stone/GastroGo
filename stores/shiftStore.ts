import { create } from 'zustand';

import { getDemoShiftsSnapshot } from '@/lib/data/demo-state';
import { getShiftsRepository } from '@/lib/repositories';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { CashMovement, Shift } from '@/types';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Se llama al montar la pantalla de Corte — idempotente por restaurante, mismo
// cuidado que stores/posStore.ts's loadRestaurantData (ver ese archivo para el
// porqué: un `await` innecesario en el camino demo puede crear una carrera con
// otros efectos síncronos del mismo montaje).
let loadedRestaurantId: string | null = null;

function syncShiftPersistence(shift: Shift) {
  void getShiftsRepository().upsert(shift);
}

interface CloseShiftInput {
  countedBills: Record<number, number>;
  countedTotal: number;
  salesTotal: number;
  salesCount: number;
  tipsTotal: number;
  cashExpected: number;
  closedBy?: string;
}

interface ShiftState {
  shifts: Shift[];
  activeShiftId: string | null;
  loadShiftData: (restaurantId: string) => Promise<void>;
  getActiveShift: () => Shift | undefined;
  openShift: (restaurantId: string, openingFloat: number, staffId?: string) => Shift;
  addWithdrawal: (amount: number, reason: string) => void;
  closeShift: (input: CloseShiftInput) => void;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  shifts: [],
  activeShiftId: null,

  loadShiftData: async (restaurantId) => {
    if (loadedRestaurantId === restaurantId) return;
    loadedRestaurantId = restaurantId;

    const shifts = !isSupabaseConfigured
      ? getDemoShiftsSnapshot().filter((s) => s.restaurant_id === restaurantId)
      : await getShiftsRepository().list({ restaurantId });

    const active = shifts.find((s) => s.status === 'open');
    set({ shifts, activeShiftId: active?.id ?? null });
  },

  getActiveShift: () => {
    const { shifts, activeShiftId } = get();
    return shifts.find((s) => s.id === activeShiftId);
  },

  openShift: (restaurantId, openingFloat, staffId) => {
    const existing = get().getActiveShift();
    if (existing) return existing;

    const shift: Shift = {
      id: generateId('shift'),
      restaurant_id: restaurantId,
      opened_at: new Date().toISOString(),
      opened_by: staffId,
      opening_float: openingFloat,
      withdrawals: [],
      status: 'open',
    };

    set((state) => ({ shifts: [...state.shifts, shift], activeShiftId: shift.id }));
    syncShiftPersistence(shift);
    return shift;
  },

  addWithdrawal: (amount, reason) => {
    const active = get().getActiveShift();
    if (!active) return;
    const movement: CashMovement = {
      id: generateId('cm'),
      amount,
      reason,
      created_at: new Date().toISOString(),
    };
    const updated: Shift = { ...active, withdrawals: [...active.withdrawals, movement] };
    set((state) => ({ shifts: state.shifts.map((s) => (s.id === updated.id ? updated : s)) }));
    syncShiftPersistence(updated);
  },

  closeShift: (input) => {
    const active = get().getActiveShift();
    if (!active) return;
    const difference = Math.round((input.countedTotal - input.cashExpected) * 100) / 100;
    const updated: Shift = {
      ...active,
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by: input.closedBy,
      counted_bills: input.countedBills,
      counted_total: input.countedTotal,
      cash_expected: input.cashExpected,
      difference,
      sales_total: input.salesTotal,
      sales_count: input.salesCount,
      tips_total: input.tipsTotal,
    };
    set((state) => ({
      shifts: state.shifts.map((s) => (s.id === updated.id ? updated : s)),
      activeShiftId: null,
    }));
    syncShiftPersistence(updated);
  },
}));
