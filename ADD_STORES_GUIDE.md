# 🏪 Guia: Adicionar Novas Lojas ao Scraper

Este arquivo mostra como estender o web scraper para incluir mais lojas brasileiras.

## Lojas Já Implementadas

- ✅ Amazon.com.br
- ✅ KaBuM!
- ✅ Pichau
- (Fallback hardcoded: sempre funciona)

## Lojas para Adicionar

- ⏳ Terabyte Shop
- ⏳ Americanas
- ⏳ Magazine Luiza
- ⏳ Shopee Brasil
- ⏳ Mercado Livre

---

## Template: Como Adicionar uma Loja

### 1. Abra `C:\pecapc\server\index.js`

### 2. Encontre a seção de funções de scraping:

```javascript
async function scrapeAmazon(query, category) { ... }
async function scrapeKabum(query, category) { ... }
async function scrapePichau(query, category) { ... }
```

### 3. Adicione nova função com base no template:

```javascript
async function scrapeTerabyte(query, category) {
  try {
    const url = `https://www.terabyteshop.com.br/busca?str=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { 
      timeout: 8000, 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
    });
    const $ = cheerio.load(data);
    const results = [];
    
    // ⚠️ IMPORTANTE: Inspecione o HTML da loja para encontrar seletores corretos!
    // Abra https://www.terabyteshop.com.br/busca?str=Ryzen no navegador
    // Aperte F12 (DevTools) → clique direito em um produto → "Inspect"
    // Procure padrões como: class="produto", div[data-price], etc
    
    $('.produto-item').slice(0, 5).each((_, el) => {
      const name = $(el).find('.product-name').text().trim();
      const priceText = $(el).find('.product-price').text().trim();
      const price = parseInt(priceText?.replace(/[^\d]/g, '')) || 0;
      const link = $(el).find('a').attr('href');
      
      if (name && price > 0) {
        results.push({ 
          name, 
          price, 
          store: 'Terabyte', 
          url: `https://terabyteshop.com.br${link}`, 
          category 
        });
      }
    });
    
    return results;
  } catch (e) { 
    console.error('Erro Terabyte:', e.message);
    return []; 
  }
}
```

### 4. Adicione a loja à função `updatePartCache()`

Encontre:
```javascript
async function updatePartCache() {
  const queries = {
    cpu: ['Ryzen 7 7800X3D', 'Intel i9-14900K', ...],
    // ...
  };

  let scraped = [];
  for (const [category, terms] of Object.entries(queries)) {
    for (const term of terms) {
      try {
        const amazonResults = await scrapeAmazon(term, category);
        const kabumResults = await scrapeKabum(term, category);
        const pichauResults = await scrapePichau(term, category);
        scraped.push(...amazonResults, ...kabumResults, ...pichauResults);
```

**Mude para:**
```javascript
      try {
        const amazonResults = await scrapeAmazon(term, category);
        const kabumResults = await scrapeKabum(term, category);
        const pichauResults = await scrapePichau(term, category);
        const terabyteResults = await scrapeTerabyte(term, category);  // ← ADICIONE
        scraped.push(...amazonResults, ...kabumResults, ...pichauResults, ...terabyteResults);  // ← ADICIONE
```

### 5. Teste localmente

```bash
cd C:\pecapc
npm start
```

Abra outro terminal:
```bash
curl http://localhost:5000/api/parts
```

Se ver produtos da Terabyte, funcionou! ✅

### 6. Deploy

```bash
git add .
git commit -m "Add Terabyte scraping"
git push origin main
```

Render fará redeploy automaticamente.

---

## 🔍 Como Encontrar Seletores CSS Corretos

### Passo 1: Abra a loja no navegador
```
https://www.terabyteshop.com.br/busca?str=Ryzen
```

### Passo 2: Pressione F12 para abrir DevTools

### Passo 3: Clique no ícone de seletor (parte superior esquerda)

### Passo 4: Clique em um produto na página

Você verá algo como:
```html
<div class="produto-item">
  <h3 class="produto-nome">AMD Ryzen 5 7600X</h3>
  <span class="preco">R$ 1.289,00</span>
  <a href="/produto/123-ryzen-5">Comprar</a>
</div>
```

### Passo 5: Use esses seletores no código

```javascript
$('.produto-item').each((_, el) => {
  const name = $(el).find('.produto-nome').text();  // ← correto!
  const price = $(el).find('.preco').text();        // ← correto!
  const link = $(el).find('a').attr('href');        // ← correto!
});
```

---

## 🛡️ Técnicas Anti-Bloqueio

Se suas requisições forem bloqueadas (erro 403), use estas técnicas:

### 1. Variar User-Agent
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0'
];
const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

const { data } = await axios.get(url, { 
  headers: { 'User-Agent': ua } 
});
```

### 2. Adicionar delays entre requisições
```javascript
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

for (const term of terms) {
  // ... scrape ...
  await sleep(1000 + Math.random() * 2000);  // 1-3 segundos de delay
}
```

### 3. Usar serviço de proxy (se necessário)
```javascript
const agent = new HttpProxyAgent('http://proxy:port');
const { data } = await axios.get(url, { httpAgent: agent });
```

### 4. Usar ScrapingBee ou similar (pago)
```javascript
const apiKey = 'sua-chave-scrapingbee';
const url = `https://api.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}`;
const { data } = await axios.get(url);
```

---

## Lista de Seletores por Loja (Comum)

### Amazon
```css
[data-component-type="s-search-result"]  /* Resultado */
h2 a span                                 /* Nome */
.a-price-whole                            /* Preço */
```

### KaBuM!
```css
.product-item                             /* Produto */
.product-name                             /* Nome */
.product-price                            /* Preço */
```

### Pichau
```css
.product-card                             /* Produto */
.product-title                            /* Nome */
.product-price                            /* Preço */
```

### Terabyte (exemplo a verificar)
```css
.produto-item                             /* Produto */
.product-name                             /* Nome */
[data-price]                              /* Preço */
```

---

## Alternativa: Usar API da Loja

Algumas lojas expõem uma API pública:

- **Mercado Livre**: https://developers.mercadolivre.com.br/
- **Amazon**: ProductAdvertising API (paga)
- **Shopee**: API pública (https://open.shopee.com/)

```javascript
// Exemplo com Mercado Livre API
async function searchMercadoLivre(query) {
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}`;
  const { data } = await axios.get(url);
  
  return data.results.slice(0, 5).map(item => ({
    name: item.title,
    price: item.price,
    store: 'Mercado Livre',
    url: item.permalink,
    category: 'mixed'
  }));
}
```

---

## Performance & Rate Limiting

**Recomendações:**
- Cache: 2-6 horas (evita rescraping frequente)
- Timeout: 5-10 segundos por requisição
- Limite de resultados: 5-10 por busca por loja
- Total de peças: 50-100 máximo em cache

**Motivo:** Lojas bloqueiam bots. Ser educado = ser sustentável.

---

## Monitoria

Para verificar se o scraping está funcionando:

```bash
# Retorna cache status e última atualização
curl https://api.url/api/health

# Força rescraping manual
curl -X POST https://api.url/api/sync-parts \
  -H "X-API-Key: sua-admin-key"

# Ver logs no Render/Railway
# Dashboard → Seu app → Logs
```

---

## Troubleshooting

| Problema | Solução |
|----------|--------|
| "Timeout" | Aumentar timeout: `timeout: 15000` |
| Seletor não acha nada | Verificar HTML com DevTools F12 |
| Preço = 0 | Regex pode estar errado: `replace(/[^\d]/g, '')` |
| HTTP 403 | Adicionar User-Agent ou delay |
| HTTP 429 | Rate limit atingido, adicionar delay |
| Erro: "Cannot find module" | Rodar `npm install axios cheerio` |

---

## Exemplo Completo Funcional

Veja `server/index.js` linhas 70-120 para exemplo completo de scraper.

---

**Last updated:** 07/03/2026
