import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users2,
  Plus,
  Search,
  Filter,
  FileSignature,
  Edit2,
  ExternalLink,
  Briefcase,
  Calendar,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalContrato } from '@/components/ModalContrato'
import { getContratos } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type { ContratoRecord, ContratoTipo } from '@/types'

export default function ContratosList() {
  const [contratos, setContratos] = useState<ContratoRecord[]>([])
  const [activeTab, setActiveTab] = useState<ContratoTipo>('CLT')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContrato, setEditingContrato] = useState<ContratoRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchContratos = async () => {
    try {
      const data = await getContratos()
      setContratos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContratos()
  }, [])

  useRealtime('contratos', () => fetchContratos())

  const filteredContratos = useMemo(() => {
    return contratos.filter((c) => {
      const matchType = c.tipo === activeTab
      const matchSearch =
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        c.cargo_funcao.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'todos' || c.status === statusFilter
      return matchType && matchSearch && matchStatus
    })
  }, [contratos, activeTab, search, statusFilter])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Gestão de Contratos (CLT & PJ)</h2>
          <p className="text-xs text-[#64748B]">
            Administração de contratos formais de trabalho, prestadores de serviços e controle de
            vigência.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
            <Link to="/contratos/novo/elaborar">
              <FileSignature className="w-4 h-4 mr-1.5 text-[#1FAF7A]" />
              Elaborador de Contrato (Wizard)
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingContrato(null)
              setModalOpen(true)
            }}
            className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs shadow-md shadow-[#1FAF7A]/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Tabs CLT / PJ */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as ContratoTipo)}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-white border border-[#E2E8F0] p-1 h-11 rounded-lg w-full sm:w-auto">
            <TabsTrigger
              value="CLT"
              className="text-xs font-semibold px-6 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
            >
              Colaboradores CLT ({contratos.filter((c) => c.tipo === 'CLT').length})
            </TabsTrigger>
            <TabsTrigger
              value="PJ"
              className="text-xs font-semibold px-6 data-[state=active]:bg-[#1FAF7A] data-[state=active]:text-white"
            >
              Prestadores PJ ({contratos.filter((c) => c.tipo === 'PJ').length})
            </TabsTrigger>
          </TabsList>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por titular ou cargo..."
                className="pl-8 text-xs h-9 bg-white"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 text-xs h-9 bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="vencendo">Vencendo</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CONTENT CLT */}
        <TabsContent value="CLT">
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {filteredContratos.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#1FAF7A] flex items-center justify-center mx-auto">
                    <Users2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Nenhum colaborador CLT cadastrado
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Cadastre os profissionais em regime CLT vinculados aos planos de trabalho e
                    projetos da entidade.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingContrato(null)
                      setModalOpen(true)
                    }}
                    className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Cadastrar Colaborador CLT
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                        <th className="py-3 px-4">Colaborador</th>
                        <th className="py-3 px-4">Cargo Registrado</th>
                        <th className="py-3 px-4">Salário Base</th>
                        <th className="py-3 px-4">Benefícios</th>
                        <th className="py-3 px-4">Início</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredContratos.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#1E293B]">
                            <Link to={`/contratos/${c.id}`} className="hover:text-[#1FAF7A]">
                              {c.nome}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-[#475569]">{c.cargo_funcao}</td>
                          <td className="py-3 px-4 font-bold text-[#1E293B] tabular-nums">
                            {formatBRL(c.valor)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {c.beneficios && c.beneficios.length > 0 ? (
                                c.beneficios.map((b) => (
                                  <span
                                    key={b}
                                    className="text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded text-slate-700"
                                  >
                                    {b}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[#94A3B8]">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {formatDateBR(c.data_inicio)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingContrato(c)
                                  setModalOpen(true)
                                }}
                                className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                title="Editar Contrato"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-[#1FAF7A]"
                              >
                                <Link to={`/contratos/${c.id}`}>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
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

        {/* CONTENT PJ */}
        <TabsContent value="PJ">
          <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {filteredContratos.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#1E293B]">
                    Nenhum prestador PJ cadastrado
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Cadastre prestadores de serviço pessoa jurídica (médicos, instrutores,
                    consultorias e assessorias técnicas).
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingContrato(null)
                      setModalOpen(true)
                    }}
                    className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Cadastrar Prestador PJ
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                        <th className="py-3 px-4">Prestador PJ</th>
                        <th className="py-3 px-4">Função Técnica</th>
                        <th className="py-3 px-4">Modalidade</th>
                        <th className="py-3 px-4">Valor</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {filteredContratos.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#1E293B]">
                            <Link to={`/contratos/${c.id}`} className="hover:text-[#1FAF7A]">
                              {c.nome}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-[#475569]">{c.cargo_funcao}</td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {c.tipo_pj === 'horas' ? 'Por Hora' : 'Fixo Mensal'}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1E293B] tabular-nums">
                            {c.tipo_pj === 'horas'
                              ? `${formatBRL(c.valor)}/hora`
                              : formatBRL(c.valor)}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">{formatDateBR(c.data_fim)}</td>
                          <td className="py-3 px-4">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingContrato(c)
                                  setModalOpen(true)
                                }}
                                className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                asChild
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-[#1FAF7A]"
                              >
                                <Link to={`/contratos/${c.id}`}>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
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
      </Tabs>

      {/* Modal Contrato (Create/Edit) */}
      <ModalContrato
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchContratos}
        contratoToEdit={editingContrato}
        defaultTipo={activeTab}
      />
    </div>
  )
}
