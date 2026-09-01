import type { OrderChannel } from '@/types';

export const CHANNEL_LABELS: Record<OrderChannel, string> = {
  dine_in: 'Mostrador',
  takeaway: 'Para llevar',
  didi: 'DiDi Food',
  uber: 'Uber Eats',
};
