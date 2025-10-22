import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Clock, AlertTriangle, CheckCircle, LogOut, BarChart3, User, Bell, Package } from 'lucide-react';

const Dashboard = ({ user, onLogout }) => {
  const [ternos, setTernos] = useState([]);
  const [ternosFinalizados, setTernosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar ternos ativos
      const ternosResponse = await fetch('http://localhost:3002/api/ternos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (ternosResponse.ok) {
        const ternosData = await ternosResponse.json();
        setTernos(ternosData);
      }
      
      // Carregar ternos finalizados
      const finalizadosResponse = await fetch('http://localhost:3002/api/ternos-finalizados', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (finalizadosResponse.ok) {
        const finalizadosData = await finalizadosResponse.json();
        setTernosFinalizados(finalizadosData);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const ternosAtivos = ternos.filter(t => t.etapa_atual !== 'Finalizado');
  const ternosNoPrazo = ternosAtivos.filter(t => t.status === 'no-prazo').length;
  const ternosAtrasados = ternosAtivos.filter(t => t.status === 'atrasado').length;
  const meusTernos = ternosAtivos.filter(t => t.funcionario_atual === user.nome);

  const proximosEntregar = ternosFinalizados
    .sort((a, b) => new Date(a.prazo_entrega) - new Date(b.prazo_entrega))
    .slice(0, 5);

  return (
    <div className="container">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        padding: '20px 0',
        borderBottom: '2px solid #333333'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '50px', 
              height: '50px', 
              marginRight: '16px',
              filter: 'brightness(0) invert(1)'
            }} 
          />
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Dashboard - Produção
            </h1>
            <p style={{ color: '#cccccc', marginTop: '4px' }}>Bem-vindo, {user.nome}</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/perfil-funcionario" className="btn-secondary">
            <User size={18} style={{ marginRight: '8px' }} />
            Perfil
          </Link>
          {user.tipo === 'admin' && (
            <>
              <Link to="/admin" className="btn-secondary">
                <Bell size={18} style={{ marginRight: '8px' }} />
                Admin
              </Link>
              <Link to="/relatorios" className="btn-secondary">
                <BarChart3 size={18} style={{ marginRight: '8px' }} />
                Relatórios
              </Link>
            </>
          )}
          <button onClick={onLogout} className="btn-secondary">
            <LogOut size={18} style={{ marginRight: '8px' }} />
            Sair
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Users size={32} style={{ color: '#ffffff', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>{ternosAtivos.length}</h3>
          <p style={{ color: '#cccccc' }}>Ternos Ativos</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <CheckCircle size={32} style={{ color: '#ffffff', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>{ternosNoPrazo}</h3>
          <p style={{ color: '#cccccc' }}>No Prazo</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <AlertTriangle size={32} style={{ color: '#ffffff', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>{ternosAtrasados}</h3>
          <p style={{ color: '#cccccc' }}>Atrasados</p>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <Clock size={32} style={{ color: '#ffffff', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px', color: '#ffffff' }}>{meusTernos.length}</h3>
          <p style={{ color: '#cccccc' }}>Seus Ternos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: user.tipo === 'admin' ? '1fr 1fr' : '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ color: '#ffffff', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            {user.tipo === 'admin' ? 'Ternos em Andamento' : 'Seus Ternos Atuais'}
          </h3>
          {user.tipo === 'admin' ? (
            ternosAtivos.length > 0 ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {ternosAtivos.slice(0, 10).map(terno => (
                  <div key={terno.id} style={{ 
                    padding: '12px', 
                    background: '#2a2a2a', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: '#ffffff' }}>#{terno.codigo}</strong> - <span style={{ color: '#ffffff' }}>{terno.cliente}</span>
                      <br />
                      <small style={{ color: '#cccccc' }}>{terno.etapa_atual}</small>
                      <br />
                      <small style={{ color: '#888888' }}>👤 {terno.funcionario_atual}</small>
                    </div>
                    <Link to={`/sub-etapas/${terno.id}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>
                      Ver Detalhes
                    </Link>
                  </div>
                ))}
                {ternosAtivos.length > 10 && (
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <Link to="/producao" className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
                      Ver Todos ({ternosAtivos.length})
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#cccccc' }}>Nenhum terno em andamento no momento.</p>
            )
          ) : (
            meusTernos.length > 0 ? (
              <div>
                {meusTernos.map(terno => (
                  <div key={terno.id} style={{ 
                    padding: '12px', 
                    background: '#2a2a2a', 
                    borderRadius: '8px', 
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ color: '#ffffff' }}>#{terno.codigo}</strong> - <span style={{ color: '#ffffff' }}>{terno.cliente}</span>
                      <br />
                      <small style={{ color: '#cccccc' }}>{terno.etapa_atual}</small>
                    </div>
                    <Link to={`/sub-etapas/${terno.id}`} className="btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>
                      Sub-etapas
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#cccccc' }}>Nenhum terno atribuído a você no momento.</p>
            )
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
              <Package size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {user.tipo === 'admin' ? 'Ternos Finalizados' : 'Próximos a Entregar'}
            </h3>
            <Link to="/ternos-finalizados" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Ver Todos
            </Link>
          </div>
          {proximosEntregar.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {proximosEntregar.map(terno => (
                <div key={terno.id} style={{ 
                  padding: '12px', 
                  background: '#1a1a1a', 
                  border: '2px solid #10B981',
                  borderRadius: '8px', 
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: '#ffffff' }}>#{terno.codigo}</strong> - <span style={{ color: '#ffffff' }}>{terno.cliente}</span>
                    <br />
                    <small style={{ color: '#10B981' }}>✅ FINALIZADO</small>
                    {user.tipo === 'admin' && terno.funcionario_finalizador && (
                      <>
                        <br />
                        <small style={{ color: '#888888' }}>👤 {terno.funcionario_finalizador}</small>
                      </>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}>
                      {new Date(terno.prazo_entrega).toLocaleDateString('pt-BR')}
                    </div>
                    {!user.tipo === 'admin' && terno.funcionario_finalizador && (
                      <div style={{ color: '#cccccc', fontSize: '10px' }}>
                        por {terno.funcionario_finalizador}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#cccccc', textAlign: 'center', padding: '20px' }}>
              Nenhum terno finalizado ainda
            </p>
          )}
        </div>
      </div>

      {user.tipo === 'admin' && (
        <div style={{ textAlign: 'center' }}>
          <Link to="/cadastro" className="btn-primary" style={{ 
            fontSize: '20px', 
            padding: '20px 40px',
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}>
            <Plus size={24} style={{ marginRight: '12px' }} />
            Cadastrar Terno para Funcionário
          </Link>
        </div>
      )}

      <div style={{ marginTop: '32px', textAlign: 'center' }}>
        <Link to="/producao" className="btn-secondary" style={{ 
          marginRight: '16px',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          {user.tipo === 'admin' ? 'Ver Linha de Produção Completa' : 'Ver Meus Ternos'}
        </Link>
        
        <Link to="/finalizados" className="btn-secondary" style={{ 
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          Pedidos Finalizados
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;