import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Filter, Search } from 'lucide-react';

const LinhaProducao = ({ user }) => {
  const [ternos, setTernos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    etapa: '',
    funcionario: '',
    status: '',
    busca: ''
  });

  useEffect(() => {
    carregarTernos();
  }, []);

  const carregarTernos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ternos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTernos(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar ternos:', error);
      setLoading(false);
    }
  };

  // Filtrar ternos baseado no tipo de usuário
  const ternosDoUsuario = user && user.tipo !== 'admin' 
    ? ternos.filter(t => t.funcionario_atual === user.nome)
    : ternos;
  
  const ternosAtivos = ternosDoUsuario.filter(t => t.etapa_atual !== 'Finalizado');
  const ternosFinalizados = ternosDoUsuario.filter(t => t.etapa_atual === 'Finalizado');

  const ternosFiltrados = ternosAtivos.filter(terno => {
    const matchEtapa = !filtros.etapa || terno.etapa_atual === filtros.etapa;
    const matchFuncionario = !filtros.funcionario || terno.funcionario_atual === filtros.funcionario;
    const matchStatus = !filtros.status || terno.status === filtros.status;
    const matchBusca = !filtros.busca || 
      terno.codigo.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      terno.cliente.toLowerCase().includes(filtros.busca.toLowerCase());
    
    return matchEtapa && matchFuncionario && matchStatus && matchBusca;
  });

  const etapas = [...new Set(ternosAtivos.map(t => t.etapa_atual))];
  const funcionarios = [...new Set(ternosAtivos.map(t => t.funcionario_atual))];
  
  // Mapear funcionários por etapa
  const getFuncionarioByEtapa = (etapa) => {
    const funcionarioMap = {
      'Medição': 'João Alfaiate',
      'Corte': 'Pedro Cortador',
      'Costura Calça': 'Maria Costureira',
      'Costura Paletó': 'Ana Costureira',
      'Caseado': 'Carlos Caseador',
      'Travete': 'José Traveteiro',
      'Acabamento': 'Lucia Acabamento',
      'Revisão': 'Supervisor Geral',
      'Finalização': 'Equipe Final'
    };
    return funcionarioMap[etapa] || 'Funcionário';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'no-prazo': return '✅';
      case 'atencao': return '⚠️';
      case 'atrasado': return '❌';
      default: return '⏳';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'no-prazo': return 'No prazo';
      case 'atencao': return 'Atenção';
      case 'atrasado': return 'Atrasado';
      default: return 'Pendente';
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
            {user && user.tipo === 'admin' ? 'Linha de Produção Completa' : 'Meus Ternos'}
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            {user && user.tipo === 'admin' 
              ? `${ternosFiltrados.length} de ${ternosAtivos.length} ternos ativos`
              : `${ternosFiltrados.length} de ${ternosAtivos.length} seus ternos ativos`
            }
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={carregarTernos}
            className="btn-secondary"
            disabled={loading}
          >
            {loading ? 'Carregando...' : '🔄 Atualizar'}
          </button>
          <Link to="/" className="btn-secondary">
            <ArrowLeft size={18} style={{ marginRight: '8px' }} />
            Voltar
          </Link>
        </div>
      </header>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <Filter size={20} style={{ marginRight: '8px' }} />
          Filtros
        </h3>
        
        <div className="filters">
          <div className="filter-item">
            <label>Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#cccccc'
              }} />
              <input
                type="text"
                placeholder="Código ou cliente..."
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <div className="filter-item">
            <label>Etapa</label>
            <select
              value={filtros.etapa}
              onChange={(e) => setFiltros({...filtros, etapa: e.target.value})}
            >
              <option value="">Todas as etapas</option>
              {etapas.map(etapa => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Funcionário</label>
            <select
              value={filtros.funcionario}
              onChange={(e) => setFiltros({...filtros, funcionario: e.target.value})}
            >
              <option value="">Todos os funcionários</option>
              {funcionarios.map(funcionario => (
                <option key={funcionario} value={funcionario}>{funcionario}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>Status</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
            >
              <option value="">Todos os status</option>
              <option value="no-prazo">No prazo</option>
              <option value="atencao">Atenção</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: PEDIDOS EM ANDAMENTO */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '16px', borderBottom: '2px solid #333333', paddingBottom: '8px' }}>
          📋 {user && user.tipo === 'admin' ? 'Pedidos em Andamento' : 'Seus Pedidos em Andamento'} ({ternosFiltrados.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Etapa Atual</th>
                <th>Alfaiate/Funcionário</th>
                <th>Status</th>
                <th>Prazo</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ternosFiltrados.map(terno => (
                <tr key={terno.id}>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>
                    #{terno.codigo}
                  </td>
                  <td style={{ color: '#ffffff' }}>{terno.cliente}</td>
                  <td style={{ color: '#ffffff' }}>{terno.etapa_atual}</td>
                  <td style={{ color: '#ffffff', fontWeight: '600' }}>
                    {terno.funcionario_atual}
                  </td>
                  <td>
                    <span className={`status-${terno.status}`} style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontWeight: '600'
                    }}>
                      {getStatusIcon(terno.status)} {getStatusText(terno.status)}
                    </span>
                  </td>
                  <td className={`status-${terno.status}`} style={{ fontWeight: '600' }}>
                    {new Date(terno.prazo_entrega).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <span style={{ 
                      background: '#333333', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#ffffff'
                    }}>
                      {terno.tipo_servico}
                    </span>
                  </td>
                  <td>
                    <Link 
                      to={`/sub-etapas/${terno.id}`} 
                      className="btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      Ver Sub-etapas
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ternosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cccccc' }}>
            <p>Nenhum terno em andamento.</p>
          </div>
        )}
      </div>

      {/* SEÇÃO 2: PEDIDOS CONCLUÍDOS */}
      <div className="card">
        <h3 style={{ color: '#ffffff', marginBottom: '16px', borderBottom: '2px solid #333333', paddingBottom: '8px' }}>
          ✅ {user && user.tipo === 'admin' ? 'Pedidos Concluídos' : 'Seus Pedidos Concluídos'} ({ternosFinalizados.length})
        </h3>
        
        {ternosFinalizados.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {ternosFinalizados.map(terno => (
              <div key={terno.id} style={{
                background: '#333333',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid #444444'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '4px' }}>
                      Terno #{terno.codigo} - {terno.cliente}
                    </h4>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <span style={{ 
                        background: '#111111', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#ffffff'
                      }}>
                        {terno.tipo_servico}
                      </span>
                      <span style={{ color: '#cccccc', fontSize: '14px' }}>
                        Finalizado: {terno.updated_at ? new Date(terno.updated_at).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>
                  <span style={{ 
                    color: '#ffffff',
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    ✅ Concluído
                  </span>
                </div>

                {/* FUNCIONÁRIOS E FOTOS */}
                <div style={{ marginTop: '16px' }}>
                  <h5 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '14px' }}>
                    👥 Funcionários que trabalharam:
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {/* Simular funcionários - substitua pela consulta real */}
                    {[
                      { nome: 'João Alfaiate', etapa: 'PROCESSO 1 Corte', foto: '/path/to/photo1.jpg' },
                      { nome: 'Maria Costureira', etapa: 'PROCESSO 2 Andamento', foto: '/path/to/photo2.jpg' },
                      { nome: 'Pedro Finalizador', etapa: 'PROCESSO 5 Finalização', foto: '/path/to/photo3.jpg' }
                    ].map((func, index) => (
                      <div key={index} style={{
                        background: '#222222',
                        padding: '12px',
                        borderRadius: '6px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          background: '#444444',
                          borderRadius: '50%',
                          margin: '0 auto 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px'
                        }}>
                          👤
                        </div>
                        <p style={{ color: '#ffffff', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                          {func.nome}
                        </p>
                        <p style={{ color: '#cccccc', fontSize: '10px', marginBottom: '8px' }}>
                          {func.etapa}
                        </p>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => alert('Visualizar foto de ' + func.nome)}
                        >
                          📷 Ver Foto
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AÇÕES */}
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <Link 
                    to={`/sub-etapas/${terno.id}`} 
                    className="btn-secondary" 
                    style={{ padding: '8px 16px', fontSize: '12px', textDecoration: 'none', marginRight: '8px' }}
                  >
                    📋 Ver Detalhes
                  </Link>
                  <button 
                    className="btn-primary" 
                    style={{ padding: '8px 16px', fontSize: '12px' }}
                    onClick={() => alert('Gerar relatório completo')}
                  >
                    📄 Relatório
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#cccccc' }}>
            <p>Nenhum terno finalizado ainda.</p>
          </div>
        )}
      </div>

      {user && user.tipo === 'admin' && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/cadastro" className="btn-primary">
            Cadastrar Novo Terno
          </Link>
        </div>
      )}
    </div>
  );
};

export default LinhaProducao;