import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, CheckCircle, Activity } from 'lucide-react';

const HistoricoFuncionario = () => {
  const { id } = useParams();
  const [historico, setHistorico] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarHistorico();
  }, [id]);

  const carregarHistorico = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/funcionarios/${id}/historico`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistorico(data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString) => {
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

  if (!historico) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ffffff' }}>Funcionário não encontrado</h2>
          <Link to="/" className="btn-primary">Voltar ao Dashboard</Link>
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
            <User size={32} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
            Histórico - {historico.funcionario}
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Produção dos últimos {historico.periodo}
          </p>
        </div>
        
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      {/* Estatísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <CheckCircle size={32} style={{ color: '#10B981', marginBottom: '12px' }} />
          <h3 style={{ color: '#ffffff', fontSize: '24px', marginBottom: '4px' }}>
            {historico.estatisticas.ternos_finalizados}
          </h3>
          <p style={{ color: '#cccccc' }}>Ternos Finalizados</p>
        </div>
        
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          <Activity size={32} style={{ color: '#3B82F6', marginBottom: '12px' }} />
          <h3 style={{ color: '#ffffff', fontSize: '24px', marginBottom: '4px' }}>
            {historico.estatisticas.sub_etapas_concluidas}
          </h3>
          <p style={{ color: '#cccccc' }}>Sub-etapas Concluídas</p>
        </div>
      </div>

      {/* Ternos Finalizados */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>
          <CheckCircle size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Ternos Finalizados ({historico.ternos_finalizados.length})
        </h3>
        
        {historico.ternos_finalizados.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {historico.ternos_finalizados.map((terno, index) => (
              <div key={index} style={{
                background: '#1a1a1a',
                border: '2px solid #10B981',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ color: '#ffffff', marginBottom: '4px' }}>
                    Terno #{terno.codigo} - {terno.cliente}
                  </h4>
                  <p style={{ color: '#cccccc', fontSize: '14px' }}>
                    {terno.tipo_servico}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    background: '#10B981',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    marginBottom: '4px'
                  }}>
                    FINALIZADO
                  </div>
                  <p style={{ color: '#888888', fontSize: '12px' }}>
                    {formatarData(terno.data_finalizacao)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#cccccc', textAlign: 'center', padding: '20px' }}>
            Nenhum terno finalizado nos últimos 30 dias
          </p>
        )}
      </div>

      {/* Sub-etapas Concluídas */}
      <div className="card">
        <h3 style={{ color: '#ffffff', marginBottom: '20px' }}>
          <Activity size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Sub-etapas Concluídas ({historico.sub_etapas_concluidas.length})
        </h3>
        
        {historico.sub_etapas_concluidas.length > 0 ? (
          <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {historico.sub_etapas_concluidas.map((subEtapa, index) => (
              <div key={index} style={{
                background: '#1a1a1a',
                border: '1px solid #3B82F6',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h5 style={{ color: '#ffffff', marginBottom: '2px', fontSize: '14px' }}>
                    {subEtapa.sub_etapa}
                  </h5>
                  <p style={{ color: '#cccccc', fontSize: '12px' }}>
                    Terno #{subEtapa.codigo} - {subEtapa.cliente}
                  </p>
                </div>
                <p style={{ color: '#888888', fontSize: '11px' }}>
                  {formatarData(subEtapa.data_finalizacao)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#cccccc', textAlign: 'center', padding: '20px' }}>
            Nenhuma sub-etapa concluída nos últimos 30 dias
          </p>
        )}
      </div>
    </div>
  );
};

export default HistoricoFuncionario;