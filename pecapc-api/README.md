# PeçaPC Price Scraper API

Backend service that scrapes Brazilian PC component prices daily from KaBuM, Pichau, Amazon BR, Terabyte, and Microgem — stores them in SQLite — and serves them via a JSON REST API consumed by pecapc.com.br.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Database**: SQLite via `better-sqlite3`
- **Scheduler**: `node-cron` (daily at 06:00 BRT)
- **Scraping**: `node-fetch` + `cheerio`

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work out of the box)

# 3. Seed the product catalog + known prices
npm run seed

# 4. Start the API server (includes cron)
npm start

# 5. Run a scrape manually (optional — cron runs daily at 06:00 BRT)
npm run scrape
```

The API will be available at **http://localhost:3001**.

---

## API Reference

### `GET /api/products`
Full catalog with current lowest price per product.

```json
{
  "ok": true,
  "count": 62,
  "data": [
    {
      "id": "cpu_9800x3d",
      "category": "cpu",
      "name": "AMD Ryzen 7 9800X3D",
      "specs": "8C/16T · AM5 · 5.2GHz · 3D V-Cache · 120W",
      "price": 2599,
      "listings": [
        { "store": "Pichau",  "price": 2599, "url": "https://...", "inStock": true, "scrapedAt": "2026-03-08T09:00:00" },
        { "store": "Amazon",  "price": 2699, "url": "https://...", "inStock": true, "scrapedAt": "2026-03-08T09:00:00" },
        { "store": "KaBuM",   "price": 3699, "url": "https://...", "inStock": true, "scrapedAt": "2026-03-08T09:00:00" }
      ]
    }
  ]
}
```

**Query params:**
- `?category=cpu` — filter by category: `cpu | gpu | ram | storage | mobo | psu | case | cooler`

---

### `GET /api/products/:id`
Single product with price history per store.

```
GET /api/products/cpu_9800x3d
```

---

### `GET /api/products/:id/history`
Price history (last 90 entries per store).

```
GET /api/products/cpu_9800x3d/history?store=Pichau
```

---

### `GET /api/categories`
Category overview with product count + price range.

---

### `GET /api/deals`
Products with the biggest price drops in the last 7 days.

---

### `POST /api/scrape/trigger`  *(admin)*
Manually trigger a full scrape run.

```bash
curl -X POST http://localhost:3001/api/scrape/trigger \
  -H "x-api-key: your-secret-key"
```

---

### `GET /api/scrape/logs`  *(admin)*
Recent scrape audit log (last 10 runs).

---

### `GET /health`
Health check + last scrape timestamp.

---

## Integrating with pecapc.com.br frontend

Add this to your `index.html` before the `</body>` tag to load live prices from the API:

```html
<script>
const API = 'https://api.pecapc.com.br'; // change to your deployed URL

async function loadLivePrices() {
  try {
    const res = await fetch(`${API}/api/products`);
    const { data } = await res.json();
    // Merge live prices into the existing DB object
    for (const product of data) {
      const cat = DB[product.category];
      if (!cat) continue;
      const existing = cat.find(p => p.id === product.id);
      if (existing && product.listings?.length) {
        existing.listings = product.listings;
        existing.price    = product.price ?? existing.price;
      }
    }
    // Re-render whatever is visible
    filterCatalog?.();
    renderBuild?.();
    console.log(`✅ Loaded live prices for ${data.length} products`);
  } catch (err) {
    console.warn('Could not load live prices, using built-in data:', err.message);
  }
}

loadLivePrices();
</script>
```

---

## Deployment (VPS / Railway / Render)

### VPS with PM2
```bash
npm install -g pm2
pm2 start npm --name pecapc-api -- start
pm2 save
pm2 startup
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run seed
EXPOSE 3001
CMD ["node", "src/server.js"]
```

### Railway / Render
1. Push this folder to a GitHub repo
2. Connect to Railway or Render
3. Set environment variables from `.env.example`
4. The `npm start` command starts everything

### Fly.io (recommended — free tier works)
```bash
fly launch
fly deploy
```

---

## Adding a new product / store

**1. Add the product to `src/seed.js`** in the CATALOG array:
```js
{ id:'gpu_rx9080',  category:'gpu', name:'AMD Radeon RX 9080 16GB', ...
  listings:[
    { store:'Pichau', price:5999, url:'https://www.pichau.com.br/...' },
  ]},
```

**2. Re-run seed:**
```bash
npm run seed
```

**3. Add a new store scraper** in `src/scrapers/`:
```js
// src/scrapers/mystore.js
export async function scrapeMyStore({ url }) {
  const html = await fetchPage(url);
  // ... parse price
  return { price, inStock, url };
}
```
Then register it in `src/scrapers/index.js`:
```js
import { scrapeMyStore } from './mystore.js';
export const SCRAPERS = { ..., 'MyStore': scrapeMyStore };
```

---

## Scraper notes

Each store uses a multi-strategy approach:

| Store    | Primary strategy        | Fallback            |
|----------|------------------------|---------------------|
| Pichau   | `__NEXT_DATA__` JSON   | HTML price selectors |
| KaBuM    | `__NEXT_DATA__` JSON   | HTML selectors      |
| Amazon   | JSON-LD structured data| `.a-price` selectors |
| Terabyte | `og:price` meta tag    | `.preco-avista`     |
| Microgem | `og:price` meta tag    | HTML selectors      |

Amazon is the most fragile due to CAPTCHA. If Amazon consistently fails, consider a proxy service (ScraperAPI, Bright Data, etc.) — add the proxy URL to `.env` as `HTTP_PROXY`.

---

## Database schema

```
products       — master catalog (id, name, specs, category, etc.)
listings       — current price per product × store (upserted each scrape)
price_history  — every price change ever recorded
scrape_log     — audit log of each scrape run
```
