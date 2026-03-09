// src/scrapers/terabyte.js
import * as cheerio from 'cheerio';
import { fetchPage, parsePrice } from './fetch.js';

export async function scrapeTerabyte({ url }) {
  const html = await fetchPage(url);
  const $    = cheerio.load(html);
  let price   = null;
  let inStock = false;

  // Terabyte uses standard Magento-style selectors + meta tags
  const candidates = [
    $('meta[property="og:price:amount"]').attr('content'),
    $('[id*="preco"] .preco-avista').text(),
    $('[class*="preco-avista"]').first().text(),
    $('[class*="preco-por"]').first().text(),
    $('[itemprop="price"]').attr('content') ?? $('[itemprop="price"]').text(),
    $('[class*="precoPor"]').first().text(),
    $('[data-price]').first().attr('data-price'),
  ];

  for (const c of candidates) {
    const p = parsePrice(c);
    if (p && p > 100 && p < 200000) { price = p; break; }
  }

  inStock = !html.includes('Produto Esgotado')
    && !html.includes('Indisponível')
    && ($('[class*="btn-comprar"], [id*="btn-comprar"]').length > 0
     || html.includes('Adicionar ao Carrinho'));

  return { price, inStock, url };
}

// ── Microgem ───────────────────────────────────────────────────────────────
// src/scrapers/microgem.js (inlined here for brevity, also exported separately)
export async function scrapeMicrogem({ url }) {
  const html = await fetchPage(url);
  const $    = cheerio.load(html);
  let price   = null;
  let inStock = false;

  const candidates = [
    $('meta[property="og:price:amount"]').attr('content'),
    $('[class*="preco-avista"], [class*="price-avista"]').first().text(),
    $('[itemprop="price"]').attr('content'),
    $('[class*="price-final"]').first().text(),
    $('[class*="atual"], [class*="destaque"]').first().text(),
  ];

  for (const c of candidates) {
    const p = parsePrice(c);
    if (p && p > 100 && p < 200000) { price = p; break; }
  }

  inStock = !html.includes('Esgotado') && !html.includes('Indisponível');
  return { price, inStock, url };
}
