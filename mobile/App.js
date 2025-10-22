import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CadastroTernoScreen from './src/screens/CadastroTernoScreen';
import LinhaProducaoScreen from './src/screens/LinhaProducaoScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import AtualizarEtapaScreen from './src/screens/AtualizarEtapaScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
import SubEtapasScreen from './src/screens/SubEtapasScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

import { AuthProvider } from './src/context/AuthContext';
import { theme } from './src/styles/theme';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: '#000000',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                color: '#ffffff',
              },
            }}
          >
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Produção - Dashboard' }}
            />
            <Stack.Screen 
              name="CadastroTerno" 
              component={CadastroTernoScreen}
              options={{ title: 'Cadastrar Terno' }}
            />
            <Stack.Screen 
              name="LinhaProducao" 
              component={LinhaProducaoScreen}
              options={{ title: 'Linha de Produção' }}
            />
            <Stack.Screen 
              name="Perfil" 
              component={PerfilScreen}
              options={{ title: 'Meu Perfil' }}
            />
            <Stack.Screen 
              name="AtualizarEtapa" 
              component={AtualizarEtapaScreen}
              options={{ title: 'Atualizar Etapa' }}
            />
            <Stack.Screen 
              name="Relatorios" 
              component={RelatoriosScreen}
              options={{ title: 'Relatórios' }}
            />
            <Stack.Screen 
              name="SubEtapas" 
              component={SubEtapasScreen}
              options={{ title: 'Sub-etapas' }}
            />
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboardScreen}
              options={{ title: 'Dashboard Administrativo' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}