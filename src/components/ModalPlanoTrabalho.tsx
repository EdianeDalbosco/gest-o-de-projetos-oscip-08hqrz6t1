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
import { createPlanoTrabalho, updatePlanoTrabalho } from '@/services/api'
import type { PlanoTrabalhoRecord, PlanoTrabalhoStatus, SecretariaRecord } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalPlanoTrabalhoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  convenioId: string
  secretarias: SecretariaRecord[]
  defaultSecretariaId?: string
  planoToEdit?: PlanoTrabalhoRecord | null
}

export function ModalPlanoTrabalho({
  open,
  onClose,
  onSuccess,
  convenioId,
  secretarias,
  defaultSecretariaId,
  planoToEdit,
}: ModalPlanoTrabalhoProps) {
  const [titulo, setTitulo] = useState('')
  const [secretariaId, setSecretariaId] = useState('')
  const [valorPrevisto, setValorPrevisto] = useState<number | string>('')
  const [valorEmpenhado, setValorEmpenhado] = useState<number | string>('')
  const [valorExecutado, setValorExecutado] = useState<number | string>('')
  const [periodo, setPeriodo] = useState('')
  const [status, setStatus] = useState<PlanoTrabalhoStatus>('ativo')
  const [descricao, setDescricao] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (planoToEdit) {
      setTitulo(planoToEdit.titulo || '')
      setSecretariaId(planoToEdit.secretaria_id || defaultSecretariaId || '')
      setValorPrevisto(planoToEdit.valor_previsto || '')
      setValorEmpenhado(planoToEdit.valor_empenhado ?? '')
      setValorExecutado(planoToEdit.valor_executado ?? '')
      setPeriodo(planoToEdit.periodo || '')
      setStatus(planoToEdit.status || 'ativo')
      setDescricao(planoToEdit.descricao || '')
    } else {
      setTitulo('')
      setSecretariaId(defaultSecretariaId || (secretarias[0]?.id ?? ''))
      setValorPrevisto('')
      setValorEmpenhado('')
      setValorExecutado('')
      setPeriodo('')
      setStatus('ativo')
      setDescricao('')
    }
    setErrors({})
  }, [planoToEdit, defaultSecretariaId, secretarias, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!titulo.trim()) errs.titulo = 'Título do plano é obrigatório.'
    if (!secretariaId) errs.secretariaId = 'Selecione uma secretaria.'
    if (!valorPrevisto || Number(valorPrevisto) <= 0)
      errs.valorPrevisto = 'Informe um valor previsto válido.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<PlanoTrabalhoRecord> = {
        titulo: titulo.trim(),
        secretaria_id: secretariaId,
        convenio_id: convenioId,
        valor_previsto: Number(valorPrevisto),
        valor_empenhado: valorEmpenhado !== '' ? Number(valorEmpenhado) : 0,
        valor_executado: valorExecutado !== '' ? Number(valorExecutado) : 0,
        periodo: periodo.trim() || undefined,
        status,
        descricao: descricao.trim() || undefined,
      }

      if (planoToEdit) {
        await updatePlanoTrabalho(planoToEdit.id, payload)
      } else {
        await createPlanoTrabalho(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar plano de trabalho.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {planoToEdit ? 'Editar Plano de Trabalho' : 'Novo Plano de Trabalho'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Defina o escopo orçamentário e a pasta executora desta linha de ação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="plano-titulo" className="text-xs font-semibold text-[#1E293B]">
              Título do Plano de Trabalho *
            </Label>
            <Input
              id="plano-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Plano de Ação: Saúde da Família e Busca Ativa"
              className={errors.titulo ? 'border-red-500' : ''}
            />
            {errors.titulo && <p className="text-xs text-red-500">{errors.titulo}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plano-sec" className="text-xs font-semibold text-[#1E293B]">
                Secretaria Vinculada *
              </Label>
              <Select value={secretariaId} onValueChange={setSecretariaId}>
                <SelectTrigger id="plano-sec">
                  <SelectValue placeholder="Selecione a secretaria" />
                </SelectTrigger>
                <SelectContent>
                  {secretarias.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.secretariaId && <p className="text-xs text-red-500">{errors.secretariaId}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plano-status" className="text-xs font-semibold text-[#1E293B]">
                Status do Plano
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as PlanoTrabalhoStatus)}>
                <SelectTrigger id="plano-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plano-previsto" className="text-xs font-semibold text-[#1E293B]">
                Valor Previsto (R$) *
              </Label>
              <Input
                id="plano-previsto"
                type="number"
                min="0"
                step="0.01"
                value={valorPrevisto}
                onChange={(e) => setValorPrevisto(e.target.value)}
                placeholder="0.00"
                className={errors.valorPrevisto ? 'border-red-500' : ''}
              />
              {errors.valorPrevisto && (
                <p className="text-xs text-red-500">{errors.valorPrevisto}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plano-empenhado" className="text-xs font-semibold text-[#1E293B]">
                Valor Empenhado (R$)
              </Label>
              <Input
                id="plano-empenhado"
                type="number"
                min="0"
                step="0.01"
                value={valorEmpenhado}
                onChange={(e) => setValorEmpenhado(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plano-executado" className="text-xs font-semibold text-[#1E293B]">
                Valor Executado (R$)
              </Label>
              <Input
                id="plano-executado"
                type="number"
                min="0"
                step="0.01"
                value={valorExecutado}
                onChange={(e) => setValorExecutado(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plano-periodo" className="text-xs font-semibold text-[#1E293B]">
              Período / Cronograma
            </Label>
            <Input
              id="plano-periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              placeholder="Ex: Jan/2024 — Dez/2024"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="plano-desc" className="text-xs font-semibold text-[#1E293B]">
              Descrição do Plano
            </Label>
            <Textarea
              id="plano-desc"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Resumo das frentes de atuação e justificativa orçamentária..."
            />
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
              {planoToEdit ? 'Salvar Plano' : 'Criar Plano de Trabalho'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
