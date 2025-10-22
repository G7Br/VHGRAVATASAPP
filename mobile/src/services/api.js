import axios from 'axios';

// Configuração para produção
const API_BASE_URL = 'https://vhgravataswebmobile1-git-main-g7brs-projects.vercel.app/api';

console.log('🌐 API URL configurada:', API_BASE_URL);

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Interceptor para debug
    this.api.interceptors.request.use(request => {
      console.log('🚀 Fazendo requisição:', request.method?.toUpperCase(), request.url);
      return request;
    });
    
    this.api.interceptors.response.use(
      response => {
        console.log('✅ Resposta recebida:', response.status, response.config.url);
        return response;
      },
      error => {
        console.error('❌ Erro na requisição:', error.message);
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  async login(usuario, senha) {
    console.log('🔐 Tentando login:', { usuario, url: `${API_BASE_URL}/login` });
    try {
      const response = await this.api.post('/login', { usuario, senha });
      console.log('✅ Login bem-sucedido:', response.status);
      return response.data;
    } catch (error) {
      console.error('❌ Erro no login:', error.message);
      if (error.response) {
        console.error('📊 Status:', error.response.status);
        console.error('📝 Data:', error.response.data);
      } else if (error.request) {
        console.error('🌐 Erro de rede:', error.request);
      }
      throw error;
    }
  }

  async getTernos() {
    const response = await this.api.get('/ternos');
    return response.data;
  }

  async createTerno(ternoData) {
    const response = await this.api.post('/ternos', ternoData);
    return response.data;
  }

  async updateEtapa(ternoId, observacoes) {
    const response = await this.api.put(`/ternos/${ternoId}/etapa`, { observacoes });
    return response.data;
  }

  async getRelatorios() {
    const response = await this.api.get('/relatorios');
    return response.data;
  }

  async getFuncionarios() {
    const response = await this.api.get('/funcionarios');
    return response.data;
  }

  async getTernosFinalizados() {
    const response = await this.api.get('/ternos-finalizados');
    return response.data;
  }

  async getPedidosFinalizados() {
    const response = await this.api.get('/pedidos-finalizados');
    return response.data;
  }

  async getNotificacoes() {
    const response = await this.api.get('/admin/notificacoes');
    return response.data;
  }

  async limparNotificacoes() {
    const response = await this.api.delete('/admin/notificacoes/clear');
    return response.data;
  }

  async getSubEtapas(ternoId) {
    const response = await this.api.get(`/ternos/${ternoId}/sub-etapas`);
    return response.data;
  }

  async updateSubEtapa(ternoId, subEtapaData) {
    const response = await this.api.put(`/ternos/${ternoId}/sub-etapa`, subEtapaData);
    return response.data;
  }

  async updateSubEtapaById(subEtapaId, subEtapaData) {
    const response = await this.api.put(`/sub-etapas/${subEtapaId}`, subEtapaData);
    return response.data;
  }

  async finalizarTerno(ternoId, observacoes) {
    const response = await this.api.put(`/ternos/${ternoId}/finalizar`, { observacoes });
    return response.data;
  }

  async uploadFoto(imageUri) {
    const formData = new FormData();
    formData.append('foto', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'foto.jpg',
    });

    const response = await this.api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiService = new ApiService();