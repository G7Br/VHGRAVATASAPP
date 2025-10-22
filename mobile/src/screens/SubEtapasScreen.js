import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Card, Title, Text, Button, Checkbox, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SubEtapasScreen({ route, navigation }) {
  const { terno } = route.params;
  const { user } = useAuth();
  const [subEtapas, setSubEtapas] = useState([]);
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState({});

  // Cada funcionário trabalha independentemente em suas etapas
  const etapasPorFuncionario = {
    'João Silva': ['Costura Calça', 'Costura Paletó'],
    'Maria Santos': ['Caseado', 'Acabamento'],
    'Pedro Costa': ['Travete', 'Finalização'],
    'Administrador': ['Todas as etapas'] // Admin vê tudo
  };
  
  const getMinhasEtapas = () => {
    if (user.tipo === 'admin') {
      // Admin vê todas as etapas do tipo de serviço
      const todasEtapas = {
        'Fabricação': ['Corte', 'Costura Calça', 'Costura Paletó', 'Caseado', 'Travete', 'Acabamento', 'Finalização'],
        'Ajuste': ['Medição', 'Ajuste Calça', 'Ajuste Paletó'],
        'Reajuste': ['Reajuste']
      };
      return todasEtapas[terno.tipo_servico] || [];
    }
    
    // Funcionário vê apenas suas etapas
    return etapasPorFuncionario[user.nome] || [];
  };

  useEffect(() => {
    loadSubEtapas();
  }, []);

  const loadSubEtapas = async () => {
    try {
      console.log(`🔄 Carregando sub-etapas para terno ID: ${terno.id}`);
      const data = await apiService.getSubEtapas(terno.id);
      console.log(`✅ Sub-etapas carregadas:`, data);
      
      if (data && data.length > 0) {
        // Usar sub-etapas do banco de dados
        const subEtapasFormatadas = data.map(item => ({
          id: item.id,
          subEtapa: item.sub_etapa,
          status: item.status,
          dataFinalizacao: item.data_finalizacao,
          funcionario: item.funcionario,
          observacoes: item.observacoes,
          foto: item.foto
        }));
        console.log(`📊 Sub-etapas formatadas:`, subEtapasFormatadas);
        setSubEtapas(subEtapasFormatadas);
      } else {
        // Fallback: criar sub-etapas localmente se não existirem no banco
        console.log('⚠️ Nenhuma sub-etapa encontrada, criando localmente');
        initializeSubEtapas();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar sub-etapas:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      // Em caso de erro, criar sub-etapas localmente
      initializeSubEtapas();
    }
  };

  const initializeSubEtapas = () => {
    const minhasEtapas = getMinhasEtapas();
    const initialSubEtapas = minhasEtapas.map(etapa => ({
      subEtapa: etapa,
      status: 'pendente',
      dataFinalizacao: null,
      funcionario: user.nome
    }));
    setSubEtapas(initialSubEtapas);
  };

  const toggleSubEtapa = async (subEtapa) => {
    console.log(`\n🔄 TOGGLE SUB-ETAPA: ${subEtapa}`);
    
    const currentItem = subEtapas.find(item => item.subEtapa === subEtapa);
    
    if (!currentItem) {
      console.log('❌ Sub-etapa não encontrada na lista local');
      Alert.alert('Erro', 'Sub-etapa não encontrada');
      return;
    }
    
    console.log('📊 Item atual:', currentItem);
    
    // Foto obrigatória para finalizar qualquer etapa
    if (currentItem.status === 'pendente' && !fotos[subEtapa]) {
      console.log('⚠️ Foto obrigatória não fornecida');
      Alert.alert('Foto Obrigatória', 'É necessário tirar uma foto antes de finalizar a etapa.');
      return;
    }

    const newStatus = currentItem.status === 'finalizada' ? 'pendente' : 'finalizada';
    console.log(`🔄 Mudando status de '${currentItem.status}' para '${newStatus}'`);
    
    const updated = subEtapas.map(item => {
      if (item.subEtapa === subEtapa) {
        return {
          ...item,
          status: newStatus,
          dataFinalizacao: newStatus === 'finalizada' ? new Date().toISOString() : null
        };
      }
      return item;
    });

    setSubEtapas(updated);

    try {
      const dadosAtualizacao = {
        status: newStatus,
        observacoes,
        foto: fotos[subEtapa] || ''
      };
      
      console.log('📤 Dados para atualização:', dadosAtualizacao);
      
      if (currentItem.id) {
        // Atualizar sub-etapa existente no banco usando ID
        console.log(`🎯 Atualizando por ID: ${currentItem.id}`);
        const response = await apiService.updateSubEtapaById(currentItem.id, dadosAtualizacao);
        console.log('✅ Resposta da API:', response);
      } else {
        // Fallback: atualizar por nome da sub-etapa
        console.log(`🎯 Atualizando por nome: ${subEtapa}`);
        const response = await apiService.updateSubEtapa(terno.id, {
          subEtapa,
          ...dadosAtualizacao
        });
        console.log('✅ Resposta da API:', response);
      }
      console.log('🎉 Sub-etapa atualizada com sucesso!');
      
      // Verificar se todas as sub-etapas foram finalizadas
      const todasFinalizadas = updated.every(item => item.status === 'finalizada');
      
      if (todasFinalizadas && newStatus === 'finalizada') {
        console.log('🏁 Todas as sub-etapas finalizadas! Finalizando terno automaticamente...');
        try {
          await apiService.finalizarTerno(terno.id, observacoes);
          Alert.alert('Sucesso', 'Todas as etapas concluídas! Terno finalizado automaticamente.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch (error) {
          Alert.alert('Erro', 'Erro ao finalizar terno automaticamente');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar sub-etapa:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      Alert.alert('Erro', `Erro ao atualizar sub-etapa: ${error.response?.data?.error || error.message || 'Erro desconhecido'}`);
      // Reverter mudança local em caso de erro
      setSubEtapas(subEtapas);
    }
  };

  const tirarFoto = async (subEtapa) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'É necessário permitir acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotos(prev => ({
        ...prev,
        [subEtapa]: result.assets[0].uri
      }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>
            Terno #{terno.codigo} - {terno.cliente}
          </Title>
          <Text style={styles.subtitle}>
            Tipo: {terno.tipo_servico}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            {user.tipo === 'admin' ? 'Todas as Etapas' : `Minhas Etapas (${user.nome})`}
          </Title>
          
          {subEtapas.map((item, index) => (
            <View key={index} style={styles.subEtapaItem}>
              <View style={styles.subEtapaHeader}>
                <Checkbox
                  status={item.status === 'finalizada' ? 'checked' : 'unchecked'}
                  onPress={() => toggleSubEtapa(item.subEtapa)}
                  color="#ffffff"
                />
                <Text style={[
                  styles.subEtapaText,
                  item.status === 'finalizada' && styles.subEtapaCompleted
                ]}>
                  {item.subEtapa}
                </Text>
              </View>
              
              {/* Foto obrigatória para todas as etapas finalizadas */}
              {item.status === 'finalizada' && (
                <View style={styles.etapaActions}>
                  <Button
                    mode="outlined"
                    onPress={() => tirarFoto(item.subEtapa)}
                    style={styles.fotoButton}
                    compact
                  >
                    {fotos[item.subEtapa] ? '📷 Foto OK' : '📷 Tirar Foto'}
                  </Button>
                </View>
              )}
              
              {fotos[item.subEtapa] && (
                <Image source={{ uri: fotos[item.subEtapa] }} style={styles.fotoPreview} />
              )}
              
              {item.status === 'finalizada' && item.dataFinalizacao && (
                <Text style={styles.timeText}>
                  Finalizada: {new Date(item.dataFinalizacao).toLocaleString('pt-BR')}
                </Text>
              )}
            </View>
          ))}

          <TextInput
            label="Observações"
            value={observacoes}
            onChangeText={setObservacoes}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <View style={{ marginTop: 16, padding: 16, backgroundColor: '#333333', borderRadius: 8 }}>
            <Text style={{ color: '#cccccc', textAlign: 'center', fontSize: 14 }}>
              ℹ️ O terno será finalizado automaticamente quando todas as etapas forem concluídas
            </Text>
            <Text style={{ color: '#10B981', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
              {subEtapas.filter(item => item.status === 'finalizada').length}/{subEtapas.length} etapas concluídas
            </Text>
          </View>
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
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    marginBottom: 16,
  },
  subEtapaItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  subEtapaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subEtapaText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 8,
  },
  subEtapaCompleted: {
    textDecorationLine: 'line-through',
    color: '#cccccc',
  },
  timeText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 40,
  },
  etapaActions: {
    marginTop: 8,
    marginLeft: 40,
  },
  fotoButton: {
    borderColor: '#ffffff',
    width: 120,
  },
  fotoPreview: {
    width: 100,
    height: 75,
    marginTop: 8,
    marginLeft: 40,
    borderRadius: 4,
  },
  input: {
    marginTop: 16,
    backgroundColor: '#000000',
  },
});