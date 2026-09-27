import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FileSignature,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Building2,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  ShieldAlert,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContrato, getProjetos } from '@/services/api'
import { formatBRL, formatDateBR } from '@/components/StatusBadge'
import type { ContratoTipo, ContratoTipoPJ, ProjetoRecord } from '@/types'

const STEPS = [
  { id: 1, title: 'Tipo de Regime' },
  { id: 2, title: 'Dados & Cláusulas' },
  { id: 3, title: 'Revisão Jurídica' },
  { id: 4, title: 'Salvar & Exportar' },
]

export default function ElaborarContrato() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Regime
  const [tipo, setTipo] = useState<ContratoTipo>('PJ')

  // Step 2: Form Dados
  const [nome, setNome] = useState('')
  const [cargoFuncao, setCargoFuncao] = useState('')
  const [documentoId, setDocumentoId] = useState('') // CPF ou CNPJ
  const [valor, setValor] = useState<number | string>('')
  const [tipoPJ, setTipoPJ] = useState<ContratoTipoPJ>('horas')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [dataFim, setDataFim] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])

  // Cláusulas opcionais a incluir
  const [clausulaObjeto, setClausulaObjeto] = useState(true)
  const [clausulaSigilo, setClausulaSigilo] = useState(true)
  const [clausulaRescisao, setClausulaRescisao] = useState(true)
  const [clausulaPropriedade, setClausulaPropriedade] = useState(true)
  const [textoPersonalizado, setTextoPersonalizado] = useState('')

  // State Step 4
  const [salvando, setSalvando] = useState(false)
  const [contratoSalvoId, setContratoSalvoId] = useState<string | null>(null)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  useEffect(() => {
    getProjetos().then(setProjetos).catch(console.error)
  }, [])

  const selectedProjeto = projetos.find((p) => p.id === projetoId)

  // Gerador de texto formal do contrato
  const gerarTextoContrato = () => {
    const valorFormatado = formatBRL(Number(valor) || 0)
    const tipoRemun =
      tipo === 'CLT'
        ? `mensais brutos, sob regime da CLT, com retenções legais aplicáveis.`
        : tipoPJ === 'horas'
          ? `por hora de dedicação técnica efetivamente validada em relatório de atividades.`
          : `mensais pelo conjunto dos serviços entregues.`

    let clauses = []
    let clauseNum = 1

    if (clausulaObjeto) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DO OBJETO E ESCOPO:\nO presente instrumento tem por objeto a prestação de serviços técnicos especializados e execução das atividades correspondentes à função de ${cargoFuncao || '[CARGO/FUNÇÃO]'}, visando atender às metas institucionais e aos projetos executados pela ORGANIZAÇÃO SOCIAL CONTRATANTE${selectedProjeto ? ` (com vinculação especial ao projeto: ${selectedProjeto.nome})` : ''}.`,
      )
      clauseNum++
    }

    clauses.push(
      `CLÁUSULA ${clauseNum}ª — DA REMUNERAÇÃO:\nPela prestação dos serviços convencionados, a CONTRATANTE pagará ao CONTRATADO o montante de ${valorFormatado} (${tipoRemun}).`,
    )
    clauseNum++

    clauses.push(
      `CLÁUSULA ${clauseNum}ª — DO PRAZO E VIGÊNCIA:\nO presente contrato vigorará a partir de ${formatDateBR(dataInicio)}${dataFim ? ` com término previsto em ${formatDateBR(dataFim)}` : ', por prazo indeterminado'}, podendo ser prorrogado mediante termo aditivo formal assinado por ambas as partes.`,
    )
    clauseNum++

    if (clausulaSigilo) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DO SIGILO E CONFIDENCIALIDADE (LGPD):\nO CONTRATADO compromete-se a guardar absoluto segredo e sigilo sobre todos os dados dos assistidos e rotinas internas da CONTRATANTE, observando rigorosamente as diretrizes da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).`,
      )
      clauseNum++
    }

    if (clausulaPropriedade) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DOS DIREITOS AUTORAIS E PROPRIEDADE INTELECTUAL:\nToda produção intelectual, materiais didáticos, relatórios técnicos e metodologias concebidas no âmbito deste instrumento pertencerão exclusivamente à CONTRATANTE, para fins não lucrativos.`,
      )
      clauseNum++
    }

    if (clausulaRescisao) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DA RESCISÃO CONTRATUAL:\nO contrato poderá ser rescindido a qualquer tempo, sem ônus indenizatório suplementar além dos serviços devidamente executados, mediante comunicação prévia escrita com antecedência mínima de 30 (trinta) dias.`,
      )
      clauseNum++
    }

    if (textoPersonalizado.trim()) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DISPOSIÇÕES ESPECÍFICAS:\n${textoPersonalizado.trim()}`,
      )
    }

    const docText = `========================================================================
INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS E COOPERAÇÃO
========================================================================

Pelo presente instrumento particular, de um lado:
CONTRATANTE: ONG GESTÃO SOCIAL & DESENVOLVIMENTO COMUNITÁRIO, associação sem fins lucrativos, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede nesta cidade.

E de outro lado:
CONTRATADO: ${nome || '[NOME COMPLETO OU RAZÃO SOCIAL]'}, portador do documento CPF/CNPJ nº ${documentoId || '[DOCUMENTO REGISTRADO]'}, doravante denominado simplesmente CONTRATADO.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato, que se regerá pelas seguintes cláusulas e condições:

${clauses.join('\n\n')}

E, por estarem justos e contratados, firmam o presente instrumento em 2 (duas) vias de igual teor e forma na presença das testemunhas instrumentárias.

Data de Formalização: ${formatDateBR(dataInicio)}

_________________________________________          _________________________________________
CONTRATANTE: ONG GESTÃO SOCIAL                     CONTRATADO: ${nome || '[CONTRATADO]'}
`
    return docText
  }

  const handleSalvarContrato = async () => {
    setSalvando(true)
    setErroSalvar(null)
    try {
      const text = gerarTextoContrato()
      const rec = await createContrato({
        tipo,
        nome: nome.trim(),
        cargo_funcao: cargoFuncao.trim(),
        valor: Number(valor) || 0,
        tipo_pj: tipo === 'PJ' ? tipoPJ : undefined,
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: dataFim ? new Date(dataFim).toISOString() : undefined,
        status: 'ativo',
        beneficios: tipo === 'CLT' ? ['VT', 'VA'] : undefined,
        clausulas: text,
        projeto_id: projetoId && projetoId !== 'none' ? projetoId : undefined,
      })

      setContratoSalvoId(rec.id)
    } catch (err: unknown) {
      setErroSalvar(err instanceof Error ? err.message : 'Falha ao salvar contrato no sistema.')
    } finally {
      setSalvando(false)
    }
  }

  const handleExportTxt = () => {
    const text = gerarTextoContrato()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Contrato_${tipo}_${(nome || 'Elaborado').replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link to="/contratos" className="hover:text-[#1FAF7A] inline-flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Contratos
            </Link>
            <span>/</span>
            <span className="text-[#1E293B]">Novo Instrumento Jurídico</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            Elaboração Guiada de Contratos
          </h2>
          <p className="text-xs text-[#64748B]">
            Assistente com geração automática de cláusulas para vínculos CLT e prestadores PJ.
          </p>
        </div>
      </div>

      {/* Progress Wizard (4 Passos com numeração animada) */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id
            const isCurrent = currentStep === step.id
            return (
              <div
                key={step.id}
                className="flex items-center gap-2 text-xs font-semibold cursor-pointer"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id)
                }}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 transition-all ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-700 font-bold'
                      : isCurrent
                        ? 'bg-[#1FAF7A] text-white shadow-md shadow-[#1FAF7A]/30 scale-105'
                        : 'bg-slate-100 text-[#94A3B8]'
                  }`}
                >
                  {isDone ? '✓' : step.id}
                </div>
                <span
                  className={`hidden sm:inline truncate ${
                    isCurrent ? 'text-[#1E293B]' : 'text-[#64748B]'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-[#1FAF7A] transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* PASSO 1: TIPO DE REGIME */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#1E293B]">
            Passo 1 — Selecione a modalidade do contrato
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setTipo('PJ')}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                tipo === 'PJ'
                  ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-md shadow-[#1FAF7A]/15'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#1E293B]">Prestador PJ (Pessoa Jurídica)</h4>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Contrato de prestação de serviços com emissão de nota fiscal, faturamento por horas
                ou fee mensal e sem vínculo empregatício.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#1FAF7A]">
                {tipo === 'PJ' ? '✓ Selecionado' : 'Selecionar PJ'}
              </div>
            </div>

            <div
              onClick={() => setTipo('CLT')}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                tipo === 'CLT'
                  ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-md shadow-[#1FAF7A]/15'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#1E293B]">Colaborador CLT (Empregado)</h4>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Vínculo formal de trabalho com anotação em CTPS, jornada de 40h semanais,
                recolhimentos previdenciários e concessão de benefícios.
              </p>
              <div className="mt-4 flex items-center text-xs font-semibold text-[#1FAF7A]">
                {tipo === 'CLT' ? '✓ Selecionado' : 'Selecionar CLT'}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setCurrentStep(2)}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
            >
              Próximo: Informações do Contrato
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASSO 2: DADOS & CLÁUSULAS */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-5">
          <h3 className="text-base font-bold text-[#1E293B]">
            Passo 2 — Dados do Contratado e Cláusulas
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">
                {tipo === 'CLT' ? 'Nome do Colaborador *' : 'Razão Social / Nome Fantasia *'}
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva / Silva Treinamentos ME"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">
                {tipo === 'CLT' ? 'CPF do Titular' : 'CNPJ / CPF do Prestador'}
              </Label>
              <Input
                value={documentoId}
                onChange={(e) => setDocumentoId(e.target.value)}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">
                Função / Cargo Técnico *
              </Label>
              <Input
                value={cargoFuncao}
                onChange={(e) => setCargoFuncao(e.target.value)}
                placeholder="Ex: Instrutor de Robótica"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">
                {tipo === 'CLT'
                  ? 'Salário Bruto (R$) *'
                  : tipoPJ === 'horas'
                    ? 'Valor / Hora (R$) *'
                    : 'Valor Mensal (R$) *'}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {tipo === 'PJ' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">Regra de Cobrança PJ</Label>
                <Select value={tipoPJ} onValueChange={(v) => setTipoPJ(v as ContratoTipoPJ)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horas">Por Hora Efetiva</SelectItem>
                    <SelectItem value="mensal">Fee Mensal Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {tipo === 'CLT' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">Jornada Semanal</Label>
                <Input value="40 horas semanais" disabled className="bg-slate-50 text-xs" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Data de Início *</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Data Prevista Término</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Vínculo com Projeto</Label>
              <Select value={projetoId || 'none'} onValueChange={setProjetoId}>
                <SelectTrigger className="text-xs">
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

          {/* Cláusulas a Incluir */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <Label className="text-xs font-bold text-[#1E293B] block">
              Selecione as Cláusulas Padronizadas a Incluir:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="c1"
                  checked={clausulaObjeto}
                  onCheckedChange={(c) => setClausulaObjeto(Boolean(c))}
                />
                <label htmlFor="c1" className="cursor-pointer text-[#1E293B]">
                  Cláusula de Objeto e Metas Sociais
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="c2"
                  checked={clausulaSigilo}
                  onCheckedChange={(c) => setClausulaSigilo(Boolean(c))}
                />
                <label htmlFor="c2" className="cursor-pointer text-[#1E293B]">
                  Cláusula de Confidencialidade e LGPD
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="c3"
                  checked={clausulaPropriedade}
                  onCheckedChange={(c) => setClausulaPropriedade(Boolean(c))}
                />
                <label htmlFor="c3" className="cursor-pointer text-[#1E293B]">
                  Propriedade Intelectual em favor da ONG
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="c4"
                  checked={clausulaRescisao}
                  onCheckedChange={(c) => setClausulaRescisao(Boolean(c))}
                />
                <label htmlFor="c4" className="cursor-pointer text-[#1E293B]">
                  Regras de Rescisão com aviso de 30 dias
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold text-[#1E293B]">
              Cláusula Extra ou Requisitos Especiais (Opcional)
            </Label>
            <Textarea
              rows={2}
              value={textoPersonalizado}
              onChange={(e) => setTextoPersonalizado(e.target.value)}
              placeholder="Adicione termos de seguro, deslocamentos, prestação de contas..."
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Voltar
            </Button>
            <Button
              size="sm"
              disabled={!nome.trim() || !cargoFuncao.trim()}
              onClick={() => setCurrentStep(3)}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
            >
              Visualizar Prévia do Instrumento
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASSO 3: REVISÃO JURÍDICA (Preview estilo papel) */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1E293B]">
              Passo 3 — Prévia do Documento Oficial
            </h3>
            <span className="text-xs text-[#64748B]">Layout formal em padrão juramentado</span>
          </div>

          {/* Paper View Card */}
          <div className="bg-[#FEFEFE] border border-slate-300 rounded-xl p-8 sm:p-12 shadow-lg font-serif text-[#1E293B] max-h-[500px] overflow-y-auto leading-relaxed text-xs sm:text-sm whitespace-pre-wrap select-text">
            {gerarTextoContrato()}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Editar Dados
            </Button>

            <Button
              size="sm"
              onClick={() => {
                setCurrentStep(4)
                handleSalvarContrato()
              }}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
            >
              Aprovar & Salvar Contrato
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASSO 4: SALVAR / EXPORTAR */}
      {currentStep === 4 && (
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm text-center space-y-6">
          {salvando ? (
            <div className="py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-[#1FAF7A] animate-spin mx-auto" />
              <h3 className="text-base font-bold text-[#1E293B]">
                Persistindo contrato no banco de dados...
              </h3>
              <p className="text-xs text-[#64748B]">
                Registrando instrumento formal e vinculações de projeto.
              </p>
            </div>
          ) : erroSalvar ? (
            <div className="py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-red-700">Erro ao persistir contrato</h3>
              <p className="text-xs text-[#64748B]">{erroSalvar}</p>
              <Button onClick={handleSalvarContrato} variant="outline" size="sm">
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#10B981] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-[#1E293B]">
                  Contrato Elaborado com Sucesso!
                </h3>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  O contrato com <strong className="text-[#1E293B]">{nome}</strong> ({tipo}) foi
                  registrado na base de dados institucional e já está disponível para consulta.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  onClick={handleExportTxt}
                  className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold px-6"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Arquivo (.txt)
                </Button>

                <Button asChild variant="outline" className="text-xs font-semibold px-6">
                  <Link to="/contratos">Ver Lista de Contratos</Link>
                </Button>

                {contratoSalvoId && (
                  <Button asChild variant="ghost" className="text-xs text-[#1FAF7A]">
                    <Link to={`/contratos/${contratoSalvoId}`}>Abrir Detalhes</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
