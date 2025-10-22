import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ArrowRight, Clock } from 'lucide-react';

const AtualizarEtapa = ({ ternos, onUpdateTerno, user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const terno = ternos.find(t => t.id === parseInt(id));
  const [observacoes, setObservacoes] = useState('');

  if (!terno) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Terno não encontrado</h2>
          <Link to="/" className="btn-primary">Voltar ao Dashboard</Link>
        </div>
      </div>
    );
  }

  const etapas = [
    'Chegada do pedido',
    'Medição',
    'Corte',
    'Costura Calça',
    'Costura Paletó',
    'Caseado',
    'Travete',
    'Acabamento',
    'Revisão',
    'Finalização',
    'Finalizado'
  ];

  const etapaAtualIndex = etapas.indexOf(terno.etapaAtual);
  const proximaEtapa = etapas[etapaAtualIndex + 1];

  const funcionariosPorEtapa = {
    'Chegada do pedido': 'Recepção',
    'Medição': 'Alfaiate',
    'Corte': 'Cortador',
    'Costura Calça': 'João Silva',
    'Costura Paletó': 'João Silva',
    'Caseado': 'Maria Santos',
    'Travete': 'Pedro Costa',
    'Acabamento': 'Maria Santos',
    'Revisão': 'Supervisor',
    'Finalização': 'Pedro Costa',
    'Finalizado': 'Entregue'
  };

  const handleConcluirEtapa = () => {
    if (!proximaEtapa) {
      alert('Este terno já está na etapa final!');
      return;
    }

    const novoHistorico = [
      ...terno.historico,
      {
        etapa: proximaEtapa,
        funcionario: funcionariosPorEtapa[proximaEtapa],
        data: new Date().toISOString(),
        observacoes: observacoes
      }
    ];

    const updates = {
      etapaAtual: proximaEtapa,
      funcionarioAtual: funcionariosPorEtapa[proximaEtapa],
      historico: novoHistorico
    };

    // Atualizar status baseado no prazo
    const hoje = new Date();
    const prazo = new Date(terno.prazoEntrega);
    const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      updates.status = 'atrasado';
    } else if (diasRestantes <= 2) {
      updates.status = 'atencao';
    } else {
      updates.status = 'no-prazo';
    }

    onUpdateTerno(terno.id, updates);
    alert(`Etapa "${terno.etapaAtual}" concluída! Terno movido para "${proximaEtapa}"`);
    navigate('/');
  };

  const diasRestantes = Math.ceil((new Date(terno.prazoEntrega) - new Date()) / (1000 * 60 * 60 * 24));

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
            Atualizar Etapa
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            Terno #{terno.codigo} - {terno.cliente}
          </p>
        </div>
        
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>
            Informações do Terno
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Código:</strong> #{terno.codigo}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Cliente:</strong> {terno.cliente}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Tipo de Serviço:</strong> {terno.tipoServico}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Data de Entrada:</strong> {new Date(terno.dataEntrada).toLocaleDateString('pt-BR')}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Prazo de Entrega:</strong> 
            <span className={`status-${terno.status}`} style={{ marginLeft: '8px', fontWeight: '600' }}>
              {new Date(terno.prazoEntrega).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <strong>Dias Restantes:</strong>
            <span className={`status-${terno.status}`} style={{ marginLeft: '8px', fontWeight: '600' }}>
              <Clock size={16} style={{ marginRight: '4px' }} />
              {diasRestantes > 0 ? `${diasRestantes} dias` : `${Math.abs(diasRestantes)} dias atrasado`}
            </span>
          </div>
          {terno.observacoes && (
            <div>
              <strong>Observações:</strong>
              <p style={{ color: '#888', marginTop: '4px' }}>{terno.observacoes}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>
            Progresso da Etapa
          </h3>
          
          <div style={{ 
            background: '#2a2a2a', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Etapa Atual
            </div>
            <div style={{ 
              fontSize: '24px', 
              color: '#d4af37', 
              fontWeight: '700',
              marginBottom: '12px'
            }}>
              {terno.etapaAtual}
            </div>
            <div style={{ color: '#888' }}>
              Responsável: {terno.funcionarioAtual}
            </div>
          </div>

          {proximaEtapa && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '20px',
              color: '#888'
            }}>
              <span>{terno.etapaAtual}</span>
              <ArrowRight size={20} style={{ margin: '0 12px', color: '#d4af37' }} />
              <span style={{ color: '#d4af37', fontWeight: '600' }}>{proximaEtapa}</span>
            </div>
          )}

          <div className="input-group">
            <label>Observações da Etapa</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre esta etapa..."
              rows="3"
            />
          </div>

          {proximaEtapa ? (
            <button 
              onClick={handleConcluirEtapa}
              className="btn-primary" 
              style={{ 
                width: '100%', 
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle size={20} style={{ marginRight: '8px' }} />
              Concluir Etapa Atual
            </button>
          ) : (
            <div style={{ 
              background: '#1a2332', 
              padding: '16px', 
              borderRadius: '8px',
              textAlign: 'center',
              color: '#4ade80'
            }}>
              <CheckCircle size={24} style={{ marginBottom: '8px' }} />
              <p>Terno finalizado!</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>
          Histórico de Etapas
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Etapa</th>
                <th>Funcionário</th>
                <th>Data/Hora</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {terno.historico.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: '600' }}>{item.etapa}</td>
                  <td>{item.funcionario}</td>
                  <td>{new Date(item.data).toLocaleString('pt-BR')}</td>
                  <td style={{ color: '#888' }}>
                    {item.observacoes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AtualizarEtapa;