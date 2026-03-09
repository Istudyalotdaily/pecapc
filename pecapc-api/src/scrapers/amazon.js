// src/scrapers/amazon.js
// Amazon is the hardest — aggressive bot detection, CloudFront, CAPTCHAs.
// Strategy: parse structured JSON-LD or window.ue_vars from page source.
// Falls back to og:price meta tag.
import * as cheerio from 'cheerio';
import { fetchPage, parsePrice } from './fetch.js';

export async function scrapeAmazon({ url }) {
  const html = await fetchPage(url, { retries: 3, timeout: 20000 });

  // If we hit a CAPTCHA / Robot check
  if (html.includes('Enter the characters you see below')
    || html.includes('api-services-support@amazon.com')
    || html.includes('Toutes nos excuses')) {
    console.warn('  ⚠ Amazon CAPTCHA detected');
    return { price: null, inStock: false, url };
  }

  const $ = cheerio.load(html);
  let price   = null;
  let inStock = false;

  // Strategy 1: JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    if (price) return;
    try {
      const data = JSON.parse($(el).html());
      const offers = data?.offers ?? data?.Offers;
      if (offers) {
        const offerArr = Array.isArray(offers) ? offers : [offers];
        for (const o of offerArr) {
          const p = parseFloat(o.price ?? o.lowPrice ?? 0);
          if (p > 100) { price = p; inStock = o.availability?.includes('InStock') ?? true; break; }
        }
      }
    } catch (_) {}
  });

  // Strategy 2: standard Amazon price selectors
  if (!price) {
    const selectors = [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-price .a-offscreen',
      '#price_inside_buybox',
      '#corePrice_feature_div .a-offscreen',
      '[data-asin] .a-price .a-offscreen',
    ];
    for (const sel of selectors) {
      const p = parsePrice($(sel).first().text());
      if (p && p > 100) { price = p; break; }
    }
  }

  // Strategy 3: og:price meta
  if (!price) {
    const ogPrice = $('meta[property="og:price:amount"]').attr('content');
    const p = parsePrice(ogPrice);
    if (p && p > 100) price = p;
  }

  // Stock check
  if (!inStock) {
    inStock = $('#availability .a-color-success').length > 0
      || html.includes('Em estoque')
      || html.includes('In Stock');
  }

  return { price, inStock, url };
}
