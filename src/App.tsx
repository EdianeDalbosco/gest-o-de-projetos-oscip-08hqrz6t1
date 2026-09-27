import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/projetos" element={<ProjetosList />} />
            <Route path="/projetos/:id" element={<ProjetoDetail />} />
            <Route path="/convenios" element={<ConveniosList />} />
            <Route path="/convenios/:id" element={<ConvenioDetail />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/financeiro" element={<GestaoFinanceira />} />
            <Route path="/contratos" element={<ContratosList />} />
            <Route path="/contratos/:id" element={<ContratoDetail />} />
            <Route path="/contratos/novo/elaborar" element={<ElaborarContrato />} />
            <Route path="/atividades" element={<AtividadesList />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
