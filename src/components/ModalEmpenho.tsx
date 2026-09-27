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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEmpenho, updateEmpenho } from '@/services/api'
import type { EmpenhoRecord, EmpenhoStatus, SecretariaRecord } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalEmpenhoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  secretariaId: string
  secretariaNome?: string
  convenioId?: string
  empenhoToEdit?: EmpenhoRecord | null
  secretariasDisponiveis?: SecretariaRecord[]
}

export function ModalEmpenho({
  open,
  onClose,
  onSuccess,
  secretariaId,
  secretariaNome,
  convenioId,
  empenhoToEdit,
  secretariasDisponiveis,
}: ModalEmpenhoProps) {
  const [selectedSecId, setSelectedSecId] = useState<string>(secretariaId)
  const [numero, setNumero] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState<number | string>('')
  const [data, setData] = useState('')
  const [status, setStatus] = useState<EmpenhoStatus>('reservado')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (empenhoToEdit) {
      setSelectedSecId(empenhoToEdit.secretaria_id || secretariaId)
      setNumero(empenhoToEdit.numero || '')
      setDescricao(empenhoToEdit.descricao || '')
      setValor(empenhoToEdit.valor ?? '')
      setData(empenhoToEdit.data ? empenhoToEdit.data.split('T')[0] : '')
      setStatus(empenhoToEdit.status || 'reservado')
    } else {
      setSelectedSecId(secretariaId)
      const currentYear = new Date().getFullYear()
      const randomNum = Math.floor(10 + Math.random() * 90)
      setNumero(`${currentYear}-0${randomNum}`)
      setDescricao('')
      setValor('')
      setData(new Date().toISOString().split('T')[0])
      setStatus('reservado')
    }
    setErrors({})
  }, [empenhoToEdit, secretariaId, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!selectedSecId) errs.secretaria_id = 'A secretaria responsável é obrigatória.'
    if (!numero.trim()) errs.numero = 'O número do empenho é obrigatório (ex: 2024-001).'
    if (valor === '' || Number(valor) <= 0) {
      errs.valor = 'Informe um valor de empenho válido e positivo.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<EmpenhoRecord> = {
        secretaria_id: selectedSecId,
        convenio_id: convenioId || undefined,
        numero: numero.trim(),
        descricao: descricao.trim() || undefined,
        valor: Number(valor),
        data: data ? new Date(data).toISOString() : undefined,
        status,
      }

      if (empenhoToEdit) {
        await updateEmpenho(empenhoToEdit.id, payload)
      } else {
        await createEmpenho(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar empenho.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const currentSecNome =
    secretariasDisponiveis?.find((s) => s.id === selectedSecId)?.nome || secretariaNome

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {empenhoToEdit ? 'Editar Nota de Empenho' : 'Registrar Novo Empenho'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            {currentSecNome
              ? `Secretaria vinculada: ${currentSecNome}`
              : 'Vincule a dotação orçamentária reservada para as ações da secretaria.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          {secretariasDisponiveis && secretariasDisponiveis.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="secretaria_id" className="text-xs font-semibold text-[#1E293B]">
                Secretaria *
              </Label>
              <Select value={selectedSecId} onValueChange={setSelectedSecId}>
                <SelectTrigger id="secretaria_id">
                  <SelectValue placeholder="Selecione a secretaria" />
                </SelectTrigger>
                <SelectContent>
                  {secretariasDisponiveis.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.secretaria_id && (
                <p className="text-xs text-red-500">{errors.secretaria_id}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-numero" className="text-xs font-semibold text-[#1E293B]">
                Número do Empenho *
              </Label>
              <Input
                id="emp-numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: 2024-001"
                className={errors.numero ? 'border-red-500' : ''}
              />
              {errors.numero && <p className="text-xs text-red-500">{errors.numero}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-valor" className="text-xs font-semibold text-[#1E293B]">
                Valor Empenhado (R$) *
              </Label>
              <Input
                id="emp-valor"
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
            <Label htmlFor="emp-descricao" className="text-xs font-semibold text-[#1E293B]">
              Descrição / Objeto do Empenho
            </Label>
            <Textarea
              id="emp-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aquisição de insumos básicos e kits preventivos para ações comunitárias"
              className="resize-none h-20 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-data" className="text-xs font-semibold text-[#1E293B]">
                Data do Empenho
              </Label>
              <Input
                id="emp-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emp-status" className="text-xs font-semibold text-[#1E293B]">
                Status do Empenho *
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EmpenhoStatus)}>
                <SelectTrigger id="emp-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="liquidado">Liquidado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
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
              {empenhoToEdit ? 'Salvar Alterações' : 'Registrar Empenho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
