import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Camera, Upload, ArrowLeft, CheckCircle } from 'lucide-react';

const FinalizarPedido = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoUrl, setFotoUrl] = useState('');
  const [formData, setFormData] = useState({
    codigo_pedido: '',
    nome_cliente: '',
    observacoes_alfaiate: ''
  });

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens (PNG, JPEG, JPG)');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setFoto(file);
    
    // Preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setFotoUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadFoto = async () => {
    if (!foto) return null;

    const formData = new FormData();
    formData.append('foto', foto);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error('Erro ao fazer upload da foto');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!foto) {
      alert('Por favor, adicione uma foto do pedido finalizado');
      return;
    }

    if (!formData.codigo_pedido || !formData.nome_cliente) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Upload da foto
      const fotoUploadUrl = await uploadFoto();

      // Salvar pedido finalizado
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/pedidos-finalizados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          foto_finalizado: fotoUploadUrl,
          terno_id: id
        })
      });

      if (response.ok) {
        alert('Pedido finalizado com sucesso!');
        navigate('/finalizados');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao finalizar pedido');
      }
    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
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
            Finalizar Pedido
          </h1>
        </div>
        
        <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} style={{ marginRight: '8px' }} />
          Voltar
        </Link>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Upload de Foto */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <label style={{ color: '#ffffff', display: 'block', marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
              📷 Foto do Pedido Finalizado *
            </label>
            
            {fotoUrl ? (
              <div style={{ marginBottom: '16px' }}>
                <img 
                  src={fotoUrl} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '300px', 
                    maxHeight: '300px', 
                    borderRadius: '8px',
                    border: '2px solid #3B82F6'
                  }} 
                />
              </div>
            ) : (
              <div style={{
                width: '200px',
                height: '200px',
                border: '2px dashed #3B82F6',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                backgroundColor: '#222222'
              }}>
                <Camera size={48} style={{ color: '#3B82F6', marginBottom: '8px' }} />
                <p style={{ color: '#cccccc', fontSize: '14px' }}>Clique para adicionar foto</p>
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFotoChange}
              style={{ display: 'none' }}
              id="foto-input"
            />
            <label 
              htmlFor="foto-input" 
              className="btn-secondary"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Upload size={16} />
              {foto ? 'Trocar Foto' : 'Selecionar Foto'}
            </label>
            <p style={{ color: '#888888', fontSize: '12px', marginTop: '8px' }}>
              Formatos aceitos: PNG, JPEG, JPG (máx. 5MB)
            </p>
          </div>

          {/* Informações do Pedido */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#cccccc', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Código do Pedido *
            </label>
            <input
              type="text"
              value={formData.codigo_pedido}
              onChange={(e) => setFormData({...formData, codigo_pedido: e.target.value})}
              required
              placeholder="Ex: 4037"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#222222',
                border: '1px solid #333333',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ color: '#cccccc', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Nome do Cliente *
            </label>
            <input
              type="text"
              value={formData.nome_cliente}
              onChange={(e) => setFormData({...formData, nome_cliente: e.target.value})}
              required
              placeholder="Ex: João Silva"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#222222',
                border: '1px solid #333333',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ color: '#cccccc', display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Observações do Alfaiate
            </label>
            <textarea
              value={formData.observacoes_alfaiate}
              onChange={(e) => setFormData({...formData, observacoes_alfaiate: e.target.value})}
              placeholder="Observações sobre o trabalho realizado, ajustes feitos, etc..."
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#222222',
                border: '1px solid #333333',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '16px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
              Cancelar
            </Link>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? (
                <>
                  <div style={{ 
                    width: '16px', 
                    height: '16px', 
                    border: '2px solid #333', 
                    borderTop: '2px solid #fff', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite' 
                  }}></div>
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Finalizar Pedido
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default FinalizarPedido;