// src/scrapers/pichau.js
import * as cheerio from 'cheerio';
import { fetchPage, parsePrice } from './fetch.js';

export async function scrapePichau({ url }) {
  const html = await fetchPage(url);
  const $    = cheerio.load(html);

  // Pichau renders prices client-side via Next.js hydration.
  // The __NEXT_DATA__ script tag contains the full product JSON.
  let price   = null;
  let inStock = false;

  // Strategy 1: parse __NEXT_DATA__ JSON
  const nextData = $('script#__NEXT_DATA__').text();
  if (nextData) {
    try {
      const json = JSON.parse(nextData);
      // Navigate to product data — path varies by page type
      const pageProps = json?.props?.pageProps;
      const product   = pageProps?.product ?? pageProps?.data?.product;

      if (product) {
        // price_final_formatted or special_price
        const rawPrice =
          product.price_final   ??
          product.special_price ??
          product.price         ??
          product.min_price;

        price   = rawPrice ? parseFloat(rawPrice) : null;
        inStock = product.is_in_stock ?? product.stock_status === 'IN_STOCK';
      }
    } catch (_) { /* fall through to HTML strategy */ }
  }

  // Strategy 2: visible HTML price elements
  if (!price) {
    const candidates = [
      $('[class*="price"] [class*="final"]').first().text(),
      $('[class*="Price"] [class*="final"]').first().text(),
      $('[class*="special-price"]').first().text(),
      $('[data-price-type="finalPrice"]').first().attr('data-price-amount'),
      // The "à vista" label
      $('p:contains("à vista")').next().text(),
      $('[class*="cash"], [class*="avista"]').first().text(),
    ];

    for (const c of candidates) {
      const p = parsePrice(c);
      if (p && p > 100 && p < 200000) { price = p; break; }
    }

    // Check stock
    inStock = !html.includes('Produto Esgotado') && !html.includes('Indisponível');
  }

  return { price, inStock, url };
}
