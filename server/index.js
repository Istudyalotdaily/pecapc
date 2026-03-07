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

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'PecaPC Brasil' }));

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

app.get('/api/parts', (req, res) => res.json({ parts: [] }));
app.get('/api/builds', (req, res) => res.json({ builds: [] }));

app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));

app.listen(PORT, () => console.log('PecaPC rodando em http://localhost:' + PORT));
