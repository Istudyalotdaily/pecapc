CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(64)  UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parts (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  category       VARCHAR(64)  NOT NULL,
  brand          VARCHAR(64),
  model          VARCHAR(128),
  specifications JSONB,
  price_brl      NUMERIC(10,2),
  image_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE store_prices (
  id         SERIAL PRIMARY KEY,
  part_id    INTEGER REFERENCES parts(id) ON DELETE CASCADE,
  store_name VARCHAR(64) NOT NULL,
  price_brl  NUMERIC(10,2),
  url        TEXT,
  in_stock   BOOLEAN DEFAULT TRUE,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE builds (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  total_price NUMERIC(10,2),
  public      BOOLEAN DEFAULT FALSE,
  likes       INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE build_parts (
  id       SERIAL PRIMARY KEY,
  build_id INTEGER REFERENCES builds(id) ON DELETE CASCADE,
  part_id  INTEGER REFERENCES parts(id),
  quantity INTEGER DEFAULT 1
);
