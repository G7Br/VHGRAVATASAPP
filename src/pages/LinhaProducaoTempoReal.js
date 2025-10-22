import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, CheckCircle, User, Calendar, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const LinhaProducaoTempoReal = () => {
  const [ternos, setTernos] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarLinhaProducao();
    
    // Simular atualizações em tempo real
    const interval = setInterval(() => {
      // Adicionar notificação simulada
      setNotificacoes(prev => [{
        id: Date.now(),
        tipo: 'update',
        mensagem: `Atualização automática - ${new Date().toLocaleTimeString()}`,
        timestamp: new Date()
      }, ...prev.slice(0, 9)]);
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const carregarLinhaProducao = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/admin/linha-producao-tempo-real', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTernos(data);
      } else {
        console.error('Erro ao carregar linha de produção');
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar linha de produção:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'atrasado': return '#EF4444';
      case 'atencao': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'atrasado': return <AlertTriangle size={16} style={{ color: '#EF4444' }} />;
      case 'atencao': return <Clock size={16} style={{ color: '#F59E0B' }} />;
      default: return <CheckCircle size={16} style={{ color: '#10B981' }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #f3f3f3', 
          borderTop: '4px solid #3498db', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }}></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
      
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
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Activity size={32} style={{ color: '#3B82F6' }} />
            Linha de Produção - Tempo Real
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cccccc' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#10B981', 
              borderRadius: '50%', 
              animation: 'pulse 2s infinite' 
            }}></div>
            Online
          </div>
          <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Voltar
          </Link>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Linha de Produção */}
        <div>
          <div className="card">
            <div style={{ padding: '16px', borderBottom: '1px solid #333333' }}>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
                Ternos em Produção ({ternos.length})
              </h2>
            </div>
            <div style={{ padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
              {ternos.map(terno => (
                <div key={terno.id} style={{
                  padding: '16px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  border: `2px solid ${getStatusColor(terno.status)}`,
                  backgroundColor: '#222222'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>{terno.codigo}</h3>
                      <p style={{ fontSize: '14px', color: '#cccccc' }}>{terno.cliente}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getStatusIcon(terno.status)}
                      <span style={{ fontSize: '12px', fontWeight: '500', color: getStatusColor(terno.status), textTransform: 'capitalize' }}>
                        {terno.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cccccc' }}>
                      <Activity size={16} />
                      <span>{terno.etapa_atual}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cccccc' }}>
                      <User size={16} />
                      <span>{terno.funcionario_atual}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cccccc' }}>
                      <Calendar size={16} />
                      <span>Prazo: {new Date(terno.prazo_entrega).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cccccc' }}>
                      <Clock size={16} />
                      <span>Iniciado: {new Date(terno.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Sub-etapas ativas */}
                  {terno.sub_etapas_ativas && terno.sub_etapas_ativas.length > 0 && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #333333' }}>
                      <p style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px', color: '#ffffff' }}>Sub-etapas ativas:</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {terno.sub_etapas_ativas.map((sub, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span style={{ color: '#cccccc' }}>{sub.sub_etapa}</span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: sub.status === 'finalizada' ? '#10B981' : '#3B82F6',
                              color: '#ffffff',
                              fontSize: '10px'
                            }}>
                              {sub.status === 'finalizada' ? 'Finalizada' : 'Em Andamento'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {ternos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', color: '#cccccc' }}>
                  <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>Nenhum terno em produção no momento</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notificações em Tempo Real */}
        <div>
          <div className="card">
            <div style={{ padding: '16px', borderBottom: '1px solid #333333' }}>
              <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>Notificações</h2>
            </div>
            <div style={{ padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
              {notificacoes.map(notif => (
                <div key={notif.id} style={{
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: '#333333',
                  borderRadius: '8px',
                  border: '1px solid #444444'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '500' }}>
                      {notif.tipo === 'update' ? 'Atualização' : 'Notificação'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888888' }}>
                      {notif.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#ffffff' }}>{notif.mensagem}</p>
                  {notif.funcionario && (
                    <p style={{ fontSize: '12px', color: '#cccccc', marginTop: '4px' }}>Por: {notif.funcionario}</p>
                  )}
                </div>
              ))}
              
              {notificacoes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '16px', color: '#cccccc' }}>
                  <p style={{ fontSize: '14px' }}>Aguardando notificações...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinhaProducaoTempoReal;