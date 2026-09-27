import React, { useState } from 'react'
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
import { createDespesa } from '@/services/api'
import type { DespesaCategoria } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalNovaDespesaProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNovaDespesa({ open, onClose, onSuccess }: ModalNovaDespesaProps) {
  const [categoria, setCategoria] = useState<DespesaCategoria>('Operacional')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState<number | string>('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!descricao.trim()) errs.descricao = 'Descrição da despesa é obrigatória.'
    if (!valor || Number(valor) <= 0) errs.valor = 'Informe um valor válido.'
    if (!data) errs.data = 'Data é obrigatória.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await createDespesa({
        categoria,
        descricao: descricao.trim(),
        valor: Number(valor),
        data: new Date(data).toISOString(),
      })

      setDescricao('')
      setValor('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar despesa.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            Registrar Nova Despesa
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Lançamento de custos operacionais, folha ou insumos do projeto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="categoria" className="text-xs font-semibold text-[#1E293B]">
              Categoria do Gasto *
            </Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as DespesaCategoria)}>
              <SelectTrigger id="categoria">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pessoal">Pessoal (Salários & CLT)</SelectItem>
                <SelectItem value="Operacional">Operacional (Materiais & Logística)</SelectItem>
                <SelectItem value="Infraestrutura">Infraestrutura & Locação</SelectItem>
                <SelectItem value="Marketing">Comunicação & Divulgação</SelectItem>
                <SelectItem value="Outros">Outras Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-xs font-semibold text-[#1E293B]">
              Descrição do Pagamento *
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Aquisição de testes rápidos de saúde"
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && <p className="text-xs text-red-500">{errors.descricao}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor" className="text-xs font-semibold text-[#1E293B]">
                Valor Pago (R$) *
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

            <div className="space-y-1.5">
              <Label htmlFor="data" className="text-xs font-semibold text-[#1E293B]">
                Data do Desembolso *
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
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
              Lançar Despesa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
