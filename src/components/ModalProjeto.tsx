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
import { Checkbox } from '@/components/ui/checkbox'
import { createProjeto, updateProjeto } from '@/services/api'
import type { ProjetoRecord, ProjetoStatus, ContratoVinculadoTipo } from '@/types'
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
  const [contratosVinculados, setContratosVinculados] = useState<ContratoVinculadoTipo[]>(['CLT'])
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

      const rawContratos = projetoToEdit.contratos_vinculados
      if (Array.isArray(rawContratos)) {
        setContratosVinculados(
          rawContratos.length > 0 ? (rawContratos as ContratoVinculadoTipo[]) : ['CLT'],
        )
      } else if (rawContratos) {
        setContratosVinculados([rawContratos as ContratoVinculadoTipo])
      } else {
        setContratosVinculados(['CLT'])
      }

      setParceiro(projetoToEdit.parceiro || '')
      setDataInicio(projetoToEdit.data_inicio ? projetoToEdit.data_inicio.split('T')[0] : '')
      setDataFim(projetoToEdit.data_fim ? projetoToEdit.data_fim.split('T')[0] : '')
    } else {
      setNome('')
      setDescricao('')
      setValorTotal('')
      setStatus('ativo')
      setContratosVinculados(['CLT'])
      setParceiro('')
      setDataInicio(new Date().toISOString().split('T')[0])
      setDataFim('')
    }
    setErrors({})
  }, [projetoToEdit, open])

  const toggleContrato = (tipo: ContratoVinculadoTipo) => {
    setContratosVinculados((prev) => {
      if (prev.includes(tipo)) {
        // Não desmarcar tudo se quiser garantir pelo menos um ou permitir nenhum?
        // Se permitir desmarcar, pode ficar vazio []. O usuário pode marcar o outro.
        return prev.filter((item) => item !== tipo)
      } else {
        return [...prev, tipo]
      }
    })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome do projeto é obrigatório.'
    if (!valorTotal || Number(valorTotal) <= 0) errs.valorTotal = 'Informe um valor total válido.'
    if (contratosVinculados.length === 0) {
      errs.contratosVinculados = 'Selecione ao menos um tipo de contrato (CLT ou PJ).'
    }
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
        contratos_vinculados: contratosVinculados,
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
            Preencha as informações gerais do projeto ou iniciativa institucional.
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
              <Label className="text-xs font-semibold text-[#1E293B] block">
                Contratos Vinculados *
              </Label>
              <div className="flex items-center gap-3 pt-1">
                <label
                  htmlFor="check-clt"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    contratosVinculados.includes('CLT')
                      ? 'border-[#1FAF7A] bg-emerald-50 text-[#1FAF7A] font-semibold'
                      : 'border-slate-200 bg-white text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <Checkbox
                    id="check-clt"
                    checked={contratosVinculados.includes('CLT')}
                    onCheckedChange={() => toggleContrato('CLT')}
                    className="data-[state=checked]:bg-[#1FAF7A] data-[state=checked]:border-[#1FAF7A]"
                  />
                  <span>CLT</span>
                </label>

                <label
                  htmlFor="check-pj"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    contratosVinculados.includes('PJ')
                      ? 'border-[#1FAF7A] bg-emerald-50 text-[#1FAF7A] font-semibold'
                      : 'border-slate-200 bg-white text-[#64748B] hover:bg-slate-50'
                  }`}
                >
                  <Checkbox
                    id="check-pj"
                    checked={contratosVinculados.includes('PJ')}
                    onCheckedChange={() => toggleContrato('PJ')}
                    className="data-[state=checked]:bg-[#1FAF7A] data-[state=checked]:border-[#1FAF7A]"
                  />
                  <span>PJ</span>
                </label>
              </div>
              {errors.contratosVinculados && (
                <p className="text-xs text-red-500">{errors.contratosVinculados}</p>
              )}
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
