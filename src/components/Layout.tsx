import React, { useState } from 'react'
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  FolderKanban,
  Landmark,
  Receipt,
  PieChart,
  Users2,
  CalendarCheck2,
  FileSignature,
  Menu,
  X,
  LogOut,
  Plus,
  Sprout,
  ChevronDown,
  Building2,
  Check,
  Shield,
  Settings,
  UserCog,
  CheckSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  minRole?: 'admin' | 'gestor' | 'operador' | 'leitura'
}

interface NavSection {
  title: string
  minRole?: 'admin' | 'gestor' | 'operador' | 'leitura'
  items: NavItem[]
}

const rawNavSections: NavSection[] = [
  {
    title: 'Visão Geral',
    minRole: 'leitura',
    items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Projetos',
    minRole: 'leitura',
    items: [
      { label: 'Instrumentos', path: '/convenios', icon: Landmark },
      { label: 'Lista de Projetos', path: '/projetos', icon: FolderKanban },
      { label: 'Solicitações & Pendências', path: '/solicitacoes', icon: CheckSquare },
    ],
  },
  {
    title: 'Contratos & Equipe',
    minRole: 'operador',
    items: [
      { label: 'Prestadores & Colaboradores', path: '/prestadores', icon: Users2 },
      { label: 'Contratos CLT/PJ', path: '/contratos', icon: FileSignature },
      { label: 'Atividades Prestadores', path: '/atividades', icon: CalendarCheck2 },
      {
        label: 'Elaborar Contrato',
        path: '/contratos/novo/elaborar',
        icon: FileSignature,
        minRole: 'gestor',
      },
    ],
  },
  {
    title: 'Financeiro',
    minRole: 'operador',
    items: [
      { label: 'Faturamento', path: '/faturamento', icon: Receipt },
      { label: 'Gestão Financeira', path: '/financeiro', icon: PieChart, minRole: 'gestor' },
    ],
  },
  {
    title: 'Configurações',
    minRole: 'gestor',
    items: [
      {
        label: 'Dados da Organização',
        path: '/configuracao-organizacao',
        icon: Building2,
        minRole: 'gestor',
      },
      {
        label: 'Usuários & Acessos',
        path: '/usuarios',
        icon: UserCog,
        minRole: 'admin',
      },
    ],
  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userRole = user?.role || 'admin'

  // Hierarquia de perfil para verificação de permissão: admin > gestor > operador > leitura
  const roleWeights: Record<string, number> = {
    admin: 4,
    gestor: 3,
    operador: 2,
    leitura: 1,
  }

  const hasAccess = (requiredRole?: string) => {
    if (!requiredRole) return true
    const currentWeight = roleWeights[userRole] || 1
    const requiredWeight = roleWeights[requiredRole] || 1
    return currentWeight >= requiredWeight
  }

  // Seções filtradas pelo perfil do usuário
  const navSections = rawNavSections
    .filter((sec) => hasAccess(sec.minRole))
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => hasAccess(item.minRole)),
    }))
    .filter((sec) => sec.items.length > 0)

  // Current page title lookup
  const getPageTitle = () => {
    const path = location.pathname
    if (path === '/') return 'Dashboard'
    if (path.startsWith('/projetos/novo')) return 'Novo Projeto'
    if (path.startsWith('/projetos/') && path !== '/projetos') return 'Detalhes do Projeto'
    if (path === '/projetos') return 'Projetos'
    if (path === '/solicitacoes') return 'Solicitações & Pendências'
    if (path.startsWith('/convenios/') && path !== '/convenios') return 'Detalhes do Instrumento'
    if (path === '/convenios') return 'Instrumentos Municipais'
    if (path === '/faturamento') return 'Faturamento & Faturas'
    if (path === '/financeiro') return 'Gestão Financeira Mensal'
    if (path === '/prestadores') return 'Prestadores & Colaboradores'
    if (path === '/contratos/novo/elaborar') return 'Elaboração de Contrato'
    if (path.startsWith('/contratos/') && path !== '/contratos') return 'Detalhes do Contrato'
    if (path === '/contratos') return 'Gestão de Contratos'
    if (path === '/atividades') return 'Atividades dos Prestadores'
    if (path === '/configuracao-organizacao') return 'Dados da Organização'
    if (path === '/usuarios') return 'Gestão de Usuários'
    return 'OSCIP Gestão'
  }

  const isProjetosPage = location.pathname === '/projetos'
  const isConveniosPage = location.pathname === '/convenios'

  const userInitials = (user?.name || user?.email || 'AD')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex bg-[#F7F8FA] text-[#1E293B]">
      {/* Desktop Sidebar (260px) / Tablet (80px) */}
      <aside className="hidden md:flex flex-col border-r border-[#E2E8F0] bg-white w-20 lg:w-[260px] shrink-0 sticky top-0 h-screen transition-all duration-200 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start px-4 lg:px-6 border-b border-[#E2E8F0] gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1FAF7A] to-[#2ED3A0] flex items-center justify-center text-white shadow-sm shadow-[#1FAF7A]/30 shrink-0">
            <Sprout className="w-5 h-5" />
          </div>
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="font-bold text-base text-[#1E293B] tracking-tight">
              OSCIP&nbsp;<span className="text-[#1FAF7A]">Gestão</span>
            </span>
            <span className="text-[11px] text-[#64748B]">Impacto & Controle</span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto py-4 px-2 lg:px-3 space-y-6">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <span className="hidden lg:block px-3 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                {sec.title}
              </span>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group',
                        isActive
                          ? 'bg-[#1FAF7A]/10 text-[#1FAF7A] font-semibold'
                          : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]',
                      )}
                      title={item.label}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5 shrink-0 transition-colors',
                          isActive ? 'text-[#1FAF7A]' : 'text-[#64748B] group-hover:text-[#1E293B]',
                        )}
                      />
                      <span className="hidden lg:inline-block truncate">{item.label}</span>
                      {isActive && (
                        <span className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-[#1FAF7A]" />
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Profile */}
        <div className="p-3 border-t border-[#E2E8F0]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-center lg:justify-between p-2 rounded-xl hover:bg-slate-100 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 border border-emerald-200 bg-[#E8F8F1] text-[#1FAF7A] font-semibold text-xs shrink-0">
                    <AvatarFallback className="bg-[#E8F8F1] text-[#1FAF7A]">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-[#1E293B] truncate">
                      {user?.name || 'Administrador'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#1FAF7A] truncate">
                        {user?.role === 'admin'
                          ? 'Administrador'
                          : user?.role === 'gestor'
                            ? 'Gestor'
                            : user?.role === 'operador'
                              ? 'Operador'
                              : user?.role === 'leitura'
                                ? 'Somente Leitura'
                                : 'Administrador'}
                      </span>
                      {user?.equipe && (
                        <span className="text-[10px] text-[#94A3B8] truncate">• {user.equipe}</span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronDown className="hidden lg:block w-4 h-4 text-[#94A3B8] shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {user?.name || 'Administrador'}
                  </p>
                  <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {user?.role === 'admin'
                        ? 'Administrador'
                        : user?.role === 'gestor'
                          ? 'Gestor'
                          : user?.role === 'operador'
                            ? 'Operador'
                            : 'Somente Leitura'}
                    </span>
                    {user?.equipe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {user.equipe}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer text-xs">
                  <Link to="/configuracao-organizacao">
                    <Building2 className="w-3.5 h-3.5 mr-2 text-slate-600" />
                    <span>Dados da Organização</span>
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild className="cursor-pointer text-xs">
                    <Link to="/usuarios">
                      <UserCog className="w-3.5 h-3.5 mr-2 text-slate-600" />
                      <span>Gestão de Usuários</span>
                    </Link>
                  </DropdownMenuItem>
                )}{' '}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 cursor-pointer"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Sair da conta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Drawer (0-768px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[280px] bg-white h-full flex flex-col z-10 shadow-2xl animate-fade-in">
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1FAF7A] to-[#2ED3A0] flex items-center justify-center text-white">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="font-bold text-base text-[#1E293B]">
                  ONG <span className="text-[#1FAF7A]">Gestão</span>
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-[#64748B] hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    {sec.title}
                  </span>
                  <div className="space-y-0.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon
                      const isActive =
                        item.path === '/'
                          ? location.pathname === '/'
                          : location.pathname.startsWith(item.path)

                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-[#1FAF7A]/10 text-[#1FAF7A] font-semibold'
                              : 'text-[#64748B] hover:bg-slate-50 hover:text-[#1E293B]',
                          )}
                        >
                          <Icon className={cn('w-5 h-5', isActive && 'text-[#1FAF7A]')} />
                          <span>{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-9 h-9 border border-emerald-200 bg-[#E8F8F1] text-[#1FAF7A] text-xs font-semibold">
                    <AvatarFallback className="bg-[#E8F8F1] text-[#1FAF7A]">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col max-w-[130px]">
                    <span className="text-xs font-semibold text-[#1E293B] truncate">
                      {user?.name || 'Administrador'}
                    </span>
                    <span className="text-[11px] text-[#1FAF7A] font-medium truncate">
                      {user?.role === 'admin'
                        ? 'Administrador'
                        : user?.role === 'gestor'
                          ? 'Gestor'
                          : user?.role === 'operador'
                            ? 'Operador'
                            : 'Somente Leitura'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar (64px) */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-[#64748B] hover:bg-slate-100 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#1E293B] tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isProjetosPage && (
              <Button
                id="btn-novo-projeto-topbar"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-modal-novo-projeto'))
                }}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm h-9 px-3 sm:px-4 shadow-sm shadow-[#1FAF7A]/25"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Novo Projeto
              </Button>
            )}

            {isConveniosPage && (
              <Button
                id="btn-novo-convenio-topbar"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-modal-novo-convenio'))
                }}
                className="bg-[#1FAF7A] hover:bg-[#179C6E] text-white font-semibold text-xs sm:text-sm h-9 px-3 sm:px-4 shadow-sm shadow-[#1FAF7A]/25"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Novo Instrumento
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 text-[#1FAF7A] text-xs font-medium border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-[#1FAF7A] animate-pulse" />
              <span>Conexão ativa</span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="h-12 border-t border-[#E2E8F0] bg-white px-4 sm:px-6 flex items-center justify-between text-xs text-[#94A3B8]">
          <span>© 2024 ONG Gestão — Todos os direitos reservados</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[#64748B]">
              <Building2 className="w-3.5 h-3.5 text-[#1FAF7A]" />
              Institucional
            </span>
            <span>v0.0.43</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
