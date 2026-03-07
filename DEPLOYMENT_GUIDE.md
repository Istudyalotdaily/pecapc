# Guia de Implantação — PeçaPC Web Scraper API

## Arquitetura

O sistema agora possui duas camadas:

1. **Frontend** (GitHub Pages - Estático)
   - `index.html` com interface de montagem de PC
   - Faz requisições para a API backend para obter dados de peças
   - Fallback local se API estiver indisponível

2. **Backend** (Node.js/Express - Dinâmico)
   - Scrape em tempo real de Amazon.com.br, KaBuM!, Pichau
   - Cache de peças atualizado a cada 6 horas
   - Endpoints REST para consultaas
   - Roda em um serviço em nuvem (Render, Railway, Fly.io, etc)

## Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta em um serviço de hosting gratuito (Render, Railway, Fly.io)

## Instalação Local

```bash
cd C:\pecapc
npm install
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=sua-chave-secreta-super-segura-aqui
ADMIN_KEY=sua-chave-api-admin-aqui
PGHOST=localhost
PGPORT=5432
PGDATABASE=pecapc
PGUSER=seu_usuario_pg
PGPASSWORD=sua_senha_pg
```

## Executar Localmente

```bash
npm start
```

O servidor estará disponível em `http://localhost:5000`

Testar API:
```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/parts
curl http://localhost:5000/api/parts?category=cpu
curl http://localhost:5000/api/parts/search?q=Ryzen
```

## Endpoints da API

### GET `/api/health`
Verifica se o servidor está online e quando foi a última atualização de cache

**Resposta:**
```json
{
  "status": "ok",
  "app": "PecaPC Brasil",
  "cached": "2026-03-07T15:30:45.123Z"
}
```

### GET `/api/parts`
Retorna todas as peças ou filtra por categoria

**Parâmetros Query:**
- `category` (optional): cpu, gpu, mobo, ram, storage, psu, case
- `limit` (optional, default: 20): número máximo de resultados

**Resposta:**
```json
{
  "parts": [
    {
      "id": "cpu01",
      "name": "AMD Ryzen 5 7600X",
      "category": "cpu",
      "specs": "6C/12T · 3.6-5.3GHz",
      "price": 1289,
      "store": "KaBuM!",
      "url": "https://kabum.com.br/..."
    }
  ],
  "total": 42,
  "lastUpdate": "2026-03-07T15:30:45.123Z"
}
```

### GET `/api/parts/search?q=termo`
Busca peças por nome

**Parâmetros:**
- `q` (required): termo de busca

**Resposta:**
```json
{
  "results": [...],
  "query": "Ryzen",
  "count": 5
}
```

### GET `/api/categories`
Lista todas as categorias

**Resposta:**
```json
{
  "categories": ["cpu", "gpu", "mobo", "ram", "storage", "psu", "case"],
  "total": 7
}
```

### POST `/api/sync-parts`
Força sincronização imediata de peças (requer API Key)

**Headers:**
```
X-API-Key: <seu-ADMIN_KEY>
```

**Resposta:**
```json
{
  "status": "Partes sincronizadas",
  "count": 45,
  "lastUpdate": "2026-03-07T15:35:12.456Z"
}
```

## Implantação em Produção

### Opção 1: Render.com (Recomendado)

1. Crie conta em https://render.com
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub (istudyalotdaily/pecapc)
4. Preencha os dados:
   - **Name:** pecapc-api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

5. Clique em "Advanced"
6. Adicione variáveis de ambiente:
   - `PORT` → 5000
   - `JWT_SECRET` → gere algo seguro
   - `ADMIN_KEY` → gere algo seguro
   - `NODE_ENV` → production

7. Deploy!

URL do serviço será algo como: `https://pecapc-api.onrender.com`

### Opção 2: Railway.app

1. Vá para https://railway.app
2. Clique em "Start a New Project"
3. Selecione "Deploy from GitHub"
4. Conecte o repositório
5. Railway auto-detectará Node.js
6. Adicione variáveis de ambiente
7. Deploy!

### Opção 3: Fly.io

```bash
# Instale flyctl
# sudo apt-get install flyctl (Linux) ou brew install flyctl (Mac)

# Faça login
flyctl auth login

# Crie app
cd C:\pecapc
flyctl launch --name pecapc-api

# Deploy
flyctl deploy
```

## Configurar Frontend para usar API em Produção

No arquivo `index.html`, altere a linha:

```javascript
const API_URL = 'http://localhost:5000'; // ← Mude para:
const API_URL = 'https://pecapc-api.onrender.com'; // ou seu URL
```

Depois faça push para GitHub e o site será atualizado automaticamente.

## Monitoramento

### Ver logs do servidor (Render)
- Vá para seu serviço no Render
- Aba "Logs"

### Testar endpoint em produção
```bash
curl https://pecapc-api.onrender.com/api/health
```

### Sincronizar manualmente
```bash
curl -X POST https://pecapc-api.onrender.com/api/sync-parts \
  -H "X-API-Key: sua-chave-admin"
```

## Performance e Cache

- **Sincronização automática:** a cada 6 horas
- **TTL do cache:** 6 horas
- **Timeout de scrape:** 8 segundos por loja
- **Se scrape falhar:** usa dados fallback hardcoded

Para aumentar frequência, edite em `server/index.js`:

```javascript
// Mude de 6 horas para 2 horas
setInterval(updatePartCache, 2 * 60 * 60 * 1000);
```

## Troubleshooting

### "API indisponível, usando fallback local"
O backend pode estar:
- Offline no momento
- Tempo excedido de resposta (timeout)
- Erro CORS (verifique que `cors()` está ativado)

Verifique em `/api/health`

### Peças antigas/não atualizadas
- Manual: POST `/api/sync-parts` com API Key
- Automático: espere 6 horas ou reinicie o servidor

### Erro 429 (Rate Limited)
As lojas bloquearam muitas requisições. Solução:
- Aumente delay entre requests
- Adicione User-Agent rotation
- Use serviço de proxy/scraping (ScrapingBee, etc)

### Erro 403 no Frontend
CORS pode estar bloqueado. Verifique:
```javascript
app.use(cors()); // Deve estar no server/index.js
```

## Próximos Passos

1. ✅ Scraping de Amazon, KaBuM!, Pichau
2. 🔄 Adicionar mais lojas (Terabyte, Americanas, Magazine Luiza)
3. 🔄 Implementar proxy rotation para evitar bloqueios
4. 🔄 Adicionar cache em Redis
5. 🔄 Alertas de preço (usuários recebem email quando preço cai)
6. 🔄 Histórico de preços em gráfico
7. 🔄 Integração com Affiliate links (Lomadee, Amazon Associates)
8. 🔄 Cloudflare para CDN/cache global

---

**Última atualização:** 07/03/2026
