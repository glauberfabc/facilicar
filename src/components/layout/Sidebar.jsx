import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Users, Wrench, PlusCircle,
  FileText, Activity, AlertTriangle,
  Package, Truck, DollarSign, Receipt,
  CreditCard, UserCircle, Calendar, Bell,
  ChevronDown, ChevronRight
} from 'lucide-react'

const MenuSection = ({ title, icon: Icon, items, isOpen, toggle }) => {
  return (
    <div className="mb-2">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-metallic-light hover:text-white hover:bg-dark-lighter rounded-lg transition-all"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-semibold">{title}</span>
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

export const Sidebar = () => {
  const [openSections, setOpenSections] = useState({
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

  const menuStructure = [
    {
      id: 'negocio',
      title: 'Negócio',
      icon: Building2,
      items: [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Estabelecimento', href: '/estabelecimento' },
        { name: 'Usuários', href: '/usuarios' },
        { name: 'Tabela de Serviço', href: '/servicos' },
        { name: 'Gerenciar Categorias', href: '/categorias-veiculos' },
        { name: 'Novo Estabelecimento', href: '/novo-estabelecimento' },
      ]
    },
    {
      id: 'operacional',
      title: 'Operacional',
      icon: Activity,
      items: [
        { name: 'Histórico Operacional', href: '#/historico' },
        { name: 'Registro de Atividades', href: '#/atividades' },
        { name: 'Registro de Sessões', href: '#/sessoes' },
        { name: 'Dossiê de Avarias', href: '#/avarias' },
      ]
    },
    {
      id: 'produtos',
      title: 'Produtos',
      icon: Package,
      items: [
        { name: 'Lista de Produtos', href: '#/produtos' },
        { name: 'Fornecedores', href: '#/fornecedores' },
        { name: 'Cadastrar Produto', href: '#/novo-produto' },
      ]
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: DollarSign,
      items: [
        { name: 'Fluxo de Caixa', href: '#/fluxo-caixa' },
        { name: 'Transações', href: '#/transacoes' },
        { name: 'Notas Fiscais', href: '#/notas-fiscais' },
        { name: 'Folha de Pagamento', href: '#/folha-pagamento' },
        { name: 'Comissionamento', href: '#/comissionamento' },
        { name: 'Categorias', href: '#/categorias' },
        { name: 'Centros de Custo', href: '#/centros-custo' },
        { name: 'Contas', href: '#/contas' },
        { name: 'Meios de Pagamento', href: '#/meios-pagamento' },
      ]
    },
    {
      id: 'clientes',
      title: 'Clientes',
      icon: UserCircle,
      items: [
        { name: 'Lista de Clientes', href: '/clientes' },
        { name: 'Lembretes', href: '/lembretes' },
        { name: 'Agendamentos', href: '/agendamentos' },
        { name: 'Novo Cliente', href: '/novo-cliente' },
      ]
    },
  ]

  return (
    <aside className="w-64 bg-dark-light h-screen border-r border-dark-lighter overflow-y-auto">
      <div className="p-4">
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
          />
        ))}
      </div>
    </aside>
  )
}
