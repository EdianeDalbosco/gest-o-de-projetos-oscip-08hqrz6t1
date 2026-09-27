import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileCheck2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalConvenio } from '@/components/ModalConvenio'
import { ModalSecretaria } from '@/components/ModalSecretaria'
import { ModalPlanoTrabalho } from '@/components/ModalPlanoTrabalho'
import { ModalMeta } from '@/components/ModalMeta'
import {
  getConvenioById,
  getSecretariasByConvenio,
  getPlanosTrabalhoByConvenio,
  getMetas,
  getAtividades,
  deleteSecretaria,
  deletePlanoTrabalho,
  deleteMeta,
  updateMeta,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type {
  ConvenioRecord,
  SecretariaRecord,
  PlanoTrabalhoRecord,
  MetaRecord,
  AtividadeRecord,
} from '@/types'

export default function ConvenioDetail() {
  const { id } = useParams<{ id: string }>()

  const [convenio, setConvenio] = useState<ConvenioRecord | null>(null)
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [planos, setPlanos] = useState<PlanoTrabalhoRecord[]>([])
  const [metas, setMetas] = useState<MetaRecord[]>([])
  const [atividades, setAtividades] = useState<AtividadeRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Controle de colapso de secretarias (inicia com todas abertas)
  const [expandedSecretarias, setExpandedSecretarias] = useState<Record<string, boolean>>({})

  // Modais de Criação e Edição
  const [editConvenioOpen, setEditConvenioOpen] = useState(false)
  const [secretariaModalOpen, setSecretariaModalOpen] = useState(false)
  const [editingSecretaria, setEditingSecretaria] = useState<SecretariaRecord | null>(null)

  const [planoModalOpen, setPlanoModalOpen] = useState(false)
  const [selectedSecForPlano, setSelectedSecForPlano] = useState<string>('')
  const [editingPlano, setEditingPlano] = useState<PlanoTrabalhoRecord | null>(null)

  const [metaModalOpen, setMetaModalOpen] = useState(false)
  const [selectedPlanoForMeta, setSelectedPlanoForMeta] = useState<{ id: string; titulo: string }>({
    id: '',
    titulo: '',
  })
  const [editingMeta, setEditingMeta] = useState<MetaRecord | null>(null)

  const fetchData = async () => {
    if (!id) return
    try {
      const [conv, secList, planList, metaList, ativList] = await Promise.all([
        getConvenioById(id),
        getSecretariasByConvenio(id),
        getPlanosTrabalhoByConvenio(id),
        getMetas(),
        getAtividades(),
      ])

      setConvenio(conv)
      setSecretarias(secList)
      setPlanos(planList)
      setMetas(metaList)
      setAtividades(ativList)

      // Inicializar colapsos para novas secretarias
      setExpandedSecretarias((prev) => {
        const next = { ...prev }
        secList.forEach((s) => {
          if (next[s.id] === undefined) next[s.id] = true
        })
        return next
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useRealtime('convenios', () => fetchData())
  useRealtime('secretarias', () => fetchData())
  useRealtime('planos_trabalho', () => fetchData())
  useRealtime('metas', () => fetchData())
  useRealtime('atividades', () => fetchData())

  const toggleExpand = (secId: string) => {
    setExpandedSecretarias((prev) => ({
      ...prev,
      [secId]: !prev[secId],
    }))
  }

  const handleDeleteSecretaria = async (secId: string, nomeSec: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir a secretaria "${nomeSec}"? Os planos de trabalho e metas correspondentes também serão removidos.`,
      )
    ) {
      try {
        await deleteSecretaria(secId)
        fetchData()
      } catch (err) {
        alert('Erro ao excluir secretaria.')
      }
    }
  }

  const handleDeletePlano = async (planoId: string, tituloPlano: string) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir o plano de trabalho "${tituloPlano}" e suas metas?`,
      )
    ) {
      try {
        await deletePlanoTrabalho(planoId)
        fetchData()
      } catch (err) {
        alert('Erro ao excluir plano de trabalho.')
      }
    }
  }

  const handleDeleteMeta = async (metaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await deleteMeta(metaId)
        fetchData()
      } catch (err) {
        alert('Erro ao excluir meta.')
      }
    }
  }

  const handleToggleMetaConcluida = async (m: MetaRecord) => {
    try {
      const nextStatus = m.status === 'concluida' ? 'em_andamento' : 'concluida'
      const nextRealizada =
        nextStatus === 'concluida' && m.quantidade_alvo
          ? m.quantidade_alvo
          : (m.quantidade_realizada ?? 0)
      await updateMeta(m.id, {
        status: nextStatus,
        quantidade_realizada: nextRealizada,
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  // Agregações financeiras e metas consolidadas do convênio
  const consolidated = useMemo(() => {
    const totalPrevisto = planos.reduce((s, p) => s + (Number(p.valor_previsto) || 0), 0)
    const totalEmpenhado = planos.reduce((s, p) => s + (Number(p.valor_empenhado) || 0), 0)
    const totalExecutado = planos.reduce((s, p) => s + (Number(p.valor_executado) || 0), 0)
    const percFinanceiro =
      totalPrevisto > 0 ? Math.min(100, Math.round((totalExecutado / totalPrevisto) * 100)) : 0

    // Metas de todos os planos deste convênio
    const planoIds = new Set(planos.map((p) => p.id))
    const convMetas = metas.filter((m) => planoIds.has(m.plano_trabalho_id))
    const metasConcluidas = convMetas.filter((m) => m.status === 'concluida').length

    return {
      totalPrevisto,
      totalEmpenhado,
      totalExecutado,
      percFinanceiro,
      totalMetas: convMetas.length,
      metasConcluidas,
    }
  }, [planos, metas])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-xs text-[#64748B]">Carregando estrutura do convênio...</p>
      </div>
    )
  }

  if (!convenio) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-lg font-bold text-[#1E293B]">Convênio não localizado</h2>
        <Button asChild variant="outline">
          <Link to="/convenios">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Convênios
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link to="/convenios" className="hover:text-[#1FAF7A] inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Convênios Municipais
        </Link>
        <span>/</span>
        <span className="text-[#1E293B] font-medium truncate max-w-sm">{convenio.nome}</span>
      </div>

      {/* Header Principal do Convênio */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">{convenio.nome}</h1>
            <StatusBadge status={convenio.status} />
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200">
              {convenio.numero_instrumento}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#64748B] flex-wrap">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#1FAF7A]" />
              <span className="font-semibold text-[#1E293B]">{convenio.municipio}</span>
              {convenio.orgao_contratante && <span>• {convenio.orgao_contratante}</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#94A3B8]" />
              <span>
                Vigência: {formatDateBR(convenio.data_inicio)} a {formatDateBR(convenio.data_fim)}
              </span>
            </div>
          </div>

          {convenio.observacoes && (
            <p className="text-xs text-[#475569] pt-1 max-w-3xl leading-relaxed">
              {convenio.observacoes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditConvenioOpen(true)}
            className="text-xs font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Editar Convênio
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingSecretaria(null)
              setSecretariaModalOpen(true)
            }}
            className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm shadow-[#1FAF7A]/25"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova Secretaria
          </Button>
        </div>
      </div>

      {/* Cards Consolidados: Valor Global, Previsto, Executado e Barra Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Valor Global do Convênio
            </span>
            <p className="text-2xl font-bold text-[#1E293B] mt-2 tabular-nums">
              {formatBRL(convenio.valor_global)}
            </p>
            <span className="text-[11px] text-[#94A3B8] mt-1 block">
              Teto pactuado no instrumento
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Previsto nos Planos
            </span>
            <p className="text-2xl font-bold text-sky-700 mt-2 tabular-nums">
              {formatBRL(consolidated.totalPrevisto)}
            </p>
            <span className="text-[11px] text-[#94A3B8] mt-1 block">
              Distribuído em {planos.length} planos
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Executado pelos Planos
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-2 tabular-nums">
              {formatBRL(consolidated.totalExecutado)}
            </p>
            <span className="text-[11px] text-[#94A3B8] mt-1 block">
              Empenhado: {formatBRL(consolidated.totalEmpenhado)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-[#64748B] uppercase">
                Progresso Geral
              </span>
              <span className="text-xs font-bold text-[#1FAF7A]">
                {consolidated.percFinanceiro}%
              </span>
            </div>
            <Progress value={consolidated.percFinanceiro} className="h-2.5 mt-2" />
            <div className="flex justify-between text-[11px] text-[#94A3B8] mt-2">
              <span>
                Metas: {consolidated.metasConcluidas} de {consolidated.totalMetas}
              </span>
              <span>{secretarias.length} pastas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Secretarias Vinculadas */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1FAF7A]" />
              Secretarias Municipais Vinculadas ({secretarias.length})
            </h2>
            <p className="text-xs text-[#64748B]">
              Cada secretaria gerencia seus planos de trabalho, valores orçados e metas de entrega.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setEditingSecretaria(null)
              setSecretariaModalOpen(true)
            }}
            variant="outline"
            className="text-xs font-semibold border-slate-300 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-[#1FAF7A]" />
            Adicionar Secretaria
          </Button>
        </div>

        {secretarias.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-[#CBD5E1] p-6">
            <Layers className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#1E293B]">Nenhuma secretaria cadastrada</h4>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
              Adicione a primeira secretaria municipal participante deste convênio para vincular
              planos de trabalho.
            </p>
            <Button
              onClick={() => {
                setEditingSecretaria(null)
                setSecretariaModalOpen(true)
              }}
              className="mt-3 bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Secretaria
            </Button>
          </div>
        ) : (
          secretarias.map((sec) => {
            const isExpanded = expandedSecretarias[sec.id] ?? true
            // Planos desta secretaria
            const secPlanos = planos.filter((p) => p.secretaria_id === sec.id)
            const secPlanoIds = new Set(secPlanos.map((p) => p.id))
            const secMetas = metas.filter((m) => secPlanoIds.has(m.plano_trabalho_id))

            const secPrevisto = secPlanos.reduce((s, p) => s + (Number(p.valor_previsto) || 0), 0)
            const secEmpenhado = secPlanos.reduce((s, p) => s + (Number(p.valor_empenhado) || 0), 0)
            const secExecutado = secPlanos.reduce((s, p) => s + (Number(p.valor_executado) || 0), 0)
            const secMetasConcluidas = secMetas.filter((m) => m.status === 'concluida').length
            const secPerc =
              secPrevisto > 0 ? Math.min(100, Math.round((secExecutado / secPrevisto) * 100)) : 0

            // Atividades vinculadas aos planos desta secretaria
            const secAtividades = atividades.filter(
              (a) => a.plano_trabalho_id && secPlanoIds.has(a.plano_trabalho_id),
            )

            return (
              <div
                key={sec.id}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden transition-all duration-150"
              >
                {/* Header da Secretaria (Expansível) */}
                <div
                  onClick={() => toggleExpand(sec.id)}
                  className="p-5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#1FAF7A] shrink-0 mt-0.5">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#1E293B]">{sec.nome}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] font-semibold border border-slate-200">
                          {secPlanos.length} {secPlanos.length === 1 ? 'plano' : 'planos'}
                        </span>
                      </div>
                      {sec.responsavel && (
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Responsável: <strong className="text-[#334155]">{sec.responsavel}</strong>
                        </p>
                      )}
                      {sec.observacoes && (
                        <p className="text-xs text-[#64748B] line-clamp-1 mt-1">
                          {sec.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Métricas Consolidadas da Secretaria */}
                  <div className="flex items-center gap-4 sm:gap-6 shrink-0 flex-wrap lg:flex-nowrap">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                        Previsto
                      </span>
                      <span className="text-xs font-bold text-[#1E293B] tabular-nums">
                        {formatBRL(secPrevisto)}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                        Empenhado
                      </span>
                      <span className="text-xs font-bold text-sky-700 tabular-nums">
                        {formatBRL(secEmpenhado)}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                        Executado
                      </span>
                      <span className="text-xs font-bold text-emerald-700 tabular-nums">
                        {formatBRL(secExecutado)} ({secPerc}%)
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                        Metas
                      </span>
                      <span className="text-xs font-bold text-[#1E293B]">
                        {secMetasConcluidas}/{secMetas.length} concluídas
                      </span>
                    </div>

                    {secAtividades.length > 0 && (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-[#94A3B8] block">
                          Atividades
                        </span>
                        <span className="text-xs font-bold text-[#1FAF7A]">
                          {secAtividades.length} prestador(es)
                        </span>
                      </div>
                    )}

                    {/* Botões de Ação na Secretaria */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSecretaria(sec)
                          setSecretariaModalOpen(true)
                        }}
                        className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                        title="Editar Secretaria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSecretaria(sec.id, sec.nome)}
                        className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600"
                        title="Excluir Secretaria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <div className="p-1 text-[#94A3B8]">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expansível: Planos de Trabalho da Secretaria */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4 text-[#1FAF7A]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                          Planos de Trabalho ({secPlanos.length})
                        </h4>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedSecForPlano(sec.id)
                          setEditingPlano(null)
                          setPlanoModalOpen(true)
                        }}
                        className="h-7 text-xs bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Novo Plano
                      </Button>
                    </div>

                    {secPlanos.length === 0 ? (
                      <div className="text-center py-6 bg-white rounded-lg border border-dashed border-[#CBD5E1] p-4 text-xs text-[#64748B]">
                        Nenhum plano de trabalho cadastrado para esta secretaria.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {secPlanos.map((plano) => {
                          // Metas deste plano
                          const planoMetas = metas.filter((m) => m.plano_trabalho_id === plano.id)
                          const planoMetasConcluidas = planoMetas.filter(
                            (m) => m.status === 'concluida',
                          ).length
                          const percPlanoFinanceiro =
                            plano.valor_previsto > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    ((plano.valor_executado || 0) / plano.valor_previsto) * 100,
                                  ),
                                )
                              : 0

                          return (
                            <div
                              key={plano.id}
                              className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm space-y-4"
                            >
                              {/* Top do Plano */}
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-bold text-sm text-[#1E293B]">
                                      {plano.titulo}
                                    </h5>
                                    <StatusBadge status={plano.status} />
                                    {plano.periodo && (
                                      <span className="text-[11px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded font-medium">
                                        {plano.periodo}
                                      </span>
                                    )}
                                  </div>
                                  {plano.descricao && (
                                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                                      {plano.descricao}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPlanoForMeta({
                                        id: plano.id,
                                        titulo: plano.titulo,
                                      })
                                      setEditingMeta(null)
                                      setMetaModalOpen(true)
                                    }}
                                    className="h-7 text-xs border-emerald-200 text-[#1FAF7A] hover:bg-emerald-50"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Nova Meta
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSecForPlano(sec.id)
                                      setEditingPlano(plano)
                                      setPlanoModalOpen(true)
                                    }}
                                    className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                    title="Editar Plano"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeletePlano(plano.id, plano.titulo)}
                                    className="h-7 w-7 p-0 text-[#64748B] hover:text-red-600"
                                    title="Excluir Plano"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Valores do Plano + Barra de Progresso Financeiro */}
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                                <div>
                                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                                    Valor Previsto
                                  </span>
                                  <span className="font-bold text-[#1E293B] tabular-nums">
                                    {formatBRL(plano.valor_previsto)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                                    Valor Empenhado
                                  </span>
                                  <span className="font-bold text-sky-700 tabular-nums">
                                    {formatBRL(plano.valor_empenhado || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">
                                    Valor Executado
                                  </span>
                                  <span className="font-bold text-emerald-700 tabular-nums">
                                    {formatBRL(plano.valor_executado || 0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex justify-between items-center text-[11px] mb-1">
                                    <span className="text-[#64748B] font-medium">Execução</span>
                                    <span className="font-bold text-[#1FAF7A]">
                                      {percPlanoFinanceiro}%
                                    </span>
                                  </div>
                                  <Progress value={percPlanoFinanceiro} className="h-1.5" />
                                </div>
                              </div>

                              {/* Metas Simples deste Plano de Trabalho */}
                              <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-[#334155] flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-[#1FAF7A]" />
                                    Metas de Execução ({planoMetasConcluidas}/{planoMetas.length})
                                  </span>
                                </div>

                                {planoMetas.length === 0 ? (
                                  <div className="text-xs text-[#94A3B8] py-2 italic">
                                    Nenhuma meta cadastrada neste plano de trabalho.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {planoMetas.map((meta) => {
                                      const isConcluida = meta.status === 'concluida'
                                      const qtdAlvo = meta.quantidade_alvo ?? 0
                                      const qtdRealizada = meta.quantidade_realizada ?? 0
                                      const percMeta =
                                        qtdAlvo > 0
                                          ? Math.min(
                                              100,
                                              Math.round((qtdRealizada / qtdAlvo) * 100),
                                            )
                                          : isConcluida
                                            ? 100
                                            : 0

                                      return (
                                        <div
                                          key={meta.id}
                                          className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-colors ${
                                            isConcluida
                                              ? 'bg-emerald-50/40 border-emerald-200'
                                              : 'bg-white border-slate-200'
                                          }`}
                                        >
                                          <div>
                                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                              <StatusBadge status={meta.status} />
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleToggleMetaConcluida(meta)}
                                                  className={`p-1 rounded hover:bg-slate-100 ${
                                                    isConcluida
                                                      ? 'text-emerald-600'
                                                      : 'text-[#94A3B8]'
                                                  }`}
                                                  title={
                                                    isConcluida
                                                      ? 'Marcar em andamento'
                                                      : 'Marcar concluída'
                                                  }
                                                >
                                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setSelectedPlanoForMeta({
                                                      id: plano.id,
                                                      titulo: plano.titulo,
                                                    })
                                                    setEditingMeta(meta)
                                                    setMetaModalOpen(true)
                                                  }}
                                                  className="p-1 text-[#64748B] hover:text-[#1FAF7A] hover:bg-slate-100 rounded"
                                                  title="Editar Meta"
                                                >
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteMeta(meta.id)}
                                                  className="p-1 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded"
                                                  title="Excluir Meta"
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </div>
                                            </div>

                                            <p className="font-semibold text-[#1E293B] leading-snug">
                                              {meta.descricao}
                                            </p>
                                          </div>

                                          <div className="mt-3 pt-2 border-t border-slate-100">
                                            {qtdAlvo > 0 ? (
                                              <div>
                                                <div className="flex justify-between text-[11px] mb-1">
                                                  <span className="text-[#64748B]">
                                                    Alvo: <strong>{qtdAlvo}</strong>
                                                  </span>
                                                  <span className="font-bold text-[#1FAF7A]">
                                                    {qtdRealizada} ({percMeta}%)
                                                  </span>
                                                </div>
                                                <Progress value={percMeta} className="h-1.5" />
                                              </div>
                                            ) : (
                                              <span className="text-[11px] text-[#94A3B8]">
                                                {isConcluida ? 'Meta concluída' : 'Em andamento'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modais do Convênio */}
      <ModalConvenio
        open={editConvenioOpen}
        onClose={() => setEditConvenioOpen(false)}
        onSuccess={fetchData}
        convenioToEdit={convenio}
      />

      <ModalSecretaria
        open={secretariaModalOpen}
        onClose={() => setSecretariaModalOpen(false)}
        onSuccess={fetchData}
        convenioId={convenio.id}
        secretariaToEdit={editingSecretaria}
      />

      <ModalPlanoTrabalho
        open={planoModalOpen}
        onClose={() => setPlanoModalOpen(false)}
        onSuccess={fetchData}
        convenioId={convenio.id}
        secretarias={secretarias}
        defaultSecretariaId={selectedSecForPlano}
        planoToEdit={editingPlano}
      />

      <ModalMeta
        open={metaModalOpen}
        onClose={() => setMetaModalOpen(false)}
        onSuccess={fetchData}
        planoTrabalhoId={selectedPlanoForMeta.id}
        planoTitulo={selectedPlanoForMeta.titulo}
        metaToEdit={editingMeta}
      />
    </div>
  )
}
