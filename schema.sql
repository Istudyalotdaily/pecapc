-- PeçaPC Brasil - Database Schema
-- PostgreSQL

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(64)  UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PARTS ────────────────────────────────────────────────────────────────────
CREATE TABLE parts (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  category       VARCHAR(64)  NOT NULL,  -- cpu | cooler | mobo | ram | gpu | storage | psu | case
  brand          VARCHAR(64),
  model          VARCHAR(128),
  specifications JSONB,                  -- { cores: 6, tdp: 105, socket: 'AM5', ... }
  price_brl      NUMERIC(10,2),
  image_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_parts_brand    ON parts(brand);

-- ─── STORE PRICES ─────────────────────────────────────────────────────────────
CREATE TABLE store_prices (
  id         SERIAL PRIMARY KEY,
  part_id    INTEGER REFERENCES parts(id) ON DELETE CASCADE,
  store_name VARCHAR(64) NOT NULL,    -- KaBuM!, Pichau, TerabyteShop, Amazon BR
  price_brl  NUMERIC(10,2),
  url        TEXT,
  in_stock   BOOLEAN DEFAULT TRUE,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_store_prices_part ON store_prices(part_id);

-- ─── BUILDS ───────────────────────────────────────────────────────────────────
CREATE TABLE builds (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  total_price NUMERIC(10,2),
  public      BOOLEAN DEFAULT FALSE,
  likes       INTEGER DEFAULT 0,
  use_case    VARCHAR(128),            -- Gaming 1080p, Edição de vídeo, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_builds_user   ON builds(user_id);
CREATE INDEX idx_builds_public ON builds(public);
CREATE INDEX idx_builds_likes  ON builds(likes DESC);

-- ─── BUILD PARTS ──────────────────────────────────────────────────────────────
CREATE TABLE build_parts (
  id        SERIAL PRIMARY KEY,
  build_id  INTEGER REFERENCES builds(id) ON DELETE CASCADE,
  part_id   INTEGER REFERENCES parts(id),
  quantity  INTEGER DEFAULT 1
);

CREATE INDEX idx_build_parts_build ON build_parts(build_id);

-- ─── PART COMPATIBILITY ───────────────────────────────────────────────────────
CREATE TABLE compatibility_rules (
  id          SERIAL PRIMARY KEY,
  part_a_cat  VARCHAR(64),           -- e.g. 'cpu'
  part_b_cat  VARCHAR(64),           -- e.g. 'mobo'
  field_a     VARCHAR(64),           -- e.g. 'socket'
  field_b     VARCHAR(64),           -- e.g. 'socket'
  rule_type   VARCHAR(16) DEFAULT 'match',  -- match | min | max
  description TEXT
);

-- Socket rules
INSERT INTO compatibility_rules (part_a_cat, part_b_cat, field_a, field_b, description) VALUES
  ('cpu', 'mobo', 'socket', 'socket', 'CPU socket deve corresponder ao socket da placa-mãe'),
  ('ram', 'mobo', 'type',   'ram_type', 'Tipo de RAM (DDR4/DDR5) deve ser compatível com a placa-mãe');

-- ─── SEED: SAMPLE PARTS ───────────────────────────────────────────────────────
INSERT INTO parts (name, category, brand, model, specifications, price_brl) VALUES
  ('AMD Ryzen 5 7600X', 'cpu', 'AMD', 'Ryzen 5 7600X',
   '{"cores":6,"threads":12,"socket":"AM5","tdp":105,"boost_ghz":5.3}', 1299.00),

  ('Intel Core i5-14600K', 'cpu', 'Intel', 'Core i5-14600K',
   '{"cores":14,"threads":20,"socket":"LGA1700","tdp":125,"boost_ghz":5.3}', 1489.00),

  ('AMD Ryzen 7 7800X3D', 'cpu', 'AMD', 'Ryzen 7 7800X3D',
   '{"cores":8,"threads":16,"socket":"AM5","tdp":120,"boost_ghz":5.0,"vcache":true}', 2199.00),

  ('ASUS PRIME B650M-A', 'mobo', 'ASUS', 'PRIME B650M-A',
   '{"form_factor":"mATX","socket":"AM5","ram_type":"DDR5","pcie_version":5}', 899.00),

  ('MSI MAG B760 TOMAHAWK', 'mobo', 'MSI', 'MAG B760 TOMAHAWK',
   '{"form_factor":"ATX","socket":"LGA1700","ram_type":"DDR5","pcie_version":5}', 1099.00),

  ('G.Skill Trident Z5 RGB 32GB', 'ram', 'G.Skill', 'Trident Z5 RGB',
   '{"capacity_gb":32,"kit":"2x16","type":"DDR5","speed":6000,"cl":30}', 679.00),

  ('RTX 4070 Super 12GB', 'gpu', 'NVIDIA', 'GeForce RTX 4070 Super',
   '{"vram_gb":12,"vram_type":"GDDR6X","tdp":220,"process_nm":4}', 3299.00),

  ('WD Black SN850X 1TB', 'storage', 'Western Digital', 'Black SN850X',
   '{"capacity_gb":1000,"type":"NVMe","interface":"PCIe 4.0","read_mbps":7300}', 449.00),

  ('Corsair RM850x', 'psu', 'Corsair', 'RM850x',
   '{"wattage":850,"efficiency":"80+ Gold","modular":true}', 699.00),

  ('Lian Li O11 Dynamic EVO', 'case', 'Lian Li', 'O11 Dynamic EVO',
   '{"form_factor":"Mid Tower","compatible_mobo":["ATX","mATX","ITX"],"tempered_glass":true}', 899.00);
