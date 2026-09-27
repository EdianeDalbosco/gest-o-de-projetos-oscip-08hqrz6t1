import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function ConfirmEmailChange() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Token de alteração não encontrado.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await pb.collection('users').confirmEmailChange(token, password)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao confirmar a alteração do e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Confirmar mudança de e-mail"
      subtitle="Finalize a alteração do endereço da sua conta"
    >
      {success ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm text-[#64748B]">
            E-mail atualizado com sucesso! Faça login novamente com seu novo endereço institucional.
          </p>
          <Button asChild className="w-full bg-[#1FAF7A] hover:bg-[#179C6E] text-white">
            <Link to="/login">Fazer Login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#1E293B]">
              Digite sua senha atual para confirmar
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold shadow-md shadow-[#1FAF7A]/25 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar novo e-mail'
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link to="/login" className="text-xs font-medium text-[#64748B] hover:text-[#1FAF7A]">
              Cancelar e voltar ao login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
