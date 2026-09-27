import React, { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalNovaDespesa } from '@/components/ModalNovaDespesa'
import { getFaturas, getDespesas } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type { FaturaRecord, DespesaRecord, DespesaCategoria } from '@/types'

export default function GestaoFinanceira() {
  const [faturas, setFaturas] = useState<FaturaRecord[]>([])
  const [despesas, setDespesas] = useState<DespesaRecord[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<number>(4) // 0-based: 4 = Maio
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2024)
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [fatList, despList] = await Promise.all([getFaturas(), getDespesas()])
      setFaturas(fatList)
      setDespesas(despList)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime('faturas', () => fetchData())
  useRealtime('despesas', () => fetchData())

  // Filtered by Selected Month/Year
  const receitasMes = useMemo(() => {
    return faturas
      .filter((f) => {
        if (!f.data_emissao) return false
        const d = new Date(f.data_emissao)
        return (
          d.getUTCFullYear() === anoSelecionado &&
          d.getUTCMonth() === mesSelecionado &&
          f.status === 'paga'
        )
      })
      .reduce((s, f) => s + (Number(f.valor) || 0), 0)
  }, [faturas, mesSelecionado, anoSelecionado])

  const despesasMes = useMemo(() => {
    return despesas
      .filter((d) => {
        if (!d.data) return false
        const dt = new Date(d.data)
        return dt.getUTCFullYear() === anoSelecionado && dt.getUTCMonth() === mesSelecionado
      })
      .reduce((s, d) => s + (Number(d.valor) || 0), 0)
  }, [despesas, mesSelecionado, anoSelecionado])

  const resultadoMes = receitasMes - despesasMes
  const margemPercentual = receitasMes > 0 ? (resultadoMes / receitasMes) * 100 : 0

  // Category breakdown for Pie representation
  const categoryTotals = useMemo(() => {
    const cats: Record<string, number> = {
      Pessoal: 0,
      Operacional: 0,
      Infraestrutura: 0,
      Marketing: 0,
      Outros: 0,
    }

    despesas
      .filter((d) => {
        if (!d.data) return false
        const dt = new Date(d.data)
        return dt.getUTCFullYear() === anoSelecionado && dt.getUTCMonth() === mesSelecionado
      })
      .forEach((d) => {
        const c = d.categoria || 'Outros'
        cats[c] = (cats[c] || 0) + Number(d.valor)
      })

    return cats
  }, [despesas, mesSelecionado, anoSelecionado])

  // Transactions list for selected month
  const transacoes = useMemo(() => {
    const list: {
      id: string
      tipo: 'receita' | 'despesa'
      categoria: string
      descricao: string
      valor: number
      data: string
    }[] = []

    // Receitas
    faturas
      .filter((f) => {
        if (!f.data_emissao) return false
        const d = new Date(f.data_emissao)
        return d.getUTCFullYear() === anoSelecionado && d.getUTCMonth() === mesSelecionado
      })
      .forEach((f) => {
        list.push({
          id: `rec-${f.id}`,
          tipo: 'receita',
          categoria: 'Faturamento',
          descricao: `Fatura ${f.numero} - ${f.expand?.projeto_id?.nome || 'Institucional'}`,
          valor: f.valor,
          data: f.data_emissao,
        })
      })

    // Despesas
    despesas
      .filter((d) => {
        if (!d.data) return false
        const dt = new Date(d.data)
        const matchMonth =
          dt.getUTCFullYear() === anoSelecionado && dt.getUTCMonth() === mesSelecionado
        const matchCat = categoriaFilter === 'todos' || d.categoria === categoriaFilter
        return matchMonth && matchCat
      })
      .forEach((d) => {
        list.push({
          id: `desp-${d.id}`,
          tipo: 'despesa',
          categoria: d.categoria,
          descricao: d.descricao,
          valor: d.valor,
          data: d.data,
        })
      })

    return list.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }, [faturas, despesas, mesSelecionado, anoSelecionado, categoriaFilter])

  // Margem progress color
  const getMargemColor = () => {
    if (margemPercentual >= 20) return 'bg-[#10B981]' // verde >= 20%
    if (margemPercentual >= 10) return 'bg-[#F59E0B]' // amarelo 10-20%
    return 'bg-[#EF4444]' // vermelho < 10%
  }

  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  return (
    <div className="space-y-6">
      {/* Local Navbar: Mês / Ano */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0]">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Relatório Financeiro Mensal</h2>
          <p className="text-xs text-[#64748B]">
            Demonstrativo de receitas, despesas operacionais e controle de margem de
            sustentabilidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(mesSelecionado)}
            onValueChange={(v) => setMesSelecionado(Number(v))}
          >
            <SelectTrigger className="w-36 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(anoSelecionado)}
            onValueChange={(v) => setAnoSelecionado(Number(v))}
          >
            <SelectTrigger className="w-24 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setModalOpen(true)}
            className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs h-9 px-3 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova Despesa
          </Button>
        </div>
      </div>

      {/* Cards do Mês (Receitas, Despesas, Resultado) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receitas */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase">
                Receitas Totais
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">
              {formatBRL(receitasMes)}
            </p>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              Faturas quitadas em {months[mesSelecionado]}
            </span>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase">
                Despesas do Mês
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#EF4444] flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-600 mt-2 tabular-nums">
              {formatBRL(despesasMes)}
            </p>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              Custos e desembolsos executados
            </span>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B] uppercase">
                Resultado Líquido
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  resultadoMes >= 0 ? 'bg-emerald-50 text-[#10B981]' : 'bg-rose-50 text-[#EF4444]'
                }`}
              >
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p
              className={`text-2xl font-bold mt-2 tabular-nums ${
                resultadoMes >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatBRL(resultadoMes)}
            </p>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              {resultadoMes >= 0 ? 'Superávit no período' : 'Déficit no período'}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Controle de Margem Mínima + Gráfico Pizza Receitas vs Despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controle de Margem Mínima (Barra de Progresso Colorida) */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Controle de Margem Mínima
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Regra de conformidade: margem sustentável ideal ≥ 20%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#1E293B]">Margem Operacional</span>
              <span className="font-bold text-sm tabular-nums text-[#1E293B]">
                {margemPercentual.toFixed(1)}%
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${getMargemColor()}`}
                style={{ width: `${Math.max(5, Math.min(100, Math.abs(margemPercentual)))}%` }}
              />
            </div>

            <div className="space-y-1.5 text-xs text-[#64748B] pt-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <span>≥ 20%: Saudável / Apropriada para reserva técnica</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>10% a 20%: Atenção / Ponto de equilíbrio</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <span>&lt; 10%: Crítica / Déficit operacional iminente</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza: Receitas vs Despesas + Categorias */}
        <Card className="lg:col-span-2 border-[#E2E8F0] shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Distribuição Financeira por Categoria
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Proporção de despesas operacionais em {months[mesSelecionado]}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Visual breakdown ring/bars with animated legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              {/* Circular SVG Donut Chart */}
              <div className="flex flex-col items-center justify-center p-4">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background Circle */}
                    <path
                      className="text-slate-100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Receitas Stroke */}
                    <path
                      className="text-[#1FAF7A]"
                      strokeDasharray="60, 100"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Despesas Stroke */}
                    <path
                      className="text-rose-500"
                      strokeDasharray="35, 100"
                      strokeDashoffset="-60"
                      strokeWidth="3.8"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-medium text-[#64748B]">Balanço</span>
                    <span className="text-sm font-bold text-[#1E293B]">
                      {resultadoMes >= 0 ? '+' : '-'} {formatBRL(Math.abs(resultadoMes))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorias Legend */}
              <div className="space-y-2 text-xs">
                {Object.entries(categoryTotals).map(([cat, val], idx) => {
                  const colors = [
                    'bg-indigo-500',
                    'bg-blue-500',
                    'bg-amber-500',
                    'bg-purple-500',
                    'bg-slate-400',
                  ]
                  const pct = despesasMes > 0 ? Math.round((val / despesasMes) * 100) : 0
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between font-medium">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}
                          />
                          <span className="text-[#1E293B]">{cat}</span>
                        </div>
                        <span className="text-[#64748B] tabular-nums">
                          {formatBRL(val)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[idx % colors.length]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card className="border-[#E2E8F0] shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#1E293B]">
              Extrato de Transações do Mês
            </CardTitle>
            <CardDescription className="text-xs text-[#64748B]">
              Histórico detalhado de faturamentos e despesas no período
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-40 text-xs h-8">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Categorias</SelectItem>
                <SelectItem value="Pessoal">Pessoal</SelectItem>
                <SelectItem value="Operacional">Operacional</SelectItem>
                <SelectItem value="Infraestrutura">Infraestrutura</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {transacoes.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#64748B]">
              Nenhuma transação registrada para o mês de {months[mesSelecionado]} de{' '}
              {anoSelecionado}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {transacoes.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold">
                        {t.tipo === 'receita' ? (
                          <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            + Receita
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            - Despesa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{t.categoria}</td>
                      <td className="py-3 px-4 font-medium text-[#1E293B] max-w-sm truncate">
                        {t.descricao}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{formatDateBR(t.data)}</td>
                      <td
                        className={`py-3 px-4 text-right font-bold tabular-nums ${
                          t.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {t.tipo === 'receita' ? '+' : '-'} {formatBRL(t.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Despesa */}
      <ModalNovaDespesa
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
