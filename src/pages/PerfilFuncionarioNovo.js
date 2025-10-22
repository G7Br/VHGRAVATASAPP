import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Briefcase, ArrowLeft, Edit, Camera } from 'lucide-react';

const PerfilFuncionario = () => {
  const [funcionario, setFuncionario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      setIsAdmin(user.tipo === 'admin');
      
      const response = await fetch(`http://localhost:3002/api/funcionarios/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFuncionario(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setLoading(false);
    }
  };

  const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return 'N/A';
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  const calcularTempoEmpresa = (dataAdmissao) => {
    if (!dataAdmissao) return 'N/A';
    const hoje = new Date();
    const admissao = new Date(dataAdmissao);
    const anos = hoje.getFullYear() - admissao.getFullYear();
    const meses = hoje.getMonth() - admissao.getMonth();
    
    let totalMeses = anos * 12 + meses;
    if (hoje.getDate() < admissao.getDate()) {
      totalMeses--;
    }
    
    const anosCompletos = Math.floor(totalMeses / 12);
    const mesesRestantes = totalMeses % 12;
    
    if (anosCompletos > 0 && mesesRestantes > 0) {
      return `${anosCompletos} ano${anosCompletos > 1 ? 's' : ''} e ${mesesRestantes} mês${mesesRestantes > 1 ? 'es' : ''}`;
    } else if (anosCompletos > 0) {
      return `${anosCompletos} ano${anosCompletos > 1 ? 's' : ''}`;
    } else {
      return `${mesesRestantes} mês${mesesRestantes > 1 ? 'es' : ''}`;
    }
  };

  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
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

  if (!funcionario) {
    return (
      <div className="container" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#cccccc' }}>Erro ao carregar perfil</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
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
            <User size={32} style={{ color: '#3B82F6' }} />
            Meu Perfil
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin && (
            <Link to="/gerenciar-funcionarios" className="btn-secondary" style={{ textDecoration: 'none' }}>
              <Edit size={16} style={{ marginRight: '8px' }} />
              Gerenciar Funcionários
            </Link>
          )}
          <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Voltar
          </Link>
        </div>
      </header>

      {/* Card do Perfil */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '32px' }}>
        {/* Foto do Funcionário */}
        <div style={{ marginBottom: '24px' }}>
          {funcionario.foto ? (
            <img 
              src={funcionario.foto} 
              alt={funcionario.nome}
              style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '4px solid #3B82F6',
                margin: '0 auto'
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#333333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              border: '4px solid #3B82F6'
            }}>
              <User size={48} style={{ color: '#cccccc' }} />
            </div>
          )}
        </div>

        {/* Nome e Função */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            {funcionario.nome}
          </h2>
          <p style={{ color: '#3B82F6', fontSize: '18px', fontWeight: '500' }}>
            {funcionario.funcao || 'Funcionário'}
          </p>
        </div>

        {/* Informações Pessoais */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '24px',
          textAlign: 'left'
        }}>
          {/* Coluna 1 - Informações Pessoais */}
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              📋 Informações Pessoais
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={16} style={{ color: '#3B82F6' }} />
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Data de Nascimento</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {formatarData(funcionario.data_nascimento)}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#3B82F6' }}>🎂</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Idade</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {calcularIdade(funcionario.data_nascimento)} anos
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#3B82F6' }}>👤</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Sexo</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {funcionario.sexo || 'N/A'}
              </p>
            </div>
          </div>

          {/* Coluna 2 - Informações Profissionais */}
          <div>
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              💼 Informações Profissionais
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Briefcase size={16} style={{ color: '#3B82F6' }} />
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Função</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {funcionario.funcao || 'N/A'}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={16} style={{ color: '#3B82F6' }} />
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Data de Admissão</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {formatarData(funcionario.data_admissao)}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#3B82F6' }}>⏰</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Tempo na Empresa</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {calcularTempoEmpresa(funcionario.data_admissao)}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#3B82F6' }}>🔑</span>
                <span style={{ color: '#ffffff', fontWeight: '500' }}>Usuário</span>
              </div>
              <p style={{ color: '#cccccc', marginLeft: '24px' }}>
                {funcionario.username}
              </p>
            </div>
          </div>
        </div>

        {/* Nota para funcionários */}
        {!isAdmin && (
          <div style={{ 
            marginTop: '32px', 
            padding: '16px', 
            backgroundColor: '#333333', 
            borderRadius: '8px',
            border: '1px solid #444444'
          }}>
            <p style={{ color: '#cccccc', fontSize: '14px', textAlign: 'center' }}>
              ℹ️ Para alterar suas informações pessoais, entre em contato com o administrador
            </p>
          </div>
        )}
      </div>

      {/* Estatísticas e Histórico (se for funcionário) */}
      {!isAdmin && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
              📊 Minhas Estatísticas
            </h3>
            <Link to={`/funcionario/${funcionario.id}/historico`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
              📈 Ver Histórico Completo
            </Link>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '16px',
            textAlign: 'center'
          }}>
            <div style={{ padding: '16px', backgroundColor: '#333333', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3B82F6', marginBottom: '4px' }}>
                0
              </div>
              <p style={{ fontSize: '12px', color: '#cccccc' }}>Ternos Finalizados</p>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#333333', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginBottom: '4px' }}>
                0
              </div>
              <p style={{ fontSize: '12px', color: '#cccccc' }}>Etapas Concluídas</p>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#333333', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#F59E0B', marginBottom: '4px' }}>
                0h
              </div>
              <p style={{ fontSize: '12px', color: '#cccccc' }}>Tempo Médio</p>
            </div>
          </div>
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ color: '#cccccc', fontSize: '12px' }}>
              📅 Dados dos últimos 30 dias - Clique em "Ver Histórico Completo" para detalhes
            </p>
          </div>
        </div>
      )}
      
      {/* Link para histórico se for admin */}
      {isAdmin && (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
            📈 Histórico de Produção
          </h3>
          <p style={{ color: '#cccccc', marginBottom: '16px' }}>
            Como administrador, você pode ver o histórico de qualquer funcionário
          </p>
          <Link to={`/funcionario/${funcionario.id}/historico`} className="btn-primary">
            Ver Meu Histórico
          </Link>
        </div>
      )}
    </div>
  );
};

export default PerfilFuncionario;