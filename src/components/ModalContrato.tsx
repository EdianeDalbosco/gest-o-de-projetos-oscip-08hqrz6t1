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
import {
  createContrato,
  updateContrato,
  getProjetos,
  getConvenios,
  getSecretarias,
  getCatalogoAtividades,
  getPrestadoresColaboradores,
} from '@/services/api'
import type {
  ContratoRecord,
  ContratoTipo,
  ContratoStatus,
  ContratoTipoPJ,
  ProjetoRecord,
  ConvenioRecord,
  SecretariaRecord,
  CatalogoAtividadeRecord,
  PrestadorColaboradorRecord,
} from '@/types'
import { Loader2, Building2, Building } from 'lucide-react'
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

  // Entidades para o fluxo PJ ordenado (1 a 5)
  const [convenios, setConvenios] = useState<ConvenioRecord[]>([])
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [catalogoAtividades, setCatalogoAtividades] = useState<CatalogoAtividadeRecord[]>([])
  const [prestadoresList, setPrestadoresList] = useState<PrestadorColaboradorRecord[]>([])

  // Estados específicos PJ na ordem definida
  // 1. Prestador / Razão Social
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<string>('')
  // 2. Instrumento OU Nome da Organização
  const [tipoVinculoPJ, setTipoVinculoPJ] = useState<'instrumento' | 'organizacao'>('instrumento')
  const [selectedConvenioId, setSelectedConvenioId] = useState<string>('')
  const [nomeOrganizacao, setNomeOrganizacao] = useState('ORGANIZAÇÃO DE SAÚDE SÃO BENTO')
  // 3. Se instrumento, Secretaria e Projeto
  const [secretariaIdPJ, setSecretariaIdPJ] = useState<string>('')
  // 4. Se instrumento, Atividade do catálogo Anexo I PT
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<string>('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getProjetos().then(setProjetos).catch(console.error)
      getConvenios()
        .then((convs) => {
          setConvenios(convs)
          if (convs.length > 0 && !selectedConvenioId) {
            setSelectedConvenioId(convs[0].id)
          }
        })
        .catch(console.error)
      getSecretarias().then(setSecretarias).catch(console.error)
      getCatalogoAtividades().then(setCatalogoAtividades).catch(console.error)
      getPrestadoresColaboradores().then(setPrestadoresList).catch(console.error)

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
        setSelectedPrestadorId('')
        setSecretariaIdPJ('')
        setSelectedAtividadeId('')
      }
      setErrors({})
    }
  }, [contratoToEdit, open, defaultTipo])

  // Filtra secretarias pelo instrumento
  const secretariasFiltradas =
    convenios.length > 0 && selectedConvenioId
      ? secretarias.filter((s) => s.convenio_id === selectedConvenioId)
      : secretarias

  // Filtra projetos pela secretaria selecionada
  const projetosFiltrados = secretariaIdPJ
    ? projetos.filter((p) => p.secretaria_id === secretariaIdPJ)
    : projetos

  // Filtra atividades pelo projeto selecionado
  const atividadesFiltradas =
    projetoId && projetoId !== 'none'
      ? catalogoAtividades.filter((a) => a.projeto_id === projetoId)
      : catalogoAtividades

  // Handler seleção de prestador PJ (Passo 1)
  const handleSelectPrestadorPJ = (prestId: string) => {
    setSelectedPrestadorId(prestId)
    if (!prestId || prestId === 'novo') return

    const prest = prestadoresList.find((p) => p.id === prestId)
    if (prest) {
      setNome(prest.razao_social || prest.nome_colaborador || '')
      if (prest.cargo && !cargoFuncao) {
        setCargoFuncao(prest.cargo)
      }
      if (prest.remuneracao_base && prest.remuneracao_base > 0 && !valor) {
        setValor(formatCurrencyBRL(prest.remuneracao_base))
      }
    }
  }

  // Handler seleção de secretaria (Passo 3)
  const handleSelectSecretariaPJ = (secId: string) => {
    setSecretariaIdPJ(secId)
    setProjetoId('')
    setSelectedAtividadeId('')
  }

  // Handler seleção de projeto (Passo 3)
  const handleSelectProjetoPJ = (projId: string) => {
    setProjetoId(projId)
    setSelectedAtividadeId('')
    if (projId && projId !== 'none') {
      const proj = projetos.find((p) => p.id === projId)
      if (proj) {
        // Pré-preenche valor se projeto tem custo mensal ou valor total definido
        if (proj.valor_mensal_execucao && proj.valor_mensal_execucao > 0) {
          setValor(formatCurrencyBRL(proj.valor_mensal_execucao))
        } else if (
          proj.valor_total &&
          proj.valor_total > 0 &&
          (!proj.meses_duracao || proj.meses_duracao === 1)
        ) {
          setValor(formatCurrencyBRL(proj.valor_total))
        }
      }
    }
  }

  // Handler seleção de atividade do catálogo (Passo 4 & 5)
  const handleSelectAtividadeCatalogoPJ = (atvId: string) => {
    setSelectedAtividadeId(atvId)
    if (!atvId || atvId === 'custom') return

    const atv = catalogoAtividades.find((a) => a.id === atvId)
    if (atv) {
      setCargoFuncao(atv.descricao)
      if (atv.valor_unitario && atv.valor_unitario > 0) {
        setValor(formatCurrencyBRL(atv.valor_unitario))
      }
      if (atv.detalhes_escopo) {
        setClausulas((prev) => (prev ? prev : atv.detalhes_escopo || ''))
      }
      const tipoExec = (atv.tipo_execucao || '').toLowerCase()
      if (
        tipoExec.includes('plantao') ||
        tipoExec.includes('demanda') ||
        tipoExec.includes('hora')
      ) {
        setTipoPJ('horas')
      } else {
        setTipoPJ('mensal')
      }
    }
  }

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

          {/* FLUXO CLT: Mantido intacto */}
          {tipo === 'CLT' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-semibold text-[#1E293B]">
                  Nome Completo do Colaborador *
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Mariana Silva Ramos"
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cargo" className="text-xs font-semibold text-[#1E293B]">
                    Cargo Registrado *
                  </Label>
                  <Input
                    id="cargo"
                    value={cargoFuncao}
                    onChange={(e) => setCargoFuncao(e.target.value)}
                    placeholder="Ex: Coordenadora Social"
                    className={errors.cargoFuncao ? 'border-red-500' : ''}
                  />
                  {errors.cargoFuncao && (
                    <p className="text-xs text-red-500">{errors.cargoFuncao}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="valor" className="text-xs font-semibold text-[#1E293B]">
                    Salário Base *
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
                      </span>
                    </p>
                  )}
                  {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
                </div>
              </div>

              {/* CLT Benefícios */}
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
                  placeholder="Descreva as cláusulas essenciais, obrigações e regras..."
                />
              </div>
            </div>
          ) : (
            /* FLUXO PJ: Ordem Exata Requisitada (1 → 5) */
            <div className="space-y-4">
              {/* ORDEM 1: Razão Social da Empresa */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                    Razão Social da Empresa Contratada
                  </Label>
                </div>

                {prestadoresList.filter((p) => p.tipo === 'PJ').length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-emerald-800">
                      Selecionar do cadastro (/prestadores) ou digitar:
                    </Label>
                    <Select value={selectedPrestadorId} onValueChange={handleSelectPrestadorPJ}>
                      <SelectTrigger className="bg-white text-xs h-8 border-slate-200">
                        <SelectValue placeholder="Buscar prestador já cadastrado..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">+ Digitar razão social manualmente</SelectItem>
                        {prestadoresList
                          .filter((p) => p.tipo === 'PJ')
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.razao_social} {p.cnpj ? `(${p.cnpj})` : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1">
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: MEDCLIN SERVIÇOS MÉDICOS LTDA"
                    className={`text-xs font-semibold bg-white ${errors.nome ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
                </div>
              </div>

              {/* ORDEM 2: Selecionar o Instrumento ou Nome da Organização */}
              <div
                className={`p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 transition-all ${
                  !nome.trim() ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                    Instrumento OU Nome da Organização
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoVinculoPJ('instrumento')}
                    className={`py-2 px-2.5 text-xs font-medium rounded-lg border text-left flex items-center gap-2 transition-all ${
                      tipoVinculoPJ === 'instrumento'
                        ? 'border-[#1FAF7A] bg-emerald-50 text-[#1FAF7A] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-[#64748B]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Instrumento Formal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoVinculoPJ('organizacao')
                      setSecretariaIdPJ('')
                      setProjetoId('')
                      setSelectedAtividadeId('')
                    }}
                    className={`py-2 px-2.5 text-xs font-medium rounded-lg border text-left flex items-center gap-2 transition-all ${
                      tipoVinculoPJ === 'organizacao'
                        ? 'border-[#1FAF7A] bg-emerald-50 text-[#1FAF7A] font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-[#64748B]'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span>Nome da Organização</span>
                  </button>
                </div>

                {tipoVinculoPJ === 'instrumento' ? (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-[#1E293B]">
                      Selecione o Instrumento Cadastrado:
                    </Label>
                    <Select
                      value={selectedConvenioId}
                      onValueChange={(val) => {
                        setSelectedConvenioId(val)
                        setSecretariaIdPJ('')
                        setProjetoId('')
                        setSelectedAtividadeId('')
                      }}
                    >
                      <SelectTrigger className="bg-white text-xs h-8 border-slate-200">
                        <SelectValue placeholder="Selecione o instrumento / convênio..." />
                      </SelectTrigger>
                      <SelectContent>
                        {convenios.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.numero_instrumento ? `${c.numero_instrumento} — ` : ''}
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-[#1E293B]">
                      Nome da Organização (Não Vinculado a Instrumento):
                    </Label>
                    <Input
                      value={nomeOrganizacao}
                      onChange={(e) => setNomeOrganizacao(e.target.value)}
                      placeholder="Ex: ORGANIZAÇÃO DE SAÚDE SÃO BENTO"
                      className="text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {/* ORDEM 3: Se instrumento, selecionar o projeto e sua respectiva secretaria */}
              {tipoVinculoPJ === 'instrumento' && (
                <div
                  className={`p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 transition-all ${
                    !selectedConvenioId ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-[10px] font-bold">
                      3
                    </span>
                    <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                      Secretaria e Projeto / Plano de Trabalho
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-[#1E293B]">
                        1º Secretaria do Instrumento *
                      </Label>
                      <Select value={secretariaIdPJ} onValueChange={handleSelectSecretariaPJ}>
                        <SelectTrigger className="bg-white text-xs h-8 border-slate-200">
                          <SelectValue placeholder="Selecione a secretaria..." />
                        </SelectTrigger>
                        <SelectContent>
                          {secretariasFiltradas.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-[#1E293B]">
                        2º Projeto / Plano de Trabalho desta Secretaria *
                      </Label>
                      <Select
                        value={projetoId || 'none'}
                        onValueChange={handleSelectProjetoPJ}
                        disabled={!secretariaIdPJ}
                      >
                        <SelectTrigger className="bg-white text-xs h-8 border-slate-200">
                          <SelectValue
                            placeholder={
                              !secretariaIdPJ
                                ? 'Selecione primeiro a secretaria acima...'
                                : 'Selecione o projeto vinculado...'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecione o projeto...</SelectItem>
                          {projetosFiltrados.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDEM 4: Selecionar as atividades se instrumento ou digitar se contrato não vinculado */}
              <div
                className={`p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 transition-all ${
                  tipoVinculoPJ === 'instrumento' &&
                  (!secretariaIdPJ || !projetoId || projetoId === 'none')
                    ? 'opacity-60 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                    Atividades / Objeto do Contrato
                  </Label>
                </div>

                {tipoVinculoPJ === 'instrumento' ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-sky-900">
                        Catálogo de Atividades do Projeto (Anexo I PT):
                      </Label>
                      <Select
                        value={selectedAtividadeId}
                        onValueChange={handleSelectAtividadeCatalogoPJ}
                      >
                        <SelectTrigger className="bg-white text-xs h-8 border-slate-200">
                          <SelectValue placeholder="Selecione a atividade prevista no plano de trabalho..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">+ Digitar atividade livremente</SelectItem>
                          {atividadesFiltradas.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.descricao} {a.tipo_execucao ? `(${a.tipo_execucao})` : ''} —{' '}
                              {formatBRL(a.valor_unitario)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="cargo" className="text-[11px] font-medium text-[#1E293B]">
                        Título / Descrição da Atividade *
                      </Label>
                      <Input
                        id="cargo"
                        value={cargoFuncao}
                        onChange={(e) => setCargoFuncao(e.target.value)}
                        placeholder="Ex: Serviços Médicos Especializados"
                        className={`text-xs bg-white ${errors.cargoFuncao ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.cargoFuncao && (
                        <p className="text-xs text-red-500">{errors.cargoFuncao}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="cargo" className="text-[11px] font-medium text-[#1E293B]">
                        Objeto / Descrição das Atividades *
                      </Label>
                      <Input
                        id="cargo"
                        value={cargoFuncao}
                        onChange={(e) => setCargoFuncao(e.target.value)}
                        placeholder="Digite livremente a atividade / escopo contratado..."
                        className={`text-xs bg-white ${errors.cargoFuncao ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.cargoFuncao && (
                        <p className="text-xs text-red-500">{errors.cargoFuncao}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ORDEM 5: Se vinculado a instrumento, valor pré-definido / manual livre se não vinculado */}
              <div
                className={`p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3 transition-all ${
                  !cargoFuncao.trim() ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-[10px] font-bold">
                      5
                    </span>
                    <Label className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                      Valor do Contrato
                    </Label>
                  </div>
                  {tipoVinculoPJ === 'instrumento' && valor && parseCurrencyBRL(valor) > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Pré-preenchido do plano
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="valor" className="text-[11px] font-medium text-[#1E293B]">
                      {tipoPJ === 'horas' ? 'Valor por Plantão / Hora *' : 'Valor Mensal Base *'}
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
                        className={`pl-9 text-xs font-bold bg-white tabular-nums ${
                          errors.valor ? 'border-red-500' : ''
                        }`}
                        required
                      />
                    </div>
                    {errors.valor && <p className="text-xs text-red-500">{errors.valor}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-[#1E293B]">
                      Modalidade de Cobrança
                    </Label>
                    <Select value={tipoPJ} onValueChange={(v) => setTipoPJ(v as ContratoTipoPJ)}>
                      <SelectTrigger className="bg-white text-xs h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal Fixo</SelectItem>
                        <SelectItem value="horas">Plantão / Por Hora / Demanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {valor && parseCurrencyBRL(valor) > 0 && (
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Valor total formatado: <strong>{formatBRL(parseCurrencyBRL(valor))}</strong>
                  </p>
                )}
              </div>

              {/* Vigência e Datas Comuns */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="dataInicio" className="text-xs font-semibold text-[#1E293B]">
                    Data de Início *
                  </Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="text-xs"
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
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-semibold text-[#1E293B]">
                    Status do Contrato
                  </Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as ContratoStatus)}>
                    <SelectTrigger id="status" className="text-xs h-9">
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
                  <Label htmlFor="clausulas" className="text-xs font-semibold text-[#1E293B]">
                    Observações / Cláusulas
                  </Label>
                  <Input
                    id="clausulas"
                    value={clausulas}
                    onChange={(e) => setClausulas(e.target.value)}
                    placeholder="Observações do contrato..."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}

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
