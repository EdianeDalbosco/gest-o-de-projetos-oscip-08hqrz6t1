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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPrestadorColaborador, updatePrestadorColaborador } from '@/services/api'
import type { PrestadorColaboradorRecord, PrestadorTipo } from '@/types'
import { maskCpf, maskCnpj } from '@/lib/masks'
import { Loader2 } from 'lucide-react'

interface ModalPrestadorProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  prestadorToEdit?: PrestadorColaboradorRecord | null
}

export function ModalPrestador({ open, onClose, onSuccess, prestadorToEdit }: ModalPrestadorProps) {
  const [tipo, setTipo] = useState<PrestadorTipo>('PJ')

  // PJ
  const [razaoSocial, setRazaoSocial] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [profissional, setProfissional] = useState('')
  const [cpfProfissional, setCpfProfissional] = useState('')
  const [naturezaJuridica, setNaturezaJuridica] = useState('Sociedade Limitada (LTDA)')
  const [endereco, setEndereco] = useState('')

  // CLT
  const [nomeColaborador, setNomeColaborador] = useState('')
  const [cpfColaborador, setCpfColaborador] = useState('')
  const [codigoConsisa, setCodigoConsisa] = useState('')
  const [cargo, setCargo] = useState('')
  const [setor, setSetor] = useState('')
  const [situacao, setSituacao] = useState('Ativo')
  const [remuneracaoBase, setRemuneracaoBase] = useState<number | string>('')
  const [observacoes, setObservacoes] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (prestadorToEdit) {
      setTipo(prestadorToEdit.tipo || 'PJ')
      setRazaoSocial(prestadorToEdit.razao_social || '')
      setCnpj(prestadorToEdit.cnpj || '')
      setProfissional(prestadorToEdit.profissional || '')
      setCpfProfissional(prestadorToEdit.cpf_profissional || '')
      setNaturezaJuridica(prestadorToEdit.natureza_juridica || 'Sociedade Limitada (LTDA)')
      setEndereco(prestadorToEdit.endereco || '')
      setNomeColaborador(prestadorToEdit.nome_colaborador || '')
      setCpfColaborador(prestadorToEdit.cpf_colaborador || '')
      setCodigoConsisa(prestadorToEdit.codigo_consisa || '')
      setCargo(prestadorToEdit.cargo || '')
      setSetor(prestadorToEdit.setor || '')
      setSituacao(prestadorToEdit.situacao || 'Ativo')
      setRemuneracaoBase(prestadorToEdit.remuneracao_base || '')
      setObservacoes(prestadorToEdit.observacoes || '')
    } else {
      setTipo('PJ')
      setRazaoSocial('')
      setCnpj('')
      setProfissional('')
      setCpfProfissional('')
      setNaturezaJuridica('Sociedade Limitada (LTDA)')
      setEndereco('')
      setNomeColaborador('')
      setCpfColaborador('')
      setCodigoConsisa('')
      setCargo('')
      setSetor('')
      setSituacao('Ativo')
      setRemuneracaoBase('')
      setObservacoes('')
    }
    setErrors({})
  }, [prestadorToEdit, open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (tipo === 'PJ') {
      if (!razaoSocial.trim()) errs.razaoSocial = 'Razão Social / Nome PJ é obrigatório.'
      if (!cnpj.trim()) errs.cnpj = 'CNPJ é obrigatório.'
      if (!cargo.trim()) errs.cargo = 'Atividade / Especialidade é obrigatória.'
    } else {
      if (!nomeColaborador.trim()) errs.nomeColaborador = 'Nome do colaborador é obrigatório.'
      if (!cpfColaborador.trim()) errs.cpfColaborador = 'CPF do colaborador é obrigatório.'
      if (!cargo.trim()) errs.cargo = 'Cargo é obrigatório.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload: Partial<PrestadorColaboradorRecord> = {
        tipo,
        cargo: cargo.trim(),
        observacoes: observacoes.trim() || undefined,
      }

      if (tipo === 'PJ') {
        payload.razao_social = razaoSocial.trim()
        payload.cnpj = cnpj.trim()
        payload.profissional = profissional.trim() || undefined
        payload.cpf_profissional = cpfProfissional.trim() || undefined
        payload.natureza_juridica = naturezaJuridica.trim() || undefined
        payload.endereco = endereco.trim() || undefined
        payload.remuneracao_base = remuneracaoBase ? Number(remuneracaoBase) : undefined
      } else {
        payload.nome_colaborador = nomeColaborador.trim()
        payload.cpf_colaborador = cpfColaborador.trim()
        payload.codigo_consisa = codigoConsisa.trim() || undefined
        payload.setor = setor.trim() || undefined
        payload.situacao = situacao.trim() || undefined
        payload.remuneracao_base = remuneracaoBase ? Number(remuneracaoBase) : undefined
      }

      if (prestadorToEdit) {
        await updatePrestadorColaborador(prestadorToEdit.id, payload)
      } else {
        await createPrestadorColaborador(payload)
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar cadastro.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B]">
            {prestadorToEdit
              ? `Editar ${tipo === 'PJ' ? 'Prestador PJ' : 'Colaborador CLT'}`
              : 'Novo Cadastro de Prestador / Colaborador'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#64748B]">
            Cadastro centralizado de prestadores de serviços PJ e colaboradores CLT para emissão de
            contratos e faturamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errors.general && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">
              {errors.general}
            </p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#1E293B]">Tipo de Cadastro</Label>
            <div className="flex items-center gap-3">
              <label
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  tipo === 'PJ'
                    ? 'bg-emerald-50 border-[#1FAF7A] text-[#1FAF7A]'
                    : 'border-slate-200 text-[#64748B] hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="PJ"
                  checked={tipo === 'PJ'}
                  onChange={() => setTipo('PJ')}
                  className="sr-only"
                />
                Pessoa Jurídica (PJ)
              </label>

              <label
                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                  tipo === 'CLT'
                    ? 'bg-emerald-50 border-[#1FAF7A] text-[#1FAF7A]'
                    : 'border-slate-200 text-[#64748B] hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value="CLT"
                  checked={tipo === 'CLT'}
                  onChange={() => setTipo('CLT')}
                  className="sr-only"
                />
                Colaborador (CLT)
              </label>
            </div>
          </div>

          {tipo === 'PJ' ? (
            /* FORMULÁRIO PJ */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="razaoSocial" className="text-xs font-semibold text-[#1E293B]">
                  Razão Social / Nome da Empresa (PJ) *
                </Label>
                <Input
                  id="razaoSocial"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: Clínica Médica São Lucas LTDA"
                  className={errors.razaoSocial ? 'border-red-500' : ''}
                />
                {errors.razaoSocial && <p className="text-xs text-red-500">{errors.razaoSocial}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cnpj" className="text-xs font-semibold text-[#1E293B]">
                    CNPJ *
                  </Label>
                  <Input
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={errors.cnpj ? 'border-red-500' : ''}
                  />
                  {errors.cnpj && <p className="text-xs text-red-500">{errors.cnpj}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="naturezaJuridica"
                    className="text-xs font-semibold text-[#1E293B]"
                  >
                    Natureza Jurídica
                  </Label>
                  <Input
                    id="naturezaJuridica"
                    value={naturezaJuridica}
                    onChange={(e) => setNaturezaJuridica(e.target.value)}
                    placeholder="Ex: Sociedade Limitada (LTDA)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="profissional" className="text-xs font-semibold text-[#1E293B]">
                    Representante Legal
                    <br />
                  </Label>
                  <Input
                    id="profissional"
                    value={profissional}
                    onChange={(e) => setProfissional(e.target.value)}
                    placeholder="Ex: Dr. Roberto Alencar"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cpfProfissional" className="text-xs font-semibold text-[#1E293B]">
                    CPF do Profissional
                  </Label>
                  <Input
                    id="cpfProfissional"
                    value={cpfProfissional}
                    onChange={(e) => setCpfProfissional(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cargoPJ" className="text-xs font-semibold text-[#1E293B]">
                    Profissional Designado
                    <br />
                  </Label>
                  <Input
                    id="cargoPJ"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Médico Clínico Geral, Enfermeiro"
                    className={errors.cargo ? 'border-red-500' : ''}
                  />
                  {errors.cargo && <p className="text-xs text-red-500">{errors.cargo}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="remuneracaoPJ" className="text-xs font-semibold text-[#1E293B]">
                    Remuneração Base de Referência (R$)
                  </Label>
                  <Input
                    id="remuneracaoPJ"
                    type="number"
                    step="0.01"
                    value={remuneracaoBase}
                    onChange={(e) => setRemuneracaoBase(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco" className="text-xs font-semibold text-[#1E293B]">
                  Endereço Empresarial
                </Label>
                <Input
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, Número, Bairro, Cidade/UF"
                />
              </div>
            </div>
          ) : (
            /* FORMULÁRIO CLT */
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nomeColaborador" className="text-xs font-semibold text-[#1E293B]">
                  Nome Completo do Colaborador *
                </Label>
                <Input
                  id="nomeColaborador"
                  value={nomeColaborador}
                  onChange={(e) => setNomeColaborador(e.target.value)}
                  placeholder="Ex: Aline de Oliveira"
                  className={errors.nomeColaborador ? 'border-red-500' : ''}
                />
                {errors.nomeColaborador && (
                  <p className="text-xs text-red-500">{errors.nomeColaborador}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cpfColaborador" className="text-xs font-semibold text-[#1E293B]">
                    CPF *
                  </Label>
                  <Input
                    id="cpfColaborador"
                    value={cpfColaborador}
                    onChange={(e) => setCpfColaborador(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={errors.cpfColaborador ? 'border-red-500' : ''}
                  />
                  {errors.cpfColaborador && (
                    <p className="text-xs text-red-500">{errors.cpfColaborador}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="codigoConsisa" className="text-xs font-semibold text-[#1E293B]">
                    Código Consisa / Matrícula
                  </Label>
                  <Input
                    id="codigoConsisa"
                    value={codigoConsisa}
                    onChange={(e) => setCodigoConsisa(e.target.value)}
                    placeholder="Ex: 391"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cargoCLT" className="text-xs font-semibold text-[#1E293B]">
                    Cargo / Função *
                  </Label>
                  <Input
                    id="cargoCLT"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Técnico de Enfermagem, Vigia Noturno"
                    className={errors.cargo ? 'border-red-500' : ''}
                  />
                  {errors.cargo && <p className="text-xs text-red-500">{errors.cargo}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="remuneracaoCLT" className="text-xs font-semibold text-[#1E293B]">
                    Remuneração Base (Salário Base)
                  </Label>
                  <Input
                    id="remuneracaoCLT"
                    type="number"
                    step="0.01"
                    value={remuneracaoBase}
                    onChange={(e) => setRemuneracaoBase(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="setor" className="text-xs font-semibold text-[#1E293B]">
                    Setor / Unidade
                  </Label>
                  <Input
                    id="setor"
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    placeholder="Ex: PSF Vila Esperança, Hospital Municipal"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="situacao" className="text-xs font-semibold text-[#1E293B]">
                    Situação Funcional
                  </Label>
                  <Select value={situacao} onValueChange={setSituacao}>
                    <SelectTrigger id="situacao">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Afastado">Afastado</SelectItem>
                      <SelectItem value="Desligado">Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="observacoes" className="text-xs font-semibold text-[#1E293B]">
              Observações Adicionais
            </Label>
            <Textarea
              id="observacoes"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Anotações internas sobre documentação, conselho de classe, dados bancários..."
            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {prestadorToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
