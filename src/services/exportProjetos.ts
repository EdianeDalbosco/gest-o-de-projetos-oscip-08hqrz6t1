import { jsPDF } from 'jspdf'
import autoTable, { type UserOptions } from 'jspdf-autotable'
import type { ProjetoRecord } from '@/types'
import { formatBRL, formatDateBR } from '@/components/StatusBadge'
import { DADOS_CONTRATANTE } from '@/lib/modelosContratoPJ'

/**
 * Utilitário seguro para invocar o plugin autoTable compatível com Vite/ESM/CJS e builds de produção.
 * Em alguns bundlers/transpiladores, a importação pode ser a função direta, default, ou estar anexada a doc.autoTable.
 */
function applyAutoTable(doc: jsPDF, options: UserOptions): void {
  const candidateFn =
    typeof autoTable === 'function'
      ? autoTable
      : (autoTable as unknown as { default?: unknown })?.default

  if (typeof candidateFn === 'function') {
    candidateFn(doc, options)
    return
  }

  // Fallback se o plugin foi registrado diretamente na instância do jsPDF
  const docWithAutoTable = doc as unknown as { autoTable?: (opts: UserOptions) => void }
  if (typeof docWithAutoTable.autoTable === 'function') {
    docWithAutoTable.autoTable(options)
    return
  }

  throw new Error('Plugin jsPDF-AutoTable não foi inicializado corretamente no ambiente atual.')
}

export interface ExportProjetosOptions {
  projetos: ProjetoRecord[]
  filtroBusca?: string
  filtroStatus?: string
}

function formatarContratosTexto(contratos?: unknown): string {
  if (!contratos) return '—'
  let list: string[] = []
  if (Array.isArray(contratos)) {
    list = contratos.map((c) =>
      String(c || '')
        .trim()
        .toUpperCase(),
    )
  } else if (typeof contratos === 'string') {
    // Pode vir como JSON string "["CLT","PJ"]" ou string única "PJ" ou "CLT, PJ"
    const trimmed = contratos.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          list = parsed.map((c) =>
            String(c || '')
              .trim()
              .toUpperCase(),
          )
        }
      } catch {
        list = [trimmed.toUpperCase()]
      }
    } else {
      list = trimmed.split(/[,+;/]+/).map((s) => s.trim().toUpperCase())
    }
  }

  const hasCLT = list.includes('CLT')
  const hasPJ = list.includes('PJ')
  if (hasCLT && hasPJ) return 'CLT + PJ'
  if (hasCLT) return 'CLT'
  if (hasPJ) return 'PJ'
  if (list.length > 0 && list[0]) return list.join(', ')
  return '—'
}

function formatarStatusTexto(status?: string): string {
  switch (status) {
    case 'ativo':
      return 'Ativo'
    case 'pausado':
      return 'Pausado'
    case 'concluido':
      return 'Concluído'
    case 'cancelado':
      return 'Cancelado'
    default:
      return status ? status.toUpperCase() : '—'
  }
}

function getDataEmissaoExtenso(): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())
  } catch {
    return formatDateBR(new Date().toISOString())
  }
}

/**
 * Exporta a listagem filtrada de projetos diretamente para um arquivo .pdf no padrão formal A4 institucional
 */
export function exportarProjetosPdf({
  projetos,
  filtroBusca,
  filtroStatus,
}: ExportProjetosOptions): void {
  // Paisagem (landscape) para acomodar com excelente legibilidade todas as colunas da planilha
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const dataEmissao = getDataEmissaoExtenso()
  const totalCount = projetos.length
  const labelProjetos = totalCount === 1 ? '1 projeto' : `${totalCount} projetos`

  const totalExecucao = (projetos || []).reduce(
    (acc, p) => acc + (Number(p?.valor_mensal_execucao) || 0),
    0,
  )
  const totalDespAdm = (projetos || []).reduce(
    (acc, p) => acc + (Number(p?.valor_mensal_despesas_adm) || 0),
    0,
  )
  const totalValor = (projetos || []).reduce((acc, p) => acc + (Number(p?.valor_total) || 0), 0)

  // Linhas da tabela
  const tableRows = (projetos || []).map((p) => {
    const nomeProj = (p?.nome || 'Sem nome').trim()
    const desc = p?.descricao && p.descricao.trim() ? `\n${p.descricao.trim()}` : ''
    const projetoCell = `${nomeProj}${desc}`

    const secNome = p?.expand?.secretaria_id?.nome || p?.parceiro || '—'
    const convNum = p?.expand?.convenio_id?.numero_instrumento
      ? `\nInst: ${p.expand.convenio_id.numero_instrumento}`
      : ''
    const secretariaCell = `${secNome}${convNum}`

    const contratosCell = formatarContratosTexto(p?.contratos_vinculados)

    const valorExec = Number(p?.valor_mensal_execucao) || 0
    const execCell = valorExec > 0 ? formatBRL(valorExec) : '—'

    const valorAdm = Number(p?.valor_mensal_despesas_adm) || 0
    const admCell = valorAdm > 0 ? formatBRL(valorAdm) : '—'

    const valorTot = Number(p?.valor_total) || 0
    const totalCell = formatBRL(valorTot)

    const progresso = Math.max(0, Math.min(100, Math.round(Number(p?.progresso) || 0)))
    const metasCell = `${progresso}%`

    const statusCell = formatarStatusTexto(p?.status)

    return [
      projetoCell,
      secretariaCell,
      contratosCell,
      execCell,
      admCell,
      totalCell,
      metasCell,
      statusCell,
    ]
  })

  // Linha de totais
  const footerRow = [
    `TOTAIS CONSOLIDADOS (${labelProjetos})`,
    '',
    '',
    formatBRL(totalExecucao),
    formatBRL(totalDespAdm),
    formatBRL(totalValor),
    '',
    '',
  ]

  // Montagem do cabeçalho institucional antes da tabela
  // Margens: L=14, R=14, Top=14
  applyAutoTable(doc, {
    startY: 38,
    head: [
      [
        'Projeto',
        'Secretaria / Instrumento',
        'Contratos',
        'Execução Mensal',
        'Desp. Adm/Oper',
        'Valor Total',
        'Metas (%)',
        'Status',
      ],
    ],
    body: tableRows,
    foot: [footerRow],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59], // #1E293B
      lineColor: [203, 213, 225], // #CBD5E1
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249], // #F1F5F9
      textColor: [15, 23, 42], // #0F172A
      fontStyle: 'bold',
      lineColor: [148, 163, 184],
      lineWidth: 0.3,
      fontSize: 8,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [148, 163, 184],
      lineWidth: 0.3,
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 68, halign: 'left' }, // Projeto
      1: { cellWidth: 55, halign: 'left' }, // Secretaria / Instrumento
      2: { cellWidth: 22, halign: 'center' }, // Contratos
      3: { cellWidth: 31, halign: 'right' }, // Execução Mensal
      4: { cellWidth: 31, halign: 'right' }, // Desp Adm
      5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }, // Valor Total
      6: { cellWidth: 14, halign: 'center' }, // Metas %
      7: { cellWidth: 16, halign: 'center' }, // Status
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // 1. Cabeçalho Institucional
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105) // #475569
      doc.text('ORGANIZAÇÃO DA SOCIEDADE CIVIL DE INTERESSE PÚBLICO', 14, 12)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(15, 23, 42) // #0F172A
      doc.text(
        DADOS_CONTRATANTE.razaoSocial, // ORGANIZAÇÃO DE SAÚDE SÃO BENTO
        14,
        18,
      )

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139) // #64748B
      doc.text(`CNPJ: ${DADOS_CONTRATANTE.cnpj} • ${DADOS_CONTRATANTE.foro}`, 14, 22.5)

      // Lado direito do cabeçalho: Título do relatório e emissão
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text('LISTA DE PROJETOS', pageWidth - 14, 15, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(`Emissão: ${dataEmissao} • ${labelProjetos}`, pageWidth - 14, 20, { align: 'right' })

      // Linha de filtros caso aplicados
      const filtrosDesc: string[] = []
      if (filtroBusca && filtroBusca.trim()) {
        filtrosDesc.push(`Busca: "${filtroBusca.trim()}"`)
      }
      if (filtroStatus && filtroStatus !== 'todos') {
        filtrosDesc.push(`Status: ${formatarStatusTexto(filtroStatus)}`)
      }
      if (filtrosDesc.length > 0) {
        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text(`Filtros ativos: ${filtrosDesc.join(' | ')}`, pageWidth - 14, 24.5, {
          align: 'right',
        })
      }

      // Linha divisória horizontal do cabeçalho
      doc.setDrawColor(30, 41, 59) // slate-800
      doc.setLineWidth(0.4)
      doc.line(14, 28, pageWidth - 14, 28)

      // 2. Rodapé Institucional e Paginação
      doc.setDrawColor(226, 232, 240) // slate-200
      doc.setLineWidth(0.2)
      doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text('Sistema Integrado de Gestão de Projetos e Instrumentos', 14, pageHeight - 6.5)

      const strPagina = `Página ${data.pageNumber}`
      doc.text(strPagina, pageWidth - 14, pageHeight - 6.5, { align: 'right' })
    },
  })

  // Download do arquivo
  const timestamp = new Date().toISOString().slice(0, 10)
  doc.save(`Lista_Projetos_${timestamp}.pdf`)
}

/**
 * Gera o documento HTML A4 formatado e abre o diálogo de impressão nativo do navegador
 */
export function imprimirProjetos({
  projetos,
  filtroBusca,
  filtroStatus,
}: ExportProjetosOptions): void {
  const dataEmissao = getDataEmissaoExtenso()
  const totalCount = projetos.length
  const labelProjetos = totalCount === 1 ? '1 projeto' : `${totalCount} projetos`

  const totalExecucao = (projetos || []).reduce(
    (acc, p) => acc + (Number(p?.valor_mensal_execucao) || 0),
    0,
  )
  const totalDespAdm = (projetos || []).reduce(
    (acc, p) => acc + (Number(p?.valor_mensal_despesas_adm) || 0),
    0,
  )
  const totalValor = (projetos || []).reduce((acc, p) => acc + (Number(p?.valor_total) || 0), 0)

  const filtrosDesc: string[] = []
  if (filtroBusca && filtroBusca.trim()) {
    filtrosDesc.push(`Busca: &ldquo;${escapeHtml(filtroBusca.trim())}&rdquo;`)
  }
  if (filtroStatus && filtroStatus !== 'todos') {
    filtrosDesc.push(`Status: ${formatarStatusTexto(filtroStatus)}`)
  }

  const linhasHtml = (projetos || [])
    .map((p) => {
      const nomeProj = escapeHtml(p?.nome || 'Sem nome')
      const descProj = p?.descricao ? `<div class="desc">${escapeHtml(p.descricao)}</div>` : ''

      const secNome = escapeHtml(p?.expand?.secretaria_id?.nome || p?.parceiro || '—')
      const convNum = p?.expand?.convenio_id?.numero_instrumento
        ? `<div class="sub font-mono">Inst: ${escapeHtml(p.expand.convenio_id.numero_instrumento)}</div>`
        : ''

      const contratos = formatarContratosTexto(p?.contratos_vinculados)
      const valorExec = Number(p?.valor_mensal_execucao) || 0
      const execVal = valorExec > 0 ? formatBRL(valorExec) : '—'

      const valorAdm = Number(p?.valor_mensal_despesas_adm) || 0
      const admVal = valorAdm > 0 ? formatBRL(valorAdm) : '—'

      const totalVal = formatBRL(Number(p?.valor_total) || 0)

      const progresso = Math.max(0, Math.min(100, Math.round(Number(p?.progresso) || 0)))
      const metas = `${progresso}%`
      const status = formatarStatusTexto(p?.status)

      return `
        <tr>
          <td class="col-proj">
            <span class="nome">${nomeProj}</span>
            ${descProj}
          </td>
          <td class="col-sec">
            <span>${secNome}</span>
            ${convNum}
          </td>
          <td class="col-center">${contratos}</td>
          <td class="col-num">${execVal}</td>
          <td class="col-num">${admVal}</td>
          <td class="col-num font-bold">${totalVal}</td>
          <td class="col-center font-bold">${metas}</td>
          <td class="col-center">${status}</td>
        </tr>
      `
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Lista de Projetos — ${DADOS_CONTRATANTE.razaoSocial}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 10mm 12mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.35;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
    .toolbar-screen {
      background: #0F172A;
      color: #FFFFFF;
      padding: 10px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .toolbar-btn {
      background: #1FAF7A;
      color: #FFFFFF;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    .toolbar-btn:hover {
      background: #179C6E;
    }
    .header {
      border-bottom: 2px solid #0F172A;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 16px;
    }
    .header-inst {
      flex: 1;
    }
    .header-sub {
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #475569;
    }
    .header-title {
      font-size: 15px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 2px 0;
      color: #0F172A;
    }
    .header-cnpj {
      font-size: 9px;
      color: #64748B;
    }
    .header-doc {
      text-align: right;
      white-space: nowrap;
    }
    .doc-title {
      font-size: 14px;
      font-weight: 900;
      text-transform: uppercase;
      color: #0F172A;
    }
    .doc-meta {
      font-size: 9px;
      color: #475569;
      margin-top: 2px;
    }
    .doc-filters {
      font-size: 8.5px;
      color: #64748B;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    thead {
      display: table-header-group;
    }
    tfoot {
      display: table-footer-group;
    }
    th {
      background: #F1F5F9;
      color: #0F172A;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.03em;
      border: 1px solid #CBD5E1;
      padding: 6px 5px;
      text-align: left;
    }
    td {
      border: 1px solid #E2E8F0;
      padding: 5px 6px;
      vertical-align: middle;
      color: #1E293B;
    }
    tbody tr:nth-child(even) {
      background: #FAFAFA;
    }
    .col-proj {
      max-width: 220px;
    }
    .col-sec {
      max-width: 180px;
    }
    .col-center {
      text-align: center;
      white-space: nowrap;
    }
    .col-num {
      text-align: right;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .font-bold {
      font-weight: 700;
      color: #0F172A;
    }
    .nome {
      font-weight: 700;
      color: #0F172A;
      display: block;
    }
    .desc {
      font-size: 8.5px;
      color: #64748B;
      margin-top: 2px;
      line-height: 1.25;
    }
    .sub {
      font-size: 8px;
      color: #64748B;
      margin-top: 1px;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    tfoot tr {
      background: #F1F5F9;
      font-weight: 700;
      border-top: 2px solid #0F172A;
    }
    tfoot td {
      border: 1px solid #CBD5E1;
      padding: 6px;
      color: #0F172A;
    }
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #CBD5E1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748B;
    }
  </style>
</head>
<body>
  <div class="toolbar-screen no-print">
    <div>
      <strong>Visualização de Impressão — Lista de Projetos</strong>
      <span style="opacity:0.8; font-size:11px; margin-left:8px;">(A4 Paisagem)</span>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="toolbar-btn" onclick="window.print()">Imprimir Agora</button>
      <button class="toolbar-btn" style="background:#475569;" onclick="window.close()">Fechar Janela</button>
    </div>
  </div>

  <div class="header">
    <div class="header-inst">
      <div class="header-sub">Organização da Sociedade Civil de Interesse Público</div>
      <div class="header-title">${escapeHtml(DADOS_CONTRATANTE.razaoSocial)}</div>
      <div class="header-cnpj">CNPJ: ${escapeHtml(DADOS_CONTRATANTE.cnpj)} • ${escapeHtml(DADOS_CONTRATANTE.foro)}</div>
    </div>
    <div class="header-doc">
      <div class="doc-title">Lista de Projetos</div>
      <div class="doc-meta">Emissão: ${dataEmissao} • ${labelProjetos}</div>
      ${filtrosDesc.length > 0 ? `<div class="doc-filters">Filtros: ${filtrosDesc.join(' | ')}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 26%;">Projeto</th>
        <th style="width: 22%;">Secretaria / Instrumento</th>
        <th style="width: 9%; text-align: center;">Contratos</th>
        <th style="width: 12%; text-align: right;">Execução Mensal</th>
        <th style="width: 12%; text-align: right;">Desp. Adm/Oper</th>
        <th style="width: 12%; text-align: right;">Valor Total</th>
        <th style="width: 6%; text-align: center;">Metas</th>
        <th style="width: 7%; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${linhasHtml || '<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748B;">Nenhum projeto encontrado para os filtros selecionados.</td></tr>'}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="3" style="text-align: right; text-transform: uppercase;">
          TOTAIS CONSOLIDADOS (${labelProjetos}):
        </td>
        <td class="col-num font-bold">${formatBRL(totalExecucao)}</td>
        <td class="col-num font-bold">${formatBRL(totalDespAdm)}</td>
        <td class="col-num font-bold" style="color: #047857;">${formatBRL(totalValor)}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <div>Sistema Integrado de Gestão de Projetos e Instrumentos</div>
    <div>Documento emitido eletronicamente em ${new Date().toLocaleString('pt-BR')}</div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`

  const janela = window.open('', '_blank', 'width=1100,height=800')
  if (!janela) {
    alert('Por favor, permita pop-ups no seu navegador para abrir o diálogo de impressão.')
    return
  }
  janela.document.open()
  janela.document.write(html)
  janela.document.close()
  janela.focus()
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
