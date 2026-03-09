// src/db.js — SQLite database init & helpers
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'pecapc.db');

// Ensure data/ dir exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  -- Master product catalog
  CREATE TABLE IF NOT EXISTS products (
    id          TEXT PRIMARY KEY,        -- e.g. 'cpu_9800x3d'
    category    TEXT NOT NULL,           -- cpu | gpu | ram | storage | mobo | psu | case | cooler
    name        TEXT NOT NULL,
    specs       TEXT,
    badge       TEXT,                    -- pop | dest | novo | null
    socket      TEXT,
    tdp         INTEGER,
    ram_type    TEXT,
    form_factor TEXT,
    wattage     INTEGER,
    vram        INTEGER,
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  -- Store listings (one row per product × store)
  CREATE TABLE IF NOT EXISTS listings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  TEXT NOT NULL REFERENCES products(id),
    store       TEXT NOT NULL,           -- 'Pichau' | 'KaBuM' | 'Amazon' | 'Terabyte' ...
    url         TEXT NOT NULL,           -- direct product page URL
    price       REAL,                    -- null = out of stock / unknown
    in_stock    INTEGER DEFAULT 1,       -- 0 | 1
    scraped_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(product_id, store)
  );

  -- Price history (one row per scrape event that found a price)
  CREATE TABLE IF NOT EXISTS price_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id  TEXT NOT NULL REFERENCES products(id),
    store       TEXT NOT NULL,
    price       REAL NOT NULL,
    scraped_at  TEXT DEFAULT (datetime('now'))
  );

  -- Scrape log (audit trail)
  CREATE TABLE IF NOT EXISTS scrape_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at  TEXT NOT NULL,
    finished_at TEXT,
    products_scraped INTEGER DEFAULT 0,
    errors      INTEGER DEFAULT 0,
    status      TEXT DEFAULT 'running'   -- running | ok | error
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_listings_product   ON listings(product_id);
  CREATE INDEX IF NOT EXISTS idx_history_product    ON price_history(product_id, store);
  CREATE INDEX IF NOT EXISTS idx_history_scraped    ON price_history(scraped_at);
`);

// ── Prepared statements ───────────────────────────────────────────────────────
export const stmt = {
  upsertProduct: db.prepare(`
    INSERT INTO products (id, category, name, specs, badge, socket, tdp, ram_type, form_factor, wattage, vram)
    VALUES (@id, @category, @name, @specs, @badge, @socket, @tdp, @ram_type, @form_factor, @wattage, @vram)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, specs=excluded.specs, badge=excluded.badge,
      updated_at=datetime('now')
  `),

  upsertListing: db.prepare(`
    INSERT INTO listings (product_id, store, url, price, in_stock, scraped_at)
    VALUES (@product_id, @store, @url, @price, @in_stock, datetime('now'))
    ON CONFLICT(product_id, store) DO UPDATE SET
      url=excluded.url, price=excluded.price, in_stock=excluded.in_stock,
      scraped_at=datetime('now')
  `),

  insertHistory: db.prepare(`
    INSERT INTO price_history (product_id, store, price, scraped_at)
    VALUES (@product_id, @store, @price, datetime('now'))
  `),

  getProduct: db.prepare(`SELECT * FROM products WHERE id = ?`),

  getAllProducts: db.prepare(`SELECT * FROM products ORDER BY category, name`),

  getProductsByCategory: db.prepare(`SELECT * FROM products WHERE category = ? ORDER BY name`),

  getListingsForProduct: db.prepare(`
    SELECT * FROM listings WHERE product_id = ? ORDER BY price ASC
  `),

  getPriceHistory: db.prepare(`
    SELECT store, price, scraped_at
    FROM price_history
    WHERE product_id = ? AND store = ?
    ORDER BY scraped_at ASC
    LIMIT 90
  `),

  getMinPrice: db.prepare(`
    SELECT MIN(price) as min_price FROM listings WHERE product_id = ? AND in_stock = 1
  `),

  getAllWithListings: db.prepare(`
    SELECT p.*,
      (SELECT MIN(l.price) FROM listings l WHERE l.product_id = p.id AND l.in_stock = 1) as min_price
    FROM products p
    ORDER BY p.category, min_price ASC
  `),

  startScrapeLog: db.prepare(`
    INSERT INTO scrape_log (started_at) VALUES (datetime('now'))
  `),

  finishScrapeLog: db.prepare(`
    UPDATE scrape_log SET finished_at=datetime('now'), products_scraped=@products_scraped,
    errors=@errors, status=@status WHERE id=@id
  `),

  getRecentLogs: db.prepare(`
    SELECT * FROM scrape_log ORDER BY started_at DESC LIMIT 10
  `),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Update price for a product/store, and record history if price changed */
export function recordPrice(productId, store, url, price, inStock = true) {
  const existing = db.prepare(
    `SELECT price FROM listings WHERE product_id=? AND store=?`
  ).get(productId, store);

  stmt.upsertListing.run({
    product_id: productId,
    store,
    url,
    price: price ?? null,
    in_stock: inStock ? 1 : 0,
  });

  // Record history whenever price exists and changed (or first time)
  if (price !== null && price !== undefined) {
    if (!existing || existing.price !== price) {
      stmt.insertHistory.run({ product_id: productId, store, price });
    }
  }
}

/** Return full catalog as JSON-serialisable array, grouped by category */
export function getCatalogJSON() {
  const products = stmt.getAllWithListings.all();
  return products.map(p => {
    const listings = stmt.getListingsForProduct.all(p.id);
    return {
      id: p.id,
      category: p.category,
      name: p.name,
      specs: p.specs,
      badge: p.badge,
      socket: p.socket,
      tdp: p.tdp,
      ramType: p.ram_type,
      formFactor: p.form_factor,
      wattage: p.wattage,
      vram: p.vram,
      price: p.min_price,
      listings: listings.map(l => ({
        store: l.store,
        price: l.price,
        url: l.url,
        inStock: !!l.in_stock,
        scrapedAt: l.scraped_at,
      })),
    };
  });
}

export default db;
