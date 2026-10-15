import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  FileText,
  Clock,
  Calendar,
  TrendingUp,
  ArrowRight,
  Bell,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  CheckSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import {
  getProjetos,
  getContratos,
  getAtividades,
  getFaturas,
  getDespesas,
  getSolicitacoes,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  ProjetoRecord,
  ContratoRecord,
  AtividadeRecord,
  FaturaRecord,
  DespesaRecord,
  SolicitacaoRecord,
} from '@/types'

export default function Index() {
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [contratos, setContratos] = useState<ContratoRecord[]>([])
  const [atividades, setAtividades] = useState<AtividadeRecord[]>([])
  const [faturas, setFaturas] = useState<FaturaRecord[]>([])
  const [despesas, setDespesas] = useState<DespesaRecord[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRecord[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const results = await Promise.allSettled([
        getProjetos(),
        getContratos(),
        getAtividades(),
        getFaturas(),
        getDespesas(),
        getSolicitacoes(),
      ])

      const [projRes, contRes, ativRes, fatRes, despRes, solRes] = results

      if (projRes.status === 'fulfilled' && Array.isArray(projRes.value)) {
        setProjetos(projRes.value)
      } else {
        setProjetos([])
      }

      if (contRes.status === 'fulfilled' && Array.isArray(contRes.value)) {
        setContratos(contRes.value)
      } else {
        setContratos([])
      }

      if (ativRes.status === 'fulfilled' && Array.isArray(ativRes.value)) {
        setAtividades(ativRes.value)
      } else {
        setAtividades([])
      }

      if (fatRes.status === 'fulfilled' && Array.isArray(fatRes.value)) {
        setFaturas(fatRes.value)
      } else {
        setFaturas([])
      }

      if (despRes.status === 'fulfilled' && Array.isArray(despRes.value)) {
        setDespesas(despRes.value)
      } else {
        setDespesas([])
      }

      if (solRes.status === 'fulfilled' && Array.isArray(solRes.value)) {
        setSolicitacoes(solRes.value)
      } else {
        setSolicitacoes([])
      }
    } catch (e) {
      console.error('Erro ao carregar dados do dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Real-time synchronization
  useRealtime('projetos', () => loadData())
  useRealtime('contratos', () => loadData())
  useRealtime('atividades', () => loadData())
  useRealtime('faturas', () => loadData())
  useRealtime('despesas', () => loadData())
  useRealtime('solicitacoes', () => loadData())

  const safeProjetos = useMemo(() => (Array.isArray(projetos) ? projetos : []), [projetos])
  const safeContratos = useMemo(() => (Array.isArray(contratos) ? contratos : []), [contratos])
  const safeAtividades = useMemo(() => (Array.isArray(atividades) ? atividades : []), [atividades])
  const safeFaturas = useMemo(() => (Array.isArray(faturas) ? faturas : []), [faturas])
  const safeDespesas = useMemo(() => (Array.isArray(despesas) ? despesas : []), [despesas])
  const safeSolicitacoes = useMemo(
    () => (Array.isArray(solicitacoes) ? solicitacoes : []),
    [solicitacoes],
  )

  // 1. KPIs
  // Faturamento do Mês atual (faturas pagas e emitidas deste mês)
  const faturamentoMes = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return safeFaturas
      .filter((f) => {
        if (!f || !f.data_emissao) return false
        const d = new Date(f.data_emissao)
        if (isNaN(d.getTime())) return false
        return (
          d.getUTCFullYear() === currentYear &&
          d.getUTCMonth() === currentMonth &&
          f.status !== 'vencida'
        )
      })
      .reduce((sum, f) => sum + (Number(f?.valor) || 0), 0)
  }, [safeFaturas])

  // Contratos Ativos (CLT + PJ)
  const contratosAtivosCount = useMemo(() => {
    return safeContratos.filter((c) => {
      const st = (c?.status || '').toLowerCase().trim()
      return st === 'ativo' || st === 'vencendo'
    }).length
  }, [safeContratos])

  // Valor a Receber (faturas emitidas ou vencidas ainda não pagas)
  const valorAReceber = useMemo(() => {
    return safeFaturas
      .filter((f) => {
        const st = (f?.status || '').toLowerCase().trim()
        return st === 'emitida' || st === 'vencida'
      })
      .reduce((sum, f) => sum + (Number(f?.valor) || 0), 0)
  }, [safeFaturas])

  // Horas de Prestador (Total aprovadas/pendentes deste mês)
  const horasPrestadorMes = useMemo(() => {
    return safeAtividades.reduce((sum, a) => sum + (Number(a?.horas) || 0), 0)
  }, [safeAtividades])

  // 2. Gráfico de Faturamento dos últimos 7 meses (interativo)
  const monthlyData = useMemo(() => {
    const monthNames = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez',
    ]
    const result: { month: string; value: number }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mIdx = d.getMonth()
      const y = d.getFullYear()
      const label = `${monthNames[mIdx]}`

      // Sum faturas of this month
      const sum = safeFaturas
        .filter((f) => {
          if (!f || !f.data_emissao) return false
          const fd = new Date(f.data_emissao)
          if (isNaN(fd.getTime())) return false
          return fd.getUTCMonth() === mIdx && fd.getUTCFullYear() === y
        })
        .reduce((s, f) => s + (Number(f?.valor) || 0), 0)

      result.push({
        month: label,
        value: sum,
      })
    }
    return result
  }, [safeFaturas])

  const maxMonthValue = useMemo(() => {
    const values = monthlyData.map((d) => d.value || 0)
    return Math.max(...values, 40000)
  }, [monthlyData])

  // 3. Gestão Financeira Resumo (Receitas x Despesas totais ou acumuladas)
  const totalReceitas = useMemo(() => {
    return safeFaturas
      .filter((f) => (f?.status || '').toLowerCase().trim() === 'paga')
      .reduce((sum, f) => sum + (Number(f?.valor) || 0), 0)
  }, [safeFaturas])

  const totalDespesas = useMemo(() => {
    return safeDespesas.reduce((sum, d) => sum + (Number(d?.valor) || 0), 0)
  }, [safeDespesas])

  const caixaRatio =
    totalReceitas > 0 ? Math.min(100, Math.round((totalDespesas / totalReceitas) * 100)) : 0

  // 4. Últimas 3 transações
  const ultimasTransacoes = useMemo(() => {
    const txs: {
      id: string
      tipo: 'receita' | 'despesa'
      descricao: string
      valor: number
      data: string
    }[] = []

    safeFaturas.slice(0, 3).forEach((f) => {
      if (!f) return
      txs.push({
        id: `fat-${f.id}`,
        tipo: 'receita',
        descricao: f.numero ? `Fatura ${f.numero}` : 'Fatura sem número',
        valor: Number(f.valor) || 0,
        data: f.data_emissao || f.created || '',
      })
    })

    safeDespesas.slice(0, 3).forEach((d) => {
      if (!d) return
      txs.push({
        id: `desp-${d.id}`,
        tipo: 'despesa',
        descricao: d.descricao || 'Despesa operacional',
        valor: Number(d.valor) || 0,
        data: d.data || d.created || '',
      })
    })

    return txs
      .sort((a, b) => {
        const tA = a.data ? new Date(a.data).getTime() : 0
        const tB = b.data ? new Date(b.data).getTime() : 0
        return tB - tA
      })
      .slice(0, 3)
  }, [safeFaturas, safeDespesas])

  // 5. Alertas Recentes
  const alertas = useMemo(() => {
    const list: { id: string; titulo: string; tipo: 'error' | 'warning' | 'info'; link: string }[] =
      []

    // Faturas vencidas
    const vencidas = safeFaturas.filter((f) => (f?.status || '').toLowerCase().trim() === 'vencida')
    vencidas.forEach((f) => {
      if (!f) return
      list.push({
        id: `venc-${f.id}`,
        titulo: `Fatura ${f.numero || ''} no valor de ${formatBRL(f.valor || 0)} está vencida`,
        tipo: 'error',
        link: '/faturamento',
      })
    })

    // Contratos vencendo
    const expirando = safeContratos.filter(
      (c) => (c?.status || '').toLowerCase().trim() === 'vencendo',
    )
    expirando.forEach((c) => {
      if (!c) return
      list.push({
        id: `exp-${c.id}`,
        titulo: `Contrato de ${c.nome || 'Prestador'} (${c.tipo || 'PJ'}) está próximo do vencimento`,
        tipo: 'warning',
        link: `/contratos/${c.id}`,
      })
    })

    // Atividades pendentes
    const pendentes = safeAtividades.filter(
      (a) => (a?.status || '').toLowerCase().trim() === 'pendente',
    )
    if (pendentes.length > 0) {
      list.push({
        id: 'pend-atividades',
        titulo: `${pendentes.length} atividades de prestadores aguardando aprovação`,
        tipo: 'info',
        link: '/atividades',
      })
    }

    return list
  }, [safeFaturas, safeContratos, safeAtividades])

  // 6. Pendências em Aberto mais urgentes (atrasadas primeiro, limite 5)
  const pendenciasEmAberto = useMemo(() => {
    const abertas = safeSolicitacoes.filter((s) => {
      if (!s) return false
      const st = (s.status || '').toLowerCase().trim()
      return st !== 'concluída' && st !== 'concluida' && st !== 'cancelada'
    })

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const isAtrasada = (s: SolicitacaoRecord) => {
      if (!s?.prazo) return false
      const p = new Date(s.prazo)
      return !isNaN(p.getTime()) && p < hoje
    }

    const prioridadePeso: Record<string, number> = {
      Urgente: 4,
      Alta: 3,
      Média: 2,
      Media: 2,
      Baixa: 1,
    }

    return abertas
      .sort((a, b) => {
        const aAtraso = isAtrasada(a)
        const bAtraso = isAtrasada(b)
        if (aAtraso !== bAtraso) return aAtraso ? -1 : 1

        const pA = prioridadePeso[a?.prioridade || ''] || 0
        const pB = prioridadePeso[b?.prioridade || ''] || 0
        if (pA !== pB) return pB - pA

        const tA = a?.prazo ? new Date(a.prazo).getTime() : 0
        const tB = b?.prazo ? new Date(b.prazo).getTime() : 0
        if (tA && tB) {
          return tA - tB
        }
        if (tA) return -1
        if (tB) return 1

        const cA = a?.created ? new Date(a.created).getTime() : 0
        const cB = b?.created ? new Date(b.created).getTime() : 0
        return cB - cA
      })
      .slice(0, 5)
  }, [safeSolicitacoes])

  const [hoveredBar, setHoveredBar] = useState<{ month: string; value: number } | null>(null)

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-[#1FAF7A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-[#64748B]">Carregando indicadores do painel...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      {/* ROW 1: KPIS (4 Cards com hover elevado) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento do Mês */}
        <Card className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-[#E2E8F0]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Faturamento do Mês
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1FAF7A] flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1E293B] tabular-nums">
                {formatBRL(faturamentoMes)}
              </span>
            </div>
            <div className="mt-2.5 flex items-center text-xs text-[#64748B] font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-1 text-[#1FAF7A]" />
              <span>{faturamentoMes > 0 ? 'Faturamento apurado' : 'Aguardando faturamentos'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Contratos Ativos */}
        <Card className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-[#E2E8F0]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Contratos Ativos
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1E293B] tabular-nums">
                {contratosAtivosCount}
              </span>
              <span className="text-xs text-[#64748B]">colaboradores & PJs</span>
            </div>
            <div className="mt-2.5 flex items-center text-xs text-[#64748B]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#1FAF7A] mr-1.5" />
              <span>
                {contratosAtivosCount === 0
                  ? 'Nenhum contrato ativo'
                  : `${contratosAtivosCount} em vigência`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Valor a Receber */}
        <Card className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-[#E2E8F0]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Valor a Receber
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1E293B] tabular-nums">
                {formatBRL(valorAReceber)}
              </span>
            </div>
            <div className="mt-2.5 flex items-center text-xs text-amber-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mr-1" />
              <span>
                {safeFaturas.filter((f) => {
                  const st = (f?.status || '').toLowerCase().trim()
                  return st === 'emitida' || st === 'vencida'
                }).length === 0
                  ? 'Sem pendências a receber'
                  : `${
                      safeFaturas.filter((f) => {
                        const st = (f?.status || '').toLowerCase().trim()
                        return st === 'emitida' || st === 'vencida'
                      }).length
                    } fatura(s) pendente(s)`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Horas de Prestador */}
        <Card className="hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 border-[#E2E8F0]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Horas de Prestador (Mês)
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1E293B] tabular-nums">
                {horasPrestadorMes}h
              </span>
              <span className="text-xs text-[#64748B]">reportadas</span>
            </div>
            <div className="mt-2.5 flex items-center text-xs text-purple-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>
                {safeAtividades
                  .filter((a) => (a?.status || '').toLowerCase().trim() === 'aprovada')
                  .reduce((s, a) => s + (Number(a?.horas) || 0), 0)}
                h aprovadas
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: GRÁFICO (2/3) + GESTÃO FINANCEIRA RESUMO (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Faturamento Mensal (2/3) */}
        <Card className="lg:col-span-2 border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Faturamento Mensal Consolidado
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Histórico dos últimos 7 meses (em R$)
                </CardDescription>
              </div>
              {hoveredBar && (
                <div className="bg-[#1E293B] text-white text-xs px-2.5 py-1 rounded-md font-mono shadow">
                  {hoveredBar.month}: {formatBRL(hoveredBar.value)}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100">
              {monthlyData.map((item, idx) => {
                const heightPct = Math.max(12, Math.round((item.value / maxMonthValue) * 100))
                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                    onMouseEnter={() => setHoveredBar(item)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-[#1E293B] text-white text-[11px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {formatBRL(item.value)}
                    </div>
                    {/* Bar */}
                    <div
                      className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-[#1FAF7A] to-[#2ED3A0] group-hover:brightness-110 transition-all duration-300 shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="mt-3 text-xs font-semibold text-[#64748B] group-hover:text-[#1FAF7A]">
                      {item.month}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center justify-between pt-3 text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gradient-to-tr from-[#1FAF7A] to-[#2ED3A0]" />
                <span>Receitas faturadas (Termos de Parceria e Faturas)</span>
              </div>
              <span className="font-semibold text-[#1E293B]">Meta: R$ 45.000 / mês</span>
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Gestão Financeira (1/3) */}
        <Card className="border-[#E2E8F0] shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#1E293B]">Caixa & Despesas</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Balanço mensal consolidado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium text-[#64748B]">Comprometimento do Caixa</span>
                <span className="font-bold text-[#1E293B]">{caixaRatio}% consumido</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1FAF7A] to-[#2ED3A0] rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${caixaRatio}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1">
                <span>Despesas: {formatBRL(totalDespesas)}</span>
                <span>Receitas: {formatBRL(totalReceitas)}</span>
              </div>
            </div>

            {/* Últimas Transações */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#94A3B8] block mb-2">
                Últimas Transações
              </span>
              <div className="space-y-2">
                {ultimasTransacoes.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs text-[#94A3B8]">
                    Nenhuma movimentação registrada ainda.
                  </div>
                ) : (
                  ultimasTransacoes.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            tx.tipo === 'receita' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-medium text-[#1E293B] truncate">{tx.descricao}</span>
                      </div>
                      <span
                        className={`font-semibold tabular-nums shrink-0 ml-2 ${
                          tx.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.tipo === 'receita' ? '+' : '-'} {formatBRL(tx.valor)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full text-xs font-semibold text-[#1FAF7A] border-[#1FAF7A]/30 hover:bg-[#1FAF7A]/10 mt-2"
            >
              <Link to="/financeiro">
                Ver Relatório Completo
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2.5: WIDGET PENDÊNCIAS EM ABERTO */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Pendências em Aberto
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Demandas prioritárias e prazos que requerem atenção da equipe
              </CardDescription>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-[#1FAF7A]"
          >
            <Link to="/solicitacoes">
              Ver todas (
              {
                safeSolicitacoes.filter((s) => {
                  const st = (s?.status || '').toLowerCase().trim()
                  return st !== 'concluída' && st !== 'concluida' && st !== 'cancelada'
                }).length
              }
              )
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendenciasEmAberto.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3.5 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Nenhuma pendência ou solicitação em aberto no momento. Tudo em dia!</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {pendenciasEmAberto.map((item) => {
                const hoje = new Date()
                hoje.setHours(0, 0, 0, 0)
                const atrasada = item.prazo ? new Date(item.prazo) < hoje : false

                return (
                  <Link
                    key={item.id}
                    to="/solicitacoes"
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#1FAF7A] hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            item.prioridade === 'Urgente'
                              ? 'bg-rose-100 text-rose-800'
                              : item.prioridade === 'Alta'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.prioridade}
                        </span>
                        <span className="text-[10px] text-[#64748B] font-medium">
                          {item.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-[#1E293B] group-hover:text-[#1FAF7A] transition-colors line-clamp-2 leading-tight">
                        {item.titulo}
                      </h4>

                      {item.expand?.projeto && (
                        <p className="text-[10px] text-[#64748B] truncate mt-1">
                          {item.expand.projeto.nome}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-[#64748B] truncate max-w-[90px]">
                        {item.responsavel ? item.responsavel.split(' ')[0] : '—'}
                      </span>
                      {item.prazo ? (
                        <span
                          className={`font-semibold ${
                            atrasada ? 'text-rose-600 font-bold' : 'text-[#64748B]'
                          }`}
                        >
                          {formatDateBR(item.prazo)} {atrasada && '!'}
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">Sem prazo</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROW 3: PROJETOS ATIVOS (Tabela compacta full width) */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#1E293B]">Projetos Ativos</CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Acompanhamento de escopo, orçamento e execução
            </CardDescription>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-[#1FAF7A]"
          >
            <Link to="/projetos">
              Ver todos os projetos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {safeProjetos.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#64748B]">
              <p>Nenhum projeto cadastrado no momento.</p>
              <Button asChild size="sm" className="mt-3 bg-[#1FAF7A] hover:bg-[#179C6E] text-white">
                <Link to="/projetos">Cadastrar Primeiro Projeto</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold">
                    <th className="pb-3 pl-2">Nome do Projeto</th>
                    <th className="pb-3 px-3">Parceiro / Fomentador</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Progresso</th>
                    <th className="pb-3 px-3">Valor do Contrato</th>
                    <th className="pb-3 pr-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {safeProjetos.slice(0, 5).map((p) => {
                    const progVal = Number(p.progresso) || 0
                    const clampedProg = Math.min(100, Math.max(0, progVal))
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 pl-2 font-semibold text-[#1E293B]">
                          <Link to={`/projetos/${p.id}`} className="hover:text-[#1FAF7A]">
                            {p.nome || 'Projeto sem nome'}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-[#64748B]">{p.parceiro || '—'}</td>
                        <td className="py-3 px-3">
                          <StatusBadge status={p.status || 'ativo'} />
                        </td>
                        <td className="py-3 px-3 w-40">
                          <div className="flex items-center gap-2">
                            <Progress value={clampedProg} className="h-2 flex-1" />
                            <span className="font-mono text-[11px] text-[#64748B]">
                              {clampedProg}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1E293B] tabular-nums">
                          {formatBRL(Number(p.valor_total) || 0)}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[#1FAF7A]"
                          >
                            <Link to={`/projetos/${p.id}`}>
                              Ver detalhes
                              <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ROW 4: ALERTAS RECENTES */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-[#64748B]" />
              {alertas.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Alertas e Notificações Importantes
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Faturas a vencer, contratos expirando e validações pendentes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Nenhum alerta crítico no momento. Todas as atividades e faturas estão em dia!
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {alertas.map((a) => (
                <Link
                  key={a.id}
                  to={a.link}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs ${
                    a.tipo === 'error'
                      ? 'bg-red-50/60 border-red-200 hover:bg-red-50 text-red-900'
                      : a.tipo === 'warning'
                        ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50 text-amber-900'
                        : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50 text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {a.tipo === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    {a.tipo === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    {a.tipo === 'info' && <Clock className="w-4 h-4 text-blue-600 shrink-0" />}
                    <span className="font-medium">{a.titulo}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
