import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const norm = (status || '').toLowerCase()

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200'
  let label = status

  switch (norm) {
    case 'ativo':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200'
      label = 'Ativo'
      break
    case 'concluido':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200'
      label = 'Concluído'
      break
    case 'pausado':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200'
      label = 'Pausado'
      break
    case 'cancelado':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200'
      label = 'Cancelado'
      break
    case 'vencendo':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
      label = 'Vencendo'
      break
    case 'encerrado':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200'
      label = 'Encerrado'
      break
    case 'paga':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200'
      label = 'Paga'
      break
    case 'emitida':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200'
      label = 'Emitida'
      break
    case 'vencida':
      colorClasses = 'bg-red-50 text-red-700 border-red-200 font-semibold'
      label = 'Vencida'
      break
    case 'aprovada':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200'
      label = 'Aprovada'
      break
    case 'pendente':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200'
      label = 'Pendente'
      break
    case 'rejeitada':
      colorClasses = 'bg-red-50 text-red-700 border-red-200'
      label = 'Rejeitada'
      break
    case 'suspenso':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200'
      label = 'Suspenso'
      break
    case 'em_analise':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200'
      label = 'Em Análise'
      break
    case 'nao_iniciada':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200'
      label = 'Não Iniciada'
      break
    case 'em_andamento':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200'
      label = 'Em Andamento'
      break
    default:
      label = status
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
        colorClasses,
        className,
      )}
    >
      {label}
    </Badge>
  )
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    })
  } catch (_) {
    return '-'
  }
}
