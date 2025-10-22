import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Card, Text, Menu, Divider } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export default function CadastroTernoScreen({ navigation }) {
  const { user } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [cliente, setCliente] = useState('');
  const [tipoServico, setTipoServico] = useState('Produção');
  const [prazoEntrega, setPrazoEntrega] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [funcionarioResponsavel, setFuncionarioResponsavel] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [tipoMenuVisible, setTipoMenuVisible] = useState(false);

  useEffect(() => {
    if (user.tipo === 'admin') {
      carregarFuncionarios();
    }
  }, [user]);

  const carregarFuncionarios = async () => {
    try {
      const funcionariosData = await apiService.getFuncionarios();
      const funcionariosFiltrados = funcionariosData.filter(f => f.tipo !== 'admin');
      setFuncionarios(funcionariosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const handleCadastro = async () => {
    if (!codigo || !cliente || !tipoServico || !prazoEntrega) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (user.tipo === 'admin' && !funcionarioResponsavel) {
      Alert.alert('Erro', 'Por favor, selecione o funcionário responsável');
      return;
    }

    setLoading(true);
    try {
      await apiService.createTerno({
        codigo,
        cliente,
        tipoServico,
        prazoEntrega,
        observacoes,
        funcionarioResponsavel: user.tipo === 'admin' ? funcionarioResponsavel : user.nome
      });
      
      Alert.alert('Sucesso', 'Terno cadastrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao cadastrar terno');
    } finally {
      setLoading(false);
    }
  };

  const gerarCodigoAleatorio = () => {
    const codigo = Math.floor(Math.random() * 9000) + 1000;
    setCodigo(codigo.toString());
  };

  const tiposServico = ['Produção', 'Ajuste', 'Paletó', 'Reajuste'];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>
            {user && user.tipo === 'admin' ? 'Cadastrar Terno para Funcionário' : 'Novo Terno'}
          </Title>
          
          <View style={styles.codigoContainer}>
            <TextInput
              label="Código *"
              value={codigo}
              onChangeText={setCodigo}
              mode="outlined"
              style={[styles.input, styles.codigoInput]}
            />
            <Button
              mode="outlined"
              onPress={gerarCodigoAleatorio}
              style={styles.gerarBtn}
            >
              Gerar
            </Button>
          </View>

          <TextInput
            label="Cliente *"
            value={cliente}
            onChangeText={setCliente}
            mode="outlined"
            style={styles.input}
          />

          <Menu
            visible={tipoMenuVisible}
            onDismiss={() => setTipoMenuVisible(false)}
            anchor={
              <TextInput
                label="Tipo de Serviço *"
                value={tipoServico}
                mode="outlined"
                style={styles.input}
                editable={false}
                right={<TextInput.Icon icon="chevron-down" onPress={() => setTipoMenuVisible(true)} />}
                onPressIn={() => setTipoMenuVisible(true)}
              />
            }
          >
            {tiposServico.map(tipo => (
              <Menu.Item
                key={tipo}
                onPress={() => {
                  setTipoServico(tipo);
                  setTipoMenuVisible(false);
                }}
                title={tipo}
              />
            ))}
          </Menu>

          {user.tipo === 'admin' && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <TextInput
                  label="Funcionário Responsável *"
                  value={funcionarioResponsavel}
                  mode="outlined"
                  style={styles.input}
                  editable={false}
                  right={<TextInput.Icon icon="chevron-down" onPress={() => setMenuVisible(true)} />}
                  onPressIn={() => setMenuVisible(true)}
                />
              }
            >
              {funcionarios.map(funcionario => (
                <Menu.Item
                  key={funcionario.id}
                  onPress={() => {
                    setFuncionarioResponsavel(funcionario.nome);
                    setMenuVisible(false);
                  }}
                  title={`${funcionario.nome} - ${funcionario.funcao}`}
                />
              ))}
            </Menu>
          )}

          <TextInput
            label="Prazo de Entrega *"
            value={prazoEntrega}
            onChangeText={setPrazoEntrega}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
          />

          <TextInput
            label="Observações"
            value={observacoes}
            onChangeText={setObservacoes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleCadastro}
            loading={loading}
            style={styles.button}
          >
            Cadastrar Terno
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  card: {
    backgroundColor: '#111111',
  },
  title: {
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#000000',
  },
  button: {
    backgroundColor: '#ffffff',
    marginTop: 16,
  },
  codigoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  codigoInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  gerarBtn: {
    borderColor: '#ffffff',
  },
});