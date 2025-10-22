import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Calendar, User, FileText, Camera, Eye } from 'lucide-react';

const PedidosFinalizados = () => {
  const [pedidosFinalizados, setPedidosFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFoto, setModalFoto] = useState(null);

  useEffect(() => {
    carregarPedidosFinalizados();
  }, []);

  const carregarPedidosFinalizados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/pedidos-finalizados', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPedidosFinalizados(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar pedidos finalizados:', error);
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="container">
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
            <CheckCircle size={32} style={{ color: '#10B981' }} />
            Pedidos Finalizados
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            {pedidosFinalizados.length} pedidos concluídos
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/finalizar-pedido/0" className="btn-primary" style={{ textDecoration: 'none' }}>
            <CheckCircle size={16} style={{ marginRight: '8px' }} />
            Finalizar Pedido
          </Link>
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
            Voltar
          </Link>
        </div>
      </header>

      {pedidosFinalizados.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CheckCircle size={64} style={{ color: '#333333', marginBottom: '20px' }} />
          <h3 style={{ color: '#ffffff', marginBottom: '12px' }}>Nenhum pedido finalizado</h3>
          <p style={{ color: '#cccccc' }}>Os pedidos finalizados aparecerão aqui</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {pedidosFinalizados.map(pedido => (
            <div key={pedido.id} className="card">
              {/* Foto do Pedido */}
              <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                {pedido.foto_finalizado && pedido.foto_finalizado !== '/uploads/default-terno.jpg' ? (
                  <>
                    <img 
                      src={pedido.foto_finalizado} 
                      alt={`Pedido ${pedido.codigo_pedido}`}
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '2px solid #10B981',
                        cursor: 'pointer'
                      }}
                      onClick={() => setModalFoto(pedido.foto_finalizado)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '8px',
                      border: '2px solid #666666',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      color: '#cccccc'
                    }}>
                      <Camera size={48} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <p>Foto não disponível</p>
                    </div>
                    <button
                      onClick={() => setModalFoto(pedido.foto_finalizado)}
                      style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        backgroundColor: '#333333',
                        border: '1px solid #444444',
                        borderRadius: '4px',
                        color: '#cccccc',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        margin: '8px auto 0'
                      }}
                    >
                      <Eye size={12} />
                      Ver foto completa
                    </button>
                  </>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    border: '2px solid #666666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    color: '#cccccc'
                  }}>
                    <Camera size={48} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p>Nenhuma foto disponível</p>
                    <small>Foto não foi tirada durante a produção</small>
                  </div>
                )}
              </div>

              {/* Informações do Pedido */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
                    #{pedido.codigo_pedido}
                  </h3>
                  <p style={{ color: '#10B981', fontSize: '14px', fontWeight: '500' }}>
                    ✓ Finalizado
                  </p>
                </div>
                <CheckCircle size={24} style={{ color: '#10B981' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <User size={16} style={{ color: '#3B82F6' }} />
                  <span style={{ color: '#cccccc', fontSize: '14px' }}>Cliente:</span>
                  <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>{pedido.nome_cliente}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FileText size={16} style={{ color: '#3B82F6' }} />
                  <span style={{ color: '#cccccc', fontSize: '14px' }}>Alfaiate:</span>
                  <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>{pedido.nome_alfaiate}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} style={{ color: '#3B82F6' }} />
                  <span style={{ color: '#cccccc', fontSize: '14px' }}>Finalizado em:</span>
                  <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>
                    {formatarData(pedido.data_finalizacao)}
                  </span>
                </div>
              </div>

              {pedido.observacoes_alfaiate && (
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: '#2a2a2a', 
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: '#cccccc', fontSize: '13px', margin: 0 }}>
                    <strong>Observações do Alfaiate:</strong><br />
                    {pedido.observacoes_alfaiate}
                  </p>
                </div>
              )}

              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                paddingTop: '16px',
                borderTop: '1px solid #333333'
              }}>
                <span style={{ 
                  backgroundColor: '#10B981', 
                  color: '#ffffff', 
                  padding: '6px 12px', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <CheckCircle size={16} />
                  Pedido Concluído
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para visualizar foto */}
      {modalFoto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          cursor: 'pointer'
        }} onClick={() => setModalFoto(null)}>
          <img 
            src={modalFoto} 
            alt="Foto ampliada"
            style={{ 
              maxWidth: '90%', 
              maxHeight: '90%', 
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default PedidosFinalizados;