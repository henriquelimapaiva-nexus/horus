// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

import Splash from "./pages/Splash";
import Login from "./pages/Login";
import PrivateLayout from "./layouts/PrivateLayout";

// Importar todos os componentes existentes
import Dashboard from "./pages/Dashboard";
import Linhas from "./pages/Linhas";
import FichaLinha from "./pages/FichaLinha";
import Empresa from "./pages/Empresa";
import Conhecimento from "./pages/Conhecimento";

// Cadastro de Linhas e Postos
import LinhaForm from "./pages/LinhaForm";
import PostoForm from "./pages/PostoForm";

// Coleta de Dados
import ColetaDados from "./pages/ColetaDados";

// Relatório Profissional (único)
import RelatorioProfissional from "./pages/RelatorioProfissional";

// Página de Produtos
import Produtos from "./pages/Produtos";

// Página de Cargos
import Cargos from "./pages/Cargos";

// Página de Colaboradores
import Colaboradores from "./pages/Colaboradores";

// Dashboard Financeiro
import DashboardFinanceiro from "./pages/DashboardFinanceiro";

// Página de Perdas
import Perdas from "./pages/Perdas";

// Painel Executivo
import PainelExecutivo from "./pages/PainelExecutivo";

// Proposta Comercial
import PropostaComercial from "./pages/PropostaComercial";

// Página de Listagem de Postos
import Postos from "./pages/Postos";

// 👇 IMPORTS DO CONSULTOR (incluindo login e proteção)
import ConsultorLogin from "./pages/consultor/ConsultorLogin";
import ConsultorPrivateLayout from "./pages/consultor/ConsultorPrivateLayout";
import ConsultorLayout from "./pages/consultor/ConsultorLayout";
import ConsultorDashboard from "./pages/consultor/ConsultorDashboard";
import ConsultorClientes from "./pages/consultor/ConsultorClientes";
import ConsultorRelatorios from "./pages/consultor/ConsultorRelatorios";
import ConsultorConfiguracoes from "./pages/consultor/ConsultorConfiguracoes";

// 🟢 IMPORT - IA DE PRECIFICAÇÃO
import IAPrecificacao from "./pages/consultor/ias/IAPrecificacao";

// 🟢 IMPORT - IA DE SUGESTÕES
import IASugestoes from "./pages/consultor/IASugestoes";

// 🟢 NOVO IMPORT - CHECKLIST
import Checklist from "./pages/consultor/Checklist";

// 👇 NOVOS CONTEXTS
import { AuthProvider } from "./context/AuthContext";
import { ConsultorAuthProvider } from "./context/ConsultorAuthContext";

function App() {
  return (
    <AuthProvider>
      <ConsultorAuthProvider> {/* 👈 Provider do consultor */}
        <Router>
          {/* CONFIGURAÇÃO DO TOASTER */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
                padding: '16px',
                borderRadius: '8px',
                fontFamily: 'Arial, sans-serif',
              },
              success: {
                style: {
                  background: '#16a34a',
                },
                icon: '✅',
              },
              error: {
                style: {
                  background: '#dc2626',
                },
                icon: '❌',
              },
              loading: {
                style: {
                  background: '#1E3A8A',
                },
                icon: '⏳',
              },
              warning: {
                style: {
                  background: '#f59e0b',
                },
                icon: '⚠️',
              },
            }}
          />
          
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            
            {/* 👇 NOVA ROTA DE LOGIN DO CONSULTOR */}
            <Route path="/consultor/login" element={<ConsultorLogin />} />
            
            {/* 👇 ROTAS PROTEGIDAS DO CONSULTOR */}
            <Route element={<ConsultorPrivateLayout />}>
              <Route path="/consultor" element={<ConsultorLayout />}>
                <Route index element={<ConsultorDashboard />} />
                <Route path="clientes" element={<ConsultorClientes />} />
                <Route path="relatorios" element={<ConsultorRelatorios />} />
                <Route path="configuracoes" element={<ConsultorConfiguracoes />} />
                {/* 🟢 ROTA - IA DE PRECIFICAÇÃO */}
                <Route path="ias/precificacao" element={<IAPrecificacao />} />
                {/* 🟢 ROTA - IA DE SUGESTÕES */}
                <Route path="ias/sugestoes" element={<IASugestoes />} />
                {/* 🟢 NOVA ROTA - CHECKLIST */}
                <Route path="checklist" element={<Checklist />} />
              </Route>
            </Route>
            
            {/* Rotas protegidas do sistema (clientes) - NADA MUDOU AQUI */}
            <Route element={<PrivateLayout />}>
              {/* Rotas existentes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/linhas" element={<Linhas />} />
              <Route path="/linhas/:id" element={<FichaLinha />} />
              <Route path="/empresas" element={<Empresa />} />
              <Route path="/conhecimento" element={<Conhecimento />} />
              
              {/* Rotas de Cadastro */}
              <Route path="/linhas/novo" element={<LinhaForm />} />
              <Route path="/linhas/editar/:id" element={<LinhaForm />} />
              <Route path="/postos/novo/:linhaId" element={<PostoForm />} />
              <Route path="/postos/editar/:postoId/linha/:linhaId" element={<PostoForm />} />
              
              {/* Coleta de Dados */}
              <Route path="/coleta/:linhaId" element={<ColetaDados />} />
              
              {/* Relatório Profissional */}
              <Route path="/relatorios" element={<RelatorioProfissional />} />
              
              {/* Produtos */}
              <Route path="/produtos" element={<Produtos />} />
              
              {/* Cargos */}
              <Route path="/cargos" element={<Cargos />} />
              
              {/* Colaboradores */}
              <Route path="/colaboradores" element={<Colaboradores />} />
              
              {/* Dashboard Financeiro */}
              <Route path="/financeiro" element={<DashboardFinanceiro />} />
              
              {/* Perdas */}
              <Route path="/perdas" element={<Perdas />} />
              
              {/* Painel Executivo */}
              <Route path="/painel" element={<PainelExecutivo />} />
              
              {/* Proposta Comercial */}
              <Route path="/proposta" element={<PropostaComercial />} />
              
              {/* Listagem de Postos */}
              <Route path="/postos" element={<Postos />} />
            </Route>

            {/* 👇 ROTA CURINGA - REDIRECIONA QUALQUER ROTA NÃO ENCONTRADA PARA HOME */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ConsultorAuthProvider>
    </AuthProvider>
  );
}

export default App;