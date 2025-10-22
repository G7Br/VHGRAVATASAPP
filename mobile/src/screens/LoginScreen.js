import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Card, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../styles/theme';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!usuario || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Iniciando login...', { usuario });
      const response = await apiService.login(usuario, senha);
      console.log('✅ Login response:', response);
      
      if (response.token && response.user) {
        await login(response.user, response.token);
        console.log('✅ Login realizado com sucesso');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      
      let errorMessage = 'Erro de conexão';
      
      if (error.response) {
        // Erro HTTP
        errorMessage = error.response.data?.error || `Erro ${error.response.status}`;
      } else if (error.request) {
        // Erro de rede
        errorMessage = 'Não foi possível conectar ao servidor.\n\nVerifique:\n• Wi-Fi conectado\n• Backend rodando\n• IP: 192.168.1.8:3002';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert('Erro no Login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>PRODUÇÃO</Text>
          </View>
          <Title style={styles.title}>Sistema de Controle de Ternos</Title>
          
          <Text style={styles.debugInfo}>
            🌐 Servidor: 192.168.1.8:3002
          </Text>
          
          <TextInput
            label="Usuário"
            value={usuario}
            onChangeText={setUsuario}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Entrar'}
          </Button>
          
          <View style={styles.credentialsContainer}>
            <Text style={styles.credentialsTitle}>Credenciais de teste:</Text>
            <Text style={styles.credentials}>Admin: admin / admin123</Text>
            <Text style={styles.credentials}>Funcionário: joao / 123</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fundo preto igual ao web
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#111111', // Mesmo card do web
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 2,
  },
  title: {
    color: '#cccccc', // Cinza igual ao web
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 32,
  },
  debugInfo: {
    color: '#3B82F6', // Azul igual ao web
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 24,
    fontFamily: 'monospace',
    backgroundColor: '#111111',
    padding: 8,
    borderRadius: 4,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#000000', // Fundo preto igual ao web
  },
  button: {
    backgroundColor: '#ffffff', // Botão branco igual ao web
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  credentialsContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#111111', // Mesmo fundo do web
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  credentialsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  credentials: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
});