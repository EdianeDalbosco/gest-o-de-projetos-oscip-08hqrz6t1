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
import { createCatalogoAtividade, updateCatalogoAtividade } from '@/services/api'
import type { CatalogoAtividadeRecord, TipoExecucaoAtividade } from '@/types'
import { Loader2 } from 'lucide-react'
import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '@/lib/masks'
import { formatBRL } from '@/components/StatusBadge'

interface ModalCatalogoAtividadeProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  projetoId: string
  atividadeToEdit?: CatalogoAtividadeRecord | null
}

export function ModalCatalogoAtividade({
  open,
  onClose,
  onSuccess,
  projetoId,
  atividadeToEdit,
}: ModalCatalogoAtividadeProps) {
  const [tipoVinculo, setTipoVinculo] = useState<'CLT' | 'PJ'>('PJ')
  const [tipoExecucao, setTipoExecucao] = useState<TipoExecucaoAtividade>('Serviço Mensal')
  const [descricao, setDescricao] = useState('')
  const [valorUnitario, setValorUnitario] = useState<string>('')
  const [proventos, setProventos] = useState<string>('')
  const [provisao, setProvisao] = useState<string>('')
  const [encargos, setEncargos] = useState<string>('')
  const [detalhesEscopo, setDetalhesEscopo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (atividadeToEdit) {
      setTipoVinculo(atividadeToEdit.tipo_vinculo)
      setTipoExecucao(atividadeToEdit.tipo_execucao)
      setDescricao(atividadeToEdit.descricao || '')
      setValorUnitario(
        atividadeToEdit.valor_unitario !== undefined && atividadeToEdit.valor_unitario !== null
          ? formatCurrencyBRL(atividadeToEdit.valor_unitario)
          : '',
      )
      setProventos(
        atividadeToEdit.proventos !== undefined && atividadeToEdit.proventos !== null
          ? formatCurrencyBRL(atividadeToEdit.proventos)
          : '',
      )
      setProvisao(
        atividadeToEdit.provisao !== undefined && atividadeToEdit.provisao !== null
          ? formatCurrencyBRL(atividadeToEdit.provisao)
          : '',
      )
      setEncargos(
        atividadeToEdit.encargos !== undefined && atividadeToEdit.encargos !== null
          ? formatCurrencyBRL(atividadeToEdit.encargos)
          : '',
      )
      setDetalhesEscopo(atividadeToEdit.detalhes_escopo || '')
    } else {
      setTipoVinculo('PJ')
      setTipoExecucao('Serviço Mensal')
      setDescricao('')
      setValorUnitario('')
      setProventos('')
      setProvisao('')
      setEncargos('')
      setDetalhesEscopo('')
    }
    setErrors({})
  }, [atividadeToEdit, open])

  // Recalcular valor unitário para CLT se proventos + provisão + encargos forem preenchidos
  const handleRecalcularCLT = (provStr: string, provisStr: string, encStr: string) => {
    const p = parseCurrencyBRL(provStr)
    const pr = parseCurrencyBRL(provisStr)
    const en = parseCurrencyBRL(encStr)
    if (p > 0 || pr > 0 || en > 0) {
      setValorUnitario(formatCurrencyBRL(p + pr + en))
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!descricao.trim()) errs.descricao = 'Descrição da atividade / cargo é obrigatória.'
    const numUnitario = parseCurrencyBRL(valorUnitario)
    if (!valorUnitario || isNaN(numUnitario) || numUnitario <= 0) {
      errs.valorUnitario = 'Informe o valor unitário / remuneração base.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const numUnitario = parseCurrencyBRL(valorUnitario)
    const numProv = proventos ? parseCurrencyBRL(proventos) : undefined
    const numProvis = provisao ? parseCurrencyBRL(provisao) : undefined
    const numEnc = encargos ? parseCurrencyBRL(encargos) : undefined

    setLoading(true)
    try {
      const payload: Partial<CatalogoAtividadeRecord> = {
        projeto_id: projetoId,
        tipo_vinculo: tipoVinculo,
        tipo_execucao: tipoExecucao,
        descricao: descricao.trim(),
        valor_unitario: numUnitario,
        proventos: numProv,
        provisao: numProvis,
        encargos: numEnc,
        detalhes_escopo: detalhesEscopo.trim() || undefined,
      }

      if (atividadeToEdit) {
        await updateCatalogoAtividade(atividadeToEdit.id, payload)
      } else {
        await createCatalogoAtividade(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar atividade no catálogo.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {atividadeToEdit
              ? 'Editar Atividade no Catálogo'
              : 'Nova Atividade no Catálogo do Projeto'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Cadastre os cargos, serviços mensais ou demandas/plantões previstos no Anexo I do Plano
            de Trabalho.
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
              <Label className="text-xs font-semibold text-[#1E293B]">Tipo de Vínculo *</Label>
              <Select
                value={tipoVinculo}
                onValueChange={(val) => {
                  const t = val as 'CLT' | 'PJ'
                  setTipoVinculo(t)
                  if (t === 'CLT') setTipoExecucao('Mensal')
                  else setTipoExecucao('Serviço Mensal')
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                  <SelectItem value="CLT">Empregado (CLT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Tipo de Execução *</Label>
              <Select
                value={tipoExecucao}
                onValueChange={(val) => setTipoExecucao(val as TipoExecucaoAtividade)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoVinculo === 'CLT' ? (
                    <SelectItem value="Mensal">Mensal</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="Serviço Mensal">Serviço Mensal</SelectItem>
                      <SelectItem value="Conforme Demanda">Conforme Demanda</SelectItem>
                      <SelectItem value="Plantão">Plantão</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-xs font-semibold text-[#1E293B]">
              Nome da Atividade / Cargo *
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Médico Clínico Geral, Técnico Enfermagem, Motorista - Plantão"
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && <p className="text-xs text-red-500">{errors.descricao}</p>}
          </div>

          {tipoVinculo === 'CLT' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="text-[11px] font-bold text-[#475569] block">
                Composição de Custo CLT (Referencial)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-[#64748B]">Proventos</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748B]">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={proventos}
                      onChange={(e) => {
                        const masked = maskCurrency(e.target.value)
                        setProventos(masked)
                        handleRecalcularCLT(masked, provisao, encargos)
                      }}
                      placeholder="0,00"
                      className="pl-7 h-8 text-xs font-semibold tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-[#64748B]">Provisão</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748B]">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={provisao}
                      onChange={(e) => {
                        const masked = maskCurrency(e.target.value)
                        setProvisao(masked)
                        handleRecalcularCLT(proventos, masked, encargos)
                      }}
                      placeholder="0,00"
                      className="pl-7 h-8 text-xs font-semibold tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-[#64748B]">Encargos</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748B]">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={encargos}
                      onChange={(e) => {
                        const masked = maskCurrency(e.target.value)
                        setEncargos(masked)
                        handleRecalcularCLT(proventos, provisao, masked)
                      }}
                      placeholder="0,00"
                      className="pl-7 h-8 text-xs font-semibold tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="valorUnitario" className="text-xs font-semibold text-[#1E293B]">
              Valor Unitário / Remuneração Base *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                R$
              </span>
              <Input
                id="valorUnitario"
                type="text"
                inputMode="numeric"
                value={valorUnitario}
                onChange={(e) => {
                  const masked = maskCurrency(e.target.value)
                  setValorUnitario(masked)
                  if (errors.valorUnitario) {
                    setErrors((prev) => {
                      const copy = { ...prev }
                      delete copy.valorUnitario
                      return copy
                    })
                  }
                }}
                placeholder="0,00"
                className={`pl-9 text-xs font-semibold tabular-nums ${
                  errors.valorUnitario ? 'border-red-500' : ''
                }`}
              />
            </div>
            {valorUnitario && parseCurrencyBRL(valorUnitario) > 0 && (
              <p className="text-[11px] text-[#64748B] flex items-center justify-between">
                <span>Valor:</span>
                <span className="font-semibold text-emerald-700">
                  {formatBRL(parseCurrencyBRL(valorUnitario))}
                </span>
              </p>
            )}
            {errors.valorUnitario && <p className="text-xs text-red-500">{errors.valorUnitario}</p>}
            <p className="text-[11px] text-[#64748B]">
              Para serviço mensal: valor da mensalidade base. Para plantão/demanda: valor unitário
              por plantão/demanda.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="detalhesEscopo" className="text-xs font-semibold text-[#1E293B]">
              Descrição do Escopo / Atribuições
            </Label>
            <Textarea
              id="detalhesEscopo"
              rows={3}
              value={detalhesEscopo}
              onChange={(e) => setDetalhesEscopo(e.target.value)}
              placeholder="Descreva as atribuições técnicas e atividades previstas no plano de trabalho..."
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
              {atividadeToEdit ? 'Salvar Alterações' : 'Adicionar ao Catálogo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
