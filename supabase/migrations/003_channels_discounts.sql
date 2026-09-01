-- Canales de venta (mostrador, para llevar, plataformas) y descuentos.
-- Aditivo: todo con default o nullable para no romper filas existentes.

-- Canal de la orden — reemplaza la dependencia de una mesa falsa para mostrador/para llevar.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'dine_in'
  CHECK (channel IN ('dine_in', 'takeaway', 'didi', 'uber'));

-- Datos propios de para llevar y plataformas.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_ref TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packaging TEXT
  CHECK (packaging IS NULL OR packaging IN ('bag', 'box', 'no_cutlery'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS prep_minutes INT;

-- Descuento: se guarda en la orden para que aparezca en el ticket y en el corte de caja.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_type TEXT
  CHECK (discount_type IS NULL OR discount_type IN ('percent', 'fixed', 'comp'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_authorized_by UUID REFERENCES profiles(id);

-- Métodos de pago nuevos (Mercado Pago, Apple Pay) además de cash/card/transfer.
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mp';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'apple';
