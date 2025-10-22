import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Text, Button, List, Badge, IconButton } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../styles/theme';

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [ternos, setTernos] = useState([]);
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.tipo === 'admin') {
      carregarDados();
    }
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const ternosData = await apiService.getTernos();
      setTernos(ternosData);
      
      try {
        const notifData = await apiService.getNotificacoes();
        setNotificacoes(notifData);
      } catch (error) {
        setNotificacoes([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const limparNotificacoes = async () => {
    try {
      await apiService.limparNotificacoes();
      setNotificacoes([]);
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const getNotificationIcon = (tipo) => {
    switch(tipo) {
      case 'sub_etapa_finalizada': return '✅';
      case 'sub_etapa_iniciada': return '🔄';
      case 'finalizado': return '🎉';
      default: return '📋';
    }
  };

  const ternosAtivos = ternos.filter(t => t.etapa_atual !== 'Finalizado');
  const ternosFinalizados = ternos.filter(t => t.etapa_atual === 'Finalizado');
  const notificacaosPendentes = notificacoes.filter(n => !n.lida);

  if (user.tipo !== 'admin') {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.errorText}>Acesso negado</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={carregarDados} />
        }
      >
        <Title style={styles.title}>Dashboard Administrativo</Title>
        <Text style={styles.subtitle}>Monitoramento em tempo real da produção</Text>

        {/* Notificações */}
        <Card style={styles.card}>
          <Card.Title 
            title={`Notificações (${notificacaosPendentes.length})`}
            titleStyle={styles.cardTitle}
            right={(props) => notificacoes.length > 0 && (
              <IconButton
                {...props}
                icon="delete"
                onPress={limparNotificacoes}
              />
            )}
          />
          <Card.Content>
            {notificacoes.length > 0 ? (
              notificacoes.slice(0, 5).map(notif => (
                <List.Item
                  key={notif.id}
                  title={`Terno #${notif.codigo} - ${notif.cliente}`}
                  description={notif.mensagem}
                  left={() => (
                    <Text style={styles.notifIcon}>
                      {getNotificationIcon(notif.tipo)}
                    </Text>
                  )}
                  right={() => (
                    <View style={styles.notifRight}>
                      <Text style={styles.notifTime}>
                        {new Date(notif.data).toLocaleDateString('pt-BR')}
                      </Text>
                      <Text style={styles.notifFuncionario}>
                        👤 {notif.funcionario}
                      </Text>
                    </View>
                  )}
                  style={[
                    styles.notifItem,
                    !notif.lida && styles.notifNaoLida
                  ]}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhuma notificação no momento</Text>
            )}
          </Card.Content>
        </Card>

        {/* Resumo Rápido */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{ternosAtivos.length}</Text>
              <Text style={styles.statLabel}>Ternos Ativos</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{notificacaosPendentes.length}</Text>
              <Text style={styles.statLabel}>Notificações Novas</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{ternosFinalizados.length}</Text>
              <Text style={styles.statLabel}>Ternos Finalizados</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('LinhaProducao')}
            style={styles.actionButton}
          >
            🔴 Linha de Produção - Tempo Real
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Relatorios')}
            style={styles.actionButton}
          >
            📊 Relatórios Administrativos
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.navigate('CadastroTerno')}
            style={styles.actionButton}
          >
            ➕ Cadastrar Novo Terno
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#111111',
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#111111',
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notifItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifNaoLida: {
    backgroundColor: '#333333',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notifIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  notifRight: {
    alignItems: 'flex-end',
  },
  notifTime: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  notifFuncionario: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: 20,
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    fontSize: 16,
  },
});