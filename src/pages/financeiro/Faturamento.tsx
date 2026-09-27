import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  FileSpreadsheet,
  Receipt,
  FileCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import {
  getFaturas,
  updateFatura,
  getFaturamentosMensais,
  updateFaturamentoMensal,
  deleteFaturamentoMensal,
} from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { ModalNovaFatura } from '@/components/ModalNovaFatura'
import { ModalNovoFaturamentoMensal } from '@/components/ModalNovoFaturamentoMensal'
import { RelatorioFaturamentoModal } from '@/components/RelatorioFaturamentoModal'
import type { FaturaRecord, FaturaStatus, FaturamentoMensalRecord } from '@/types'

export default function Faturamento() {
  const [faturamentosMensais, setFaturamentosMensais] = useState<FaturamentoMensalRecord[]>([])
  const [faturas, setFaturas] = useState<FaturaRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMensalOpen, setModalMensalOpen] = useState(false)
  const [viewFatura, setViewFatura] = useState<FaturaRecord | null>(null)
  const [viewFaturamentoMensal, setViewFaturamentoMensal] =
    useState<FaturamentoMensalRecord | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal para atualizar Nota Fiscal do faturamento mensal
  const [modalNFOpen, setModalNFOpen] = useState(false)
  const [faturamentoParaNF, setFaturamentoParaNF] = useState<FaturamentoMensalRecord | null>(null)
  const [numeroNFInput, setNumeroNFInput] = useState('')
  const [statusNFInput, setStatusNFInput] = useState<'aguardando_nf' | 'nf_emitida' | 'liquidado'>(
    'nf_emitida',
  )

  const handleSalvarNotaFiscal = async () => {
    if (!faturamentoParaNF) return
    try {
      await updateFaturamentoMensal(faturamentoParaNF.id, {
        numero_nf: numeroNFInput.trim() || undefined,
        status_nf: statusNFInput,
        data_emissao_nf: new Date().toISOString(),
      })
      setModalNFOpen(false)
      fetchFaturas()
    } catch {
      alert('Erro ao atualizar dados da Nota Fiscal.')
    }
  }

  const handleDeleteFatMensal = async (id: string, num: string) => {
    if (window.confirm(`Deseja excluir o faturamento mensal nº ${num}?`)) {
      try {
        await deleteFaturamentoMensal(id)
        fetchFaturas()
      } catch {
        alert('Erro ao excluir faturamento.')
      }
    }
  }

  const fetchFaturas = async () => {
    try {
      const [dataFaturas, dataMensais] = await Promise.all([getFaturas(), getFaturamentosMensais()])
      setFaturas(dataFaturas)
      setFaturamentosMensais(dataMensais)
    } catch (err) {
      console.error('Erro ao buscar faturas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaturas()
  }, [])

  useRealtime('faturas', () => fetchFaturas())
  useRealtime('faturamentos_mensais', () => fetchFaturas())

  const filteredFaturas = useMemo(() => {
    return faturas.filter((f) => {
      const matchSearch =
        f.numero.toLowerCase().includes(search.toLowerCase()) ||
        (f.expand?.projeto_id?.nome &&
          f.expand.projeto_id.nome.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = statusFilter === 'todos' || f.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [faturas, search, statusFilter])

  const handleMarkAsPaid = async (fatId: string) => {
    try {
      await updateFatura(fatId, { status: 'paga' })
      fetchFaturas()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDownloadFatura = (f: FaturaRecord) => {
    // Generate text document format
    const content = `================================================
ONG GESTÃO — COMPROVANTE DE FATURAMENTO / NOTA
================================================
Fatura Nº: ${f.numero}
Data de Emissão: ${formatDateBR(f.data_emissao)}
Data de Vencimento: ${formatDateBR(f.data_vencimento)}
Valor Nominal: ${formatBRL(f.valor)}
Status: ${f.status.toUpperCase()}
Forma de Pagamento: ${f.forma_pagamento || 'Boleto / Transferência'}

Projeto Vinculado: ${f.expand?.projeto_id?.nome || 'Institucional'}
Prestador / Favorecido: ${f.expand?.contrato_id?.nome || 'ONG Gestão Social'}

Este documento possui validade de controle orçamentário
para prestação de contas de parcerias e termos de fomento.
Emitido eletronicamente via Sistema ONG Gestão.
================================================`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Fatura_${f.numero}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalEmitidas = faturas
    .filter((f) => f.status === 'emitida')
    .reduce((s, f) => s + f.valor, 0)
  const totalPagas = faturas.filter((f) => f.status === 'paga').reduce((s, f) => s + f.valor, 0)
  const totalVencidas = faturas
    .filter((f) => f.status === 'vencida')
    .reduce((s, f) => s + f.valor, 0)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Controle de Faturamento & Cobrança</h2>
          <p className="text-xs text-[#64748B]">
            Emissão de faturas de instrumentos, controle de prazos e conciliação de recebíveis.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm shadow-md shadow-[#1FAF7A]/25 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nova Fatura
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Total Recebido (Pagas)
            </span>
            <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">
              {formatBRL(totalPagas)}
            </p>
            <span className="text-[11px] text-[#94A3B8]">Recursos disponíveis em conta</span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Em Aberto (Emitidas)
            </span>
            <p className="text-xl font-bold text-sky-700 mt-1 tabular-nums">
              {formatBRL(totalEmitidas)}
            </p>
            <span className="text-[11px] text-[#94A3B8]">Aguardando liquidação no prazo</span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0] shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Em Atraso (Vencidas)
            </span>
            <p className="text-xl font-bold text-red-600 mt-1 tabular-nums">
              {formatBRL(totalVencidas)}
            </p>
            <span className="text-[11px] text-red-500 font-medium">
              Requer cobrança com parceiro
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número ou projeto..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#64748B] shrink-0" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 text-xs h-9">
              <SelectValue placeholder="Status da Fatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="emitida">Emitidas</SelectItem>
              <SelectItem value="paga">Pagas</SelectItem>
              <SelectItem value="vencida">Vencidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Faturas */}
      <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filteredFaturas.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#64748B]">
              Nenhuma fatura encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                    <th className="py-3 px-4">Nº da Fatura</th>
                    <th className="py-3 px-4">Projeto Vinculado</th>
                    <th className="py-3 px-4">Emissão</th>
                    <th className="py-3 px-4">Vencimento</th>
                    <th className="py-3 px-4">Valor Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredFaturas.map((f) => {
                    const isVencida = f.status === 'vencida'
                    return (
                      <tr
                        key={f.id}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          isVencida ? 'bg-red-50/40 border-l-4 border-l-red-500' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#1E293B]">{f.numero}</td>
                        <td className="py-3 px-4 font-medium text-[#1E293B] max-w-xs truncate">
                          {f.expand?.projeto_id?.nome || '— Sem projeto —'}
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">{formatDateBR(f.data_emissao)}</td>
                        <td className="py-3 px-4 font-medium text-[#1E293B]">
                          {formatDateBR(f.data_vencimento)}
                        </td>
                        <td className="py-3 px-4 font-bold text-sm text-[#1E293B] tabular-nums">
                          {formatBRL(f.valor)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={f.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {f.status !== 'paga' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsPaid(f.id)}
                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                title="Marcar como Paga"
                              >
                                Baixar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewFatura(f)}
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-[#1FAF7A]"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadFatura(f)}
                              className="h-7 w-7 p-0 text-[#64748B] hover:text-blue-600"
                              title="Baixar Comprovante"
                            >
                              <Download className="w-4 h-4" />
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

      {/* Modal Novo Faturamento Mensal do Termo de Parceria */}
      <ModalNovoFaturamentoMensal
        open={modalMensalOpen}
        onClose={() => setModalMensalOpen(false)}
        onSuccess={fetchFaturas}
      />

      {/* Relatório Completo de Faturamento (A4 / Excel com 4 abas) */}
      <RelatorioFaturamentoModal
        open={Boolean(viewFaturamentoMensal)}
        onClose={() => setViewFaturamentoMensal(null)}
        faturamento={viewFaturamentoMensal}
        onUpdateStatus={fetchFaturas}
      />

      {/* Modal para Registro da Nota Fiscal */}
      {faturamentoParaNF && (
        <Dialog open={modalNFOpen} onOpenChange={setModalNFOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#1E293B]">
                Registro de Nota Fiscal Emitida
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Vincule o número da Nota Fiscal emitida posteriormente para o faturamento{' '}
                {faturamentoParaNF.numero_sequencial}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#1E293B]">
                  Número da Nota Fiscal (NF-e) *
                </label>
                <Input
                  value={numeroNFInput}
                  onChange={(e) => setNumeroNFInput(e.target.value)}
                  placeholder="Ex: 2026/089"
                  className="h-8 text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#1E293B]">Status do Título</label>
                <Select
                  value={statusNFInput}
                  onValueChange={(val) =>
                    setStatusNFInput(val as 'aguardando_nf' | 'nf_emitida' | 'liquidado')
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nf_emitida">NF Emitida (Aguardando Pagamento)</SelectItem>
                    <SelectItem value="liquidado">Liquidado / Pago pela Prefeitura</SelectItem>
                    <SelectItem value="aguardando_nf">Aguardando Emissão da NF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalNFOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSalvarNotaFiscal}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
              >
                Salvar Nota Fiscal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Nova Fatura Avulsa */}
      <ModalNovaFatura
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchFaturas}
      />

      {/* View Fatura Modal */}
      {viewFatura && (
        <Dialog open={Boolean(viewFatura)} onOpenChange={() => setViewFatura(null)}>
          <DialogContent className="sm:max-w-[460px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center justify-between">
                <span>Fatura {viewFatura.numero}</span>
                <StatusBadge status={viewFatura.status} />
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Comprovante oficial de controle interno
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-[#64748B]">Valor Nominal:</span>
                <span className="font-bold text-base text-[#1E293B]">
                  {formatBRL(viewFatura.valor)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Data de Emissão:</span>
                <span className="font-medium text-[#1E293B]">
                  {formatDateBR(viewFatura.data_emissao)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Data de Vencimento:</span>
                <span className="font-medium text-[#1E293B]">
                  {formatDateBR(viewFatura.data_vencimento)}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Projeto:</span>
                <span className="font-medium text-[#1E293B] text-right">
                  {viewFatura.expand?.projeto_id?.nome || '—'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-[#64748B]">Forma de Pagamento:</span>
                <span className="font-medium text-[#1E293B]">
                  {viewFatura.forma_pagamento || 'PIX / Boleto'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewFatura(null)}
                className="text-xs"
              >
                Fechar
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownloadFatura(viewFatura)}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exportar TXT
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
