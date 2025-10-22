const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const puppeteer = require('puppeteer');
require('dotenv').config();

// Configurar SQLite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Inicializar banco se não existir
const initDatabase = () => {
  const schemaPath = path.join(__dirname, 'database.sqlite.sql');
  if (fs.existsSync(schemaPath) && !fs.existsSync(dbPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Erro ao criar banco:', err);
      } else {
        console.log('Banco SQLite criado com sucesso!');
      }
    });
  }
};

initDatabase();

// Configurar multer para upload de fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Aumentar limite para 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static('uploads')); // Servir arquivos estáticos

// Função helper para promisificar SQLite
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { usuario, senha } = req.body;
    
    const user = await dbGet('SELECT * FROM usuarios WHERE username = ?', [usuario]);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    const validPassword = await bcrypt.compare(senha, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }
    
    const token = jwt.sign(
      { id: user.id, nome: user.nome, tipo: user.tipo },
      process.env.JWT_SECRET || 'secret',
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

app.get('/api/ternos', authenticateToken, async (req, res) => {
  try {
    const ternos = await dbAll('SELECT * FROM ternos ORDER BY created_at DESC');
    res.json(ternos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ternos', authenticateToken, (req, res) => {
  const { codigo, cliente, tipoServico, prazoEntrega, observacoes, funcionarioResponsavel } = req.body;
  
  // Se for admin, usar funcionário selecionado; senão, usar o próprio usuário
  const funcionarioAtual = req.user.tipo === 'admin' ? funcionarioResponsavel : req.user.nome;
  
  db.run(`INSERT INTO ternos (codigo, cliente, tipo_servico, prazo_entrega, observacoes, etapa_atual, funcionario_atual, status)
           VALUES (?, ?, ?, ?, ?, 'Chegada do pedido', ?, 'no-prazo')`, 
    [codigo, cliente, tipoServico, prazoEntrega, observacoes, funcionarioAtual], function(err) {
      if (err) {
        console.error('Erro ao criar terno:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const ternoId = this.lastID;
      console.log(`Terno criado: ID ${ternoId}, Tipo: ${tipoServico}`);
      
      // Definir sub-etapas baseadas no tipo de serviço
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
          // Para tipos não reconhecidos, usar etapas básicas
          subEtapas = ['Corte', 'Costura Calça', 'Costura Paletó', 'Caseado', 'Travete', 'Acabamento', 'Finalização'];
      }
      
      console.log(`Criando ${subEtapas.length} sub-etapas para tipo: ${tipoServico}`);
      
      let created = 0;
      const totalSubEtapas = subEtapas.length;
      
      if (totalSubEtapas === 0) {
        // Se não há sub-etapas, retornar o terno imediatamente
        db.get('SELECT * FROM ternos WHERE id = ?', [ternoId], (err, terno) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json(terno);
        });
        return;
      }
      
      subEtapas.forEach(subEtapa => {
        db.run('INSERT INTO sub_etapas (terno_id, sub_etapa, status) VALUES (?, ?, ?)', 
          [ternoId, subEtapa, 'pendente'], (err) => {
            if (err) {
              console.error('Erro ao criar sub-etapa:', err);
            } else {
              created++;
              console.log(`Sub-etapa criada: ${subEtapa}`);
              
              if (created === totalSubEtapas) {
                console.log(`✅ ${created} sub-etapas criadas para terno ${ternoId}!`);
                
                // Retornar o terno após criar todas as sub-etapas
                db.get('SELECT * FROM ternos WHERE id = ?', [ternoId], (err, terno) => {
                  if (err) return res.status(500).json({ error: err.message });
                  res.status(201).json(terno);
                });
              }
            }
          });
      });
    });
});

// UPLOAD DE FOTOS
app.post('/api/upload', authenticateToken, (req, res) => {
  upload.single('foto')(req, res, (err) => {
    if (err) {
      console.error('Erro no upload:', err);
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma foto enviada' });
    }
    
    const fotoUrl = `http://localhost:3002/uploads/${req.file.filename}`;
    res.json({ url: fotoUrl });
  });
});

// UPLOAD DE FOTO PARA FUNCIONÁRIO
app.post('/api/admin/funcionarios/upload-foto', authenticateToken, (req, res) => {
  console.log('Upload request received');
  console.log('User type:', req.user.tipo);
  
  if (req.user.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  upload.single('foto')(req, res, (err) => {
    if (err) {
      console.error('Erro no upload:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Máximo 5MB' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ error: 'Nenhuma foto enviada' });
    }
    
    console.log('File uploaded:', req.file.filename);
    const fotoUrl = `http://localhost:3002/uploads/${req.file.filename}`;
    res.json({ url: fotoUrl });
  });
});

// ENDPOINTS PARA GERENCIAMENTO DE FUNCIONÁRIOS

// Criar funcionário (apenas admin)
app.post('/api/admin/funcionarios', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { username, password, nome, data_nascimento, sexo, funcao, data_admissao, foto } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await dbGet('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await dbRun(`
      INSERT INTO usuarios (username, password, nome, tipo, data_nascimento, sexo, funcao, data_admissao, foto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [username, hashedPassword, nome, funcao.toLowerCase(), data_nascimento, sexo, funcao, data_admissao, foto]);
    
    const newUser = await dbGet('SELECT id, username, nome, tipo, data_nascimento, sexo, funcao, data_admissao, foto FROM usuarios WHERE id = ?', [result.id]);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar funcionários
app.get('/api/funcionarios', authenticateToken, async (req, res) => {
  try {
    const funcionarios = await dbAll(`
      SELECT id, username, nome, tipo, data_nascimento, sexo, funcao, data_admissao, foto
      FROM usuarios 
      ORDER BY nome
    `);
    res.json(funcionarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obter funcionário específico
app.get('/api/funcionarios/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const funcionario = await dbGet(`
      SELECT id, username, nome, tipo, data_nascimento, sexo, funcao, data_admissao, foto
      FROM usuarios WHERE id = ?
    `, [id]);
    
    if (!funcionario) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }
    
    res.json(funcionario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar funcionário (apenas admin)
app.put('/api/admin/funcionarios/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { id } = req.params;
    const { nome, data_nascimento, sexo, funcao, data_admissao, foto } = req.body;
    
    await dbRun(`
      UPDATE usuarios 
      SET nome = ?, data_nascimento = ?, sexo = ?, funcao = ?, data_admissao = ?, foto = ?
      WHERE id = ?
    `, [nome, data_nascimento, sexo, funcao, data_admissao, foto, id]);
    
    const updatedUser = await dbGet('SELECT id, username, nome, tipo, data_nascimento, sexo, funcao, data_admissao, foto FROM usuarios WHERE id = ?', [id]);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deletar funcionário (apenas admin)
app.delete('/api/admin/funcionarios/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const { id } = req.params;
    
    // Não permitir deletar o próprio admin
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }
    
    const funcionario = await dbGet('SELECT nome FROM usuarios WHERE id = ?', [id]);
    if (!funcionario) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }
    
    await dbRun('DELETE FROM usuarios WHERE id = ?', [id]);
    
    res.json({ message: `Funcionário ${funcionario.nome} deletado com sucesso` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ENDPOINTS PARA SUBETAPAS

// Obter subetapas de um terno
app.get('/api/ternos/:id/sub-etapas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Buscando sub-etapas para terno ID: ${id}`);
    const subEtapas = await dbAll('SELECT * FROM sub_etapas WHERE terno_id = ? ORDER BY created_at', [id]);
    console.log(`Encontradas ${subEtapas.length} sub-etapas`);
    res.json(subEtapas);
  } catch (error) {
    console.error('Erro ao buscar sub-etapas:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar subetapa por ID
app.put('/api/sub-etapas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, observacoes, foto } = req.body;
    
    console.log(`\n🔄 ATUALIZAÇÃO SUB-ETAPA:`);
    console.log(`  ID: ${id}`);
    console.log(`  Status: ${status}`);
    console.log(`  Observações: ${observacoes}`);
    console.log(`  Foto: ${foto ? 'Sim' : 'Não'}`);
    console.log(`  Usuário: ${req.user.nome}`);
    
    // Verificar se a sub-etapa existe antes de atualizar
    const subEtapaExistente = await dbGet('SELECT * FROM sub_etapas WHERE id = ?', [id]);
    if (!subEtapaExistente) {
      console.log(`❌ Sub-etapa ID ${id} não encontrada`);
      return res.status(404).json({ error: 'Sub-etapa não encontrada' });
    }
    
    console.log(`  Sub-etapa encontrada: ${subEtapaExistente.sub_etapa}`);
    
    const result = await dbRun(`
      UPDATE sub_etapas 
      SET status = ?, observacoes = ?, foto = ?, funcionario = ?, data_finalizacao = CASE WHEN ? = 'finalizada' THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE id = ?
    `, [status, observacoes || '', foto || '', req.user.nome, status, id]);
    
    console.log(`  Linhas afetadas: ${result.changes}`);
    
    const subEtapa = await dbGet('SELECT * FROM sub_etapas WHERE id = ?', [id]);
    console.log(`✅ Sub-etapa atualizada com sucesso`);
    res.json(subEtapa);
  } catch (error) {
    console.error('❌ Erro ao atualizar sub-etapa:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar sub-etapa por nome (fallback)
app.put('/api/ternos/:id/sub-etapa', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { subEtapa, status, observacoes, foto } = req.body;
    
    console.log(`Atualizando sub-etapa por nome - Terno: ${id}, Sub-etapa: ${subEtapa}, Status: ${status}`);
    
    const result = await dbRun(`
      UPDATE sub_etapas 
      SET status = ?, observacoes = ?, foto = ?, funcionario = ?, data_finalizacao = CASE WHEN ? = 'finalizada' THEN CURRENT_TIMESTAMP ELSE NULL END
      WHERE terno_id = ? AND sub_etapa = ?
    `, [status || 'finalizada', observacoes || '', foto || '', req.user.nome, status || 'finalizada', id, subEtapa]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sub-etapa não encontrada' });
    }
    
    const subEtapaAtualizada = await dbGet('SELECT * FROM sub_etapas WHERE terno_id = ? AND sub_etapa = ?', [id, subEtapa]);
    res.json({ success: true, subEtapa: subEtapaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar sub-etapa por nome:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar subetapa
app.post('/api/ternos/:id/sub-etapas', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sub_etapa, observacoes } = req.body;
    
    const result = await dbRun(`
      INSERT INTO sub_etapas (terno_id, sub_etapa, status, observacoes, funcionario)
      VALUES (?, ?, 'pendente', ?, ?)
    `, [id, sub_etapa, observacoes, req.user.nome]);
    
    const subEtapa = await dbGet('SELECT * FROM sub_etapas WHERE id = ?', [result.id]);
    res.status(201).json(subEtapa);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Finalizar terno
app.put('/api/ternos/:id/finalizar', authenticateToken, async (req, res) => {
  console.log('📝 Rota /api/ternos/:id/finalizar chamada');
  try {
    const { id } = req.params;
    const { observacoes } = req.body;
    
    console.log(`\n🏁 FINALIZANDO TERNO:`);
    console.log(`  ID: ${id}`);
    console.log(`  Observações: ${observacoes}`);
    console.log(`  Usuário: ${req.user.nome}`);
    
    // Verificar se o terno existe
    const ternoExistente = await dbGet('SELECT * FROM ternos WHERE id = ?', [id]);
    if (!ternoExistente) {
      console.log(`❌ Terno ID ${id} não encontrado`);
      return res.status(404).json({ error: 'Terno não encontrado' });
    }
    
    console.log(`  Terno encontrado: ${ternoExistente.codigo} - ${ternoExistente.cliente}`);
    
    // Atualizar terno para finalizado
    const result = await dbRun(`
      UPDATE ternos 
      SET etapa_atual = 'Finalizado', funcionario_atual = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [req.user.nome, id]);
    
    console.log(`  Linhas afetadas na atualização: ${result.changes}`);
    
    // Adicionar ao histórico
    await dbRun(`
      INSERT INTO historico_etapas (terno_id, etapa, funcionario, observacoes)
      VALUES (?, 'Finalizado', ?, ?)
    `, [id, req.user.nome, observacoes || 'Terno finalizado']);
    
    console.log(`  Histórico adicionado`);
    
    // Adicionar aos pedidos finalizados
    await dbRun(`
      INSERT INTO pedidos_finalizados (codigo_pedido, nome_cliente, nome_alfaiate, observacoes_alfaiate, foto_finalizado, terno_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [ternoExistente.codigo, ternoExistente.cliente, req.user.nome, observacoes || '', '', id]);
    
    console.log(`  Pedido finalizado adicionado`);
    console.log(`✅ Terno finalizado com sucesso!`);
    
    res.json({ 
      success: true, 
      message: 'Terno finalizado com sucesso',
      terno: {
        id: ternoExistente.id,
        codigo: ternoExistente.codigo,
        cliente: ternoExistente.cliente
      }
    });
  } catch (error) {
    console.error('❌ Erro ao finalizar terno:', error);
    res.status(500).json({ error: error.message });
  }
});

// VERIFICAR STATUS DO BANCO
app.get('/api/status', async (req, res) => {
  try {
    const totalTernos = await dbGet('SELECT COUNT(*) as total FROM ternos');
    const totalNotificacoes = await dbGet('SELECT COUNT(*) as total FROM notificacoes_admin');
    
    // Verificar ternos sem sub-etapas
    const ternosSemSubEtapas = await dbAll(`
      SELECT COUNT(*) as total
      FROM ternos t 
      LEFT JOIN sub_etapas s ON t.id = s.terno_id 
      WHERE s.terno_id IS NULL
    `);
    
    res.json({ 
      total_ternos: totalTernos.total,
      total_notificacoes: totalNotificacoes.total,
      ternos_sem_sub_etapas: ternosSemSubEtapas[0].total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CORRIGIR TERNOS SEM SUB-ETAPAS
app.post('/api/admin/fix-sub-etapas', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Função para definir sub-etapas baseadas no tipo de serviço
    const getSubEtapasPorTipo = (tipoServico) => {
      switch(tipoServico) {
        case 'Fabricação':
        case 'Produção':
          return ['Corte', 'Costura Calça', 'Costura Paletó', 'Caseado', 'Travete', 'Acabamento', 'Finalização'];
        case 'Ajuste':
          return ['Medição', 'Ajuste Calça', 'Ajuste Paletó'];
        case 'Reajuste':
          return ['Reajuste'];
        case 'Paletó':
          return ['Corte', 'Costura Paletó', 'Caseado', 'Acabamento', 'Finalização'];
        case 'Calça':
          return ['Corte', 'Costura Calça', 'Travete', 'Acabamento', 'Finalização'];
        default:
          return ['Corte', 'Costura Calça', 'Costura Paletó', 'Caseado', 'Travete', 'Acabamento', 'Finalização'];
      }
    };
    
    // Buscar ternos sem sub-etapas
    const ternosSemSubEtapas = await dbAll(`
      SELECT t.id, t.codigo, t.cliente, t.tipo_servico 
      FROM ternos t 
      LEFT JOIN sub_etapas s ON t.id = s.terno_id 
      WHERE s.terno_id IS NULL
      ORDER BY t.id
    `);
    
    if (ternosSemSubEtapas.length === 0) {
      return res.json({ 
        message: 'Todos os ternos já possuem sub-etapas',
        ternos_corrigidos: 0,
        sub_etapas_criadas: 0
      });
    }
    
    let totalSubEtapasCriadas = 0;
    
    // Criar sub-etapas para cada terno
    for (const terno of ternosSemSubEtapas) {
      const subEtapas = getSubEtapasPorTipo(terno.tipo_servico);
      
      for (const subEtapa of subEtapas) {
        await dbRun('INSERT INTO sub_etapas (terno_id, sub_etapa, status) VALUES (?, ?, ?)', 
          [terno.id, subEtapa, 'pendente']);
        totalSubEtapasCriadas++;
      }
    }
    
    res.json({
      message: `Correção concluída com sucesso`,
      ternos_corrigidos: ternosSemSubEtapas.length,
      sub_etapas_criadas: totalSubEtapasCriadas
    });
    
  } catch (error) {
    console.error('Erro ao corrigir sub-etapas:', error);
    res.status(500).json({ error: error.message });
  }
});

// LIMPAR TODAS AS NOTIFICAÇÕES
app.delete('/api/admin/notificacoes/clear', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    await dbRun('DELETE FROM notificacoes_admin');
    res.json({ message: 'Notificações limpas com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// OBTER NOTIFICAÇÕES
app.get('/api/admin/notificacoes', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const notificacoes = await dbAll('SELECT * FROM notificacoes_admin ORDER BY data DESC LIMIT 50');
    res.json(notificacoes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TERNOS FINALIZADOS (PRÓXIMOS A ENTREGAR)
app.get('/api/ternos-finalizados', authenticateToken, async (req, res) => {
  try {
    const ternosFinalizados = await dbAll(`
      SELECT t.*, pf.data_finalizacao, pf.nome_alfaiate as funcionario_finalizador
      FROM ternos t
      LEFT JOIN pedidos_finalizados pf ON t.id = pf.terno_id
      WHERE t.etapa_atual = 'Finalizado'
      ORDER BY pf.data_finalizacao DESC
    `);
    
    res.json(ternosFinalizados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PEDIDOS FINALIZADOS COM FOTOS
app.get('/api/pedidos-finalizados', authenticateToken, async (req, res) => {
  try {
    const pedidosFinalizados = await dbAll(`
      SELECT 
        pf.*,
        t.tipo_servico,
        t.prazo_entrega,
        (
          SELECT se.foto 
          FROM sub_etapas se 
          WHERE se.terno_id = pf.terno_id 
          AND se.foto IS NOT NULL 
          AND se.foto != '' 
          ORDER BY se.data_finalizacao DESC 
          LIMIT 1
        ) as foto_finalizado
      FROM pedidos_finalizados pf
      JOIN ternos t ON pf.terno_id = t.id
      ORDER BY pf.data_finalizacao DESC
    `);
    
    console.log('📊 Debug pedidos finalizados:', pedidosFinalizados.map(p => ({
      id: p.id,
      codigo: p.codigo_pedido,
      foto: p.foto_finalizado
    })));
    
    // Se não há foto nas sub-etapas, usar uma foto padrão ou vazia
    const pedidosComFoto = pedidosFinalizados.map(pedido => ({
      ...pedido,
      foto_finalizado: pedido.foto_finalizado || null
    }));
    
    res.json(pedidosComFoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DEBUG: Verificar fotos nas sub-etapas
app.get('/api/debug/sub-etapas-fotos', authenticateToken, async (req, res) => {
  try {
    const subEtapasComFoto = await dbAll(`
      SELECT se.id, se.terno_id, se.sub_etapa, se.foto, se.data_finalizacao, t.codigo
      FROM sub_etapas se
      JOIN ternos t ON se.terno_id = t.id
      WHERE se.foto IS NOT NULL AND se.foto != ''
      ORDER BY se.data_finalizacao DESC
    `);
    
    res.json({
      total_com_foto: subEtapasComFoto.length,
      sub_etapas: subEtapasComFoto
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LIMPAR TODOS OS DADOS DE PRODUÇÃO
app.delete('/api/admin/limpar-producao', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    console.log('🗑️ Iniciando limpeza completa dos dados de produção...');
    
    // Limpar todas as tabelas relacionadas à produção
    await dbRun('DELETE FROM sub_etapas');
    await dbRun('DELETE FROM historico_etapas');
    await dbRun('DELETE FROM pedidos_finalizados');
    await dbRun('DELETE FROM notificacoes_admin');
    await dbRun('DELETE FROM ternos');
    
    // Resetar auto-increment
    await dbRun('DELETE FROM sqlite_sequence WHERE name IN ("ternos", "sub_etapas", "historico_etapas", "pedidos_finalizados", "notificacoes_admin")');
    
    console.log('✅ Limpeza completa realizada com sucesso!');
    
    res.json({ 
      success: true,
      message: 'Todos os dados de produção foram removidos com sucesso',
      tabelas_limpas: ['ternos', 'sub_etapas', 'historico_etapas', 'pedidos_finalizados', 'notificacoes_admin']
    });
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error);
    res.status(500).json({ error: error.message });
  }
});

// HISTÓRICO DE PRODUÇÃO POR FUNCIONÁRIO (ÚLTIMOS 30 DIAS)
app.get('/api/funcionarios/:id/historico', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar dados do funcionário
    const funcionario = await dbGet('SELECT nome FROM usuarios WHERE id = ?', [id]);
    if (!funcionario) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }
    
    // Ternos finalizados pelo funcionário nos últimos 30 dias
    const ternosFinalizados = await dbAll(`
      SELECT t.codigo, t.cliente, t.tipo_servico, pf.data_finalizacao
      FROM pedidos_finalizados pf
      JOIN ternos t ON pf.terno_id = t.id
      WHERE pf.nome_alfaiate = ? 
      AND pf.data_finalizacao >= date('now', '-30 days')
      ORDER BY pf.data_finalizacao DESC
    `, [funcionario.nome]);
    
    // Sub-etapas concluídas pelo funcionário nos últimos 30 dias
    const subEtapasConcluidas = await dbAll(`
      SELECT se.sub_etapa, se.data_finalizacao, t.codigo, t.cliente
      FROM sub_etapas se
      JOIN ternos t ON se.terno_id = t.id
      WHERE se.funcionario = ? 
      AND se.status = 'finalizada'
      AND se.data_finalizacao >= date('now', '-30 days')
      ORDER BY se.data_finalizacao DESC
    `, [funcionario.nome]);
    
    // Estatísticas
    const totalFinalizados = ternosFinalizados.length;
    const totalSubEtapas = subEtapasConcluidas.length;
    
    res.json({
      funcionario: funcionario.nome,
      periodo: '30 dias',
      estatisticas: {
        ternos_finalizados: totalFinalizados,
        sub_etapas_concluidas: totalSubEtapas
      },
      ternos_finalizados: ternosFinalizados,
      sub_etapas_concluidas: subEtapasConcluidas
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RELATÓRIOS COM DADOS REAIS
app.get('/api/relatorios', authenticateToken, async (req, res) => {
  try {
    // Estatísticas gerais
    const totalTernos = await dbGet('SELECT COUNT(*) as total FROM ternos');
    const ternosAtivos = await dbGet('SELECT COUNT(*) as total FROM ternos WHERE etapa_atual != "Finalizado"');
    const ternosFinalizados = await dbGet('SELECT COUNT(*) as total FROM ternos WHERE etapa_atual = "Finalizado"');
    const ternosAtrasados = await dbGet('SELECT COUNT(*) as total FROM ternos WHERE status = "atrasado"');
    
    // Produção por dia (últimos 7 dias)
    const producaoPorDia = await dbAll(`
      SELECT 
        strftime('%d/%m', created_at) as data,
        COUNT(*) as ternos
      FROM ternos 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY created_at DESC
      LIMIT 7
    `);
    
    // Ternos por etapa
    const etapas = await dbAll(`
      SELECT 
        etapa_atual as etapa_atual,
        COUNT(*) as quantidade
      FROM ternos 
      WHERE etapa_atual != "Finalizado"
      GROUP BY etapa_atual
    `);
    
    // Produtividade por funcionário (ternos finalizados)
    const funcionarios = await dbAll(`
      SELECT 
        u.nome,
        COUNT(pf.id) as concluidas
      FROM usuarios u
      LEFT JOIN pedidos_finalizados pf ON u.nome = pf.nome_alfaiate
      WHERE u.tipo != 'admin'
      GROUP BY u.nome
      ORDER BY concluidas DESC
    `);
    
    res.json({
      estatisticas: {
        total_ternos: totalTernos.total,
        ternos_ativos: ternosAtivos.total,
        ternos_finalizados: ternosFinalizados.total,
        ternos_atrasados: ternosAtrasados.total
      },
      producaoPorDia: producaoPorDia.reverse(),
      etapas,
      funcionarios
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GERAR RELATÓRIO EM PDF
app.get('/api/relatorios/pdf', authenticateToken, async (req, res) => {
  try {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar dados
    const totalTernos = await dbGet('SELECT COUNT(*) as total FROM ternos');
    const ternosAtivos = await dbGet('SELECT COUNT(*) as total FROM ternos WHERE etapa_atual != "Finalizado"');
    const ternosFinalizados = await dbGet('SELECT COUNT(*) as total FROM ternos WHERE etapa_atual = "Finalizado"');
    const ternosAtrasados = await dbGet('SELECT COUNT(*) as total FROM ternos WHERE status = "atrasado"');
    
    const producaoPorDia = await dbAll(`
      SELECT 
        strftime('%d/%m', created_at) as data,
        COUNT(*) as ternos
      FROM ternos 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY created_at DESC
      LIMIT 7
    `);
    
    const etapas = await dbAll(`
      SELECT 
        etapa_atual as etapa_atual,
        COUNT(*) as quantidade
      FROM ternos 
      WHERE etapa_atual != "Finalizado"
      GROUP BY etapa_atual
    `);
    
    const funcionarios = await dbAll(`
      SELECT 
        u.nome,
        COUNT(pf.id) as concluidas
      FROM usuarios u
      LEFT JOIN pedidos_finalizados pf ON u.nome = pf.nome_alfaiate
      WHERE u.tipo != 'admin'
      GROUP BY u.nome
      ORDER BY concluidas DESC
    `);
    
    const dados = {
      estatisticas: {
        total_ternos: totalTernos.total,
        ternos_ativos: ternosAtivos.total,
        ternos_finalizados: ternosFinalizados.total,
        ternos_atrasados: ternosAtrasados.total
      },
      producaoPorDia: producaoPorDia.reverse(),
      etapas,
      funcionarios
    };
    
    // Gerar HTML do relatório
    const htmlContent = gerarHTMLRelatorio(dados);
    
    // Gerar PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio_producao_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Função para gerar HTML do relatório
const gerarHTMLRelatorio = (dados) => {
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const taxaConclusao = dados.estatisticas.total_ternos > 0 ? 
    Math.round((dados.estatisticas.ternos_finalizados / dados.estatisticas.total_ternos) * 100) : 0;
  
  const producaoSemanal = dados.producaoPorDia.reduce((total, dia) => total + dia.ternos, 0);
  const mediaDiaria = dados.producaoPorDia.length > 0 ? Math.round(producaoSemanal / dados.producaoPorDia.length) : 0;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Produção</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #2563eb; font-size: 28px; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #2563eb; }
        .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th, .table td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
        .table th { background-color: #f9fafb; font-weight: bold; }
        .summary { background-color: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; }
        .summary h3 { color: #2563eb; margin-top: 0; }
        .alert { background-color: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 15px; color: #dc2626; }
        .success { background-color: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 15px; color: #059669; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>RELATÓRIO EMPRESARIAL DE PRODUÇÃO</h1>
        <p><strong>Sistema de Controle de Produção de Ternos</strong></p>
        <p>Gerado em: ${dataAtual}</p>
      </div>
      
      <div class="section">
        <h2>1. RESUMO EXECUTIVO</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${dados.estatisticas.total_ternos}</div>
            <div class="stat-label">Total de Ternos</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${dados.estatisticas.ternos_ativos}</div>
            <div class="stat-label">Em Produção</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${dados.estatisticas.ternos_finalizados}</div>
            <div class="stat-label">Finalizados</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${dados.estatisticas.ternos_atrasados}</div>
            <div class="stat-label">Atrasados</div>
          </div>
        </div>
        
        ${dados.estatisticas.ternos_atrasados > 0 ? 
          `<div class="alert">
            <strong>⚠️ ATENÇÃO:</strong> Existem ${dados.estatisticas.ternos_atrasados} ternos com atraso na produção.
          </div>` : 
          `<div class="success">
            <strong>✅ STATUS:</strong> Produção em dia, sem atrasos registrados.
          </div>`
        }
      </div>
      
      <div class="section">
        <h2>2. PRODUÇÃO DOS ÚLTIMOS 7 DIAS</h2>
        ${dados.producaoPorDia.length > 0 ? `
          <table class="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ternos Cadastrados</th>
                <th>Percentual do Total</th>
              </tr>
            </thead>
            <tbody>
              ${dados.producaoPorDia.map(dia => `
                <tr>
                  <td>${dia.data}</td>
                  <td>${dia.ternos}</td>
                  <td>${producaoSemanal > 0 ? Math.round((dia.ternos / producaoSemanal) * 100) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f9fafb;">
                <td>TOTAL DA SEMANA</td>
                <td>${producaoSemanal}</td>
                <td>100%</td>
              </tr>
            </tfoot>
          </table>
        ` : '<p>Nenhum terno cadastrado nos últimos 7 dias.</p>'}
      </div>
      
      <div class="section">
        <h2>3. DISTRIBUIÇÃO POR ETAPAS DE PRODUÇÃO</h2>
        ${dados.etapas.length > 0 ? `
          <table class="table">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Quantidade de Ternos</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              ${dados.etapas.map(etapa => `
                <tr>
                  <td>${etapa.etapa_atual}</td>
                  <td>${etapa.quantidade}</td>
                  <td>${dados.estatisticas.ternos_ativos > 0 ? Math.round((etapa.quantidade / dados.estatisticas.ternos_ativos) * 100) : 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>Nenhum terno em produção no momento.</p>'}
      </div>
      
      <div class="section">
        <h2>4. PRODUTIVIDADE DOS FUNCIONÁRIOS</h2>
        ${dados.funcionarios.filter(f => f.concluidas > 0).length > 0 ? `
          <table class="table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Etapas Concluídas</th>
                <th>Participação</th>
              </tr>
            </thead>
            <tbody>
              ${dados.funcionarios.filter(f => f.concluidas > 0).map(func => {
                const totalEtapas = dados.funcionarios.reduce((sum, f) => sum + f.concluidas, 0);
                return `
                  <tr>
                    <td>${func.nome}</td>
                    <td>${func.concluidas}</td>
                    <td>${totalEtapas > 0 ? Math.round((func.concluidas / totalEtapas) * 100) : 0}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : '<p>Nenhuma atividade de produção registrada.</p>'}
      </div>
      
      <div class="section">
        <div class="summary">
          <h3>5. INDICADORES CHAVE DE PERFORMANCE (KPIs)</h3>
          <ul>
            <li><strong>Taxa de Conclusão:</strong> ${taxaConclusao}% dos ternos foram finalizados</li>
            <li><strong>Produção Média Diária:</strong> ${mediaDiaria} ternos por dia</li>
            <li><strong>Funcionários Ativos:</strong> ${dados.funcionarios.filter(f => f.concluidas > 0).length} colaboradores</li>
            <li><strong>Status Geral:</strong> ${dados.estatisticas.ternos_atrasados > 0 ? 'Atenção - Atrasos detectados' : 'Produção em dia'}</li>
          </ul>
        </div>
      </div>
      
      <div class="section">
        <h2>6. OBSERVAÇÕES E RECOMENDAÇÕES</h2>
        <ul>
          ${dados.estatisticas.ternos_atrasados > 0 ? 
            '<li><strong>Ação Necessária:</strong> Revisar ternos atrasados e redistribuir recursos se necessário.</li>' : 
            '<li><strong>Status Positivo:</strong> Produção funcionando dentro do prazo esperado.</li>'
          }
          ${dados.estatisticas.total_ternos === 0 ? 
            '<li><strong>Sistema Novo:</strong> Aguardando cadastro dos primeiros ternos para análise completa.</li>' : 
            '<li><strong>Monitoramento:</strong> Continuar acompanhando métricas de produção regularmente.</li>'
          }
          <li><strong>Próximos Passos:</strong> Manter registro atualizado das etapas e prazos de entrega.</li>
        </ul>
      </div>
      
      <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        <p>Relatório gerado automaticamente pelo Sistema de Controle de Produção de Ternos</p>
        <p>Para mais informações, acesse o painel administrativo do sistema</p>
      </div>
    </body>
    </html>
  `;
};

// WebSocket para linha de produção em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  socket.on('join_admin', () => {
    socket.join('admins');
    console.log('Admin conectado para receber atualizações');
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Disponível em: http://192.168.1.8:${PORT}`);
  console.log(`📱 Mobile pode conectar em: http://192.168.1.8:${PORT}/api`);
  console.log(`🔌 WebSocket ativo para atualizações em tempo real`);
  console.log('\n🛣️ Rotas disponíveis:');
  console.log('  GET  /api/status');
  console.log('  GET  /api/ternos');
  console.log('  PUT  /api/ternos/:id/finalizar');
  console.log('  GET  /api/ternos/:id/sub-etapas');
  console.log('  PUT  /api/sub-etapas/:id');
});