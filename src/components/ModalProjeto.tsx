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
import { createProjeto, updateProjeto, getSecretarias, getConvenios } from '@/services/api'
import type {
  ProjetoRecord,
  ProjetoStatus,
  ContratoVinculadoTipo,
  SecretariaRecord,
  ConvenioRecord,
} from '@/types'
import { Loader2 } from 'lucide-react'
import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '@/lib/masks'
import { formatBRL } from '@/components/StatusBadge'

interface ModalProjetoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  projetoToEdit?: ProjetoRecord | null
  defaultSecretariaId?: string
  defaultConvenioId?: string
}

export function ModalProjeto({
  open,
  onClose,
  onSuccess,
  projetoToEdit,
  defaultSecretariaId,
  defaultConvenioId,
}: ModalProjetoProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorTotal, setValorTotal] = useState<string>('')
  const [status, setStatus] = useState<ProjetoStatus>('ativo')
  const [contratosVinculados, setContratosVinculados] = useState<ContratoVinculadoTipo[]>(['CLT'])
  const [parceiro, setParceiro] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [secretariaId, setSecretariaId] = useState('')
  const [convenioId, setConvenioId] = useState('')
  const [valorMensalExecucao, setValorMensalExecucao] = useState<string>('')
  const [valorMensalDespesasAdm, setValorMensalDespesasAdm] = useState<string>('')
  const [mesesDuracao, setMesesDuracao] = useState<number | string>('6')
  const [secretariasList, setSecretariasList] = useState<SecretariaRecord[]>([])
  const [conveniosList, setConveniosList] = useState<ConvenioRecord[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSecretarias().then(setSecretariasList).catch(console.error)
    getConvenios().then(setConveniosList).catch(console.error)
  }, [])

  useEffect(() => {
    if (projetoToEdit) {
      setNome(projetoToEdit.nome || '')
      setDescricao(projetoToEdit.descricao || '')
      setValorTotal(
        projetoToEdit.valor_total !== undefined && projetoToEdit.valor_total !== null
          ? formatCurrencyBRL(projetoToEdit.valor_total)
          : '',
      )
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
      setSecretariaId(projetoToEdit.secretaria_id || defaultSecretariaId || '')
      setConvenioId(projetoToEdit.convenio_id || defaultConvenioId || '')
      setValorMensalExecucao(
        projetoToEdit.valor_mensal_execucao !== undefined &&
          projetoToEdit.valor_mensal_execucao !== null
          ? formatCurrencyBRL(projetoToEdit.valor_mensal_execucao)
          : '',
      )
      setValorMensalDespesasAdm(
        projetoToEdit.valor_mensal_despesas_adm !== undefined &&
          projetoToEdit.valor_mensal_despesas_adm !== null
          ? formatCurrencyBRL(projetoToEdit.valor_mensal_despesas_adm)
          : '',
      )
      setMesesDuracao(projetoToEdit.meses_duracao || 6)
    } else {
      setNome('')
      setDescricao('')
      setValorTotal('')
      setStatus('ativo')
      setContratosVinculados(['CLT', 'PJ'])
      setParceiro('')
      setDataInicio(new Date().toISOString().split('T')[0])
      setDataFim('')
      setSecretariaId(defaultSecretariaId || '')
      setConvenioId(defaultConvenioId || '')
      setValorMensalExecucao('')
      setValorMensalDespesasAdm('')
      setMesesDuracao(6)
    }
    setErrors({})
  }, [projetoToEdit, defaultSecretariaId, defaultConvenioId, open])

  // Recalcula valor total automático quando preenche execução mensal, despesas adm e meses
  const handleRecalcularTotal = (vExecStr: string, vAdmStr: string, meses: number | string) => {
    const e = parseCurrencyBRL(vExecStr)
    const a = parseCurrencyBRL(vAdmStr)
    const m = Number(meses) || 1
    if (e > 0 || a > 0) {
      setValorTotal(formatCurrencyBRL((e + a) * m))
    }
  }

  const toggleContrato = (tipo: ContratoVinculadoTipo) => {
    setContratosVinculados((prev) => {
      if (prev.includes(tipo)) {
        return prev.filter((item) => item !== tipo)
      } else {
        return [...prev, tipo]
      }
    })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome do projeto é obrigatório.'
    const numTotal = parseCurrencyBRL(valorTotal)
    if (!valorTotal || isNaN(numTotal) || numTotal <= 0) {
      errs.valorTotal = 'Informe um valor total válido.'
    }
    if (contratosVinculados.length === 0) {
      errs.contratosVinculados = 'Selecione ao menos um tipo de contrato (CLT ou PJ).'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const numTotal = parseCurrencyBRL(valorTotal)
    const numExec = valorMensalExecucao ? parseCurrencyBRL(valorMensalExecucao) : undefined
    const numAdm = valorMensalDespesasAdm ? parseCurrencyBRL(valorMensalDespesasAdm) : undefined

    setLoading(true)
    try {
      const payload: Partial<ProjetoRecord> = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        valor_total: numTotal,
        status,
        contratos_vinculados: contratosVinculados,
        parceiro: parceiro.trim() || undefined,
        secretaria_id: secretariaId || undefined,
        convenio_id: convenioId || undefined,
        valor_mensal_execucao: numExec,
        valor_mensal_despesas_adm: numAdm,
        meses_duracao: mesesDuracao ? Number(mesesDuracao) : undefined,
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

          {/* Secretaria Vinculada e Instrumento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="secretariaId" className="text-xs font-semibold text-[#1E293B]">
                Secretaria Responsável
              </Label>
              <Select
                value={secretariaId}
                onValueChange={(val) => {
                  setSecretariaId(val)
                  const sec = secretariasList.find((s) => s.id === val)
                  if (sec?.convenio_id && !convenioId) {
                    setConvenioId(sec.convenio_id)
                  }
                }}
              >
                <SelectTrigger id="secretariaId">
                  <SelectValue placeholder="Selecione a Secretaria" />
                </SelectTrigger>
                <SelectContent>
                  {secretariasList.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>
                      {sec.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="convenioId" className="text-xs font-semibold text-[#1E293B]">
                Instrumento / Termo Vinculado
              </Label>
              <Select value={convenioId} onValueChange={setConvenioId}>
                <SelectTrigger id="convenioId">
                  <SelectValue placeholder="Selecione o Instrumento" />
                </SelectTrigger>
                <SelectContent>
                  {conveniosList.map((conv) => (
                    <SelectItem key={conv.id} value={conv.id}>
                      {conv.numero_instrumento} - {conv.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custos Mensais: Execução Direta, Despesas Administrativas e Valor Total */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-xs font-bold text-[#1E293B] block">
              Formação de Custo do Projeto (Mensal & Total)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="valorMensalExecucao"
                  className="text-[11px] font-semibold text-[#475569]"
                >
                  Execução Direta Mensal
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#64748B]">
                    R$
                  </span>
                  <Input
                    id="valorMensalExecucao"
                    type="text"
                    inputMode="numeric"
                    value={valorMensalExecucao}
                    onChange={(e) => {
                      const masked = maskCurrency(e.target.value)
                      setValorMensalExecucao(masked)
                      handleRecalcularTotal(masked, valorMensalDespesasAdm, mesesDuracao)
                    }}
                    placeholder="0,00"
                    className="pl-8 h-9 text-xs font-semibold tabular-nums"
                  />
                </div>
                {valorMensalExecucao && parseCurrencyBRL(valorMensalExecucao) > 0 && (
                  <p className="text-[10px] text-emerald-700 font-semibold truncate">
                    {formatBRL(parseCurrencyBRL(valorMensalExecucao))}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="valorMensalDespesasAdm"
                  className="text-[11px] font-semibold text-[#475569]"
                >
                  Desp. Adm/Oper. Mensal
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#64748B]">
                    R$
                  </span>
                  <Input
                    id="valorMensalDespesasAdm"
                    type="text"
                    inputMode="numeric"
                    value={valorMensalDespesasAdm}
                    onChange={(e) => {
                      const masked = maskCurrency(e.target.value)
                      setValorMensalDespesasAdm(masked)
                      handleRecalcularTotal(valorMensalExecucao, masked, mesesDuracao)
                    }}
                    placeholder="0,00"
                    className="pl-8 h-9 text-xs font-semibold tabular-nums"
                  />
                </div>
                {valorMensalDespesasAdm && parseCurrencyBRL(valorMensalDespesasAdm) > 0 && (
                  <p className="text-[10px] text-emerald-700 font-semibold truncate">
                    {formatBRL(parseCurrencyBRL(valorMensalDespesasAdm))}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mesesDuracao" className="text-[11px] font-semibold text-[#475569]">
                  Meses de Execução
                </Label>
                <Input
                  id="mesesDuracao"
                  type="number"
                  min="1"
                  value={mesesDuracao}
                  onChange={(e) => {
                    setMesesDuracao(e.target.value)
                    handleRecalcularTotal(
                      valorMensalExecucao,
                      valorMensalDespesasAdm,
                      e.target.value,
                    )
                  }}
                  placeholder="6"
                  className="h-9 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="valorTotal" className="text-xs font-semibold text-[#1E293B]">
                Valor Total Global do Projeto *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                  R$
                </span>
                <Input
                  id="valorTotal"
                  type="text"
                  inputMode="numeric"
                  value={valorTotal}
                  onChange={(e) => {
                    const masked = maskCurrency(e.target.value)
                    setValorTotal(masked)
                    if (errors.valorTotal) {
                      setErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.valorTotal
                        return copy
                      })
                    }
                  }}
                  placeholder="0,00"
                  className={`pl-9 text-xs font-bold tabular-nums ${
                    errors.valorTotal ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {valorTotal && parseCurrencyBRL(valorTotal) > 0 && (
                <p className="text-[11px] text-[#64748B] flex items-center justify-between">
                  <span>Valor:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatBRL(parseCurrencyBRL(valorTotal))}
                  </span>
                </p>
              )}
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
