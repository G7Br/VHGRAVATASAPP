import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Text, Button, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

export default function AtualizarEtapaScreen({ route, navigation }) {
  const { ternoId } = route.params;
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAvancarParaSubEtapas = () => {
    navigation.navigate('SubEtapas', { terno: { id: ternoId } });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Atualizar Etapa</Title>
          
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
            onPress={handleAvancarParaSubEtapas}
            style={styles.button}
          >
            Ir para Sub-etapas
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
});