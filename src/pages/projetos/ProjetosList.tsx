import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
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
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
import { useRealtime } from '@/hooks/use-realtime'
import type { ProjetoRecord, ProjetoStatus } from '@/types'

export default function ProjetosList() {
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProjeto, setEditingProjeto] = useState<ProjetoRecord | null>(null)
  const [loading, setLoading] = useState(true)

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
      setModalOpen(true)
    }
    window.addEventListener('open-modal-novo-projeto', handleOpenModal)
    return () => {
      window.removeEventListener('open-modal-novo-projeto', handleOpenModal)
    }
  }, [])

  useRealtime('projetos', () => fetchProjetos())

  const filteredProjetos = useMemo(() => {
    return projetos.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.parceiro && p.parceiro.toLowerCase().includes(search.toLowerCase()))
      const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projetos, search, statusFilter])

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

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Projetos & Iniciativas Sociais</h2>
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

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou parceiro..."
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

      {/* Projects Grid (3 colunas desktop, 2 tablet, 1 mobile) */}
      {filteredProjetos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-8">
          <FolderKanban className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#1E293B]">Nenhum projeto encontrado</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Não foram localizados projetos com os filtros atuais. Crie um novo projeto para começar.
          </p>
          <Button
            onClick={() => {
              setEditingProjeto(null)
              setModalOpen(true)
            }}
            className="mt-4 bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar Projeto
          </Button>
        </div>
      ) : (
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

                {proj.parceiro && (
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span className="truncate">{proj.parceiro}</span>
                  </div>
                )}

                {proj.descricao && (
                  <p className="text-xs text-[#64748B] mt-2.5 line-clamp-2">{proj.descricao}</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#64748B] font-medium">Execução do Projeto</span>
                    <span className="font-bold text-[#1E293B] tabular-nums">
                      {proj.progresso || 0}%
                    </span>
                  </div>
                  <Progress value={proj.progresso || 0} className="h-2" />
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
      )}

      {/* Creation/Edit Modal */}
      <ModalProjeto
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchProjetos}
        projetoToEdit={editingProjeto}
      />
    </div>
  )
}
