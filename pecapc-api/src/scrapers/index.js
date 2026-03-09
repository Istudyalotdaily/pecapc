// src/scrapers/index.js — orchestrates all store scrapers
// Each scraper receives a listing {store, url, product_id, product_name}
// and must return { price: number|null, inStock: boolean, url: string }

import { scrapePichau }   from './pichau.js';
import { scrapeKabum }    from './kabum.js';
import { scrapeAmazon }   from './amazon.js';
import { scrapeTerabyte } from './terabyte.js';
import { scrapeMicrogem } from './microgem.js';

export const SCRAPERS = {
  'Pichau':   scrapePichau,
  'KaBuM':    scrapeKabum,
  'Amazon':   scrapeAmazon,
  'Terabyte': scrapeTerabyte,
  'Microgem': scrapeMicrogem,
};

export async function scrapeListing(listing) {
  const fn = SCRAPERS[listing.store];
  if (!fn) return { price: null, inStock: false, url: listing.url };
  try {
    return await fn(listing);
  } catch (err) {
    console.error(`  ✗ [${listing.store}] ${listing.product_id}: ${err.message}`);
    return { price: null, inStock: false, url: listing.url };
  }
}
