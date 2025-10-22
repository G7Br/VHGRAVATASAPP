const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { supabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

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

// LISTAR TERNOS
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

// CRIAR TERNO
app.post('/api/ternos', authenticateToken, async (req, res) => {
  try {
    const { codigo, cliente, tipoServico, prazoEntrega, observacoes, funcionarioResponsavel } = req.body;
    
    const funcionarioAtual = req.user.tipo === 'admin' ? funcionarioResponsavel : req.user.nome;
    
    const { data: terno, error } = await supabase
      .from('ternos')
      .insert({
        codigo,
        cliente,
        tipo_servico: tipoServico,
        prazo_entrega: prazoEntrega,
        observacoes,
        etapa_atual: 'Chegada do pedido',
        funcionario_atual: funcionarioAtual,
        status: 'no-prazo'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Criar sub-etapas
    let subEtapas = [];
    switch(tipoServico) {
      case 'Fabricação':
      case 'Produção':
        subEtapas = ['Corte', 'Costura Calça', 'Costura Paletó', 'Caseado', 'Travete', 'Acabamento', 'Finalização'];
        break;
      case 'Ajuste':
        subEtapas = ['Medição', 'Ajuste Calça', 'Ajuste Paletó'];
        break;
      case 'Reajuste':
        subEtapas = ['Reajuste'];
        break;
      default:
        subEtapas = ['Corte', 'Costura Calça', 'Costura Paletó', 'Caseado', 'Travete', 'Acabamento', 'Finalização'];
    }
    
    if (subEtapas.length > 0) {
      const subEtapasData = subEtapas.map(subEtapa => ({
        terno_id: terno.id,
        sub_etapa: subEtapa,
        status: 'pendente'
      }));
      
      await supabase.from('sub_etapas').insert(subEtapasData);
    }
    
    res.status(201).json(terno);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LISTAR SUB-ETAPAS
app.get('/api/ternos/:id/sub-etapas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: subEtapas, error } = await supabase
      .from('sub_etapas')
      .select('*')
      .eq('terno_id', id)
      .order('created_at');
    
    if (error) throw error;
    res.json(subEtapas || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ATUALIZAR SUB-ETAPA
app.put('/api/sub-etapas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes, foto } = req.body;
    
    const updateData = {
      status,
      observacoes: observacoes || '',
      foto: foto || '',
      funcionario: req.user.nome
    };
    
    if (status === 'finalizada') {
      updateData.data_finalizacao = new Date().toISOString();
    }
    
    const { data: subEtapa, error } = await supabase
      .from('sub_etapas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    res.json(subEtapa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FINALIZAR TERNO
app.put('/api/ternos/:id/finalizar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    // Atualizar terno
    const { data: terno, error: ternoError } = await supabase
      .from('ternos')
      .update({
        etapa_atual: 'Finalizado',
        funcionario_atual: req.user.nome,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (ternoError) throw ternoError;
    
    // Adicionar ao histórico
    await supabase.from('historico_etapas').insert({
      terno_id: id,
      etapa: 'Finalizado',
      funcionario: req.user.nome,
      observacoes: observacoes || 'Terno finalizado'
    });
    
    // Adicionar aos pedidos finalizados
    await supabase.from('pedidos_finalizados').insert({
      codigo_pedido: terno.codigo,
      nome_cliente: terno.cliente,
      nome_alfaiate: req.user.nome,
      observacoes_alfaiate: observacoes || '',
      foto_finalizado: '',
      terno_id: id
    });
    
    res.json({ 
      success: true, 
      message: 'Terno finalizado com sucesso',
      terno: {
        id: terno.id,
        codigo: terno.codigo,
        cliente: terno.cliente
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LISTAR FUNCIONÁRIOS
app.get('/api/funcionarios', authenticateToken, async (req, res) => {
  try {
    const { data: funcionarios, error } = await supabase
      .from('usuarios')
      .select('id, username, nome, tipo, data_nascimento, sexo, funcao, data_admissao, foto')
      .order('nome');
    
    if (error) throw error;
    res.json(funcionarios || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RELATÓRIOS
app.get('/api/relatorios', authenticateToken, async (req, res) => {
  try {
    // Estatísticas gerais
    const { count: totalTernos } = await supabase
      .from('ternos')
      .select('*', { count: 'exact', head: true });
    
    const { count: ternosAtivos } = await supabase
      .from('ternos')
      .select('*', { count: 'exact', head: true })
      .neq('etapa_atual', 'Finalizado');
    
    const { count: ternosFinalizados } = await supabase
      .from('ternos')
      .select('*', { count: 'exact', head: true })
      .eq('etapa_atual', 'Finalizado');
    
    const { count: ternosAtrasados } = await supabase
      .from('ternos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'atrasado');
    
    res.json({
      estatisticas: {
        total_ternos: totalTernos || 0,
        ternos_ativos: ternosAtivos || 0,
        ternos_finalizados: ternosFinalizados || 0,
        ternos_atrasados: ternosAtrasados || 0
      },
      producaoPorDia: [],
      etapas: [],
      funcionarios: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TERNOS FINALIZADOS
app.get('/api/ternos-finalizados', authenticateToken, async (req, res) => {
  try {
    const { data: ternos, error } = await supabase
      .from('ternos')
      .select(`
        *,
        pedidos_finalizados!inner(data_finalizacao, nome_alfaiate)
      `)
      .eq('etapa_atual', 'Finalizado')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    res.json(ternos || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PEDIDOS FINALIZADOS
app.get('/api/pedidos-finalizados', authenticateToken, async (req, res) => {
  try {
    const { data: pedidos, error } = await supabase
      .from('pedidos_finalizados')
      .select(`
        *,
        ternos!inner(tipo_servico, prazo_entrega)
      `)
      .order('data_finalizacao', { ascending: false });
    
    if (error) throw error;
    res.json(pedidos || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOTIFICAÇÕES ADMIN
app.get('/api/admin/notificacoes', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { data: notificacoes, error } = await supabase
      .from('notificacoes_admin')
      .select('*')
      .order('data', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json(notificacoes || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LIMPAR NOTIFICAÇÕES
app.delete('/api/admin/notificacoes/clear', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { error } = await supabase
      .from('notificacoes_admin')
      .delete()
      .neq('id', 0); // Delete all
    
    if (error) throw error;
    res.json({ message: 'Notificações limpas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// STATUS DO SISTEMA
app.get('/api/status', async (req, res) => {
  try {
    const { count: totalTernos } = await supabase
      .from('ternos')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalNotificacoes } = await supabase
      .from('notificacoes_admin')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      total_ternos: totalTernos || 0,
      total_notificacoes: totalNotificacoes || 0,
      status: 'online',
      database: 'supabase'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API funcionando!', 
    timestamp: new Date().toISOString(),
    database: 'supabase'
  });
});

// Para Vercel
if (process.env.NODE_ENV === 'production') {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`🗄️ Banco: Supabase`);
  });
}