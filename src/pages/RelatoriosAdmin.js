import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Activity, Download, ArrowLeft, Users, Target, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const RelatoriosAdmin = () => {
  const [dados, setDados] = useState({
    estatisticas: { total_ternos: 0, ternos_ativos: 0, ternos_finalizados: 0, ternos_atrasados: 0 },
    producaoPorDia: [],
    funcionarios: [],
    etapas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/relatorios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatórios');
      }
      
      const dadosReais = await response.json();
      
      // Garantir que os arrays existam mesmo se vazios
      setDados({
        estatisticas: dadosReais.estatisticas || { total_ternos: 0, ternos_ativos: 0, ternos_finalizados: 0, ternos_atrasados: 0 },
        producaoPorDia: dadosReais.producaoPorDia || [],
        funcionarios: dadosReais.funcionarios || [],
        etapas: dadosReais.etapas || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setLoading(false);
    }
  };



  const exportarRelatorio = () => {
    const dadosExport = {
      data_geracao: new Date().toLocaleString('pt-BR'),
      estatisticas: dados.estatisticas,
      producao_por_dia: dados.producaoPorDia,
      funcionarios: dados.funcionarios
    };
    
    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_producao_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };
  
  const gerarPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/relatorios/pdf', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_producao_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
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
        `}
      </style>
      
      <header style={{ 
        textAlign: 'center',
        marginBottom: '40px',
        padding: '30px 0',
        borderBottom: '3px solid #3B82F6',
        backgroundColor: '#1a1a1a',
        borderRadius: '10px'
      }}>
        <h1 style={{ 
          fontSize: '36px', 
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '10px'
        }}>
          📊 RELATÓRIO EMPRESARIAL
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#cccccc',
          marginBottom: '20px'
        }}>
          Sistema de Controle de Produção de Ternos
        </p>
        <p style={{ 
          fontSize: '14px', 
          color: '#888888'
        }}>
          Gerado em: {new Date().toLocaleString('pt-BR')}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '20px' }}>
          <button
            onClick={gerarPDF}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileText size={16} />
            Gerar PDF
          </button>
          <button
            onClick={exportarRelatorio}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} />
            Exportar JSON
          </button>
          <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Voltar
          </Link>
        </div>
      </header>

      {/* AVISO QUANDO NÃO HÁ DADOS */}
      {dados.estatisticas.total_ternos === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          backgroundColor: '#2a2a2a',
          borderRadius: '10px',
          border: '2px solid #F59E0B',
          marginBottom: '30px'
        }}>
          <h3 style={{ color: '#F59E0B', fontSize: '20px', marginBottom: '10px' }}>
            📊 RELATÓRIO VAZIO
          </h3>
          <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '10px' }}>
            Ainda não há ternos cadastrados no sistema.
          </p>
          <p style={{ color: '#888888', fontSize: '14px' }}>
            Para ver os relatórios, cadastre alguns ternos e atualize as etapas de produção.
          </p>
        </div>
      )}

      {/* RESUMO GERAL */}
      <div className="card" style={{ marginBottom: '40px', backgroundColor: '#1a1a1a' }}>
        <h2 style={{ 
          color: '#3B82F6', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #3B82F6',
          paddingBottom: '10px'
        }}>
          📈 RESUMO GERAL DA PRODUÇÃO
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px'
        }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #3B82F6'
          }}>
            <Activity size={40} style={{ color: '#3B82F6', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>TOTAL DE TERNOS</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {dados.estatisticas.total_ternos}
            </p>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #F59E0B'
          }}>
            <Clock size={40} style={{ color: '#F59E0B', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>EM PRODUÇÃO</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#F59E0B' }}>
              {dados.estatisticas.ternos_ativos}
            </p>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #10B981'
          }}>
            <CheckCircle size={40} style={{ color: '#10B981', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>FINALIZADOS</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
              {dados.estatisticas.ternos_finalizados}
            </p>
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #EF4444'
          }}>
            <AlertTriangle size={40} style={{ color: '#EF4444', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>ATRASADOS</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#EF4444' }}>
              {dados.estatisticas.ternos_atrasados}
            </p>
          </div>
        </div>
      </div>

      {/* PRODUÇÃO DIÁRIA */}
      <div className="card" style={{ marginBottom: '40px', backgroundColor: '#1a1a1a' }}>
        <h2 style={{ 
          color: '#10B981', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #10B981',
          paddingBottom: '10px'
        }}>
          📅 PRODUÇÃO DOS ÚLTIMOS 7 DIAS
        </h2>
        
        {dados.producaoPorDia && dados.producaoPorDia.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
            gap: '15px',
            textAlign: 'center'
          }}>
            {dados.producaoPorDia.map((dia, index) => (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#2a2a2a',
                borderRadius: '10px',
                border: '2px solid #10B981'
              }}>
                <p style={{ color: '#cccccc', fontSize: '14px', marginBottom: '5px' }}>{dia.data}</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{dia.ternos}</p>
                <p style={{ color: '#888888', fontSize: '12px' }}>ternos</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px dashed #666666'
          }}>
            <p style={{ color: '#888888', fontSize: '18px' }}>📊 Nenhum terno cadastrado ainda</p>
            <p style={{ color: '#666666', fontSize: '14px' }}>Os dados aparecerão aqui quando os ternos forem cadastrados</p>
          </div>
        )}
        
        {dados.producaoPorDia && dados.producaoPorDia.length > 0 && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px'
          }}>
            <p style={{ color: '#cccccc', fontSize: '16px' }}>TOTAL DA SEMANA:</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#10B981' }}>
              {dados.producaoPorDia.reduce((total, dia) => total + dia.ternos, 0)} ternos
            </p>
          </div>
        )}
      </div>

      {/* ETAPAS DE PRODUÇÃO */}
      <div className="card" style={{ marginBottom: '40px', backgroundColor: '#1a1a1a' }}>
        <h2 style={{ 
          color: '#F59E0B', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #F59E0B',
          paddingBottom: '10px'
        }}>
          ⚙️ TERNOS POR ETAPA DE PRODUÇÃO
        </h2>
        
        {dados.etapas && dados.etapas.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px'
          }}>
            {dados.etapas.map((etapa, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '25px',
                backgroundColor: '#2a2a2a',
                borderRadius: '10px',
                border: '2px solid #F59E0B'
              }}>
                <Target size={40} style={{ color: '#F59E0B', marginBottom: '10px' }} />
                <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>{etapa.etapa_atual}</p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B' }}>{etapa.quantidade}</p>
                <p style={{ color: '#888888', fontSize: '12px' }}>ternos</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px dashed #666666'
          }}>
            <p style={{ color: '#888888', fontSize: '18px' }}>⚙️ Nenhum terno em produção</p>
            <p style={{ color: '#666666', fontSize: '14px' }}>As etapas aparecerão aqui quando houver ternos em produção</p>
          </div>
        )}
      </div>

      {/* FUNCIONÁRIOS */}
      <div className="card" style={{ marginBottom: '40px', backgroundColor: '#1a1a1a' }}>
        <h2 style={{ 
          color: '#8B5CF6', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #8B5CF6',
          paddingBottom: '10px'
        }}>
          👥 PRODUTIVIDADE DOS FUNCIONÁRIOS
        </h2>
        
        {dados.funcionarios && dados.funcionarios.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '20px'
          }}>
            {dados.funcionarios.filter(f => f.concluidas > 0).map((funcionario, index) => (
              <div key={index} style={{
                textAlign: 'center',
                padding: '25px',
                backgroundColor: '#2a2a2a',
                borderRadius: '10px',
                border: '2px solid #8B5CF6'
              }}>
                <Users size={40} style={{ color: '#8B5CF6', marginBottom: '10px' }} />
                <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {funcionario.nome}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#8B5CF6' }}>
                  {funcionario.concluidas}
                </p>
                <p style={{ color: '#888888', fontSize: '12px' }}>ternos produzidos</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px dashed #666666'
          }}>
            <p style={{ color: '#888888', fontSize: '18px' }}>👥 Nenhuma atividade registrada</p>
            <p style={{ color: '#666666', fontSize: '14px' }}>A produtividade aparecerá aqui quando os funcionários trabalharem nos ternos</p>
          </div>
        )}
      </div>

      {/* INDICADORES CHAVE */}
      <div className="card" style={{ backgroundColor: '#1a1a1a' }}>
        <h2 style={{ 
          color: '#EF4444', 
          fontSize: '24px', 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #EF4444',
          paddingBottom: '10px'
        }}>
          🎯 INDICADORES CHAVE DE PERFORMANCE
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '25px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #10B981'
          }}>
            <CheckCircle size={40} style={{ color: '#10B981', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>TAXA DE CONCLUSÃO</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>
              {dados.estatisticas.total_ternos ? 
                Math.round((dados.estatisticas.ternos_finalizados / dados.estatisticas.total_ternos) * 100) : 0}%
            </p>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '25px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #8B5CF6'
          }}>
            <Users size={40} style={{ color: '#8B5CF6', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>FUNCIONÁRIOS ATIVOS</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B5CF6' }}>
              {dados.funcionarios.length}
            </p>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '25px',
            backgroundColor: '#2a2a2a',
            borderRadius: '10px',
            border: '2px solid #F59E0B'
          }}>
            <TrendingUp size={40} style={{ color: '#F59E0B', marginBottom: '10px' }} />
            <p style={{ color: '#cccccc', fontSize: '16px', marginBottom: '5px' }}>PRODUÇÃO MÉDIA/DIA</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#F59E0B' }}>
              {dados.producaoPorDia && dados.producaoPorDia.length > 0 ? 
                Math.round(dados.producaoPorDia.reduce((acc, curr) => acc + curr.ternos, 0) / dados.producaoPorDia.length) : 0}
            </p>
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          marginTop: '30px',
          padding: '25px',
          backgroundColor: dados.estatisticas.ternos_atrasados > 0 ? '#2a1a1a' : '#1a2a1a',
          borderRadius: '10px',
          border: dados.estatisticas.ternos_atrasados > 0 ? '2px solid #EF4444' : '2px solid #10B981'
        }}>
          <p style={{ color: '#cccccc', fontSize: '18px', marginBottom: '10px' }}>STATUS GERAL:</p>
          <p style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: dados.estatisticas.ternos_atrasados > 0 ? '#EF4444' : '#10B981'
          }}>
            {dados.estatisticas.ternos_atrasados > 0 ? 
              `⚠️ ATENÇÃO: ${dados.estatisticas.ternos_atrasados} ternos atrasados` : 
              '✅ PRODUÇÃO EM DIA'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosAdmin;