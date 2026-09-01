import { create } from 'zustand';

export type ToastKind = 'ok' | 'warn';

interface ToastState {
  message: string | null;
  kind: ToastKind;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  kind: 'ok',
  show: (message, kind = 'ok') => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, kind });
    hideTimer = setTimeout(() => set({ message: null }), 3200);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message: null });
  },
}));
