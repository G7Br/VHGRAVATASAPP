// Rota de teste simples
module.exports = (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    database: 'supabase',
    method: req.method,
    url: req.url
  });
};