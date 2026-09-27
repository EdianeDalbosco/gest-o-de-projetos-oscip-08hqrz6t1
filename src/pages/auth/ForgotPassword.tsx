import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, informe um endereço de e-mail válido.')
      return
    }

    setLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
      setSent(true)
    } catch (err: unknown) {
      // PocketBase might fail if email does not exist, but for security show friendly feedback
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha">
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm text-[#64748B]">
            Se houver uma conta associada a <strong className="text-[#1E293B]">{email}</strong>,
            você receberá instruções com o link de recuperação.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao login
            </Link>
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
            <Label htmlFor="email" className="text-xs font-semibold text-[#1E293B]">
              E-mail cadastrado
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@organizacao.org"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold shadow-md shadow-[#1FAF7A]/25 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando link...
              </>
            ) : (
              'Enviar link de recuperação'
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-medium text-[#64748B] hover:text-[#1FAF7A]"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}
