import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CadastroTerno from './pages/CadastroTerno';
import LinhaProducao from './pages/LinhaProducao';
import PerfilFuncionario from './pages/PerfilFuncionario';
import AtualizarEtapa from './pages/AtualizarEtapa';
import Relatorios from './pages/Relatorios';
import SubEtapasWeb from './pages/SubEtapasWeb';
import PedidosFinalizados from './pages/PedidosFinalizados';
import AdminDashboard from './pages/AdminDashboard';
import LinhaProducaoTempoReal from './pages/LinhaProducaoTempoReal';
import RelatoriosAdmin from './pages/RelatoriosAdmin';
import GerenciarFuncionarios from './pages/GerenciarFuncionarios';
import PerfilFuncionarioNovo from './pages/PerfilFuncionarioNovo';
import FinalizarPedido from './pages/FinalizarPedido';
import { isTokenValid, clearAuthData } from './utils/auth';
import './styles/global.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token && isTokenValid(token)) {
      setUser(JSON.parse(savedUser));
    } else {
      // Token inválido ou expirado, limpar dados
      clearAuthData();
      setUser(null);
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onLogout={logout} />} />
        <Route path="/cadastro" element={<CadastroTerno user={user} />} />
        <Route path="/producao" element={<LinhaProducao user={user} />} />
        <Route path="/perfil" element={<PerfilFuncionario user={user} />} />
        <Route path="/atualizar/:id" element={<AtualizarEtapa user={user} />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/sub-etapas/:id" element={<SubEtapasWeb />} />
        <Route path="/finalizados" element={<PedidosFinalizados />} />
        <Route path="/admin" element={
          user.tipo === 'admin' ? 
            <AdminDashboard /> : 
            <Navigate to="/" />
        } />
        <Route path="/linha-tempo-real" element={
          user.tipo === 'admin' ? 
            <LinhaProducaoTempoReal /> : 
            <Navigate to="/" />
        } />
        <Route path="/relatorios-admin" element={
          user.tipo === 'admin' ? 
            <RelatoriosAdmin /> : 
            <Navigate to="/" />
        } />
        <Route path="/gerenciar-funcionarios" element={
          user.tipo === 'admin' ? 
            <GerenciarFuncionarios /> : 
            <Navigate to="/" />
        } />
        <Route path="/perfil-funcionario" element={<PerfilFuncionarioNovo />} />
        <Route path="/finalizar-pedido/:id" element={<FinalizarPedido />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;