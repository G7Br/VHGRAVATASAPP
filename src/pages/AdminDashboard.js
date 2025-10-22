import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Eye, Camera, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [ternos, setTernos] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Carregar ternos
      const ternosResponse = await fetch('http://localhost:3002/api/ternos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (ternosResponse.ok) {
        const ternosData = await ternosResponse.json();
        setTernos(ternosData);
      }
      
      // Carregar notificações reais
      const notifResponse = await fetch('http://localhost:3002/api/admin/notificacoes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        setNotificacoes(notifData);
      } else {
        setNotificacoes([]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setNotificacoes([]);
      setLoading(false);
    }
  };

  const getNotificationIcon = (tipo) => {
    switch(tipo) {
      case 'sub_etapa_finalizada': return '✅';
      case 'sub_etapa_iniciada': return '🔄';
      case 'finalizado': return '🎉';
      default: return '📋';
    }
  };

  const getNotificationColor = (tipo) => {
    switch(tipo) {
      case 'sub_etapa_finalizada': return '#ffffff';
      case 'sub_etapa_iniciada': return '#cccccc';
      case 'finalizado': return '#ffffff';
      default: return '#888888';
    }
  };
  
  const limparNotificacoes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/admin/notificacoes/clear', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotificacoes([]);
        alert('Notificações limpas com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

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
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700',
            color: '#ffffff'
          }}>
            Dashboard Administrativo
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            Monitoramento em tempo real da produção
          </p>
        </div>
        
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      {/* SEÇÃO DE NOTIFICAÇÕES */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ 
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            margin: 0
          }}>
            <Bell size={20} style={{ marginRight: '8px' }} />
            Notificações em Tempo Real ({notificacoes.filter(n => !n.lida).length})
          </h3>
          
          {notificacoes.length > 0 && (
            <button 
              onClick={limparNotificacoes}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Limpar Todas
            </button>
          )}
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {notificacoes.map(notif => (
            <div key={notif.id} style={{
              background: notif.lida ? '#222222' : '#333333',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '12px',
              borderLeft: notif.lida ? 'none' : '4px solid #ffffff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>
                      {getNotificationIcon(notif.tipo)}
                    </span>
                    <strong style={{ color: '#ffffff' }}>
                      Terno #{notif.codigo} - {notif.cliente}
                    </strong>
                  </div>
                  
                  <p style={{ 
                    color: getNotificationColor(notif.tipo),
                    marginBottom: '8px'
                  }}>
                    {notif.mensagem}
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#888888', fontSize: '12px' }}>
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      {new Date(notif.data).toLocaleString('pt-BR')}
                    </span>
                    <span style={{ color: '#888888', fontSize: '12px' }}>
                      👤 {notif.funcionario}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {notif.foto && (
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                      <Camera size={12} style={{ marginRight: '4px' }} />
                      Ver Foto
                    </button>
                  )}
                  <Link 
                    to={`/sub-etapas/${notif.terno_id}`}
                    className="btn-secondary" 
                    style={{ padding: '4px 8px', fontSize: '12px', textDecoration: 'none' }}
                  >
                    <Eye size={12} style={{ marginRight: '4px' }} />
                    Detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notificacoes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cccccc' }}>
            <Bell size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Nenhuma notificação no momento</p>
          </div>
        )}
      </div>

      {/* RESUMO RÁPIDO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '8px' }}>
            {ternos.filter(t => t.etapa_atual !== 'Finalizado').length}
          </h3>
          <p style={{ color: '#cccccc' }}>Ternos Ativos</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '8px' }}>
            {notificacoes.filter(n => !n.lida).length}
          </h3>
          <p style={{ color: '#cccccc' }}>Notificações Novas</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '8px' }}>
            {ternos.filter(t => t.etapa_atual === 'Finalizado').length}
          </h3>
          <p style={{ color: '#cccccc' }}>Ternos Finalizados</p>
        </div>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div style={{ textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/linha-tempo-real" className="btn-primary" style={{ 
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          🔴 Linha de Produção - Tempo Real
        </Link>
        
        <Link to="/relatorios-admin" className="btn-secondary" style={{ 
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          📊 Relatórios Administrativos
        </Link>
        
        <Link to="/gerenciar-funcionarios" className="btn-secondary" style={{ 
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          👥 Gerenciar Funcionários
        </Link>
        
        <Link to="/producao" className="btn-secondary" style={{ 
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center'
        }}>
          📋 Linha de Produção Completa
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;