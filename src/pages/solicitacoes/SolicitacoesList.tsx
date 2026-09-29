import { useState, useEffect, useMemo } from 'react'
import { Card as UICard, CardContent as UICardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { formatDateBR } from '@/components/StatusBadge'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  getSolicitacoes,
  getProjetos,
  updateSolicitacao,
  deleteSolicitacao,
  getOrganizacaoConfig,
} from '@/services/api'
import { exportarSolicitacoesPdf, imprimirSolicitacoes } from '@/services/exportSolicitacoes'
import { ModalSolicitacao } from '@/components/ModalSolicitacao'
import type {
  SolicitacaoRecord,
  SolicitacaoStatus,
  SolicitacaoPrioridade,
  SolicitacaoTipo,
  ProjetoRecord,
  OrganizacaoConfigRecord,
} from '@/types'
import {
  Plus,
  Search,
  Filter,
  FileDown,
  Printer,
  LayoutList,
  Kanban as KanbanIcon,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Calendar,
  Building2,
  FolderKanban,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Paperclip,
  Download,
  Eye,
  User,
} from 'lucide-react'

const KANBAN_COLUMNS: {
  status: SolicitacaoStatus
  title: string
  color: string
  border: string
  bg: string
}[] = [
  {
    status: 'Aberta',
    title: 'Aberta',
    color: 'text-amber-700',
    border: 'border-amber-200',
    bg: 'bg-amber-50/50',
  },
  {
    status: 'Em Análise',
    title: 'Em Análise',
    color: 'text-blue-700',
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
  },
  {
    status: 'Em Andamento',
    title: 'Em Andamento',
    color: 'text-emerald-700',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50',
  },
  {
    status: 'Aguardando Terceiro',
    title: 'Aguardando Terceiro',
    color: 'text-purple-700',
    border: 'border-purple-200',
    bg: 'bg-purple-50/50',
  },
  {
    status: 'Concluída',
    title: 'Concluída',
    color: 'text-slate-700',
    border: 'border-slate-200',
    bg: 'bg-slate-50/60',
  },
  {
    status: 'Cancelada',
    title: 'Cancelada',
    color: 'text-rose-700',
    border: 'border-rose-200',
    bg: 'bg-rose-50/50',
  },
]

export default function SolicitacoesList() {
  const { user } = useAuth()
  const canEdit = user?.role !== 'leitura'

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRecord[]>([])
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [orgConfig, setOrgConfig] = useState<OrganizacaoConfigRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // View Mode: 'list' ou 'kanban' persistido no localStorage
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    return (localStorage.getItem('solicitacoes_view_mode') as 'list' | 'kanban') || 'list'
  })

  // Filtros
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroProjeto, setFiltroProjeto] = useState<string>('todos')

  // Modais
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSolicitacao, setEditingSolicitacao] = useState<SolicitacaoRecord | null>(null)
  const [detalheModalOpen, setDetalheModalOpen] = useState(false)
  const [viewingSolicitacao, setViewingSolicitacao] = useState<SolicitacaoRecord | null>(null)

  // Modal rápido de conclusão ao arrastar ou clicar em "Concluir"
  const [concluirModalOpen, setConcluirModalOpen] = useState(false)
  const [solicitacaoToConcluir, setSolicitacaoToConcluir] = useState<SolicitacaoRecord | null>(null)
  const [providenciaTexto, setProvidenciaTexto] = useState('')

  // Drag & drop HTML5 nativo
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sList, pList, cfg] = await Promise.all([
        getSolicitacoes(),
        getProjetos(),
        getOrganizacaoConfig(),
      ])
      setSolicitacoes(sList)
      setProjetos(pList)
      setOrgConfig(cfg)
    } catch {
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as solicitações.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleView = (mode: 'list' | 'kanban') => {
    setViewMode(mode)
    localStorage.setItem('solicitacoes_view_mode', mode)
  }

  const isAtrasada = (s: SolicitacaoRecord): boolean => {
    if (!s.prazo || s.status === 'Concluída' || s.status === 'Cancelada') return false
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dt = new Date(s.prazo)
    return dt < hoje
  }

  // Filtragem e ordenação (Urgentes e atrasadas primeiro)
  const filteredSolicitacoes = useMemo(() => {
    const q = busca.toLowerCase().trim()

    const list = solicitacoes.filter((s) => {
      if (filtroStatus !== 'todos' && s.status !== filtroStatus) return false
      if (filtroPrioridade !== 'todas' && s.prioridade !== filtroPrioridade) return false
      if (filtroTipo !== 'todos' && s.tipo !== filtroTipo) return false
      if (filtroProjeto !== 'todos') {
        if (filtroProjeto === 'geral' && s.projeto) return false
        if (filtroProjeto !== 'geral' && s.projeto !== filtroProjeto) return false
      }

      if (q) {
        const matchesTitulo = s.titulo.toLowerCase().includes(q)
        const matchesDesc = (s.descricao || '').toLowerCase().includes(q)
        const matchesResp = (s.responsavel || '').toLowerCase().includes(q)
        const matchesSolicitante = (s.solicitante || '').toLowerCase().includes(q)
        const matchesProj = (s.expand?.projeto?.nome || '').toLowerCase().includes(q)
        if (!matchesTitulo && !matchesDesc && !matchesResp && !matchesSolicitante && !matchesProj)
          return false
      }

      return true
    })

    // Ordenação:
    // 1. Não concluídas/canceladas primeiro
    // 2. Atrasadas primeiro
    // 3. Prioridade Urgente > Alta > Média > Baixa
    // 4. Menor data de prazo
    const prioridadePeso: Record<SolicitacaoPrioridade, number> = {
      Urgente: 4,
      Alta: 3,
      Média: 2,
      Baixa: 1,
    }

    return list.sort((a, b) => {
      const aFinalizada = a.status === 'Concluída' || a.status === 'Cancelada'
      const bFinalizada = b.status === 'Concluída' || b.status === 'Cancelada'
      if (aFinalizada !== bFinalizada) return aFinalizada ? 1 : -1

      const aAtraso = isAtrasada(a)
      const bAtraso = isAtrasada(b)
      if (aAtraso !== bAtraso) return aAtraso ? -1 : 1

      const pA = prioridadePeso[a.prioridade] || 0
      const pB = prioridadePeso[b.prioridade] || 0
      if (pA !== pB) return pB - pA

      if (a.prazo && b.prazo) {
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime()
      }
      if (a.prazo) return -1
      if (b.prazo) return 1

      return new Date(b.created).getTime() - new Date(a.created).getTime()
    })
  }, [solicitacoes, busca, filtroStatus, filtroPrioridade, filtroTipo, filtroProjeto])

  // KPIs
  const totalAbertas = useMemo(() => {
    return solicitacoes.filter((s) => s.status !== 'Concluída' && s.status !== 'Cancelada').length
  }, [solicitacoes])

  const totalEmAndamento = useMemo(() => {
    return solicitacoes.filter((s) => s.status === 'Em Andamento').length
  }, [solicitacoes])

  const totalUrgentesAtraso = useMemo(() => {
    return solicitacoes.filter(
      (s) => isAtrasada(s) && (s.prioridade === 'Urgente' || s.prioridade === 'Alta'),
    ).length
  }, [solicitacoes])

  const totalConcluidasMes = useMemo(() => {
    const agora = new Date()
    const mesAtual = agora.getMonth()
    const anoAtual = agora.getFullYear()

    return solicitacoes.filter((s) => {
      if (s.status !== 'Concluída') return false
      const dt = new Date(s.updated || s.created)
      return dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual
    }).length
  }, [solicitacoes])

  // Ações de alteração de status
  const handleUpdateStatus = async (
    id: string,
    novoStatus: SolicitacaoStatus,
    providencia?: string,
  ) => {
    try {
      const payload: Partial<SolicitacaoRecord> = { status: novoStatus }
      if (providencia !== undefined) {
        payload.conclusao = providencia
      }
      const updated = await updateSolicitacao(id, payload)
      setSolicitacoes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)))
      toast({
        title: 'Status atualizado',
        description: `Solicitação alterada para "${novoStatus}".`,
      })
    } catch {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível alterar o status da solicitação.',
        variant: 'destructive',
      })
    }
  }

  // Drag & drop handlers nativos HTML5
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canEdit) return
    e.dataTransfer.setData('text/plain', id)
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent, colStatus: string) => {
    if (!canEdit) return
    e.preventDefault()
    setDragOverCol(colStatus)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: SolicitacaoStatus) => {
    e.preventDefault()
    setDragOverCol(null)
    const id = e.dataTransfer.getData('text/plain') || draggedId
    setDraggedId(null)
    if (!id || !canEdit) return

    const item = solicitacoes.find((s) => s.id === id)
    if (!item || item.status === targetStatus) return

    if (targetStatus === 'Concluída') {
      setSolicitacaoToConcluir(item)
      setProvidenciaTexto(item.conclusao || '')
      setConcluirModalOpen(true)
      return
    }

    await handleUpdateStatus(id, targetStatus)
  }

  const handleConfirmConclusao = async () => {
    if (!solicitacaoToConcluir) return
    if (!providenciaTexto.trim()) {
      toast({
        title: 'Providência obrigatória',
        description: 'Por favor, informe a providência tomada para concluir este item.',
        variant: 'destructive',
      })
      return
    }

    await handleUpdateStatus(solicitacaoToConcluir.id, 'Concluída', providenciaTexto.trim())
    setConcluirModalOpen(false)
    setSolicitacaoToConcluir(null)
    setProvidenciaTexto('')
  }

  const handleDelete = async (id: string, titulo: string) => {
    if (!canEdit) return
    if (!confirm(`Deseja realmente excluir a solicitação "${titulo}"?`)) return

    try {
      await deleteSolicitacao(id)
      setSolicitacoes((prev) => prev.filter((s) => s.id !== id))
      toast({
        title: 'Registro excluído',
        description: 'A solicitação foi removida com sucesso.',
      })
    } catch {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o registro.',
        variant: 'destructive',
      })
    }
  }

  // Badges estilizados
  const getPrioridadeBadge = (prioridade: SolicitacaoPrioridade) => {
    switch (prioridade) {
      case 'Urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            Urgente
          </span>
        )
      case 'Alta':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Alta
          </span>
        )
      case 'Média':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Média
          </span>
        )
      case 'Baixa':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Baixa
          </span>
        )
    }
  }

  const getTipoBadge = (tipo: SolicitacaoTipo) => {
    switch (tipo) {
      case 'Pendência Financeira':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            Financeira
          </span>
        )
      case 'Pendência':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Pendência
          </span>
        )
      case 'Solicitação':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Solicitação
          </span>
        )
      case 'Documentação':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            Documentação
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200">
            Outro
          </span>
        )
    }
  }

  const getStatusBadge = (status: SolicitacaoStatus) => {
    switch (status) {
      case 'Aberta':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Aberta
          </span>
        )
      case 'Em Análise':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Em Análise
          </span>
        )
      case 'Em Andamento':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Em Andamento
          </span>
        )
      case 'Aguardando Terceiro':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Aguardando Terceiro
          </span>
        )
      case 'Concluída':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Concluída
          </span>
        )
      case 'Cancelada':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight">
            Solicitações & Pendências
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Acompanhamento de demandas, providências e pendências operacionais dos projetos de
            trabalho.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Alternador de visualização: Lista / Kanban */}
          <div className="inline-flex items-center bg-white border border-[#E2E8F0] p-1 rounded-lg shadow-sm">
            <button
              type="button"
              onClick={() => handleToggleView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#1FAF7A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => handleToggleView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#1FAF7A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              Kanban
            </button>
          </div>

          {/* Exportações */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportarSolicitacoesPdf({
                solicitacoes: filteredSolicitacoes,
                filtroBusca: busca,
                filtroStatus,
                filtroPrioridade,
                filtroTipo,
                filtroProjeto,
                orgConfig,
              })
            }
            className="text-xs font-semibold border-[#CBD5E1] text-[#475569] hover:bg-slate-50 bg-white shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-[#1FAF7A]" />
            PDF
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              imprimirSolicitacoes({
                solicitacoes: filteredSolicitacoes,
                filtroBusca: busca,
                filtroStatus,
                filtroPrioridade,
                filtroTipo,
                filtroProjeto,
                orgConfig,
              })
            }
            className="text-xs font-semibold border-[#CBD5E1] text-[#475569] hover:bg-slate-50 bg-white shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-[#64748B]" />
            Imprimir
          </Button>

          {/* Botão Novo Registro */}
          {canEdit && (
            <Button
              size="sm"
              onClick={() => {
                setEditingSolicitacao(null)
                setModalOpen(true)
              }}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm shadow-[#1FAF7A]/25"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Solicitação
            </Button>
          )}
        </div>
      </div>

      {/* Cards de KPI no topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Abertas */}
        <UICard className="border-[#E2E8F0] shadow-sm">
          <UICardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Abertas
              </span>
              <p className="text-2xl font-bold text-[#1E293B] mt-1 tabular-nums">{totalAbertas}</p>
              <span className="text-[11px] text-[#94A3B8]">Demandas não finalizadas</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
          </UICardContent>
        </UICard>

        {/* KPI 2: Em Andamento */}
        <UICard className="border-[#E2E8F0] shadow-sm">
          <UICardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Em Andamento
              </span>
              <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {totalEmAndamento}
              </p>
              <span className="text-[11px] text-[#94A3B8]">Em execução ativa</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1FAF7A] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </UICardContent>
        </UICard>

        {/* KPI 3: Urgentes em Atraso */}
        <UICard className="border-[#E2E8F0] shadow-sm">
          <UICardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                Urgentes em Atraso
              </span>
              <p className="text-2xl font-bold text-rose-600 mt-1 tabular-nums">
                {totalUrgentesAtraso}
              </p>
              <span className="text-[11px] text-rose-500 font-medium">Prazo expirado</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </UICardContent>
        </UICard>

        {/* KPI 4: Concluídas no Mês */}
        <UICard className="border-[#E2E8F0] shadow-sm">
          <UICardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Concluídas no Mês
              </span>
              <p className="text-2xl font-bold text-[#1E293B] mt-1 tabular-nums">
                {totalConcluidasMes}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">Entregas registradas</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </UICardContent>
        </UICard>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Busca textual */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              placeholder="Buscar por título, descrição, responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 text-xs border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
            />
          </div>

          {/* Filtro Status */}
          <div className="md:col-span-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="text-xs border-[#CBD5E1]">
                <SelectValue placeholder="Status: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Status: Todos</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Aguardando Terceiro">Aguardando Terceiro</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Prioridade */}
          <div className="md:col-span-2">
            <Select value={filtroPrioridade} onValueChange={setFiltroPrioridade}>
              <SelectTrigger className="text-xs border-[#CBD5E1]">
                <SelectValue placeholder="Prioridade: Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Prioridade: Todas</SelectItem>
                <SelectItem value="Urgente">Urgente</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Tipo */}
          <div className="md:col-span-2">
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="text-xs border-[#CBD5E1]">
                <SelectValue placeholder="Tipo: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Tipo: Todos</SelectItem>
                <SelectItem value="Solicitação">Solicitação</SelectItem>
                <SelectItem value="Pendência">Pendência</SelectItem>
                <SelectItem value="Pendência Financeira">Pendência Financeira</SelectItem>
                <SelectItem value="Documentação">Documentação</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Projeto */}
          <div className="md:col-span-2">
            <Select value={filtroProjeto} onValueChange={setFiltroProjeto}>
              <SelectTrigger className="text-xs border-[#CBD5E1]">
                <SelectValue placeholder="Projeto: Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Projeto: Todos</SelectItem>
                <SelectItem value="geral">Geral / Não vinculado</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Conteúdo: Visualização LISTA ou KANBAN */}
      {viewMode === 'list' ? (
        /* VISUALIZAÇÃO A: TABELA / LISTA */
        <UICard className="border-[#E2E8F0] shadow-sm overflow-hidden">
          <UICardContent className="p-0">
            {filteredSolicitacoes.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-[#94A3B8]">
                  <ListTodo className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Nenhuma solicitação ou pendência encontrada
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Tente ajustar os filtros ou cadastre um novo registro para acompanhamento.
                  </p>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingSolicitacao(null)
                      setModalOpen(true)
                    }}
                    className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold mt-2"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Criar Primeira Solicitação
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                      <th className="py-3 px-4">Título & Descrição</th>
                      <th className="py-3 px-3">Solicitante</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Prioridade</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Responsável</th>
                      <th className="py-3 px-3">Projeto / Secretaria</th>
                      <th className="py-3 px-3">Data / Prazo</th>
                      <th className="py-3 px-3 text-center">Anexo</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredSolicitacoes.map((s) => {
                      const atrasada = isAtrasada(s)
                      const dtSol = s.data_solicitacao || s.created
                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => {
                            if (canEdit) {
                              setEditingSolicitacao(s)
                              setModalOpen(true)
                            } else {
                              setViewingSolicitacao(s)
                              setDetalheModalOpen(true)
                            }
                          }}
                        >
                          <td className="py-3 px-4 max-w-sm">
                            <span className="font-bold text-[#1E293B] block group-hover:text-[#1FAF7A] transition-colors">
                              {s.titulo}
                            </span>
                            {s.descricao && (
                              <p className="text-[11px] text-[#64748B] line-clamp-2 mt-0.5 leading-relaxed">
                                {s.descricao}
                              </p>
                            )}
                            {s.conclusao && (
                              <div className="mt-1.5 p-1.5 rounded bg-emerald-50 text-[10px] text-emerald-800 border border-emerald-200">
                                <span className="font-semibold">Providência:</span> {s.conclusao}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {s.solicitante ? (
                              <div className="flex items-center gap-1.5 text-[#1E293B] font-medium">
                                <User className="w-3 h-3 text-[#94A3B8]" />
                                <span>{s.solicitante}</span>
                              </div>
                            ) : (
                              <span className="text-[#94A3B8]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">{getTipoBadge(s.tipo)}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getPrioridadeBadge(s.prioridade)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getStatusBadge(s.status)}
                          </td>
                          <td className="py-3 px-3 text-[#475569] font-medium whitespace-nowrap">
                            {s.responsavel || '—'}
                          </td>
                          <td className="py-3 px-3 text-[#475569]">
                            {s.expand?.projeto ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#1E293B] line-clamp-1">
                                  {s.expand.projeto.nome}
                                </span>
                                {s.expand?.secretaria && (
                                  <span className="text-[10px] text-[#94A3B8] line-clamp-1">
                                    {s.expand.secretaria.nome}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#94A3B8] italic">Geral / Não vinculado</span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              {dtSol && (
                                <span className="text-[11px] text-[#64748B]">
                                  Sol: {formatDateBR(dtSol)}
                                </span>
                              )}
                              {s.prazo ? (
                                <span
                                  className={`font-semibold ${
                                    atrasada ? 'text-rose-600 font-bold' : 'text-[#475569]'
                                  }`}
                                >
                                  Prazo: {formatDateBR(s.prazo)}
                                  {atrasada && (
                                    <span className="block text-[10px] font-bold text-rose-600">
                                      Em atraso
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#94A3B8]">Sem prazo</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {s.anexo ? (
                              <a
                                href={`/api/files/solicitacoes/${s.id}/${s.anexo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-[#1FAF7A] hover:bg-emerald-100 hover:text-emerald-800 font-medium text-[11px] transition-colors border border-emerald-200"
                                title={`Abrir/baixar anexo: ${s.anexo}`}
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                <span>Anexo</span>
                              </a>
                            ) : (
                              <span className="text-[#CBD5E1]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setViewingSolicitacao(s)
                                  setDetalheModalOpen(true)
                                }}
                                className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                title="Visualizar Detalhes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              {canEdit && s.status !== 'Concluída' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSolicitacaoToConcluir(s)
                                    setProvidenciaTexto(s.conclusao || '')
                                    setConcluirModalOpen(true)
                                  }}
                                  className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  title="Concluir Solicitação"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              {canEdit && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingSolicitacao(s)
                                      setModalOpen(true)
                                    }}
                                    className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(s.id, s.titulo)}
                                    className="h-7 w-7 p-0 text-[#64748B] hover:text-rose-600"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </UICardContent>
        </UICard>
      ) : (
        /* VISUALIZAÇÃO B: QUADRO KANBAN ARRASTÁVEL COM HTML5 NATIVO */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colItems = filteredSolicitacoes.filter((s) => s.status === col.status)
            const isTarget = dragOverCol === col.status

            return (
              <div
                key={col.status}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.status)}
                className={`flex flex-col rounded-xl border ${col.border} ${col.bg} p-3 min-h-[480px] transition-all duration-150 ${
                  isTarget ? 'ring-2 ring-[#1FAF7A] bg-emerald-50/60 scale-[1.01]' : ''
                }`}
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-black/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                      {col.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#475569] shadow-2xs border border-black/5">
                    {colItems.length}
                  </span>
                </div>

                {/* Lista de Cards da Coluna */}
                <div className="flex-1 space-y-2.5 overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border-2 border-dashed border-black/10 rounded-lg text-center p-2 text-[11px] text-[#94A3B8]">
                      Nenhum item nesta coluna
                    </div>
                  ) : (
                    colItems.map((item) => {
                      const atrasada = isAtrasada(item)

                      return (
                        <div
                          key={item.id}
                          draggable={canEdit}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onClick={() => {
                            if (canEdit) {
                              setEditingSolicitacao(item)
                              setModalOpen(true)
                            }
                          }}
                          className={`bg-white rounded-lg p-3 border border-[#E2E8F0] shadow-xs hover:shadow-md transition-all cursor-pointer group relative ${
                            draggedId === item.id ? 'opacity-40 scale-95' : ''
                          }`}
                        >
                          {/* Badges superiores: Tipo & Prioridade */}
                          <div className="flex items-center justify-between gap-1.5 mb-2">
                            {getTipoBadge(item.tipo)}
                            <div className="flex items-center gap-1">
                              {item.anexo && (
                                <a
                                  href={`/api/files/solicitacoes/${item.id}/${item.anexo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[#1FAF7A] hover:text-emerald-700 p-0.5"
                                  title={`Anexo: ${item.anexo}`}
                                >
                                  <Paperclip className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {getPrioridadeBadge(item.prioridade)}
                            </div>
                          </div>

                          {/* Título */}
                          <h4 className="text-xs font-bold text-[#1E293B] group-hover:text-[#1FAF7A] transition-colors leading-snug">
                            {item.titulo}
                          </h4>

                          {/* Descrição resumida */}
                          {item.descricao && (
                            <p className="text-[11px] text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                              {item.descricao}
                            </p>
                          )}

                          {/* Solicitante se preenchido */}
                          {item.solicitante && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-[#475569]">
                              <User className="w-3 h-3 text-[#94A3B8] shrink-0" />
                              <span className="truncate">
                                Solicitante:{' '}
                                <strong className="font-semibold text-[#1E293B]">
                                  {item.solicitante}
                                </strong>
                              </span>
                            </div>
                          )}

                          {/* Projeto Vinculado */}
                          {item.expand?.projeto && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-[#475569] font-medium">
                              <FolderKanban className="w-3 h-3 text-[#1FAF7A] shrink-0" />
                              <span className="truncate">{item.expand.projeto.nome}</span>
                            </div>
                          )}

                          {/* Rodapé do card: Prazo & Responsável */}
                          <div className="mt-2 pt-1.5 flex items-center justify-between text-[10px] text-[#64748B]">
                            <span className="truncate font-medium">
                              Resp: {item.responsavel ? item.responsavel.split(' ')[0] : '—'}
                            </span>

                            {item.prazo && (
                              <span
                                className={`inline-flex items-center gap-1 font-semibold ${
                                  atrasada ? 'text-rose-600 font-bold' : 'text-[#64748B]'
                                }`}
                              >
                                <Calendar className="w-3 h-3" />
                                {formatDateBR(item.prazo)}
                              </span>
                            )}
                          </div>

                          {/* Conclusão/Providência se houver */}
                          {item.conclusao && (
                            <div className="mt-2 p-1.5 rounded bg-emerald-50 text-[10px] text-emerald-800 border border-emerald-200 line-clamp-2">
                              ✓ {item.conclusao}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Principal de Cadastro / Edição */}
      <ModalSolicitacao
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        solicitacaoToEdit={editingSolicitacao}
      />

      {/* Modal de Visualização de Detalhe (Leitura ou Consulta Completa) */}
      <Dialog open={detalheModalOpen} onOpenChange={(v) => !v && setDetalheModalOpen(false)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E293B] flex items-center gap-2">
              Detalhes da Solicitação
            </DialogTitle>
          </DialogHeader>

          {viewingSolicitacao && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Título</span>
                <h3 className="text-sm font-bold text-[#1E293B] mt-0.5">
                  {viewingSolicitacao.titulo}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] text-[#64748B] block">Tipo</span>
                  <div className="mt-1">{getTipoBadge(viewingSolicitacao.tipo)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Prioridade</span>
                  <div className="mt-1">{getPrioridadeBadge(viewingSolicitacao.prioridade)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Status</span>
                  <div className="mt-1">{getStatusBadge(viewingSolicitacao.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Prazo</span>
                  <span className="font-semibold text-[#1E293B] block mt-1">
                    {viewingSolicitacao.prazo ? formatDateBR(viewingSolicitacao.prazo) : '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-[10px] text-[#64748B] block">Solicitante</span>
                  <span className="font-medium text-[#1E293B]">
                    {viewingSolicitacao.solicitante || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Data da Solicitação</span>
                  <span className="font-medium text-[#1E293B]">
                    {viewingSolicitacao.data_solicitacao
                      ? formatDateBR(viewingSolicitacao.data_solicitacao)
                      : viewingSolicitacao.created
                        ? formatDateBR(viewingSolicitacao.created)
                        : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Responsável</span>
                  <span className="font-medium text-[#1E293B]">
                    {viewingSolicitacao.responsavel || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] block">Projeto / Secretaria</span>
                  <span className="font-medium text-[#1E293B]">
                    {viewingSolicitacao.expand?.projeto?.nome || 'Geral / Não vinculado'}
                    {viewingSolicitacao.expand?.secretaria &&
                      ` (${viewingSolicitacao.expand.secretaria.nome})`}
                  </span>
                </div>
              </div>

              {viewingSolicitacao.descricao && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block font-semibold mb-1">
                    Detalhamento / Contexto
                  </span>
                  <p className="p-2.5 rounded bg-slate-50 text-[#334155] leading-relaxed whitespace-pre-wrap">
                    {viewingSolicitacao.descricao}
                  </p>
                </div>
              )}

              {/* Anexo no Detalhe */}
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-[10px] text-[#64748B] block font-semibold mb-1">
                  Arquivo Anexo
                </span>
                {viewingSolicitacao.anexo ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-emerald-900 truncate">
                        {viewingSolicitacao.anexo}
                      </span>
                    </div>
                    <a
                      href={`/api/files/solicitacoes/${viewingSolicitacao.id}/${viewingSolicitacao.anexo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-xs shrink-0 ml-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar / Abrir
                    </a>
                  </div>
                ) : (
                  <p className="text-[#94A3B8] italic">
                    Nenhum arquivo anexado a esta solicitação.
                  </p>
                )}
              </div>

              {viewingSolicitacao.conclusao && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="font-bold block mb-1">Providência / Conclusão Registrada:</span>
                  <p className="leading-relaxed whitespace-pre-wrap">
                    {viewingSolicitacao.conclusao}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDetalheModalOpen(false)}
              className="text-xs"
            >
              Fechar
            </Button>
            {canEdit && viewingSolicitacao && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setDetalheModalOpen(false)
                  setEditingSolicitacao(viewingSolicitacao)
                  setModalOpen(true)
                }}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Editar Solicitação
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Rápido de Conclusão / Providência Adotada */}
      <Dialog open={concluirModalOpen} onOpenChange={(v) => !v && setConcluirModalOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E293B] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Concluir Solicitação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-[#64748B]">
              Para finalizar o item{' '}
              <strong className="text-[#1E293B]">
                &ldquo;{solicitacaoToConcluir?.titulo}&rdquo;
              </strong>
              , informe a providência ou conclusão adotada:
            </p>

            <Textarea
              rows={3}
              placeholder="Ex: Documentação protocolada junto à prefeitura sob nº 1234/2026..."
              value={providenciaTexto}
              onChange={(e) => setProvidenciaTexto(e.target.value)}
              className="text-xs border-[#CBD5E1] focus-visible:ring-emerald-500"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConcluirModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmConclusao}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
            >
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
