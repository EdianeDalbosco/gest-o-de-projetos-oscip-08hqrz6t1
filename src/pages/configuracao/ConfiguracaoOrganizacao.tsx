import React, { useState, useEffect } from 'react'
import {
  Building2,
  UserCheck,
  Save,
  Loader2,
  CheckCircle2,
  FileSignature,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { maskCnpj, maskCpf, maskCpfOrCnpj } from '@/lib/masks'
import { getOrganizacaoConfig, saveOrganizacaoConfig } from '@/services/api'
import { DADOS_CONTRATANTE } from '@/lib/modelosContratoPJ'
import type { OrganizacaoConfigRecord } from '@/types'

export default function ConfiguracaoOrganizacao() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [configId, setConfigId] = useState<string | undefined>(undefined)

  // Dados da Organização
  const [nomeOrganizacao, setNomeOrganizacao] = useState(DADOS_CONTRATANTE.razaoSocial)
  const [naturezaJuridica, setNaturezaJuridica] = useState(DADOS_CONTRATANTE.qualificacao)
  const [cnpj, setCnpj] = useState(DADOS_CONTRATANTE.cnpj)
  const [enderecoCompleto, setEnderecoCompleto] = useState(DADOS_CONTRATANTE.endereco)
  const [cidade, setCidade] = useState('Cuiabá')
  const [estado, setEstado] = useState('MT')
  const [foro, setForo] = useState(DADOS_CONTRATANTE.foro)
  const [telefone, setTelefone] = useState('(65) 3000-0000')
  const [email, setEmail] = useState('contato@saobento.org.br')
  const [termoParceriaPadrao, setTermoParceriaPadrao] = useState(DADOS_CONTRATANTE.termoParceria)

  // Dados do Presidente / Representante
  const [presidenteNome, setPresidenteNome] = useState(DADOS_CONTRATANTE.representante)
  const [presidenteCpf, setPresidenteCpf] = useState(DADOS_CONTRATANTE.cpfRepresentante)
  const [presidenteCargo, setPresidenteCargo] = useState('Presidente')

  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null)
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  useEffect(() => {
    carregarConfig()
  }, [])

  const carregarConfig = async () => {
    setLoading(true)
    setErroMsg(null)
    try {
      const cfg = await getOrganizacaoConfig()
      if (cfg) {
        setConfigId(cfg.id)
        setNomeOrganizacao(cfg.nome_organizacao || DADOS_CONTRATANTE.razaoSocial)
        setNaturezaJuridica(cfg.natureza_juridica || DADOS_CONTRATANTE.qualificacao)
        setCnpj(cfg.cnpj || DADOS_CONTRATANTE.cnpj)
        setEnderecoCompleto(cfg.endereco_completo || DADOS_CONTRATANTE.endereco)
        setCidade(cfg.cidade || 'Cuiabá')
        setEstado(cfg.estado || 'MT')
        setForo(cfg.foro || DADOS_CONTRATANTE.foro)
        setTelefone(cfg.telefone || '')
        setEmail(cfg.email || '')
        setTermoParceriaPadrao(cfg.termo_parceria_padrao || DADOS_CONTRATANTE.termoParceria)

        setPresidenteNome(cfg.presidente_nome || DADOS_CONTRATANTE.representante)
        setPresidenteCpf(cfg.presidente_cpf || DADOS_CONTRATANTE.cpfRepresentante)
        setPresidenteCargo(cfg.presidente_cargo || 'Presidente')
      }
    } catch (err: unknown) {
      console.error(err)
      setErroMsg('Erro ao carregar dados da organização.')
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurarPadrao = () => {
    setNomeOrganizacao(DADOS_CONTRATANTE.razaoSocial)
    setNaturezaJuridica(DADOS_CONTRATANTE.qualificacao)
    setCnpj(DADOS_CONTRATANTE.cnpj)
    setEnderecoCompleto(DADOS_CONTRATANTE.endereco)
    setCidade('Cuiabá')
    setEstado('MT')
    setForo(DADOS_CONTRATANTE.foro)
    setPresidenteNome(DADOS_CONTRATANTE.representante)
    setPresidenteCpf(DADOS_CONTRATANTE.cpfRepresentante)
    setPresidenteCargo('Presidente')
    setTermoParceriaPadrao(DADOS_CONTRATANTE.termoParceria)
    toast({
      title: 'Valores restaurados para o padrão',
      description: 'Lembre-se de clicar em "Salvar Configurações" para persistir as alterações.',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setSucessoMsg(null)
    setErroMsg(null)

    if (!nomeOrganizacao.trim() || !cnpj.trim() || !enderecoCompleto.trim()) {
      setErroMsg(
        'Por favor preencha os campos obrigatórios da organização (Nome, CNPJ e Endereço).',
      )
      setSalvando(false)
      return
    }

    if (!presidenteNome.trim() || !presidenteCpf.trim()) {
      setErroMsg('Por favor preencha os dados do Presidente / Representante Legal (Nome e CPF).')
      setSalvando(false)
      return
    }

    try {
      const payload: Partial<OrganizacaoConfigRecord> = {
        nome_organizacao: nomeOrganizacao.trim(),
        natureza_juridica: naturezaJuridica.trim(),
        cnpj: cnpj.trim(),
        endereco_completo: enderecoCompleto.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        foro: foro.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        termo_parceria_padrao: termoParceriaPadrao.trim(),
        presidente_nome: presidenteNome.trim(),
        presidente_cpf: presidenteCpf.trim(),
        presidente_cargo: presidenteCargo.trim() || 'Presidente',
      }

      const salvo = await saveOrganizacaoConfig(payload, configId)
      setConfigId(salvo.id)
      setSucessoMsg('Dados da Organização e do Presidente atualizados com sucesso!')
      toast({
        title: 'Configurações salvas',
        description:
          'Os dados institucionais e do presidente foram atualizados e serão injetados nos contratos PJ.',
      })
    } catch (err: unknown) {
      console.error(err)
      const msg =
        err instanceof Error ? err.message : 'Falha ao salvar as configurações da organização.'
      setErroMsg(msg)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: msg,
      })
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[#1FAF7A] animate-spin" />
        <span className="text-sm text-[#64748B]">Carregando configurações da organização...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Institucional
            </span>
            <span className="text-xs text-[#64748B]">•</span>
            <span className="text-xs text-[#64748B]">Contratos & Documentos</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight mt-1">
            Dados da Organização e do Presidente
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Configure os dados institucionais fixos que são injetados automaticamente nos contratos
            PJ, relatórios de faturamento e termos gerados pelo sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRestaurarPadrao}
            className="text-xs text-[#64748B] hover:text-[#1E293B]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {erroMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloco 1: Dados da Organização */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#1FAF7A] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base text-[#1E293B]">
                  Dados Institucionais da Organização (OSCIP)
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Razão social, CNPJ, qualificação e endereço oficial da sede.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Nome da Organização / Razão Social *
                </Label>
                <Input
                  value={nomeOrganizacao}
                  onChange={(e) => setNomeOrganizacao(e.target.value)}
                  placeholder="Ex: ORGANIZAÇÃO DE SAÚDE SÃO BENTO"
                  className="font-semibold text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  CNPJ da Organização *
                </Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                  className="font-mono text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Foro de Eleição dos Contratos
                </Label>
                <Input
                  value={foro}
                  onChange={(e) => setForo(e.target.value)}
                  placeholder="Ex: Comarca de Cuiabá/MT"
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Natureza Jurídica / Qualificação Legal
                </Label>
                <Textarea
                  rows={2}
                  value={naturezaJuridica}
                  onChange={(e) => setNaturezaJuridica(e.target.value)}
                  placeholder="Ex: pessoa jurídica de direito privado, qualificada pelo Ministério da Justiça como Organização da Sociedade Civil de Interesse Público - OSCIP em âmbito Nacional"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Endereço Completo da Sede *
                </Label>
                <Input
                  value={enderecoCompleto}
                  onChange={(e) => setEnderecoCompleto(e.target.value)}
                  placeholder="Ex: Rua Trinta e Seis, 119, Lote 10 Quadra 05, Bairro Boa Esperança, Cuiabá/MT, CEP 78.068-417"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">Cidade da Sede</Label>
                <Input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Cuiabá"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">Estado (UF)</Label>
                <Input
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  placeholder="Ex: MT"
                  maxLength={2}
                  className="text-xs uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">Telefone de Contato</Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 0000-0000"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">E-mail Institucional</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@organizacao.org.br"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Termo de Parceria Padrão (Referência)
                </Label>
                <Input
                  value={termoParceriaPadrao}
                  onChange={(e) => setTermoParceriaPadrao(e.target.value)}
                  placeholder="Ex: Termo de Parceria nº 001/2026, firmado entre a CONTRATANTE e a Prefeitura..."
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bloco 2: Dados do Presidente / Representante Legal */}
        <Card className="border-[#E2E8F0] shadow-sm">
          <CardHeader className="border-b border-[#F1F5F9] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base text-[#1E293B]">
                  Dados do(a) Presidente / Representante Legal
                </CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Nome completo, CPF e cargo oficial que assina os contratos e termos da entidade.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Nome Completo do(a) Presidente / Representante *
                </Label>
                <Input
                  value={presidenteNome}
                  onChange={(e) => setPresidenteNome(e.target.value)}
                  placeholder="Ex: Iredir Maria Laccal da Silva Ferreira"
                  className="font-semibold text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Cargo / Qualificação Oficial *
                </Label>
                <Input
                  value={presidenteCargo}
                  onChange={(e) => setPresidenteCargo(e.target.value)}
                  placeholder="Ex: Presidente / Diretora Executiva"
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  CPF do(a) Presidente / Representante *
                </Label>
                <Input
                  value={presidenteCpf}
                  onChange={(e) => setPresidenteCpf(maskCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="font-mono text-xs sm:text-sm"
                  required
                />
              </div>
            </div>

            {/* Preview da Linha de Assinatura */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block mb-2">
                Prévia do Bloco de Assinatura nos Contratos:
              </span>
              <div className="border border-dashed border-slate-300 rounded-lg p-4 bg-white text-center max-w-sm mx-auto font-serif">
                <div className="border-t border-slate-800 pt-2 text-xs">
                  <p className="font-bold text-[#1E293B]">
                    {nomeOrganizacao || 'NOME DA ORGANIZAÇÃO'}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {presidenteNome || 'NOME DO PRESIDENTE'} ({presidenteCargo || 'Presidente'})
                  </p>
                  <p className="text-slate-500 text-[11px]">CNPJ: {cnpj || '00.000.000/0001-00'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={salvando}
            className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm h-10 px-6 shadow-sm shadow-[#1FAF7A]/25"
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando alterações...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações da Organização
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
