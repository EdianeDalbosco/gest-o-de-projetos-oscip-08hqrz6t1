import React, { useState, useEffect, useMemo } from 'react'
import {
  Users2,
  Building,
  User,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
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
import { formatBRL } from '@/components/StatusBadge'
import { getPrestadoresColaboradores, deletePrestadorColaborador } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { ModalPrestador } from '@/components/ModalPrestador'
import { ModalImportarPrestadores } from '@/components/ModalImportarPrestadores'
import type { PrestadorColaboradorRecord, PrestadorTipo } from '@/types'

export default function PrestadoresList() {
  const [prestadores, setPrestadores] = useState<PrestadorColaboradorRecord[]>([])
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImportarOpen, setModalImportarOpen] = useState(false)
  const [prestadorToEdit, setPrestadorToEdit] = useState<PrestadorColaboradorRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const data = await getPrestadoresColaboradores()
      setPrestadores(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useRealtime('prestadores_colaboradores', () => fetchData())

  const filtered = useMemo(() => {
    return prestadores.filter((p) => {
      const q = search.toLowerCase()
      const matchSearch =
        (p.tipo === 'PJ' &&
          ((p.razao_social && p.razao_social.toLowerCase().includes(q)) ||
            (p.cnpj && p.cnpj.toLowerCase().includes(q)) ||
            (p.profissional && p.profissional.toLowerCase().includes(q)) ||
            (p.cargo && p.cargo.toLowerCase().includes(q)))) ||
        (p.tipo === 'CLT' &&
          ((p.nome_colaborador && p.nome_colaborador.toLowerCase().includes(q)) ||
            (p.cpf_colaborador && p.cpf_colaborador.toLowerCase().includes(q)) ||
            (p.cargo && p.cargo.toLowerCase().includes(q))))

      const matchTipo = tipoFilter === 'todos' || p.tipo === tipoFilter
      return matchSearch && matchTipo
    })
  }, [prestadores, search, tipoFilter])

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Deseja excluir o cadastro de "${nome}"?`)) {
      try {
        await deletePrestadorColaborador(id)
        fetchData()
      } catch {
        alert('Erro ao excluir registro.')
      }
    }
  }

  const totalPJ = prestadores.filter((p) => p.tipo === 'PJ').length
  const totalCLT = prestadores.filter((p) => p.tipo === 'CLT').length

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">
            Prestadores de Serviço & Colaboradores
          </h2>
          <p className="text-xs text-[#64748B]">
            Cadastro centralizado de pessoas jurídicas (PJ) e trabalhadores celetistas (CLT)
            vinculados ao Termo de Parceria.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setModalImportarOpen(true)}
            className="text-xs sm:text-sm font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-50 bg-white shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-[#1FAF7A]" />
            Importar Planilha
          </Button>
          <Button
            onClick={() => {
              setPrestadorToEdit(null)
              setModalOpen(true)
            }}
            className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1FAF7A]/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Cadastro
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase">
                Total Cadastrado
              </span>
              <p className="text-2xl font-bold text-[#1E293B] mt-1 tabular-nums">
                {prestadores.length}
              </p>
              <span className="text-[11px] text-[#94A3B8]">Registros ativos no sistema</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Users2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase">Prestadores PJ</span>
              <p className="text-2xl font-bold text-sky-700 mt-1 tabular-nums">{totalPJ}</p>
              <span className="text-[11px] text-[#94A3B8]">Pessoas Jurídicas / Especialistas</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Building className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#64748B] uppercase">
                Colaboradores CLT
              </span>
              <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">{totalCLT}</p>
              <span className="text-[11px] text-[#94A3B8]">Vínculo Celetista Municipal</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#1FAF7A]">
              <User className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, razão social, CPF, CNPJ ou cargo..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#64748B] shrink-0" />
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs h-9">
              <SelectValue placeholder="Tipo de Vínculo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os vínculos</SelectItem>
              <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
              <SelectItem value="CLT">Empregado (CLT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Prestadores e CLTs */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#64748B]">Carregando cadastros...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#64748B] space-y-3 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#1E293B]">
                Nenhum prestador ou colaborador cadastrado
              </h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Cadastre profissionais PJ (médicos, empresas parceiras) ou colaboradores CLT para
                vincular ao Termo de Parceria e gerar faturamentos mensais.
              </p>
              <Button
                onClick={() => {
                  setPrestadorToEdit(null)
                  setModalOpen(true)
                }}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Cadastrar Primeiro Prestador/Colaborador
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Nome / Razão Social</th>
                    <th className="py-3 px-4">Documento (CPF / CNPJ)</th>
                    <th className="py-3 px-4">Profissional / Cargo</th>
                    <th className="py-3 px-4">Remuneração Base</th>
                    <th className="py-3 px-4">Setor / Situação</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filtered.map((p) => {
                    const isPJ = p.tipo === 'PJ'
                    const nomeExibicao = isPJ ? p.razao_social : p.nome_colaborador
                    const docExibicao = isPJ ? p.cnpj : p.cpf_colaborador
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPJ
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {p.tipo}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#1E293B]">
                          {nomeExibicao || '—'}
                          {isPJ && p.profissional && (
                            <span className="block text-[11px] font-normal text-[#64748B]">
                              Profissional: {p.profissional}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#475569]">{docExibicao || '—'}</td>
                        <td className="py-3 px-4 font-medium text-[#1E293B]">{p.cargo}</td>
                        <td className="py-3 px-4 font-semibold text-[#1E293B] tabular-nums">
                          {p.remuneracao_base ? formatBRL(p.remuneracao_base) : '—'}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {isPJ ? (
                            p.natureza_juridica || '—'
                          ) : (
                            <span>
                              {p.setor || '—'}
                              {p.situacao && (
                                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {p.situacao}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPrestadorToEdit(p)
                                setModalOpen(true)
                              }}
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                              title="Editar Cadastro"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(p.id, nomeExibicao || 'registro')}
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-red-600"
                              title="Excluir Cadastro"
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
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação / Edição */}
      <ModalPrestador
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchData}
        prestadorToEdit={prestadorToEdit}
      />

      {/* Modal de Importação via Excel */}
      <ModalImportarPrestadores
        open={modalImportarOpen}
        onClose={() => setModalImportarOpen(false)}
        onSuccess={fetchData}
        prestadoresExistentes={prestadores}
      />
    </div>
  )
}
