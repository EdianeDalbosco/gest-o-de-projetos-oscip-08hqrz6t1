import React from 'react'
import { Sprout } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F7F8FA] via-[#EBF9F3] to-[#D5F5E7] p-4 sm:p-6">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1FAF7A] to-[#2ED3A0] flex items-center justify-center text-white shadow-md shadow-[#1FAF7A]/20 mb-3">
            <Sprout className="w-8 h-8" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1E293B]">
            ONG <span className="text-[#1FAF7A]">Gestão</span>
          </span>
          <h1 className="text-2xl font-bold text-[#1E293B] mt-4">{title}</h1>
          {subtitle && <p className="text-sm text-[#64748B] mt-1.5">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
