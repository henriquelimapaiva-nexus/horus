// src/App.jsx
import React from "react";
// Alterado de BrowserRouter para HashRouter para evitar erro 404 no deploy Vercel
import { HashRouter as Router, Routes, Route } from "react-router-dom";
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
import NovaLinha from "./pages/NovaLinha";
import PostoForm from "./pages/PostoForm";

// Coleta de Dados
import ColetaDados from "./pages/ColetaDados";

// 🟢 OEE em Tempo Real
import OEE from "./pages/OEE";

// 🟢 SPC - Controle de Qualidade
import SPC from "./pages/SPC";

// 🟢 TPM - Manutenção
import TPM from "./pages/TPM";

// 🟢 RH - Gestão de Talentos
import RH from "./pages/RH";

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

// Página de Listagem de Postos
import Postos from "./pages/Postos";

// 👇 IMPORTS DO CONSULTOR
import ConsultorLogin from "./pages/consultor/ConsultorLogin";
import ConsultorPrivateLayout from "./pages/consultor/ConsultorPrivateLayout";
import ConsultorLayout from "./pages/consultor/ConsultorLayout";
import ConsultorDashboard from "./pages/consultor/ConsultorDashboard";
import ConsultorClientes from "./pages/consultor/ConsultorClientes";
import ConsultorRelatorios from "./pages/consultor/ConsultorRelatorios";
import ConsultorConfiguracoes from "./pages/consultor/ConsultorConfiguracoes";

// 🟢 IMPORT - IA DE PRECIFICAÇÃO
import IAPrecificacao from "./pages/consultor/ias/IAPrecificacao";

// 🟢 IMPORT - IA DE PRECIFICAÇÃO PRÉ-CONTRATO
import IAPrecificacaoPreContrato from "./pages/consultor/ias/IAPrecificacaoPreContrato";

// 🟢 IMPORT - PROPOSTA COMERCIAL PRÉ-CONTRATO
import PropostaComercialPreContrato from "./pages/consultor/PropostaComercialPreContrato";

// 🟢 IMPORT - CONTRATO PRÉ-DIAGNÓSTICO
import ContratoPreDiagnostico from "./pages/consultor/ContratoPreDiagnostico";

// 🟢 IMPORT - CONTRATO IMPLEMENTAÇÃO (FASE 2+3)
import ContratoImplementacao from "./pages/consultor/ContratoImplementacao";

// 🟢 IMPORT - PROPOSTA COMERCIAL (CLIENTES CADASTRADOS)
import PropostaComercial from "./pages/consultor/PropostaComercial";

// 🟢 IMPORT - IA DE SUGESTÕES
import IASugestoes from "./pages/consultor/IASugestoes";

// 🟢 NOVO IMPORT - CHECKLIST
import Checklist from "./pages/consultor/Checklist";

// 🟢 NOVO IMPORT - REGISTRO DE HORAS
import RegistroHoras from "./pages/consultor/RegistroHoras";

// 🟢 NOVO IMPORT - LEADS (PROSPECÇÃO COMERCIAL)
import Leads from "./pages/consultor/Leads";

// 👇 NOVOS CONTEXTS
import { AuthProvider } from "./context/AuthContext";
import { ConsultorAuthProvider } from "./context/ConsultorAuthContext";

function App() {
  return (
    <AuthProvider>
      <ConsultorAuthProvider>
        <Router>
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
                style: { background: '#16a34a' },
                icon: '✅',
              },
              error: {
                style: { background: '#dc2626' },
                icon: '❌',
              },
              loading: {
                style: { background: '#1E3A8A' },
                icon: '⏳',
              },
              warning: {
                style: { background: '#f59e0b' },
                icon: '⚠️',
              },
            }}
          />
          
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            
            <Route path="/consultor/login" element={<ConsultorLogin />} />
            
            <Route element={<ConsultorPrivateLayout />}>
              <Route path="/consultor" element={<ConsultorLayout />}>
                <Route index element={<ConsultorDashboard />} />
                <Route path="clientes" element={<ConsultorClientes />} />
                <Route path="relatorios" element={<ConsultorRelatorios />} />
                <Route path="configuracoes" element={<ConsultorConfiguracoes />} />
                <Route path="ias/precificacao" element={<IAPrecificacao />} />
                <Route path="ias/precificacao-pre-contrato" element={<IAPrecificacaoPreContrato />} />
                <Route path="ias/sugestoes" element={<IASugestoes />} />
                <Route path="checklist" element={<Checklist />} />
                <Route path="proposta-pre-contrato" element={<PropostaComercialPreContrato />} />
                <Route path="contrato-pre-diagnostico" element={<ContratoPreDiagnostico />} />
                <Route path="contrato-implementacao" element={<ContratoImplementacao />} />
                <Route path="proposta" element={<PropostaComercial />} />
                {/* 🟢 NOVA ROTA - REGISTRO DE HORAS */}
                <Route path="horas" element={<RegistroHoras />} />
                {/* 🟢 NOVA ROTA - LEADS (PROSPECÇÃO COMERCIAL) */}
                <Route path="leads" element={<Leads />} />
              </Route>
            </Route>
            
            <Route element={<PrivateLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/linhas" element={<Linhas />} />
              <Route path="/linhas/:id" element={<FichaLinha />} />
              <Route path="/empresas" element={<Empresa />} />
              <Route path="/conhecimento" element={<Conhecimento />} />
              
              <Route path="/linhas/novo" element={<NovaLinha />} />
              <Route path="/linhas/editar/:id" element={<LinhaForm />} />
              <Route path="/postos/novo/:linhaId" element={<PostoForm />} />
              <Route path="/postos/editar/:postoId/linha/:linhaId" element={<PostoForm />} />
              <Route path="/coleta/:linhaId" element={<ColetaDados />} />
              <Route path="/coleta-dados" element={<ColetaDados />} />
              
              {/* 🟢 OEE em Tempo Real */}
              <Route path="/oee" element={<OEE />} />
              
              {/* 🟢 SPC - Controle de Qualidade */}
              <Route path="/spc" element={<SPC />} />
              
              {/* 🟢 TPM - Manutenção */}
              <Route path="/tpm" element={<TPM />} />
              
              {/* 🟢 RH - Gestão de Talentos */}
              <Route path="/rh" element={<RH />} />
              
              <Route path="/relatorios" element={<RelatorioProfissional />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/cargos" element={<Cargos />} />
              <Route path="/colaboradores" element={<Colaboradores />} />
              <Route path="/financeiro" element={<DashboardFinanceiro />} />
              <Route path="/perdas" element={<Perdas />} />
              <Route path="/painel" element={<PainelExecutivo />} />
              <Route path="/postos" element={<Postos />} />
            </Route>
          </Routes>
        </Router>
      </ConsultorAuthProvider>
    </AuthProvider>
  );
}

export default App;