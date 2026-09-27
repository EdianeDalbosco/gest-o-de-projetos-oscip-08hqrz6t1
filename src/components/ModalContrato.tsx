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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContrato, updateContrato, getProjetos } from '@/services/api'
import type {
  ContratoRecord,
  ContratoTipo,
  ContratoStatus,
  ContratoTipoPJ,
  ProjetoRecord,
} from '@/types'
import { Loader2 } from 'lucide-react'
import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '@/lib/masks'
import { formatBRL } from '@/components/StatusBadge'

interface ModalContratoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contratoToEdit?: ContratoRecord | null
  defaultTipo?: ContratoTipo
}

const BENEFICIOS_LIST = ['VT', 'VA', 'PLR', 'Seguro', 'Outros']

export function ModalContrato({
  open,
  onClose,
  onSuccess,
  contratoToEdit,
  defaultTipo = 'CLT',
}: ModalContratoProps) {
  const [tipo, setTipo] = useState<ContratoTipo>(defaultTipo)
  const [nome, setNome] = useState('')
  const [cargoFuncao, setCargoFuncao] = useState('')
  const [valor, setValor] = useState<string>('')
  const [tipoPJ, setTipoPJ] = useState<ContratoTipoPJ>('horas')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState('')
  const [status, setStatus] = useState<ContratoStatus>('ativo')
  const [beneficios, setBeneficios] = useState<string[]>([])
  const [clausulas, setClausulas] = useState('')
  const [projetoId, setProjetoId] = useState('')

  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getProjetos().then(setProjetos).catch(console.error)

      if (contratoToEdit) {
        setTipo(contratoToEdit.tipo)
        setNome(contratoToEdit.nome || '')
        setCargoFuncao(contratoToEdit.cargo_funcao || '')
        setValor(
          contratoToEdit.valor !== undefined && contratoToEdit.valor !== null
            ? formatCurrencyBRL(contratoToEdit.valor)
            : '',
        )
        setTipoPJ(contratoToEdit.tipo_pj || 'horas')
        setDataInicio(
          contratoToEdit.data_inicio
            ? contratoToEdit.data_inicio.split('T')[0]
            : new Date().toISOString().split('T')[0],
        )
        setDataFim(contratoToEdit.data_fim ? contratoToEdit.data_fim.split('T')[0] : '')
        setStatus(contratoToEdit.status || 'ativo')
        setBeneficios(contratoToEdit.beneficios || [])
        setClausulas(contratoToEdit.clausulas || '')
        setProjetoId(contratoToEdit.projeto_id || '')
      } else {
        setTipo(defaultTipo)
        setNome('')
        setCargoFuncao('')
        setValor('')
        setTipoPJ('horas')
        setDataInicio(new Date().toISOString().split('T')[0])
        setDataFim('')
        setStatus('ativo')
        setBeneficios(defaultTipo === 'CLT' ? ['VT', 'VA'] : [])
        setClausulas('')
        setProjetoId('')
      }
      setErrors({})
    }
  }, [contratoToEdit, open, defaultTipo])

  const toggleBeneficio = (ben: string) => {
    if (beneficios.includes(ben)) {
      setBeneficios(beneficios.filter((b) => b !== ben))
    } else {
      setBeneficios([...beneficios, ben])
    }
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome do colaborador ou razão social PJ é obrigatório.'
    if (!cargoFuncao.trim()) errs.cargoFuncao = 'Cargo ou função técnica é obrigatório.'
    const numValor = parseCurrencyBRL(valor)
    if (!valor || isNaN(numValor) || numValor <= 0) {
      errs.valor = 'Informe um valor financeiro válido.'
    }
    if (!dataInicio) errs.dataInicio = 'Data de início é obrigatória.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const numValor = parseCurrencyBRL(valor)

    setLoading(true)
    try {
      const payload: Partial<ContratoRecord> = {
        tipo,
        nome: nome.trim(),
        cargo_funcao: cargoFuncao.trim(),
        valor: numValor,
        tipo_pj: tipo === 'PJ' ? tipoPJ : undefined,
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: dataFim ? new Date(dataFim).toISOString() : undefined,
        status,
        beneficios: tipo === 'CLT' ? beneficios : undefined,
        clausulas: clausulas.trim() || undefined,
        projeto_id: projetoId && projetoId !== 'none' ? projetoId : undefined,
      }

      if (contratoToEdit) {
        await updateContrato(contratoToEdit.id, payload)
      } else {
        await createContrato(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar contrato.'
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
            {contratoToEdit ? 'Editar Contrato' : `Novo Contrato (${tipo})`}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            {tipo === 'CLT'
              ? 'Cadastro de colaborador registrado com benefícios trabalhistas.'
              : 'Cadastro de fornecedor PJ, prestação de serviços técnicos e horas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          {/* Seletor de Tipo (CLT ou PJ) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1E293B]">Regime Contratual</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('CLT')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                  tipo === 'CLT'
                    ? 'border-[#1FAF7A] bg-[#1FAF7A]/10 text-[#1FAF7A]'
                    : 'border-slate-200 text-[#64748B] hover:bg-slate-50'
                }`}
              >
                CLT (Colaborador Direto)
              </button>
              <button
                type="button"
                onClick={() => setTipo('PJ')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                  tipo === 'PJ'
                    ? 'border-[#1FAF7A] bg-[#1FAF7A]/10 text-[#1FAF7A]'
                    : 'border-slate-200 text-[#64748B] hover:bg-slate-50'
                }`}
              >
                PJ (Pessoa Jurídica / Fornecedor)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-xs font-semibold text-[#1E293B]">
              {tipo === 'CLT'
                ? 'Nome Completo do Colaborador *'
                : 'Razão Social / Nome do Prestador PJ *'}
            </Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={
                tipo === 'CLT' ? 'Ex: Mariana Silva Ramos' : 'Ex: Consultoria Médica LTDA'
              }
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cargo" className="text-xs font-semibold text-[#1E293B]">
                {tipo === 'CLT' ? 'Cargo Registrado *' : 'Função Técnica / Especialidade *'}
              </Label>
              <Input
                id="cargo"
                value={cargoFuncao}
                onChange={(e) => setCargoFuncao(e.target.value)}
                placeholder={tipo === 'CLT' ? 'Ex: Coordenadora Social' : 'Ex: Instrutor de TI'}
                className={errors.cargoFuncao ? 'border-red-500' : ''}
              />
              {errors.cargoFuncao && <p className="text-xs text-red-500">{errors.cargoFuncao}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="valor" className="text-xs font-semibold text-[#1E293B]">
                {tipo === 'CLT'
                  ? 'Salário Base *'
                  : tipoPJ === 'horas'
                    ? 'Valor por Hora *'
                    : 'Valor Mensal Fechado *'}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                  R$
                </span>
                <Input
                  id="valor"
                  type="text"
                  inputMode="numeric"
                  value={valor}
                  onChange={(e) => {
                    const masked = maskCurrency(e.target.value)
                    setValor(masked)
                    if (errors.valor) {
                      setErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.valor
                        return copy
                      })
                    }
                  }}
                  placeholder="0,00"
                  className={`pl-9 text-xs font-semibold tabular-nums ${
                    errors.valor ? 'border-red-500' : ''
                  }`}
                />
              </div>
              {valor && parseCurrencyBRL(valor) > 0 && (
                <p className="text-[11px] text-[#64748B] flex items-center justify-between">
                  <span>Valor:</span>
                  <span className="font-semibold text-emerald-700">
                    {formatBRL(parseCurrencyBRL(valor))}
                    {tipo === 'PJ' && tipoPJ === 'horas' ? '/h' : ''}
                  </span>
                </p>
              )}
              {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
            </div>
          </div>

          {/* PJ Specific Type */}
          {tipo === 'PJ' && (
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <Label className="text-xs font-semibold text-[#1E293B]">
                Modalidade de Pagamento PJ
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_pj"
                    value="horas"
                    checked={tipoPJ === 'horas'}
                    onChange={() => setTipoPJ('horas')}
                    className="text-[#1FAF7A]"
                  />
                  <span>Por Hora Trabalhada (mediante aprovação)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_pj"
                    value="mensal"
                    checked={tipoPJ === 'mensal'}
                    onChange={() => setTipoPJ('mensal')}
                    className="text-[#1FAF7A]"
                  />
                  <span>Valor Fixo Mensal</span>
                </label>
              </div>
            </div>
          )}

          {/* CLT Benefícios */}
          {tipo === 'CLT' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">
                Benefícios Concedidos (Multiseleção)
              </Label>
              <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                {BENEFICIOS_LIST.map((b) => (
                  <div key={b} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`ben-${b}`}
                      checked={beneficios.includes(b)}
                      onCheckedChange={() => toggleBeneficio(b)}
                    />
                    <label
                      htmlFor={`ben-${b}`}
                      className="text-xs font-medium text-[#1E293B] cursor-pointer"
                    >
                      {b}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dataInicio" className="text-xs font-semibold text-[#1E293B]">
                Data de Início *
              </Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataFim" className="text-xs font-semibold text-[#1E293B]">
                Término do Contrato
              </Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                placeholder="Indeterminado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold text-[#1E293B]">
                Status do Contrato
              </Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContratoStatus)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vencendo">Vencendo</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="projetoId" className="text-xs font-semibold text-[#1E293B]">
                Vincular ao Projeto Social
              </Label>
              <Select value={projetoId || 'none'} onValueChange={setProjetoId}>
                <SelectTrigger id="projetoId">
                  <SelectValue placeholder="Selecione o projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geral / Não vinculado</SelectItem>
                  {projetos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="clausulas" className="text-xs font-semibold text-[#1E293B]">
              Cláusulas Especiais & Objeto Contratual
            </Label>
            <Textarea
              id="clausulas"
              rows={3}
              value={clausulas}
              onChange={(e) => setClausulas(e.target.value)}
              placeholder="Descreva as cláusulas essenciais, obrigações e regras de reajuste..."
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
              {contratoToEdit ? 'Atualizar Contrato' : 'Cadastrar Contrato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
