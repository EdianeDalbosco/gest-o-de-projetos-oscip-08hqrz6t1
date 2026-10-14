import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'

// Pages
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import ConfirmEmailChange from './pages/auth/ConfirmEmailChange'

import ProjetosList from './pages/projetos/ProjetosList'
import ProjetoDetail from './pages/projetos/ProjetoDetail'
import ConveniosList from './pages/convenios/ConveniosList'
import ConvenioDetail from './pages/convenios/ConvenioDetail'
import Faturamento from './pages/financeiro/Faturamento'
import GestaoFinanceira from './pages/financeiro/GestaoFinanceira'
import ContratosList from './pages/contratos/ContratosList'
import ContratoDetail from './pages/contratos/ContratoDetail'
import ElaborarContrato from './pages/contratos/ElaborarContrato'
import AtividadesList from './pages/contratos/AtividadesList'
import PrestadoresList from './pages/contratos/PrestadoresList'
import ConfiguracaoOrganizacao from './pages/configuracao/ConfiguracaoOrganizacao'
import UsuariosList from './pages/usuarios/UsuariosList'
import SolicitacoesList from './pages/solicitacoes/SolicitacoesList'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />

          {/* Protected Application Routes inside Layout */}
          <Route
            element={
              <ErrorBoundary fallbackTitle="Falha geral na navegação do sistema">
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              </ErrorBoundary>
            }
          >
            <Route
              path="/"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar o Dashboard Geral">
                  <Index />
                </ErrorBoundary>
              }
            />
            <Route
              path="/projetos"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar a Lista de Projetos">
                  <ProjetosList />
                </ErrorBoundary>
              }
            />
            <Route
              path="/projetos/:id"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar os Detalhes do Projeto">
                  <ProjetoDetail />
                </ErrorBoundary>
              }
            />
            <Route
              path="/solicitacoes"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar a Lista de Solicitações">
                  <SolicitacoesList />
                </ErrorBoundary>
              }
            />
            <Route
              path="/convenios"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar os Instrumentos Municipais">
                  <ConveniosList />
                </ErrorBoundary>
              }
            />
            <Route
              path="/convenios/:id"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar os Detalhes do Instrumento">
                  <ConvenioDetail />
                </ErrorBoundary>
              }
            />
            <Route
              path="/faturamento"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar a tela de Faturamento">
                  <Faturamento />
                </ErrorBoundary>
              }
            />
            <Route
              path="/financeiro"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar Gestão Financeira">
                  <GestaoFinanceira />
                </ErrorBoundary>
              }
            />
            <Route
              path="/prestadores"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar Prestadores e Colaboradores">
                  <PrestadoresList />
                </ErrorBoundary>
              }
            />
            <Route
              path="/contratos"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar a Lista de Contratos">
                  <ContratosList />
                </ErrorBoundary>
              }
            />
            <Route
              path="/contratos/:id"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar os Detalhes do Contrato">
                  <ContratoDetail />
                </ErrorBoundary>
              }
            />
            <Route
              path="/contratos/novo/elaborar"
              element={
                <ErrorBoundary fallbackTitle="Falha ao elaborar contrato">
                  <ElaborarContrato />
                </ErrorBoundary>
              }
            />
            <Route
              path="/atividades"
              element={
                <ErrorBoundary fallbackTitle="Falha ao renderizar a Lista de Atividades">
                  <AtividadesList />
                </ErrorBoundary>
              }
            />
            <Route
              path="/configuracao-organizacao"
              element={
                <ProtectedRoute minRole="gestor">
                  <ErrorBoundary fallbackTitle="Falha ao renderizar Configuração da Organização">
                    <ConfiguracaoOrganizacao />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute minRole="admin">
                  <ErrorBoundary fallbackTitle="Falha ao renderizar Gestão de Usuários">
                    <UsuariosList />
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
