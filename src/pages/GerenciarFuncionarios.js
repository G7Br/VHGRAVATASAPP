import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Edit, Trash2, ArrowLeft, User, Calendar, Briefcase, Camera } from 'lucide-react';

const GerenciarFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nome: '',
    data_nascimento: '',
    sexo: 'Masculino',
    funcao: 'Alfaiate',
    data_admissao: '',
    foto: ''
  });
  const [fotoFile, setFotoFile] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/funcionarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.status === 401 || response.status === 403) {
        // Token inválido, redirecionar para login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }
      
      const data = await response.json();
      setFuncionarios(data);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      setLoading(false);
    }
  };

  const calcularIdade = (dataNascimento) => {
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

  const handleFotoUpload = async (file) => {
    if (!file) return null;
    
    console.log('Starting photo upload:', file.name);
    setUploadingFoto(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Token não encontrado. Faça login novamente.');
        return null;
      }
      
      const formDataUpload = new FormData();
      formDataUpload.append('foto', file);
      
      console.log('Sending upload request...');
      const response = await fetch('http://localhost:3002/api/admin/funcionarios/upload-foto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      
      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data.url);
        return data.url;
      } else {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          alert(error.error || 'Erro ao fazer upload da foto');
        } catch {
          alert('Erro ao fazer upload da foto: ' + errorText);
        }
        return null;
      }
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro de conexão ao fazer upload da foto: ' + error.message);
      return null;
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let fotoUrl = formData.foto;
      
      // Se há uma nova foto para upload
      if (fotoFile) {
        fotoUrl = await handleFotoUpload(fotoFile);
        if (!fotoUrl) return; // Se falhou o upload, não continua
      }
      
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `http://localhost:3002/api/admin/funcionarios/${editingUser.id}`
        : 'http://localhost:3002/api/admin/funcionarios';
      
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { ...formData, foto: fotoUrl, password: undefined } // Não enviar senha na edição
        : { ...formData, foto: fotoUrl };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingUser(null);
        setFormData({
          username: '',
          password: '',
          nome: '',
          data_nascimento: '',
          sexo: 'Masculino',
          funcao: 'Alfaiate',
          data_admissao: '',
          foto: ''
        });
        setFotoFile(null);
        carregarFuncionarios();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      alert('Erro ao salvar funcionário');
    }
  };

  const handleEdit = (funcionario) => {
    setEditingUser(funcionario);
    setFormData({
      username: funcionario.username,
      password: '',
      nome: funcionario.nome,
      data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
      sexo: funcionario.sexo || 'Masculino',
      funcao: funcionario.funcao || 'Alfaiate',
      data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : '',
      foto: funcionario.foto || ''
    });
    setFotoFile(null);
    setShowModal(true);
  };

  const handleDelete = async (funcionario) => {
    if (window.confirm(`Tem certeza que deseja deletar ${funcionario.nome}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3002/api/admin/funcionarios/${funcionario.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          carregarFuncionarios();
        } else {
          const error = await response.json();
          alert(error.error);
        }
      } catch (error) {
        console.error('Erro ao deletar funcionário:', error);
        alert('Erro ao deletar funcionário');
      }
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
            <Users size={32} style={{ color: '#3B82F6' }} />
            Gerenciar Funcionários
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            Novo Funcionário
          </button>
          <Link to="/admin" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} style={{ marginRight: '8px' }} />
            Voltar
          </Link>
        </div>
      </header>

      {/* Lista de Funcionários */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {funcionarios.map(funcionario => (
          <div key={funcionario.id} className="card" style={{ position: 'relative' }}>
            {/* Foto do Funcionário */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {funcionario.foto ? (
                <img 
                  src={funcionario.foto} 
                  alt={funcionario.nome}
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '3px solid #3B82F6'
                  }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#333333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  border: '3px solid #3B82F6'
                }}>
                  <User size={32} style={{ color: '#cccccc' }} />
                </div>
              )}
            </div>

            {/* Informações do Funcionário */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                {funcionario.nome}
              </h3>
              <p style={{ color: '#3B82F6', fontSize: '14px', fontWeight: '500' }}>
                {funcionario.funcao}
              </p>
            </div>

            {/* Detalhes */}
            <div style={{ fontSize: '14px', color: '#cccccc', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <User size={16} />
                <span>Idade: {funcionario.data_nascimento ? calcularIdade(funcionario.data_nascimento) : 'N/A'} anos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span>👤</span>
                <span>Sexo: {funcionario.sexo || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Calendar size={16} />
                <span>
                  Conosco há: {funcionario.data_admissao ? calcularTempoEmpresa(funcionario.data_admissao) : 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} />
                <span>Login: {funcionario.username}</span>
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => handleEdit(funcionario)}
                className="btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px' }}
              >
                <Edit size={14} style={{ marginRight: '4px' }} />
                Editar
              </button>
              {funcionario.tipo !== 'admin' && (
                <button
                  onClick={() => handleDelete(funcionario)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    backgroundColor: '#EF4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={14} style={{ marginRight: '4px' }} />
                  Deletar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>
              {editingUser ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#222222',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    color: '#ffffff'
                  }}
                />
              </div>

              {!editingUser && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Usuário</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#222222',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        color: '#ffffff'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Senha</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#222222',
                        border: '1px solid #333333',
                        borderRadius: '4px',
                        color: '#ffffff'
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#222222',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({...formData, sexo: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#222222',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Função</label>
                  <select
                    value={formData.funcao}
                    onChange={(e) => setFormData({...formData, funcao: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#222222',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  >
                    <option value="Alfaiate">Alfaiate</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label style={{ color: '#cccccc', display: 'block', marginBottom: '4px' }}>Data de Admissão</label>
                  <input
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) => setFormData({...formData, data_admissao: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#222222',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#cccccc', display: 'block', marginBottom: '8px' }}>Foto do Funcionário</label>
                
                {/* Preview da foto atual */}
                {(formData.foto || fotoFile) && (
                  <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                    <img 
                      src={fotoFile ? URL.createObjectURL(fotoFile) : formData.foto}
                      alt="Preview"
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '2px solid #3B82F6'
                      }}
                    />
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        console.log('File selected:', file.name, file.type, file.size);
                        // Validar tipo de arquivo
                        if (!file.type.startsWith('image/')) {
                          alert('Apenas arquivos de imagem são permitidos');
                          e.target.value = '';
                          return;
                        }
                        // Validar tamanho (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert('Arquivo muito grande. Máximo 5MB');
                          e.target.value = '';
                          return;
                        }
                        setFotoFile(file);
                      }
                    }}
                    style={{
                      padding: '8px',
                      backgroundColor: '#222222',
                      border: '1px solid #333333',
                      borderRadius: '4px',
                      color: '#ffffff',
                      flex: 1
                    }}
                  />
                  
                  {uploadingFoto && (
                    <div style={{ color: '#3B82F6', fontSize: '14px' }}>
                      Enviando...
                    </div>
                  )}
                </div>
                
                <div style={{ fontSize: '12px', color: '#888888', marginTop: '4px' }}>
                  Formatos aceitos: JPG, JPEG, PNG (máx. 5MB)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({
                      username: '',
                      password: '',
                      nome: '',
                      data_nascimento: '',
                      sexo: 'Masculino',
                      funcao: 'Alfaiate',
                      data_admissao: '',
                      foto: ''
                    });
                    setFotoFile(null);
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={uploadingFoto}
                >
                  {uploadingFoto ? 'Enviando foto...' : (editingUser ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GerenciarFuncionarios;