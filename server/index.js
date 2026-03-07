const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pecapc-secret-123';

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalido' });
    req.user = user;
    next();
  });
};

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'PecaPC Brasil', cached: partCache.lastUpdate }));

// Cache para armazenar partes e evitar scraping constante
let partCache = { data: [], lastUpdate: null, categories: {} };

// Scraping functions para cada loja
async function scrapeAmazon(query, category) {
  try {
    const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const results = [];
    
    $('[data-component-type="s-search-result"]').slice(0, 5).each((_, el) => {
      const name = $(el).find('h2 a span').text().trim();
      const priceText = $(el).find('.a-price-whole').text().trim();
      const price = parseInt(priceText?.replace(/[^\d]/g, '')) || 0;
      const link = $(el).find('h2 a').attr('href');
      
      if (name && price > 0) {
        results.push({ name, price, store: 'Amazon', url: `https://amazon.com.br${link}`, category });
      }
    });
    return results;
  } catch (e) { return []; }
}

async function scrapeKabum(query, category) {
  try {
    const url = `https://www.kabum.com.br/busca/${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const results = [];
    
    $('.product-item').slice(0, 5).each((_, el) => {
      const name = $(el).find('.product-name').text().trim();
      const priceText = $(el).find('.product-price').text().trim();
      const price = parseInt(priceText?.replace(/[^\d]/g, '')) || 0;
      const link = $(el).find('a').attr('href');
      
      if (name && price > 0) {
        results.push({ name, price, store: 'KaBuM!', url: `https://kabum.com.br${link}`, category });
      }
    });
    return results;
  } catch (e) { return []; }
}

async function scrapePichau(query, category) {
  try {
    const url = `https://www.pichau.com.br/search?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const results = [];
    
    $('.product-card').slice(0, 5).each((_, el) => {
      const name = $(el).find('.product-title').text().trim();
      const priceText = $(el).find('.product-price').text().trim();
      const price = parseInt(priceText?.replace(/[^\d]/g, '')) || 0;
      const link = $(el).find('a').attr('href');
      
      if (name && price > 0) {
        results.push({ name, price, store: 'Pichau', url: `https://pichau.com.br${link}`, category });
      }
    });
    return results;
  } catch (e) { return []; }
}

// Fallback hardcoded data if scraping fails
const FALLBACK_PARTS = [
  { id: 'cpu01', name: 'AMD Ryzen 5 7600X', category: 'cpu', specs: '6C/12T · 3.6-5.3GHz', price: 1289, store: 'KaBuM!', url: 'https://www.kabum.com.br' },
  { id: 'cpu02', name: 'Intel Core i5-13600K', category: 'cpu', specs: '14C/20T · LGA1700', price: 1349, store: 'Amazon', url: 'https://www.amazon.com.br' },
  { id: 'gpu01', name: 'NVIDIA RTX 4060 8GB', category: 'gpu', specs: '8GB GDDR6 · 115W', price: 1799, store: 'Pichau', url: 'https://www.pichau.com.br' },
  { id: 'gpu02', name: 'NVIDIA RTX 4070 Super', category: 'gpu', specs: '12GB GDDR6X · 220W', price: 3299, store: 'KaBuM!', url: 'https://www.kabum.com.br' },
  { id: 'ram01', name: 'Corsair Vengeance 32GB DDR5', category: 'ram', specs: '2x16GB DDR5-5600', price: 589, store: 'Amazon', url: 'https://www.amazon.com.br' },
  { id: 'ssd01', name: 'Samsung 990 Pro 2TB NVMe', category: 'storage', specs: 'PCIe 4.0 · 7100MB/s', price: 1899, store: 'Pichau', url: 'https://www.pichau.com.br' },
  { id: 'psu01', name: 'Corsair RM750x 750W Gold', category: 'psu', specs: '80+ Gold Modular', price: 599, store: 'KaBuM!', url: 'https://www.kabum.com.br' },
  { id: 'case01', name: 'NZXT H7 Flow ATX Mid', category: 'case', specs: 'Temperado Preto RGB', price: 699, store: 'Amazon', url: 'https://www.amazon.com.br' }
];

// Atualizar cache periodicamente (a cada 6 horas)
async function updatePartCache() {
  console.log('[PecaPC] Iniciando scraping de partes...');
  const queries = {
    cpu: ['Ryzen 7 7800X3D', 'Intel i9-14900K', 'Ryzen 5 7600X'],
    gpu: ['RTX 4090', 'RTX 4070 Super', 'RX 7900 XTX'],
    ram: ['DDR5 32GB', 'Corsair Vengeance', 'Kingston Fury'],
    storage: ['NVMe 2TB', 'Samsung 990 Pro', 'WD Black'],
    psu: ['750W Gold', 'Corsair RM750x', 'EVGA SuperNOVA'],
    mobo: ['B850 ATX', 'Z790 Chipset', 'AM5 DDR5'],
    case: ['ATX Mid Tower', 'NZXT H7', 'Corsair 5000T']
  };

  let scraped = [];
  for (const [category, terms] of Object.entries(queries)) {
    for (const term of terms) {
      try {
        const amazonResults = await scrapeAmazon(term, category);
        const kabumResults = await scrapeKabum(term, category);
        const pichauResults = await scrapePichau(term, category);
        scraped.push(...amazonResults, ...kabumResults, ...pichauResults);
      } catch (e) { console.error(`Erro ao scrape ${category}/${term}:`, e.message); }
    }
  }

  // Remover duplicatas e manter fallback
  const unique = new Map();
  [...scraped, ...FALLBACK_PARTS].forEach(p => {
    const key = p.name.toLowerCase();
    if (!unique.has(key)) unique.set(key, p);
  });

  partCache = { 
    data: Array.from(unique.values()), 
    lastUpdate: new Date().toISOString(),
    categories: Object.keys(queries)
  };
  console.log(`[PecaPC] Cache atualizado: ${partCache.data.length} partes`);
}

// Atualizar cache ao iniciar e a cada 6 horas
updatePartCache();
setInterval(updatePartCache, 6 * 60 * 60 * 1000);

// Endpoints de API
app.get('/api/parts', (req, res) => {
  const { category, limit = 20 } = req.query;
  let parts = partCache.data;
  if (category && category !== 'all') parts = parts.filter(p => p.category === category);
  res.json({ parts: parts.slice(0, limit), total: parts.length, lastUpdate: partCache.lastUpdate });
});

app.get('/api/parts/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query required' });
  
  const results = partCache.data.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  res.json({ results, query: q, count: results.length });
});

app.get('/api/categories', (req, res) => {
  res.json({ categories: partCache.categories, total: partCache.categories.length });
});

app.post('/api/sync-parts', async (req, res) => {
  const apiKey = req.header('X-API-Key');
  if (apiKey !== process.env.ADMIN_KEY) return res.status(403).json({ error: 'Unauthorized' });
  
  await updatePartCache();
  res.json({ status: 'Partes sincronizadas', count: partCache.data.length, lastUpdate: partCache.lastUpdate });
});

app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatorios' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ id: 1, email, username }, JWT_SECRET);
    res.status(201).json({ token, user: { email, username } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatorios' });
  try {
    const token = jwt.sign({ id: 1, email }, JWT_SECRET);
    res.json({ token, user: { email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

app.listen(PORT, () => console.log('PecaPC rodando em http://localhost:' + PORT));
