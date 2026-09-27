import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A nova senha deve possuir ao menos 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    if (!token) {
      setError('Token de recuperação inválido ou ausente na URL.')
      return
    }

    setLoading(true)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao redefinir senha.'
      setError(msg.includes('token') ? 'Token de recuperação expirado ou inválido.' : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Redefinir senha" subtitle="Defina sua nova senha de acesso institucional">
      {success ? (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm font-medium text-[#1E293B]">
            Senha alterada com sucesso! Redirecionando para o login...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token && (
            <div className="flex items-center gap-2 p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>
                Nenhum token foi detectado. Certifique-se de acessar pelo link recebido por e-mail.
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-[#1E293B]">
              Nova senha (mínimo 8 caracteres)
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

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm" className="text-xs font-semibold text-[#1E293B]">
              Confirmar nova senha
            </Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
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
                Redefinindo senha...
              </>
            ) : (
              'Redefinir senha'
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link to="/login" className="text-xs font-medium text-[#64748B] hover:text-[#1FAF7A]">
              Voltar ao login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
