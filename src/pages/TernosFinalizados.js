import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Calendar, User } from 'lucide-react';

const TernosFinalizados = () => {
  const [ternos, setTernos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarTernosFinalizados();
  }, []);

  const carregarTernosFinalizados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ternos-finalizados', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTernos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar ternos finalizados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return 'Data não disponível';
    return new Date(dataString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container">
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
      </div>
    );
  }

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
            <Package size={32} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Próximos a Entregar
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            Ternos finalizados prontos para entrega
          </p>
        </div>
        
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      <div className="card">
        {ternos.length > 0 ? (
          <>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '10px' }}>
                Total: {ternos.length} ternos finalizados
              </h3>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {ternos.map((terno) => (
                <div key={terno.id} style={{
                  background: '#1a1a1a',
                  border: '2px solid #10B981',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ 
                      color: '#ffffff', 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      Terno #{terno.codigo}
                    </h4>
                    <p style={{ color: '#cccccc', marginBottom: '4px' }}>
                      <strong>Cliente:</strong> {terno.cliente}
                    </p>
                    <p style={{ color: '#cccccc', marginBottom: '4px' }}>
                      <strong>Tipo:</strong> {terno.tipo_servico}
                    </p>
                    <p style={{ color: '#cccccc', marginBottom: '4px' }}>
                      <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      <strong>Prazo:</strong> {new Date(terno.prazo_entrega).toLocaleDateString('pt-BR')}
                    </p>
                    {terno.funcionario_finalizador && (
                      <p style={{ color: '#10B981', marginBottom: '4px' }}>
                        <User size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        <strong>Finalizado por:</strong> {terno.funcionario_finalizador}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      background: '#10B981',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      ✅ FINALIZADO
                    </div>
                    {terno.data_finalizacao && (
                      <p style={{ color: '#888888', fontSize: '12px' }}>
                        {formatarData(terno.data_finalizacao)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Package size={64} style={{ color: '#666666', marginBottom: '16px' }} />
            <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>
              Nenhum terno finalizado
            </h3>
            <p style={{ color: '#cccccc' }}>
              Os ternos finalizados aparecerão aqui quando estiverem prontos para entrega.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TernosFinalizados;