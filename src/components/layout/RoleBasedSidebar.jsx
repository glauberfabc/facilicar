import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '../../contexts/PermissionsContext'
import {
  Building2, Users, Activity, Package, DollarSign, UserCircle,
  ChevronDown, ChevronRight, Crown, Shield, Wrench
} from 'lucide-react'

const MenuSection = ({ title, icon: Icon, items, isOpen, toggle, badge }) => {
  return (
    <div className="mb-2">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-metallic-light hover:text-white hover:bg-dark-lighter rounded-lg transition-all"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-semibold">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {items.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="block px-4 py-2 text-sm text-metallic hover:text-white hover:bg-dark-lighter rounded-lg transition-all"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export const RoleBasedSidebar = () => {
  const { isSuperAdmin, isAdmin, getRoleName } = usePermissions()
  const [openSections, setOpenSections] = useState({
    superadmin: true,
    negocio: true,
    operacional: false,
    produtos: false,
    financeiro: false,
    clientes: false,
  })

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Menu apenas para Super Admin
  const superAdminMenu = isSuperAdmin() ? [
    {
      id: 'superadmin',
      title: 'Super Admin',
      icon: Crown,
      badge: 'SUPER',
      items: [
        { name: 'Gestão de Empresas', href: '/super-admin' },
        { name: 'Dashboard', href: '/dashboard' },
      ]
    }
  ] : []

  // Menu padrão para Admin e Colaboradores
  const standardMenu = [
    {
      id: 'negocio',
      title: 'Negócio',
      icon: Building2,
      items: isSuperAdmin() ? [
        { name: 'Dashboard', href: '/dashboard' },
      ] : isAdmin() ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Empresa', href: '/empresa' },
        { name: 'Usuários', href: '/usuarios' },
        { name: 'Gerenciar Categorias', href: '/categorias-veiculos' },
        { name: 'Tabela de Serviço', href: '/servicos' },
      ] : [
        { name: 'Dashboard', href: '/dashboard' },
      ]
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: UserCircle,
      items: [
        { name: 'Lista de Clientes', href: '/clientes' },
        { name: 'Novo Cliente', href: '/novo-cliente' },
        { name: 'Lembretes', href: '/lembretes' },
        { name: 'Agendamentos', href: '/agendamentos' },
      ]
    },
    {
      id: 'operacional',
      title: 'Operacional',
      icon: Activity,
      items: [
        { name: 'Operacional', href: '/operacional' },
        { name: 'Histórico Operacional', href: '/historico-operacional' },
        { name: 'Registro de Atividades', href: '/atividades' },
        { name: 'Registro de Sessões', href: '/sessoes' },
        { name: 'Dossiê de Avarias', href: '/avarias' },
      ]
    },
    {
      id: 'produtos',
      title: 'Produtos',
      icon: Package,
      items: [
        { name: 'Lista de Produtos', href: '/produtos' },
        { name: 'Fornecedores', href: '/fornecedores' },
        { name: 'Cadastrar Produto', href: '/novo-produto' },
      ]
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      items: [
        { name: 'Fluxo de Caixa', href: '/fluxo-caixa' },
        { name: 'Transações', href: '/transacoes' },
        { name: 'Notas Fiscais', href: '/notas-fiscais' },
        { name: 'Folha de Pagamento', href: '/folha-pagamento' },
        { name: 'Comissionamento', href: '/comissionamento' },
        { name: 'Meios de Pagamento', href: '/meios-pagamento' },
      ]
    },
  ]

  const menuStructure = [...superAdminMenu, ...standardMenu]

  return (
    <aside className="w-64 bg-dark-light h-screen border-r border-dark-lighter overflow-y-auto">
      <div className="p-4">
        <div className="mb-4 p-3 bg-dark-lighter rounded-lg border border-dark-lighter">
          <div className="flex items-center gap-2 mb-1">
            {isSuperAdmin() ? (
              <Crown className="w-4 h-4 text-purple-400" />
            ) : isAdmin() ? (
              <Shield className="w-4 h-4 text-primary" />
            ) : (
              <Wrench className="w-4 h-4 text-metallic-light" />
            )}
            <span className="text-xs font-semibold text-white">{getRoleName()}</span>
          </div>
          <p className="text-xs text-metallic-light">Facilicar Sistema</p>
        </div>

        <h2 className="text-xs font-semibold text-metallic uppercase tracking-wider mb-4">
          Menu Principal
        </h2>

        {menuStructure.map((section) => (
          <MenuSection
            key={section.id}
            title={section.title}
            icon={section.icon}
            items={section.items}
            isOpen={openSections[section.id]}
            toggle={() => toggleSection(section.id)}
            badge={section.badge}
          />
        ))}
      </div>
    </aside>
  )
}
