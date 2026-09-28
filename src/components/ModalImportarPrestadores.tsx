import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileSpreadsheet,
  Upload,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  Info,
} from 'lucide-react'
import { formatBRL } from '@/components/StatusBadge'
import { parseCurrencyBRL, onlyDigits, maskCpf, maskCnpj } from '@/lib/masks'
import { createPrestadorColaborador } from '@/services/api'
import type { PrestadorColaboradorRecord, PrestadorTipo } from '@/types'
import { toast } from 'sonner'

interface ModalImportarPrestadoresProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  prestadoresExistentes: PrestadorColaboradorRecord[]
}

export interface LinhaPlanilhaPrestador {
  index: number
  tipoOriginal: string
  tipoNormalizado: PrestadorTipo | null
  nomeRazaoSocial: string
  cpfOuCnpjOriginal: string
  documentoFormatado: string
  cargoProfissao: string
  tipoServicoModalidade: string // Mantido exatamente como digitado
  remuneracaoBase: number
  // Campos opcionais adicionais
  email?: string
  telefone?: string
  representanteLegal?: string
  cpfRepresentante?: string
  orgaoSecretaria?: string
  naturezaJuridica?: string
  endereco?: string
  codigoConsisa?: string
  situacao?: string
  observacoes?: string
  // Status de importação
  status: 'valida' | 'duplicada' | 'erro'
  motivoErro?: string
}

interface ResultadoImportacao {
  totalLidas: number
  importadas: number
  duplicadasIgnoradas: number
  errosIgnorados: number
}

// Normalizador de texto para matching tolerante de cabeçalhos
export function normalizarTexto(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Inferência do Tipo de Vínculo: PJ, CLT ou deduzido pelo documento
export function interpretarTipoPrestador(
  valorTipo: unknown,
  documentoRaw?: unknown,
): PrestadorTipo | null {
  if (valorTipo !== null && valorTipo !== undefined) {
    const str = String(valorTipo).trim()
    if (str) {
      const norm = normalizarTexto(str)
      // Variações de CLT
      if (
        norm === 'clt' ||
        norm.includes('consolida') ||
        norm.includes('empregad') ||
        norm.includes('celetista') ||
        norm.includes('funcionario') ||
        norm.includes('trabalhador')
      ) {
        return 'CLT'
      }

      // Variações de PJ
      if (
        norm === 'pj' ||
        norm.includes('pessoajuridica') ||
        norm.includes('prestador') ||
        norm.includes('juridica') ||
        norm.includes('empresa') ||
        norm.includes('fornecedor') ||
        norm.includes('contrato')
      ) {
        return 'PJ'
      }

      const clean = str.replace(/[^a-zA-Z]/g, '').toUpperCase()
      if (clean === 'CLT') return 'CLT'
      if (clean === 'PJ') return 'PJ'
    }
  }

  // Se o tipo veio vazio ou não reconhecido, deduzir por CPF (11 dígitos) vs CNPJ (14 dígitos)
  if (documentoRaw !== null && documentoRaw !== undefined) {
    const digits = onlyDigits(String(documentoRaw))
    if (digits.length === 11) return 'CLT'
    if (digits.length === 14) return 'PJ'
    if (digits.length > 11) return 'PJ'
  }

  return null
}

// Formatar CPF ou CNPJ com máscara adequada
export function formatarDocumento(raw: string, tipo: PrestadorTipo | null): string {
  const digits = onlyDigits(raw)
  if (!digits) return ''
  if (tipo === 'CLT' || digits.length <= 11) {
    return maskCpf(digits)
  }
  return maskCnpj(digits)
}

export function ModalImportarPrestadores({
  open,
  onClose,
  onSuccess,
  prestadoresExistentes,
}: ModalImportarPrestadoresProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [lendoArquivo, setLendoArquivo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [linhas, setLinhas] = useState<LinhaPlanilhaPrestador[]>([])
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    setArquivo(null)
    setLinhas([])
    setResultado(null)
    setLendoArquivo(false)
    setSalvando(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleModalClose = () => {
    if (salvando) return
    handleReset()
    onClose()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setArquivo(file)
    setLendoArquivo(true)
    setResultado(null)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('A planilha selecionada não possui abas de dados.')
      }

      // Tenta aba com nome sugestivo ou a primeira
      const sheetName =
        workbook.SheetNames.find((s) => {
          const n = s.toUpperCase()
          return (
            n.includes('PRESTADOR') ||
            n.includes('COLABORADOR') ||
            n.includes('EQUIPE') ||
            n.includes('PROFISSIONAL') ||
            n.includes('PJ') ||
            n.includes('CLT')
          )
        }) || workbook.SheetNames[0]

      const sheet = workbook.Sheets[sheetName]
      const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        blankrows: false,
        raw: true,
      })

      if (!rawRows || rawRows.length === 0) {
        throw new Error('A planilha está vazia ou sem linhas legíveis.')
      }

      // Localizar linha de cabeçalho tolerante
      let headerIdx = -1
      for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
        const row = rawRows[i]
        if (Array.isArray(row)) {
          const rowText = row.map((cell) => normalizarTexto(String(cell || ''))).join(' ')
          const temNome =
            rowText.includes('nome') ||
            rowText.includes('razao') ||
            rowText.includes('empresa') ||
            rowText.includes('prestador') ||
            rowText.includes('colaborador')
          const temDocOuCargo =
            rowText.includes('cpf') ||
            rowText.includes('cnpj') ||
            rowText.includes('documento') ||
            rowText.includes('cargo') ||
            rowText.includes('funcao') ||
            rowText.includes('especialidade') ||
            rowText.includes('valor') ||
            rowText.includes('remuneracao')
          if (temNome && temDocOuCargo) {
            headerIdx = i
            break
          }
        }
      }

      if (headerIdx === -1 && rawRows.length > 1) {
        headerIdx = 0
      }

      if (headerIdx === -1) {
        throw new Error(
          'Não foi possível identificar o cabeçalho das colunas. Certifique-se de que a planilha contenha colunas como "Nome / Razão Social", "CPF / CNPJ", "Cargo / Função" e "Valor".',
        )
      }

      const headers = (rawRows[headerIdx] as unknown[]).map((h) => normalizarTexto(String(h || '')))

      // Índices flexíveis das colunas
      const tipoIdx = headers.findIndex(
        (h) =>
          h.includes('tipodevinculo') ||
          h.includes('tipovinculo') ||
          h === 'tipo' ||
          h.includes('vinculo') ||
          h.includes('regime'),
      )

      const nomeIdx = headers.findIndex(
        (h) =>
          h.includes('razaosocial') ||
          h.includes('nomecolaborador') ||
          h.includes('nomedaempresa') ||
          h.includes('nomecompleto') ||
          h.includes('prestador') ||
          h.includes('razao') ||
          h.includes('nome'),
      )

      const docIdx = headers.findIndex(
        (h) =>
          h.includes('cpfcnpj') ||
          h.includes('cpfoucnpj') ||
          h === 'cpf' ||
          h === 'cnpj' ||
          h.includes('documento') ||
          h.includes('cpfcolaborador') ||
          h.includes('cnpjempresa'),
      )

      const cargoIdx = headers.findIndex(
        (h) =>
          h.includes('cargoprofissao') ||
          h.includes('profissionalespecialidade') ||
          h.includes('especialidade') ||
          h.includes('cargofuncao') ||
          h.includes('cargo') ||
          h.includes('funcao') ||
          h.includes('profissao') ||
          h.includes('atividade'),
      )

      const servicoIdx = headers.findIndex(
        (h) =>
          h.includes('tipodeservico') ||
          h.includes('tiposervico') ||
          h.includes('modalidade') ||
          h.includes('periodicidade') ||
          h.includes('execucao') ||
          h.includes('formaexecucao'),
      )

      const valorIdx = headers.findIndex(
        (h) =>
          h.includes('remuneracaobase') ||
          h.includes('remuneracao') ||
          h.includes('salariobase') ||
          h.includes('salario') ||
          h.includes('valorunitario') ||
          h.includes('valormensal') ||
          h.includes('valor'),
      )

      const emailIdx = headers.findIndex((h) => h.includes('email') || h.includes('correio'))
      const telIdx = headers.findIndex(
        (h) => h.includes('telefone') || h.includes('celular') || h.includes('contato'),
      )
      const repIdx = headers.findIndex(
        (h) =>
          h.includes('representantelegal') ||
          h.includes('representante') ||
          h.includes('responsavel') ||
          h.includes('socio'),
      )
      const cpfRepIdx = headers.findIndex(
        (h) =>
          h.includes('cpfrepresentante') ||
          h.includes('cpfresponsavel') ||
          h.includes('cpfdoresponsavel'),
      )
      const orgaoIdx = headers.findIndex(
        (h) =>
          h.includes('orgaosecretaria') ||
          h.includes('secretaria') ||
          h.includes('orgao') ||
          h.includes('setor') ||
          h.includes('lotacao') ||
          h.includes('unidade'),
      )
      const consisaIdx = headers.findIndex(
        (h) => h.includes('consisa') || h.includes('matricula') || h.includes('codigoconsisa'),
      )
      const enderecoIdx = headers.findIndex(
        (h) => h.includes('endereco') || h.includes('logradouro'),
      )
      const naturezaIdx = headers.findIndex(
        (h) => h.includes('naturezajuridica') || h.includes('natureza'),
      )
      const situacaoIdx = headers.findIndex(
        (h) => h.includes('situacao') || h.includes('statusfuncional'),
      )
      const obsIdx = headers.findIndex(
        (h) => h.includes('observa') || h.includes('anotac') || h.includes('nota'),
      )

      if (nomeIdx === -1 && docIdx === -1) {
        throw new Error(
          'Colunas de identificação ("Nome / Razão Social" ou "CPF / CNPJ") não encontradas no cabeçalho.',
        )
      }

      // Conjuntos para checagem rápida de duplicidade com cadastros existentes
      const nomesExistentes = new Set<string>()
      const docsExistentes = new Set<string>()

      for (const p of prestadoresExistentes) {
        const nome = p.tipo === 'PJ' ? p.razao_social : p.nome_colaborador
        const doc = p.tipo === 'PJ' ? p.cnpj : p.cpf_colaborador
        if (nome) nomesExistentes.add(nome.trim().toLowerCase())
        if (doc) {
          const dDigits = onlyDigits(doc)
          if (dDigits) docsExistentes.add(dDigits)
        }
      }

      // Conjuntos para duplicidades internas na planilha
      const nomesNestaPlanilha = new Set<string>()
      const docsNestaPlanilha = new Set<string>()

      const parsedLinhas: LinhaPlanilhaPrestador[] = []

      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r]
        if (!row || !Array.isArray(row)) continue

        const rawTipo = tipoIdx !== -1 ? String(row[tipoIdx] ?? '').trim() : ''
        const rawNome = nomeIdx !== -1 ? String(row[nomeIdx] ?? '').trim() : ''
        const rawDoc = docIdx !== -1 ? String(row[docIdx] ?? '').trim() : ''
        const rawCargo = cargoIdx !== -1 ? String(row[cargoIdx] ?? '').trim() : ''
        // Preserva o texto da modalidade exatamente como veio na planilha
        const rawServico = servicoIdx !== -1 ? String(row[servicoIdx] ?? '').trim() : ''
        const rawValor = valorIdx !== -1 ? row[valorIdx] : ''

        // Linha completamente vazia
        if (!rawNome && !rawDoc && !rawCargo && (rawValor === '' || rawValor === undefined)) {
          continue
        }

        const tipoNormalizado = interpretarTipoPrestador(rawTipo, rawDoc)
        const digitsDoc = onlyDigits(rawDoc)
        const docFormatado = formatarDocumento(rawDoc, tipoNormalizado)
        const valorNumerico = parseCurrencyBRL(rawValor as string | number)

        // Opcionais
        const email = emailIdx !== -1 ? String(row[emailIdx] ?? '').trim() : undefined
        const telefone = telIdx !== -1 ? String(row[telIdx] ?? '').trim() : undefined
        const representante = repIdx !== -1 ? String(row[repIdx] ?? '').trim() : undefined
        const cpfRepRaw = cpfRepIdx !== -1 ? String(row[cpfRepIdx] ?? '').trim() : undefined
        const cpfRepresentante = cpfRepRaw ? maskCpf(cpfRepRaw) : undefined
        const orgaoSecretaria = orgaoIdx !== -1 ? String(row[orgaoIdx] ?? '').trim() : undefined
        const codigoConsisa = consisaIdx !== -1 ? String(row[consisaIdx] ?? '').trim() : undefined
        const endereco = enderecoIdx !== -1 ? String(row[enderecoIdx] ?? '').trim() : undefined
        const naturezaJuridica =
          naturezaIdx !== -1 ? String(row[naturezaIdx] ?? '').trim() : undefined
        const situacao = situacaoIdx !== -1 ? String(row[situacaoIdx] ?? '').trim() : undefined
        const obsPlanilha = obsIdx !== -1 ? String(row[obsIdx] ?? '').trim() : undefined

        // Monta observações adicionais agrupando dados extras úteis
        const extraParts: string[] = []
        if (email) extraParts.push(`E-mail: ${email}`)
        if (telefone) extraParts.push(`Telefone: ${telefone}`)
        if (rawServico) extraParts.push(`Modalidade: ${rawServico}`)
        if (orgaoSecretaria && tipoNormalizado === 'PJ') {
          extraParts.push(`Órgão/Secretaria: ${orgaoSecretaria}`)
        }
        if (obsPlanilha) extraParts.push(obsPlanilha)
        const observacoesFinal = extraParts.join(' | ') || undefined

        // Validação e detecção de status
        let status: 'valida' | 'duplicada' | 'erro' = 'valida'
        let motivoErro: string | undefined

        const nomeKey = rawNome.toLowerCase()
        const docJaExisteNoBanco = digitsDoc ? docsExistentes.has(digitsDoc) : false
        const nomeJaExisteNoBanco = nomeKey ? nomesExistentes.has(nomeKey) : false
        const docDuplicadoNaPlanilha = digitsDoc ? docsNestaPlanilha.has(digitsDoc) : false
        const nomeDuplicadoNaPlanilha = nomeKey ? nomesNestaPlanilha.has(nomeKey) : false

        if (!rawNome) {
          status = 'erro'
          motivoErro = 'Nome ou Razão Social ausente'
        } else if (!tipoNormalizado) {
          status = 'erro'
          motivoErro = `Tipo de vínculo não deduzível ("${rawTipo || 'vazio'}"). Informe CLT/PJ ou CPF/CNPJ válido.`
        } else if (!rawDoc) {
          status = 'erro'
          motivoErro = `${tipoNormalizado === 'PJ' ? 'CNPJ' : 'CPF'} obrigatório não informado`
        } else if (tipoNormalizado === 'PJ' && digitsDoc.length !== 14 && digitsDoc.length !== 18) {
          status = 'erro'
          motivoErro = `CNPJ incompleto ou inválido (${digitsDoc.length} dígitos encontrados)`
        } else if (tipoNormalizado === 'CLT' && digitsDoc.length !== 11) {
          status = 'erro'
          motivoErro = `CPF incompleto ou inválido (${digitsDoc.length} dígitos encontrados)`
        } else if (!rawCargo) {
          status = 'erro'
          motivoErro = `${tipoNormalizado === 'PJ' ? 'Especialidade / Profissional' : 'Cargo'} obrigatório não informado`
        } else if (docJaExisteNoBanco) {
          status = 'duplicada'
          motivoErro = `Documento (${docFormatado}) já cadastrado no sistema (será ignorado)`
        } else if (nomeJaExisteNoBanco) {
          status = 'duplicada'
          motivoErro = `Prestador/Colaborador "${rawNome}" já existe no sistema (será ignorado)`
        } else if (docDuplicadoNaPlanilha) {
          status = 'duplicada'
          motivoErro = `Documento (${docFormatado}) repetido nesta mesma planilha (será ignorado)`
        } else if (nomeDuplicadoNaPlanilha) {
          status = 'duplicada'
          motivoErro = `Nome repetido nesta mesma planilha (será ignorado)`
        } else {
          if (digitsDoc) docsNestaPlanilha.add(digitsDoc)
          if (nomeKey) nomesNestaPlanilha.add(nomeKey)
        }

        parsedLinhas.push({
          index: r + 1,
          tipoOriginal: rawTipo,
          tipoNormalizado,
          nomeRazaoSocial: rawNome,
          cpfOuCnpjOriginal: rawDoc,
          documentoFormatado: docFormatado,
          cargoProfissao: rawCargo,
          tipoServicoModalidade: rawServico,
          remuneracaoBase: valorNumerico,
          email: email || undefined,
          telefone: telefone || undefined,
          representanteLegal: representante || undefined,
          cpfRepresentante: cpfRepresentante || undefined,
          orgaoSecretaria: orgaoSecretaria || undefined,
          naturezaJuridica: naturezaJuridica || undefined,
          endereco: endereco || undefined,
          codigoConsisa: codigoConsisa || undefined,
          situacao: situacao || (tipoNormalizado === 'CLT' ? 'Ativo' : undefined),
          observacoes: observacoesFinal,
          status,
          motivoErro,
        })
      }

      if (parsedLinhas.length === 0) {
        throw new Error(
          'Nenhuma linha de prestador ou colaborador encontrada após a linha de cabeçalho.',
        )
      }

      setLinhas(parsedLinhas)
      toast.info(
        `${parsedLinhas.length} linha(s) lida(s) da planilha. Revise a prévia antes de confirmar.`,
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar arquivo Excel.'
      toast.error(msg)
      handleReset()
    } finally {
      setLendoArquivo(false)
    }
  }

  // Baixar planilha modelo com exemplos PJ e CLT
  const handleDownloadModelo = () => {
    const wb = XLSX.utils.book_new()
    const dadosModelo = [
      [
        'Tipo de Vínculo',
        'Nome / Razão Social',
        'CPF / CNPJ',
        'Cargo / Profissão',
        'Tipo de Serviço / Modalidade',
        'Remuneração Base',
        'Representante Legal',
        'CPF Representante',
        'E-mail',
        'Telefone',
        'Órgão / Secretaria / Setor',
        'Código Consisa',
      ],
      [
        'PJ',
        'Vitalis Fisioterapia Integrada LTDA',
        '12.345.678/0001-90',
        'Fisioterapeuta Especialista',
        'Mensal',
        '4.800,00',
        'Dr. Roberto Alencar',
        '123.456.789-00',
        'contato@vitalisfisio.com.br',
        '(11) 98765-4321',
        'Secretaria de Saúde',
        '',
      ],
      [
        'CLT',
        'Aline de Oliveira Santos',
        '987.654.321-00',
        'Técnica de Enfermagem',
        'Mensal',
        '2.650,00',
        '',
        '',
        'aline.santos@email.com',
        '(11) 91234-5678',
        'PSF Vila Esperança',
        '391',
      ],
      [
        'PJ',
        'CardioLife Serviços Médicos LTDA',
        '34.567.890/0001-12',
        'Médico Cardiologista',
        'Plantão',
        '1.800,00',
        'Dra. Camila Nogueira',
        '456.789.012-34',
        'clinica@cardiolife.med.br',
        '(11) 97654-3210',
        'Hospital Municipal',
        '',
      ],
      [
        'CLT',
        'Marcos Vinicius de Souza',
        '456.123.789-10',
        'Assistente Administrativo',
        'Conforme Demanda',
        '2.200,00',
        '',
        '',
        'marcos.souza@email.com',
        '(11) 94567-8901',
        'Sede Administrativa OSCIP',
        '405',
      ],
    ]
    const ws = XLSX.utils.aoa_to_sheet(dadosModelo)
    // Larguras das colunas
    ws['!cols'] = [
      { wch: 16 }, // Tipo de Vínculo
      { wch: 36 }, // Nome / Razão Social
      { wch: 22 }, // CPF / CNPJ
      { wch: 28 }, // Cargo / Profissão
      { wch: 26 }, // Tipo de Serviço / Modalidade
      { wch: 20 }, // Remuneração Base
      { wch: 24 }, // Representante Legal
      { wch: 20 }, // CPF Representante
      { wch: 26 }, // E-mail
      { wch: 18 }, // Telefone
      { wch: 26 }, // Órgão / Secretaria / Setor
      { wch: 16 }, // Código Consisa
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Prestadores e Colaboradores')
    XLSX.writeFile(wb, 'Modelo_Importacao_Prestadores_Colaboradores.xlsx')
  }

  const handleConfirmarImportacao = async () => {
    const linhasValidas = linhas.filter((l) => l.status === 'valida')
    if (linhasValidas.length === 0) {
      toast.warning('Não há registros válidos para importar nesta planilha.')
      return
    }

    setSalvando(true)
    let importadas = 0
    let falhasInesperadas = 0

    try {
      for (const linha of linhasValidas) {
        if (!linha.tipoNormalizado) continue

        const payload: Partial<PrestadorColaboradorRecord> = {
          tipo: linha.tipoNormalizado,
          cargo: linha.cargoProfissao.trim(),
          remuneracao_base: linha.remuneracaoBase > 0 ? linha.remuneracaoBase : undefined,
          observacoes: linha.observacoes,
        }

        if (linha.tipoNormalizado === 'PJ') {
          payload.razao_social = linha.nomeRazaoSocial.trim()
          payload.cnpj = linha.documentoFormatado
          payload.profissional = linha.representanteLegal || undefined
          payload.cpf_profissional = linha.cpfRepresentante || undefined
          payload.natureza_juridica = linha.naturezaJuridica || 'Sociedade Limitada (LTDA)'
          payload.endereco = linha.endereco || undefined
        } else {
          payload.nome_colaborador = linha.nomeRazaoSocial.trim()
          payload.cpf_colaborador = linha.documentoFormatado
          payload.codigo_consisa = linha.codigoConsisa || undefined
          payload.setor = linha.orgaoSecretaria || undefined
          payload.situacao = linha.situacao || 'Ativo'
        }

        try {
          await createPrestadorColaborador(payload)
          importadas++
        } catch (itemErr) {
          console.error(`Erro ao criar prestador "${linha.nomeRazaoSocial}":`, itemErr)
          falhasInesperadas++
        }
      }

      const duplicadasCount = linhas.filter((l) => l.status === 'duplicada').length
      const errosCount = linhas.filter((l) => l.status === 'erro').length + falhasInesperadas

      setResultado({
        totalLidas: linhas.length,
        importadas,
        duplicadasIgnoradas: duplicadasCount,
        errosIgnorados: errosCount,
      })

      if (importadas > 0) {
        toast.success(
          `${importadas} prestador(es)/colaborador(es) cadastrado(s) com sucesso a partir da planilha!`,
        )
        onSuccess()
      } else {
        toast.error('Nenhum cadastro pôde ser concluído devido a inconsistências.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha durante a importação.'
      toast.error(msg)
    } finally {
      setSalvando(false)
    }
  }

  const linhasValidasCount = linhas.filter((l) => l.status === 'valida').length
  const linhasDuplicadasCount = linhas.filter((l) => l.status === 'duplicada').length
  const linhasErroCount = linhas.filter((l) => l.status === 'erro').length

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#1FAF7A] flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#1E293B]">
                  Importar Planilha de Prestadores & Colaboradores (.xlsx / .xls)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#64748B]">
                  Cadastre em lote profissionais PJ e trabalhadores CLT a partir de uma planilha
                  Excel.
                </DialogDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadModelo}
              className="text-xs text-[#1FAF7A] border-[#1FAF7A]/30 hover:bg-emerald-50 hidden sm:inline-flex"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" />
              Baixar Modelo Exemplo
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!resultado && (
            <>
              {/* Área de Seleção de Arquivo */}
              <div className="p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-center space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleFileChange}
                  disabled={lendoArquivo || salvando}
                  className="sr-only"
                  id="excel-file-prestadores"
                />

                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1FAF7A] flex items-center justify-center mb-2">
                    {lendoArquivo ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <label
                    htmlFor="excel-file-prestadores"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {arquivo ? 'Trocar Planilha Selecionada' : 'Selecionar Arquivo .xlsx / .xls'}
                  </label>
                  {arquivo && (
                    <p className="text-xs font-medium text-[#1E293B] mt-2">
                      Arquivo: <strong>{arquivo.name}</strong> ({(arquivo.size / 1024).toFixed(1)}{' '}
                      KB)
                    </p>
                  )}
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Colunas aceitas: <strong>Tipo</strong> (CLT ou PJ),{' '}
                    <strong>Nome / Razão Social</strong>, <strong>CPF / CNPJ</strong>,{' '}
                    <strong>Cargo / Especialidade</strong>,{' '}
                    <strong>Tipo de Serviço / Modalidade</strong> e <strong>Remuneração</strong>.
                  </p>
                </div>
              </div>

              {/* Botão Baixar Modelo no Mobile */}
              <div className="sm:hidden flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadModelo}
                  className="text-xs text-[#1FAF7A] border-[#1FAF7A]/30 w-full"
                >
                  <FileDown className="w-3.5 h-3.5 mr-1.5" />
                  Baixar Modelo Exemplo (.xlsx)
                </Button>
              </div>

              {/* Prévia das Linhas */}
              {linhas.length > 0 && (
                <div className="space-y-3">
                  {/* Cards de Resumo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg border bg-slate-50 border-slate-200">
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase block">
                        Total Lidas
                      </span>
                      <span className="text-base font-bold text-[#1E293B]">{linhas.length}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-200">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase block">
                        Válidas para Gravar
                      </span>
                      <span className="text-base font-bold text-emerald-700">
                        {linhasValidasCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-amber-50 border-amber-200">
                      <span className="text-[10px] font-semibold text-amber-700 uppercase block">
                        Duplicadas (Pular)
                      </span>
                      <span className="text-base font-bold text-amber-700">
                        {linhasDuplicadasCount}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-red-50 border-red-200">
                      <span className="text-[10px] font-semibold text-red-700 uppercase block">
                        Com Erro (Ignoradas)
                      </span>
                      <span className="text-base font-bold text-red-700">{linhasErroCount}</span>
                    </div>
                  </div>

                  {linhasDuplicadasCount > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      <Info className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        {linhasDuplicadasCount} registro(s) já existem no cadastro ou estão
                        repetidos nesta planilha e serão ignorados automaticamente para evitar
                        duplicidade.
                      </span>
                    </div>
                  )}

                  {/* Tabela de Prévia */}
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <div className="max-h-72 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-slate-100 border-b border-[#E2E8F0] text-[#64748B]">
                          <tr>
                            <th className="py-2 px-3 font-semibold w-12 text-center">Linha</th>
                            <th className="py-2 px-3 font-semibold w-16 text-center">Tipo</th>
                            <th className="py-2 px-3 font-semibold">Nome / Razão Social</th>
                            <th className="py-2 px-3 font-semibold w-36">Documento</th>
                            <th className="py-2 px-3 font-semibold">Cargo / Especialidade</th>
                            <th className="py-2 px-3 font-semibold w-28">Modalidade</th>
                            <th className="py-2 px-3 font-semibold w-24 text-right">Valor</th>
                            <th className="py-2 px-3 font-semibold w-28 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F5F9] bg-white">
                          {linhas.map((l) => (
                            <tr
                              key={l.index}
                              className={`hover:bg-slate-50 transition-colors ${
                                l.status === 'erro'
                                  ? 'bg-red-50/40'
                                  : l.status === 'duplicada'
                                    ? 'bg-amber-50/40'
                                    : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center text-[11px] text-[#64748B] font-mono">
                                {l.index}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {l.tipoNormalizado ? (
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      l.tipoNormalizado === 'CLT'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                                    }`}
                                  >
                                    {l.tipoNormalizado}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
                                    {l.tipoOriginal || '—'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-[#1E293B] block">
                                  {l.nomeRazaoSocial || (
                                    <span className="text-red-500 italic">[Sem Nome / Razão]</span>
                                  )}
                                </span>
                                {l.representanteLegal && (
                                  <span className="text-[10px] text-[#64748B] block">
                                    Rep: {l.representanteLegal}
                                  </span>
                                )}
                                {l.motivoErro && (
                                  <span
                                    className={`text-[10px] block font-medium ${
                                      l.status === 'erro' ? 'text-red-600' : 'text-amber-700'
                                    }`}
                                  >
                                    {l.motivoErro}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-[#475569]">
                                {l.documentoFormatado || (
                                  <span className="text-red-500 italic">
                                    {l.cpfOuCnpjOriginal || '[Vazio]'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[#1E293B] font-medium">
                                {l.cargoProfissao || (
                                  <span className="text-red-500 italic">[Sem Cargo]</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-[#64748B]">
                                {l.tipoServicoModalidade || '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-[#1E293B] tabular-nums">
                                {l.remuneracaoBase > 0 ? (
                                  formatBRL(l.remuneracaoBase)
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {l.status === 'valida' && (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Válida
                                  </Badge>
                                )}
                                {l.status === 'duplicada' && (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] gap-1"
                                  >
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    Duplicada
                                  </Badge>
                                )}
                                {l.status === 'erro' && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-600 border-red-300 text-[10px] gap-1"
                                  >
                                    <XCircle className="w-3 h-3 text-red-600" />
                                    Erro
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Resumo Final Pós-Importação */}
          {resultado && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#1E293B]">
                  Importação Finalizada com Sucesso!
                </h4>
                <p className="text-xs text-[#475569]">
                  Foram cadastrados <strong>{resultado.importadas}</strong> prestador(es) /
                  colaborador(es) com sucesso no sistema.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-center">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
                    Cadastrados
                  </span>
                  <span className="text-lg font-bold text-emerald-700">{resultado.importadas}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-center">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
                    Duplicados Ignorados
                  </span>
                  <span className="text-lg font-bold text-amber-700">
                    {resultado.duplicadasIgnoradas}
                  </span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-center">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
                    Linhas com Erro
                  </span>
                  <span className="text-lg font-bold text-red-700">{resultado.errosIgnorados}</span>
                </div>
              </div>

              {resultado.errosIgnorados > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1.5 text-xs text-red-700">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Linhas não importadas por inconsistências:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800">
                    {linhas
                      .filter((l) => l.status === 'erro')
                      .slice(0, 5)
                      .map((l) => (
                        <li key={l.index}>
                          Linha {l.index}: {l.nomeRazaoSocial || 'Registro sem nome'} —{' '}
                          {l.motivoErro || 'Erro desconhecido'}
                        </li>
                      ))}
                    {linhas.filter((l) => l.status === 'erro').length > 5 && (
                      <li className="italic">
                        ... e mais {linhas.filter((l) => l.status === 'erro').length - 5} linha(s)
                        com erro.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 gap-2">
          {resultado ? (
            <Button
              type="button"
              onClick={handleModalClose}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
            >
              Concluir e Fechar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={salvando || lendoArquivo}
              >
                Cancelar
              </Button>

              {linhasValidasCount > 0 && (
                <Button
                  type="button"
                  onClick={handleConfirmarImportacao}
                  disabled={salvando || lendoArquivo}
                  className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
                >
                  {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {salvando
                    ? 'Gravando Cadastros...'
                    : `Confirmar Importação (${linhasValidasCount} válidos)`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
