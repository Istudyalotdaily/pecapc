// src/scraper.js — run all scrapers sequentially, update DB
import db, { stmt, recordPrice } from './db.js';
import { scrapeListing } from './scrapers/index.js';

const CONCURRENCY = 2; // parallel requests per store batch

async function runScraperBatch(listings) {
  const results = [];
  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map(l => scrapeListing(l).then(r => ({ ...r, listing: l })))
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') results.push(s.value);
      else results.push({ price: null, inStock: false, listing: batch[0], error: s.reason });
    }
  }
  return results;
}

export async function runScrape({ verbose = true } = {}) {
  // Insert scrape log entry
  const logInsert = stmt.startScrapeLog.run();
  const logId = logInsert.lastInsertRowid;

  const startedAt = new Date();
  if (verbose) console.log(`\n🔍 PeçaPC scraper started — ${startedAt.toISOString()}`);

  // Get all listings from DB
  const listings = db.prepare(`
    SELECT l.product_id, l.store, l.url, p.name as product_name, p.category
    FROM listings l
    JOIN products p ON p.id = l.product_id
    ORDER BY p.category, l.store
  `).all();

  if (verbose) console.log(`  → ${listings.length} listings to scrape`);

  let updated = 0;
  let errors  = 0;

  // Group by store for polite rate-limiting
  const byStore = {};
  for (const l of listings) {
    (byStore[l.store] ??= []).push(l);
  }

  for (const [store, storeListing] of Object.entries(byStore)) {
    if (verbose) console.log(`\n  🏪 ${store} (${storeListing.length} products)`);

    const results = await runScraperBatch(storeListing);

    for (const r of results) {
      const l = r.listing;
      if (r.error) {
        errors++;
        if (verbose) console.error(`    ✗ ${l.product_id}: ${r.error.message}`);
        continue;
      }

      recordPrice(l.product_id, l.store, r.url, r.price, r.inStock);
      updated++;

      if (verbose) {
        const status = r.price
          ? `R$ ${r.price.toFixed(2)} ${r.inStock ? '✓' : '(sem estoque)'}`
          : '— sem preço';
        console.log(`    ${r.price ? '✅' : '⚠️ '} ${l.product_name.padEnd(45)} ${status}`);
      }
    }
  }

  // Finish log entry
  const duration = ((Date.now() - startedAt.getTime()) / 1000).toFixed(1);
  stmt.finishScrapeLog.run({
    id: logId,
    products_scraped: updated,
    errors,
    status: errors > updated ? 'error' : 'ok',
  });

  if (verbose) {
    console.log(`\n✅ Done in ${duration}s — ${updated} updated, ${errors} errors`);
  }

  return { updated, errors, duration };
}

// Run directly: node src/scraper.js
if (process.argv[1].endsWith('scraper.js')) {
  runScrape({ verbose: true })
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}
