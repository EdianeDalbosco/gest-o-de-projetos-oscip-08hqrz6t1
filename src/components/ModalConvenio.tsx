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
import { createConvenio, updateConvenio } from '@/services/api'
import type { ConvenioRecord, ConvenioStatus } from '@/types'
import { Loader2 } from 'lucide-react'

interface ModalConvenioProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  convenioToEdit?: ConvenioRecord | null
}

export function ModalConvenio({ open, onClose, onSuccess, convenioToEdit }: ModalConvenioProps) {
  const [nome, setNome] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [numeroInstrumento, setNumeroInstrumento] = useState('')
  const [orgaoContratante, setOrgaoContratante] = useState('')
  const [valorGlobal, setValorGlobal] = useState<number | string>('')
  const [status, setStatus] = useState<ConvenioStatus>('ativo')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (convenioToEdit) {
      setNome(convenioToEdit.nome || '')
      setMunicipio(convenioToEdit.municipio || '')
      setNumeroInstrumento(convenioToEdit.numero_instrumento || '')
      setOrgaoContratante(convenioToEdit.orgao_contratante || '')
      setValorGlobal(convenioToEdit.valor_global || '')
      setStatus(convenioToEdit.status || 'ativo')
      setDataInicio(convenioToEdit.data_inicio ? convenioToEdit.data_inicio.split('T')[0] : '')
      setDataFim(convenioToEdit.data_fim ? convenioToEdit.data_fim.split('T')[0] : '')
      setObservacoes(convenioToEdit.observacoes || '')
    } else {
      setNome('')
      setMunicipio('')
      setNumeroInstrumento('')
      setOrgaoContratante('')
      setValorGlobal('')
      setStatus('ativo')
      setDataInicio(new Date().toISOString().split('T')[0])
      setDataFim('')
      setObservacoes('')
    }
    setErrors({})
  }, [convenioToEdit, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome do instrumento é obrigatório.'
    if (!municipio.trim()) errs.municipio = 'Município é obrigatório.'
    if (!numeroInstrumento.trim()) errs.numeroInstrumento = 'Número do instrumento é obrigatório.'
    if (!valorGlobal || Number(valorGlobal) <= 0)
      errs.valorGlobal = 'Informe um valor global válido.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<ConvenioRecord> = {
        nome: nome.trim(),
        municipio: municipio.trim(),
        numero_instrumento: numeroInstrumento.trim(),
        orgao_contratante: orgaoContratante.trim() || undefined,
        valor_global: Number(valorGlobal),
        status,
        data_inicio: dataInicio ? new Date(dataInicio).toISOString() : undefined,
        data_fim: dataFim ? new Date(dataFim).toISOString() : undefined,
        observacoes: observacoes.trim() || undefined,
      }

      if (convenioToEdit) {
        await updateConvenio(convenioToEdit.id, payload)
      } else {
        await createConvenio(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar instrumento.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {convenioToEdit ? 'Editar Instrumento' : 'Novo Instrumento'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Preencha os dados do instrumento firmado com o município e seus órgãos executores.
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
              Nome / Título do Instrumento *
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Instrumento 001/2024 — Prefeitura Municipal de São João"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="municipio" className="text-xs font-semibold text-[#1E293B]">
                Município *
              </Label>
              <Input
                id="municipio"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: São Paulo"
                className={errors.municipio ? 'border-red-500' : ''}
              />
              {errors.municipio && <p className="text-xs text-red-500">{errors.municipio}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="numeroInstrumento" className="text-xs font-semibold text-[#1E293B]">
                Nº do Instrumento / Termo *
              </Label>
              <Input
                id="numeroInstrumento"
                value={numeroInstrumento}
                onChange={(e) => setNumeroInstrumento(e.target.value)}
                placeholder="Ex: CONV-001/2024"
                className={errors.numeroInstrumento ? 'border-red-500' : ''}
              />
              {errors.numeroInstrumento && (
                <p className="text-xs text-red-500">{errors.numeroInstrumento}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="orgaoContratante" className="text-xs font-semibold text-[#1E293B]">
                Órgão / Entidade Contratante
              </Label>
              <Input
                id="orgaoContratante"
                value={orgaoContratante}
                onChange={(e) => setOrgaoContratante(e.target.value)}
                placeholder="Ex: Gabinete do Prefeito"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valorGlobal" className="text-xs font-semibold text-[#1E293B]">
                Valor Global (R$) *
              </Label>
              <Input
                id="valorGlobal"
                type="number"
                min="0"
                step="0.01"
                value={valorGlobal}
                onChange={(e) => setValorGlobal(e.target.value)}
                placeholder="0.00"
                className={errors.valorGlobal ? 'border-red-500' : ''}
              />
              {errors.valorGlobal && <p className="text-xs text-red-500">{errors.valorGlobal}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-[#1E293B]">
                Status
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as ConvenioStatus)}>
                <SelectTrigger id="status" className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs font-semibold text-[#1E293B]">
                Início de Vigência
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs font-semibold text-[#1E293B]">
                Término de Vigência
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observacoes" className="text-xs font-semibold text-[#1E293B]">
              Observações & Objeto Geral
            </Label>
            <Textarea
              id="observacoes"
              rows={3}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva as diretrizes gerais do instrumento municipal..."
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
              {convenioToEdit ? 'Salvar Alterações' : 'Criar Instrumento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
