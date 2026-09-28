import * as XLSX from 'xlsx'
import type { ProjetoRecord, CatalogoAtividadeRecord } from '@/types'
import { getCatalogoAtividades } from '@/services/api'
import { DADOS_CONTRATANTE } from '@/lib/modelosContratoPJ'

export interface ExportAtividadesExcelOptions {
  projetos: ProjetoRecord[]
  filtroBusca?: string
  filtroStatus?: string
}

export interface LinhaAtividadeExport {
  secretaria: string
  projeto: string
  atividade: string
  tipo: string
  tipoExecucao: string
  valor: number
}

/**
 * Busca todas as atividades do catálogo vinculadas aos projetos fornecidos,
 * mantendo a ordem exata dos projetos e a ordem interna do catálogo.
 * Respeita filtros aplicados na tela.
 */
export async function exportarAtividadesPorSecretariaExcel({
  projetos,
  filtroBusca,
  filtroStatus,
}: ExportAtividadesExcelOptions): Promise<{ totalLinhas: number; totalGeral: number }> {
  if (!projetos || projetos.length === 0) {
    throw new Error('Nenhum projeto selecionado para exportação.')
  }

  // 1. Carregar atividades de todos os projetos em paralelo mantendo o vínculo
  const projetoIds = projetos.map((p) => p.id)

  // Otimização: buscar catálogo geral ou por projeto
  // getCatalogoAtividades() sem parâmetro retorna todas com sort: 'descricao', expand: 'projeto_id'
  const todasAtividades = await getCatalogoAtividades()

  // Agrupar atividades por projeto_id mantendo a lista
  const atividadesPorProjeto = new Map<string, CatalogoAtividadeRecord[]>()
  for (const ativ of todasAtividades) {
    const pId = ativ.projeto_id
    if (!pId) continue
    if (!atividadesPorProjeto.has(pId)) {
      atividadesPorProjeto.set(pId, [])
    }
    atividadesPorProjeto.get(pId)!.push(ativ)
  }

  // 2. Montar as linhas na mesma ordenação dos projetos recebidos
  const linhas: LinhaAtividadeExport[] = []

  for (const proj of projetos) {
    const rawSecretaria = (proj.expand?.secretaria_id?.nome || proj.parceiro || '').trim()
    const secretaria = rawSecretaria || '—'
    const nomeProjeto = (proj.nome || 'Sem nome').trim()

    const ativs = atividadesPorProjeto.get(proj.id) || []

    for (const ativ of ativs) {
      const descricao = (ativ.descricao || '').trim()
      const tipo = (ativ.tipo_vinculo || '—').trim()
      // Tipo de Execução: texto exatamente como gravado, sem normalização
      const tipoExecucao = (ativ.tipo_execucao || '').trim() || '—'
      const valor = Number(ativ.valor_unitario) || 0

      linhas.push({
        secretaria,
        projeto: nomeProjeto,
        atividade: descricao,
        tipo,
        tipoExecucao,
        valor,
      })
    }
  }

  if (linhas.length === 0) {
    throw new Error('Nenhuma atividade cadastrada no catálogo dos projetos selecionados.')
  }

  // 3. Gerar Workbook e Worksheet com SheetJS
  const wb = XLSX.utils.book_new()

  const dataAtual = new Date()
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const horaFormatada = dataAtual.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Cabeçalho institucional e metadados
  const filtrosAplicados: string[] = []
  if (filtroBusca && filtroBusca.trim()) {
    filtrosAplicados.push(`Busca: "${filtroBusca.trim()}"`)
  }
  if (filtroStatus && filtroStatus !== 'todos') {
    filtrosAplicados.push(`Status: ${filtroStatus.toUpperCase()}`)
  }

  const cabecalho: (string | number)[][] = [
    [DADOS_CONTRATANTE.razaoSocial.toUpperCase()],
    [`RELATÓRIO GERAL DE ATIVIDADES POR SECRETARIA (CATÁLOGO / ANEXO I PT)`],
    [
      `Emissão: ${dataFormatada} às ${horaFormatada} | Total de Projetos: ${projetos.length} | Total de Atividades: ${linhas.length}`,
    ],
  ]

  if (filtrosAplicados.length > 0) {
    cabecalho.push([`Filtros aplicados: ${filtrosAplicados.join(' | ')}`])
  } else {
    cabecalho.push(['Todos os projetos ativos/filtrados da base de dados'])
  }

  cabecalho.push([]) // Linha em branco

  // Cabeçalhos das colunas da tabela
  const colunasTabela = [
    'Secretaria',
    'Projeto',
    'Atividade',
    'Tipo (Vínculo)',
    'Tipo de Execução',
    'Valor Unitário (R$)',
  ]

  const totalGeral = linhas.reduce((acc, l) => acc + l.valor, 0)

  // Montagem das linhas de dados
  const linhasDados: (string | number)[][] = linhas.map((l) => [
    l.secretaria,
    l.projeto,
    l.atividade,
    l.tipo,
    l.tipoExecucao,
    l.valor,
  ])

  // Linha de total geral ao final
  const linhaTotalGeral: (string | number)[] = [
    'TOTAL GERAL',
    '',
    '',
    '',
    `Total: ${linhas.length} atividades`,
    totalGeral,
  ]

  const dadosCompletos = [...cabecalho, colunasTabela, ...linhasDados, linhaTotalGeral]

  const ws = XLSX.utils.aoa_to_sheet(dadosCompletos)

  // Formatação de células de valor como moeda brasileira R$ #,##0.00
  // Índice da linha do cabeçalho da tabela:
  const headerRowIndex = cabecalho.length // 0-based
  const firstDataRowIndex = headerRowIndex + 1
  const lastDataRowIndex = firstDataRowIndex + linhasDados.length - 1
  const totalRowIndex = lastDataRowIndex + 1

  // Coluna F (índice 5) é o Valor Unitário
  const valorColIndex = 5

  const brCurrencyFormat = '"R$"\\ #,##0.00'

  for (let r = firstDataRowIndex; r <= totalRowIndex; r++) {
    const cellRef = XLSX.utils.encode_cell({ r, c: valorColIndex })
    const cell = ws[cellRef]
    if (cell && typeof cell.v === 'number') {
      cell.z = brCurrencyFormat
    }
  }

  // Larguras das colunas sugeridas (em caracteres)
  ws['!cols'] = [
    { wch: 38 }, // Secretaria
    { wch: 36 }, // Projeto
    { wch: 48 }, // Atividade
    { wch: 16 }, // Tipo
    { wch: 22 }, // Tipo de Execução
    { wch: 20 }, // Valor Unitário
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Atividades por Secretaria')

  // Nome do arquivo: Atividades_por_Secretaria_YYYY-MM-DD.xlsx
  const ano = dataAtual.getFullYear()
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0')
  const dia = String(dataAtual.getDate()).padStart(2, '0')
  const nomeArquivo = `Atividades_por_Secretaria_${ano}-${mes}-${dia}.xlsx`

  XLSX.writeFile(wb, nomeArquivo)

  return {
    totalLinhas: linhas.length,
    totalGeral,
  }
}
