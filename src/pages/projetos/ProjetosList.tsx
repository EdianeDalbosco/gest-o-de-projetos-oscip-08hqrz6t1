import React, { useState, useEffect, useMemo } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  ExternalLink,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Table as TableIcon,
  Download,
  Printer,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalProjeto } from '@/components/ModalProjeto'
import { getProjetos, deleteProjeto } from '@/services/api'
import { exportarProjetosPdf, imprimirProjetos } from '@/services/exportProjetos'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import type { ProjetoRecord } from '@/types'

export type ViewMode = 'cards' | 'lista' | 'planilha'

const STORAGE_KEY = 'projetos_view_mode'

export default function ProjetosList() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'cards' || saved === 'lista' || saved === 'planilha') {
        return saved
      }
    } catch {
      // fallback caso localStorage esteja bloqueado
    }
    return 'cards'
  })

  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<ProjetoRecord | null>(null)
  const [defaultSecretariaId, setDefaultSecretariaId] = useState<string | undefined>(undefined)
  const [defaultConvenioId, setDefaultConvenioId] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [printing, setPrinting] = useState(false)

  const fetchProjetos = async () => {
    try {
      const data = await getProjetos()
      setProjetos(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjetos()

    // Listen to topbar trigger event
    const handleOpenModal = () => {
      setEditingProjeto(null)
      setDefaultSecretariaId(undefined)
      setDefaultConvenioId(undefined)
      setModalOpen(true)
    }
    window.addEventListener('open-modal-novo-projeto', handleOpenModal)
    return () => {
      window.removeEventListener('open-modal-novo-projeto', handleOpenModal)
    }
  }, [])

  // Suporte a abertura automática via navegação externa (state ou query params)
  useEffect(() => {
    const state = location.state as
      | { openModal?: boolean; secretariaId?: string; convenioId?: string }
      | undefined
    const queryNovo = searchParams.get('novo') === 'true'
    const querySec = searchParams.get('secretaria_id') || undefined
    const queryConv = searchParams.get('convenio_id') || undefined

    if (state?.openModal || queryNovo) {
      setEditingProjeto(null)
      setDefaultSecretariaId(state?.secretariaId || querySec)
      setDefaultConvenioId(state?.convenioId || queryConv)
      setModalOpen(true)

      // Limpa searchParams se existirem para não reabrir em refresh acidental
      if (queryNovo) {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('novo')
        nextParams.delete('secretaria_id')
        nextParams.delete('convenio_id')
        setSearchParams(nextParams, { replace: true })
      }
    }
  }, [location.state, searchParams, setSearchParams])

  useRealtime('projetos', () => fetchProjetos())

  const filteredProjetos = useMemo(() => {
    return projetos.filter((p) => {
      const secNome = p.expand?.secretaria_id?.nome || ''
      const convNum = p.expand?.convenio_id?.numero_instrumento || ''
      const searchLower = search.toLowerCase()

      const matchesSearch =
        p.nome.toLowerCase().includes(searchLower) ||
        (p.parceiro && p.parceiro.toLowerCase().includes(searchLower)) ||
        secNome.toLowerCase().includes(searchLower) ||
        convNum.toLowerCase().includes(searchLower)
      const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projetos, search, statusFilter])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore
    }
  }

  const renderContratosBadges = (contratos?: string | string[], compact = false) => {
    if (!contratos) {
      return <span className="text-[11px] text-[#94A3B8] italic">Sem contrato vinculado</span>
    }
    const list = Array.isArray(contratos) ? contratos : [contratos]
    const hasCLT = list.includes('CLT')
    const hasPJ = list.includes('PJ')

    if (!hasCLT && !hasPJ) {
      return <span className="text-[11px] text-[#94A3B8] italic">Sem contrato vinculado</span>
    }

    if (compact) {
      return (
        <div className="flex items-center gap-1">
          {hasCLT && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              CLT
            </span>
          )}
          {hasPJ && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              PJ
            </span>
          )}
        </div>
      )
    }

    let label = ''
    if (hasCLT && hasPJ) {
      label = 'Contratos: CLT + PJ'
    } else if (hasCLT) {
      label = 'Contrato: CLT'
    } else if (hasPJ) {
      label = 'Contrato: PJ'
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        {label}
      </span>
    )
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await deleteProjeto(id)
        fetchProjetos()
      } catch (err) {
        alert('Não foi possível excluir o projeto pois existem vínculos ou erro na requisição.')
      }
    }
  }

  const handleExportPdf = async () => {
    if (filteredProjetos.length === 0) {
      toast({
        title: 'Nenhum projeto para exportar',
        description: 'Ajuste os filtros para selecionar projetos antes de gerar o PDF.',
        variant: 'destructive',
      })
      return
    }

    try {
      setExportingPdf(true)
      // Permite que o estado de loading renderize antes do processamento síncrono do jsPDF
      await new Promise((resolve) => setTimeout(resolve, 50))
      exportarProjetosPdf({
        projetos: filteredProjetos,
        filtroBusca: search,
        filtroStatus: statusFilter,
      })
      toast({
        title: 'PDF gerado com sucesso',
        description: `Exportados ${filteredProjetos.length} ${
          filteredProjetos.length === 1 ? 'projeto' : 'projetos'
        }. O download iniciará automaticamente.`,
      })
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o arquivo PDF. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setExportingPdf(false)
    }
  }

  const handlePrint = () => {
    if (filteredProjetos.length === 0) {
      toast({
        title: 'Nenhum projeto para imprimir',
        description: 'Ajuste os filtros para selecionar projetos antes de imprimir.',
        variant: 'destructive',
      })
      return
    }

    try {
      setPrinting(true)
      imprimirProjetos({
        projetos: filteredProjetos,
        filtroBusca: search,
        filtroStatus: statusFilter,
      })
    } catch (err) {
      console.error('Erro ao abrir diálogo de impressão:', err)
      toast({
        title: 'Erro ao abrir impressão',
        description:
          'Não foi possível abrir o diálogo de impressão. Verifique o bloqueador de pop-ups.',
        variant: 'destructive',
      })
    } finally {
      setTimeout(() => setPrinting(false), 500)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Projetos</h2>
          <p className="text-xs text-[#64748B]">
            Gerencie o escopo, cronograma, prestadores vinculados e faturamento de cada iniciativa.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProjeto(null)
            setModalOpen(true)
          }}
          className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1FAF7A]/25 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Projeto
        </Button>
      </div>

      {/* Filters Bar & View Switcher */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row gap-3 items-center flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, parceiro ou secretaria..."
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
                <SelectItem value="pausado">Pausados</SelectItem>
                <SelectItem value="concluido">Concluídos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions: Export PDF, Print & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Botões de Exportar e Imprimir */}
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exportingPdf || loading}
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50 shadow-xs gap-1.5"
              title="Exportar listagem atual para arquivo PDF (A4)"
            >
              {exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <Download className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={printing || loading}
              className="h-9 px-2.5 sm:px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border-slate-200 hover:bg-slate-50 shadow-xs gap-1.5"
              title="Imprimir listagem atual ou salvar como PDF pelo navegador"
            >
              {printing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <Printer className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span className="hidden sm:inline">Imprimir</span>
              <span className="sm:hidden">Imprimir</span>
            </Button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-[#1FAF7A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
              }`}
              title="Visualização em Grade de Quadros (Cards)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quadros</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('lista')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'lista'
                  ? 'bg-[#1FAF7A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
              }`}
              title="Visualização em Linhas Compactas (Lista)"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('planilha')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'planilha'
                  ? 'bg-[#1FAF7A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/60'
              }`}
              title="Visualização Completa em Planilha (Tabela)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Planilha</span>
            </button>
          </div>
        </div>
      </div>

      {/* Renderização conforme modo selecionado */}
      {filteredProjetos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-8">
          <FolderKanban className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1E293B]">Nenhum projeto encontrado</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
            {search || statusFilter !== 'todos'
              ? 'Tente ajustar os filtros ou a busca para localizar os projetos.'
              : 'Cadastre seu primeiro projeto para gerenciar cronograma, contratos, prestadores e metas.'}
          </p>
          <Button
            onClick={() => {
              setEditingProjeto(null)
              setModalOpen(true)
            }}
            className="mt-4 bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Cadastrar Primeiro Projeto
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* 1. MODO QUADROS (CARDS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjetos.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <StatusBadge status={proj.status} />
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingProjeto(proj)
                        setModalOpen(true)
                      }}
                      className="p-1.5 text-[#64748B] hover:text-[#1FAF7A] hover:bg-slate-100 rounded-md"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, proj.id)}
                      className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-[#1E293B] group-hover:text-[#1FAF7A] transition-colors leading-snug">
                  <Link to={`/projetos/${proj.id}`}>{proj.nome}</Link>
                </h3>

                {(proj.expand?.secretaria_id?.nome || proj.parceiro) && (
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span className="truncate">
                      {proj.expand?.secretaria_id?.nome || proj.parceiro}
                    </span>
                  </div>
                )}

                {proj.descricao && (
                  <p className="text-xs text-[#64748B] mt-2.5 line-clamp-2">{proj.descricao}</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                {/* Contratos Vinculados Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748B] font-medium">Contratos Vinculados</span>
                  {renderContratosBadges(proj.contratos_vinculados)}
                </div>

                {/* Period & Total Budget */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1 text-[#64748B]">
                    <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>
                      {formatDateBR(proj.data_inicio)} — {formatDateBR(proj.data_fim)}
                    </span>
                  </div>
                  <span className="font-bold text-sm text-[#1E293B] tabular-nums">
                    {formatBRL(proj.valor_total)}
                  </span>
                </div>

                {/* Detail CTA button */}
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full text-xs font-semibold text-[#1FAF7A] border-[#1FAF7A]/25 hover:bg-[#1FAF7A]/10 mt-1"
                >
                  <Link to={`/projetos/${proj.id}`}>
                    Ver Detalhes do Projeto
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'lista' ? (
        /* 2. MODO LISTA (LINHAS COMPACTAS) */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm divide-y divide-[#F1F5F9] overflow-hidden">
          {filteredProjetos.map((proj) => (
            <div
              key={proj.id}
              className="p-3.5 sm:px-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
            >
              {/* Nome & Secretaria */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/projetos/${proj.id}`}
                    className="font-bold text-sm text-[#1E293B] hover:text-[#1FAF7A] transition-colors leading-snug truncate"
                  >
                    {proj.nome}
                  </Link>
                  <StatusBadge status={proj.status} />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#94A3B8] shrink-0" />
                    <span className="truncate max-w-[280px]">
                      {proj.expand?.secretaria_id?.nome ||
                        proj.parceiro ||
                        'Sem secretaria vinculada'}
                    </span>
                  </div>
                  {(proj.data_inicio || proj.data_fim) && (
                    <>
                      <span className="text-[#CBD5E1] hidden sm:inline">•</span>
                      <div className="flex items-center gap-1 text-[#64748B] hidden sm:flex">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        <span>
                          {formatDateBR(proj.data_inicio)} — {formatDateBR(proj.data_fim)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Contratos Vinculados, Valor e Ações */}
              <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#94A3B8] md:hidden">Contratos:</span>
                  {renderContratosBadges(proj.contratos_vinculados, true)}
                </div>

                <div className="text-right min-w-[110px]">
                  <span className="text-[10px] text-[#94A3B8] uppercase font-bold block md:hidden">
                    Valor Total
                  </span>
                  <span className="font-bold text-sm text-[#1E293B] tabular-nums">
                    {formatBRL(proj.valor_total)}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2.5 text-xs text-[#1FAF7A] hover:bg-emerald-50 hover:text-[#179C6E]"
                    title="Abrir detalhes do projeto"
                  >
                    <Link to={`/projetos/${proj.id}`}>
                      <span className="hidden sm:inline">Abrir</span>
                      <ExternalLink className="w-3.5 h-3.5 sm:ml-1" />
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingProjeto(proj)
                      setModalOpen(true)
                    }}
                    className="h-8 w-8 p-0 text-[#64748B] hover:text-[#1FAF7A] hover:bg-slate-100"
                    title="Editar projeto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDelete(e, proj.id)}
                    className="h-8 w-8 p-0 text-[#64748B] hover:text-red-600 hover:bg-red-50"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. MODO PLANILHA (TABELA ESTILO SPREADSHEET) */
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full text-xs text-left min-w-[960px]">
              <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#475569] font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Projeto</th>
                  <th className="py-3 px-3 min-w-[190px]">Secretaria / Instrumento</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">Contratos</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Execução Mensal</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Desp. Adm/Oper</th>
                  <th className="py-3 px-3 text-right min-w-[130px]">Valor Total</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">Metas</th>
                  <th className="py-3 px-3 text-center min-w-[100px]">Status</th>
                  <th className="py-3 px-4 text-right min-w-[90px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredProjetos.map((proj) => {
                  const valorExec = proj.valor_mensal_execucao || 0
                  const valorAdm = proj.valor_mensal_despesas_adm || 0
                  const progresso = proj.progresso || 0
                  const metasLabel =
                    progresso === 100 ? '100%' : progresso > 0 ? `${progresso}%` : '0%'

                  const secNome = proj.expand?.secretaria_id?.nome || proj.parceiro || '—'
                  const convNumero = proj.expand?.convenio_id?.numero_instrumento

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Projeto */}
                      <td className="py-3 px-4">
                        <Link
                          to={`/projetos/${proj.id}`}
                          className="font-bold text-[#1E293B] hover:text-[#1FAF7A] transition-colors line-clamp-1 block"
                          title={proj.nome}
                        >
                          {proj.nome}
                        </Link>
                        {proj.descricao && (
                          <span className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                            {proj.descricao}
                          </span>
                        )}
                      </td>

                      {/* Secretaria / Instrumento */}
                      <td className="py-3 px-3">
                        <span
                          className="font-medium text-[#1E293B] block truncate max-w-[200px]"
                          title={secNome}
                        >
                          {secNome}
                        </span>
                        {convNumero && (
                          <span className="text-[10px] text-[#64748B] block font-mono">
                            {convNumero}
                          </span>
                        )}
                      </td>

                      {/* Contratos Vinculados */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center">
                          {renderContratosBadges(proj.contratos_vinculados, true)}
                        </div>
                      </td>

                      {/* Execução Mensal */}
                      <td className="py-3 px-3 text-right font-medium text-[#475569] tabular-nums whitespace-nowrap">
                        {valorExec > 0 ? formatBRL(valorExec) : '—'}
                      </td>

                      {/* Despesas Adm/Oper Mensal */}
                      <td className="py-3 px-3 text-right font-medium text-[#475569] tabular-nums whitespace-nowrap">
                        {valorAdm > 0 ? formatBRL(valorAdm) : '—'}
                      </td>

                      {/* Valor Total */}
                      <td className="py-3 px-3 text-right font-bold text-[#1E293B] tabular-nums whitespace-nowrap">
                        {formatBRL(proj.valor_total || 0)}
                      </td>

                      {/* Metas / Progresso */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums ${
                            progresso === 100
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : progresso > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {metasLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <StatusBadge status={proj.status} />
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-[#1FAF7A] hover:bg-emerald-50"
                            title="Abrir detalhes"
                          >
                            <Link to={`/projetos/${proj.id}`}>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProjeto(proj)
                              setModalOpen(true)
                            }}
                            className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A] hover:bg-slate-100"
                            title="Editar projeto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDelete(e, proj.id)}
                            className="h-7 w-7 p-0 text-[#64748B] hover:text-red-600 hover:bg-red-50"
                            title="Excluir projeto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer da Planilha com Totais */}
          <div className="bg-slate-50/70 border-t border-[#E2E8F0] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
            <span>
              Total de <strong>{filteredProjetos.length}</strong>{' '}
              {filteredProjetos.length === 1 ? 'projeto' : 'projetos'}
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span>
                Soma Execução Mensal:{' '}
                <strong className="text-[#1E293B] tabular-nums">
                  {formatBRL(
                    filteredProjetos.reduce((acc, p) => acc + (p.valor_mensal_execucao || 0), 0),
                  )}
                </strong>
              </span>
              <span>
                Soma Total:{' '}
                <strong className="text-emerald-700 tabular-nums">
                  {formatBRL(filteredProjetos.reduce((acc, p) => acc + (p.valor_total || 0), 0))}
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Creation/Edit Modal */}
      <ModalProjeto
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setDefaultSecretariaId(undefined)
          setDefaultConvenioId(undefined)
        }}
        onSuccess={fetchProjetos}
        projetoToEdit={editingProjeto}
        defaultSecretariaId={defaultSecretariaId}
        defaultConvenioId={defaultConvenioId}
      />
    </div>
  )
}
