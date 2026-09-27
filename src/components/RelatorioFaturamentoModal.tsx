import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatBRL, formatDateBR } from '@/components/StatusBadge'
import { DADOS_CONTRATANTE } from '@/lib/modelosContratoPJ'
import type { FaturamentoMensalRecord } from '@/types'
import { Printer, Download, FileSpreadsheet, Building2, CheckCircle2 } from 'lucide-react'
import * as XLSX from 'xlsx'

interface RelatorioFaturamentoModalProps {
  faturamento: FaturamentoMensalRecord | null
  open: boolean
  onClose: () => void
  onUpdateStatus?: () => void
}

export function RelatorioFaturamentoModal({
  faturamento,
  open,
  onClose,
}: RelatorioFaturamentoModalProps) {
  const [activeTab, setActiveTab] = useState('resumo')

  if (!faturamento) return null

  const conv = faturamento.expand?.convenio_id
  const sec = faturamento.expand?.secretaria_id
  const proj = faturamento.expand?.projeto_id

  const municipio = conv?.municipio || 'MUNICÍPIO DE DOM AQUINO/MT'
  const termo = conv?.numero_instrumento || 'TERMO DE PARCERIA Nº 001/2026'
  const secretariaNome = sec?.nome || 'SECRETARIA MUNICIPAL DE SAÚDE'
  const projetoNome = proj?.nome || 'PROJETO FORSAÚDE – Fortalecimento da Saúde Pública Municipal'

  const itensPJ = faturamento.itens_detalhamento_pj || []
  const itensCLT = faturamento.itens_detalhamento_clt || []
  const itensAtiv = faturamento.itens_por_atividade || []

  // Impressão A4
  const handlePrint = () => {
    window.print()
  }

  // Exportar pasta de trabalho em Excel com as 4 abas exatas do modelo
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new()

    // 1. ABA RESUMO FATURAMENTO
    const resumoData = [
      ['', '', 'PREFEITURA MUNICIPAL DE DOM AQUINO/MT'],
      ['', '', termo],
      ['', '', secretariaNome],
      [`RELATÓRIO SINTÉTICO FATURAMENTO - ${faturamento.tipo_faturamento}`],
      [`OSCIP. ${DADOS_CONTRATANTE.razaoSocial}`],
      [`PROJETO ${projetoNome}`],
      [`PERÍODO. ${faturamento.periodo}`],
      [`COMPETÊNCIA. ${faturamento.competencia}`],
      ['1 - EXECUÇÃO DIRETA DO PROJETO', '', '', '', '', '', '', faturamento.valor_execucao_direta],
      ['1.1 - CLT', '', '', '', '', '', '', faturamento.valor_execucao_clt || 0],
      ['1.2 - PJ', '', '', '', '', '', '%', faturamento.valor_execucao_pj || 0],
      [
        '',
        'Secretaria de Saúde - APS/PAB',
        '',
        '',
        '',
        '',
        '48.89%',
        (faturamento.valor_execucao_pj || 0) * 0.4889,
      ],
      [
        '',
        'Secretaria de Saúde - MAC',
        '',
        '',
        '',
        '',
        '51.11%',
        (faturamento.valor_execucao_pj || 0) * 0.5111,
      ],
      [
        '2 - DESPESAS ADMINISTRATIVAS E OPERACIONAIS',
        '',
        '',
        '',
        '',
        '',
        '',
        faturamento.valor_despesas_adm || 0,
      ],
      [
        '',
        'Secretaria de Saúde - APS/PAB',
        '',
        '',
        '',
        '',
        '',
        (faturamento.valor_despesas_adm || 0) * 0.5,
      ],
      [
        '',
        'Secretaria de Saúde - MAC',
        '',
        '',
        '',
        '',
        '',
        (faturamento.valor_despesas_adm || 0) * 0.5,
      ],
      ['TOTAL', '', '', '', '', '', '', faturamento.valor_total],
      ['DOM AQUINO/MT, ' + new Date().toLocaleDateString('pt-BR')],
      ['', '', DADOS_CONTRATANTE.representante],
      ['', '', 'PRESIDENTE'],
    ]
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
    XLSX.utils.book_append_sheet(wb, wsResumo, 'RESUMO FATURAMENTO')

    // 2. ABA DETALHAMENTO PJ
    const headersPJ = [
      'ITEM',
      'EMPRESA',
      'CNPJ',
      'PROFISSIONAL',
      'DOTAÇÃO',
      'ATIVIDADE',
      'TIPO',
      'LOCAL',
      'DATA INÍCIO',
      'REMUNERAÇÃO BASE',
      'REF',
      'VALOR',
    ]
    const rowsPJ = itensPJ.map((p, idx) => [
      p.item || idx + 1,
      p.empresa,
      p.cnpj,
      p.profissional,
      p.dotacao || '',
      p.atividade,
      p.tipo,
      p.local || '',
      p.dataInicio || '',
      p.remuneracaoBase,
      p.ref,
      p.valor,
    ])
    const wsPJ = XLSX.utils.aoa_to_sheet([
      ['PREFEITURA MUNICIPAL DE DOM AQUINO/MT'],
      [termo],
      [secretariaNome],
      ['1.2 - PJ'],
      [`OSCIP. ${DADOS_CONTRATANTE.razaoSocial}`],
      [`COMPETÊNCIA: ${faturamento.competencia}`],
      [],
      headersPJ,
      ...rowsPJ,
      ['TOTAL', '', '', '', '', '', '', '', '', '', '', faturamento.valor_execucao_pj || 0],
    ])
    XLSX.utils.book_append_sheet(wb, wsPJ, 'DETALHAMENTO PJ')

    // 3. ABA DETALHAMENTO CLT
    const headersCLT = [
      'Codigo Consisa',
      'Colaborador',
      'CPF',
      'Cargo',
      'Setor',
      'Situação',
      'Remuneração Base',
      'Ref',
      'Remuneração',
      'Insalubridade',
      'Periculosidade',
      'Salário Família',
      'Horas Extras',
      'DSR',
      'Adicional Noturno',
      'Gratificação',
      'Plantão',
      'Faltas',
      'Proventos',
      'Provisão 19,44%',
      'Verbas Rescisórias',
      'Multa 40%',
      'Encargos Tributários',
      'Valor Total',
    ]
    const rowsCLT = itensCLT.map((c) => [
      c.codigoConsisa || '',
      c.colaborador,
      c.cpf,
      c.cargo,
      c.setor || '',
      c.situacao || 'Ativo',
      c.remuneracaoBase,
      c.ref,
      c.remuneracao || c.remuneracaoBase,
      c.insalubridade || 0,
      c.periculosidade || 0,
      c.salarioFamilia || 0,
      c.horasExtras || 0,
      c.dsr || 0,
      c.adicionalNoturno || 0,
      c.gratificacao || 0,
      c.plantao || 0,
      c.faltas || 0,
      c.proventos || 0,
      c.provisao1944 || 0,
      c.verbasRescisorias || 0,
      c.multa40 || 0,
      c.encargosTributarios || 0,
      c.valorTotal,
    ])
    const wsCLT = XLSX.utils.aoa_to_sheet([
      ['PREFEITURA MUNICIPAL DE DOM AQUINO/MT'],
      [termo],
      [secretariaNome],
      ['1.1 - CLT'],
      [`OSCIP. ${DADOS_CONTRATANTE.razaoSocial}`],
      [`COMPETÊNCIA: ${faturamento.competencia}`],
      [],
      headersCLT,
      ...rowsCLT,
      [
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        faturamento.valor_execucao_clt || 0,
      ],
    ])
    XLSX.utils.book_append_sheet(wb, wsCLT, 'DETALHAMENTO CLT')

    // 4. ABA TOTAL POR ATIVIDADE PT
    const headersAtiv = ['DESCRIÇÃO', 'TIPO', 'QTDADE', 'VALOR']
    const rowsAtiv = itensAtiv.map((a) => [a.descricao, a.tipo, a.quantidade, a.valor])
    const wsAtiv = XLSX.utils.aoa_to_sheet([
      ['PREFEITURA MUNICIPAL DE DOM AQUINO/MT'],
      [termo],
      [secretariaNome],
      ['RELATÓRIO SINTÉTICO POR ATIVIDADE'],
      [`OSCIP. ${DADOS_CONTRATANTE.razaoSocial}`],
      [`COMPETÊNCIA: ${faturamento.competencia}`],
      [],
      headersAtiv,
      ...rowsAtiv,
      ['TOTAL GERAL', '', '', faturamento.valor_execucao_direta],
    ])
    XLSX.utils.book_append_sheet(wb, wsAtiv, 'TOTAL POR ATIVIDADE PT')

    // Salvar arquivo
    XLSX.writeFile(
      wb,
      `Faturamento_${faturamento.numero_sequencial.replace(/\//g, '-')}_${faturamento.periodo.replace(/\s+/g, '_')}.xlsx`,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[94vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:max-h-none">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .relatorio-print-area, .relatorio-print-area * { visibility: visible; }
            .relatorio-print-area {
              position: absolute; left: 0; top: 0; width: 100%;
              margin: 0; padding: 1.5cm !important;
              color: #000 !important; background: #fff !important;
              font-family: 'Times New Roman', serif;
            }
            .no-print { display: none !important; }
          }
        `}</style>

        {/* Modal Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 no-print">
          <div>
            <DialogTitle className="text-base sm:text-lg font-bold text-[#1E293B]">
              Relatório Oficial de Faturamento — {faturamento.numero_sequencial}
            </DialogTitle>
            <p className="text-xs text-[#64748B]">
              Modelo fiel ao Termo de Parceria nº 001/2026 com cabeçalho institucional, dotações e
              assinaturas.
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
              Imprimir / PDF A4
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="text-xs gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#1FAF7A]" />
              Exportar Excel (.xlsx)
            </Button>
          </div>
        </div>

        {/* Abas do Relatório: RESUMO FATURAMENTO, DETALHAMENTO PJ, DETALHAMENTO CLT, TOTAL POR ATIVIDADE PT */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 pt-1">
          <TabsList className="bg-slate-100 p-1 rounded-lg text-xs no-print">
            <TabsTrigger value="resumo" className="text-xs font-semibold px-3">
              1. Resumo Faturamento
            </TabsTrigger>
            <TabsTrigger value="pj" className="text-xs font-semibold px-3">
              2. Detalhamento PJ ({itensPJ.length})
            </TabsTrigger>
            <TabsTrigger value="clt" className="text-xs font-semibold px-3">
              3. Detalhamento CLT ({itensCLT.length})
            </TabsTrigger>
            <TabsTrigger value="atividade" className="text-xs font-semibold px-3">
              4. Total por Atividade PT ({itensAtiv.length})
            </TabsTrigger>
          </TabsList>

          {/* ÁREA DO RELATÓRIO IMPRIMÍVEL A4 */}
          <div className="relatorio-print-area bg-white border border-slate-300 rounded-xl p-6 sm:p-10 shadow-sm font-sans text-xs">
            {/* CABEÇALHO INSTITUCIONAL OFICIAL */}
            <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4 mb-4">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">
                {municipio}
              </h2>
              <h3 className="text-xs font-bold text-slate-800 uppercase">{termo}</h3>
              <h3 className="text-xs font-bold text-slate-800 uppercase">{secretariaNome}</h3>
              <p className="text-xs font-bold text-[#1FAF7A] uppercase mt-1">
                RELATÓRIO SINTÉTICO FATURAMENTO - {faturamento.tipo_faturamento}
              </p>
              <div className="pt-2 text-[11px] text-slate-700 space-y-0.5">
                <p>
                  <strong>OSCIP:</strong> {DADOS_CONTRATANTE.razaoSocial} | CNPJ:{' '}
                  {DADOS_CONTRATANTE.cnpj}
                </p>
                <p>
                  <strong>PROJETO:</strong> {projetoNome}
                </p>
                <p>
                  <strong>PERÍODO:</strong> {faturamento.periodo} | <strong>COMPETÊNCIA:</strong>{' '}
                  {faturamento.competencia}
                </p>
                {faturamento.numero_nf && (
                  <p className="text-emerald-800 font-bold">
                    <strong>NOTA FISCAL Nº:</strong> {faturamento.numero_nf} (Status:{' '}
                    {faturamento.status_nf || 'Emitida'})
                  </p>
                )}
              </div>
            </div>

            {/* ABA 1: RESUMO FATURAMENTO */}
            <TabsContent value="resumo" className="space-y-4">
              <div className="space-y-3">
                <table className="w-full text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-left">ITEM / DISCRIMINAÇÃO</th>
                      <th className="py-2 px-3 text-center w-24">%</th>
                      <th className="py-2 px-3 text-right w-36">VALOR (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="py-2 px-3" colSpan={2}>
                        1 - EXECUÇÃO DIRETA DO PROJETO
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {formatBRL(faturamento.valor_execucao_direta)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-6 font-medium text-slate-700">1.1 - CLT</td>
                      <td className="py-1.5 px-3 text-center text-slate-500">—</td>
                      <td className="py-1.5 px-3 text-right tabular-nums">
                        {formatBRL(faturamento.valor_execucao_clt || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-6 font-medium text-slate-700">1.2 - PJ</td>
                      <td className="py-1.5 px-3 text-center text-slate-500">100%</td>
                      <td className="py-1.5 px-3 text-right tabular-nums font-semibold">
                        {formatBRL(faturamento.valor_execucao_pj || 0)}
                      </td>
                    </tr>
                    <tr className="text-[11px] text-slate-600">
                      <td className="py-1 px-10">Secretaria de Saúde - APS/PAB</td>
                      <td className="py-1 px-3 text-center">48,89%</td>
                      <td className="py-1 px-3 text-right tabular-nums">
                        {formatBRL((faturamento.valor_execucao_pj || 0) * 0.4889)}
                      </td>
                    </tr>
                    <tr className="text-[11px] text-slate-600">
                      <td className="py-1 px-10">Secretaria de Saúde - MAC</td>
                      <td className="py-1 px-3 text-center">51,11%</td>
                      <td className="py-1 px-3 text-right tabular-nums">
                        {formatBRL((faturamento.valor_execucao_pj || 0) * 0.5111)}
                      </td>
                    </tr>

                    <tr className="bg-slate-50 font-bold text-slate-900">
                      <td className="py-2 px-3" colSpan={2}>
                        2 - DESPESAS ADMINISTRATIVAS E OPERACIONAIS
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {formatBRL(faturamento.valor_despesas_adm || 0)}
                      </td>
                    </tr>
                    <tr className="text-[11px] text-slate-600">
                      <td className="py-1 px-10">Secretaria de Saúde - APS/PAB (Rateio)</td>
                      <td className="py-1 px-3 text-center">50,00%</td>
                      <td className="py-1 px-3 text-right tabular-nums">
                        {formatBRL((faturamento.valor_despesas_adm || 0) * 0.5)}
                      </td>
                    </tr>
                    <tr className="text-[11px] text-slate-600">
                      <td className="py-1 px-10">Secretaria de Saúde - MAC (Rateio)</td>
                      <td className="py-1 px-3 text-center">50,00%</td>
                      <td className="py-1 px-3 text-right tabular-nums">
                        {formatBRL((faturamento.valor_despesas_adm || 0) * 0.5)}
                      </td>
                    </tr>

                    <tr className="bg-emerald-50 text-emerald-950 font-extrabold text-sm border-t-2 border-emerald-500">
                      <td className="py-2.5 px-3 uppercase" colSpan={2}>
                        TOTAL FATURADO
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatBRL(faturamento.valor_total)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* BLOCO DE ASSINATURA INSTITUCIONAL */}
                <div className="pt-12 text-center space-y-8">
                  <p className="text-xs text-slate-700">
                    DOM AQUINO/MT,{' '}
                    {new Date().toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                    .
                  </p>
                  <div className="inline-block border-t border-slate-800 pt-2 px-12">
                    <p className="font-bold text-slate-900 uppercase">
                      {DADOS_CONTRATANTE.representante}
                    </p>
                    <p className="text-xs text-slate-600 uppercase">
                      Presidente — {DADOS_CONTRATANTE.razaoSocial}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: DETALHAMENTO PJ */}
            <TabsContent value="pj" className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] sm:text-[11px] border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1.5 px-2 text-left">ITEM</th>
                      <th className="py-1.5 px-2 text-left">EMPRESA</th>
                      <th className="py-1.5 px-2 text-left">CNPJ</th>
                      <th className="py-1.5 px-2 text-left">PROFISSIONAL</th>
                      <th className="py-1.5 px-2 text-left">DOTAÇÃO</th>
                      <th className="py-1.5 px-2 text-left">ATIVIDADE</th>
                      <th className="py-1.5 px-2 text-left">TIPO</th>
                      <th className="py-1.5 px-2 text-right">REMUN. BASE</th>
                      <th className="py-1.5 px-2 text-center">REF</th>
                      <th className="py-1.5 px-2 text-right">VALOR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {itensPJ.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-6 text-center text-slate-500">
                          Nenhum lançamento PJ cadastrado neste faturamento.
                        </td>
                      </tr>
                    ) : (
                      itensPJ.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 px-2 font-mono text-slate-500">
                            {p.item || idx + 1}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-900">{p.empresa}</td>
                          <td className="py-1 px-2 font-mono text-slate-600">{p.cnpj}</td>
                          <td className="py-1 px-2 text-slate-700">{p.profissional}</td>
                          <td className="py-1 px-2 text-slate-600">{p.dotacao}</td>
                          <td className="py-1 px-2 font-medium text-slate-800">{p.atividade}</td>
                          <td className="py-1 px-2">{p.tipo}</td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatBRL(p.remuneracaoBase)}
                          </td>
                          <td className="py-1 px-2 text-center font-bold text-slate-800">
                            {p.ref}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-emerald-800">
                            {formatBRL(p.valor)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td colSpan={9} className="py-2 px-2 text-right uppercase">
                        TOTAL PJ:
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-900">
                        {formatBRL(faturamento.valor_execucao_pj || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ABA 3: DETALHAMENTO CLT */}
            <TabsContent value="clt" className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border border-slate-300 whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1.5 px-2 text-left">Código Consisa</th>
                      <th className="py-1.5 px-2 text-left">Colaborador</th>
                      <th className="py-1.5 px-2 text-left">CPF</th>
                      <th className="py-1.5 px-2 text-left">Cargo</th>
                      <th className="py-1.5 px-2 text-right">Remun. Base</th>
                      <th className="py-1.5 px-2 text-center">Ref</th>
                      <th className="py-1.5 px-2 text-right">Insalubridade</th>
                      <th className="py-1.5 px-2 text-right">Plantão</th>
                      <th className="py-1.5 px-2 text-right">Proventos</th>
                      <th className="py-1.5 px-2 text-right">Provisão 19,44%</th>
                      <th className="py-1.5 px-2 text-right">Encargos 37,8%</th>
                      <th className="py-1.5 px-2 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {itensCLT.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-6 text-center text-slate-500">
                          Nenhum lançamento CLT cadastrado neste faturamento.
                        </td>
                      </tr>
                    ) : (
                      itensCLT.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 px-2 font-mono text-slate-500">
                            {c.codigoConsisa || idx + 1}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-900">
                            {c.colaborador}
                          </td>
                          <td className="py-1 px-2 font-mono text-slate-600">{c.cpf}</td>
                          <td className="py-1 px-2 text-slate-700">{c.cargo}</td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatBRL(c.remuneracaoBase)}
                          </td>
                          <td className="py-1 px-2 text-center font-bold">{c.ref}</td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatBRL(c.insalubridade || 0)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatBRL(c.plantao || 0)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-semibold">
                            {formatBRL(c.proventos || 0)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatBRL(c.provisao1944 || 0)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono">
                            {formatBRL(c.encargosTributarios || 0)}
                          </td>
                          <td className="py-1 px-2 text-right font-mono font-bold text-emerald-800">
                            {formatBRL(c.valorTotal)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td colSpan={11} className="py-2 px-2 text-right uppercase">
                        TOTAL CLT:
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-900">
                        {formatBRL(faturamento.valor_execucao_clt || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ABA 4: TOTAL POR ATIVIDADE PT */}
            <TabsContent value="atividade" className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 text-left">DESCRIÇÃO DA ATIVIDADE</th>
                      <th className="py-2 px-3 text-left">VÍNCULO</th>
                      <th className="py-2 px-3 text-left">TIPO DE EXECUÇÃO</th>
                      <th className="py-2 px-3 text-center w-24">QUANTIDADE</th>
                      <th className="py-2 px-3 text-right w-36">VALOR TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {itensAtiv.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          Nenhuma atividade agrupada neste período.
                        </td>
                      </tr>
                    ) : (
                      itensAtiv.map((a, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-semibold text-slate-900">
                            {a.descricao}
                          </td>
                          <td className="py-1.5 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                a.tipoVinculo === 'CLT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {a.tipoVinculo}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-slate-600">{a.tipo}</td>
                          <td className="py-1.5 px-3 text-center font-bold text-slate-800">
                            {a.quantidade}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono font-bold text-emerald-800">
                            {formatBRL(a.valor)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td colSpan={4} className="py-2 px-3 text-right uppercase">
                        TOTAL POR ATIVIDADE (DIRETO):
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-900">
                        {formatBRL(faturamento.valor_execucao_direta)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
