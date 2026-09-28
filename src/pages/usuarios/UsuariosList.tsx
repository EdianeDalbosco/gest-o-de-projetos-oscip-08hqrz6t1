import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Briefcase,
  Layers,
  Lock,
  Eye,
  KeyRound,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { getUsers, createUser, updateUser, deleteUser, type CreateUserData } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import type { UserRecord, UserRole, UserEquipe } from '@/types'

export const ROLES_CONFIG: Record<
  UserRole,
  {
    label: string
    badgeClass: string
    descricao: string
    permissoes: string
  }
> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    descricao: 'Acesso total a todas as seções, configurações, usuários e exportações do sistema.',
    permissoes: 'Acesso irrestrito (Todas as seções + Usuários + Configurações)',
  },
  gestor: {
    label: 'Gestor',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    descricao: 'Gestão completa de convênios, projetos, contratos, equipe e módulos financeiros.',
    permissoes: 'Instrumentos, Projetos, Contratos, Faturamento e Gestão Financeira',
  },
  operador: {
    label: 'Operador',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    descricao: 'Operação de projetos, registro de atividades e acompanhamento de faturamento.',
    permissoes: 'Visualização de Instrumentos, Projetos, Atividades e Faturamento',
  },
  leitura: {
    label: 'Somente Leitura',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    descricao: 'Visualização e acompanhamento de relatórios sem permissão de cadastro ou edição.',
    permissoes: 'Apenas visualização do Dashboard e relatórios de projetos',
  },
}

export const EQUIPES_DISPONIVEIS: { nome: UserEquipe; cor: string }[] = [
  { nome: 'Administração', cor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { nome: 'Saúde', cor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { nome: 'Educação', cor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { nome: 'Financeiro', cor: 'bg-amber-100 text-amber-800 border-amber-200' },
  { nome: 'Projetos', cor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { nome: 'Jurídico', cor: 'bg-rose-100 text-rose-800 border-rose-200' },
]

export default function UsuariosList() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('todos')
  const [filterEquipe, setFilterEquipe] = useState<string>('todas')

  // Modais
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formPasswordConfirm, setFormPasswordConfirm] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('operador')
  const [formEquipe, setFormEquipe] = useState<UserEquipe>('Administração')
  const [formCargo, setFormCargo] = useState('')
  const [formAtivo, setFormAtivo] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    setLoading(true)
    try {
      const list = await getUsers()
      setUsers(list)
    } catch (err: unknown) {
      console.error('Erro ao buscar usuários:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível carregar a listagem de usuários do sistema.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormName('')
    setFormEmail('')
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormRole('operador')
    setFormEquipe('Administração')
    setFormCargo('')
    setFormAtivo(true)
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user)
    setFormName(user.name || '')
    setFormEmail(user.email || '')
    setFormPassword('')
    setFormPasswordConfirm('')
    setFormRole(user.role || 'operador')
    setFormEquipe(user.equipe || 'Administração')
    setFormCargo(user.cargo || '')
    setFormAtivo(user.ativo !== false)
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenDelete = (user: UserRecord) => {
    setDeletingUser(user)
    setModalDeleteOpen(true)
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim() || !formEmail.trim()) {
      setFormError('Nome e E-mail são obrigatórios.')
      return
    }

    if (!editingUser) {
      if (!formPassword) {
        setFormError('A senha é obrigatória para novos usuários.')
        return
      }
      if (formPassword.length < 8) {
        setFormError('A senha deve ter no mínimo 8 caracteres.')
        return
      }
      if (formPassword !== formPasswordConfirm) {
        setFormError('A confirmação de senha não coincide com a senha informada.')
        return
      }
    }

    setSubmitting(true)
    try {
      if (editingUser) {
        // Atualização de usuário existente
        const payload: Partial<UserRecord> = {
          name: formName.trim(),
          role: formRole,
          equipe: formEquipe,
          cargo: formCargo.trim(),
          ativo: formAtivo,
        }
        await updateUser(editingUser.id, payload)
        toast({
          title: 'Usuário atualizado',
          description: `Os dados e permissões de ${formName} foram salvos com sucesso.`,
        })
      } else {
        // Criação de novo usuário
        const payload: CreateUserData = {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          passwordConfirm: formPasswordConfirm,
          role: formRole,
          equipe: formEquipe,
          cargo: formCargo.trim(),
          ativo: formAtivo,
        }
        await createUser(payload)
        toast({
          title: 'Usuário cadastrado com sucesso',
          description: `Novo acesso liberado para ${formName} (${ROLES_CONFIG[formRole].label} - ${formEquipe}).`,
        })
      }

      setModalOpen(false)
      await carregarUsuarios()
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Falha ao salvar usuário no sistema.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return
    if (deletingUser.id === currentUser?.id) {
      toast({
        variant: 'destructive',
        title: 'Operação recusada',
        description: 'Você não pode excluir a sua própria conta de usuário ativa.',
      })
      setModalDeleteOpen(false)
      return
    }

    setSubmitting(true)
    try {
      await deleteUser(deletingUser.id)
      toast({
        title: 'Usuário removido',
        description: `O usuário ${deletingUser.name || deletingUser.email} foi removido do sistema.`,
      })
      setModalDeleteOpen(false)
      setDeletingUser(null)
      await carregarUsuarios()
    } catch (err: unknown) {
      console.error(err)
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir usuário',
        description: err instanceof Error ? err.message : 'Falha ao excluir usuário.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Filtros combinados
  const usuariosFiltrados = users.filter((u) => {
    const nome = (u.name || '').toLowerCase()
    const email = (u.email || '').toLowerCase()
    const cargo = (u.cargo || '').toLowerCase()
    const query = searchTerm.toLowerCase()

    const matchSearch = nome.includes(query) || email.includes(query) || cargo.includes(query)
    const matchRole = filterRole === 'todos' || (u.role || 'operador') === filterRole
    const matchEquipe = filterEquipe === 'todas' || (u.equipe || 'Administração') === filterEquipe

    return matchSearch && matchRole && matchEquipe
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Controle de Acesso
            </span>
            <span className="text-xs text-[#64748B]">•</span>
            <span className="text-xs text-[#64748B]">Equipes & Perfis</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B] tracking-tight mt-1">
            Gestão de Usuários e Liberações de Acesso
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Cadastre novos usuários, vincule à sua respectiva equipe departamental e configure o
            perfil de visibilidade do sistema.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm h-9 px-4 shadow-sm shadow-[#1FAF7A]/25"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Cards de Resumo por Perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['admin', 'gestor', 'operador', 'leitura'] as UserRole[]).map((r) => {
          const cfg = ROLES_CONFIG[r]
          const count = users.filter((u) => (u.role || 'operador') === r).length
          return (
            <Card key={r} className="border-[#E2E8F0] shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    {cfg.label}
                  </span>
                  <p className="text-2xl font-extrabold text-[#1E293B]">{count}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate max-w-[170px]">
                    {count === 1 ? '1 usuário ativo' : `${count} usuários ativos`}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${cfg.badgeClass}`}
                >
                  <Shield className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo..."
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="text-xs h-9 w-[150px] bg-white">
              <SelectValue placeholder="Todos os Perfis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Perfis</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="gestor">Gestor</SelectItem>
              <SelectItem value="operador">Operador</SelectItem>
              <SelectItem value="leitura">Somente Leitura</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterEquipe} onValueChange={setFilterEquipe}>
            <SelectTrigger className="text-xs h-9 w-[160px] bg-white">
              <SelectValue placeholder="Todas as Equipes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Equipes</SelectItem>
              {EQUIPES_DISPONIVEIS.map((eq) => (
                <SelectItem key={eq.nome} value={eq.nome}>
                  {eq.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Listagem em Tabela */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#1FAF7A] animate-spin" />
            <span className="text-xs text-[#64748B]">Carregando usuários do sistema...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1E293B]">Nenhum usuário encontrado</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Não foram encontrados usuários com os critérios de busca e filtros selecionados.
            </p>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Cadastrar Novo Usuário
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Equipe</th>
                  <th className="py-3 px-4">Perfil de Acesso</th>
                  <th className="py-3 px-4">Cargo / Função</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {usuariosFiltrados.map((u) => {
                  const initials = (u.name || u.email || 'US')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()

                  const roleInfo = ROLES_CONFIG[u.role || 'operador']
                  const equipeInfo =
                    EQUIPES_DISPONIVEIS.find((e) => e.nome === u.equipe) || EQUIPES_DISPONIVEIS[0]

                  const isCurrent = u.id === currentUser?.id

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-emerald-200 bg-[#E8F8F1] text-[#1FAF7A] font-semibold text-xs shrink-0">
                            <AvatarFallback className="bg-[#E8F8F1] text-[#1FAF7A]">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#1E293B] truncate">
                                {u.name || 'Sem nome informado'}
                              </span>
                              {isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 bg-emerald-50 text-[#1FAF7A] border-emerald-200"
                                >
                                  Você
                                </Badge>
                              )}
                            </div>
                            <span className="text-[#64748B] text-[11px] truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold border ${equipeInfo.cor}`}
                        >
                          <Layers className="w-3 h-3 mr-1" />
                          {u.equipe || 'Administração'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[11px] font-semibold border ${roleInfo.badgeClass}`}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {roleInfo.label}
                        </Badge>
                        <p className="text-[10px] text-[#94A3B8] mt-0.5 truncate max-w-[200px]">
                          {roleInfo.permissoes}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-[#1E293B] font-medium">{u.cargo || '—'}</td>

                      <td className="py-3.5 px-4">
                        {u.ativo !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-300">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-[#64748B]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(u)}
                              className="cursor-pointer text-xs"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-600" />
                              Editar Permissões
                            </DropdownMenuItem>
                            {!isCurrent && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleOpenDelete(u)}
                                  className="cursor-pointer text-xs text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Excluir Usuário
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CRIAR / EDITAR USUÁRIO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base text-[#1E293B] flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#1FAF7A]" />
              {editingUser ? 'Editar Usuário e Permissões' : 'Cadastrar Novo Usuário'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              {editingUser
                ? 'Atualize o perfil de acesso, equipe departamental e status da conta.'
                : 'Defina nome, e-mail institucional, equipe de lotação e perfil de acesso do colaborador.'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">Nome Completo *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: João Silva de Oliveira"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  E-mail Institucional *
                </Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="joao.silva@saobento.org.br"
                  className="text-xs"
                  disabled={Boolean(editingUser)}
                  required
                />
                {editingUser && (
                  <p className="text-[11px] text-slate-500">
                    O e-mail de acesso não pode ser alterado por este modal.
                  </p>
                )}
              </div>

              {!editingUser && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Senha de Acesso *
                    </Label>
                    <Input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#1E293B]">
                      Confirmar Senha *
                    </Label>
                    <Input
                      type="password"
                      value={formPasswordConfirm}
                      onChange={(e) => setFormPasswordConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      className="text-xs"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">
                  Equipe Departamental *
                </Label>
                <Select
                  value={formEquipe}
                  onValueChange={(val) => setFormEquipe(val as UserEquipe)}
                >
                  <SelectTrigger className="text-xs h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPES_DISPONIVEIS.map((eq) => (
                      <SelectItem key={eq.nome} value={eq.nome}>
                        {eq.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#1E293B]">Cargo / Função</Label>
                <Input
                  value={formCargo}
                  onChange={(e) => setFormCargo(e.target.value)}
                  placeholder="Ex: Coordenador de Saúde"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-[#1E293B]">Perfil de Acesso *</Label>
                <Select value={formRole} onValueChange={(val) => setFormRole(val as UserRole)}>
                  <SelectTrigger className="text-xs h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador (Acesso Irrestrito)</SelectItem>
                    <SelectItem value="gestor">
                      Gestor (Contratos, Instrumentos e Financeiro)
                    </SelectItem>
                    <SelectItem value="operador">Operador (Projetos e Atividades)</SelectItem>
                    <SelectItem value="leitura">Somente Leitura (Visualização)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLES_CONFIG[formRole].descricao}
                </p>
              </div>

              {editingUser && (
                <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
                  <Label className="text-xs font-semibold text-[#1E293B] block">
                    Status da Conta
                  </Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="formAtivo"
                        checked={formAtivo}
                        onChange={() => setFormAtivo(true)}
                        className="text-[#1FAF7A]"
                      />
                      <span>Ativo (Permitir Login)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="radio"
                        name="formAtivo"
                        checked={!formAtivo}
                        onChange={() => setFormAtivo(false)}
                        className="text-red-600"
                      />
                      <span>Inativo (Bloquear Acesso)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white text-xs font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Usuário'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      <Dialog open={modalDeleteOpen} onOpenChange={setModalDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Confirmar Exclusão de Usuário
            </DialogTitle>
            <DialogDescription className="text-xs text-[#64748B]">
              Tem certeza que deseja remover o usuário{' '}
              <strong className="text-[#1E293B]">
                {deletingUser?.name || deletingUser?.email}
              </strong>{' '}
              do sistema? Esta ação removerá as permissões de acesso associadas.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalDeleteOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              {submitting ? 'Excluindo...' : 'Sim, Excluir Usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
