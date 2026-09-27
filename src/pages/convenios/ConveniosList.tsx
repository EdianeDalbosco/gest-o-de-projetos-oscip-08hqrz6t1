import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  TrendingUp,
  FileSignature,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalConvenio } from '@/components/ModalConvenio'
import { getConvenios, deleteConvenio, getSecretarias, getPlanosTrabalho } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type { ConvenioRecord, SecretariaRecord, PlanoTrabalhoRecord } from '@/types'

export default function ConveniosList() {
  const [convenios, setConvenios] = useState<ConvenioRecord[]>([])
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [planos, setPlanos] = useState<PlanoTrabalhoRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingConvenio, setEditingConvenio] = useState<ConvenioRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [convList, secList, planList] = await Promise.all([
        getConvenios(),
        getSecretarias(),
        getPlanosTrabalho(),
      ])
      setConvenios(convList)
      setSecretarias(secList)
      setPlanos(planList)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const handleOpenModal = () => {
      setEditingConvenio(null)
      setModalOpen(true)
    }
    window.addEventListener('open-modal-novo-convenio', handleOpenModal)
    return () => {
      window.removeEventListener('open-modal-novo-convenio', handleOpenModal)
    }
  }, [])

  useRealtime('convenios', () => fetchData())
  useRealtime('secretarias', () => fetchData())
  useRealtime('planos_trabalho', () => fetchData())

  const filteredConvenios = useMemo(() => {
    return convenios.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch =
        c.nome.toLowerCase().includes(q) ||
        c.municipio.toLowerCase().includes(q) ||
        c.numero_instrumento.toLowerCase().includes(q) ||
        (c.orgao_contratante && c.orgao_contratante.toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'todos' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [convenios, search, statusFilter])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (
      window.confirm(
        'Tem certeza que deseja excluir este instrumento? Todas as secretarias, planos e metas vinculados serão removidos.',
      )
    ) {
      try {
        await deleteConvenio(id)
        fetchData()
      } catch (err) {
        alert('Não foi possível excluir o instrumento. Verifique dependências ativas.')
      }
    }
  }

  // Agregações financeiras globais dos convênios
  const statsGerais = useMemo(() => {
    const totalGlobal = convenios.reduce((s, c) => s + (Number(c.valor_global) || 0), 0)
    const totalPrevistoPlanos = planos.reduce((s, p) => s + (Number(p.valor_previsto) || 0), 0)
    const totalExecutadoPlanos = planos.reduce((s, p) => s + (Number(p.valor_executado) || 0), 0)
    const percentualGeral =
      totalPrevistoPlanos > 0
        ? Math.min(100, Math.round((totalExecutadoPlanos / totalPrevistoPlanos) * 100))
        : 0
    return {
      totalGlobal,
      totalPrevistoPlanos,
      totalExecutadoPlanos,
      percentualGeral,
    }
  }, [convenios, planos])

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Instrumentos Municipais</h2>
          <p className="text-xs text-[#64748B]">
            Gestão integrada de parcerias com prefeituras, articuladas por secretaria, plano de
            trabalho e metas.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingConvenio(null)
            setModalOpen(true)
          }}
          className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1FAF7A]/25 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Instrumento
        </Button>
      </div>

      {/* Cards de Resumo Geral Superior */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Instrumentos Ativos
            </span>
            <Landmark className="w-4 h-4 text-[#1FAF7A]" />
          </div>
          <p className="text-2xl font-bold text-[#1E293B] mt-2 tabular-nums">
            {convenios.filter((c) => c.status === 'ativo').length}
          </p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">
            {convenios.length} cadastrados no total
          </span>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Aporte Global Firmado
            </span>
            <TrendingUp className="w-4 h-4 text-[#1FAF7A]" />
          </div>
          <p className="text-xl font-bold text-[#1E293B] mt-2 tabular-nums">
            {formatBRL(statsGerais.totalGlobal)}
          </p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">
            Valor contratado com municípios
          </span>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Secretarias Atendidas
            </span>
            <Layers className="w-4 h-4 text-[#1FAF7A]" />
          </div>
          <p className="text-2xl font-bold text-[#1E293B] mt-2 tabular-nums">
            {secretarias.length}
          </p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">
            {planos.length} planos de trabalho ativos
          </span>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Execução Financeira
            </span>
            <span className="text-xs font-bold text-[#1FAF7A]">{statsGerais.percentualGeral}%</span>
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-2 tabular-nums">
            {formatBRL(statsGerais.totalExecutadoPlanos)}
          </p>
          <Progress value={statsGerais.percentualGeral} className="h-1.5 mt-2" />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por instrumento, município ou número..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#64748B] shrink-0" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs h-9">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="encerrado">Encerrados</SelectItem>
              <SelectItem value="suspenso">Suspensos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Instrumentos Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <p className="text-xs text-[#64748B]">Carregando instrumentos municipais...</p>
        </div>
      ) : filteredConvenios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-8">
          <Landmark className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1E293B]">Nenhum instrumento encontrado</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Não foram localizados instrumentos com os filtros selecionados. Crie um novo instrumento
            municipal para começar.
          </p>
          <Button
            onClick={() => {
              setEditingConvenio(null)
              setModalOpen(true)
            }}
            className="mt-4 bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Novo Instrumento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConvenios.map((conv) => {
            // Secretarias deste convênio
            const convSecs = secretarias.filter((s) => s.convenio_id === conv.id)
            const secIds = new Set(convSecs.map((s) => s.id))
            // Planos deste convênio (ou via convenio_id ou via secretaria)
            const convPlanos = planos.filter(
              (p) => p.convenio_id === conv.id || secIds.has(p.secretaria_id),
            )

            const totalPrevisto = convPlanos.reduce(
              (s, p) => s + (Number(p.valor_previsto) || 0),
              0,
            )
            const totalExecutado = convPlanos.reduce(
              (s, p) => s + (Number(p.valor_executado) || 0),
              0,
            )
            const percExecucao =
              totalPrevisto > 0
                ? Math.min(100, Math.round((totalExecutado / totalPrevisto) * 100))
                : 0

            return (
              <div
                key={conv.id}
                className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge status={conv.status} />
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200 font-semibold">
                        {conv.numero_instrumento}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingConvenio(conv)
                          setModalOpen(true)
                        }}
                        className="p-1.5 text-[#64748B] hover:text-[#1FAF7A] hover:bg-slate-100 rounded-md"
                        title="Editar Instrumento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Excluir Instrumento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Municipality */}
                  <h3 className="font-bold text-base text-[#1E293B] group-hover:text-[#1FAF7A] transition-colors leading-snug">
                    <Link to={`/convenios/${conv.id}`}>{conv.nome}</Link>
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#1FAF7A] shrink-0" />
                    <span className="font-medium text-[#1E293B]">{conv.municipio}</span>
                    {conv.orgao_contratante && (
                      <>
                        <span className="text-[#CBD5E1]">•</span>
                        <span className="truncate text-[#64748B]">{conv.orgao_contratante}</span>
                      </>
                    )}
                  </div>

                  {conv.observacoes && (
                    <p className="text-xs text-[#64748B] mt-2.5 line-clamp-2 leading-relaxed">
                      {conv.observacoes}
                    </p>
                  )}

                  {/* Mini pills com resumo: secretarias e planos */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-[#475569] bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                      <Layers className="w-3.5 h-3.5 text-[#1FAF7A]" />
                      <span className="font-semibold text-[#1E293B]">{convSecs.length}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {convSecs.length === 1 ? 'secretaria' : 'secretarias'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[#475569] bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                      <FileSignature className="w-3.5 h-3.5 text-[#1FAF7A]" />
                      <span className="font-semibold text-[#1E293B]">{convPlanos.length}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {convPlanos.length === 1 ? 'plano' : 'planos'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  {/* Barra de Execução Financeira dos Planos */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#64748B] font-medium">Execução dos Planos</span>
                      <span className="font-bold text-[#1E293B] tabular-nums">{percExecucao}%</span>
                    </div>
                    <Progress value={percExecucao} className="h-2" />
                    <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1 tabular-nums">
                      <span>Executado: {formatBRL(totalExecutado)}</span>
                      <span>Previsto: {formatBRL(totalPrevisto)}</span>
                    </div>
                  </div>

                  {/* Período & Valor Global do Instrumento */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-[#64748B]">
                      <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>
                        {formatDateBR(conv.data_inicio)} — {formatDateBR(conv.data_fim)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-[#94A3B8] block font-semibold leading-none">
                        Valor Global
                      </span>
                      <span className="font-bold text-sm text-[#1E293B] tabular-nums">
                        {formatBRL(conv.valor_global)}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes CTA */}
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-semibold text-[#1FAF7A] border-[#1FAF7A]/25 hover:bg-[#1FAF7A]/10 mt-1"
                  >
                    <Link to={`/convenios/${conv.id}`}>
                      Acessar Estrutura do Instrumento
                      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Creation/Edit Modal */}
      <ModalConvenio
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        convenioToEdit={editingConvenio}
      />
    </div>
  )
}
