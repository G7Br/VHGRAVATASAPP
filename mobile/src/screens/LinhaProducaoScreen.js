import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Text, Chip, Searchbar, Title } from 'react-native-paper';
import { apiService } from '../services/api';

export default function LinhaProducaoScreen() {
  const [ternos, setTernos] = useState([]);
  const [filteredTernos, setFilteredTernos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTernos();
  }, []);

  useEffect(() => {
    filterTernos();
  }, [searchQuery, ternos]);

  const loadTernos = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTernos();
      setTernos(data.filter(t => t.etapa_atual !== 'Finalizado'));
    } catch (error) {
      console.error('Erro ao carregar ternos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTernos = () => {
    if (!searchQuery) {
      setFilteredTernos(ternos);
      return;
    }

    const filtered = ternos.filter(terno =>
      terno.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terno.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terno.etapa_atual.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTernos(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'no-prazo': return '#ffffff';
      case 'atencao': return '#ffffff';
      case 'atrasado': return '#ffffff';
      default: return '#ffffff';
    }
  };

  const renderTerno = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.codigo}>#{item.codigo}</Text>
          <Chip 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status}
          </Chip>
        </View>
        
        <Text style={styles.cliente}>{item.cliente}</Text>
        <Text style={styles.etapa}>{item.etapa_atual}</Text>
        <Text style={styles.funcionario}>{item.funcionario_atual}</Text>
        <Text style={styles.prazo}>Prazo: {new Date(item.prazo_entrega).toLocaleDateString()}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar ternos..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
      />

      <FlatList
        data={filteredTernos}
        renderItem={renderTerno}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTernos} />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchbar: {
    margin: 16,
    backgroundColor: '#111111',
  },
  searchInput: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#111111',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codigo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusChip: {
    backgroundColor: '#333333',
  },
  statusText: {
    color: '#000000',
    fontSize: 12,
  },
  cliente: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 4,
  },
  etapa: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  funcionario: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  prazo: {
    fontSize: 12,
    color: '#888888',
  },
});