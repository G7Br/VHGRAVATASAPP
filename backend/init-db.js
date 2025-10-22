const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const schemaPath = path.join(__dirname, 'database.sqlite.sql');

// Remover banco existente se houver
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Banco anterior removido');
}

const db = new sqlite3.Database(dbPath);

async function initDatabase() {
  try {
    // Ler schema
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Executar schema (sem os INSERTs)
    const schemaWithoutInserts = schema.split('-- Inserir usuários de teste')[0];
    
    db.exec(schemaWithoutInserts, async (err) => {
      if (err) {
        console.error('Erro ao criar schema:', err);
        return;
      }
      
      console.log('✅ Schema criado com sucesso');
      
      // Inserir usuários com senhas corretas
      const adminHash = await bcrypt.hash('admin123', 10);
      const userHash = await bcrypt.hash('123', 10);
      
      const users = [
        ['admin', adminHash, 'Administrador', 'admin', '1980-01-01', 'Masculino', 'Administrador', '2020-01-01'],
        ['joao', userHash, 'João Silva', 'funcionario', '1985-05-15', 'Masculino', 'Alfaiate', '2021-03-10'],
        ['maria', userHash, 'Maria Santos', 'funcionario', '1990-08-22', 'Feminino', 'Alfaiate', '2022-01-15'],
        ['pedro', userHash, 'Pedro Costa', 'funcionario', '1988-12-03', 'Masculino', 'Alfaiate', '2021-07-20']
      ];
      
      const stmt = db.prepare(`
        INSERT INTO usuarios (username, password, nome, tipo, data_nascimento, sexo, funcao, data_admissao) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      users.forEach(user => {
        stmt.run(user, (err) => {
          if (err) console.error('Erro ao inserir usuário:', err);
          else console.log(`✅ Usuário ${user[0]} criado`);
        });
      });
      
      stmt.finalize(() => {
        db.close((err) => {
          if (err) console.error('Erro ao fechar DB:', err);
          else console.log('✅ Banco inicializado com sucesso!');
        });
      });
    });
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

initDatabase();