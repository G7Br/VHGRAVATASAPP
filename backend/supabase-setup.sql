-- SCRIPT PARA CRIAR TABELAS NO SUPABASE
-- Execute este script no SQL Editor do Supabase

-- 1. TABELA DE USUÁRIOS
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'funcionario',
  data_nascimento DATE,
  sexo VARCHAR(10),
  funcao VARCHAR(50),
  data_admissao DATE,
  foto TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABELA DE TERNOS
CREATE TABLE ternos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  cliente VARCHAR(100) NOT NULL,
  tipo_servico VARCHAR(50) NOT NULL,
  prazo_entrega DATE,
  observacoes TEXT,
  etapa_atual VARCHAR(100) DEFAULT 'Chegada do pedido',
  funcionario_atual VARCHAR(100),
  status VARCHAR(20) DEFAULT 'no-prazo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABELA DE SUB-ETAPAS
CREATE TABLE sub_etapas (
  id SERIAL PRIMARY KEY,
  terno_id INTEGER REFERENCES ternos(id) ON DELETE CASCADE,
  sub_etapa VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  observacoes TEXT,
  foto TEXT,
  funcionario VARCHAR(100),
  data_finalizacao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. TABELA DE HISTÓRICO
CREATE TABLE historico_etapas (
  id SERIAL PRIMARY KEY,
  terno_id INTEGER REFERENCES ternos(id) ON DELETE CASCADE,
  etapa VARCHAR(100) NOT NULL,
  funcionario VARCHAR(100),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. TABELA DE PEDIDOS FINALIZADOS
CREATE TABLE pedidos_finalizados (
  id SERIAL PRIMARY KEY,
  codigo_pedido VARCHAR(50) NOT NULL,
  nome_cliente VARCHAR(100) NOT NULL,
  nome_alfaiate VARCHAR(100) NOT NULL,
  observacoes_alfaiate TEXT,
  foto_finalizado TEXT,
  terno_id INTEGER REFERENCES ternos(id),
  data_finalizacao TIMESTAMP DEFAULT NOW()
);

-- 6. TABELA DE NOTIFICAÇÕES ADMIN
CREATE TABLE notificacoes_admin (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'info',
  lida BOOLEAN DEFAULT FALSE,
  data TIMESTAMP DEFAULT NOW()
);

-- 7. INSERIR USUÁRIO ADMIN PADRÃO
INSERT INTO usuarios (username, password, nome, tipo, funcao) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'admin', 'Administrador');

-- 8. HABILITAR RLS (Row Level Security) - OPCIONAL
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ternos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sub_etapas ENABLE ROW LEVEL SECURITY;

-- 9. CRIAR POLÍTICAS DE ACESSO - OPCIONAL
-- CREATE POLICY "Usuários podem ver todos os dados" ON usuarios FOR ALL USING (true);
-- CREATE POLICY "Ternos acessíveis a todos" ON ternos FOR ALL USING (true);
-- CREATE POLICY "Sub-etapas acessíveis a todos" ON sub_etapas FOR ALL USING (true);