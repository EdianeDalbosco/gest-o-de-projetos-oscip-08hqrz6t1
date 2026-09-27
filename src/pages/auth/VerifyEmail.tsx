import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('Token de validação não encontrado no link.')
      return
    }

    pb.collection('users')
      .confirmVerification(token)
      .then(() => {
        setSuccess(true)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Falha na confirmação do e-mail.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  return (
    <AuthLayout title="Verificação de E-mail" subtitle="Confirmação de cadastro institucional">
      <div className="text-center space-y-5">
        {loading && (
          <div className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1FAF7A]" />
            <p className="text-sm text-[#64748B]">Validando seu e-mail institucional...</p>
          </div>
        )}

        {!loading && success && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B]">E-mail verificado com sucesso!</h2>
            <p className="text-sm text-[#64748B]">
              Sua conta foi ativada. Você já pode acessar todas as funcionalidades da organização.
            </p>
            <Button asChild className="w-full bg-[#1FAF7A] hover:bg-[#179C6E] text-white">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </div>
        )}

        {!loading && !success && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-[#EF4444] flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#1E293B]">Não foi possível verificar</h2>
            <p className="text-sm text-[#64748B]">
              {error || 'O link pode estar expirado ou já foi utilizado.'}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
