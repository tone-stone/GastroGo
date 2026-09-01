-- Corte de caja: turnos y movimientos de efectivo (retiros).

CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_by UUID REFERENCES profiles(id),
  opening_float DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES profiles(id),
  counted_bills JSONB,
  counted_total DECIMAL(10,2),
  cash_expected DECIMAL(10,2),
  difference DECIMAL(10,2),
  sales_total DECIMAL(10,2),
  sales_count INT,
  tips_total DECIMAL(10,2)
);

CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un solo turno abierto por restaurante a la vez.
CREATE UNIQUE INDEX idx_shifts_one_open_per_restaurant ON shifts(restaurant_id) WHERE status = 'open';
CREATE INDEX idx_shifts_restaurant ON shifts(restaurant_id);
CREATE INDEX idx_cash_movements_shift ON cash_movements(shift_id);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shifts_member_access" ON shifts
  FOR ALL USING (restaurant_id IN (SELECT user_restaurant_ids()));

CREATE POLICY "cash_movements_via_shift" ON cash_movements
  FOR ALL USING (
    shift_id IN (SELECT id FROM shifts WHERE restaurant_id IN (SELECT user_restaurant_ids()))
  );

ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
