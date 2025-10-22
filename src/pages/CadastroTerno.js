import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, QrCode } from 'lucide-react';

const CadastroTerno = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [funcionarios, setFuncionarios] = useState([]);
  const [formData, setFormData] = useState({
    codigo: '',
    cliente: '',
    tipoServico: 'Produção',
    prazoEntrega: '',
    observacoes: '',
    funcionarioResponsavel: ''
  });

  useEffect(() => {
    if (user.tipo === 'admin') {
      carregarFuncionarios();
    }
  }, [user]);

  const carregarFuncionarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/funcionarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const funcionariosData = await response.json();
        // Filtrar apenas funcionários (não admin)
        const funcionariosFiltrados = funcionariosData.filter(f => f.tipo !== 'admin');
        setFuncionarios(funcionariosFiltrados);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.cliente || !formData.prazoEntrega) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    // Se for admin, deve selecionar funcionário
    if (user.tipo === 'admin' && !formData.funcionarioResponsavel) {
      alert('Por favor, selecione o funcionário responsável');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ternos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          // Se for admin, usar funcionário selecionado; senão, usar o próprio usuário
          funcionarioResponsavel: user.tipo === 'admin' ? formData.funcionarioResponsavel : user.nome
        })
      });
      
      if (response.ok) {
        alert('Terno cadastrado com sucesso!');
        navigate('/');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao cadastrar terno');
      }
    } catch (error) {
      console.error('Erro ao cadastrar terno:', error);
      alert('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const gerarCodigoAleatorio = () => {
    const codigo = Math.floor(Math.random() * 9000) + 1000;
    setFormData({ ...formData, codigo: codigo.toString() });
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
            {user && user.tipo === 'admin' ? 'Cadastrar Terno para Funcionário' : 'Cadastro de Terno'}
          </h1>
          <p style={{ color: '#cccccc', marginTop: '4px' }}>
            {user && user.tipo === 'admin' ? 'Registre um novo terno e atribua a um funcionário' : 'Registre um novo terno no sistema'}
          </p>
        </div>
        
        <Link to="/" className="btn-secondary">
          <ArrowLeft size={18} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="card">
          <div className="input-group">
            <label>Código de Circulação *</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                placeholder="Digite ou gere um código"
                required
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                onClick={gerarCodigoAleatorio}
                className="btn-secondary"
                style={{ padding: '12px' }}
              >
                Gerar
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                style={{ padding: '12px' }}
                title="Escanear QR Code"
              >
                <QrCode size={20} />
              </button>
            </div>
          </div>

          <div className="input-group">
            <label>Nome do Cliente *</label>
            <input
              type="text"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              placeholder="Digite o nome do cliente"
              required
            />
          </div>

          <div className="input-group">
            <label>Tipo de Serviço</label>
            <select
              name="tipoServico"
              value={formData.tipoServico}
              onChange={handleChange}
            >
              <option value="Produção">Produção (5 processos)</option>
              <option value="Ajuste">Ajuste (5 processos)</option>
              <option value="Paletó">Paletó (5 processos)</option>
              <option value="Reajuste">Reajuste (observações + foto)</option>
            </select>
          </div>

          {user.tipo === 'admin' && (
            <div className="input-group">
              <label>Funcionário Responsável *</label>
              <select
                name="funcionarioResponsavel"
                value={formData.funcionarioResponsavel}
                onChange={handleChange}
                required
              >
                <option value="">Selecione o funcionário...</option>
                {funcionarios.map(funcionario => (
                  <option key={funcionario.id} value={funcionario.nome}>
                    {funcionario.nome} - {funcionario.funcao}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="input-group">
            <label>Prazo de Entrega *</label>
            <input
              type="date"
              name="prazoEntrega"
              value={formData.prazoEntrega}
              onChange={handleChange}
              required

            />
          </div>

          <div className="input-group">
            <label>Observações</label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              placeholder="Observações adicionais sobre o terno..."
              rows="4"
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ 
              width: '100%', 
              fontSize: '18px', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            disabled={loading}
          >
            {loading ? (
              <div style={{ 
                width: '20px', 
                height: '20px', 
                border: '2px solid #333', 
                borderTop: '2px solid #fff', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                marginRight: '8px'
              }}></div>
            ) : (
              <Save size={20} style={{ marginRight: '8px' }} />
            )}
            {loading ? 'Salvando...' : 'Salvar e Iniciar Produção'}
          </button>
        </form>

        <div className="card" style={{ marginTop: '24px', background: '#111111' }}>
          <h3 style={{ color: '#ffffff', marginBottom: '12px' }}>ℹ️ Informações</h3>
          <p style={{ color: '#cccccc', lineHeight: '1.6' }}>
            {user && user.tipo === 'admin' ? (
              'Ao salvar, o terno será automaticamente registrado na etapa "Chegada do pedido" e atribuído ao funcionário selecionado.'
            ) : (
              'Ao salvar, o terno será automaticamente registrado na etapa "Chegada do pedido" e ficará disponível na linha de produção para os funcionários.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CadastroTerno;