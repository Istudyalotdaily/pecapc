# 🚀 QUICK START — API de Web Scraping PeçaPC

## O que foi feito

✅ Backend com scraping de peças em tempo real de:
  - Amazon.com.br
  - KaBuM!
  - Pichau
  - (Pronto para adicionar: Terabyte, Americanas, Magazine Luiza)

✅ Frontend atualizado para buscar dados da API (com fallback local)

✅ Cache inteligente (atualiza a cada 6 horas, com sincronização manual)

✅ 7 endpoints REST documentados

✅ Sistema de deploy automatizado

## Testar Localmente

### 1. Instalar dependências
```bash
cd C:\pecapc
npm install   # Já feito, mas execute se tiver errado
```

### 2. Iniciar servidor
```bash
npm start
```

Você verá:
```
[PecaPC] Iniciando scraping de partes...
[PecaPC] Cache atualizado: 8+ partes
PecaPC rodando em http://localhost:5000
```

### 3. Testar endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Listar todas as peças
curl http://localhost:5000/api/parts

# Filtrar por CPUs
curl http://localhost:5000/api/parts?category=cpu

# Buscar específica
curl http://localhost:5000/api/parts/search?q=Ryzen

# Listar categorias
curl http://localhost:5000/api/categories
```

### 4. Abrir frontend local
Abra o arquivo em `C:\Users\Coingnu\Downloads\pecapc-main\pecapc-main\index.html` no navegadooo

Altere a primeira linha do JavaScript para:
```javascript
const API_URL = 'http://localhost:5000';
```

Agora o site vai buscar peças da API em tempo real!

---

## Deploy em Produção (5 minutos)

### Opção 1: RENDER.COM ⭐ (Mais fácil)

**Passo 1:** Vá para https://render.com e faça login com GitHub

**Passo 2:** Clique em "New +" → "Web Service"

**Passo 3:** Selecione repositório `istudyalotdaily/pecapc`

**Passo 4:** Preencha:
```
Name: pecapc-api
Environment: Node
Region: São Paulo (Brazil - já tem!)
Instance Type: Free (500 hrs/mês)
Branch: main
Build Command: npm install
Start Command: npm start
```

**Passo 5:** Clique em "Advanced" e adicione variáveis:
```
PORT = 5000
NODE_ENV = production
JWT_SECRET = (gere algo aleatório, ex: xyz123abc456def789)
ADMIN_KEY = (gere algo aleatório)
```

**Passo 6:** Clique em "Create Web Service"

**Pronto!** Em 2-3 minutos seu serviço estará rodando

URL será algo como: `https://pecapc-api.onrender.com`

---

### Opção 2: RAILWAY.APP

**Passo 1:** Vá para https://railway.app

**Passo 2:** "Start a New Project" → "Deploy from GitHub"

**Passo 3:** Conecte o repositório `istudyalotdaily/pecapc`

**Passo 4:** Railway auto-detecta Node.js

**Passo 5:** Adicione variáveis de ambiente (Settings → Variables)

**Passo 6:** Deploy automático!

---

## Atualizar Frontend para Usar API em Produção

Edite `C:\Users\Coingnu\Downloads\pecapc-main\pecapc-main\index.html`

**Encontre:**
```javascript
const API_URL = 'http://localhost:5000';
```

**Mude para:**
```javascript
const API_URL = 'https://pecapc-api.onrender.com'; // ou seu URL do Railway
```

Faça commit e push:
```bash
git add .
git commit -m "Use production API for parts"
git push origin main
```

GitHub Pages vai atualizar automaticamente!

---

## Verificar se está funcionando

### No navegador
1. Vá para https://istudyalotdaily.github.io/pecapc/
2. Clique em "Peças" → a lista deve carregar com dados reais
3. Clique em uma peça → deve mostrar preço e loja

### Via API
```bash
curl https://pecapc-api.onrender.com/api/health
curl https://pecapc-api.onrender.com/api/parts?category=cpu
```

Se ver JSON, está funcionando! ✅

---

## Como Funciona o Scraping

1. **Ao iniciar:** Backend scrape Amazon, KaBuM!, Pichau
2. **Salva em cache:** em memória e em arquivo (próximo: Redis/BD)
3. **A cada 6 horas:** sincronização automática
4. **Manual:** POST `/api/sync-parts` com API Key
5. **Se falhar:** usa dados fallback hardcoded para nunca quebrar

Seladores web não gostam de scraping → pode levar tempo ou falhar.
Solução: adicionar proxy rotation (veja DEPLOYMENT_GUIDE.md)

---

## Próximas Melhorias

1. Adicionar mais lojas (Terabyte, Americanas, etc)
2. Cache em REDIS para performance
3. Notificações de queda de preço
4. Histórico de preços em gráfico
5. Integração com affiliate links
6. Cloudflare CDN

---

## Troubleshooting Rápido

### "API indisponível"
- Verifique se backend está rodando: `curl http://localhost:5000/api/health`
- Se localhost: execute `npm start` em C:\pecapc
- Se produção: cheque logs no Render/Railway

### Peças não atualizam
- Manual: `curl -X POST https://api.url/api/sync-parts -H "X-API-Key: sua_chave"`
- Automático: espere 6 horas

### CORS error no console
- Verifique que `app.use(cors())` está no server/index.js
- DEV: `const API_URL = 'http://localhost:5000'`
- PROD: `const API_URL = 'https://seu-api-url.com'`

---

## Suporte

Veja `DEPLOYMENT_GUIDE.md` para documentação completa dos endpoints

---

**Criado:** 07/03/2026  
**Atualizado:** 07/03/2026
