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
import { createProjeto, updateProjeto } from '@/services/api'
import type { ProjetoRecord, ProjetoStatus } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalProjetoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  projetoToEdit?: ProjetoRecord | null
}

export function ModalProjeto({ open, onClose, onSuccess, projetoToEdit }: ModalProjetoProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState<number | string>('')
  const [status, setStatus] = useState<ProjetoStatus>('ativo')
  const [progresso, setProgresso] = useState<number | string>(0)
  const [parceiro, setParceiro] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (projetoToEdit) {
      setNome(projetoToEdit.nome || '')
      setDescricao(projetoToEdit.descricao || '')
      setValorTotal(projetoToEdit.valor_total || '')
      setStatus(projetoToEdit.status || 'ativo')
      setProgresso(projetoToEdit.progresso || 0)
      setParceiro(projetoToEdit.parceiro || '')
      setDataInicio(projetoToEdit.data_inicio ? projetoToEdit.data_inicio.split('T')[0] : '')
      setDataFim(projetoToEdit.data_fim ? projetoToEdit.data_fim.split('T')[0] : '')
    } else {
      setNome('')
      setDescricao('')
      setValorTotal('')
      setStatus('ativo')
      setProgresso(0)
      setParceiro('')
      setDataInicio(new Date().toISOString().split('T')[0])
      setDataFim('')
    }
    setErrors({})
  }, [projetoToEdit, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome do projeto é obrigatório.'
    if (!valorTotal || Number(valorTotal) <= 0) errs.valorTotal = 'Informe um valor total válido.'
    const progVal = Number(progresso)
    if (isNaN(progVal) || progVal < 0 || progVal > 100)
      errs.progresso = 'Progresso deve ser entre 0 e 100%.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<ProjetoRecord> = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        valor_total: Number(valorTotal),
        status,
        progresso: Number(progresso) || 0,
        parceiro: parceiro.trim() || undefined,
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim).toISOString() : undefined,
      }

      if (projetoToEdit) {
        await updateProjeto(projetoToEdit.id, payload)
      } else {
        await createProjeto(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar projeto.'
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
            {projetoToEdit ? 'Editar Projeto' : 'Novo Projeto'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Preencha as informações gerais do convênio ou iniciativa institucional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-xs font-semibold text-[#1E293B]">
              Nome do Projeto *
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mutirão da Cidadania e Saúde"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="parceiro" className="text-xs font-semibold text-[#1E293B]">
                Organização Parceira / Fomentador
              </Label>
              <Input
                id="parceiro"
                value={parceiro}
                onChange={(e) => setParceiro(e.target.value)}
                placeholder="Ex: Secretaria de Assistência Social"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valorTotal" className="text-xs font-semibold text-[#1E293B]">
                Valor Total (R$) *
              </Label>
              <Input
                id="valorTotal"
                type="number"
                min="0"
                step="0.01"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
                placeholder="0.00"
                className={errors.valorTotal ? 'border-red-500' : ''}
              />
              {errors.valorTotal && <p className="text-xs text-red-500">{errors.valorTotal}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-[#1E293B]">
                Status do Projeto
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as ProjetoStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pausado">Pausado</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="progresso" className="text-xs font-semibold text-[#1E293B]">
                Progresso Atual (%)
              </Label>
              <Input
                id="progresso"
                type="number"
                min="0"
                max="100"
                value={progresso}
                onChange={(e) => setProgresso(e.target.value)}
                placeholder="0"
              />
              {errors.progresso && <p className="text-xs text-red-500">{errors.progresso}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs font-semibold text-[#1E293B]">
                Data de Início
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs font-semibold text-[#1E293B]">
                Data Prevista de Término
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-xs font-semibold text-[#1E293B]">
              Descrição do Objeto
            </Label>
            <Textarea
              id="descricao"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva as metas de impacto social, público-alvo e escopo..."
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
              {projetoToEdit ? 'Atualizar Projeto' : 'Criar Projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
