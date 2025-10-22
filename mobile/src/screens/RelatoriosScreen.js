import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Text } from 'react-native-paper';
import { colors } from '../styles/theme';

export default function RelatoriosScreen() {
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Relatórios</Title>
          <Text style={styles.text}>Funcionalidade em desenvolvimento</Text>
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
  },
  title: {
    color: colors.primary,
    textAlign: 'center',
  },
  text: {
    color: colors.text,
    textAlign: 'center',
    marginTop: 20,
  },
});