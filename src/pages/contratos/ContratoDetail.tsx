import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Edit2,
  Building2,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { StatusBadge, formatBRL, formatDateBR } from '@/components/StatusBadge'
import { ModalContrato } from '@/components/ModalContrato'
import { getContratoById, getAtividadesByPrestador } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import type { ContratoRecord, AtividadeRecord } from '@/types'

export default function ContratoDetail() {
  const { id } = useParams<{ id: string }>()
  const [contrato, setContrato] = useState<ContratoRecord | null>(null)
  const [atividades, setAtividades] = useState<AtividadeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const fetchData = async () => {
    if (!id) return
    try {
      const data = await getContratoById(id)
      setContrato(data)
      if (data.tipo === 'PJ') {
        const ativs = await getAtividadesByPrestador(id)
        setAtividades(ativs)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useRealtime('contratos', () => fetchData())
  useRealtime('atividades', () => fetchData())

  if (loading) {
    return (
      <div className="text-center py-20 text-xs text-[#64748B]">
        Carregando detalhes do contrato...
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-lg font-bold text-[#1E293B]">Contrato não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/contratos">Voltar para Contratos</Link>
        </Button>
      </div>
    )
  }

  const totalHorasPJ = atividades.reduce((s, a) => s + (Number(a.horas) || 0), 0)
  const totalAprovadoPJ = atividades
    .filter((a) => a.status === 'aprovada')
    .reduce((s, a) => s + (Number(a.valor_aprovado) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#64748B]">
        <Link to="/contratos" className="hover:text-[#1FAF7A] inline-flex items-center">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Contratos
        </Link>
        <span>/</span>
        <span className="text-[#1E293B] font-medium">{contrato.nome}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1FAF7A]/10 text-[#1FAF7A] border border-[#1FAF7A]/20">
              Regime {contrato.tipo}
            </span>
            <h1 className="text-2xl font-bold text-[#1E293B]">{contrato.nome}</h1>
            <StatusBadge status={contrato.status} />
          </div>
          <p className="text-xs text-[#64748B]">
            Função: <strong className="text-[#1E293B]">{contrato.cargo_funcao}</strong>
            {contrato.expand?.projeto_id && (
              <>
                {' '}
                • Vinculado ao projeto: <strong>{contrato.expand.projeto_id.nome}</strong>
              </>
            )}
          </p>
        </div>

        <Button
          onClick={() => setEditModalOpen(true)}
          className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
          Editar Contrato
        </Button>
      </div>

      {/* Cards de Informações Chave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Remuneração / Valor
            </span>
            <p className="text-2xl font-bold text-[#1E293B] mt-1 tabular-nums">
              {contrato.tipo === 'CLT'
                ? formatBRL(contrato.valor)
                : contrato.tipo_pj === 'horas'
                  ? `${formatBRL(contrato.valor)} / hora`
                  : `${formatBRL(contrato.valor)} / mês`}
            </p>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              {contrato.tipo === 'CLT' ? 'Salário CLT base' : 'Tarifa contratual acordada'}
            </span>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              Vigência Contratual
            </span>
            <p className="text-sm font-bold text-[#1E293B] mt-1.5">
              Início: {formatDateBR(contrato.data_inicio)}
            </p>
            <p className="text-xs text-[#64748B]">
              Término: {contrato.data_fim ? formatDateBR(contrato.data_fim) : 'Indeterminado'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E2E8F0]">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-[#64748B] uppercase">
              {contrato.tipo === 'CLT' ? 'Benefícios & Encargos' : 'Atividades & Horas'}
            </span>
            {contrato.tipo === 'CLT' ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {contrato.beneficios && contrato.beneficios.length > 0 ? (
                  contrato.beneficios.map((b) => (
                    <span
                      key={b}
                      className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded"
                    >
                      {b}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#94A3B8]">Nenhum benefício extra</span>
                )}
              </div>
            ) : (
              <div className="mt-1">
                <span className="text-xl font-bold text-[#1E293B]">{totalHorasPJ}h</span>
                <span className="text-xs text-[#64748B] ml-2">acumuladas</span>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                  Faturado aprovado: {formatBRL(totalAprovadoPJ)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Seção PJ: Atividades Registradas pelo Prestador */}
      {contrato.tipo === 'PJ' && (
        <Card className="border-[#E2E8F0]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#1E293B]">
                Atividades Executadas pelo Prestador
              </CardTitle>
              <CardDescription className="text-xs text-[#64748B]">
                Lançamentos de horas e entregas de serviço realizadas para a organização
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link to="/atividades">Acessar Painel de Atividades</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {atividades.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#64748B]">
                Nenhuma atividade foi reportada por este prestador até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50 text-[#64748B] font-semibold">
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Projeto</th>
                      <th className="py-3 px-4">Descrição das Tarefas</th>
                      <th className="py-3 px-4">Horas</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {atividades.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-[#64748B]">{formatDateBR(a.data)}</td>
                        <td className="py-3 px-4 font-medium text-[#1E293B]">
                          {a.expand?.projeto_id?.nome || '—'}
                        </td>
                        <td className="py-3 px-4 text-[#475569] max-w-sm truncate">
                          {a.descricao}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1E293B]">{a.horas}h</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cláusulas Contratuais (Expandíveis) */}
      <Card className="border-[#E2E8F0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#1E293B]">
            Cláusulas Contratuais & Termos Jurídicos
          </CardTitle>
          <CardDescription className="text-xs text-[#64748B]">
            Instrumento formal, obrigações de confidencialidade, vigência e rescisão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="item-1">
            <AccordionItem value="item-1" className="border-slate-200">
              <AccordionTrigger className="text-xs font-semibold text-[#1E293B] hover:text-[#1FAF7A]">
                Cláusula 1ª — Do Objeto e Atribuições
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[#64748B] leading-relaxed pt-1">
                {contrato.clausulas ||
                  `O presente instrumento tem por objetivo a prestação de serviços e execução das atividades correspondentes à função de ${contrato.cargo_funcao}, vinculadas às finalidades estatutárias da organização e convênios correlatos.`}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-slate-200">
              <AccordionTrigger className="text-xs font-semibold text-[#1E293B] hover:text-[#1FAF7A]">
                Cláusula 2ª — Da Remuneração e Forma de Pagamento
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[#64748B] leading-relaxed pt-1">
                A remuneração foi ajustada no valor de {formatBRL(contrato.valor)}{' '}
                {contrato.tipo === 'PJ' && contrato.tipo_pj === 'horas'
                  ? 'por hora de dedicação técnica efetivamente comprovada'
                  : 'mensais'}
                , mediante emissão de documento comprobatório e validação pela coordenação
                administrativa.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-slate-200">
              <AccordionTrigger className="text-xs font-semibold text-[#1E293B] hover:text-[#1FAF7A]">
                Cláusula 3ª — Da Confidencialidade e Proteção de Dados (LGPD)
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[#64748B] leading-relaxed pt-1">
                O contratado obriga-se a manter sob sigilo absoluto todas as informações
                estratégicas, dados de beneficiários sociais, relatórios e documentos da organização
                aos quais tiver acesso durante e após a vigência deste contrato.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="border-slate-200">
              <AccordionTrigger className="text-xs font-semibold text-[#1E293B] hover:text-[#1FAF7A]">
                Cláusula 4ª — Da Rescisão Contratual
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[#64748B] leading-relaxed pt-1">
                O presente contrato poderá ser rescindido por qualquer das partes mediante aviso
                prévio formal e escrito de no mínimo 30 (trinta) dias, ou imediatamente por
                descumprimento de quaisquer das disposições pactuadas.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Modal Editar */}
      <ModalContrato
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchData}
        contratoToEdit={contrato}
      />
    </div>
  )
}
