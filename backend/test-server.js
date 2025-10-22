// Teste simples do servidor
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3002;

// Usar variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL || 'https://pvmzyufnadguypewkihw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bXp5dWZuYWRndXlwZXdraWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTM2MjMsImV4cCI6MjA3NjY2OTYyM30.1LRtg7lzlX71TI5uhc9NdzrIrEVJ9snGWOt69CGvDV4';

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

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

// Para Vercel
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`🗄️ Banco: Supabase`);
  });
}