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
  FileText,
  FolderKanban,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { useNavigate } from 'react-router-dom'
import { ModalConvenio } from '@/components/ModalConvenio'
import { ModalSecretaria } from '@/components/ModalSecretaria'
import {
  getConvenioById,
  getSecretariasByConvenio,
  getPlanosTrabalhoByConvenio,
  getProjetos,
  getMetas,
  getAtividades,
  getEmpenhosByConvenio,
  getFaturas,
  deleteSecretaria,
  deleteEmpenho,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { ModalEmpenho } from '@/components/ModalEmpenho'
import { ModalRelatorioPrestacaoContas } from '@/components/ModalRelatorioPrestacaoContas'
import type {
  ConvenioRecord,
  SecretariaRecord,
  PlanoTrabalhoRecord,
  ProjetoRecord,
  MetaRecord,
  AtividadeRecord,
  EmpenhoRecord,
  FaturaRecord,
} from '@/types'

export default function ConvenioDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [convenio, setConvenio] = useState<ConvenioRecord | null>(null)
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [planos, setPlanos] = useState<PlanoTrabalhoRecord[]>([])
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [metas, setMetas] = useState<MetaRecord[]>([])
  const [atividades, setAtividades] = useState<AtividadeRecord[]>([])
  const [empenhos, setEmpenhos] = useState<EmpenhoRecord[]>([])
  const [faturas, setFaturas] = useState<FaturaRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Controle de colapso de secretarias (inicia com todas abertas)
  const [expandedSecretarias, setExpandedSecretarias] = useState<Record<string, boolean>>({})

  // Modais de Criação e Edição
  const [editConvenioOpen, setEditConvenioOpen] = useState(false)
  const [secretariaModalOpen, setSecretariaModalOpen] = useState(false)
  const [editingSecretaria, setEditingSecretaria] = useState<SecretariaRecord | null>(null)

  // Modais de Empenhos e Relatório de Prestação de Contas
  const [empenhoModalOpen, setEmpenhoModalOpen] = useState(false)
  const [selectedSecForEmpenho, setSelectedSecForEmpenho] = useState<{ id: string; nome: string }>({
    id: '',
    nome: '',
  })
  const [editingEmpenho, setEditingEmpenho] = useState<EmpenhoRecord | null>(null)

  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false)
  const [selectedSecForRelatorio, setSelectedSecForRelatorio] = useState<SecretariaRecord | null>(
    null,
  )

  const fetchData = async () => {
    if (!id) return
    try {
      const [conv, secList, planList, projList, metaList, ativList, empList, fatList] =
        await Promise.all([
          getConvenioById(id),
          getSecretariasByConvenio(id),
          getPlanosTrabalhoByConvenio(id),
          getProjetos(),
          getMetas(),
          getAtividades(),
          getEmpenhosByConvenio(id),
          getFaturas(),
        ])

      setConvenio(conv)
      setSecretarias(secList)
      setPlanos(planList)
      setProjetos(projList)
      setMetas(metaList)
      setAtividades(ativList)
      setEmpenhos(empList)
      setFaturas(fatList)

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
  useRealtime('projetos', () => fetchData())
  useRealtime('metas', () => fetchData())
  useRealtime('atividades', () => fetchData())
  useRealtime('empenhos', () => fetchData())
  useRealtime('faturas', () => fetchData())

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

  const handleDeleteEmpenho = async (empId: string, empNumero: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o empenho Nº ${empNumero}?`)) {
      try {
        await deleteEmpenho(empId)
        fetchData()
      } catch (err) {
        alert('Erro ao excluir empenho.')
      }
    }
  }

  const handleCriarProjetoParaSecretaria = (secretariaId: string) => {
    navigate('/projetos', {
      state: {
        openModal: true,
        secretariaId,
        convenioId: id,
      },
    })
  }

  // Agregações financeiras e metas consolidadas do convênio
  const consolidated = useMemo(() => {
    // Considera projetos vinculados a este convênio ou às suas secretarias
    const secIds = new Set(secretarias.map((s) => s.id))
    const convProjetos = projetos.filter(
      (p) => p.convenio_id === id || (p.secretaria_id && secIds.has(p.secretaria_id)),
    )

    // Se houver planos_trabalho legados no banco, combina ou usa o valor dos projetos
    const totalPrevistoPlanos = planos.reduce((s, p) => s + (Number(p.valor_previsto) || 0), 0)
    const totalProjetos = convProjetos.reduce((s, p) => s + (Number(p.valor_total) || 0), 0)
    // O total orçado nos projetos cadastrados vinculados ao instrumento
    const totalOrcado = totalProjetos > 0 ? totalProjetos : totalPrevistoPlanos
    const totalPrevisto = totalOrcado

    // O valor empenhado consolidado passa a ser calculado pela soma dos empenhos deste convênio
    const totalEmpenhado = empenhos.reduce((s, e) => s + (Number(e.valor) || 0), 0)
    const totalExecutadoPlanos = planos.reduce((s, p) => s + (Number(p.valor_executado) || 0), 0)
    const totalExecutado = totalEmpenhado > 0 ? totalEmpenhado : totalExecutadoPlanos

    const valorGlobal = Number(convenio?.valor_global) || 0

    // Percentual real de alocação orçamentária dos projetos em relação ao teto global do instrumento
    const percAlocacaoExato = valorGlobal > 0 ? (totalOrcado / valorGlobal) * 100 : 0

    // Se estiver exatamente em 100% (diferença absoluta menor que 0.01 centavo), exibe 100%.
    // Se houver qualquer divergência real (ex: R$ 6.136,83 de saldo), nunca arredonda falsamente para 100%.
    const diffGlobalOrcado = valorGlobal - totalOrcado
    const isTotalmenteAlocado = Math.abs(diffGlobalOrcado) < 0.01 && valorGlobal > 0

    let percAlocacaoFormatado: string
    let percAlocacaoNumero: number
    if (valorGlobal <= 0) {
      percAlocacaoFormatado = '0%'
      percAlocacaoNumero = 0
    } else if (isTotalmenteAlocado) {
      percAlocacaoFormatado = '100%'
      percAlocacaoNumero = 100
    } else {
      // Percentual real com 1 casa decimal, sem arredondar para cima (ex.: 99.9995% vira 99,9%)
      const floored = Math.floor(percAlocacaoExato * 10) / 10
      percAlocacaoFormatado = `${floored.toFixed(1).replace('.', ',')}%`
      percAlocacaoNumero = floored
    }

    // Progresso de execução financeira: quanto do orçado foi executado/empenhado
    const percExecucao =
      totalOrcado > 0 ? Math.min(100, Math.round((totalExecutado / totalOrcado) * 100)) : 0

    // Metas de todos os planos deste convênio
    const planoIds = new Set(planos.map((p) => p.id))
    const convMetas = metas.filter((m) => planoIds.has(m.plano_trabalho_id))
    const metasConcluidas = convMetas.filter((m) => m.status === 'concluida').length

    return {
      convProjetos,
      totalProjetos,
      totalOrcado,
      totalPrevisto,
      totalEmpenhado,
      totalExecutado,
      valorGlobal,
      diffGlobalOrcado,
      isTotalmenteAlocado,
      percAlocacaoExato,
      percAlocacaoFormatado,
      percAlocacaoNumero,
      percExecucao,
      totalMetas: convMetas.length,
      metasConcluidas,
    }
  }, [planos, projetos, secretarias, metas, empenhos, id, convenio?.valor_global])

  // Identificação de Metas Atrasadas e Faturas Vinculadas com Alerta
  const alertsData = useMemo(() => {
    const planoMap = new Map(planos.map((p) => [p.id, p]))
    const secMap = new Map(secretarias.map((s) => [s.id, s]))
    const secIds = new Set(secretarias.map((s) => s.id))
    const convProjMap = new Map(
      projetos
        .filter((p) => p.convenio_id === id || (p.secretaria_id && secIds.has(p.secretaria_id)))
        .map((p) => [p.id, p]),
    )
    const now = new Date()

    // 1. Metas Atrasadas: prazo estimado passou e quantidade realizada < quantidade alvo
    const metasAtrasadas = metas
      .filter((m) => planoMap.has(m.plano_trabalho_id))
      .filter((m) => {
        if (!m.prazo) return false
        const dataPrazo = new Date(m.prazo)
        if (isNaN(dataPrazo.getTime())) return false
        const isVencido = dataPrazo < now
        const isNaoConcluida =
          m.status !== 'concluida' &&
          ((m.quantidade_alvo ?? 0) > 0
            ? (m.quantidade_realizada ?? 0) < (m.quantidade_alvo ?? 0)
            : true)
        return isVencido && isNaoConcluida
      })
      .map((m) => {
        const plano = planoMap.get(m.plano_trabalho_id)
        const sec = plano ? secMap.get(plano.secretaria_id) : undefined
        const alvo = m.quantidade_alvo || 0
        const realizada = m.quantidade_realizada || 0
        const perc = alvo > 0 ? Math.min(100, Math.round((realizada / alvo) * 100)) : 0
        return {
          meta: m,
          plano,
          secretaria: sec,
          perc,
        }
      })

    // 2. Faturas vinculadas aos planos ou projetos deste convênio que estão vencidas ou pendentes/emitidas
    const planoIds = new Set(planos.map((p) => p.id))
    const projIds = new Set(convProjMap.keys())
    const faturasVinculadas = faturas
      .filter(
        (f) =>
          (f.plano_trabalho_id && planoIds.has(f.plano_trabalho_id)) ||
          (f.projeto_id && projIds.has(f.projeto_id)),
      )
      .filter((f) => f.status === 'vencida' || f.status === 'emitida')
      .map((f) => {
        const plano = f.plano_trabalho_id ? planoMap.get(f.plano_trabalho_id) : undefined
        const proj = f.projeto_id ? convProjMap.get(f.projeto_id) : undefined
        const secId = plano?.secretaria_id || proj?.secretaria_id
        const sec = secId ? secMap.get(secId) : undefined
        const itemTitulo = proj?.nome || proj?.titulo || plano?.titulo || 'Projeto/Plano'
        return {
          fatura: f,
          plano,
          projeto: proj,
          itemTitulo,
          secretaria: sec,
        }
      })

    return {
      metasAtrasadas,
      faturasVinculadas,
      totalAlertas: metasAtrasadas.length + faturasVinculadas.length,
    }
  }, [metas, faturas, planos, projetos, secretarias, id])

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-xs text-[#64748B]">Carregando estrutura do instrumento...</p>
      </div>
    )
  }

  if (!convenio) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-lg font-bold text-[#1E293B]">Instrumento não localizado</h2>
        <Button asChild variant="outline">
          <Link to="/convenios">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Instrumentos
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#64748B] min-w-0">
        <Link to="/convenios" className="hover:text-[#1FAF7A] inline-flex items-center shrink-0">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Instrumentos Municipais
        </Link>
        <span className="shrink-0">/</span>
        <span className="text-[#1E293B] font-medium truncate" title={convenio.nome}>
          {convenio.nome}
        </span>
      </div>

      {/* Header Principal do Instrumento */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4 overflow-hidden">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight break-words">
              {convenio.nome}
            </h1>
            <StatusBadge status={convenio.status} />
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#475569] border border-slate-200 shrink-0">
              {convenio.numero_instrumento}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#64748B] flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <Building2 className="w-4 h-4 text-[#1FAF7A] shrink-0" />
              <span className="font-semibold text-[#1E293B] break-words">{convenio.municipio}</span>
              {convenio.orgao_contratante && (
                <span className="break-words">• {convenio.orgao_contratante}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Calendar className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <span>
                Vigência: {formatDateBR(convenio.data_inicio)} a {formatDateBR(convenio.data_fim)}
              </span>
            </div>

            {convenio.anexo_pdf && (
              <a
                href={`/api/files/convenios/${convenio.id}/${convenio.anexo_pdf}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors font-medium break-all"
              >
                <FileText className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span>Visualizar Termo de Parceria (.PDF)</span>
              </a>
            )}
          </div>

          {convenio.observacoes && (
            <p className="text-xs text-[#475569] pt-1 max-w-3xl leading-relaxed break-words">
              {convenio.observacoes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditConvenioOpen(true)}
            className="text-xs font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Editar Instrumento
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

      {/* Seção de Alertas: Metas Atrasadas e Faturas Vinculadas */}
      {alertsData.totalAlertas > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#1E293B] break-words">
                  Painel de Alertas de Execução ({alertsData.totalAlertas})
                </h3>
                <p className="text-[11px] sm:text-xs text-[#64748B] break-words leading-relaxed">
                  Existem metas com prazo expirado ou pendências financeiras vinculadas aos planos
                  deste instrumento.
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 border border-amber-300 self-start sm:self-auto shrink-0">
              Atenção Necessária
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Bloco de Metas Atrasadas */}
            {alertsData.metasAtrasadas.length > 0 && (
              <div className="bg-white rounded-lg border border-amber-200 p-3.5 space-y-2.5 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    Metas Atrasadas ({alertsData.metasAtrasadas.length})
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold shrink-0">
                    Prazo Vencido
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {alertsData.metasAtrasadas.map(({ meta, plano, secretaria, perc }) => (
                    <div
                      key={meta.id}
                      className="p-2.5 rounded-md bg-red-50/50 border border-red-100 text-xs flex flex-col justify-between gap-1.5 overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[11px] sm:text-xs text-[#1E293B] break-words leading-snug">
                            {meta.descricao}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-[#64748B] break-words mt-0.5 leading-snug">
                            {secretaria?.nome || 'Secretaria'} • {plano?.titulo || 'Plano'}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                          {perc}% realizado
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 pt-1 border-t border-red-100/60 gap-2 flex-wrap">
                        <span className="shrink-0">
                          Prazo:{' '}
                          <strong className="text-red-700">{formatDateBR(meta.prazo)}</strong>
                        </span>
                        <span className="shrink-0">
                          {meta.quantidade_realizada ?? 0} de {meta.quantidade_alvo ?? 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloco de Faturas Vinculadas com Alerta */}
            {alertsData.faturasVinculadas.length > 0 && (
              <div className="bg-white rounded-lg border border-amber-200 p-3.5 space-y-2.5 shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-amber-800 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Faturas Vinculadas ({alertsData.faturasVinculadas.length})
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-semibold shrink-0">
                    Vencidas / Pendentes
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {alertsData.faturasVinculadas.map(({ fatura, itemTitulo, secretaria }) => (
                    <div
                      key={fatura.id}
                      className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between gap-1.5 overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[11px] sm:text-xs text-[#1E293B]">
                              {fatura.numero}
                            </span>
                            <StatusBadge status={fatura.status} />
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[#64748B] break-words mt-0.5 leading-snug">
                            {secretaria?.nome || 'Secretaria'} • {itemTitulo}
                          </p>
                        </div>
                        <span className="font-bold text-[#1E293B] tabular-nums shrink-0 text-right text-[11px] sm:text-xs break-all">
                          {formatBRL(fatura.valor)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-600 pt-1 border-t border-slate-200 gap-2 flex-wrap">
                        <span className="shrink-0">
                          Vencimento:{' '}
                          <strong
                            className={
                              fatura.status === 'vencida' ? 'text-red-600' : 'text-[#1E293B]'
                            }
                          >
                            {formatDateBR(fatura.data_vencimento)}
                          </strong>
                        </span>
                        <span className="text-[#64748B] break-words">
                          {fatura.forma_pagamento || 'Fatura vinculada'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cards Consolidados: Valor Global, Previsto, Executado e Barra Geral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[#E2E8F0] min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase block tracking-wide break-words">
                Valor Global do Instrumento
              </span>
              <p className="text-base sm:text-lg xl:text-xl font-bold text-[#1E293B] mt-1.5 tabular-nums tracking-tight break-words leading-tight">
                {formatBRL(convenio.valor_global)}
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-2 block break-words">
              Teto pactuado no instrumento
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase block tracking-wide break-words">
                Orçado nos Projetos
              </span>
              <p className="text-base sm:text-lg xl:text-xl font-bold text-sky-700 mt-1.5 tabular-nums tracking-tight break-words leading-tight">
                {formatBRL(consolidated.totalOrcado)}
              </p>
            </div>
            <div className="mt-2 text-[10px] sm:text-[11px] break-words">
              {convenio.valor_global > 0 && Math.abs(consolidated.diffGlobalOrcado) >= 0.01 ? (
                consolidated.diffGlobalOrcado > 0 ? (
                  <span className="text-amber-700 font-medium">
                    Saldo a alocar: {formatBRL(consolidated.diffGlobalOrcado)}
                  </span>
                ) : (
                  <span className="text-red-700 font-medium">
                    Excedente: {formatBRL(Math.abs(consolidated.diffGlobalOrcado))}
                  </span>
                )
              ) : (
                <span className="text-[#94A3B8]">
                  Distribuído em {consolidated.convProjetos.length}{' '}
                  {consolidated.convProjetos.length === 1 ? 'projeto' : 'projetos'}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <div>
              <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase block tracking-wide break-words">
                Total Empenhado
              </span>
              <p className="text-base sm:text-lg xl:text-xl font-bold text-emerald-700 mt-1.5 tabular-nums tracking-tight break-words leading-tight">
                {formatBRL(consolidated.totalEmpenhado)}
              </p>
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#94A3B8] mt-2 block break-words">
              {empenhos.length}{' '}
              {empenhos.length === 1 ? 'empenho registrado' : 'empenhos registrados'}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] min-w-0 overflow-hidden">
          <CardContent className="p-4 sm:p-5 min-w-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center mb-1 gap-2">
                <span className="text-[11px] sm:text-xs font-semibold text-[#64748B] uppercase tracking-wide break-words">
                  Alocação do Recurso
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1FAF7A] shrink-0 tabular-nums">
                  {consolidated.percAlocacaoFormatado}
                </span>
              </div>
              <Progress
                value={Math.min(100, Math.max(0, consolidated.percAlocacaoNumero))}
                className="h-2.5 mt-2"
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-[11px] text-[#94A3B8] mt-2 gap-2 flex-wrap">
              <span className="break-words">
                {convenio.valor_global > 0
                  ? consolidated.isTotalmenteAlocado
                    ? '100% do teto alocado'
                    : consolidated.diffGlobalOrcado > 0
                      ? `Saldo: ${formatBRL(consolidated.diffGlobalOrcado)}`
                      : `Excede: ${formatBRL(Math.abs(consolidated.diffGlobalOrcado))}`
                  : 'Sem teto definido'}
              </span>
              <span className="shrink-0">{secretarias.length} pastas</span>
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
              Adicione a primeira secretaria municipal participante deste instrumento para vincular
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
            // Projetos desta secretaria
            const secProjetos = projetos.filter((p) => p.secretaria_id === sec.id)

            // Planos legados desta secretaria (se houver no banco)
            const secPlanos = planos.filter((p) => p.secretaria_id === sec.id)
            const secPlanoIds = new Set(secPlanos.map((p) => p.id))
            const secMetas = metas.filter((m) => secPlanoIds.has(m.plano_trabalho_id))

            // Empenhos desta secretaria
            const secEmpenhos = empenhos.filter((e) => e.secretaria_id === sec.id)

            const secPrevistoProjetos = secProjetos.reduce(
              (s, p) => s + (Number(p.valor_total) || 0),
              0,
            )
            const secPrevistoPlanos = secPlanos.reduce(
              (s, p) => s + (Number(p.valor_previsto) || 0),
              0,
            )
            const secPrevisto = secPrevistoProjetos > 0 ? secPrevistoProjetos : secPrevistoPlanos

            // O "valor empenhado" da secretaria é calculado pela soma dos empenhos:
            const secEmpenhado = secEmpenhos.reduce((s, e) => s + (Number(e.valor) || 0), 0)
            const secExecutado =
              secEmpenhado > 0
                ? secEmpenhado
                : secPlanos.reduce((s, p) => s + (Number(p.valor_executado) || 0), 0)
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
                  className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 min-w-0"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#1FAF7A] shrink-0 mt-0.5">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-[#1E293B] break-words">
                          {sec.nome}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-[#475569] font-semibold border border-slate-200 shrink-0">
                          {secProjetos.length} {secProjetos.length === 1 ? 'projeto' : 'projetos'}
                        </span>
                      </div>
                      {sec.responsavel && (
                        <p className="text-xs text-[#64748B] mt-0.5 break-words">
                          Responsável: <strong className="text-[#334155]">{sec.responsavel}</strong>
                        </p>
                      )}
                      {sec.observacoes && (
                        <p className="text-xs text-[#64748B] mt-1 break-words leading-relaxed">
                          {sec.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Métricas Consolidadas da Secretaria e Ações */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 xl:shrink-0 flex-wrap justify-between xl:justify-end min-w-0">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 shrink-0">
                      <div className="text-left sm:text-right min-w-0">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                          Previsto
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] tabular-nums block break-words leading-tight">
                          {formatBRL(secPrevisto)}
                        </span>
                      </div>

                      <div className="text-left sm:text-right min-w-0">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                          Empenhado
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-sky-700 tabular-nums block break-words leading-tight">
                          {formatBRL(secEmpenhado)}
                        </span>
                      </div>

                      <div className="text-left sm:text-right min-w-0">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                          Executado
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-emerald-700 tabular-nums block break-words leading-tight">
                          {formatBRL(secExecutado)} ({secPerc}%)
                        </span>
                      </div>

                      <div className="text-left sm:text-right min-w-0">
                        <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                          Metas
                        </span>
                        <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] block break-words leading-tight">
                          {secMetasConcluidas}/{secMetas.length} concluídas
                        </span>
                      </div>

                      {secAtividades.length > 0 && (
                        <div className="text-left sm:text-right min-w-0 col-span-2 sm:col-span-1">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                            Atividades
                          </span>
                          <span className="text-[11px] sm:text-xs font-bold text-[#1FAF7A] block break-words leading-tight">
                            {secAtividades.length} prestador(es)
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação na Secretaria */}
                    <div
                      className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSecForRelatorio(sec)
                          setRelatorioModalOpen(true)
                        }}
                        className="h-8 text-xs font-semibold border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 shrink-0"
                        title="Gerar Relatório de Prestação de Contas formatado para impressão"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 mr-1 text-[#1FAF7A] shrink-0" />
                        <span className="hidden sm:inline">Relatório de Prestação de Contas</span>
                        <span className="sm:hidden">Prestação de Contas</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSecretaria(sec)
                          setSecretariaModalOpen(true)
                        }}
                        className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1FAF7A] shrink-0"
                        title="Editar Secretaria"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSecretaria(sec.id, sec.nome)}
                        className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600 shrink-0"
                        title="Excluir Secretaria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <div className="p-1 text-[#94A3B8] shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expansível: Empenhos e Planos de Trabalho da Secretaria */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50 space-y-6">
                    {/* Bloco de Empenhos da Secretaria */}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#1FAF7A]" />
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E293B]">
                              Notas de Empenho da Secretaria ({secEmpenhos.length})
                            </h4>
                            <p className="text-[11px] text-[#64748B]">
                              Total empenhado:{' '}
                              <strong className="text-sky-700">{formatBRL(secEmpenhado)}</strong>
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSecForEmpenho({ id: sec.id, nome: sec.nome })
                            setEditingEmpenho(null)
                            setEmpenhoModalOpen(true)
                          }}
                          className="h-7 text-xs bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Registrar Empenho
                        </Button>
                      </div>

                      {secEmpenhos.length === 0 ? (
                        <div className="text-center py-5 bg-slate-50 rounded-lg border border-dashed border-[#CBD5E1] text-xs text-[#64748B]">
                          Nenhum empenho cadastrado para esta secretaria. Clique em &quot;Registrar
                          Empenho&quot; para reservar dotação orçamentária.
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg max-w-full">
                          <table className="w-full min-w-[640px] text-xs text-left">
                            <thead className="bg-slate-100 text-[#475569] font-bold border-b border-slate-200 uppercase text-[10px]">
                              <tr>
                                <th className="py-2.5 px-3 whitespace-nowrap">Nº Empenho</th>
                                <th className="py-2.5 px-3 min-w-[200px]">Descrição</th>
                                <th className="py-2.5 px-3 whitespace-nowrap">Data</th>
                                <th className="py-2.5 px-3 text-right whitespace-nowrap">Valor</th>
                                <th className="py-2.5 px-3 text-center whitespace-nowrap">
                                  Status
                                </th>
                                <th className="py-2.5 px-3 text-right whitespace-nowrap">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {secEmpenhos.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-2 px-3 font-mono font-bold text-[#1E293B] whitespace-nowrap">
                                    {emp.numero}
                                  </td>
                                  <td
                                    className="py-2 px-3 text-[#475569] max-w-xs truncate"
                                    title={emp.descricao || undefined}
                                  >
                                    {emp.descricao || '-'}
                                  </td>
                                  <td className="py-2 px-3 text-[#64748B] whitespace-nowrap">
                                    {formatDateBR(emp.data)}
                                  </td>
                                  <td
                                    className="py-2 px-3 text-right font-bold text-[#1E293B] tabular-nums whitespace-nowrap"
                                    title={formatBRL(emp.valor)}
                                  >
                                    {formatBRL(emp.valor)}
                                  </td>
                                  <td className="py-2 px-3 text-center whitespace-nowrap">
                                    <StatusBadge status={emp.status} />
                                  </td>
                                  <td className="py-2 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedSecForEmpenho({ id: sec.id, nome: sec.nome })
                                          setEditingEmpenho(emp)
                                          setEmpenhoModalOpen(true)
                                        }}
                                        className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                        title="Editar Empenho"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteEmpenho(emp.id, emp.numero)}
                                        className="h-7 w-7 p-0 text-[#64748B] hover:text-red-600"
                                        title="Excluir Empenho"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Bloco de Projetos / Planos de Trabalho Vinculados */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-[#1FAF7A]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                            Projetos da Secretaria ({secProjetos.length})
                          </h4>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleCriarProjetoParaSecretaria(sec.id)}
                          className="h-7 text-xs bg-[#1FAF7A] hover:bg-[#179C6E] text-white shadow-xs"
                          title="Cadastrar novo projeto na Lista de Projetos com esta secretaria pré-selecionada"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Criar Projeto
                        </Button>
                      </div>

                      {secProjetos.length === 0 ? (
                        <div className="text-center py-6 bg-white rounded-lg border border-dashed border-[#CBD5E1] p-4 text-xs text-[#64748B] space-y-2">
                          <p>Nenhum projeto cadastrado para esta secretaria neste instrumento.</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCriarProjetoParaSecretaria(sec.id)}
                            className="text-xs border-[#1FAF7A]/40 text-[#1FAF7A] hover:bg-emerald-50"
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Cadastrar Primeiro Projeto
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {secProjetos.map((proj) => (
                            <div
                              key={proj.id}
                              className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs space-y-3 hover:border-emerald-300 transition-colors overflow-hidden min-w-0"
                            >
                              <div className="flex items-start justify-between gap-2 min-w-0">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h5 className="font-bold text-xs sm:text-sm text-[#1E293B] break-words leading-snug">
                                      {proj.nome || proj.titulo}
                                    </h5>
                                    <StatusBadge status={proj.status} />
                                  </div>
                                  {proj.descricao && (
                                    <p className="text-[11px] sm:text-xs text-[#64748B] mt-1 leading-relaxed break-words">
                                      {proj.descricao}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-[#1FAF7A] hover:bg-emerald-50 shrink-0"
                                >
                                  <Link to={`/projetos/${proj.id}`}>
                                    <span>Ver</span>
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </Link>
                                </Button>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B] gap-2 flex-wrap">
                                <div className="min-w-0">
                                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                                    Orçamento Total
                                  </span>
                                  <span className="text-[11px] sm:text-xs font-bold text-[#1E293B] tabular-nums block break-words leading-tight">
                                    {formatBRL(proj.valor_total || 0)}
                                  </span>
                                </div>
                                {proj.data_fim && (
                                  <div className="text-right min-w-0">
                                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#94A3B8] block break-words">
                                      Término Previsto
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-medium text-[#475569] block break-words leading-tight">
                                      {formatDateBR(proj.data_fim)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

      <ModalEmpenho
        open={empenhoModalOpen}
        onClose={() => setEmpenhoModalOpen(false)}
        onSuccess={fetchData}
        secretariaId={selectedSecForEmpenho.id}
        secretariaNome={selectedSecForEmpenho.nome}
        convenioId={convenio.id}
        empenhoToEdit={editingEmpenho}
        secretariasDisponiveis={secretarias}
      />

      {selectedSecForRelatorio && (
        <ModalRelatorioPrestacaoContas
          open={relatorioModalOpen}
          onClose={() => {
            setRelatorioModalOpen(false)
            setSelectedSecForRelatorio(null)
          }}
          convenio={convenio}
          secretaria={selectedSecForRelatorio}
          planos={planos.filter((p) => p.secretaria_id === selectedSecForRelatorio.id)}
          projetos={projetos.filter((p) => p.secretaria_id === selectedSecForRelatorio.id)}
          metas={metas.filter((m) => {
            const secPlanoIds = new Set(
              planos.filter((p) => p.secretaria_id === selectedSecForRelatorio.id).map((p) => p.id),
            )
            return secPlanoIds.has(m.plano_trabalho_id)
          })}
          empenhos={empenhos.filter((e) => e.secretaria_id === selectedSecForRelatorio.id)}
          atividades={atividades.filter((a) => {
            const secPlanoIds = new Set(
              planos.filter((p) => p.secretaria_id === selectedSecForRelatorio.id).map((p) => p.id),
            )
            return a.plano_trabalho_id && secPlanoIds.has(a.plano_trabalho_id)
          })}
        />
      )}
    </div>
  )
}
