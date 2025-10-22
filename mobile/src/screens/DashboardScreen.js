import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Card, Title, Text, Button, FAB, IconButton } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { colors } from '../styles/theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [ternos, setTernos] = useState([]);
  const [ternosFinalizados, setTernosFinalizados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTernos();
  }, []);

  const loadTernos = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTernos();
      setTernos(data);
      
      // Carregar ternos finalizados
      const finalizados = await apiService.getTernosFinalizados();
      setTernosFinalizados(finalizados);
    } catch (error) {
      console.error('Erro ao carregar ternos:', error);
    } finally {
      setLoading(false);
    }
  };

  const ternosAtivos = ternos.filter(t => t.etapa_atual !== 'Finalizado');
  const ternosNoPrazo = ternosAtivos.filter(t => t.status === 'no-prazo').length;
  const ternosAtrasados = ternosAtivos.filter(t => t.status === 'atrasado').length;
  const meusTernos = user.tipo === 'admin' ? ternosAtivos : ternosAtivos.filter(t => t.funcionario_atual === user.nome);
  const proximosEntregar = ternosFinalizados.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Title style={styles.headerTitle}>Dashboard</Title>
            <Text style={styles.headerSubtitle}>Bem-vindo, {user.nome}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <IconButton
            icon="account"
            iconColor={colors.primary}
            onPress={() => navigation.navigate('Perfil')}
          />
          {user.tipo === 'admin' && (
            <IconButton
              icon="chart-bar"
              iconColor={colors.primary}
              onPress={() => navigation.navigate('Relatorios')}
            />
          )}
          <IconButton
            icon="logout"
            iconColor={colors.primary}
            onPress={logout}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTernos} />
        }
      >
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{ternosAtivos.length}</Text>
              <Text style={styles.statLabel}>Ternos Ativos</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {ternosNoPrazo}
              </Text>
              <Text style={styles.statLabel}>No Prazo</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, { color: colors.error }]}>
                {ternosAtrasados}
              </Text>
              <Text style={styles.statLabel}>Atrasados</Text>
            </Card.Content>
          </Card>

          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {meusTernos.length}
              </Text>
              <Text style={styles.statLabel}>Seus Ternos</Text>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.cardsRow}>
          <Card style={[styles.card, styles.halfCard]}>
            <Card.Title 
              title={user.tipo === 'admin' ? 'Ternos em Andamento' : 'Seus Ternos Atuais'} 
              titleStyle={styles.cardTitle} 
            />
            <Card.Content>
              {meusTernos.length > 0 ? (
                meusTernos.slice(0, 3).map(terno => (
                  <View key={terno.id} style={styles.ternoItem}>
                    <View style={styles.ternoInfo}>
                      <Text style={styles.ternoCode}>#{terno.codigo}</Text>
                      <Text style={styles.ternoClient}>{terno.cliente}</Text>
                      <Text style={styles.ternoEtapa}>{terno.etapa_atual}</Text>
                      {user.tipo === 'admin' && (
                        <Text style={styles.ternoFuncionario}>👤 {terno.funcionario_atual}</Text>
                      )}
                    </View>
                    <Button
                      mode="contained"
                      compact
                      onPress={() => navigation.navigate('SubEtapas', { terno })}
                    >
                      Detalhes
                    </Button>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  {user.tipo === 'admin' ? 'Nenhum terno em andamento.' : 'Nenhum terno atribuído a você.'}
                </Text>
              )}
              {meusTernos.length > 3 && (
                <Button
                  mode="outlined"
                  compact
                  onPress={() => navigation.navigate('LinhaProducao')}
                  style={styles.verTodosBtn}
                >
                  Ver Todos ({meusTernos.length})
                </Button>
              )}
            </Card.Content>
          </Card>

          <Card style={[styles.card, styles.halfCard]}>
            <Card.Title 
              title={user.tipo === 'admin' ? 'Ternos Finalizados' : 'Próximos a Entregar'} 
              titleStyle={styles.cardTitle} 
            />
            <Card.Content>
              {proximosEntregar.length > 0 ? (
                proximosEntregar.map(terno => (
                  <View key={terno.id} style={[styles.ternoItem, styles.ternoFinalizado]}>
                    <View style={styles.ternoInfo}>
                      <Text style={styles.ternoCode}>#{terno.codigo}</Text>
                      <Text style={styles.ternoClient}>{terno.cliente}</Text>
                      <Text style={styles.ternoFinalizadoLabel}>✅ FINALIZADO</Text>
                      {user.tipo === 'admin' && terno.funcionario_finalizador && (
                        <Text style={styles.ternoFuncionario}>👤 {terno.funcionario_finalizador}</Text>
                      )}
                    </View>
                    <Text style={styles.ternoData}>
                      {new Date(terno.prazo_entrega).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Nenhum terno finalizado ainda
                </Text>
              )}
            </Card.Content>
          </Card>
        </View>

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('LinhaProducao')}
            style={styles.actionButton}
          >
            {user.tipo === 'admin' ? 'Ver Linha de Produção Completa' : 'Ver Meus Ternos'}
          </Button>
          
          {user.tipo === 'admin' && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('AdminDashboard')}
              style={[styles.actionButton, { marginTop: 8 }]}
            >
              Dashboard Administrativo
            </Button>
          )}
        </View>
      </ScrollView>

      {user.tipo === 'admin' && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('CadastroTerno')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 24,
  },
  headerSubtitle: {
    color: colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 8,
    backgroundColor: '#111111',
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#111111',
  },
  cardTitle: {
    color: colors.primary,
  },
  ternoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ternoInfo: {
    flex: 1,
  },
  ternoCode: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  ternoClient: {
    color: colors.text,
  },
  ternoEtapa: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    borderColor: '#ffffff',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfCard: {
    width: '48%',
  },
  ternoFuncionario: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  ternoFinalizado: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  ternoFinalizadoLabel: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
  },
  ternoData: {
    fontSize: 12,
    color: colors.text,
    fontWeight: 'bold',
  },
  verTodosBtn: {
    marginTop: 8,
    borderColor: colors.primary,
  },
});