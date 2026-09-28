import React, { useState, useEffect, useMemo } from 'react'
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
  Plus,
  Trash2,
  Printer,
  FileText,
  Info,
  Check,
  Building,
  FileSpreadsheet,
  Upload,
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
import {
  createContrato,
  getProjetos,
  getConvenios,
  getSecretarias,
  getPrestadoresColaboradores,
  getCatalogoAtividades,
  createPrestadorColaborador,
} from '@/services/api'
import { formatBRL, formatDateBR } from '@/components/StatusBadge'
import { valorPorExtenso } from '@/lib/extenso'
import { maskCnpj, maskCpf, maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '@/lib/masks'
import {
  ModeloContratoPJ,
  DadosContratoPJ,
  ItemAdicionalContrato,
  EnquadramentoTributario,
  DADOS_CONTRATANTE,
  METADADOS_MODELOS,
  gerarTextoContratoPJ,
  gerarHtmlContratoPJ,
  exportarContratoComoDoc,
  exportarContratoComoTxt,
  imprimirOuExportarPdfContrato,
} from '@/lib/modelosContratoPJ'
import type {
  ContratoTipo,
  ContratoTipoPJ,
  ProjetoRecord,
  ConvenioRecord,
  SecretariaRecord,
  PrestadorColaboradorRecord,
  CatalogoAtividadeRecord,
} from '@/types'
import * as XLSX from 'xlsx'

const STEPS = [
  { id: 1, title: 'Regime & Modelo' },
  { id: 2, title: 'Dados do Contrato' },
  { id: 3, title: 'Revisão Jurídica' },
  { id: 4, title: 'Salvar & Exportar' },
]

export default function ElaborarContrato() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: Regime e Modelo PJ
  const [tipo, setTipo] = useState<ContratoTipo>('PJ')
  const [modeloPJ, setModeloPJ] = useState<ModeloContratoPJ>('mensal_plantao')

  // Listas de apoio
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [convenios, setConvenios] = useState<ConvenioRecord[]>([])
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [prestadoresList, setPrestadoresList] = useState<PrestadorColaboradorRecord[]>([])
  const [catalogoAtividadesList, setCatalogoAtividadesList] = useState<CatalogoAtividadeRecord[]>(
    [],
  )
  const [selectedPrestadorId, setSelectedPrestadorId] = useState<string>('')
  const [selectedAtividadeId, setSelectedAtividadeId] = useState<string>('')

  // Importação Excel
  const [importandoExcel, setImportandoExcel] = useState(false)
  const [msgImportacao, setMsgImportacao] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(
    null,
  )

  // Step 2: Form Dados CLT
  const [nomeCLT, setNomeCLT] = useState('')
  const [cargoFuncaoCLT, setCargoFuncaoCLT] = useState('')
  const [documentoIdCLT, setDocumentoIdCLT] = useState('')
  const [valorCLT, setValorCLT] = useState<string>('')
  const [dataInicioCLT, setDataInicioCLT] = useState(new Date().toISOString().split('T')[0])
  const [dataFimCLT, setDataFimCLT] = useState('')
  const [projetoIdCLT, setProjetoIdCLT] = useState('')
  const [clausulaObjeto, setClausulaObjeto] = useState(true)
  const [clausulaSigilo, setClausulaSigilo] = useState(true)
  const [clausulaRescisao, setClausulaRescisao] = useState(true)
  const [clausulaPropriedade, setClausulaPropriedade] = useState(true)
  const [textoPersonalizadoCLT, setTextoPersonalizadoCLT] = useState('')

  // Step 2: Form Dados PJ
  const [razaoSocial, setRazaoSocial] = useState('')
  const [naturezaJuridica, setNaturezaJuridica] = useState('Sociedade Limitada (LTDA)')
  const [cnpj, setCnpj] = useState('')
  const [enderecoEmpresarial, setEnderecoEmpresarial] = useState('')
  const [representanteLegal, setRepresentanteLegal] = useState('')
  const [cpfRepresentante, setCpfRepresentante] = useState('')

  // Step 2 (Ordem 2): Vinculação: Instrumento OU Nome da Organização
  const [tipoVinculoPJ, setTipoVinculoPJ] = useState<'instrumento' | 'organizacao'>('instrumento')
  const [selectedConvenioId, setSelectedConvenioId] = useState<string>('')
  const [nomeOrganizacao, setNomeOrganizacao] = useState('ORGANIZAÇÃO DE SAÚDE SÃO BENTO')

  // Step 2 (Ordem 3): Se instrumento: Secretaria -> Projeto
  const [secretariaIdPJ, setSecretariaIdPJ] = useState<string>('')
  const [secretariaOrgao, setSecretariaOrgao] = useState('')
  const [projetoIdPJ, setProjetoIdPJ] = useState<string>('')
  const [projetoNome, setProjetoNome] = useState('')

  // Step 2 (Ordem 4): Atividades
  const [atividadePrincipal, setAtividadePrincipal] = useState('')
  const [descricaoEscopo, setDescricaoEscopo] = useState(
    'a execução de atendimentos técnicos especializados, emissão de laudos, participação em reuniões clínicas e cumprimento integral das metas assistenciais pactuadas.',
  )

  // Step 2 (Ordem 5): Remuneração PJ
  const [valorNumericoPJ, setValorNumericoPJ] = useState<string>(formatCurrencyBRL(5000))
  const [unidadePlantaoDemanda, setUnidadePlantaoDemanda] = useState('plantão de 12 horas')
  const [modalidadeRemuneracaoCombinada, setModalidadeRemuneracaoCombinada] = useState('mensal')

  // Itens adicionais (Modelo 1)
  const [itensAdicionais, setItensAdicionais] = useState<ItemAdicionalContrato[]>([
    {
      id: 'item-1',
      atividade: 'Plantão médico de sobreaviso / urgência 12h',
      valor: 1200,
      unidade: 'plantão de 12 horas',
    },
  ])

  // Tributação
  const [enquadramentoTributario, setEnquadramentoTributario] =
    useState<EnquadramentoTributario>('geral')

  // Vigência & Assinatura
  const [periodoVigencia, setPeriodoVigencia] = useState('12 (doze) meses')
  const [dataInicioPJ, setDataInicioPJ] = useState(new Date().toISOString().split('T')[0])
  const [dataFimPJ, setDataFimPJ] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )
  const [dataAssinatura, setDataAssinatura] = useState(new Date().toISOString().split('T')[0])

  // State Step 4
  const [salvando, setSalvando] = useState(false)
  const [contratoSalvoId, setContratoSalvoId] = useState<string | null>(null)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)

  const carregarDadosIniciais = () => {
    getConvenios()
      .then((convs) => {
        setConvenios(convs)
        if (convs.length > 0 && !selectedConvenioId) {
          setSelectedConvenioId(convs[0].id)
        }
      })
      .catch(console.error)
    getProjetos().then(setProjetos).catch(console.error)
    getSecretarias().then(setSecretarias).catch(console.error)
    getPrestadoresColaboradores().then(setPrestadoresList).catch(console.error)
    getCatalogoAtividades().then(setCatalogoAtividadesList).catch(console.error)
  }

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  // Secretarias filtradas pelo instrumento selecionado (se houver)
  const secretariasFiltradas = useMemo(() => {
    if (!selectedConvenioId || selectedConvenioId === 'none') {
      return secretarias
    }
    const porConvenio = secretarias.filter((s) => s.convenio_id === selectedConvenioId)
    return porConvenio.length > 0 ? porConvenio : secretarias
  }, [secretarias, selectedConvenioId])

  // Projetos filtrados pela secretaria selecionada
  const projetosFiltrados = useMemo(() => {
    if (!secretariaIdPJ || secretariaIdPJ === 'none') {
      return []
    }
    return projetos.filter((p) => p.secretaria_id === secretariaIdPJ)
  }, [projetos, secretariaIdPJ])

  // Catálogo de atividades filtrado pelo projeto selecionado
  const catalogoFiltradoPorProjeto = useMemo(() => {
    if (!projetoIdPJ || projetoIdPJ === 'none') {
      return catalogoAtividadesList
    }
    return catalogoAtividadesList.filter((c) => c.projeto_id === projetoIdPJ)
  }, [catalogoAtividadesList, projetoIdPJ])

  // Manipulador quando usuário troca a Secretaria no fluxo de Instrumento
  const handleSelectSecretariaPJ = (secId: string) => {
    setSecretariaIdPJ(secId)
    const sec = secretarias.find((s) => s.id === secId)
    setSecretariaOrgao(sec ? sec.nome : '')

    // Reseta projeto e atividade dependentes
    setProjetoIdPJ('')
    setProjetoNome('')
    setSelectedAtividadeId('')
  }

  // Manipulador quando usuário seleciona o Projeto no fluxo de Instrumento
  const handleSelectProjetoPJ = (projId: string) => {
    setProjetoIdPJ(projId)
    setSelectedAtividadeId('')
    if (projId && projId !== 'none') {
      const proj = projetos.find((p) => p.id === projId)
      if (proj) {
        setProjetoNome(proj.nome)
        // Se o projeto tem valor mensal predefinido e ainda não tem atividade selecionada, pré-preenche
        if (proj.valor_mensal_execucao && proj.valor_mensal_execucao > 0) {
          setValorNumericoPJ(formatCurrencyBRL(proj.valor_mensal_execucao))
        } else if (
          proj.valor_total &&
          proj.valor_total > 0 &&
          (!proj.meses_duracao || proj.meses_duracao === 1)
        ) {
          setValorNumericoPJ(formatCurrencyBRL(proj.valor_total))
        }
      }
    }
  }

  // Manipuladores de itens adicionais
  const handleAddItemAdicional = () => {
    setItensAdicionais((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        atividade: '',
        valor: 0,
        unidade: 'plantão de 12 horas',
      },
    ])
  }

  const handleUpdateItemAdicional = (
    id: string,
    field: keyof ItemAdicionalContrato,
    value: string | number,
  ) => {
    setItensAdicionais((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const handleRemoveItemAdicional = (id: string) => {
    setItensAdicionais((prev) => prev.filter((item) => item.id !== id))
  }

  // Instrumento selecionado atualmente
  const instrumentoSelecionado = useMemo(() => {
    return convenios.find((c) => c.id === selectedConvenioId)
  }, [convenios, selectedConvenioId])

  // Objeto unificado com todos os dados do contrato PJ
  const getDadosContratoPJ = (): DadosContratoPJ => ({
    modelo: modeloPJ,
    razaoSocial,
    naturezaJuridica,
    cnpj,
    enderecoEmpresarial,
    representanteLegal,
    cpfRepresentante,
    tipoVinculoInstrumento: tipoVinculoPJ,
    nomeInstrumento:
      tipoVinculoPJ === 'instrumento'
        ? instrumentoSelecionado?.nome ||
          instrumentoSelecionado?.numero_instrumento ||
          'Termo de Parceria nº 001/2026'
        : undefined,
    nomeOrganizacao: tipoVinculoPJ === 'organizacao' ? nomeOrganizacao : undefined,
    atividadePrincipal,
    secretariaOrgao: tipoVinculoPJ === 'instrumento' ? secretariaOrgao : '',
    projeto: tipoVinculoPJ === 'instrumento' ? projetoNome : '',
    descricaoEscopo,
    valorNumerico: parseCurrencyBRL(valorNumericoPJ) || 0,
    unidadePlantaoDemanda,
    modalidadeRemuneracaoCombinada,
    itensAdicionais,
    enquadramentoTributario,
    periodoVigencia,
    dataInicio: dataInicioPJ,
    dataFim: dataFimPJ,
    dataAssinatura,
  })

  // Gerador CLT fallback original
  const gerarTextoContratoCLT = () => {
    const valorFormatado = formatBRL(parseCurrencyBRL(valorCLT) || 0)
    let clauses = []
    let clauseNum = 1

    if (clausulaObjeto) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DO OBJETO E ESCOPO:\nO presente instrumento tem por objeto a prestação de serviços técnicos especializados e execução das atividades correspondentes à função de ${cargoFuncaoCLT || '[CARGO/FUNÇÃO]'}, visando atender às metas institucionais e aos projetos executados pela ORGANIZAÇÃO SOCIAL CONTRATANTE.`,
      )
      clauseNum++
    }

    clauses.push(
      `CLÁUSULA ${clauseNum}ª — DA REMUNERAÇÃO:\nPela prestação dos serviços convencionados, a CONTRATANTE pagará ao CONTRATADO o montante de ${valorFormatado} mensais brutos, sob regime da CLT, com retenções legais aplicáveis.`,
    )
    clauseNum++

    clauses.push(
      `CLÁUSULA ${clauseNum}ª — DO PRAZO E VIGÊNCIA:\nO presente contrato vigorará a partir de ${formatDateBR(dataInicioCLT)}${dataFimCLT ? ` com término previsto em ${formatDateBR(dataFimCLT)}` : ', por prazo indeterminado'}, podendo ser prorrogado mediante termo aditivo formal assinado por ambas as partes.`,
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

    if (textoPersonalizadoCLT.trim()) {
      clauses.push(
        `CLÁUSULA ${clauseNum}ª — DISPOSIÇÕES ESPECÍFICAS:\n${textoPersonalizadoCLT.trim()}`,
      )
    }

    return `CONTRATO DE TRABALHO SOB REGIME DA CLT

CONTRATANTE: ${DADOS_CONTRATANTE.razaoSocial}, CNPJ nº ${DADOS_CONTRATANTE.cnpj}, com sede em ${DADOS_CONTRATANTE.endereco}, representada por ${DADOS_CONTRATANTE.representante}, CPF nº ${DADOS_CONTRATANTE.cpfRepresentante}.

CONTRATADO: ${nomeCLT || '[NOME COMPLETO]'}, CPF nº ${documentoIdCLT || '[CPF]'}, admitido para a função de ${cargoFuncaoCLT || '[CARGO]'}.

As partes firmam o presente Contrato Individual de Trabalho sob as cláusulas a seguir:

${clauses.join('\n\n')}

Cuiabá/MT, ${formatDateBR(dataInicioCLT)}.

_____________________________________
${DADOS_CONTRATANTE.razaoSocial}

_____________________________________
${nomeCLT || '[CONTRATADO]'}`
  }

  // Gera o texto bruto do contrato (PJ ou CLT)
  const textoCompletoGerado =
    tipo === 'PJ' ? gerarTextoContratoPJ(getDadosContratoPJ()) : gerarTextoContratoCLT()

  // Seleção automática a partir do cadastro de prestadores PJ
  const handleSelectPrestador = (prestadorId: string) => {
    setSelectedPrestadorId(prestadorId)
    if (!prestadorId || prestadorId === 'novo') return

    const prest = prestadoresList.find((p) => p.id === prestadorId)
    if (prest) {
      if (prest.tipo === 'PJ') {
        if (prest.razao_social) setRazaoSocial(prest.razao_social)
        if (prest.cnpj) setCnpj(prest.cnpj)
        if (prest.natureza_juridica) setNaturezaJuridica(prest.natureza_juridica)
        if (prest.endereco) setEnderecoEmpresarial(prest.endereco)
        if (prest.profissional) setRepresentanteLegal(prest.profissional)
        if (prest.cpf_profissional) setCpfRepresentante(prest.cpf_profissional)
        // Apenas sugere cargo se atividade ainda vazia
        if (prest.cargo && !atividadePrincipal) setAtividadePrincipal(prest.cargo)
        if (
          prest.remuneracao_base &&
          prest.remuneracao_base > 0 &&
          (!valorNumericoPJ || parseCurrencyBRL(valorNumericoPJ) === 0)
        ) {
          setValorNumericoPJ(formatCurrencyBRL(prest.remuneracao_base))
        }
      } else {
        if (prest.nome_colaborador) setNomeCLT(prest.nome_colaborador)
        if (prest.cpf_colaborador) setDocumentoIdCLT(prest.cpf_colaborador)
        if (prest.cargo) setCargoFuncaoCLT(prest.cargo)
        if (prest.remuneracao_base && prest.remuneracao_base > 0) {
          setValorCLT(formatCurrencyBRL(prest.remuneracao_base))
        }
      }
    }
  }

  // Seleção automática a partir do catálogo de atividades
  const handleSelectAtividadeCatalogo = (catId: string) => {
    setSelectedAtividadeId(catId)
    if (!catId || catId === 'custom') return

    const item = catalogoAtividadesList.find((c) => c.id === catId)
    if (item) {
      setAtividadePrincipal(item.descricao)
      if (item.valor_unitario && item.valor_unitario > 0) {
        setValorNumericoPJ(formatCurrencyBRL(item.valor_unitario))
      }
      if (item.detalhes_escopo) {
        setDescricaoEscopo(item.detalhes_escopo)
      }
      const tipoExecNorm = (item.tipo_execucao || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
      if (
        tipoExecNorm.includes('plantao') ||
        tipoExecNorm.includes('demanda') ||
        tipoExecNorm.includes('unidade') ||
        tipoExecNorm.includes('hora')
      ) {
        setUnidadePlantaoDemanda('plantão / demanda')
      }
    }
  }

  // Importar planilha Excel (.xlsx) com prestadores / contratos
  const handleImportarPlanilhaExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportandoExcel(true)
    setMsgImportacao(null)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      // Procura abas comuns do modelo (ex: "DETALHAMENTO PJ SAUDE", "Referencia PT", ou a primeira)
      const sheetName =
        workbook.SheetNames.find(
          (s) => s.toUpperCase().includes('PJ') || s.toUpperCase().includes('REFERENCIA'),
        ) || workbook.SheetNames[0]

      const sheet = workbook.Sheets[sheetName]
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      // Localiza cabeçalho com EMPRESA, CNPJ, PROFISSIONAL, ATIVIDADE ou similar
      let headerIdx = -1
      for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
        const row = rawRows[i]
        if (Array.isArray(row)) {
          const rowText = row.map((c) => String(c || '').toUpperCase()).join(' ')
          if (
            rowText.includes('EMPRESA') ||
            rowText.includes('CNPJ') ||
            rowText.includes('PROFISSIONAL') ||
            rowText.includes('ATIVIDADE')
          ) {
            headerIdx = i
            break
          }
        }
      }

      let importadosCount = 0
      if (headerIdx !== -1) {
        const headers = (rawRows[headerIdx] as string[]).map((h) =>
          String(h || '')
            .trim()
            .toUpperCase(),
        )
        const empIdx = headers.findIndex((h) => h.includes('EMPRESA') || h.includes('RAZÃO'))
        const cnpjIdx = headers.findIndex((h) => h.includes('CNPJ'))
        const profIdx = headers.findIndex((h) => h.includes('PROFISSIONAL') || h.includes('NOME'))
        const ativIdx = headers.findIndex(
          (h) => h.includes('ATIVIDADE') || h.includes('CARGO') || h.includes('FUNÇÃO'),
        )
        const valIdx = headers.findIndex(
          (h) => h.includes('REMUNERAÇÃO') || h.includes('VALOR') || h.includes('BASE'),
        )

        for (let r = headerIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r]
          if (!row || !Array.isArray(row)) continue
          const empresa = empIdx !== -1 ? String(row[empIdx] || '').trim() : ''
          const cnpjVal = cnpjIdx !== -1 ? String(row[cnpjIdx] || '').trim() : ''
          const prof = profIdx !== -1 ? String(row[profIdx] || '').trim() : ''
          const ativ = ativIdx !== -1 ? String(row[ativIdx] || '').trim() : ''
          const valNum = valIdx !== -1 ? Number(row[valIdx]) || 0 : 0

          if (empresa || cnpjVal || prof) {
            await createPrestadorColaborador({
              tipo: 'PJ',
              razao_social: empresa || prof,
              cnpj: cnpjVal || undefined,
              profissional: prof || undefined,
              cargo: ativ || 'Prestador PJ',
              remuneracao_base: valNum > 0 ? valNum : undefined,
            })
            importadosCount++
          }
        }
      }

      await getPrestadoresColaboradores().then(setPrestadoresList)
      setMsgImportacao({
        tipo: 'ok',
        texto: `Importação concluída! ${importadosCount} registros lidos da planilha "${file.name}".`,
      })
    } catch (err: unknown) {
      setMsgImportacao({
        tipo: 'erro',
        texto: err instanceof Error ? err.message : 'Falha ao processar arquivo Excel.',
      })
    } finally {
      setImportandoExcel(false)
      // limpa input file
      e.target.value = ''
    }
  }

  // Impressão nativa em layout formal
  const handlePrint = () => {
    imprimirOuExportarPdfContrato(getDadosContratoPJ())
  }

  // Exportar TXT
  const handleExportTxt = () => {
    if (tipo === 'PJ') {
      exportarContratoComoTxt(getDadosContratoPJ())
    } else {
      const blob = new Blob([textoCompletoGerado], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_CLT_${(nomeCLT || 'Colaborador').replace(/\s+/g, '_')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Exportar DOC (HTML Word)
  const handleExportDoc = () => {
    if (tipo === 'PJ') {
      exportarContratoComoDoc(getDadosContratoPJ())
    } else {
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contrato CLT</title></head><body><pre style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; white-space: pre-wrap;">${textoCompletoGerado}</pre></body></html>`
      const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_CLT_${(nomeCLT || 'Colaborador').replace(/\s+/g, '_')}.doc`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Persistir no PocketBase
  const handleSalvarContrato = async () => {
    setSalvando(true)
    setErroSalvar(null)
    try {
      if (tipo === 'PJ') {
        const dadosPJ = getDadosContratoPJ()
        const text = gerarTextoContratoPJ(dadosPJ)

        // Salva contrato com payload completo e dados variáveis no campo clausulas
        const rec = await createContrato({
          tipo: 'PJ',
          nome: dadosPJ.razaoSocial.trim() || 'Prestador PJ',
          cargo_funcao: dadosPJ.atividadePrincipal.trim() || 'Prestação de Serviços',
          valor: dadosPJ.valorNumerico,
          tipo_pj: modeloPJ === 'plantao_demanda' ? 'horas' : 'mensal',
          data_inicio: new Date(dadosPJ.dataInicio).toISOString(),
          data_fim: dadosPJ.dataFim ? new Date(dadosPJ.dataFim).toISOString() : undefined,
          status: 'ativo',
          clausulas: text,
          projeto_id: projetoIdPJ && projetoIdPJ !== 'none' ? projetoIdPJ : undefined,
        })

        setContratoSalvoId(rec.id)
      } else {
        const text = gerarTextoContratoCLT()
        const rec = await createContrato({
          tipo: 'CLT',
          nome: nomeCLT.trim(),
          cargo_funcao: cargoFuncaoCLT.trim(),
          valor: parseCurrencyBRL(valorCLT) || 0,
          data_inicio: new Date(dataInicioCLT).toISOString(),
          data_fim: dataFimCLT ? new Date(dataFimCLT).toISOString() : undefined,
          status: 'ativo',
          beneficios: ['VT', 'VA'],
          clausulas: text,
          projeto_id: projetoIdCLT && projetoIdCLT !== 'none' ? projetoIdCLT : undefined,
        })

        setContratoSalvoId(rec.id)
      }
    } catch (err: unknown) {
      setErroSalvar(err instanceof Error ? err.message : 'Falha ao salvar contrato no sistema.')
    } finally {
      setSalvando(false)
    }
  }

  // Validação para habilitar botão de próximo
  const podeAvancarPasso2 = () => {
    if (tipo === 'CLT') {
      return Boolean(nomeCLT.trim() && cargoFuncaoCLT.trim() && parseCurrencyBRL(valorCLT) > 0)
    }
    // PJ: Validação estrita por ordem
    // 1. Razão Social
    if (!razaoSocial.trim() || !cnpj.trim()) return false
    // 2. Instrumento vs Organização
    if (tipoVinculoPJ === 'instrumento') {
      if (!selectedConvenioId || !secretariaIdPJ || !projetoIdPJ) return false
    } else {
      if (!nomeOrganizacao.trim()) return false
    }
    // 4. Atividades
    if (!atividadePrincipal.trim()) return false
    // 5. Valor
    if (!valorNumericoPJ || parseCurrencyBRL(valorNumericoPJ) <= 0) return false

    return true
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Estilos específicos de impressão @media print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .contrato-print-area, .contrato-print-area * {
            visibility: visible;
          }
          .contrato-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 2cm 2.5cm !important;
            color: #000 !important;
            background: #fff !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="flex items-center justify-between no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link to="/contratos" className="hover:text-[#1FAF7A] inline-flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Contratos
            </Link>
            <span>/</span>
            <span className="text-[#1E293B] font-medium">Elaborar Contrato</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            Elaboração Guiada de Contratos de Prestação de Serviço
          </h2>
          <p className="text-xs text-[#64748B]">
            Modelos oficiais para prestadores PJ e vínculos CLT com dados institucionais da
            Organização de Saúde São Bento.
          </p>
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm no-print">
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

      {/* PASSO 1: REGIME E MODELO */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Card de Importação em Lote de Planilha Excel */}
          <div className="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#1FAF7A] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-[#1E293B]">
                  Importar Planilha Excel (.xlsx) para Elaboração de Contratos
                </h4>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Faça o upload de planilha Excel com colunas{' '}
                  <strong>EMPRESA, CNPJ, PROFISSIONAL, ATIVIDADE, REMUNERAÇÃO</strong> (como nas
                  planilhas do modelo do Termo de Parceria). O sistema cadastrará os prestadores
                  automaticamente sem embutir dados no código.
                </p>
                {msgImportacao && (
                  <p
                    className={`text-xs font-semibold mt-1 ${
                      msgImportacao.tipo === 'ok' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {msgImportacao.texto}
                  </p>
                )}
              </div>
            </div>

            <label className="relative shrink-0 cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportarPlanilhaExcel}
                disabled={importandoExcel}
                className="sr-only"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={importandoExcel}
                className="bg-white hover:bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold text-xs pointer-events-none"
              >
                {importandoExcel ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-[#1FAF7A]" />
                )}
                {importandoExcel ? 'Lendo arquivo...' : 'Importar Planilha .xlsx'}
              </Button>
            </label>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1E293B]">
                1. Selecione a Modalidade de Contratação
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Os modelos de contrato com cláusulas da São Bento são aplicados especificamente para
                contratos PJ vinculados ao Termo de Parceria.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setTipo('PJ')}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  tipo === 'PJ'
                    ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#1FAF7A] flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  {tipo === 'PJ' && (
                    <span className="text-xs font-bold text-[#1FAF7A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Selecionado
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#1E293B] mt-3">
                  Pessoa Jurídica (PJ) — Prestação de Serviços
                </h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Contrato de Prestação de Serviços com modelos oficiais padronizados: Plantão,
                  Mensal ou Combinado.
                </p>
              </div>

              <div
                onClick={() => setTipo('CLT')}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  tipo === 'CLT'
                    ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  {tipo === 'CLT' && (
                    <span className="text-xs font-bold text-[#1FAF7A] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Selecionado
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#1E293B] mt-3">
                  Colaborador CLT (Empregado Direto)
                </h4>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Contrato individual de trabalho padrão com jornada de 40h semanais, anotação em
                  CTPS e benefícios.
                </p>
              </div>
            </div>
          </div>

          {/* Se PJ: SELEÇÃO DOS 3 MODELOS ANEXADOS */}
          {tipo === 'PJ' && (
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#1E293B]">
                    2. Escolha o Modelo de Contrato PJ Anexado
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Fonte exata dos modelos padrão TP 001/2026 da Organização de Saúde São Bento.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  3 Modelos Disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['mensal_plantao', 'mensal', 'plantao_demanda'] as ModeloContratoPJ[]).map(
                  (modKey) => {
                    const meta = METADADOS_MODELOS[modKey]
                    const isSel = modeloPJ === modKey

                    return (
                      <div
                        key={modKey}
                        onClick={() => setModeloPJ(modKey)}
                        className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSel
                            ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-sm ring-1 ring-[#1FAF7A]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                isSel ? 'bg-[#1FAF7A] text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {meta.badge}
                            </span>
                            {isSel && <CheckCircle2 className="w-4 h-4 text-[#1FAF7A] shrink-0" />}
                          </div>
                          <h4 className="text-sm font-bold text-[#1E293B] leading-snug">
                            {meta.titulo}
                          </h4>
                          <p className="text-xs text-[#64748B] leading-relaxed">{meta.descricao}</p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Cláusula 6ª:</span>
                          <span className="font-semibold text-[#1E293B]">
                            {modKey === 'mensal_plantao'
                              ? 'Fixo + Itens Adicionais'
                              : modKey === 'mensal'
                                ? 'Valor Mensal Fixo'
                                : 'Por Plantão/Demanda'}
                          </span>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>

              {/* Informação sobre dados fixos incorporados */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-[#64748B] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1FAF7A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#1E293B]">
                    Dados Fixos da Contratante (Embutidos Automaticamente):
                  </p>
                  <p className="text-[11px]">
                    <strong>{DADOS_CONTRATANTE.razaoSocial}</strong> (OSCIP em âmbito Nacional),
                    CNPJ {DADOS_CONTRATANTE.cnpj}, sede em Cuiabá/MT, representada por{' '}
                    {DADOS_CONTRATANTE.representante} (CPF {DADOS_CONTRATANTE.cpfRepresentante}), no
                    âmbito do {DADOS_CONTRATANTE.termoParceria}, com Foro na Comarca de Cuiabá/MT.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setCurrentStep(2)}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold px-6"
            >
              Próximo: Preencher Dados do Contrato
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASSO 2: FORMULÁRIO DE DADOS */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {tipo === 'PJ' ? (
            /* FORMULÁRIO PJ */
            <div className="space-y-6">
              {/* PASSO 1 DA ORDEM: 1. Razão Social da Empresa */}
              <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                        Razão Social da Empresa (Contratada PJ)
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Selecione a empresa prestadora já cadastrada ou informe a razão social e
                        qualificação manualmente.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Passo 1 de 5
                  </span>
                </div>

                {/* Seleção rápida do cadastro de prestadores */}
                {prestadoresList.filter((p) => p.tipo === 'PJ').length > 0 && (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5">
                    <Label className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                      <span>Buscar Prestador no Cadastro Centralizado (/prestadores):</span>
                      <span className="text-[11px] font-normal text-emerald-700">
                        Preenche os demais dados da empresa automaticamente
                      </span>
                    </Label>
                    <Select value={selectedPrestadorId} onValueChange={handleSelectPrestador}>
                      <SelectTrigger className="bg-white text-xs h-9 border-emerald-200">
                        <SelectValue placeholder="Selecione um prestador já cadastrado ou digite abaixo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">
                          + Digitar novo prestador / razão social manualmente
                        </SelectItem>
                        {prestadoresList
                          .filter((p) => p.tipo === 'PJ')
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.razao_social} {p.cnpj ? `(${p.cnpj})` : ''}{' '}
                              {p.profissional ? `• Repr: ${p.profissional}` : ''}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Razão Social da Empresa Contratada *
                    </Label>
                    <Input
                      value={razaoSocial}
                      onChange={(e) => setRazaoSocial(e.target.value)}
                      placeholder="Ex: MEDCLIN SERVIÇOS MÉDICOS LTDA"
                      className="font-semibold text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Natureza Jurídica *
                    </Label>
                    <Input
                      value={naturezaJuridica}
                      onChange={(e) => setNaturezaJuridica(e.target.value)}
                      placeholder="Ex: Sociedade Limitada (LTDA) / Empresário Individual"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      CNPJ da Empresa *
                    </Label>
                    <Input
                      value={cnpj}
                      onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                      placeholder="00.000.000/0001-00"
                      maxLength={18}
                      className="font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Endereço Empresarial Completo *
                    </Label>
                    <Input
                      value={enderecoEmpresarial}
                      onChange={(e) => setEnderecoEmpresarial(e.target.value)}
                      placeholder="Ex: Av. Historiador Rubens de Mendonça, 1200, Sala 402, Cuiabá/MT, CEP 78.050-000"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Nome do(a) Representante Legal *
                    </Label>
                    <Input
                      value={representanteLegal}
                      onChange={(e) => setRepresentanteLegal(e.target.value)}
                      placeholder="Ex: Dr. Carlos Eduardo de Souza"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      CPF do(a) Representante Legal *
                    </Label>
                    <Input
                      value={cpfRepresentante}
                      onChange={(e) => setCpfRepresentante(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* PASSO 2 DA ORDEM: 2. Selecionar o Instrumento ou Nome da Organização */}
              <div
                className={`bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4 transition-all ${
                  !razaoSocial.trim() ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                        Selecionar o Instrumento ou Nome da Organização
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Escolha se o contrato está vinculado a um Instrumento Formal (ex: Termo de
                        Parceria) ou informe o Nome da Organização (contrato não vinculado).
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Passo 2 de 5
                  </span>
                </div>

                {/* Opções Instrumento vs Organização */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      tipoVinculoPJ === 'instrumento'
                        ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoVinculoPJ"
                      value="instrumento"
                      checked={tipoVinculoPJ === 'instrumento'}
                      onChange={() => setTipoVinculoPJ('instrumento')}
                      className="mt-1 text-[#1FAF7A]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#1FAF7A]" />
                        <span className="text-xs font-bold text-[#1E293B]">
                          Vincular a um Instrumento
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Contrato acessório a Instrumento / Termo de Parceria cadastrado, com
                        vinculação a secretaria, plano de trabalho e catálogo de atividades.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      tipoVinculoPJ === 'organizacao'
                        ? 'border-[#1FAF7A] bg-[#1FAF7A]/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoVinculoPJ"
                      value="organizacao"
                      checked={tipoVinculoPJ === 'organizacao'}
                      onChange={() => {
                        setTipoVinculoPJ('organizacao')
                        setSecretariaIdPJ('')
                        setSecretariaOrgao('')
                        setProjetoIdPJ('')
                        setProjetoNome('')
                        setSelectedAtividadeId('')
                      }}
                      className="mt-1 text-[#1FAF7A]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-[#1FAF7A]" />
                        <span className="text-xs font-bold text-[#1E293B]">
                          Contrato Não Vinculado (Nome da Organização)
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Contrato direto da entidade sem vinculação a convênios ou instrumentos
                        públicos específicos.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Conteúdo dependente de Instrumento vs Organização */}
                {tipoVinculoPJ === 'instrumento' ? (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Selecione o Instrumento Cadastrado *
                    </Label>
                    <Select
                      value={selectedConvenioId}
                      onValueChange={(val) => {
                        setSelectedConvenioId(val)
                        // Limpa secretaria e projeto dependentes
                        setSecretariaIdPJ('')
                        setSecretariaOrgao('')
                        setProjetoIdPJ('')
                        setProjetoNome('')
                        setSelectedAtividadeId('')
                      }}
                    >
                      <SelectTrigger className="text-xs h-9 bg-white">
                        <SelectValue placeholder="Selecione um instrumento / convênio..." />
                      </SelectTrigger>
                      <SelectContent>
                        {convenios.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.numero_instrumento ? `${c.numero_instrumento} — ` : ''}
                            {c.nome} {c.municipio ? `(${c.municipio})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {instrumentoSelecionado && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Instrumento ativo: {instrumentoSelecionado.numero_instrumento} • Órgão:{' '}
                        {instrumentoSelecionado.orgao_contratante ||
                          instrumentoSelecionado.municipio}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Nome da Organização Contratante *
                    </Label>
                    <Input
                      value={nomeOrganizacao}
                      onChange={(e) => setNomeOrganizacao(e.target.value)}
                      placeholder="Ex: ORGANIZAÇÃO DE SAÚDE SÃO BENTO"
                      className="text-xs font-semibold"
                    />
                    <p className="text-[11px] text-slate-500">
                      O contrato será elaborado em nome desta organização, sem vinculação a termo de
                      parceria público.
                    </p>
                  </div>
                )}
              </div>

              {/* PASSO 3 DA ORDEM: 3. Se instrumento, selecionar o projeto e sua respectiva secretaria */}
              {tipoVinculoPJ === 'instrumento' && (
                <div
                  className={`bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4 transition-all ${
                    !selectedConvenioId ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                          Secretaria do Instrumento e Projeto / Plano de Trabalho
                        </h3>
                        <p className="text-xs text-[#64748B]">
                          Selecione primeiro a secretaria do instrumento e, em seguida, o
                          projeto/plano de trabalho vinculado a essa secretaria.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                      Passo 3 de 5
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Secretaria */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        1º Selecione a Secretaria do Instrumento *
                      </Label>
                      <Select value={secretariaIdPJ} onValueChange={handleSelectSecretariaPJ}>
                        <SelectTrigger className="text-xs h-9 bg-white">
                          <SelectValue placeholder="Selecione a secretaria demandante..." />
                        </SelectTrigger>
                        <SelectContent>
                          {secretariasFiltradas.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {secretariaOrgao && (
                        <p className="text-[11px] text-emerald-700">
                          Secretaria selecionada: <strong>{secretariaOrgao}</strong>
                        </p>
                      )}
                    </div>

                    {/* Projeto vinculado à Secretaria */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        2º Selecione o Projeto / Plano de Trabalho desta Secretaria *
                      </Label>
                      <Select
                        value={projetoIdPJ}
                        onValueChange={handleSelectProjetoPJ}
                        disabled={!secretariaIdPJ}
                      >
                        <SelectTrigger className="text-xs h-9 bg-white">
                          <SelectValue
                            placeholder={
                              !secretariaIdPJ
                                ? 'Aguardando seleção da secretaria acima...'
                                : projetosFiltrados.length === 0
                                  ? 'Nenhum projeto cadastrado nesta secretaria'
                                  : 'Selecione o projeto vinculado...'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {projetosFiltrados.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}{' '}
                              {p.valor_mensal_execucao
                                ? `(Custo Mensal: ${formatBRL(p.valor_mensal_execucao)})`
                                : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {projetoNome && (
                        <p className="text-[11px] text-emerald-700">
                          Projeto selecionado: <strong>{projetoNome}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {secretariaIdPJ && projetosFiltrados.length === 0 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                      Nenhum projeto encontrado especificamente cadastrado para esta secretaria.
                      Você pode cadastrar novos projetos na <strong>Lista de Projetos</strong>{' '}
                      vinculando a esta secretaria.
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 4 DA ORDEM: 4. Selecionar as atividades se instrumento ou digitar se contrato não vinculado */}
              <div
                className={`bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4 transition-all ${
                  tipoVinculoPJ === 'instrumento' && (!secretariaIdPJ || !projetoIdPJ)
                    ? 'opacity-60 pointer-events-none'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                        Atividades do Contrato
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {tipoVinculoPJ === 'instrumento'
                          ? 'Selecione a atividade do Catálogo do Projeto (Anexo I PT) ou digite caso necessário.'
                          : 'Digite livremente o objeto e as atividades da prestação de serviços.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                    Passo 4 de 5
                  </span>
                </div>

                {tipoVinculoPJ === 'instrumento' ? (
                  <div className="space-y-4">
                    {/* Seletor do catálogo de atividades daquele projeto */}
                    <div className="p-3 bg-sky-50/60 border border-sky-200 rounded-lg space-y-1.5">
                      <Label className="text-xs font-bold text-sky-900 flex items-center justify-between">
                        <span>Catálogo de Atividades do Projeto (Anexo I PT):</span>
                        <span className="text-[11px] font-normal text-sky-700">
                          {catalogoFiltradoPorProjeto.length} atividades disponíveis
                        </span>
                      </Label>
                      <Select
                        value={selectedAtividadeId}
                        onValueChange={handleSelectAtividadeCatalogo}
                      >
                        <SelectTrigger className="bg-white text-xs h-9 border-sky-200">
                          <SelectValue placeholder="Selecione uma atividade do catálogo do projeto..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">+ Digitar atividade livremente</SelectItem>
                          {catalogoFiltradoPorProjeto.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.descricao} {cat.tipo_execucao ? `(${cat.tipo_execucao})` : ''} —{' '}
                              {formatBRL(cat.valor_unitario)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-[#1E293B]">
                          Descrição / Título da Atividade Contratada *
                        </Label>
                        <Input
                          value={atividadePrincipal}
                          onChange={(e) => setAtividadePrincipal(e.target.value)}
                          placeholder="Ex: Serviços Médicos Especializados / Atividade de Apoio"
                          className="text-xs font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-[#1E293B]">
                          Identificação Formal do Projeto no Contrato
                        </Label>
                        <Input
                          value={projetoNome}
                          onChange={(e) => setProjetoNome(e.target.value)}
                          placeholder="Ex: Projeto FORSAÚDE – Fortalecimento da Saúde Pública Municipal"
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        Parágrafo Primeiro — Escopo e Descrição Detalhada da Atividade *
                      </Label>
                      <Textarea
                        rows={3}
                        value={descricaoEscopo}
                        onChange={(e) => setDescricaoEscopo(e.target.value)}
                        placeholder="Descreva detalhadamente o escopo das atividades da CONTRATADA..."
                        className="text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  /* NÃO VINCULADO: Digitação Livre */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        Objeto / Atividade Principal Contratada *
                      </Label>
                      <Input
                        value={atividadePrincipal}
                        onChange={(e) => setAtividadePrincipal(e.target.value)}
                        placeholder="Ex: Prestação de serviços de consultoria contábil e auditoria"
                        className="text-xs font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        Descrição Livre das Atividades e Escopo do Serviço *
                      </Label>
                      <Textarea
                        rows={4}
                        value={descricaoEscopo}
                        onChange={(e) => setDescricaoEscopo(e.target.value)}
                        placeholder="Descreva detalhadamente as atividades a serem executadas pelo prestador PJ, entregas esperadas, cronograma e obrigações técnicas..."
                        className="text-xs"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* PASSO 5 DA ORDEM: 5. Se vinculado a instrumento, valor pré-definido / Digitação se não vinculado */}
              <div
                className={`bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4 transition-all ${
                  !atividadePrincipal.trim() ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#1FAF7A] text-white flex items-center justify-center text-xs font-bold">
                      5
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                        Valor e Remuneração Contratual
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {tipoVinculoPJ === 'instrumento'
                          ? 'Valor pré-preenchido automaticamente a partir da atividade ou projeto/plano de trabalho. O usuário pode conferir e ajustar se necessário.'
                          : 'Preenchimento manual livre do valor contratual acordado.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#1FAF7A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {formatBRL(parseCurrencyBRL(valorNumericoPJ) || 0)}
                  </span>
                </div>

                {tipoVinculoPJ === 'instrumento' &&
                  selectedAtividadeId &&
                  selectedAtividadeId !== 'custom' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                      <span>
                        ✓ Valor pré-definido carregado da atividade selecionada no catálogo do
                        projeto.
                      </span>
                      <span className="font-bold text-emerald-900">
                        {formatBRL(parseCurrencyBRL(valorNumericoPJ) || 0)}
                      </span>
                    </div>
                  )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      {modeloPJ === 'plantao_demanda'
                        ? 'Valor por Unidade / Plantão *'
                        : 'Valor Mensal Base *'}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                        R$
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={valorNumericoPJ}
                        onChange={(e) => setValorNumericoPJ(maskCurrency(e.target.value))}
                        placeholder="0,00"
                        className="pl-9 text-xs font-bold tabular-nums"
                        required
                      />
                    </div>
                    <p className="text-[11px] text-[#64748B] italic">
                      Valor por extenso automático:{' '}
                      <strong className="text-[#1E293B]">
                        {valorPorExtenso(parseCurrencyBRL(valorNumericoPJ) || 0)}
                      </strong>
                    </p>
                  </div>

                  {modeloPJ === 'plantao_demanda' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        Unidade de Remuneração *
                      </Label>
                      <Input
                        value={unidadePlantaoDemanda}
                        onChange={(e) => setUnidadePlantaoDemanda(e.target.value)}
                        placeholder="Ex: plantão de 12 horas / demanda realizada / procedimento"
                        className="text-xs"
                      />
                    </div>
                  )}

                  {modeloPJ === 'mensal_plantao' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#1E293B]">
                        Modalidade da Remuneração Base
                      </Label>
                      <Select
                        value={modalidadeRemuneracaoCombinada}
                        onValueChange={setModalidadeRemuneracaoCombinada}
                      >
                        <SelectTrigger className="text-xs h-9 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="por serviço">Por Serviço</SelectItem>
                          <SelectItem value="por unidade">Por Unidade</SelectItem>
                          <SelectItem value="por produção">Por Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* ITENS ADICIONAIS DE PLANTÃO / DEMANDA (Apenas Modelo 1) */}
                {modeloPJ === 'mensal_plantao' && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-bold text-[#1E293B]">
                          Parágrafo Primeiro — Atividades Adicionais / Plantões sob Demanda
                          (Opcional)
                        </Label>
                        <p className="text-[11px] text-[#64748B]">
                          Se não houver itens adicionais, o Parágrafo Segundo será incluído na
                          versão final indicando exclusão do Parágrafo Primeiro.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddItemAdicional}
                        className="text-xs text-[#1FAF7A] border-[#1FAF7A]/30 hover:bg-[#1FAF7A]/10 gap-1 h-7"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Item
                      </Button>
                    </div>

                    {itensAdicionais.length === 0 ? (
                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                        Nenhum item adicional configurado. O <strong>Parágrafo Segundo</strong> do
                        modelo será emitido:{' '}
                        <em>
                          &quot;Não havendo atividade adicional, plantão ou serviço sob demanda
                          aplicável à contratação, o Parágrafo Primeiro e seus itens deverão ser
                          excluídos da versão final do contrato.&quot;
                        </em>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {itensAdicionais.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                          >
                            <span className="sm:col-span-1 font-bold text-slate-500">
                              Item {idx + 1}
                            </span>
                            <div className="sm:col-span-5 space-y-0.5">
                              <Input
                                value={item.atividade}
                                onChange={(e) =>
                                  handleUpdateItemAdicional(item.id, 'atividade', e.target.value)
                                }
                                placeholder="Descrição da atividade adicional/plantão"
                                className="h-8 text-xs bg-white"
                              />
                            </div>
                            <div className="sm:col-span-3 space-y-0.5">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748B]">
                                  R$
                                </span>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatCurrencyBRL(item.valor)}
                                  onChange={(e) =>
                                    handleUpdateItemAdicional(
                                      item.id,
                                      'valor',
                                      parseCurrencyBRL(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="0,00"
                                  className="pl-7 h-8 text-xs bg-white font-semibold tabular-nums"
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {valorPorExtenso(item.valor)}
                              </span>
                            </div>
                            <div className="sm:col-span-2 space-y-0.5">
                              <Input
                                value={item.unidade}
                                onChange={(e) =>
                                  handleUpdateItemAdicional(item.id, 'unidade', e.target.value)
                                }
                                placeholder="Unidade (ex: plantão 12h)"
                                className="h-8 text-xs bg-white"
                              />
                            </div>
                            <div className="sm:col-span-1 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItemAdicional(item.id)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TRIBUTAÇÃO & RETENÇÕES */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <Label className="text-xs font-bold text-[#1E293B]">
                    Enquadramento Tributário da Contratada (Retenções Federais)
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                        enquadramentoTributario === 'geral'
                          ? 'border-[#1FAF7A] bg-[#1FAF7A]/5'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tributacao"
                        value="geral"
                        checked={enquadramentoTributario === 'geral'}
                        onChange={() => setEnquadramentoTributario('geral')}
                        className="mt-0.5 text-[#1FAF7A]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#1E293B] block">
                          Lucro Presumido / Real (Com Retenções Fixas)
                        </span>
                        <span className="text-[#64748B] text-[11px] block mt-0.5">
                          Aplica retenções na fonte de Lei 10.833/2003: IRPJ 1,5%, CSLL 1%, PIS
                          0,65%, COFINS 3%.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                        enquadramentoTributario === 'simples_mei'
                          ? 'border-[#1FAF7A] bg-[#1FAF7A]/5'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tributacao"
                        value="simples_mei"
                        checked={enquadramentoTributario === 'simples_mei'}
                        onChange={() => setEnquadramentoTributario('simples_mei')}
                        className="mt-0.5 text-[#1FAF7A]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#1E293B] block">
                          Simples Nacional / MEI (Com Parágrafo de Não Retenção)
                        </span>
                        <span className="text-[#64748B] text-[11px] block mt-0.5">
                          Inclui parágrafo específico: não haverá retenção para empresas do
                          Simples/MEI devidamente comprovadas.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Box 4: VIGÊNCIA E ASSINATURA */}
              <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                    4. Vigência Contratual e Assinatura (Cláusulas 7ª e 16ª)
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Período, datas de vigência e formalização na Comarca de Cuiabá/MT.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Período de Vigência por Extenso *
                    </Label>
                    <Input
                      value={periodoVigencia}
                      onChange={(e) => setPeriodoVigencia(e.target.value)}
                      placeholder="Ex: 12 (doze) meses"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">Data de Início *</Label>
                    <Input
                      type="date"
                      value={dataInicioPJ}
                      onChange={(e) => setDataInicioPJ(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Data de Término *
                    </Label>
                    <Input
                      type="date"
                      value={dataFimPJ}
                      onChange={(e) => setDataFimPJ(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Data de Assinatura *
                    </Label>
                    <Input
                      type="date"
                      value={dataAssinatura}
                      onChange={(e) => setDataAssinatura(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Local e Foro de Eleição (Fixo)
                    </Label>
                    <Input
                      value={`${DADOS_CONTRATANTE.cidadeAssinatura} — ${DADOS_CONTRATANTE.foro}`}
                      disabled
                      className="bg-slate-50 text-xs font-medium text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* FORMULÁRIO CLT */
            <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#1E293B]">Dados do Colaborador CLT</h3>
                <p className="text-xs text-[#64748B]">
                  Vínculo empregatício direto nos termos da Consolidação das Leis do Trabalho.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">
                    Nome Completo do Colaborador *
                  </Label>
                  <Input
                    value={nomeCLT}
                    onChange={(e) => setNomeCLT(e.target.value)}
                    placeholder="Ex: Mariana Silva Ramos"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">
                    CPF do Colaborador *
                  </Label>
                  <Input
                    value={documentoIdCLT}
                    onChange={(e) => setDocumentoIdCLT(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">
                    Função / Cargo Técnico *
                  </Label>
                  <Input
                    value={cargoFuncaoCLT}
                    onChange={(e) => setCargoFuncaoCLT(e.target.value)}
                    placeholder="Ex: Coordenadora Social"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">
                    Salário Bruto CLT *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                      R$
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={valorCLT}
                      onChange={(e) => setValorCLT(maskCurrency(e.target.value))}
                      placeholder="0,00"
                      className="pl-9 text-xs font-bold tabular-nums"
                      required
                    />
                  </div>
                  {valorCLT && parseCurrencyBRL(valorCLT) > 0 && (
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      {formatBRL(parseCurrencyBRL(valorCLT))}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">Jornada Semanal</Label>
                  <Input value="40 horas semanais" disabled className="bg-slate-50 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">Data de Início *</Label>
                  <Input
                    type="date"
                    value={dataInicioCLT}
                    onChange={(e) => setDataInicioCLT(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">
                    Data Prevista Término
                  </Label>
                  <Input
                    type="date"
                    value={dataFimCLT}
                    onChange={(e) => setDataFimCLT(e.target.value)}
                    placeholder="Indeterminado"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#1E293B]">
                    Vínculo com Projeto
                  </Label>
                  <Select value={projetoIdCLT || 'none'} onValueChange={setProjetoIdCLT}>
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

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <Label className="text-xs font-bold text-[#1E293B] block">
                  Cláusulas Padronizadas a Incluir:
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
                      Propriedade Intelectual em favor da OSCIP
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
                  Cláusula Extra ou Observações Especiais
                </Label>
                <Textarea
                  rows={2}
                  value={textoPersonalizadoCLT}
                  onChange={(e) => setTextoPersonalizadoCLT(e.target.value)}
                  placeholder="Informações adicionais de jornada ou local de trabalho..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Voltar
            </Button>
            <Button
              size="sm"
              disabled={!podeAvancarPasso2()}
              onClick={() => setCurrentStep(3)}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white px-6"
            >
              Visualizar Prévia Formal do Documento
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASSO 3: REVISÃO JURÍDICA (Preview estilo Papel A4 com Botões de Ação) */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 no-print">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {tipo === 'PJ' ? METADADOS_MODELOS[modeloPJ].badge : 'Regime CLT'}
                </span>
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Passo 3 — Prévia do Instrumento Jurídico
                </h3>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Layout diagramado em folha A4 com tipografia Times New Roman, texto justificado e
                cláusulas completas.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs gap-1.5 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              >
                <Printer className="w-3.5 h-3.5 text-red-600" />
                Baixar / Imprimir .PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDoc}
                className="text-xs gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                Baixar Word (.doc)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTxt}
                className="text-xs gap-1.5 text-slate-700 hover:bg-slate-50"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Baixar .TXT
              </Button>
            </div>
          </div>

          {/* Paper View Container - Estilo Folha A4 Oficial */}
          <div className="contrato-print-area bg-white border border-slate-300 rounded-xl p-8 sm:p-14 shadow-lg font-serif text-black max-h-[620px] overflow-y-auto leading-relaxed text-xs sm:text-[13px] whitespace-pre-wrap select-text print:max-h-none print:overflow-visible">
            {textoCompletoGerado}
          </div>

          <div className="flex justify-between pt-2 no-print">
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
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white px-6 font-semibold"
            >
              Aprovar & Salvar Contrato no Sistema
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* PASSO 4: SALVAR E EXPORTAR */}
      {currentStep === 4 && (
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] shadow-sm text-center space-y-6 no-print">
          {salvando ? (
            <div className="py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-[#1FAF7A] animate-spin mx-auto" />
              <h3 className="text-base font-bold text-[#1E293B]">
                Persistindo contrato no banco de dados institucional...
              </h3>
              <p className="text-xs text-[#64748B]">
                Registrando cláusulas verbatim, dados da contratada e vinculações de projeto.
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
                  Contrato Elaborado e Registrado com Sucesso!
                </h3>
                <p className="text-xs text-[#64748B] max-w-lg mx-auto">
                  O contrato com{' '}
                  <strong className="text-[#1E293B]">
                    {tipo === 'PJ' ? razaoSocial : nomeCLT}
                  </strong>{' '}
                  ({tipo} {tipo === 'PJ' ? `— ${METADADOS_MODELOS[modeloPJ].badge}` : ''}) foi
                  registrado na base de dados institucional da OSCIP e vinculado ao Termo de
                  Parceria nº 001/2026.
                </p>
              </div>

              {/* Botões de Ação Final */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Button
                  onClick={() => imprimirOuExportarPdfContrato(getDadosContratoPJ())}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Baixar / Imprimir Contrato (.PDF)
                </Button>

                <Button
                  onClick={handleExportDoc}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Exportar Word (.doc)
                </Button>

                <Button
                  onClick={handleExportTxt}
                  variant="outline"
                  className="text-xs font-semibold gap-1.5"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  Exportar (.txt)
                </Button>

                <Button asChild variant="outline" className="text-xs font-semibold">
                  <Link to="/contratos">Ver Lista de Contratos</Link>
                </Button>

                {contratoSalvoId && (
                  <Button
                    asChild
                    className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
                  >
                    <Link to={`/contratos/${contratoSalvoId}`}>Abrir Ficha do Contrato</Link>
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
