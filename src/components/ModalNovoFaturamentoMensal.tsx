import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getConvenios,
  getSecretarias,
  getProjetos,
  getCatalogoAtividades,
  getPrestadoresColaboradores,
  createFaturamentoMensal,
  getFaturamentosMensais,
} from '@/services/api'
import type {
  ConvenioRecord,
  SecretariaRecord,
  ProjetoRecord,
  PrestadorColaboradorRecord,
  CatalogoAtividadeRecord,
  FaturamentoItemPJ,
  FaturamentoItemCLT,
  FaturamentoItemAtividade,
  FaturamentoTipo,
} from '@/types'
import { formatBRL } from '@/components/StatusBadge'
import { Plus, Trash2, Loader2, Calculator } from 'lucide-react'
import { maskCurrency, parseCurrencyBRL, formatCurrencyBRL } from '@/lib/masks'

interface ModalNovoFaturamentoMensalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ModalNovoFaturamentoMensal({
  open,
  onClose,
  onSuccess,
}: ModalNovoFaturamentoMensalProps) {
  const [convenios, setConvenios] = useState<ConvenioRecord[]>([])
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [prestadores, setPrestadores] = useState<PrestadorColaboradorRecord[]>([])
  const [catalogo, setCatalogo] = useState<CatalogoAtividadeRecord[]>([])

  const [convenioId, setConvenioId] = useState('')
  const [secretariaId, setSecretariaId] = useState('')
  const [projetoId, setProjetoId] = useState('')
  const [tipoFaturamento, setTipoFaturamento] = useState<FaturamentoTipo>('PJ')
  const [mes, setMes] = useState<number>(8) // Padrão Agosto
  const [ano, setAno] = useState<number>(2026) // Padrão 2026
  const [periodo, setPeriodo] = useState('AGOSTO DE 2026')
  const [competencia, setCompetencia] = useState('01 A 31 DE AGOSTO DE 2026')
  const [numeroSequencial, setNumeroSequencial] = useState('')

  // Itens PJ
  const [itensPJ, setItensPJ] = useState<FaturamentoItemPJ[]>([])
  // Itens CLT
  const [itensCLT, setItensCLT] = useState<FaturamentoItemCLT[]>([])

  // Despesas Administrativas
  const [valorDespesasAdm, setValorDespesasAdm] = useState<string>(formatCurrencyBRL(42901.31))

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      Promise.all([
        getConvenios(),
        getSecretarias(),
        getProjetos(),
        getPrestadoresColaboradores(),
        getCatalogoAtividades(),
        getFaturamentosMensais(),
      ]).then(([cList, sList, pList, prestList, catList, fatsList]) => {
        setConvenios(cList)
        setSecretarias(sList)
        setProjetos(pList)
        setPrestadores(prestList)
        setCatalogo(catList)

        if (cList.length > 0 && !convenioId) setConvenioId(cList[0].id)
        if (sList.length > 0 && !secretariaId) setSecretariaId(sList[0].id)
        if (pList.length > 0 && !projetoId) setProjetoId(pList[0].id)

        // Gerar sequencial automático do ano: ex: 001/2026
        const fatAno = fatsList.filter((f) => f.ano === ano)
        const nextNum = (fatAno.length + 1).toString().padStart(3, '0')
        setNumeroSequencial(`${nextNum}/${ano}`)
      })
    }
  }, [open, ano])

  // Atualizar competência e período quando mês ou ano muda
  const handleAtualizarPeriodo = (m: number, a: number) => {
    setMes(m)
    setAno(a)
    const mesesNomes = [
      'JANEIRO',
      'FEVEREIRO',
      'MARÇO',
      'ABRIL',
      'MAIO',
      'JUNHO',
      'JULHO',
      'AGOSTO',
      'SETEMBRO',
      'OUTUBRO',
      'NOVEMBRO',
      'DEZEMBRO',
    ]
    const nomeMes = mesesNomes[m - 1] || 'MÊS'
    setPeriodo(`${nomeMes} DE ${a}`)

    // Quantidade de dias do mês
    const ultimoDia = new Date(a, m, 0).getDate()
    setCompetencia(`01 A ${ultimoDia} DE ${nomeMes} DE ${a}`)
  }

  // Adicionar item PJ
  const handleAddLinhaPJ = () => {
    setItensPJ((prev) => [
      ...prev,
      {
        item: prev.length + 1,
        empresa: '',
        cnpj: '',
        profissional: '',
        dotacao: 'Secretaria de Saúde - APS/PAB',
        atividade: '',
        tipo: 'Serviço Mensal',
        local: '',
        dataInicio: '',
        remuneracaoBase: 0,
        ref: 31,
        valor: 0,
      },
    ])
  }

  // Preencher item PJ ao selecionar um prestador cadastrado
  const handlePreencherPrestadorPJ = (index: number, prestadorId: string) => {
    const p = prestadores.find((item) => item.id === prestadorId)
    if (!p) return

    setItensPJ((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it
        const base = p.remuneracao_base || 0
        // Cálculo proporcional inicial: (base / 30) * ref (se ref 31, valor = base ou mês cheio)
        const refDias = it.ref || 31
        const valCalculado =
          it.tipo === 'Demanda' ? base * refDias : (base / 30) * Math.min(refDias, 30)

        return {
          ...it,
          empresa: p.razao_social || '',
          cnpj: p.cnpj || '',
          profissional: p.profissional || '',
          atividade: p.cargo || '',
          remuneracaoBase: base,
          valor: Number(valCalculado.toFixed(2)),
        }
      }),
    )
  }

  // Preencher item PJ ao selecionar atividade do catálogo do projeto
  const handlePreencherAtividadePJ = (index: number, ativDesc: string) => {
    const ativ = catalogo.find((c) => c.descricao === ativDesc)
    setItensPJ((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it
        const base = ativ ? ativ.valor_unitario : it.remuneracaoBase
        const isDemanda =
          ativ?.tipo_execucao === 'Plantão' || ativ?.tipo_execucao === 'Conforme Demanda'
        const tipoStr = isDemanda ? 'Demanda' : 'Serviço Mensal'
        const refVal = it.ref || (isDemanda ? 1 : 31)

        const val = isDemanda ? base * refVal : (base / 30) * Math.min(refVal, 30)

        return {
          ...it,
          atividade: ativDesc,
          tipo: tipoStr,
          remuneracaoBase: base,
          ref: refVal,
          valor: Number(val.toFixed(2)),
        }
      }),
    )
  }

  // Atualizar campo de item PJ e recalcular valor
  const handleUpdateItemPJ = (index: number, field: keyof FaturamentoItemPJ, val: any) => {
    setItensPJ((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it
        const atualizado = { ...it, [field]: val }

        // Recalcular valor se mudou ref ou remuneracaoBase ou tipo
        if (field === 'ref' || field === 'remuneracaoBase' || field === 'tipo') {
          const base = Number(atualizado.remuneracaoBase) || 0
          const ref = Number(atualizado.ref) || 0
          if (atualizado.tipo === 'Demanda') {
            // Contrato sob demanda: quantidade de plantões/demandas * valor unitário
            atualizado.valor = Number((base * ref).toFixed(2))
          } else {
            // Serviço Mensal: proporcional aos dias prestados (base / 30 * dias, ref 31 = mês cheio base)
            if (ref >= 30) {
              atualizado.valor = base
            } else {
              atualizado.valor = Number(((base / 30) * ref).toFixed(2))
            }
          }
        }
        return atualizado
      }),
    )
  }

  const handleRemoveLinhaPJ = (index: number) => {
    setItensPJ((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Adicionar linha CLT
  const handleAddLinhaCLT = () => {
    setItensCLT((prev) => [
      ...prev,
      {
        colaborador: '',
        cpf: '',
        cargo: '',
        remuneracaoBase: 0,
        ref: 30,
        remuneracao: 0,
        insalubridade: 0,
        periculosidade: 0,
        salarioFamilia: 0,
        horasExtras: 0,
        dsr: 0,
        adicionalNoturno: 0,
        gratificacao: 0,
        plantao: 0,
        faltas: 0,
        proventos: 0,
        provisao1944: 0,
        verbasRescisorias: 0,
        multa40: 0,
        encargosTributarios: 0,
        valorTotal: 0,
      },
    ])
  }

  // Preencher colaborador CLT selecionado
  const handlePreencherColaboradorCLT = (index: number, prestadorId: string) => {
    const c = prestadores.find((item) => item.id === prestadorId)
    if (!c) return

    setItensCLT((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it
        const base = c.remuneracao_base || 0
        const proventos = base
        const provisao = proventos * 0.1944
        const encargos = (proventos + provisao) * 0.378
        const total = proventos + provisao + encargos

        return {
          ...it,
          colaborador: c.nome_colaborador || '',
          cpf: c.cpf_colaborador || '',
          codigoConsisa: c.codigo_consisa || '',
          cargo: c.cargo || '',
          remuneracaoBase: base,
          remuneracao: base,
          proventos: Number(proventos.toFixed(2)),
          provisao1944: Number(provisao.toFixed(2)),
          encargosTributarios: Number(encargos.toFixed(2)),
          valorTotal: Number(total.toFixed(2)),
        }
      }),
    )
  }

  // Atualizar campo CLT e recalcular proventos, provisões e encargos
  const handleUpdateItemCLT = (index: number, field: keyof FaturamentoItemCLT, val: any) => {
    setItensCLT((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it
        const atualizado = { ...it, [field]: val }

        const rem = Number(atualizado.remuneracao) || Number(atualizado.remuneracaoBase) || 0
        const ins = Number(atualizado.insalubridade) || 0
        const per = Number(atualizado.periculosidade) || 0
        const he = Number(atualizado.horasExtras) || 0
        const dsr = Number(atualizado.dsr) || 0
        const an = Number(atualizado.adicionalNoturno) || 0
        const grat = Number(atualizado.gratificacao) || 0
        const pl = Number(atualizado.plantao) || 0
        const faltas = Number(atualizado.faltas) || 0

        const proventos = rem + ins + per + he + dsr + an + grat + pl - faltas
        const provisao = proventos * 0.1944
        const encargos = proventos * 0.378
        const vr = Number(atualizado.verbasRescisorias) || 0
        const m40 = Number(atualizado.multa40) || 0
        const total = proventos + provisao + encargos + vr + m40

        atualizado.proventos = Number(proventos.toFixed(2))
        atualizado.provisao1944 = Number(provisao.toFixed(2))
        atualizado.encargosTributarios = Number(encargos.toFixed(2))
        atualizado.valorTotal = Number(total.toFixed(2))

        return atualizado
      }),
    )
  }

  const handleRemoveLinhaCLT = (index: number) => {
    setItensCLT((prev) => prev.filter((_, idx) => idx !== index))
  }

  // Totais calculados
  const totalExecucaoPJ = itensPJ.reduce((s, it) => s + (Number(it.valor) || 0), 0)
  const totalExecucaoCLT = itensCLT.reduce((s, it) => s + (Number(it.valorTotal) || 0), 0)
  const totalExecucaoDireta = totalExecucaoPJ + totalExecucaoCLT
  const totalDespesasAdm = parseCurrencyBRL(valorDespesasAdm) || 0
  const valorTotalGeral = totalExecucaoDireta + totalDespesasAdm

  // Agrupamento por Atividade (Aba "TOTAL POR ATIVIDADE PT")
  const gerarItensPorAtividade = (): FaturamentoItemAtividade[] => {
    const mapa = new Map<string, FaturamentoItemAtividade>()

    // PJ
    itensPJ.forEach((pj) => {
      const chave = `PJ-${pj.atividade}-${pj.tipo}`
      const existing = mapa.get(chave)
      if (existing) {
        existing.quantidade += 1
        existing.valor += pj.valor
      } else {
        mapa.set(chave, {
          descricao: pj.atividade || 'Atividade PJ',
          tipo: pj.tipo,
          quantidade: 1,
          valor: pj.valor,
          tipoVinculo: 'PJ',
        })
      }
    })

    // CLT
    itensCLT.forEach((clt) => {
      const chave = `CLT-${clt.cargo}-Mensal`
      const existing = mapa.get(chave)
      if (existing) {
        existing.quantidade += 1
        existing.valor += clt.valorTotal
      } else {
        mapa.set(chave, {
          descricao: clt.cargo || 'Cargo CLT',
          tipo: 'Mensal',
          quantidade: 1,
          valor: clt.valorTotal,
          tipoVinculo: 'CLT',
        })
      }
    })

    return Array.from(mapa.values())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!convenioId) {
      setErrors({ convenio: 'Selecione o instrumento.' })
      return
    }
    if (!secretariaId) {
      setErrors({ secretaria: 'Selecione a secretaria.' })
      return
    }

    setLoading(true)
    try {
      const itensAtiv = gerarItensPorAtividade()

      // Rateio por dotação PJ (APS/PAB e MAC)
      const totalAPS = itensPJ
        .filter((it) => it.dotacao?.includes('APS') || it.dotacao?.includes('PAB'))
        .reduce((s, it) => s + it.valor, 0)
      const totalMAC = itensPJ
        .filter((it) => it.dotacao?.includes('MAC'))
        .reduce((s, it) => s + it.valor, 0)

      const pctAPS = totalExecucaoPJ > 0 ? totalAPS / totalExecucaoPJ : 0.5
      const pctMAC = totalExecucaoPJ > 0 ? totalMAC / totalExecucaoPJ : 0.5

      const payload = {
        numero_sequencial: numeroSequencial,
        convenio_id: convenioId,
        secretaria_id: secretariaId,
        projeto_id: projetoId || undefined,
        tipo_faturamento: tipoFaturamento,
        competencia,
        periodo,
        mes,
        ano,
        valor_execucao_direta: Number(totalExecucaoDireta.toFixed(2)),
        valor_execucao_clt: Number(totalExecucaoCLT.toFixed(2)),
        valor_execucao_pj: Number(totalExecucaoPJ.toFixed(2)),
        valor_despesas_adm: Number(totalDespesasAdm.toFixed(2)),
        valor_total: Number(valorTotalGeral.toFixed(2)),
        status_nf: 'aguardando_nf' as const,
        itens_detalhamento_pj: itensPJ,
        itens_detalhamento_clt: itensCLT,
        itens_por_atividade: itensAtiv,
        rateio_despesas_adm: {
          aps_pab_pct: pctAPS,
          aps_pab_valor: totalDespesasAdm * pctAPS,
          mac_pct: pctMAC,
          mac_valor: totalDespesasAdm * pctMAC,
        },
      }

      await createFaturamentoMensal(payload)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setErrors({ general: err instanceof Error ? err.message : 'Erro ao emitir faturamento.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center justify-between">
            <span>Novo Faturamento Mensal (Termo de Parceria nº 001/2026)</span>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Nº {numeroSequencial || '---'}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Lançamento mensal de prestação de serviços com cálculo de dias trabalhados para PJ e
            referências para contratos sob demanda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          {/* Dados Cabeçalho e Período */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Instrumento *</Label>
              <Select value={convenioId} onValueChange={setConvenioId}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {convenios.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.numero_instrumento} - {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Secretaria *</Label>
              <Select value={secretariaId} onValueChange={setSecretariaId}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {secretarias.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Projeto</Label>
              <Select value={projetoId} onValueChange={setProjetoId}>
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="Selecione o Projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Modalidade *</Label>
              <Select
                value={tipoFaturamento}
                onValueChange={(v) => setTipoFaturamento(v as FaturamentoTipo)}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PJ">Faturamento PJ</SelectItem>
                  <SelectItem value="CLT">Faturamento CLT</SelectItem>
                  <SelectItem value="CONSOLIDADO">Consolidado (PJ + CLT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mês, Ano, Período e Competência */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Mês de Competência</Label>
              <Select
                value={String(mes)}
                onValueChange={(val) => handleAtualizarPeriodo(Number(val), ano)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { m: 1, n: '01 - Janeiro' },
                    { m: 2, n: '02 - Fevereiro' },
                    { m: 3, n: '03 - Março' },
                    { m: 4, n: '04 - Abril' },
                    { m: 5, n: '05 - Maio' },
                    { m: 6, n: '06 - Junho' },
                    { m: 7, n: '07 - Julho' },
                    { m: 8, n: '08 - Agosto' },
                    { m: 9, n: '09 - Setembro' },
                    { m: 10, n: '10 - Outubro' },
                    { m: 11, n: '11 - Novembro' },
                    { m: 12, n: '12 - Dezembro' },
                  ].map((item) => (
                    <SelectItem key={item.m} value={String(item.m)}>
                      {item.n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Ano</Label>
              <Input
                type="number"
                value={ano}
                onChange={(e) => handleAtualizarPeriodo(mes, Number(e.target.value) || 2026)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">Período (Exibição)</Label>
              <Input
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="h-8 text-xs font-medium"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-[#1E293B]">
                Competência Completa
              </Label>
              <Input
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="h-8 text-xs font-medium"
              />
            </div>
          </div>

          {/* TABELA DE LANÇAMENTO PJ (quando PJ ou Consolidado) */}
          {(tipoFaturamento === 'PJ' || tipoFaturamento === 'CONSOLIDADO') && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                    1.2 - Detalhamento da Execução Direta PJ
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Lançamento de dias trabalhados (Ref: 31 = mês cheio, &lt;30 = proporcional) ou
                    quantidade de demandas/plantões.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLinhaPJ}
                  className="h-7 text-xs text-[#1FAF7A] border-[#1FAF7A]/40 hover:bg-[#1FAF7A]/10 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Prestador PJ
                </Button>
              </div>

              {itensPJ.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-xs text-[#64748B]">
                  Nenhum prestador PJ lançado neste faturamento. Clique em &ldquo;Adicionar
                  Prestador PJ&rdquo; acima.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-[#475569] font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5">Prestador / Empresa</th>
                        <th className="py-2 px-2">Dotação</th>
                        <th className="py-2 px-2">Atividade</th>
                        <th className="py-2 px-2">Tipo</th>
                        <th className="py-2 px-2">Remun. Base</th>
                        <th className="py-2 px-2">Ref (Dias/Plantões)</th>
                        <th className="py-2 px-2">Valor Calculado</th>
                        <th className="py-2 px-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itensPJ.map((pj, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2">
                            <Select onValueChange={(val) => handlePreencherPrestadorPJ(idx, val)}>
                              <SelectTrigger className="h-7 text-[11px] w-44 bg-white">
                                <SelectValue placeholder={pj.empresa || 'Selecionar Prestador'} />
                              </SelectTrigger>
                              <SelectContent>
                                {prestadores
                                  .filter((p) => p.tipo === 'PJ')
                                  .map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.razao_social}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-1.5 px-2">
                            <Select
                              value={pj.dotacao}
                              onValueChange={(val) => handleUpdateItemPJ(idx, 'dotacao', val)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-36 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Secretaria de Saúde - APS/PAB">
                                  Saúde - APS/PAB
                                </SelectItem>
                                <SelectItem value="Secretaria de Saúde - MAC">
                                  Saúde - MAC
                                </SelectItem>
                                <SelectItem value="Secretaria de Obras">Obras</SelectItem>
                                <SelectItem value="Secretaria de Educação">Educação</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={pj.atividade}
                              onChange={(e) => handleUpdateItemPJ(idx, 'atividade', e.target.value)}
                              placeholder="Atividade"
                              className="h-7 text-[11px] w-36 bg-white"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Select
                              value={pj.tipo}
                              onValueChange={(val) => handleUpdateItemPJ(idx, 'tipo', val)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-28 bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Serviço Mensal">Serviço Mensal</SelectItem>
                                <SelectItem value="Demanda">Demanda / Plantão</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={pj.remuneracaoBase}
                              onChange={(e) =>
                                handleUpdateItemPJ(
                                  idx,
                                  'remuneracaoBase',
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="h-7 text-[11px] w-24 bg-white font-mono"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={pj.ref}
                              onChange={(e) =>
                                handleUpdateItemPJ(idx, 'ref', Number(e.target.value) || 0)
                              }
                              className="h-7 text-[11px] w-16 bg-white font-mono font-bold"
                            />
                          </td>
                          <td className="py-1.5 px-2 font-mono font-bold text-emerald-700">
                            {formatBRL(pj.valor)}
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLinhaPJ(idx)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TABELA DE LANÇAMENTO CLT (quando CLT ou Consolidado) */}
          {(tipoFaturamento === 'CLT' || tipoFaturamento === 'CONSOLIDADO') && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                    1.1 - Detalhamento da Execução Direta CLT
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Lançamento de proventos, insalubridade, plantões e provisões/encargos legais.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLinhaCLT}
                  className="h-7 text-xs text-[#1FAF7A] border-[#1FAF7A]/40 hover:bg-[#1FAF7A]/10 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Colaborador CLT
                </Button>
              </div>

              {itensCLT.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-xs text-[#64748B]">
                  Nenhum colaborador CLT lançado. Clique em &ldquo;Adicionar Colaborador CLT&rdquo;
                  acima.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-60">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-[#475569] font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-2">Colaborador</th>
                        <th className="py-2 px-2">Cargo</th>
                        <th className="py-2 px-2">Remun. Base</th>
                        <th className="py-2 px-2">Insalubridade</th>
                        <th className="py-2 px-2">Plantão</th>
                        <th className="py-2 px-2">Provisão 19,44%</th>
                        <th className="py-2 px-2">Encargos 37,8%</th>
                        <th className="py-2 px-2">Valor Total</th>
                        <th className="py-2 px-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itensCLT.map((clt, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2">
                            <Select
                              onValueChange={(val) => handlePreencherColaboradorCLT(idx, val)}
                            >
                              <SelectTrigger className="h-7 text-[11px] w-40 bg-white">
                                <SelectValue placeholder={clt.colaborador || 'Selecionar CLT'} />
                              </SelectTrigger>
                              <SelectContent>
                                {prestadores
                                  .filter((p) => p.tipo === 'CLT')
                                  .map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.nome_colaborador} - {p.cargo}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={clt.cargo}
                              onChange={(e) => handleUpdateItemCLT(idx, 'cargo', e.target.value)}
                              className="h-7 text-[11px] w-32 bg-white"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={clt.remuneracaoBase}
                              onChange={(e) =>
                                handleUpdateItemCLT(
                                  idx,
                                  'remuneracaoBase',
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="h-7 text-[11px] w-20 bg-white font-mono"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={clt.insalubridade}
                              onChange={(e) =>
                                handleUpdateItemCLT(
                                  idx,
                                  'insalubridade',
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="h-7 text-[11px] w-16 bg-white font-mono"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={clt.plantao}
                              onChange={(e) =>
                                handleUpdateItemCLT(idx, 'plantao', Number(e.target.value) || 0)
                              }
                              className="h-7 text-[11px] w-16 bg-white font-mono"
                            />
                          </td>
                          <td className="py-1.5 px-2 font-mono text-slate-600">
                            {formatBRL(clt.provisao1944 || 0)}
                          </td>
                          <td className="py-1.5 px-2 font-mono text-slate-600">
                            {formatBRL(clt.encargosTributarios || 0)}
                          </td>
                          <td className="py-1.5 px-2 font-mono font-bold text-emerald-700">
                            {formatBRL(clt.valorTotal)}
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveLinhaCLT(idx)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Seção 2: Despesas Administrativas e Operacionais */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#1E293B] block">
                2 - Despesas Administrativas e Operacionais do Termo de Parceria
              </span>
              <span className="text-[11px] text-[#64748B]">
                Rateio das despesas administrativas e operacionais (auditoria, imóvel sede, TI,
                contabilidade).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-[#475569]">Valor Rateio:</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748B]">
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={valorDespesasAdm}
                  onChange={(e) => setValorDespesasAdm(maskCurrency(e.target.value))}
                  placeholder="0,00"
                  className="pl-8 w-36 h-8 text-xs font-bold bg-white tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Resumo Consolidado do Faturamento */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
              <span>1. Execução Direta do Projeto (CLT + PJ):</span>
              <span className="font-mono">{formatBRL(totalExecucaoDireta)}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#1E293B]">
              <span>2. Despesas Administrativas e Operacionais:</span>
              <span className="font-mono">{formatBRL(totalDespesasAdm)}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-900">
                VALOR TOTAL DO FATURAMENTO MENSAL:
              </span>
              <span className="text-lg font-bold text-emerald-800 font-mono">
                {formatBRL(valorTotalGeral)}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gerar Faturamento & Relatório
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
