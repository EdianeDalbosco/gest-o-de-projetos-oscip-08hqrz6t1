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
import { parseCurrencyBRL } from '@/lib/masks'
import { createCatalogoAtividade } from '@/services/api'
import type { CatalogoAtividadeRecord, TipoExecucaoAtividade } from '@/types'
import { toast } from 'sonner'

interface ModalImportarAtividadesProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  projetoId: string
  catalogoExistente: CatalogoAtividadeRecord[]
}

export interface LinhaPlanilhaAtividade {
  index: number
  descricao: string
  tipoOriginal: string
  tipoNormalizado: 'CLT' | 'PJ' | null
  tipoExecucao: TipoExecucaoAtividade
  valorOriginal: string | number
  valorNumerico: number
  detalhesEscopo?: string
  proventos?: number
  provisao?: number
  encargos?: number
  isDuplicada: boolean
  status: 'valida' | 'duplicada' | 'erro'
  motivoErro?: string
}

interface ResultadoImportacao {
  totalLidas: number
  importadas: number
  duplicadasIgnoradas: number
  errosIgnorados: number
}

// Normalizador de strings para matching tolerante de cabeçalhos
function normalizarTexto(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

// Inferência do Tipo de Vínculo: aceita variações de CLT e PJ
export function interpretarTipoVinculo(valor: unknown): 'CLT' | 'PJ' | null {
  if (valor === null || valor === undefined) return null
  const str = String(valor).trim()
  if (!str) return null
  const norm = normalizarTexto(str)

  // Variações de CLT
  if (
    norm === 'clt' ||
    norm.includes('consolida') ||
    norm.includes('empregad') ||
    norm.includes('celetista') ||
    norm.includes('funcionario')
  ) {
    return 'CLT'
  }

  // Variações de PJ
  if (
    norm === 'pj' ||
    norm.includes('pessoajuridica') ||
    norm.includes('prestador') ||
    norm.includes('juridica') ||
    norm.includes('servico') ||
    norm.includes('contrato')
  ) {
    return 'PJ'
  }

  // Tentativa direta sem pontuação
  const clean = str.replace(/[^a-zA-Z]/g, '').toUpperCase()
  if (clean === 'CLT') return 'CLT'
  if (clean === 'PJ') return 'PJ'

  return null
}

// Inferência de Tipo de Execução
export function inferirTipoExecucao(
  tipoVinculo: 'CLT' | 'PJ',
  rawExecucao?: unknown,
  rawDescricao?: string,
): TipoExecucaoAtividade {
  if (tipoVinculo === 'CLT') return 'Mensal'

  const texto = `${rawExecucao || ''} ${rawDescricao || ''}`.toLowerCase()
  if (texto.includes('plantao') || texto.includes('plantão')) {
    return 'Plantão'
  }
  if (texto.includes('demanda') || texto.includes('conforme')) {
    return 'Conforme Demanda'
  }
  return 'Serviço Mensal'
}

export function ModalImportarAtividades({
  open,
  onClose,
  onSuccess,
  projetoId,
  catalogoExistente,
}: ModalImportarAtividadesProps) {
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [lendoArquivo, setLendoArquivo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [linhas, setLinhas] = useState<LinhaPlanilhaAtividade[]>([])
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
            n.includes('ATIVIDADE') ||
            n.includes('CATALOGO') ||
            n.includes('ANEXO') ||
            n.includes('PT') ||
            n.includes('CARGOS')
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

      // Localizar linha de cabeçalho tolerante (procura palavras: descrição/atividade/cargo e tipo/vínculo ou valor/remuneração)
      let headerIdx = -1
      for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
        const row = rawRows[i]
        if (Array.isArray(row)) {
          const rowText = row.map((cell) => normalizarTexto(String(cell || ''))).join(' ')
          const temDescricao =
            rowText.includes('descricao') ||
            rowText.includes('atividade') ||
            rowText.includes('cargo') ||
            rowText.includes('funcao')
          const temTipoOuValor =
            rowText.includes('tipo') ||
            rowText.includes('vinculo') ||
            rowText.includes('valor') ||
            rowText.includes('remuneracao') ||
            rowText.includes('salario')
          if (temDescricao && temTipoOuValor) {
            headerIdx = i
            break
          }
        }
      }

      // Se não encontrou linha óbvia, assume que a linha 0 é o cabeçalho se houver mais de 1 linha
      if (headerIdx === -1 && rawRows.length > 1) {
        headerIdx = 0
      }

      if (headerIdx === -1) {
        throw new Error(
          'Não foi possível identificar o cabeçalho das colunas. Certifique-se de que a planilha contenha colunas como "Descrição", "Tipo" e "Valor".',
        )
      }

      const headers = (rawRows[headerIdx] as unknown[]).map((h) => normalizarTexto(String(h || '')))

      // Identificação flexível das colunas
      const descIdx = headers.findIndex(
        (h) =>
          h.includes('descricao') ||
          h.includes('atividade') ||
          h.includes('cargo') ||
          h.includes('funcao') ||
          h.includes('nome'),
      )

      const tipoIdx = headers.findIndex(
        (h) =>
          h.includes('tipovinculo') ||
          h === 'tipo' ||
          h.includes('vinculo') ||
          h.includes('regime') ||
          h.includes('modalidade'),
      )

      const valorIdx = headers.findIndex(
        (h) =>
          h.includes('valorunitario') ||
          h.includes('remuneracao') ||
          h === 'valor' ||
          h.includes('salario') ||
          h.includes('custo') ||
          h.includes('unitario'),
      )

      const execIdx = headers.findIndex(
        (h) =>
          h.includes('tipoexecucao') ||
          h.includes('execucao') ||
          h.includes('periodicidade') ||
          h.includes('regimedetrabalho'),
      )

      const escopoIdx = headers.findIndex(
        (h) =>
          h.includes('escopo') ||
          h.includes('atribuic') ||
          h.includes('detalhe') ||
          h.includes('observa'),
      )

      const proventosIdx = headers.findIndex((h) => h.includes('provento'))
      const provisaoIdx = headers.findIndex((h) => h.includes('provisao'))
      const encargosIdx = headers.findIndex((h) => h.includes('encargo'))

      if (descIdx === -1) {
        throw new Error('Coluna de "Descrição" ou "Atividade / Cargo" não encontrada no cabeçalho.')
      }

      // Mapa para checagem rápida de duplicidade com o catálogo existente
      const existentesMap = new Set(catalogoExistente.map((c) => c.descricao.trim().toLowerCase()))

      // Também detecta duplicidade interna na própria planilha
      const lidosNestaPlanilha = new Set<string>()

      const parsedLinhas: LinhaPlanilhaAtividade[] = []

      for (let r = headerIdx + 1; r < rawRows.length; r++) {
        const row = rawRows[r]
        if (!row || !Array.isArray(row)) continue

        const rawDesc = descIdx !== -1 ? String(row[descIdx] ?? '').trim() : ''
        const rawTipo = tipoIdx !== -1 ? String(row[tipoIdx] ?? '').trim() : ''
        const rawValor = valorIdx !== -1 ? row[valorIdx] : ''
        const rawExec = execIdx !== -1 ? row[execIdx] : undefined
        const rawEscopo = escopoIdx !== -1 ? String(row[escopoIdx] ?? '').trim() : undefined

        // Linha completamente vazia é ignorada
        if (!rawDesc && !rawTipo && (rawValor === '' || rawValor === undefined)) {
          continue
        }

        const tipoNormalizado = interpretarTipoVinculo(rawTipo)
        const valorNumerico = parseCurrencyBRL(rawValor as string | number)
        const proventosNum =
          proventosIdx !== -1 ? parseCurrencyBRL(row[proventosIdx] as string | number) : undefined
        const provisaoNum =
          provisaoIdx !== -1 ? parseCurrencyBRL(row[provisaoIdx] as string | number) : undefined
        const encargosNum =
          encargosIdx !== -1 ? parseCurrencyBRL(row[encargosIdx] as string | number) : undefined

        let tipoExecucao: TipoExecucaoAtividade = 'Serviço Mensal'
        if (tipoNormalizado) {
          tipoExecucao = inferirTipoExecucao(tipoNormalizado, rawExec, rawDesc)
        }

        // Validações
        const descKey = rawDesc.toLowerCase()
        const jaExisteNoProjeto = descKey ? existentesMap.has(descKey) : false
        const duplicadoNaPlanilha = descKey ? lidosNestaPlanilha.has(descKey) : false

        let status: 'valida' | 'duplicada' | 'erro' = 'valida'
        let motivoErro: string | undefined

        if (!rawDesc) {
          status = 'erro'
          motivoErro = 'Descrição da atividade obrigatória'
        } else if (!tipoNormalizado) {
          status = 'erro'
          motivoErro = `Tipo inválido ("${rawTipo || 'vazio'}"). Esperado CLT ou PJ.`
        } else if (isNaN(valorNumerico) || valorNumerico <= 0) {
          status = 'erro'
          motivoErro = 'Valor inválido ou menor/igual a zero'
        } else if (jaExisteNoProjeto) {
          status = 'duplicada'
          motivoErro = 'Atividade já existente neste projeto (será ignorada)'
        } else if (duplicadoNaPlanilha) {
          status = 'duplicada'
          motivoErro = 'Atividade repetida nesta mesma planilha (será ignorada)'
        } else {
          lidosNestaPlanilha.add(descKey)
        }

        parsedLinhas.push({
          index: r + 1,
          descricao: rawDesc,
          tipoOriginal: rawTipo,
          tipoNormalizado,
          tipoExecucao,
          valorOriginal: (rawValor as string | number) ?? '',
          valorNumerico,
          detalhesEscopo: rawEscopo || undefined,
          proventos: proventosNum && proventosNum > 0 ? proventosNum : undefined,
          provisao: provisaoNum && provisaoNum > 0 ? provisaoNum : undefined,
          encargos: encargosNum && encargosNum > 0 ? encargosNum : undefined,
          isDuplicada: jaExisteNoProjeto || duplicadoNaPlanilha,
          status,
          motivoErro,
        })
      }

      if (parsedLinhas.length === 0) {
        throw new Error('Nenhuma linha de dados encontrada após a linha de cabeçalho.')
      }

      setLinhas(parsedLinhas)
      toast.info(`${parsedLinhas.length} linha(s) lida(s) da planilha. Revise antes de confirmar.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar arquivo Excel.'
      toast.error(msg)
      handleReset()
    } finally {
      setLendoArquivo(false)
    }
  }

  // Baixar modelo de planilha de exemplo
  const handleDownloadModelo = () => {
    const wb = XLSX.utils.book_new()
    const dadosModelo = [
      [
        'Descrição da Atividade',
        'Tipo',
        'Tipo de Execução',
        'Valor Unitário',
        'Escopo / Atribuições',
      ],
      [
        'Médico Clínico Geral',
        'PJ',
        'Plantão',
        '1.800,00',
        'Plantões médicos presenciais na unidade conforme escala.',
      ],
      [
        'Enfermeiro Coordenador',
        'CLT',
        'Mensal',
        '4.500,00',
        'Coordenação da equipe de enfermagem e supervisão de rotinas.',
      ],
      [
        'Psicólogo Social',
        'PJ',
        'Serviço Mensal',
        '3.200,00',
        'Atendimentos psicológicos individuais e atividades grupais.',
      ],
      [
        'Assistente Administrativo',
        'CLT',
        'Mensal',
        '2.400,00',
        'Suporte documental, faturamento e prestação de contas.',
      ],
    ]
    const ws = XLSX.utils.aoa_to_sheet(dadosModelo)
    // Larguras das colunas
    ws['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 20 }, { wch: 18 }, { wch: 45 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Atividades')
    XLSX.writeFile(wb, 'Modelo_Importacao_Atividades.xlsx')
  }

  const handleConfirmarImportacao = async () => {
    const linhasValidas = linhas.filter((l) => l.status === 'valida')
    if (linhasValidas.length === 0) {
      toast.warning('Não há atividades válidas para importar nesta planilha.')
      return
    }

    setSalvando(true)
    let importadas = 0
    let falhasInesperadas = 0

    try {
      for (const linha of linhasValidas) {
        if (!linha.tipoNormalizado) continue

        const payload: Partial<CatalogoAtividadeRecord> = {
          projeto_id: projetoId,
          tipo_vinculo: linha.tipoNormalizado,
          tipo_execucao: linha.tipoExecucao,
          descricao: linha.descricao.trim(),
          valor_unitario: linha.valorNumerico,
          detalhes_escopo: linha.detalhesEscopo,
          proventos: linha.proventos,
          provisao: linha.provisao,
          encargos: linha.encargos,
        }

        try {
          await createCatalogoAtividade(payload)
          importadas++
        } catch (itemErr) {
          console.error(`Erro ao criar atividade "${linha.descricao}":`, itemErr)
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
          `${importadas} atividade(s) importada(s) com sucesso no catálogo deste projeto!`,
        )
        onSuccess()
      } else {
        toast.error('Nenhuma atividade pôde ser importada devido a inconsistências.')
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
                  Importar Atividades via Planilha (.xlsx / .xls)
                </DialogTitle>
                <DialogDescription className="text-xs text-[#64748B]">
                  Cadastre atividades em lote no catálogo do projeto a partir de uma planilha Excel.
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
          {/* Se ainda não processou resultado final */}
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
                  id="excel-file-input"
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
                    htmlFor="excel-file-input"
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
                    Colunas esperadas: <strong>Descrição / Atividade</strong>, <strong>Tipo</strong>{' '}
                    (CLT ou PJ), <strong>Valor</strong> (ex: R$ 1.500,00 ou 1500.00).
                  </p>
                </div>
              </div>

              {/* Botão modelo no mobile */}
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
                  {/* Cards de Resumo da Prévia */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-lg border bg-slate-50 border-slate-200">
                      <span className="text-[10px] font-semibold text-[#64748B] uppercase block">
                        Total Lidas
                      </span>
                      <span className="text-base font-bold text-[#1E293B]">{linhas.length}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-200">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase block">
                        Válidas para Importar
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
                        {linhasDuplicadasCount} atividade(s) já existem no catálogo deste projeto ou
                        estão repetidas na planilha e serão ignoradas automaticamente para evitar
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
                            <th className="py-2 px-3 font-semibold">Descrição / Cargo</th>
                            <th className="py-2 px-3 font-semibold w-24">Tipo</th>
                            <th className="py-2 px-3 font-semibold w-28">Execução</th>
                            <th className="py-2 px-3 font-semibold w-28 text-right">Valor</th>
                            <th className="py-2 px-3 font-semibold w-32 text-center">Status</th>
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
                              <td className="py-2 px-3">
                                <span className="font-semibold text-[#1E293B] block">
                                  {l.descricao || (
                                    <span className="text-red-500 italic">[Sem Descrição]</span>
                                  )}
                                </span>
                                {l.detalhesEscopo && (
                                  <span className="text-[10px] text-[#64748B] line-clamp-1">
                                    {l.detalhesEscopo}
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
                              <td className="py-2 px-3">
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
                                    {l.tipoOriginal || 'Inválido'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-[#475569]">
                                {l.tipoExecucao}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-semibold text-[#1E293B] tabular-nums">
                                {l.valorNumerico > 0 ? (
                                  formatBRL(l.valorNumerico)
                                ) : (
                                  <span className="text-red-500 text-[11px]">
                                    {String(l.valorOriginal) || '0,00'}
                                  </span>
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
                  Foram importadas <strong>{resultado.importadas}</strong> atividade(s) para o
                  catálogo deste projeto.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-center">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
                    Cadastradas
                  </span>
                  <span className="text-lg font-bold text-emerald-700">{resultado.importadas}</span>
                </div>
                <div className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-center">
                  <span className="text-[10px] text-[#64748B] uppercase font-semibold block">
                    Duplicadas Ignoradas
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
                          Linha {l.index}: {l.descricao || 'Atividade sem nome'} —{' '}
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
                    ? 'Importando Atividades...'
                    : `Confirmar Importação (${linhasValidasCount} válidas)`}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
