-- =========================================================
-- COMPLETE MIGRATION SCRIPT: Performance Optimization with Generated Columns
-- =========================================================
-- Run this script on any new database to implement all performance optimizations
-- Version: 1.0
-- Date: 2025-06-19
-- =========================================================

-- 1. CREATE HELPER FUNCTIONS (if not exist)
-- =========================================================
-- Function for currency formatting
CREATE OR REPLACE FUNCTION format_currency(amount numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF amount IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Basic formatting: 1234.56 -> "1,234.56€"
  RETURN to_char(amount, 'FM999,999,990.00') || '€';
END;
$$;

-- Function for German date formatting
CREATE OR REPLACE FUNCTION format_date_german(date_val date)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF date_val IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- German date format: DD.MM.YYYY
  RETURN to_char(date_val, 'DD.MM.YYYY');
END;
$$;

-- Function for area formatting
CREATE OR REPLACE FUNCTION format_area(area numeric)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF area IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Format as: "123.45 m²"
  RETURN to_char(area, 'FM999,999,990.00') || ' m²';
END;
$$;

-- 2. ADD GENERATED COLUMNS TO RENTERS
-- =========================================================
ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS security_deposit_formatted text 
GENERATED ALWAYS AS (format_currency(security_deposit)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS lease_start_date_formatted text 
GENERATED ALWAYS AS (format_date_german(lease_start_date)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS lease_end_date_formatted text 
GENERATED ALWAYS AS (format_date_german(lease_end_date)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS cold_rent_formatted text 
GENERATED ALWAYS AS (format_currency(cold_rent)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS heating_costs_formatted text 
GENERATED ALWAYS AS (format_currency(heating_costs)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS parking_costs_formatted text 
GENERATED ALWAYS AS (format_currency(parking_costs)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS utility_costs_formatted text 
GENERATED ALWAYS AS (format_currency(utility_costs)) STORED;

ALTER TABLE renters 
ADD COLUMN IF NOT EXISTS total_rent_formatted text 
GENERATED ALWAYS AS (
  format_currency(
    COALESCE(cold_rent, 0::numeric) + 
    COALESCE(heating_costs, 0::numeric) + 
    COALESCE(parking_costs, 0::numeric) + 
    COALESCE(utility_costs, 0::numeric) + 
    COALESCE(other_costs, 0::numeric)
  )
) STORED;

-- 3. ADD GENERATED COLUMNS TO APARTMENTS
-- =========================================================
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS total_area_formatted text 
GENERATED ALWAYS AS (format_area(total_area)) STORED;

ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS kitchen_area_formatted text 
GENERATED ALWAYS AS (format_area(kitchen_area)) STORED;

ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS living_room_area_formatted text 
GENERATED ALWAYS AS (format_area(living_room_area)) STORED;

ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS bathroom_1_area_formatted text 
GENERATED ALWAYS AS (format_area(bathroom_1_area)) STORED;

ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS bedroom_1_area_formatted text 
GENERATED ALWAYS AS (format_area(bedroom_1_area)) STORED;

-- 4. CREATE PERFORMANCE INDEXES
-- =========================================================
-- Renters indexes
CREATE INDEX IF NOT EXISTS idx_renters_tenant_lease_dates 
ON renters (tenant_id, lease_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_renters_tenant_status 
ON renters (tenant_id, status);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_tenant 
ON properties (tenant_id);

-- Business partners indexes
CREATE INDEX IF NOT EXISTS idx_business_partners_tenant_status 
ON business_partners (tenant_id, status);

-- Bank transactions indexes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date 
ON bank_transactions (tenant_id, date DESC);

-- Apartments indexes
CREATE INDEX IF NOT EXISTS idx_apartments_tenant 
ON apartments (tenant_id);

CREATE INDEX IF NOT EXISTS idx_apartments_property 
ON apartments (property);

-- Other table indexes
CREATE INDEX IF NOT EXISTS idx_booking_categories_tenant 
ON booking_categories (tenant_id);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant 
ON bank_accounts (tenant_id);

CREATE INDEX IF NOT EXISTS idx_transaction_patterns_tenant 
ON transaction_patterns (tenant_id);

-- 5. UPDATE DISPLAY FUNCTIONS TO USE GENERATED COLUMNS
-- =========================================================

-- Update get_renters_display
CREATE OR REPLACE FUNCTION public.get_renters_display(tenant_uuid uuid)
RETURNS TABLE(
  id uuid, 
  full_name text, 
  email text, 
  phone text, 
  status text, 
  lease_start_date date, 
  lease_end_date date, 
  computed_status text, 
  cold_rent_formatted text, 
  total_rent_formatted text, 
  days_until_lease_end integer, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.full_name,
    r.email,
    r.phone,
    r.status,
    r.lease_start_date,
    r.lease_end_date,
    
    -- Computed fields (time-dependent, must remain virtual)
    CASE 
      WHEN r.lease_end_date < CURRENT_DATE THEN 'Expired'
      WHEN r.lease_start_date > CURRENT_DATE THEN 'Future'
      ELSE r.status
    END as computed_status,
    
    -- Use pre-computed generated columns instead of formatting here
    r.cold_rent_formatted,
    r.total_rent_formatted,
    
    -- Time calculations (must remain virtual)
    CASE 
      WHEN r.lease_end_date IS NOT NULL 
      THEN (r.lease_end_date - CURRENT_DATE)
      ELSE NULL
    END as days_until_lease_end,
    
    r.created_at,
    r.updated_at
  FROM renters r
  WHERE r.tenant_id = tenant_uuid;
END;
$function$;

-- Update get_bank_transactions_display
CREATE OR REPLACE FUNCTION public.get_bank_transactions_display(tenant_uuid uuid)
RETURNS TABLE(
  id uuid, 
  amount numeric, 
  payer text, 
  description text, 
  date date, 
  partner_name text, 
  partner_type text, 
  property_name text, 
  property_address text, 
  renter_id uuid, 
  business_partner_id uuid, 
  property_id bigint, 
  transaction_type text, 
  amount_formatted text, 
  date_formatted text, 
  booking_category text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    bt.id,
    bt.amount,
    bt.payer,
    bt.description,
    bt.date,
    
    -- Smart partner resolution (using actual foreign key names)
    COALESCE(r.full_name, bp.full_name) as partner_name,
    CASE 
      WHEN r.id IS NOT NULL THEN 'renter'
      WHEN bp.id IS NOT NULL THEN 'business_partner'
      ELSE NULL
    END as partner_type,
    
    -- Property information
    p.name as property_name,
    p.street || ', ' || p.city as property_address,
    
    -- Foreign key references for updates (using actual column names)
    bt.renter_id,
    bt.business_partner_id,
    bt.property_id,
    
    -- Computed fields (time-independent, but simple enough to leave virtual)
    CASE 
      WHEN bt.amount > 0 THEN 'Income'
      WHEN bt.amount < 0 THEN 'Expense'
      ELSE 'Transfer'
    END as transaction_type,
    
    -- Use pre-computed generated columns instead of formatting here
    bt.amount_formatted,
    bt.date_formatted,
    
    -- Booking category (if exists)
    bc."Name" as booking_category,
    
    bt.created_at,
    bt.updated_at
  FROM bank_transactions bt
  LEFT JOIN renters r ON bt.renter_id = r.id AND r.tenant_id = tenant_uuid
  LEFT JOIN business_partners bp ON bt.business_partner_id = bp.id AND bp.tenant_id = tenant_uuid
  LEFT JOIN properties p ON bt.property_id = p.id AND p.tenant_id = tenant_uuid
  LEFT JOIN booking_categories bc ON bt.booking_category_id = bc.id AND bc.tenant_id = tenant_uuid
  WHERE bt.tenant_id = tenant_uuid;
END;
$function$;

-- Update get_renters_payment_schedule_display
CREATE OR REPLACE FUNCTION public.get_renters_payment_schedule_display(tenant_uuid uuid)
RETURNS TABLE(
  id integer, 
  tenant_name text, 
  cold_rent_formatted text, 
  heating_costs_formatted text, 
  additional_costs_formatted text, 
  parking_costs_formatted text, 
  total_monthly_cost_formatted text, 
  renter_id uuid, 
  effective_from_formatted text, 
  legal_notice_date_formatted text, 
  notes text, 
  schedule_status text, 
  months_active integer, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rps.id,
    rps.tenant_name,
    
    -- Use pre-computed generated columns instead of formatting here
    rps.cold_rent_formatted,
    rps.heating_costs_formatted,
    rps.additional_costs_formatted,
    rps.parking_costs_formatted,
    rps.total_monthly_cost_formatted,
    
    rps.renter_id,
    
    -- Use pre-computed generated columns for dates
    rps.effective_from_formatted,
    rps.legal_notice_date_formatted,
    
    rps.notes,
    
    -- Computed status (time-dependent, must remain virtual)
    CASE 
      WHEN rps.effective_from > CURRENT_DATE THEN 'Future'
      WHEN rps.effective_from <= CURRENT_DATE THEN 'Active'
      ELSE 'Unknown'
    END as schedule_status,
    
    -- Calculate months active (time-dependent, must remain virtual)
    CASE 
      WHEN rps.effective_from <= CURRENT_DATE THEN 
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, rps.effective_from)) * 12 + 
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, rps.effective_from)))::INTEGER
      ELSE 0
    END as months_active,
    
    rps.created_at
    
  FROM renters_payment_schedule rps
  WHERE rps.tenant_id = tenant_uuid
  ORDER BY rps.effective_from DESC, rps.id DESC;
END;
$function$;

-- 6. CREATE PERFORMANCE MONITORING TOOLS
-- =========================================================
CREATE OR REPLACE FUNCTION test_display_function_performance(tenant_uuid uuid)
RETURNS TABLE(
  function_name text,
  execution_time_ms numeric,
  row_count bigint
)
LANGUAGE plpgsql
AS $$
DECLARE
  start_time timestamp;
  end_time timestamp;
  row_cnt bigint;
BEGIN
  -- Test get_bank_transactions_display
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_cnt FROM get_bank_transactions_display(tenant_uuid);
  end_time := clock_timestamp();
  
  function_name := 'get_bank_transactions_display';
  execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  row_count := row_cnt;
  RETURN NEXT;
  
  -- Test get_renters_display
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_cnt FROM get_renters_display(tenant_uuid);
  end_time := clock_timestamp();
  
  function_name := 'get_renters_display';
  execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  row_count := row_cnt;
  RETURN NEXT;
  
  -- Test get_renters_payment_schedule_display
  start_time := clock_timestamp();
  SELECT COUNT(*) INTO row_cnt FROM get_renters_payment_schedule_display(tenant_uuid);
  end_time := clock_timestamp();
  
  function_name := 'get_renters_payment_schedule_display';
  execution_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
  row_count := row_cnt;
  RETURN NEXT;
END;
$$;

-- 7. UPDATE ALL TABLE STATISTICS
-- =========================================================
ANALYZE renters;
ANALYZE apartments;
ANALYZE bank_transactions;
ANALYZE renters_payment_schedule;
ANALYZE properties;
ANALYZE business_partners;
ANALYZE bank_accounts;
ANALYZE booking_categories;
ANALYZE transaction_patterns;

-- =========================================================
-- END OF MIGRATION SCRIPT
-- =========================================================
-- To test performance after running this script:
-- SELECT * FROM test_display_function_performance('your-tenant-id');
-- =========================================================
