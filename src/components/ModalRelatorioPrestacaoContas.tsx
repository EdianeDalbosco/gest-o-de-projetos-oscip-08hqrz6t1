import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, X } from 'lucide-react'
import { formatBRL, formatDateBR } from '@/components/StatusBadge'
import type {
  ConvenioRecord,
  SecretariaRecord,
  PlanoTrabalhoRecord,
  MetaRecord,
  EmpenhoRecord,
  AtividadeRecord,
} from '@/types'

interface ModalRelatorioPrestacaoContasProps {
  open: boolean
  onClose: () => void
  convenio: ConvenioRecord
  secretaria: SecretariaRecord
  planos: PlanoTrabalhoRecord[]
  metas: MetaRecord[]
  empenhos: EmpenhoRecord[]
  atividades: AtividadeRecord[]
}

export function ModalRelatorioPrestacaoContas({
  open,
  onClose,
  convenio,
  secretaria,
  planos,
  metas,
  empenhos,
  atividades,
}: ModalRelatorioPrestacaoContasProps) {
  const dataEmissao = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date())

  // Cálculos financeiros
  const valorPrevistoTotal = planos.reduce((sum, p) => sum + (Number(p.valor_previsto) || 0), 0)
  const valorEmpenhadoTotal = empenhos.reduce((sum, e) => sum + (Number(e.valor) || 0), 0)
  const valorExecutadoTotal = planos.reduce((sum, p) => sum + (Number(p.valor_executado) || 0), 0)
  const saldoDisponivel = valorPrevistoTotal - valorEmpenhadoTotal

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-slate-300">
        {/* Barra superior de ações na tela (oculta na impressão) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print sticky top-0 z-10 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold tracking-tight">Relatório de Prestação de Contas</h3>
            <p className="text-xs text-slate-400">
              {secretaria.nome} • {convenio.numero_instrumento}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Relatório
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Área imprimível formatada */}
        <div className="p-8 sm:p-10 bg-white text-black font-sans leading-relaxed print-area">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .print-area, .print-area * {
                visibility: visible;
              }
              .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 1.5cm;
                color: #000 !important;
                background: #fff !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
              table {
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
            }
          `}</style>

          {/* Cabeçalho Institucional Formal */}
          <div className="border-b-2 border-black pb-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase block text-slate-700">
                  Organização da Sociedade Civil de Interesse Público
                </span>
                <h1 className="text-xl font-black uppercase tracking-tight mt-0.5">
                  Associação Gestão Cidadã OSCIP
                </h1>
                <p className="text-xs text-slate-700 mt-0.5">
                  CNPJ: 12.345.678/0001-90 • Sede Operacional Municipal
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold block uppercase text-slate-800">
                  Prestação de Contas Parcial
                </span>
                <span className="text-xs text-slate-600 block">Emissão: {dataEmissao}</span>
              </div>
            </div>
          </div>

          {/* Identificação do Convênio e Pasta Responsável */}
          <div className="bg-slate-50 border border-slate-300 rounded p-4 mb-6 text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Convênio / Instrumento
                </span>
                <span className="font-bold text-sm text-black">
                  {convenio.nome} ({convenio.numero_instrumento})
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Município / Órgão Concedente
                </span>
                <span className="font-medium text-black">
                  {convenio.municipio}{' '}
                  {convenio.orgao_contratante ? `— ${convenio.orgao_contratante}` : ''}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Secretaria Municipal Responsável
                </span>
                <span className="font-bold text-black text-sm">{secretaria.nome}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">
                  Gestor(a) Responsável pela Pasta
                </span>
                <span className="font-medium text-black">
                  {secretaria.responsavel || 'Não informado'}
                </span>
              </div>
            </div>
          </div>

          {/* Quadro Resumo Financeiro */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-black pb-1">
              1. Demonstrativo Financeiro Sintético da Secretaria
            </h2>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-left font-bold border-b border-slate-300">
                  <th className="p-2 border-r border-slate-300">Rubrica / Conceito</th>
                  <th className="p-2 border-r border-slate-300 text-right">
                    Valor Previsto (Planos)
                  </th>
                  <th className="p-2 border-r border-slate-300 text-right">Valor Empenhado</th>
                  <th className="p-2 border-r border-slate-300 text-right">
                    Valor Executado (Liquidado)
                  </th>
                  <th className="p-2 text-right">Saldo a Empenhar</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2 border-r border-slate-300 font-semibold">
                    Consolidado Geral da Secretaria
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-medium">
                    {formatBRL(valorPrevistoTotal)}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-medium">
                    {formatBRL(valorEmpenhadoTotal)}
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-medium">
                    {formatBRL(valorExecutadoTotal)}
                  </td>
                  <td
                    className={`p-2 text-right font-bold ${saldoDisponivel < 0 ? 'text-red-600' : 'text-black'}`}
                  >
                    {formatBRL(saldoDisponivel)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabela de Empenhos Registrados */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-black pb-1">
              2. Notas de Empenho Emitidas ({empenhos.length})
            </h2>
            {empenhos.length === 0 ? (
              <p className="text-xs italic text-slate-500 py-2">
                Nenhuma nota de empenho registrada para esta secretaria.
              </p>
            ) : (
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-left font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-28">Nº Empenho</th>
                    <th className="p-2 border-r border-slate-300 w-24">Data</th>
                    <th className="p-2 border-r border-slate-300">Descrição / Objeto</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">Status</th>
                    <th className="p-2 text-right w-28">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {empenhos.map((emp) => (
                    <tr key={emp.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-mono font-bold">
                        {emp.numero}
                      </td>
                      <td className="p-2 border-r border-slate-300">{formatDateBR(emp.data)}</td>
                      <td className="p-2 border-r border-slate-300">{emp.descricao || '-'}</td>
                      <td className="p-2 border-r border-slate-300 text-center uppercase text-[10px] font-bold">
                        {emp.status}
                      </td>
                      <td className="p-2 text-right font-medium tabular-nums">
                        {formatBRL(emp.valor)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase">
                      Total Empenhado:
                    </td>
                    <td className="p-2 text-right tabular-nums">
                      {formatBRL(valorEmpenhadoTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Tabela de Planos de Trabalho e Metas Físicas */}
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-black pb-1">
              3. Execução Física dos Planos de Trabalho e Metas
            </h2>
            {planos.length === 0 ? (
              <p className="text-xs italic text-slate-500 py-2">
                Nenhum plano de trabalho cadastrado nesta secretaria.
              </p>
            ) : (
              <div className="space-y-4">
                {planos.map((plano) => {
                  const planoMetas = metas.filter((m) => m.plano_trabalho_id === plano.id)

                  return (
                    <div key={plano.id} className="border border-slate-300 rounded p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h3 className="font-bold text-xs uppercase text-black">{plano.titulo}</h3>
                        <span className="text-[11px] text-slate-600 font-medium">
                          Previsto: {formatBRL(plano.valor_previsto)} | Executado:{' '}
                          {formatBRL(plano.valor_executado || 0)}
                        </span>
                      </div>

                      {planoMetas.length === 0 ? (
                        <p className="text-[11px] italic text-slate-500">
                          Sem metas cadastradas neste plano.
                        </p>
                      ) : (
                        <table className="w-full text-xs border-collapse border border-slate-200 mt-2">
                          <thead>
                            <tr className="bg-slate-100 text-left font-semibold border-b border-slate-200 text-[11px]">
                              <th className="p-1.5 border-r border-slate-200">
                                Meta / Ação Prevista
                              </th>
                              <th className="p-1.5 border-r border-slate-200 text-center w-20">
                                Alvo
                              </th>
                              <th className="p-1.5 border-r border-slate-200 text-center w-20">
                                Realizado
                              </th>
                              <th className="p-1.5 border-r border-slate-200 text-center w-16">
                                %
                              </th>
                              <th className="p-1.5 border-r border-slate-200 text-center w-24">
                                Prazo
                              </th>
                              <th className="p-1.5 text-center w-24">Situação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planoMetas.map((m) => {
                              const alvo = m.quantidade_alvo || 0
                              const realizada = m.quantidade_realizada || 0
                              const perc =
                                alvo > 0
                                  ? Math.min(100, Math.round((realizada / alvo) * 100))
                                  : m.status === 'concluida'
                                    ? 100
                                    : 0
                              const isConcluida = m.status === 'concluida'

                              return (
                                <tr key={m.id} className="border-b border-slate-200 text-[11px]">
                                  <td className="p-1.5 border-r border-slate-200">{m.descricao}</td>
                                  <td className="p-1.5 border-r border-slate-200 text-center">
                                    {alvo > 0 ? alvo : '-'}
                                  </td>
                                  <td className="p-1.5 border-r border-slate-200 text-center">
                                    {realizada}
                                  </td>
                                  <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                                    {perc}%
                                  </td>
                                  <td className="p-1.5 border-r border-slate-200 text-center">
                                    {formatDateBR(m.prazo)}
                                  </td>
                                  <td className="p-1.5 text-center uppercase font-bold text-[10px]">
                                    {isConcluida ? 'Concluída' : 'Em Andamento'}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tabela de Atividades de Prestadores Vinculadas */}
          <div className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-wider mb-2 border-b border-black pb-1">
              4. Atividades de Prestadores / Equipe Técnica Vinculadas
            </h2>
            {atividades.length === 0 ? (
              <p className="text-xs italic text-slate-500 py-2">
                Nenhum registro de atividade de prestador vinculado aos planos desta secretaria.
              </p>
            ) : (
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-left font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 w-36">Prestador</th>
                    <th className="p-2 border-r border-slate-300 w-24">Data</th>
                    <th className="p-2 border-r border-slate-300">
                      Descrição dos Serviços Executados
                    </th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Horas</th>
                    <th className="p-2 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {atividades.map((a) => (
                    <tr key={a.id} className="border-b border-slate-200">
                      <td className="p-2 border-r border-slate-300 font-semibold">
                        {a.expand?.prestador_id?.nome || 'Prestador Vinculado'}
                      </td>
                      <td className="p-2 border-r border-slate-300">{formatDateBR(a.data)}</td>
                      <td className="p-2 border-r border-slate-300">{a.descricao}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-bold">
                        {a.horas}h
                      </td>
                      <td className="p-2 text-center uppercase text-[10px] font-bold">
                        {a.status}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-t border-slate-300">
                    <td colSpan={3} className="p-2 border-r border-slate-300 text-right uppercase">
                      Total de Horas Apuradas:
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">
                      {atividades.reduce((s, a) => s + (Number(a.horas) || 0), 0)}h
                    </td>
                    <td className="p-2 text-center">-</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Bloco Formal de Assinaturas (Rodapé de Impressão) */}
          <div className="pt-10 border-t border-black grid grid-cols-2 gap-8 text-center text-xs mt-12">
            <div className="space-y-2">
              <div className="border-b border-black w-4/5 mx-auto h-8"></div>
              <p className="font-bold text-black uppercase">Responsável pela Prestação de Contas</p>
              <p className="text-[11px] text-slate-600">
                Coordenação de Projetos e Convênios — OSCIP
              </p>
            </div>

            <div className="space-y-2">
              <div className="border-b border-black w-4/5 mx-auto h-8"></div>
              <p className="font-bold text-black uppercase">
                {secretaria.responsavel || 'Gestor(a) Municipal Concedente'}
              </p>
              <p className="text-[11px] text-slate-600">{secretaria.nome}</p>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-500">
            Documento emitido eletronicamente pelo Sistema Integrado de Gestão de Projetos e
            Convênios em {new Date().toLocaleString('pt-BR')}.
          </div>
        </div>

        {/* Rodapé do Modal (Tela) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 no-print">
          <Button variant="outline" onClick={onClose} size="sm">
            Fechar
          </Button>
          <Button
            onClick={handlePrint}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
