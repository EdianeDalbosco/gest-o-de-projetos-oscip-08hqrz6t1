import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({
  children,
  minRole,
}: {
  children: React.ReactNode
  minRole?: 'admin' | 'gestor' | 'operador' | 'leitura'
}) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8FA] gap-3">
        <Loader2 className="w-8 h-8 text-[#1FAF7A] animate-spin" />
        <span className="text-sm text-[#64748B]">Carregando sessão...</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (minRole) {
    const roleWeights: Record<string, number> = {
      admin: 4,
      gestor: 3,
      operador: 2,
      leitura: 1,
    }
    const currentWeight = roleWeights[user?.role || 'admin'] || 1
    const requiredWeight = roleWeights[minRole] || 1

    if (currentWeight < requiredWeight) {
      return <Navigate to="/" replace />
    }
  }

  return <>{children}</>
}
