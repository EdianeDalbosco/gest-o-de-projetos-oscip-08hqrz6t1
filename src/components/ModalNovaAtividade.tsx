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
import { createAtividade, getContratos } from '@/services/api'
import type { ContratoRecord, AtividadeRecord } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalNovaAtividadeProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultProjetoId?: string
}

export function ModalNovaAtividade({
  open,
  onClose,
  onSuccess,
  defaultProjetoId,
}: ModalNovaAtividadeProps) {
  const [prestadores, setPrestadores] = useState<ContratoRecord[]>([])
  const [prestadorId, setPrestadorId] = useState('')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [horas, setHoras] = useState<number | string>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getContratos()
        .then((data) => {
          // Filter PJ only as per specification
          const pjs = data.filter((c) => c.tipo === 'PJ')
          setPrestadores(pjs)
          if (pjs.length > 0 && !prestadorId) {
            setPrestadorId(pjs[0].id)
          }
        })
        .catch(console.error)

      setDescricao('')
      setHoras('')
      setData(new Date().toISOString().split('T')[0])
      setErrors({})
    }
  }, [open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!prestadorId) errs.prestador = 'Selecione o prestador PJ.'
    if (!descricao.trim()) errs.descricao = 'Descrição da atividade é obrigatória.'
    const numHoras = Number(horas)
    if (!numHoras || numHoras < 0.5 || numHoras > 24) {
      errs.horas = 'Informe horas válidas (entre 0.5 e 24h).'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const selectedPrestador = prestadores.find((p) => p.id === prestadorId)
      let valorAprovado: number | undefined

      if (selectedPrestador) {
        if (selectedPrestador.tipo_pj === 'horas') {
          valorAprovado = Number(horas) * (selectedPrestador.valor || 0)
        } else {
          valorAprovado = selectedPrestador.valor || 0
        }
      }

      await createAtividade({
        prestador_id: prestadorId,
        projeto_id: defaultProjetoId,
        descricao: descricao.trim(),
        data: new Date(data).toISOString(),
        horas: Number(horas),
        status: 'pendente',
        valor_aprovado: valorAprovado,
      })

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar atividade.'
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
            Nova Atividade de Prestador
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Registre as horas trabalhadas e entregas executadas pelo prestador PJ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="prestador" className="text-xs font-semibold text-[#1E293B]">
              Prestador PJ Responsável *
            </Label>
            <Select value={prestadorId} onValueChange={setPrestadorId}>
              <SelectTrigger id="prestador">
                <SelectValue placeholder="Selecione o prestador PJ" />
              </SelectTrigger>
              <SelectContent>
                {prestadores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} — {p.cargo_funcao} (
                    {p.tipo_pj === 'horas' ? `R$ ${p.valor}/h` : `R$ ${p.valor}/mês`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.prestador && <p className="text-xs text-red-500">{errors.prestador}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="data" className="text-xs font-semibold text-[#1E293B]">
                Data da Execução *
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="horas" className="text-xs font-semibold text-[#1E293B]">
                Horas Dedicadas (0.5 a 24) *
              </Label>
              <Input
                id="horas"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                placeholder="Ex: 4.5"
                className={errors.horas ? 'border-red-500' : ''}
              />
              {errors.horas && <p className="text-xs text-red-500">{errors.horas}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-xs font-semibold text-[#1E293B]">
              Descrição Detalhada das Atividades *
            </Label>
            <Textarea
              id="descricao"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que foi desenvolvido ou prestado nesta sessão de trabalho..."
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && <p className="text-xs text-red-500">{errors.descricao}</p>}
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
              Registrar Atividade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
