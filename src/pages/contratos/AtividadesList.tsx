import React, { useState, useEffect, useMemo } from 'react'
import {
  CalendarCheck2,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Clock,
  User,
  Building,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalNovaAtividade } from '@/components/ModalNovaAtividade'
import { getAtividades, updateAtividade, getProjetos, getContratos } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type { AtividadeRecord, ProjetoRecord, ContratoRecord } from '@/types'

export default function AtividadesList() {
  const [atividades, setAtividades] = useState<AtividadeRecord[]>([])
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [prestadores, setPrestadores] = useState<ContratoRecord[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [prestadorFilter, setPrestadorFilter] = useState<string>('todos')
  const [projetoFilter, setProjetoFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [ativList, projList, contList] = await Promise.all([
        getAtividades(),
        getProjetos(),
        getContratos(),
      ])
      setAtividades(ativList)
      setProjetos(projList)
      setPrestadores(contList.filter((c) => c.tipo === 'PJ'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime('atividades', () => fetchData())

  const filteredAtividades = useMemo(() => {
    return atividades.filter((a) => {
      const matchSearch =
        a.descricao.toLowerCase().includes(search.toLowerCase()) ||
        (a.expand?.prestador_id?.nome &&
          a.expand.prestador_id.nome.toLowerCase().includes(search.toLowerCase())) ||
        (a.expand?.projeto_id?.nome &&
          a.expand.projeto_id.nome.toLowerCase().includes(search.toLowerCase()))

      const matchStatus = statusFilter === 'todos' || a.status === statusFilter
      const matchPrestador = prestadorFilter === 'todos' || a.prestador_id === prestadorFilter
      const matchProjeto = projetoFilter === 'todos' || a.projeto_id === projetoFilter

      return matchSearch && matchStatus && matchPrestador && matchProjeto
    })
  }, [atividades, search, statusFilter, prestadorFilter, projetoFilter])

  const handleApprove = async (id: string) => {
    try {
      const ativ = atividades.find((a) => a.id === id)
      let valorAprovado = 0
      if (ativ?.expand?.prestador_id) {
        const prestador = ativ.expand.prestador_id
        if (prestador.tipo_pj === 'horas') {
          valorAprovado = Number(ativ.horas) * (prestador.valor || 0)
        } else {
          valorAprovado = prestador.valor || 0
        }
      }
      await updateAtividade(id, {
        status: 'aprovada',
        valor_aprovado: valorAprovado,
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (id: string) => {
    try {
      await updateAtividade(id, { status: 'rejeitada' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const totalHoras = filteredAtividades.reduce((s, a) => s + (Number(a.horas) || 0), 0)
  const pendentesCount = atividades.filter((a) => a.status === 'pendente').length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Controle de Atividades de Prestadores PJ
          </h2>
          <p className="text-xs text-[#64748B]">
            Aprovação rápida de horas trabalhadas, validação técnica de entregas e cálculo de
            honorários.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1FAF7A]/25 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Atividade
        </Button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Horas Filtradas</span>
            <p className="text-xl font-bold text-[#1E293B] mt-1 tabular-nums">{totalHoras}h</p>
            <span className="text-[11px] text-[#94A3B8]">Dedicadas às metas sociais</span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Pendentes de Validação
            </span>
            <p className="text-xl font-bold text-amber-700 mt-1 tabular-nums">{pendentesCount}</p>
            <span className="text-[11px] text-amber-600 font-medium">
              Requerem ação do coordenador
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Total de Prestadores PJ
            </span>
            <p className="text-xl font-bold text-blue-700 mt-1 tabular-nums">
              {prestadores.length}
            </p>
            <span className="text-[11px] text-[#94A3B8]">Fornecedores e especialistas</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por descrição..."
            className="pl-8 text-xs h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="aprovada">Aprovada</SelectItem>
            <SelectItem value="rejeitada">Rejeitada</SelectItem>
          </SelectContent>
        </Select>

        <Select value={prestadorFilter} onValueChange={setPrestadorFilter}>
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="Prestador PJ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Prestadores</SelectItem>
            {prestadores.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={projetoFilter} onValueChange={setProjetoFilter}>
          <SelectTrigger className="text-xs h-9">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Projetos</SelectItem>
            {projetos.map((pr) => (
              <SelectItem key={pr.id} value={pr.id}>
                {pr.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Atividades */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredAtividades.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#64748B]">
              Nenhuma atividade encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Prestador PJ</th>
                    <th className="py-3 px-4">Projeto Vinculado</th>
                    <th className="py-3 px-4">Descrição das Atividades</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Horas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aprovação Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredAtividades.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#1E293B]">
                        {a.expand?.prestador_id?.nome || 'Prestador PJ'}
                      </td>
                      <td className="py-3 px-4 text-[#475569] font-medium">
                        {a.expand?.projeto_id?.nome || '—'}
                      </td>
                      <td
                        className="py-3 px-4 text-[#475569] max-w-sm truncate"
                        title={a.descricao}
                      >
                        {a.descricao}
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{formatDateBR(a.data)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#1E293B] tabular-nums">
                        {a.horas}h
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === 'pendente' ? (
                            <>
                              <button
                                onClick={() => handleApprove(a.id)}
                                className="w-7 h-7 rounded-md bg-emerald-50 hover:bg-emerald-100 text-[#10B981] flex items-center justify-center transition-colors border border-emerald-200"
                                title="Aprovar Atividade (✓)"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(a.id)}
                                className="w-7 h-7 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors border border-rose-200"
                                title="Rejeitar Atividade (✗)"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[#94A3B8]">
                              {a.status === 'aprovada' ? '✓ Validada' : '✗ Rejeitada'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Nova Atividade */}
      <ModalNovaAtividade
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  )
}
