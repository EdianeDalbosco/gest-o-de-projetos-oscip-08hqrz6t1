import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  createSolicitacao,
  updateSolicitacao,
  getProjetos,
  getSecretarias,
  getUsers,
} from '@/services/api'
import type {
  SolicitacaoRecord,
  SolicitacaoTipo,
  SolicitacaoPrioridade,
  SolicitacaoStatus,
  ProjetoRecord,
  SecretariaRecord,
  UserRecord,
} from '@/types'
import { Loader2, AlertCircle, CheckCircle2, FileUp, FileText, X, Download } from 'lucide-react'

interface ModalSolicitacaoProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  solicitacaoToEdit?: SolicitacaoRecord | null
  defaultProjetoId?: string
}

export function ModalSolicitacao({
  open,
  onClose,
  onSuccess,
  solicitacaoToEdit,
  defaultProjetoId,
}: ModalSolicitacaoProps) {
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [projetos, setProjetos] = useState<ProjetoRecord[]>([])
  const [secretarias, setSecretarias] = useState<SecretariaRecord[]>([])
  const [usuarios, setUsuarios] = useState<UserRecord[]>([])

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<SolicitacaoTipo>('Solicitação')
  const [prioridade, setPrioridade] = useState<SolicitacaoPrioridade>('Média')
  const [status, setStatus] = useState<SolicitacaoStatus>('Aberta')
  const [solicitante, setSolicitante] = useState('')
  const [dataSolicitacao, setDataSolicitacao] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [prazo, setPrazo] = useState('')
  const [projetoId, setProjetoId] = useState<string>('none')
  const [secretariaId, setSecretariaId] = useState<string>('none')
  const [conclusao, setConclusao] = useState('')

  // Anexo
  const [arquivoAnexo, setArquivoAnexo] = useState<File | null>(null)
  const [anexoAtual, setAnexoAtual] = useState<string | null>(null)
  const [removerAnexo, setRemoverAnexo] = useState(false)

  useEffect(() => {
    if (open) {
      loadDependencies()
      const hoje = new Date().toISOString().split('T')[0]
      if (solicitacaoToEdit) {
        setTitulo(solicitacaoToEdit.titulo || '')
        setDescricao(solicitacaoToEdit.descricao || '')
        setTipo(solicitacaoToEdit.tipo || 'Solicitação')
        setPrioridade(solicitacaoToEdit.prioridade || 'Média')
        setStatus(solicitacaoToEdit.status || 'Aberta')
        setSolicitante(solicitacaoToEdit.solicitante || '')
        setDataSolicitacao(
          solicitacaoToEdit.data_solicitacao
            ? solicitacaoToEdit.data_solicitacao.split('T')[0]
            : solicitacaoToEdit.created
              ? solicitacaoToEdit.created.split(' ')[0]
              : hoje,
        )
        setResponsavel(solicitacaoToEdit.responsavel || '')
        setPrazo(solicitacaoToEdit.prazo ? solicitacaoToEdit.prazo.split('T')[0] : '')
        setProjetoId(solicitacaoToEdit.projeto || 'none')
        setSecretariaId(solicitacaoToEdit.secretaria || 'none')
        setConclusao(solicitacaoToEdit.conclusao || '')
        setAnexoAtual(solicitacaoToEdit.anexo || null)
      } else {
        setTitulo('')
        setDescricao('')
        setTipo('Solicitação')
        setPrioridade('Média')
        setStatus('Aberta')
        setSolicitante(user?.name || '')
        setDataSolicitacao(hoje)
        setResponsavel('')
        setPrazo('')
        setProjetoId(defaultProjetoId || 'none')
        setSecretariaId('none')
        setConclusao('')
        setAnexoAtual(null)
      }
      setArquivoAnexo(null)
      setRemoverAnexo(false)
    }
  }, [open, solicitacaoToEdit, defaultProjetoId, user])

  const loadDependencies = async () => {
    try {
      const [pList, sList, uList] = await Promise.all([
        getProjetos(),
        getSecretarias(),
        getUsers().catch(() => []),
      ])
      setProjetos(pList)
      setSecretarias(sList)
      setUsuarios(uList)
    } catch {
      // Ignora erro se não conseguir carregar listas no modal
    }
  }

  // Se o usuário selecionar um projeto, sincroniza a secretaria caso o projeto tenha uma associada
  const handleSelectProjeto = (val: string) => {
    setProjetoId(val)
    if (val !== 'none') {
      const sel = projetos.find((p) => p.id === val)
      if (sel?.secretaria_id) {
        setSecretariaId(sel.secretaria_id)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título para a solicitação.',
        variant: 'destructive',
      })
      return
    }

    if (status === 'Concluída' && !conclusao.trim()) {
      toast({
        title: 'Conclusão/Providência obrigatória',
        description: 'Ao marcar como Concluída, descreva a providência ou conclusão tomada.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Usamos FormData para suportar upload de arquivo de maneira idêntica aos outros módulos
      const formData = new FormData()
      formData.append('titulo', titulo.trim())
      formData.append('descricao', descricao.trim())
      formData.append('tipo', tipo)
      formData.append('prioridade', prioridade)
      formData.append('status', status)
      formData.append('solicitante', solicitante.trim())
      if (dataSolicitacao) {
        formData.append(
          'data_solicitacao',
          new Date(dataSolicitacao + 'T12:00:00.000Z').toISOString(),
        )
      }
      formData.append('responsavel', responsavel.trim())
      if (prazo) {
        formData.append('prazo', new Date(prazo + 'T12:00:00.000Z').toISOString())
      } else {
        formData.append('prazo', '')
      }
      formData.append('projeto', projetoId !== 'none' ? projetoId : '')
      formData.append('secretaria', secretariaId !== 'none' ? secretariaId : '')
      formData.append('conclusao', conclusao.trim())
      formData.append(
        'criado_por',
        solicitacaoToEdit?.criado_por || user?.name || user?.email || 'Administrador',
      )

      if (arquivoAnexo) {
        formData.append('anexo', arquivoAnexo)
      } else if (removerAnexo && solicitacaoToEdit) {
        formData.append('anexo', '')
      }

      if (solicitacaoToEdit) {
        await updateSolicitacao(solicitacaoToEdit.id, formData)
        toast({
          title: 'Solicitação atualizada',
          description: 'Os dados foram atualizados com sucesso.',
        })
      } else {
        await createSolicitacao(formData)
        toast({
          title: 'Solicitação criada',
          description: 'Novo item cadastrado com sucesso.',
        })
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      toast({
        title: 'Erro ao salvar',
        description: (err as Error)?.message || 'Não foi possível salvar o registro.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#1E293B] flex items-center gap-2">
            {solicitacaoToEdit ? 'Editar Solicitação / Pendência' : 'Nova Solicitação / Pendência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo" className="text-xs font-semibold text-[#1E293B]">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ex: Regularização de certidão para repasse municipal..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="text-sm border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
              required
            />
          </div>

          {/* Grid: Tipo, Prioridade, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Tipo</Label>
              <Select value={tipo} onValueChange={(val) => setTipo(val as SolicitacaoTipo)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solicitação">Solicitação</SelectItem>
                  <SelectItem value="Pendência">Pendência</SelectItem>
                  <SelectItem value="Pendência Financeira">Pendência Financeira</SelectItem>
                  <SelectItem value="Documentação">Documentação</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Prioridade</Label>
              <Select
                value={prioridade}
                onValueChange={(val) => setPrioridade(val as SolicitacaoPrioridade)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as SolicitacaoStatus)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Aguardando Terceiro">Aguardando Terceiro</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid: Solicitante e Data da Solicitação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="solicitante" className="text-xs font-semibold text-[#1E293B]">
                Solicitante
              </Label>
              <Input
                id="solicitante"
                list="lista-solicitantes"
                placeholder="Nome do solicitante (ex: Ediane Dalbosco, Sec. Saúde...)"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
                className="text-xs border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
              />
              <datalist id="lista-solicitantes">
                {user?.name && <option value={user.name} />}
                {usuarios.map((u) => (
                  <option key={u.id} value={u.name || u.email} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dataSolicitacao" className="text-xs font-semibold text-[#1E293B]">
                Data da Solicitação
              </Label>
              <Input
                id="dataSolicitacao"
                type="date"
                value={dataSolicitacao}
                onChange={(e) => setDataSolicitacao(e.target.value)}
                className="text-xs border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
              />
            </div>
          </div>

          {/* Grid: Responsável e Prazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="responsavel" className="text-xs font-semibold text-[#1E293B]">
                Responsável
              </Label>
              <Input
                id="responsavel"
                list="lista-responsaveis"
                placeholder="Ex: Dra. Camila ou Depto Financeiro"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                className="text-xs border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
              />
              <datalist id="lista-responsaveis">
                {usuarios.map((u) => (
                  <option key={u.id} value={u.name || u.email} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prazo" className="text-xs font-semibold text-[#1E293B]">
                Prazo Limite
              </Label>
              <Input
                id="prazo"
                type="date"
                value={prazo}
                onChange={(e) => setPrazo(e.target.value)}
                className="text-xs border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
              />
            </div>
          </div>

          {/* Grid: Vínculo Projeto e Secretaria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Projeto Vinculado</Label>
              <Select value={projetoId} onValueChange={handleSelectProjeto}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione um projeto (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (Institucional / Geral)</SelectItem>
                  {projetos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#1E293B]">Secretaria Envolvida</Label>
              <Select value={secretariaId} onValueChange={(val) => setSecretariaId(val)}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione a secretaria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {secretarias.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição Detalhada */}
          <div className="space-y-1.5">
            <Label htmlFor="descricao" className="text-xs font-semibold text-[#1E293B]">
              Detalhamento / Contexto
            </Label>
            <Textarea
              id="descricao"
              rows={3}
              placeholder="Descreva a solicitação ou o motivo da pendência, histórico e encaminhamentos..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="text-xs border-[#CBD5E1] focus-visible:ring-[#1FAF7A]"
            />
          </div>

          {/* Upload de Anexo (PDF, Imagem, Planilha, Documento) */}
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-[#CBD5E1] bg-slate-50/70">
            <Label className="text-xs font-semibold text-[#1E293B] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-[#1FAF7A]" />
                Anexo da Solicitação
              </span>
              <span className="text-[11px] font-normal text-[#64748B]">
                PDF, Imagens, Planilhas, DOCX (até 10MB)
              </span>
            </Label>

            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  if (f.size > 10 * 1024 * 1024) {
                    toast({
                      title: 'Arquivo muito grande',
                      description: 'O tamanho máximo permitido para o anexo é de 10MB.',
                      variant: 'destructive',
                    })
                    e.target.value = ''
                    return
                  }
                  setArquivoAnexo(f)
                  setRemoverAnexo(false)
                }
              }}
              className="text-xs h-9 bg-white cursor-pointer"
            />

            {arquivoAnexo ? (
              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2 rounded border border-emerald-200">
                <span className="truncate flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {arquivoAnexo.name} ({(arquivoAnexo.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => setArquivoAnexo(null)}
                  className="text-red-500 hover:text-red-700 p-0.5"
                  title="Remover anexo selecionado"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : anexoAtual && !removerAnexo ? (
              <div className="flex items-center justify-between text-xs bg-white text-[#334155] p-2 rounded border border-[#E2E8F0]">
                <a
                  href={`/api/files/solicitacoes/${solicitacaoToEdit?.id}/${anexoAtual}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate flex items-center gap-1.5 text-[#1FAF7A] hover:underline font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1FAF7A] shrink-0" />
                  <span className="truncate">{anexoAtual}</span>
                  <Download className="w-3 h-3 shrink-0 ml-1" />
                </a>
                <button
                  type="button"
                  onClick={() => setRemoverAnexo(true)}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-50"
                  title="Excluir anexo salvo"
                >
                  <X className="w-3 h-3" />
                  Remover
                </button>
              </div>
            ) : removerAnexo ? (
              <div className="flex items-center justify-between text-xs bg-rose-50 text-rose-700 p-2 rounded border border-rose-200">
                <span>O anexo atual será removido ao salvar.</span>
                <button
                  type="button"
                  onClick={() => setRemoverAnexo(false)}
                  className="text-xs text-[#1FAF7A] font-semibold hover:underline"
                >
                  Desfazer
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-[#94A3B8]">
                Nenhum arquivo anexado a esta solicitação no momento.
              </p>
            )}
          </div>

          {/* Campo de Conclusão / Providência (obrigatório se Concluída) */}
          {(status === 'Concluída' || solicitacaoToEdit?.conclusao) && (
            <div className="space-y-1.5 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Conclusão / Providência Adotada{' '}
                  {status === 'Concluída' && <span className="text-red-500">*</span>}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Descreva detalhadamente como a solicitação foi atendida ou qual providência foi
                registrada para arquivamento.
              </p>
              <Textarea
                id="conclusao"
                rows={3}
                placeholder="Ex: Documento homologado e anexado ao processo. Liberação confirmada pela prefeitura..."
                value={conclusao}
                onChange={(e) => setConclusao(e.target.value)}
                className="text-xs bg-white border-emerald-300 focus-visible:ring-emerald-500"
                required={status === 'Concluída'}
              />
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold shadow-sm shadow-[#1FAF7A]/25"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {solicitacaoToEdit ? 'Salvar Alterações' : 'Criar Registro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
