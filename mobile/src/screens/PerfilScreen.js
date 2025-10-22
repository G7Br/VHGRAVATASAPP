import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text, Button, Avatar } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/theme';

export default function PerfilScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.profileHeader}>
          <Avatar.Text 
            size={80} 
            label={user.nome.charAt(0).toUpperCase()} 
            style={styles.avatar}
          />
          <Title style={styles.name}>{user.nome}</Title>
          <Text style={styles.role}>
            {user.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Informações" titleStyle={styles.cardTitle} />
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{user.nome}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipo:</Text>
            <Text style={styles.infoValue}>
              {user.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID:</Text>
            <Text style={styles.infoValue}>{user.id}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Ações" titleStyle={styles.cardTitle} />
        <Card.Content>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.actionButton}
          >
            Voltar ao Dashboard
          </Button>
          
          <Button
            mode="contained"
            onPress={logout}
            style={[styles.actionButton, styles.logoutButton]}
            buttonColor={colors.error}
          >
            Sair do Sistema
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: '#111111',
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.primary,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  role: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  infoValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
  },
});