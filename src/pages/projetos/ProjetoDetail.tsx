import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Building2,
  DollarSign,
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  Receipt,
  Users,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalProjeto } from '@/components/ModalProjeto'
import { ModalNovaAtividade } from '@/components/ModalNovaAtividade'
import { ModalCatalogoAtividade } from '@/components/ModalCatalogoAtividade'
import { ModalImportarAtividades } from '@/components/ModalImportarAtividades'
import { FileSpreadsheet } from 'lucide-react'
import {
  getProjetoById,
  getAtividadesByProjeto,
  getFaturasByProjeto,
  getContratos,
  updateAtividade,
  getCatalogoAtividades,
  deleteCatalogoAtividade,
  getSolicitacoesByProjeto,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { ModalSolicitacao } from '@/components/ModalSolicitacao'
import type {
  ProjetoRecord,
  AtividadeRecord,
  FaturaRecord,
  ContratoRecord,
  CatalogoAtividadeRecord,
  SolicitacaoRecord,
} from '@/types'

export default function ProjetoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [projeto, setProjeto] = useState<ProjetoRecord | null>(null)
  const [atividades, setAtividades] = useState<AtividadeRecord[]>([])
  const [faturas, setFaturas] = useState<FaturaRecord[]>([])
  const [equipe, setEquipe] = useState<ContratoRecord[]>([])
  const [catalogo, setCatalogo] = useState<CatalogoAtividadeRecord[]>([])
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [atividadeModalOpen, setAtividadeModalOpen] = useState(false)
  const [catalogoModalOpen, setCatalogoModalOpen] = useState(false)
  const [importarModalOpen, setImportarModalOpen] = useState(false)
  const [solicitacaoModalOpen, setSolicitacaoModalOpen] = useState(false)
  const [editingSolicitacao, setEditingSolicitacao] = useState<SolicitacaoRecord | null>(null)
  const [editingCatalogoAtiv, setEditingCatalogoAtiv] = useState<CatalogoAtividadeRecord | null>(
    null,
  )
  const [selectedAtividade, setSelectedAtividade] = useState<AtividadeRecord | null>(null)

  const fetchData = async () => {
    if (!id) return
    try {
      const [proj, ativList, fatList, allContratos, catList, solList] = await Promise.all([
        getProjetoById(id),
        getAtividadesByProjeto(id),
        getFaturasByProjeto(id),
        getContratos(),
        getCatalogoAtividades(id),
        getSolicitacoesByProjeto(id),
      ])
      setProjeto(proj)
      setAtividades(ativList)
      setFaturas(fatList)
      setCatalogo(catList)
      setSolicitacoes(solList)
      // vinculados a este projeto
      setEquipe(allContratos.filter((c) => c.projeto_id === id))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useRealtime('projetos', () => fetchData())
  useRealtime('atividades', () => fetchData())
  useRealtime('faturas', () => fetchData())
  useRealtime('catalogo_atividades', () => fetchData())
  useRealtime('solicitacoes', () => fetchData())

  const handleApproveAtividade = async (ativId: string) => {
    try {
      await updateAtividade(ativId, { status: 'aprovada' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRejectAtividade = async (ativId: string) => {
    try {
      await updateAtividade(ativId, { status: 'rejeitada' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-xs text-[#64748B]">Carregando detalhes do projeto...</p>
      </div>
    )
  }

  if (!projeto) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-lg font-bold text-[#1E293B]">Projeto não localizado</h2>
        <Button asChild variant="outline">
          <Link to="/projetos">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Projetos
          </Link>
        </Button>
      </div>
    )
  }

  const handleDeleteCatalogo = async (catId: string, desc: string) => {
    if (window.confirm(`Deseja remover "${desc}" do catálogo de atividades deste projeto?`)) {
      try {
        await deleteCatalogoAtividade(catId)
        fetchData()
      } catch {
        alert('Erro ao excluir atividade do catálogo.')
      }
    }
  }

  const totalFaturado = faturas
    .filter((f) => f.status === 'paga')
    .reduce((s, f) => s + (Number(f.valor) || 0), 0)

  const totalHorasAtividades = atividades.reduce((s, a) => s + (Number(a.horas) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link to="/projetos" className="hover:text-[#1FAF7A] inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Projetos
        </Link>
        <span>/</span>
        <span className="text-[#1E293B] font-medium truncate max-w-sm">{projeto.nome}</span>
      </div>

      {/* Header do Projeto */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">{projeto.nome}</h1>
            <StatusBadge status={projeto.status} />
            {(() => {
              const raw = projeto.contratos_vinculados
              if (!raw) return null
              const list = Array.isArray(raw) ? raw : [raw]
              const hasCLT = list.includes('CLT')
              const hasPJ = list.includes('PJ')
              let label = ''
              if (hasCLT && hasPJ) label = 'Contratos: CLT + PJ'
              else if (hasCLT) label = 'Contrato: CLT'
              else if (hasPJ) label = 'Contrato: PJ'
              if (!label) return null
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {label}
                </span>
              )
            })()}
          </div>
          {projeto.parceiro && (
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <Building2 className="w-4 h-4 text-[#1FAF7A]" />
              <span>
                Parceiro / Financiador: <strong>{projeto.parceiro}</strong>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(true)}
            className="text-xs font-semibold"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Editar Projeto
          </Button>

          <Button
            size="sm"
            onClick={() => setAtividadeModalOpen(true)}
            className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm shadow-[#1FAF7A]/25"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Tabs Principais: Visão Geral, Catálogo de Atividades (Anexo I PT), Entregas, Financeiro */}
      <Tabs defaultValue="catalogo" className="space-y-4">
        <TabsList className="bg-white border border-[#E2E8F0] p-1 h-11 rounded-lg">
          <TabsTrigger
            value="catalogo"
            className="text-xs font-semibold px-4 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
          >
            Catálogo de Atividades ({catalogo.length})
          </TabsTrigger>
          <TabsTrigger
            value="visao-geral"
            className="text-xs font-semibold px-4 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
          >
            Visão Geral & Custos
          </TabsTrigger>
          <TabsTrigger
            value="atividades"
            className="text-xs font-semibold px-4 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
          >
            Entregas/Horas ({atividades.length})
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="text-xs font-semibold px-4 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
          >
            Financeiro ({faturas.length})
          </TabsTrigger>
          <TabsTrigger
            value="solicitacoes"
            className="text-xs font-semibold px-4 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
          >
            Solicitações & Pendências ({solicitacoes.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA CATÁLOGO DE ATIVIDADES (ANEXO I PT) */}
        <TabsContent value="catalogo" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">
                Catálogo de Atividades Previstas (Anexo I PT)
              </h3>
              <p className="text-xs text-[#64748B]">
                Quadro de atividades para execução direta (CLT / PJ, serviço mensal ou
                plantões/demandas) com remuneração de referência.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportarModalOpen(true)}
                className="text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50 bg-white shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-[#1FAF7A]" />
                Importar Planilha
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setEditingCatalogoAtiv(null)
                  setCatalogoModalOpen(true)
                }}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm shadow-[#1FAF7A]/25"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nova Atividade no Catálogo
              </Button>
            </div>
          </div>

          <Card className="border-[#E2E8F0] overflow-hidden">
            <CardContent className="p-0">
              {catalogo.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#64748B] space-y-2">
                  <p>Nenhuma atividade cadastrada no catálogo deste projeto.</p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Cadastre as atividades previstas no Plano de Trabalho clicando em &ldquo;Nova
                    Atividade no Catálogo&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                        <th className="py-3 px-4">Vínculo</th>
                        <th className="py-3 px-4">Atividade / Função</th>
                        <th className="py-3 px-4">Tipo de Execução</th>
                        <th className="py-3 px-4">Remuneração / Valor Unitário</th>
                        <th className="py-3 px-4">Composição de Custo CLT</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {catalogo.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                cat.tipo_vinculo === 'CLT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}
                            >
                              {cat.tipo_vinculo}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#1E293B] block">{cat.descricao}</span>
                            {cat.detalhes_escopo && (
                              <span className="text-[11px] text-[#64748B] line-clamp-1">
                                {cat.detalhes_escopo}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#475569]">
                            {cat.tipo_execucao}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1E293B] tabular-nums">
                            {formatBRL(cat.valor_unitario)}
                            {(() => {
                              const norm = (cat.tipo_execucao || '')
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .toLowerCase()
                              const isDemanda =
                                norm.includes('plantao') ||
                                norm.includes('demanda') ||
                                norm.includes('unidade') ||
                                norm.includes('hora')
                              return isDemanda ? (
                                <span className="text-[10px] text-[#64748B] font-normal ml-1">
                                  / unidade
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#64748B] font-normal ml-1">
                                  / mês
                                </span>
                              )
                            })()}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[#64748B]">
                            {cat.tipo_vinculo === 'CLT' && (cat.proventos || cat.encargos) ? (
                              <span>
                                Prov: {cat.proventos ? formatBRL(cat.proventos) : '—'} | Enc:{' '}
                                {cat.encargos ? formatBRL(cat.encargos) : '—'}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingCatalogoAtiv(cat)
                                  setCatalogoModalOpen(true)
                                }}
                                className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                title="Editar Atividade"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteCatalogo(cat.id, cat.descricao)}
                                className="h-7 w-7 p-0 text-[#64748B] hover:text-red-600"
                                title="Excluir Atividade"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
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
        </TabsContent>
        {/* ABA 1: VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-[#E2E8F0]">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-[#64748B] uppercase">
                  Valor Total do Projeto
                </span>
                <p className="text-2xl font-bold text-[#1E293B] mt-2 tabular-nums">
                  {formatBRL(projeto.valor_total)}
                </p>
                <span className="text-xs text-[#94A3B8] mt-1 block">
                  {projeto.meses_duracao
                    ? `${projeto.meses_duracao} meses de vigência`
                    : 'Aporte global'}
                </span>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-[#64748B] uppercase">
                  Custo Mensal Estimado
                </span>
                <p className="text-lg font-bold text-emerald-700 mt-2 tabular-nums">
                  {formatBRL(
                    (projeto.valor_mensal_execucao || 0) + (projeto.valor_mensal_despesas_adm || 0),
                  )}
                </p>
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  Direto: {formatBRL(projeto.valor_mensal_execucao || 0)} | Adm:{' '}
                  {formatBRL(projeto.valor_mensal_despesas_adm || 0)}
                </span>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardContent className="p-5">
                <span className="text-xs font-semibold text-[#64748B] uppercase">
                  Período de Execução
                </span>
                <p className="text-sm font-bold text-[#1E293B] mt-2">
                  {formatDateBR(projeto.data_inicio)} até {formatDateBR(projeto.data_fim)}
                </p>
                <span className="text-xs text-[#94A3B8] mt-1 block">Vigência contratual</span>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-[#64748B] uppercase">
                    Progresso Físico
                  </span>
                  <span className="text-xs font-bold text-[#1E293B]">
                    {projeto.progresso || 0}%
                  </span>
                </div>
                <Progress value={projeto.progresso || 0} className="h-2.5 mt-2" />
                <span className="text-xs text-[#94A3B8] mt-2 block">
                  {projeto.progresso === 100 ? 'Meta 100% atingida' : 'Em andamento'}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Sobre o Projeto & Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#475569] leading-relaxed">
                {projeto.descricao || 'Nenhuma descrição detalhada informada.'}
              </p>
            </CardContent>
          </Card>

          {/* Equipe Vinculada (Avatares) */}
          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Equipe & Prestadores Vinculados
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Colaboradores CLT e pessoas jurídicas designados para este projeto
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to="/contratos">Ver todos os contratos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {equipe.length === 0 ? (
                <p className="text-xs text-[#94A3B8] py-4">
                  Nenhum contrato formalmente vinculado ainda.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {equipe.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50"
                    >
                      <Avatar className="w-10 h-10 border border-emerald-200 bg-emerald-50 text-[#1FAF7A] text-xs font-bold">
                        <AvatarFallback className="bg-emerald-100 text-[#1FAF7A]">
                          {m.nome.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1E293B] truncate">{m.nome}</p>
                        <p className="text-[11px] text-[#64748B] truncate">{m.cargo_funcao}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                            {m.tipo}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {m.tipo === 'CLT'
                              ? formatBRL(m.valor)
                              : m.tipo_pj === 'horas'
                                ? `R$ ${m.valor}/h`
                                : formatBRL(m.valor)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: ATIVIDADES */}
        <TabsContent value="atividades" className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">Controle de Entregas & Horas</h3>
              <p className="text-xs text-[#64748B]">
                Total de {totalHorasAtividades} horas reportadas neste projeto
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setAtividadeModalOpen(true)}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Atividade
            </Button>
          </div>

          <Card className="border-[#E2E8F0]">
            <CardContent className="p-0">
              {atividades.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#64748B]">
                  Nenhuma atividade reportada ainda para este projeto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-slate-50 font-semibold">
                        <th className="py-3 px-4">Prestador PJ</th>
                        <th className="py-3 px-4">Descrição da Atividade</th>
                        <th className="py-3 px-4">Data</th>
                        <th className="py-3 px-4">Horas</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Aprovação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {atividades.map((a) => (
                        <tr
                          key={a.id}
                          onClick={() => setSelectedAtividade(a)}
                          className="hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-[#1E293B]">
                            {a.expand?.prestador_id?.nome || 'Prestador PJ'}
                          </td>
                          <td className="py-3 px-4 text-[#475569] max-w-xs truncate">
                            {a.descricao}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">{formatDateBR(a.data)}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#1E293B]">
                            {a.horas}h
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={a.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {a.status === 'pendente' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveAtividade(a.id)}
                                    className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                    title="Aprovar Atividade"
                                  >
                                    <Check className="w-3.5 h-3.5 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectAtividade(a.id)}
                                    className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    title="Rejeitar Atividade"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <span className="text-[11px] text-[#94A3B8]">Concluído</span>
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
        </TabsContent>

        {/* ABA 4: SOLICITAÇÕES & PENDÊNCIAS */}
        <TabsContent value="solicitacoes" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <div>
              <h3 className="text-sm font-bold text-[#1E293B]">
                Solicitações & Pendências Vinculadas ao Projeto
              </h3>
              <p className="text-xs text-[#64748B]">
                Acompanhamento das demandas operacionais, financeiras e documentais deste projeto.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to="/solicitacoes">
                  Ver Todas as Solicitações
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingSolicitacao(null)
                  setSolicitacaoModalOpen(true)
                }}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm shadow-[#1FAF7A]/25"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nova Solicitação
              </Button>
            </div>
          </div>

          <Card className="border-[#E2E8F0] overflow-hidden">
            <CardContent className="p-0">
              {solicitacoes.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#64748B] space-y-2">
                  <p>Nenhuma solicitação ou pendência vinculada a este projeto.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingSolicitacao(null)
                      setSolicitacaoModalOpen(true)
                    }}
                    className="text-xs mt-1"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Cadastrar Primeira Solicitação
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                        <th className="py-3 px-4">Título</th>
                        <th className="py-3 px-3">Tipo</th>
                        <th className="py-3 px-3">Prioridade</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Responsável</th>
                        <th className="py-3 px-3">Prazo</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {solicitacoes.map((s) => {
                        const dtPrazo = s.prazo ? new Date(s.prazo) : null
                        const hoje = new Date()
                        hoje.setHours(0, 0, 0, 0)
                        const atrasada =
                          dtPrazo &&
                          s.status !== 'Concluída' &&
                          s.status !== 'Cancelada' &&
                          dtPrazo < hoje

                        return (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 max-w-xs">
                              <span className="font-bold text-[#1E293B] block">{s.titulo}</span>
                              {s.descricao && (
                                <span className="text-[11px] text-[#64748B] line-clamp-1">
                                  {s.descricao}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {s.tipo}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.prioridade === 'Urgente'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : s.prioridade === 'Alta'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {s.prioridade}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                  s.status === 'Concluída'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : s.status === 'Cancelada'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[#475569]">{s.responsavel || '—'}</td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {s.prazo ? (
                                <span
                                  className={
                                    atrasada ? 'text-rose-600 font-bold' : 'text-[#64748B]'
                                  }
                                >
                                  {formatDateBR(s.prazo)} {atrasada && '(Atrasada)'}
                                </span>
                              ) : (
                                <span className="text-[#94A3B8]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSolicitacao(s)
                                  setSolicitacaoModalOpen(true)
                                }}
                                className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                title="Editar Solicitação"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
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
        </TabsContent>

        {/* ABA 3: FINANCEIRO */}
        <TabsContent value="financeiro" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-[#E2E8F0]">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-[#64748B]">
                  Total Recebido deste Projeto
                </span>
                <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
                  {formatBRL(totalFaturado)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0]">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-[#64748B]">Saldo a Executar</span>
                <p className="text-xl font-bold text-[#1E293B] mt-1 tabular-nums">
                  {formatBRL(Math.max(0, projeto.valor_total - totalFaturado))}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#E2E8F0]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#1E293B]">
                  Faturas Vinculadas
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Boletos e notas de empenho emitidos para este projeto
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to="/faturamento">Ver todas as faturas</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {faturas.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#64748B]">
                  Nenhuma fatura emitida para este projeto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] bg-slate-50 font-semibold">
                        <th className="py-3 px-4">Nº Fatura</th>
                        <th className="py-3 px-4">Emissão</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Forma de Pagto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {faturas.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-[#1E293B]">
                            {f.numero}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {formatDateBR(f.data_emissao)}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {formatDateBR(f.data_vencimento)}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1E293B] tabular-nums">
                            {formatBRL(f.valor)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={f.status} />
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">{f.forma_pagamento || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Projeto Modal */}
      <ModalProjeto
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchData}
        projetoToEdit={projeto}
      />

      {/* Nova Atividade Modal */}
      <ModalNovaAtividade
        open={atividadeModalOpen}
        onClose={() => setAtividadeModalOpen(false)}
        onSuccess={fetchData}
        defaultProjetoId={projeto.id}
      />

      {/* Modal Catálogo de Atividades */}
      <ModalCatalogoAtividade
        open={catalogoModalOpen}
        onClose={() => setCatalogoModalOpen(false)}
        onSuccess={fetchData}
        projetoId={projeto.id}
        atividadeToEdit={editingCatalogoAtiv}
      />

      {/* Modal Importar Atividades via Planilha */}
      <ModalImportarAtividades
        open={importarModalOpen}
        onClose={() => setImportarModalOpen(false)}
        onSuccess={fetchData}
        projetoId={projeto.id}
        catalogoExistente={catalogo}
      />

      {/* Modal Solicitação Vinculada */}
      <ModalSolicitacao
        open={solicitacaoModalOpen}
        onClose={() => setSolicitacaoModalOpen(false)}
        onSuccess={fetchData}
        solicitacaoToEdit={editingSolicitacao}
        defaultProjetoId={projeto.id}
      />
    </div>
  )
}
