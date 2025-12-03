import { useState, useEffect } from 'react'
import { DollarSign, Settings, User, LogOut, MoreVertical, Car, Bell } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const CompanyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-light p-6 rounded-xl border border-dark-lighter max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-4">Informações da Empresa</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-metallic-light">Nome</p>
            <p className="text-white font-semibold">Estética Automotiva Premium</p>
          </div>
          <div>
            <p className="text-sm text-metallic-light">CNPJ</p>
            <p className="text-white font-mono">12.345.678/0001-90</p>
          </div>
          <div>
            <p className="text-sm text-metallic-light">Status</p>
            <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
              Ativo
            </span>
          </div>
          <div>
            <p className="text-sm text-metallic-light">Vencimento</p>
            <p className="text-white">15/12/2025</p>
          </div>
          <div>
            <p className="text-sm text-metallic-light">Valor</p>
            <p className="text-white text-lg font-bold">R$ 49,90/mês</p>
          </div>
        </div>
        <button className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-all">
          Renovar Plano
        </button>
      </div>
    </div>
  )
}



const SettingsDropdown = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="absolute right-0 mt-2 w-72 bg-dark-light border border-dark-lighter rounded-lg shadow-xl z-50">
      <div className="p-3">
        <div className="mb-3">
          <p className="text-xs font-semibold text-metallic uppercase tracking-wider mb-2">Operacional</p>
          <div className="space-y-1">
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Comprovantes
            </a>
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Operação
            </a>
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Caixa
            </a>
          </div>
        </div>
        <div className="border-t border-dark-lighter pt-3">
          <p className="text-xs font-semibold text-metallic uppercase tracking-wider mb-2">Financeiro</p>
          <div className="space-y-1">
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Nota Fiscal
            </a>
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Categorias
            </a>
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Centros de Custo
            </a>
            <a href="#" className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
              Contas
            </a>
            <Link
              to="/meios-pagamento"
              onClick={onClose}
              className="block px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all"
            >
              Meios de Pagamento
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfileDropdown = ({ isOpen, onClose }) => {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 mt-2 w-56 bg-dark-light border border-dark-lighter rounded-lg shadow-xl z-50">
      <div className="p-3 space-y-1">
        <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-metallic-light hover:text-white hover:bg-dark-lighter rounded transition-all">
          <User className="w-4 h-4" />
          Perfil
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-lighter rounded transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
        <div className="border-t border-dark-lighter pt-2 mt-2">
          <p className="px-3 py-1 text-xs text-metallic">Versão v1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export const Header = () => {
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    // Subscribe to new appointments
    const channel = supabase
      .channel('header-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Novo agendamento!', payload)
          setNotificationCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <>
      <header className="bg-dark-light border-b border-dark-lighter px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-white">Facilicar</h1>
              <p className="text-xs text-metallic-light">Sistema de Gestão</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Ícone de Notificações */}
            <button
              className="p-2 hover:bg-dark-lighter rounded-lg transition-all relative group"
              title="Notificações"
              onClick={() => setNotificationCount(0)}
            >
              <Bell className="w-6 h-6 text-metallic-light" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Ícone de Dinheiro */}
            <button
              onClick={() => setCompanyModalOpen(true)}
              className="p-2 hover:bg-dark-lighter rounded-lg transition-all relative group"
              title="Informações da Empresa"
            >
              <DollarSign className="w-6 h-6 text-green-400" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Empresa
              </span>
            </button>

            {/* Ícone de Engrenagem */}
            <div className="relative">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 hover:bg-dark-lighter rounded-lg transition-all relative group"
                title="Configurações"
              >
                <Settings className="w-6 h-6 text-metallic-light" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-dark text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Configurações
                </span>
              </button>
              <SettingsDropdown isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
            </div>

            {/* Ícone de Perfil */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 hover:bg-dark-lighter rounded-lg transition-all"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>
              <ProfileDropdown isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
            </div>
          </div>
        </div>
      </header>

      <CompanyModal isOpen={companyModalOpen} onClose={() => setCompanyModalOpen(false)} />
    </>
  )
}
