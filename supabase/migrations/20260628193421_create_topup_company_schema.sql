/*
# Create Phone Top-Up Company Schema

1. New Tables
- `phone_numbers`: أرقام الهواتف المتاحة للشحن (الرقم، الدولة، المزود، السعر، الحالة)
- `providers`: مزودي الشحن (الاسم، API endpoint، API key، الحالة)
- `recharges`: سجل عمليات الشحن (الرقم، المبلغ، المزود، الحالة، المرجع)
- `ivr_calls`: سجل المكالمات الواردة للرد الآلي (الرقم المستدعي، الاختيار، النتيجة، المدة)
- `ivr_menu`: إعداد قائمة الرد الآلي (الخيارات، الرسائل الصوتية)

2. Security
- Enable RLS on all tables.
- Allow anon + authenticated CRUD (single-tenant app, no sign-in).

3. Notes
- All tables use gen_random_uuid() for primary keys.
- created_at defaults to now().
- Foreign keys with ON DELETE SET NULL for child tables.
- Indexes on frequently-queried columns.
*/

-- Providers table (مزودي الشحن)
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  api_url text,
  api_key text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  logo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_providers" ON providers;
CREATE POLICY "anon_select_providers" ON providers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_providers" ON providers;
CREATE POLICY "anon_insert_providers" ON providers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_providers" ON providers;
CREATE POLICY "anon_update_providers" ON providers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_providers" ON providers;
CREATE POLICY "anon_delete_providers" ON providers FOR DELETE
  TO anon, authenticated USING (true);

-- Phone numbers table (أرقام الهواتف)
CREATE TABLE IF NOT EXISTS phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  country text NOT NULL DEFAULT 'EG',
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  balance numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'suspended', 'expired')),
  owner_name text,
  owner_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_phone_numbers" ON phone_numbers;
CREATE POLICY "anon_select_phone_numbers" ON phone_numbers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_phone_numbers" ON phone_numbers;
CREATE POLICY "anon_insert_phone_numbers" ON phone_numbers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_phone_numbers" ON phone_numbers;
CREATE POLICY "anon_update_phone_numbers" ON phone_numbers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_phone_numbers" ON phone_numbers;
CREATE POLICY "anon_delete_phone_numbers" ON phone_numbers FOR DELETE
  TO anon, authenticated USING (true);

-- Recharges table (عمليات الشحن)
CREATE TABLE IF NOT EXISTS recharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  amount numeric(10,2) NOT NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference text,
  provider_response text,
  customer_phone text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recharges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_recharges" ON recharges;
CREATE POLICY "anon_select_recharges" ON recharges FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_recharges" ON recharges;
CREATE POLICY "anon_insert_recharges" ON recharges FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_recharges" ON recharges;
CREATE POLICY "anon_update_recharges" ON recharges FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_recharges" ON recharges;
CREATE POLICY "anon_delete_recharges" ON recharges FOR DELETE
  TO anon, authenticated USING (true);

-- IVR calls table (سجل مكالمات الرد الآلي)
CREATE TABLE IF NOT EXISTS ivr_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_phone text NOT NULL,
  dialed_number text,
  menu_choice text,
  input_number text,
  result text,
  duration integer DEFAULT 0,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'abandoned')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ivr_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ivr_calls" ON ivr_calls;
CREATE POLICY "anon_select_ivr_calls" ON ivr_calls FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ivr_calls" ON ivr_calls;
CREATE POLICY "anon_insert_ivr_calls" ON ivr_calls FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ivr_calls" ON ivr_calls;
CREATE POLICY "anon_update_ivr_calls" ON ivr_calls FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ivr_calls" ON ivr_calls;
CREATE POLICY "anon_delete_ivr_calls" ON ivr_calls FOR DELETE
  TO anon, authenticated USING (true);

-- IVR menu config table (إعداد قائمة الرد الآلي)
CREATE TABLE IF NOT EXISTS ivr_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  voice_message text NOT NULL,
  action text NOT NULL DEFAULT 'menu' CHECK (action IN ('menu', 'recharge', 'balance', 'support', 'repeat')),
  target_key text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ivr_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_ivr_menu" ON ivr_menu;
CREATE POLICY "anon_select_ivr_menu" ON ivr_menu FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_ivr_menu" ON ivr_menu;
CREATE POLICY "anon_insert_ivr_menu" ON ivr_menu FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_ivr_menu" ON ivr_menu;
CREATE POLICY "anon_update_ivr_menu" ON ivr_menu FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_ivr_menu" ON ivr_menu;
CREATE POLICY "anon_delete_ivr_menu" ON ivr_menu FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phone_numbers_number ON phone_numbers(number);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers(status);
CREATE INDEX IF NOT EXISTS idx_recharges_phone ON recharges(phone_number);
CREATE INDEX IF NOT EXISTS idx_recharges_status ON recharges(status);
CREATE INDEX IF NOT EXISTS idx_recharges_created ON recharges(created_at);
CREATE INDEX IF NOT EXISTS idx_ivr_calls_created ON ivr_calls(created_at);
CREATE INDEX IF NOT EXISTS idx_ivr_menu_key ON ivr_menu(key);
