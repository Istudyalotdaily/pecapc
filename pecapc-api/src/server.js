// src/server.js — PeçaPC price API
import express  from 'express';
import cors     from 'cors';
import cron     from 'node-cron';
import 'dotenv/config';

import db, { stmt, getCatalogJSON } from './db.js';
import { runScrape } from './scraper.js';

const app  = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || null; // optional: set in .env to protect admin routes

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// ── Auth middleware for admin routes ─────────────────────────────────────────
function requireKey(req, res, next) {
  if (!API_KEY) return next(); // no key configured → open
  const key = req.headers['x-api-key'] ?? req.query.key;
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/products
 * Returns full catalog with current listings (lowest price first per product).
 * Optional query params: ?category=cpu|gpu|ram|storage|mobo|psu|case|cooler
 */
app.get('/api/products', (req, res) => {
  try {
    const { category } = req.query;
    let catalog = getCatalogJSON();
    if (category) catalog = catalog.filter(p => p.category === category);
    res.json({ ok: true, count: catalog.length, data: catalog });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Single product with full listing and price history per store.
 */
app.get('/api/products/:id', (req, res) => {
  try {
    const product = stmt.getProduct.get(req.params.id);
    if (!product) return res.status(404).json({ ok: false, error: 'Not found' });

    const listings = stmt.getListingsForProduct.all(req.params.id);

    // Per-store history (last 90 days)
    const history = {};
    for (const l of listings) {
      history[l.store] = stmt.getPriceHistory.all(req.params.id, l.store);
    }

    res.json({
      ok: true,
      data: {
        ...product,
        listings: listings.map(l => ({
          store:     l.store,
          price:     l.price,
          url:       l.url,
          inStock:   !!l.in_stock,
          scrapedAt: l.scraped_at,
        })),
        history,
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/products/:id/history?store=Pichau
 * Price history for a specific product (optionally filtered by store).
 */
app.get('/api/products/:id/history', (req, res) => {
  try {
    const { store } = req.query;
    let rows;
    if (store) {
      rows = stmt.getPriceHistory.all(req.params.id, store);
    } else {
      rows = db.prepare(`
        SELECT store, price, scraped_at
        FROM price_history WHERE product_id = ?
        ORDER BY scraped_at ASC
      `).all(req.params.id);
    }
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/categories
 * Returns list of categories with product counts and price ranges.
 */
app.get('/api/categories', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT p.category,
        COUNT(DISTINCT p.id)                                          AS count,
        MIN(l.price)                                                   AS min_price,
        MAX(l.price)                                                   AS max_price
      FROM products p
      LEFT JOIN listings l ON l.product_id = p.id AND l.in_stock = 1
      GROUP BY p.category
      ORDER BY p.category
    `).all();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/deals
 * Products where at least one store dropped price in last 7 days.
 * Returns top 20 deals by % drop.
 */
app.get('/api/deals', (req, res) => {
  try {
    const rows = db.prepare(`
      WITH recent AS (
        SELECT product_id, store, price,
          ROW_NUMBER() OVER (PARTITION BY product_id, store ORDER BY scraped_at DESC) AS rn
        FROM price_history
      ),
      prev AS (
        SELECT product_id, store, price,
          ROW_NUMBER() OVER (PARTITION BY product_id, store ORDER BY scraped_at DESC) AS rn
        FROM price_history
        WHERE scraped_at <= datetime('now', '-7 days')
      ),
      drops AS (
        SELECT r.product_id,
               r.price  AS current_price,
               p.price  AS prev_price,
               ROUND((p.price - r.price) / p.price * 100, 1) AS drop_pct
        FROM recent r
        JOIN prev p ON p.product_id = r.product_id AND p.store = r.store
        WHERE r.rn = 1 AND p.rn = 1 AND r.price < p.price
      )
      SELECT d.*, pr.name, pr.category, pr.specs
      FROM drops d JOIN products pr ON pr.id = d.product_id
      ORDER BY drop_pct DESC
      LIMIT 20
    `).all();
    res.json({ ok: true, data: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/scrape/trigger  (admin, requires API_KEY)
 * Manually trigger a scrape run.
 */
app.post('/api/scrape/trigger', requireKey, async (req, res) => {
  // Respond immediately, run in background
  res.json({ ok: true, message: 'Scrape started in background' });
  try {
    await runScrape({ verbose: true });
  } catch (err) {
    console.error('Manual scrape error:', err);
  }
});

/**
 * GET /api/scrape/logs
 * Recent scrape audit log.
 */
app.get('/api/scrape/logs', requireKey, (req, res) => {
  try {
    const logs = stmt.getRecentLogs.all();
    res.json({ ok: true, data: logs });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /health
 * Health check.
 */
app.get('/health', (req, res) => {
  const lastScrape = db.prepare(
    `SELECT finished_at, status FROM scrape_log ORDER BY id DESC LIMIT 1`
  ).get();
  res.json({ ok: true, lastScrape });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

// ── Daily cron ────────────────────────────────────────────────────────────────
// Runs every day at 06:00 BRT (09:00 UTC)
cron.schedule('0 9 * * *', async () => {
  console.log('\n⏰ Daily scrape triggered by cron');
  try {
    await runScrape({ verbose: true });
  } catch (err) {
    console.error('Cron scrape error:', err);
  }
}, { timezone: 'America/Sao_Paulo' });

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 PeçaPC API running on http://localhost:${PORT}`);
  console.log(`   Daily scrape: 06:00 BRT (cron active)`);
  console.log(`   DB: ${process.env.DB_PATH ?? './data/pecapc.db'}`);
  console.log(`   Admin key: ${API_KEY ? '✓ set' : '⚠ not set (admin routes open)'}\n`);
});

export default app;
