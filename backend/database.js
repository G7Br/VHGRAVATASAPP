const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Definida' : 'Não definida');
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funções helper para compatibilidade com SQLite
const dbGet = async (table, filters = {}) => {
  try {
    let query = supabase.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query.single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  } catch (error) {
    console.error(`Erro em dbGet (${table}):`, error);
    throw error;
  }
};

const dbAll = async (table, filters = {}, orderBy = null) => {
  try {
    let query = supabase.from(table).select('*');
    
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending || false });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Erro em dbAll (${table}):`, error);
    throw error;
  }
};

const dbInsert = async (table, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Erro em dbInsert (${table}):`, error);
    throw error;
  }
};

const dbUpdate = async (table, id, data) => {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`Erro em dbUpdate (${table}):`, error);
    throw error;
  }
};

const dbDelete = async (table, id) => {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`Erro em dbDelete (${table}):`, error);
    throw error;
  }
};

// Funções SQL customizadas
const dbQuery = async (query, params = []) => {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query_text: query,
      query_params: params
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro em dbQuery:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  dbGet,
  dbAll,
  dbInsert,
  dbUpdate,
  dbDelete,
  dbQuery
};