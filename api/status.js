// Status da API
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://pvmzyufnadguypewkihw.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2bXp5dWZuYWRndXlwZXdraWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTM2MjMsImV4cCI6MjA3NjY2OTYyM30.1LRtg7lzlX71TI5uhc9NdzrIrEVJ9snGWOt69CGvDV4';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { count } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      status: 'online',
      database: 'supabase',
      usuarios: count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};