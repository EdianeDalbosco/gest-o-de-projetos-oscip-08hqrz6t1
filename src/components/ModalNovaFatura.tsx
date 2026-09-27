import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createFatura, getProjetos, getContratos } from '@/services/api'
import type { ProjetoRecord, ContratoRecord, FaturaStatus } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalNovaFaturaProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNovaFatura({ open, onClose, onSuccess }: ModalNovaFaturaProps) {
  const [numero, setNumero] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [contratoId, setContratoId] = useState('')
  const [valor, setValor] = useState<number | string>('')
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0])
  const [dataVencimento, setDataVencimento] = useState('')
  const [status, setStatus] = useState<FaturaStatus>('emitida')
  const [formaPagamento, setFormaPagamento] = useState('Transferência Bancária PIX')

  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [contratos, setContratos] = useState<ContratoRecord[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      Promise.all([getProjetos(), getContratos()])
        .then(([projList, contList]) => {
          setProjetos(projList)
          setContratos(contList)
        })
        .catch(console.error)

      // Generate next suggested invoice number
      const randomId = Math.floor(100 + Math.random() * 900)
      setNumero(`FAT-2024-${randomId}`)
      setValor('')
      setDataEmissao(new Date().toISOString().split('T')[0])
      // Default due date: +15 days
      const d = new Date()
      d.setDate(d.getDate() + 15)
      setDataVencimento(d.toISOString().split('T')[0])
      setErrors({})
    }
  }, [open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!numero.trim()) errs.numero = 'Número da fatura é obrigatório.'
    if (!valor || Number(valor) <= 0) errs.valor = 'Informe um valor válido.'
    if (!dataEmissao) errs.dataEmissao = 'Data de emissão é obrigatória.'
    if (!dataVencimento) errs.dataVencimento = 'Data de vencimento é obrigatória.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await createFatura({
        numero: numero.trim(),
        projeto_id: projetoId || undefined,
        contrato_id: contratoId || undefined,
        valor: Number(valor),
        data_emissao: new Date(dataEmissao).toISOString(),
        data_vencimento: new Date(dataVencimento).toISOString(),
        status,
        forma_pagamento: formaPagamento,
      })

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar fatura.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            Emitir Nova Fatura / Cobrança
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Gere uma fatura atrelada a termo de fomento, convênio ou contrato de prestação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="numero" className="text-xs font-semibold text-[#1E293B]">
                Nº da Fatura / Boleto *
              </Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: FAT-2024-005"
                className={errors.numero ? 'border-red-500' : ''}
              />
              {errors.numero && <p className="text-xs text-red-500">{errors.numero}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor" className="text-xs font-semibold text-[#1E293B]">
                Valor da Fatura (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                className={errors.valor ? 'border-red-500' : ''}
              />
              {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projetoId" className="text-xs font-semibold text-[#1E293B]">
              Projeto Vinculado (Opcional)
            </Label>
            <Select value={projetoId} onValueChange={setProjetoId}>
              <SelectTrigger id="projetoId">
                <SelectValue placeholder="Selecione o projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum vínculo específico</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contratoId" className="text-xs font-semibold text-[#1E293B]">
              Contrato PJ Vinculado (Opcional)
            </Label>
            <Select value={contratoId} onValueChange={setContratoId}>
              <SelectTrigger id="contratoId">
                <SelectValue placeholder="Selecione o contrato relacionado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum contrato direto</SelectItem>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} ({c.tipo} — {c.cargo_funcao})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataEmissao" className="text-xs font-semibold text-[#1E293B]">
                Data de Emissão *
              </Label>
              <Input
                id="dataEmissao"
                type="date"
                value={dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataVencimento" className="text-xs font-semibold text-[#1E293B]">
                Data de Vencimento *
              </Label>
              <Input
                id="dataVencimento"
                type="date"
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-[#1E293B]">
                Status Inicial
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FaturaStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emitida">Emitida</SelectItem>
                  <SelectItem value="paga">Paga</SelectItem>
                  <SelectItem value="vencida">Vencida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="formaPagamento" className="text-xs font-semibold text-[#1E293B]">
                Forma de Pagamento
              </Label>
              <Input
                id="formaPagamento"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                placeholder="Ex: PIX, Boleto, TED..."
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gerar Fatura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
