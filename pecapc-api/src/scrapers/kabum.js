// src/scrapers/kabum.js
import * as cheerio from 'cheerio';
import { fetchPage, parsePrice } from './fetch.js';

export async function scrapeKabum({ url }) {
  const html = await fetchPage(url);
  const $    = cheerio.load(html);

  let price   = null;
  let inStock = false;

  // KaBuM is a Next.js app — prices are in __NEXT_DATA__
  const nextData = $('script#__NEXT_DATA__').text();
  if (nextData) {
    try {
      const json      = JSON.parse(nextData);
      const pageProps = json?.props?.pageProps;

      // Product page: pageProps.product or pageProps.data
      const product = pageProps?.product
        ?? pageProps?.data?.product
        ?? pageProps?.initialData?.product;

      if (product) {
        // KaBuM stores the "à vista no PIX" price as vlrSemJuros or vlrDesconto
        price = product.vlrSemJuros
          ?? product.vlrDesconto
          ?? product.vlrAtual
          ?? product.price
          ?? product.specialPrice
          ?? null;

        if (price) price = parseFloat(price);

        inStock = (product.dsDisponibilidade ?? '').toLowerCase().includes('estoque')
          || product.inStock === true
          || product.availability === 'IN_STOCK';
      }
    } catch (_) { /* fall through */ }
  }

  // Strategy 2: HTML selectors (KaBuM renders some prices server-side)
  if (!price) {
    const selectors = [
      '[class*="priceMainValue"]',
      '[class*="finalPrice"]',
      '[class*="Price_price__"]',
      'h4.sc-d29f8e33',   // seen in some KaBuM builds
      '[data-testid="product-price"]',
    ];
    for (const sel of selectors) {
      const p = parsePrice($(sel).first().text());
      if (p && p > 100 && p < 200000) { price = p; break; }
    }

    inStock = !html.includes('Produto Esgotado')
      && !html.includes('Avise-me')
      && html.includes('Adicionar ao carrinho');
  }

  return { price, inStock, url };
}
