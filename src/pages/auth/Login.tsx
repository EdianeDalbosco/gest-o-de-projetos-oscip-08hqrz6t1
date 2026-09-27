import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('edianedalbosco@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: { email?: string; password?: string } = {}
    if (!email.trim()) {
      errs.email = 'O e-mail é obrigatório.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Insira um formato de e-mail válido.'
    }
    if (!password) {
      errs.password = 'A senha é obrigatória.'
    } else if (password.length < 8) {
      errs.password = 'A senha deve ter no mínimo 8 caracteres.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (!validate()) return

    setLoading(true)
    try {
      await login(email, password)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao autenticar.'
      setErrors({
        general:
          message.toLowerCase().includes('failed to authenticate') ||
          message.toLowerCase().includes('invalid')
            ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
            : message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Acesse sua conta"
      subtitle="Controle de projetos, contratos e gestão financeira"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.general}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-[#1E293B]">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.org"
            className={errors.email ? 'border-red-500 focus-visible:ring-red-400' : ''}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-[#1E293B]">
              Senha
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-[#1FAF7A] hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={errors.password ? 'border-red-500 focus-visible:ring-red-400' : ''}
          />
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(c) => setRememberMe(Boolean(c))}
          />
          <label
            htmlFor="remember"
            className="text-xs font-medium text-[#64748B] leading-none cursor-pointer"
          >
            Lembrar de mim
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold shadow-md shadow-[#1FAF7A]/25 transition-all mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>

        <div className="pt-3 text-center">
          <p className="text-xs text-[#64748B]">
            Credenciais padrão:{' '}
            <span className="font-mono text-[#1E293B]">edianedalbosco@gmail.com</span> /{' '}
            <span className="font-mono text-[#1E293B]">Skip@Pass</span>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
