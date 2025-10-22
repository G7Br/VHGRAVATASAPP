import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';

const SubEtapasWeb = () => {
  const { id } = useParams();
  const [terno, setTerno] = useState(null);
  const [subEtapas, setSubEtapas] = useState([]);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [foto, setFoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp && payload.exp < now) {
          console.log('⚠️ Token expirado, redirecionando para login');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        
        setUsuarioLogado(payload.nome);
        console.log('✅ Usuário logado:', payload.nome);
      } catch (error) {
        console.error('❌ Erro ao decodificar token:', error);
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else {
      console.log('❌ Token não encontrado, redirecionando para login');
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    carregarTerno();
  }, [id]);

  const carregarTerno = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔄 Carregando terno ID:', id);
      console.log('🔑 Token:', token ? 'Presente' : 'Ausente');
      
      const response = await fetch('http://localhost:3002/api/ternos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 Status da resposta:', response.status, response.statusText);
      
      if (response.ok) {
        const ternos = await response.json();
        const ternoEncontrado = ternos.find(t => t.id === parseInt(id));
        
        if (ternoEncontrado) {
          console.log('✅ Terno encontrado:', ternoEncontrado);
          setTerno(ternoEncontrado);
          
          const subResponse = await fetch(`http://localhost:3002/api/ternos/${id}/sub-etapas`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (subResponse.ok) {
            const subEtapasData = await subResponse.json();
            console.log('✅ Sub-etapas carregadas:', subEtapasData);
            setSubEtapas(subEtapasData);
            
            // Encontrar primeira etapa pendente
            const primeiraEtapaPendente = subEtapasData.findIndex(sub => sub.status === 'pendente');
            if (primeiraEtapaPendente !== -1) {
              setEtapaAtual(primeiraEtapaPendente);
            }
          } else {
            console.error('❌ Erro ao carregar sub-etapas:', subResponse.status);
          }
        } else {
          console.error('❌ Terno não encontrado');
        }
      } else {
        console.error('❌ Erro ao carregar ternos:', response.status);
      }
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao carregar terno:', error);
      setLoading(false);
    }
  };

  const updateSubEtapa = async (subEtapaItem, status, foto) => {
    try {
      const token = localStorage.getItem('token');
      const subEtapaNome = subEtapaItem.subEtapa || subEtapaItem.sub_etapa;
      
      console.log('🔄 Atualizando sub-etapa:', {
        id: subEtapaItem.id,
        nome: subEtapaNome,
        status,
        foto: foto ? 'Sim' : 'Não'
      });
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      let response;
      let url;
      let body;
      
      if (subEtapaItem.id) {
        // Atualizar por ID (método preferido)
        url = `http://localhost:3002/api/sub-etapas/${subEtapaItem.id}`;
        body = {
          status,
          observacoes,
          foto: foto || ''
        };
      } else {
        // Fallback: atualizar por nome
        url = `http://localhost:3002/api/ternos/${terno.id}/sub-etapa`;
        body = {
          subEtapa: subEtapaNome,
          status,
          observacoes,
          foto: foto || ''
        };
      }
      
      console.log('📤 Fazendo requisição para:', url);
      console.log('📦 Dados:', body);
      
      response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      
      console.log('📊 Resposta recebida:', response.status, response.statusText);
      
      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      console.log('✅ Sub-etapa atualizada:', result);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar sub-etapa:', error);
      alert(`Erro ao atualizar sub-etapa: ${error.message}`);
      throw error;
    }
  };

  const finalizarTerno = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!terno || !terno.id) {
        alert('Erro: Terno não encontrado');
        return;
      }
      
      console.log('🏁 Finalizando terno ID:', terno.id);
      console.log('📝 Observações:', observacoes);
      console.log('🔗 URL:', `http://localhost:3002/api/ternos/${terno.id}/finalizar`);
      
      // Primeiro, verificar se o terno ainda existe
      const checkResponse = await fetch(`http://localhost:3002/api/ternos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (checkResponse.ok) {
        const ternos = await checkResponse.json();
        const ternoExiste = ternos.find(t => t.id === terno.id);
        
        if (!ternoExiste) {
          alert('Erro: Terno não encontrado no sistema');
          return;
        }
        
        console.log('✅ Terno confirmado no sistema:', ternoExiste);
      }
      
      const response = await fetch(`http://localhost:3002/api/ternos/${terno.id}/finalizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ observacoes })
      });
      
      console.log('📊 Status finalização:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Terno finalizado:', result);
        alert('Terno finalizado com sucesso!');
        window.location.href = '/';
      } else {
        let errorMessage = `Erro HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        console.error('❌ Erro ao finalizar:', errorMessage);
        alert(`Erro ao finalizar terno: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Erro ao finalizar terno:', error);
      alert(`Erro ao finalizar terno: ${error.message}`);
    }
  };

  const handleFotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Verificar tamanho do arquivo
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Imagem muito grande. Máximo 5MB permitido.');
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('foto', file);
        
        console.log('📤 Fazendo upload da foto...');
        
        const response = await fetch('http://localhost:3002/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Foto enviada:', result.url);
          setFoto(result.url);
        } else {
          console.error('❌ Erro no upload:', response.status);
          alert('Erro ao enviar foto. Tente novamente.');
        }
      } catch (error) {
        console.error('❌ Erro no upload:', error);
        alert('Erro ao enviar foto. Verifique sua conexão.');
      }
    }
  };

  const proximaEtapa = async () => {
    const etapaAtualItem = subEtapas[etapaAtual];
    const isUltimaEtapa = etapaAtual === subEtapas.length - 1;
    const subEtapaNome = etapaAtualItem.subEtapa || etapaAtualItem.sub_etapa;
    const isReajuste = subEtapaNome === 'Reajuste';
    
    console.log('🚀 Avançando etapa:', {
      etapaAtual,
      subEtapaNome,
      isUltimaEtapa,
      isReajuste,
      temFoto: !!foto
    });
    
    // Foto obrigatória apenas na última etapa ou reajuste
    if ((isUltimaEtapa || isReajuste) && !foto) {
      alert('É necessário adicionar uma foto antes de finalizar.');
      return;
    }
    
    try {
      // Atualizar sub-etapa no backend
      await updateSubEtapa(etapaAtualItem, 'finalizada', foto);
      
      // Atualizar estado local
      const updated = [...subEtapas];
      updated[etapaAtual] = {
        ...updated[etapaAtual],
        status: 'finalizada',
        data_finalizacao: new Date().toISOString(),
        funcionario: usuarioLogado,
        observacoes,
        foto: foto || ''
      };
      setSubEtapas(updated);
      
      // Verificar se todas as sub-etapas foram finalizadas
      const todasFinalizadas = updated.every(sub => sub.status === 'finalizada');
      
      if (todasFinalizadas) {
        console.log('🏁 Todas as sub-etapas finalizadas! Finalizando terno automaticamente...');
        await finalizarTerno();
      } else {
        console.log('➡️ Avançando para próxima etapa');
        setEtapaAtual(etapaAtual + 1);
        setFoto(null);
        setObservacoes('');
      }
    } catch (error) {
      console.error('❌ Erro ao avançar etapa:', error);
      // Não avançar se houver erro
    }
  };

  const etapaAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
      setFoto(null);
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

  if (!terno) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#ffffff' }}>Terno não encontrado</h2>
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
            Sub-etapas - Terno #{terno.codigo}
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            {terno.cliente} - {terno.tipoServico || terno.tipo_servico}
          </p>
        </div>
        
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      <div className="card">
        {subEtapas.length > 0 ? (
          <>
            {/* Progresso */}
            <div style={{ marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#cccccc', fontSize: '14px' }}>Progresso</span>
                <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
                  {etapaAtual + 1} de {subEtapas.length}
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#333333', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${((etapaAtual + 1) / subEtapas.length) * 100}%`,
                  height: '100%',
                  backgroundColor: '#3B82F6',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Etapa Atual */}
            <div style={{
              background: '#1a1a1a',
              padding: '30px',
              borderRadius: '12px',
              border: '2px solid #3B82F6',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ 
                color: '#ffffff', 
                fontSize: '24px', 
                marginBottom: '20px',
                fontWeight: 'bold'
              }}>
                {subEtapas[etapaAtual]?.subEtapa || subEtapas[etapaAtual]?.sub_etapa}
              </h2>
              
              {/* Foto obrigatória no último processo ou Reajuste */}
              {(etapaAtual === subEtapas.length - 1 || 
                (subEtapas[etapaAtual]?.subEtapa || subEtapas[etapaAtual]?.sub_etapa) === 'Reajuste') && (
                <div style={{ marginBottom: '20px' }}>
                  <label className="btn-secondary" style={{ 
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '12px 20px',
                    backgroundColor: foto ? '#10B981' : '#EF4444',
                    color: '#ffffff',
                    fontSize: '16px'
                  }}>
                    <Camera size={20} style={{ marginRight: '8px' }} />
                    {foto ? '📷 Foto Adicionada' : '📷 Foto Obrigatória'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  
                  {foto && (
                    <div style={{ marginTop: '15px' }}>
                      <img 
                        src={foto} 
                        alt="Foto da etapa"
                        style={{ 
                          width: '200px', 
                          height: '150px', 
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #10B981'
                        }}
                        onError={(e) => {
                          console.error('❌ Erro ao carregar imagem:', foto);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              
              {/* Área de observações para Reajuste */}
              {(subEtapas[etapaAtual]?.subEtapa || subEtapas[etapaAtual]?.sub_etapa) === 'Reajuste' && (
                <div style={{ marginBottom: '20px' }}>
                  <textarea
                    placeholder="Observações do reajuste..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '15px',
                      borderRadius: '8px',
                      border: '2px solid #333333',
                      backgroundColor: '#222222',
                      color: '#ffffff',
                      fontSize: '16px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Navegação */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              gap: '20px'
            }}>
              <button 
                onClick={etapaAnterior}
                disabled={etapaAtual === 0}
                className="btn-secondary"
                style={{ 
                  padding: '15px 25px',
                  fontSize: '16px',
                  opacity: etapaAtual === 0 ? 0.5 : 1,
                  cursor: etapaAtual === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Anterior
              </button>
              
              <button 
                onClick={proximaEtapa}
                className="btn-primary"
                style={{ 
                  padding: '15px 25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  flex: 1,
                  maxWidth: '300px'
                }}
              >
                Concluir Etapa ✓
              </button>
            </div>
            
            {/* Informação sobre finalização automática */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#1a1a1a',
              border: '2px solid #10B981',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px' }}>
                ℹ️ O terno será finalizado automaticamente quando todas as etapas forem concluídas
              </p>
              <p style={{ color: '#10B981', margin: '0', fontSize: '16px', fontWeight: 'bold' }}>
                {subEtapas.filter(sub => sub.status === 'finalizada').length}/{subEtapas.length} etapas concluídas
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#cccccc', fontSize: '18px' }}>Nenhuma sub-etapa encontrada para este terno.</p>
            <p style={{ fontSize: '14px', color: '#888888' }}>As sub-etapas são criadas automaticamente quando o terno é cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubEtapasWeb;