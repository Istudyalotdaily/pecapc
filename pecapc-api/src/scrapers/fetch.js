// src/scrapers/fetch.js — shared HTTP utility
import fetch from 'node-fetch';

// Rotate user agents to reduce bot detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

let uaIndex = 0;
function nextUA() {
  return USER_AGENTS[uaIndex++ % USER_AGENTS.length];
}

// Simple per-domain rate limiter (min delay between requests)
const lastRequest = {};
const DOMAIN_DELAY_MS = {
  'pichau.com.br':      1500,
  'kabum.com.br':       2000,
  'amazon.com.br':      3000,
  'terabyteshop.com.br':1500,
  'microgem.com.br':    1000,
};

async function rateLimit(url) {
  const domain = new URL(url).hostname.replace('www.', '');
  const delay  = DOMAIN_DELAY_MS[domain] ?? 1000;
  const last   = lastRequest[domain] ?? 0;
  const wait   = delay - (Date.now() - last);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest[domain] = Date.now();
}

/**
 * fetchPage(url, options)
 * Fetches a URL with browser-like headers. Retries up to `retries` times.
 * Returns the response text (HTML) or throws.
 */
export async function fetchPage(url, { retries = 3, timeout = 15000 } = {}) {
  await rateLimit(url);

  const headers = {
    'User-Agent': nextUA(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
    'Referer': 'https://www.google.com/',
  };

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — back off exponentially
        const wait = attempt * 5000;
        console.warn(`  ⚠ 429 on ${url}, waiting ${wait}ms`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }
  throw lastErr;
}

/**
 * parsePrice(text) — extract a BRL price from any string
 * Handles: "R$ 2.599,99", "2599.99", "R$2.599", "2,599.00" etc.
 */
export function parsePrice(text) {
  if (!text) return null;
  const s = String(text).trim();
  // Brazilian format: 2.599,99 or 2599,99
  const m = s.match(/[\d.]+,\d{2}/);
  if (m) {
    const n = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? null : n;
  }
  // US format: 2599.99
  const m2 = s.match(/\d+\.\d{2}/);
  if (m2) {
    const n = parseFloat(m2[0]);
    return isNaN(n) ? null : n;
  }
  // Plain integer
  const m3 = s.match(/\d+/);
  if (m3) {
    const n = parseInt(m3[0]);
    return isNaN(n) ? null : n;
  }
  return null;
}
