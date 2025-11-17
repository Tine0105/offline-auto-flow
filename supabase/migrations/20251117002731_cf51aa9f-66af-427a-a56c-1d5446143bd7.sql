-- Create vehicles table
CREATE TABLE public.vehicles (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  brand TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL,
  colors TEXT[] DEFAULT '{}',
  image TEXT,
  description TEXT NOT NULL,
  vins TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers table
CREATE TABLE public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address_house TEXT,
  address_hamlet TEXT,
  address_ward TEXT,
  address_city TEXT,
  address_raw TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT NOT NULL
);

-- Create orders table
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  services TEXT[] DEFAULT '{}',
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'other')),
  serial_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Create payment_history table
CREATE TABLE public.payment_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL,
  services JSONB DEFAULT '[]',
  payment_method TEXT,
  promotion_id TEXT,
  serial_number TEXT,
  total_amount NUMERIC NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL
);

-- Create promotions table
CREATE TABLE public.promotions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  vehicle_ids TEXT[] DEFAULT '{}',
  discount_percent INTEGER NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ
);

-- Create brands table
CREATE TABLE public.brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create inventory_reports table
CREATE TABLE public.inventory_reports (
  id TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_reports ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for authenticated users
CREATE POLICY "Authenticated users can view vehicles"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view services"
  ON public.services FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete services"
  ON public.services FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view payment_history"
  ON public.payment_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payment_history"
  ON public.payment_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view promotions"
  ON public.promotions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert promotions"
  ON public.promotions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update promotions"
  ON public.promotions FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete promotions"
  ON public.promotions FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view brands"
  ON public.brands FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert brands"
  ON public.brands FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete brands"
  ON public.brands FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view inventory_reports"
  ON public.inventory_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory_reports"
  ON public.inventory_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default services
INSERT INTO public.services (id, name, price, description) VALUES
  ('SRV1', 'Bảo hiểm vật chất', 5000000, 'Bảo hiểm toàn diện cho xe'),
  ('SRV2', 'Phụ kiện cao cấp', 3000000, 'Gói phụ kiện nâng cấp xe'),
  ('SRV3', 'Bảo dưỡng miễn phí', 2000000, 'Bảo dưỡng miễn phí 1 năm');