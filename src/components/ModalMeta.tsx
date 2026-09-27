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
import { createMeta, updateMeta } from '@/services/api'
import type { MetaRecord, MetaStatus } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalMetaProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  planoTrabalhoId: string
  planoTitulo?: string
  metaToEdit?: MetaRecord | null
}

export function ModalMeta({
  open,
  onClose,
  onSuccess,
  planoTrabalhoId,
  planoTitulo,
  metaToEdit,
}: ModalMetaProps) {
  const [descricao, setDescricao] = useState('')
  const [quantidadeAlvo, setQuantidadeAlvo] = useState<number | string>('')
  const [quantidadeRealizada, setQuantidadeRealizada] = useState<number | string>('')
  const [status, setStatus] = useState<MetaStatus>('nao_iniciada')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (metaToEdit) {
      setDescricao(metaToEdit.descricao || '')
      setQuantidadeAlvo(metaToEdit.quantidade_alvo ?? '')
      setQuantidadeRealizada(metaToEdit.quantidade_realizada ?? '')
      setStatus(metaToEdit.status || 'nao_iniciada')
    } else {
      setDescricao('')
      setQuantidadeAlvo('')
      setQuantidadeRealizada(0)
      setStatus('nao_iniciada')
    }
    setErrors({})
  }, [metaToEdit, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!descricao.trim()) errs.descricao = 'Descrição da meta é obrigatória.'
    if (quantidadeAlvo !== '' && Number(quantidadeAlvo) < 0) {
      errs.quantidadeAlvo = 'Quantidade deve ser zero ou positiva.'
    }
    if (quantidadeRealizada !== '' && Number(quantidadeRealizada) < 0) {
      errs.quantidadeRealizada = 'Quantidade deve ser zero ou positiva.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<MetaRecord> = {
        plano_trabalho_id: planoTrabalhoId,
        descricao: descricao.trim(),
        quantidade_alvo: quantidadeAlvo !== '' ? Number(quantidadeAlvo) : undefined,
        quantidade_realizada: quantidadeRealizada !== '' ? Number(quantidadeRealizada) : 0,
        status,
      }

      if (metaToEdit) {
        await updateMeta(metaToEdit.id, payload)
      } else {
        await createMeta(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar meta.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {metaToEdit ? 'Editar Meta' : 'Nova Meta Simples'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            {planoTitulo
              ? `Vinculada a: ${planoTitulo}`
              : 'Acompanhe a entrega com base em quantidade alvo e realizada.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="meta-desc" className="text-xs font-semibold text-[#1E293B]">
              Descrição da Meta *
            </Label>
            <Input
              id="meta-desc"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Visitas domiciliares a famílias cadastradas"
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && <p className="text-xs text-red-500">{errors.descricao}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="meta-alvo" className="text-xs font-semibold text-[#1E293B]">
                Qtd. Alvo
              </Label>
              <Input
                id="meta-alvo"
                type="number"
                min="0"
                step="1"
                value={quantidadeAlvo}
                onChange={(e) => setQuantidadeAlvo(e.target.value)}
                placeholder="Ex: 1000"
                className={errors.quantidadeAlvo ? 'border-red-500' : ''}
              />
              {errors.quantidadeAlvo && (
                <p className="text-xs text-red-500">{errors.quantidadeAlvo}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta-realizada" className="text-xs font-semibold text-[#1E293B]">
                Qtd. Realizada
              </Label>
              <Input
                id="meta-realizada"
                type="number"
                min="0"
                step="1"
                value={quantidadeRealizada}
                onChange={(e) => setQuantidadeRealizada(e.target.value)}
                placeholder="Ex: 850"
                className={errors.quantidadeRealizada ? 'border-red-500' : ''}
              />
              {errors.quantidadeRealizada && (
                <p className="text-xs text-red-500">{errors.quantidadeRealizada}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta-status" className="text-xs font-semibold text-[#1E293B]">
                Status da Meta
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as MetaStatus)}>
                <SelectTrigger id="meta-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
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
              {metaToEdit ? 'Salvar Meta' : 'Adicionar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
