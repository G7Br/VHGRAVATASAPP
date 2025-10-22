import React, { useState } from 'react';
import { User, Lock, LogIn } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3002/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario, senha })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#000000'
    }}>
      <div className="card" style={{ width: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '32px' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '120px', 
              height: '120px', 
              marginBottom: '20px',
              filter: 'brightness(0) invert(1)'
            }} 
          />
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            PRODUÇÃO
          </h1>
          <p style={{ color: '#cccccc', fontSize: '16px' }}>Sistema de Controle de Ternos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>
              <User size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Usuário
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div className="input-group">
            <label>
              <Lock size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', fontSize: '18px', padding: '16px' }}
            disabled={loading}
          >
            {loading ? (
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '2px solid #333', 
                borderTop: '2px solid #fff', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
            ) : (
              <LogIn size={20} style={{ marginRight: '8px' }} />
            )}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#888888' }}>
          <p>Usuários de teste:</p>
          <p>admin/admin123 | joao/123 | maria/123 | pedro/123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;