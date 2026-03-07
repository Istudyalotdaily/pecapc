const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'pecapc-secret-change-in-production';

// ─── AUTH MIDDLEWARE ───────────────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// ─── HEALTH ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'PeçaPC Brasil' }));

// ─── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // TODO: replace with real DB call
    // const result = await pool.query(
    //   'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
    //   [email, username, hashedPassword]
    // );
    const token = jwt.sign({ id: 1, email, username }, JWT_SECRET);
    res.status(201).json({ token, user: { email, username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  try {
    // TODO: replace with real DB call
    // const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    // const user = result.rows[0];
    // const valid = await bcrypt.compare(password, user.password_hash);
    const token = jwt.sign({ id: 1, email }, JWT_SECRET);
    res.json({ token, user: { email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ─── PARTS ─────────────────────────────────────────────────────────────────────
app.get('/api/parts', async (req, res) => {
  const { category, search, sort } = req.query;
  try {
    // TODO: replace with real DB query with filters
    // let query = 'SELECT * FROM parts WHERE 1=1';
    // if (category) query += ` AND category = $1`;
    // if (search)   query += ` AND name ILIKE '%${search}%'`;
    res.json({ parts: [], message: 'Connect to DB for real data' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar peças' });
  }
});

app.get('/api/parts/:id', async (req, res) => {
  try {
    // const result = await pool.query('SELECT * FROM parts WHERE id = $1', [req.params.id]);
    res.json({ part: null });
  } catch (err) {
    res.status(500).json({ error: 'Peça não encontrada' });
  }
});

app.post('/api/parts', async (req, res) => {
  const { name, category, brand, model, specifications, price_brl, stores } = req.body;
  try {
    // const result = await pool.query(
    //   'INSERT INTO parts (name, category, brand, model, specifications, price_brl, stores) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    //   [name, category, brand, model, JSON.stringify(specifications), price_brl, JSON.stringify(stores)]
    // );
    res.status(201).json({ message: 'Peça adicionada' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao adicionar peça' });
  }
});

// ─── BUILDS ────────────────────────────────────────────────────────────────────
app.get('/api/builds', async (req, res) => {
  const { public: isPublic, user_id } = req.query;
  try {
    // const result = await pool.query('SELECT b.*, u.username FROM builds b JOIN users u ON b.user_id = u.id WHERE b.public = true ORDER BY b.likes DESC');
    res.json({ builds: [] });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar builds' });
  }
});

app.get('/api/builds/:id', async (req, res) => {
  try {
    // const build = await pool.query('SELECT * FROM builds WHERE id = $1', [req.params.id]);
    // const parts = await pool.query('SELECT p.* FROM parts p JOIN build_parts bp ON p.id = bp.part_id WHERE bp.build_id = $1', [req.params.id]);
    res.json({ build: null, parts: [] });
  } catch (err) {
    res.status(500).json({ error: 'Build não encontrada' });
  }
});

app.post('/api/builds', authenticateToken, async (req, res) => {
  const { name, parts, total_price, public: isPublic, description } = req.body;
  if (!name || !parts?.length) return res.status(400).json({ error: 'Nome e peças são obrigatórios' });
  try {
    // const buildResult = await pool.query(
    //   'INSERT INTO builds (user_id, name, total_price, public, description) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    //   [req.user.id, name, total_price, isPublic || false, description]
    // );
    // const buildId = buildResult.rows[0].id;
    // for (const partId of parts) {
    //   await pool.query('INSERT INTO build_parts (build_id, part_id) VALUES ($1, $2)', [buildId, partId]);
    // }
    res.status(201).json({ id: 999, message: 'Build criada!' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar build' });
  }
});

app.patch('/api/builds/:id/like', authenticateToken, async (req, res) => {
  try {
    // await pool.query('UPDATE builds SET likes = likes + 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Like adicionado' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao curtir build' });
  }
});

// ─── COMPATIBILITY CHECK ───────────────────────────────────────────────────────
app.post('/api/compatibility', async (req, res) => {
  const { parts } = req.body; // array of part IDs
  const issues = [];
  const warnings = [];

  // TODO: fetch parts from DB and run real compat checks
  // For now return mock checks
  if (parts.cpu && parts.mobo) {
    issues.push({ type: 'info', message: 'Verificar compatibilidade de socket CPU/Placa-mãe' });
  }

  res.json({ compatible: issues.length === 0, issues, warnings });
});

// ─── PRICE TRACKER ────────────────────────────────────────────────────────────
app.get('/api/prices/:partId', async (req, res) => {
  // TODO: scrape/integrate with KaBuM!, Pichau, TerabyteShop APIs
  res.json({
    part_id: req.params.partId,
    prices: [
      { store: 'KaBuM!', price: 0, url: 'https://kabum.com.br', in_stock: true },
      { store: 'Pichau', price: 0, url: 'https://pichau.com.br', in_stock: true },
      { store: 'TerabyteShop', price: 0, url: 'https://terabyteshop.com.br', in_stock: false },
    ],
    lowest_price: 0,
    updated_at: new Date().toISOString(),
  });
});

// ─── SERVE FRONTEND ───────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.use(express.static(path.join(__dirname, '..', 'client')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'index.html')));
}

app.listen(PORT, () => console.log(`🖥️  PeçaPC API rodando na porta ${PORT}`));
