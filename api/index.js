// Servidor para Vercel - Serverless
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://pvmzyufnadguypewkihw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bXp5dWZuYWRndXlwZXdraWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTM2MjMsImV4cCI6MjA3NjY2OTYyM30.1LRtg7lzlX71TI5uhc9NdzrIrEVJ9snGWOt69CGvDV4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'ternos_supabase_2024', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// ROTAS
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    database: 'supabase'
  });
});

app.get('/api/status', async (req, res) => {
  try {
    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      status: 'online',
      database: 'supabase',
      usuarios: count || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', usuario)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    const validPassword = await bcrypt.compare(senha, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    const token = jwt.sign(
      { id: user.id, nome: user.nome, tipo: user.tipo },
      process.env.JWT_SECRET || 'ternos_supabase_2024',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        tipo: user.tipo
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TERNOS
app.get('/api/ternos', authenticateToken, async (req, res) => {
  try {
    const { data: ternos, error } = await supabase
      .from('ternos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(ternos || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Para Vercel Serverless
module.exports = app;