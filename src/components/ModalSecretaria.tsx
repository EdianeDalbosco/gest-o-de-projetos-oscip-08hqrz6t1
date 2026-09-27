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
import { createSecretaria, updateSecretaria } from '@/services/api'
import type { SecretariaRecord } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalSecretariaProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  convenioId: string
  secretariaToEdit?: SecretariaRecord | null
}

export function ModalSecretaria({
  open,
  onClose,
  onSuccess,
  convenioId,
  secretariaToEdit,
}: ModalSecretariaProps) {
  const [nome, setNome] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (secretariaToEdit) {
      setNome(secretariaToEdit.nome || '')
      setResponsavel(secretariaToEdit.responsavel || '')
      setObservacoes(secretariaToEdit.observacoes || '')
    } else {
      setNome('')
      setResponsavel('')
      setObservacoes('')
    }
    setErrors({})
  }, [secretariaToEdit, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome da secretaria é obrigatório.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<SecretariaRecord> = {
        nome: nome.trim(),
        convenio_id: convenioId,
        responsavel: responsavel.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      }

      if (secretariaToEdit) {
        await updateSecretaria(secretariaToEdit.id, payload)
      } else {
        await createSecretaria(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar secretaria.'
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
            {secretariaToEdit ? 'Editar Secretaria' : 'Nova Secretaria'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Vincule um órgão da administração municipal a este instrumento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome-secretaria" className="text-xs font-semibold text-[#1E293B]">
              Nome da Secretaria *
            </Label>
            <Input
              id="nome-secretaria"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Secretaria Municipal de Saúde"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="responsavel-secretaria"
              className="text-xs font-semibold text-[#1E293B]"
            >
              Responsável / Gestor Titular
            </Label>
            <Input
              id="responsavel-secretaria"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Ex: Dra. Helena Martins (Secretária Municipal)"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs-secretaria" className="text-xs font-semibold text-[#1E293B]">
              Observações
            </Label>
            <Textarea
              id="obs-secretaria"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Objetivos e atribuições específicas desta pasta no instrumento..."
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
              {secretariaToEdit ? 'Salvar Secretaria' : 'Adicionar Secretaria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
