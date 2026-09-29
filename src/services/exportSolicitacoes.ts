import { jsPDF } from 'jspdf'
import autoTable, { type UserOptions } from 'jspdf-autotable'
import type { SolicitacaoRecord, OrganizacaoConfigRecord } from '@/types'
import { formatDateBR } from '@/components/StatusBadge'
import { DADOS_CONTRATANTE } from '@/lib/modelosContratoPJ'

function applyAutoTable(doc: jsPDF, options: UserOptions): void {
  const candidateFn =
    typeof autoTable === 'function'
      ? autoTable
      : (autoTable as unknown as { default?: unknown })?.default

  if (typeof candidateFn === 'function') {
    candidateFn(doc, options)
    return
  }

  const docWithAutoTable = doc as unknown as { autoTable?: (opts: UserOptions) => void }
  if (typeof docWithAutoTable.autoTable === 'function') {
    docWithAutoTable.autoTable(options)
    return
  }

  throw new Error('Plugin jsPDF-AutoTable não foi inicializado corretamente no ambiente atual.')
}

export interface ExportSolicitacoesOptions {
  solicitacoes: SolicitacaoRecord[]
  filtroBusca?: string
  filtroStatus?: string
  filtroPrioridade?: string
  filtroTipo?: string
  filtroProjeto?: string
  orgConfig?: OrganizacaoConfigRecord | null
}

function getDataEmissaoExtenso(): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())
  } catch {
    return formatDateBR(new Date().toISOString())
  }
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function isAtrasada(s: SolicitacaoRecord): boolean {
  if (!s.prazo || s.status === 'Concluída' || s.status === 'Cancelada') return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dtPrazo = new Date(s.prazo)
  return dtPrazo < hoje
}

export function exportarSolicitacoesPdf({
  solicitacoes,
  filtroBusca,
  filtroStatus,
  filtroPrioridade,
  filtroTipo,
  filtroProjeto,
  orgConfig,
}: ExportSolicitacoesOptions): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const razaoSocial = orgConfig?.nome_organizacao || DADOS_CONTRATANTE.razaoSocial
  const cnpj = orgConfig?.cnpj || DADOS_CONTRATANTE.cnpj
  const foro = orgConfig?.foro || DADOS_CONTRATANTE.foro

  const dataEmissao = getDataEmissaoExtenso()
  const totalCount = solicitacoes.length
  const labelTotal = totalCount === 1 ? '1 registro' : `${totalCount} registros`

  const tableRows = solicitacoes.map((s) => {
    const titulo = s.titulo || 'Sem título'
    const desc = s.descricao ? `\n${s.descricao}` : ''
    const tituloCell = `${titulo}${desc}`

    const solicitanteCell = s.solicitante || '—'
    const dataSol = s.data_solicitacao
      ? formatDateBR(s.data_solicitacao)
      : s.created
        ? formatDateBR(s.created)
        : '—'

    const projNome = s.expand?.projeto?.nome || 'Geral / Não vinculado'
    const secNome = s.expand?.secretaria?.nome ? `\nSec: ${s.expand.secretaria.nome}` : ''
    const projetoCell = `${projNome}${secNome}`

    const atrasada = isAtrasada(s)
    const prazoStr = s.prazo ? formatDateBR(s.prazo) : 'Sem prazo'
    const prazoCell = atrasada ? `${prazoStr}\n(ATRASADA)` : prazoStr

    const respCell = s.responsavel || 'Não atribuído'
    const anexoCell = s.anexo ? 'Sim' : 'Não'
    const concCell = s.conclusao || '—'

    return [
      tituloCell,
      solicitanteCell,
      dataSol,
      s.tipo,
      s.prioridade,
      s.status,
      respCell,
      projetoCell,
      prazoCell,
      anexoCell,
      concCell,
    ]
  })

  applyAutoTable(doc, {
    startY: 38,
    head: [
      [
        'Título & Descrição',
        'Solicitante',
        'Data Sol.',
        'Tipo',
        'Prioridade',
        'Status',
        'Responsável',
        'Projeto / Secretaria',
        'Prazo',
        'Anexo',
        'Conclusão / Providência',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      lineColor: [148, 163, 184],
      lineWidth: 0.3,
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },
      1: { cellWidth: 26, halign: 'left' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 17, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 26, halign: 'left' },
      7: { cellWidth: 32, halign: 'left' },
      8: { cellWidth: 20, halign: 'center' },
      9: { cellWidth: 13, halign: 'center' },
      10: { cellWidth: 23, halign: 'left' },
    },
    margin: { top: 38, bottom: 18, left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text('ORGANIZAÇÃO DA SOCIEDADE CIVIL DE INTERESSE PÚBLICO', 14, 12)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(15, 23, 42)
      doc.text(razaoSocial, 14, 18)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.text(`CNPJ: ${cnpj} • ${foro}`, 14, 22.5)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text('SOLICITAÇÕES & PENDÊNCIAS', pageWidth - 14, 15, { align: 'right' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(71, 85, 105)
      doc.text(`Emissão: ${dataEmissao} • ${labelTotal}`, pageWidth - 14, 20, { align: 'right' })

      const filtrosDesc: string[] = []
      if (filtroBusca && filtroBusca.trim()) filtrosDesc.push(`Busca: "${filtroBusca.trim()}"`)
      if (filtroStatus && filtroStatus !== 'todos') filtrosDesc.push(`Status: ${filtroStatus}`)
      if (filtroPrioridade && filtroPrioridade !== 'todas')
        filtrosDesc.push(`Prioridade: ${filtroPrioridade}`)
      if (filtroTipo && filtroTipo !== 'todos') filtrosDesc.push(`Tipo: ${filtroTipo}`)
      if (filtroProjeto && filtroProjeto !== 'todos') filtrosDesc.push(`Projeto: ${filtroProjeto}`)

      if (filtrosDesc.length > 0) {
        doc.setFontSize(7.5)
        doc.setTextColor(100, 116, 139)
        doc.text(`Filtros: ${filtrosDesc.join(' | ')}`, pageWidth - 14, 24.5, { align: 'right' })
      }

      doc.setDrawColor(30, 41, 59)
      doc.setLineWidth(0.4)
      doc.line(14, 28, pageWidth - 14, 28)

      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.2)
      doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(
        'Sistema Integrado de Gestão de Projetos e Instrumentos — Módulo de Solicitações',
        14,
        pageHeight - 6.5,
      )

      const strPagina = `Página ${data.pageNumber}`
      doc.text(strPagina, pageWidth - 14, pageHeight - 6.5, { align: 'right' })
    },
  })

  const timestamp = new Date().toISOString().slice(0, 10)
  doc.save(`Solicitacoes_Pendencias_${timestamp}.pdf`)
}

export function imprimirSolicitacoes({
  solicitacoes,
  filtroBusca,
  filtroStatus,
  filtroPrioridade,
  filtroTipo,
  filtroProjeto,
  orgConfig,
}: ExportSolicitacoesOptions): void {
  const razaoSocial = orgConfig?.nome_organizacao || DADOS_CONTRATANTE.razaoSocial
  const cnpj = orgConfig?.cnpj || DADOS_CONTRATANTE.cnpj
  const foro = orgConfig?.foro || DADOS_CONTRATANTE.foro

  const dataEmissao = getDataEmissaoExtenso()
  const totalCount = solicitacoes.length
  const labelTotal = totalCount === 1 ? '1 registro' : `${totalCount} registros`

  const filtrosDesc: string[] = []
  if (filtroBusca && filtroBusca.trim())
    filtrosDesc.push(`Busca: &ldquo;${escapeHtml(filtroBusca.trim())}&rdquo;`)
  if (filtroStatus && filtroStatus !== 'todos')
    filtrosDesc.push(`Status: ${escapeHtml(filtroStatus)}`)
  if (filtroPrioridade && filtroPrioridade !== 'todas')
    filtrosDesc.push(`Prioridade: ${escapeHtml(filtroPrioridade)}`)
  if (filtroTipo && filtroTipo !== 'todos') filtrosDesc.push(`Tipo: ${escapeHtml(filtroTipo)}`)
  if (filtroProjeto && filtroProjeto !== 'todos')
    filtrosDesc.push(`Projeto: ${escapeHtml(filtroProjeto)}`)

  const linhasHtml = solicitacoes
    .map((s) => {
      const atrasada = isAtrasada(s)
      const dtSol = s.data_solicitacao
        ? formatDateBR(s.data_solicitacao)
        : s.created
          ? formatDateBR(s.created)
          : '—'
      const prazoStr = s.prazo ? formatDateBR(s.prazo) : '—'
      const projNome = escapeHtml(s.expand?.projeto?.nome || 'Geral / Não vinculado')
      const secNome = s.expand?.secretaria?.nome
        ? `<div class="sub">Sec: ${escapeHtml(s.expand.secretaria.nome)}</div>`
        : ''
      const anexoBadge = s.anexo
        ? `<span class="badge badge-anexo">Sim (1)</span>`
        : `<span class="badge-none">—</span>`

      return `
        <tr>
          <td class="col-title">
            <div class="title">${escapeHtml(s.titulo)}</div>
            ${s.descricao ? `<div class="desc">${escapeHtml(s.descricao)}</div>` : ''}
          </td>
          <td>${escapeHtml(s.solicitante || '—')}</td>
          <td class="col-center">${dtSol}</td>
          <td class="col-center"><span class="badge badge-tipo">${escapeHtml(s.tipo)}</span></td>
          <td class="col-center"><span class="badge badge-${s.prioridade.toLowerCase()}">${escapeHtml(s.prioridade)}</span></td>
          <td class="col-center"><span class="badge badge-status">${escapeHtml(s.status)}</span></td>
          <td>${escapeHtml(s.responsavel || '—')}</td>
          <td>
            <div>${projNome}</div>
            ${secNome}
          </td>
          <td class="col-center ${atrasada ? 'prazo-atrasado' : ''}">
            ${prazoStr} ${atrasada ? '<br><small>(Atrasado)</small>' : ''}
          </td>
          <td class="col-center">${anexoBadge}</td>
          <td class="col-conc">${escapeHtml(s.conclusao || '—')}</td>
        </tr>
      `
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Solicitações & Pendências — ${escapeHtml(razaoSocial)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 12mm 10mm 12mm 10mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #1E293B;
      margin: 0;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1E293B;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .header-sub { font-size: 8px; font-weight: 700; color: #475569; letter-spacing: 0.5px; text-transform: uppercase; }
    .header-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 2px 0; }
    .header-cnpj { font-size: 9px; color: #64748B; }
    .header-doc { text-align: right; }
    .doc-title { font-size: 14px; font-weight: 800; color: #0F172A; text-transform: uppercase; }
    .doc-meta { font-size: 9px; color: #475569; margin-top: 3px; }
    .doc-filters { font-size: 8.5px; color: #64748B; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th {
      background-color: #F1F5F9;
      color: #0F172A;
      font-weight: 700;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 6px 7px;
      border: 1px solid #CBD5E1;
      text-align: left;
    }
    td {
      padding: 6px 7px;
      border: 1px solid #E2E8F0;
      font-size: 9px;
      vertical-align: top;
    }
    tr:nth-child(even) td { background-color: #FAFAFA; }
    .col-title .title { font-weight: 700; color: #0F172A; }
    .col-title .desc { font-size: 8px; color: #64748B; margin-top: 2px; }
    .col-center { text-align: center; }
    .sub { font-size: 8px; color: #64748B; }
    .prazo-atrasado { color: #DC2626; font-weight: 700; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 600;
      border: 1px solid #CBD5E1;
      background: #F8FAFC;
    }
    .badge-urgente { background: #FEF2F2; color: #991B1B; border-color: #FECACA; }
    .badge-alta { background: #FFFBEB; color: #92400E; border-color: #FDE68A; }
    .badge-média, .badge-media { background: #EFF6FF; color: #1E40AF; border-color: #BFDBFE; }
    .badge-baixa { background: #F1F5F9; color: #475569; }
    .badge-anexo { background: #ECFDF5; color: #065F46; border-color: #A7F3D0; font-weight: 700; }
    .badge-none { color: #94A3B8; }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #94A3B8;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-inst">
      <div class="header-sub">Organização da Sociedade Civil de Interesse Público</div>
      <div class="header-title">${escapeHtml(razaoSocial)}</div>
      <div class="header-cnpj">CNPJ: ${escapeHtml(cnpj)} • ${escapeHtml(foro)}</div>
    </div>
    <div class="header-doc">
      <div class="doc-title">Solicitações & Pendências</div>
      <div class="doc-meta">Emissão: ${dataEmissao} • ${labelTotal}</div>
      ${filtrosDesc.length > 0 ? `<div class="doc-filters">Filtros: ${filtrosDesc.join(' | ')}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Título & Descrição</th>
        <th style="width: 10%;">Solicitante</th>
        <th style="width: 7%; text-align: center;">Data Sol.</th>
        <th style="width: 8%; text-align: center;">Tipo</th>
        <th style="width: 6%; text-align: center;">Prioridade</th>
        <th style="width: 8%; text-align: center;">Status</th>
        <th style="width: 10%;">Responsável</th>
        <th style="width: 13%;">Projeto / Secretaria</th>
        <th style="width: 6%; text-align: center;">Prazo</th>
        <th style="width: 4%; text-align: center;">Anexo</th>
        <th style="width: 8%;">Conclusão</th>
      </tr>
    </thead>
    <tbody>
      ${linhasHtml || '<tr><td colspan="11" style="text-align:center; padding:20px; color:#64748B;">Nenhum registro encontrado para os filtros selecionados.</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <div>Sistema Integrado de Gestão de Projetos e Instrumentos — Módulo de Solicitações</div>
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
