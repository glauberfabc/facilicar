import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from './AuthContext'

const PermissionsContext = createContext({})

export const usePermissions = () => {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider')
  }
  return context
}

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [establishment, setEstablishment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserProfile()
    } else {
      setProfile(null)
      setEstablishment(null)
      setLoading(false)
    }
  }, [user])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)

      // Buscar perfil do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (userError) {
        console.error('Erro ao buscar perfil:', userError)
        // Continuar mesmo com erro, usando dados básicos do auth
        setProfile({
          id: user.id,
          email: user.email,
          role: 'colaborador' // fallback
        })
        setLoading(false)
        return
      }

      if (!userData) {
        console.warn('Usuário não encontrado na tabela users')
        setProfile({
          id: user.id,
          email: user.email,
          role: 'colaborador'
        })
        setLoading(false)
        return
      }

      setProfile(userData)

      // Se o usuário tem um establishment_id, buscar os dados do estabelecimento
      if (userData?.establishment_id) {
        const { data: estData, error: estError } = await supabase
          .from('establishments')
          .select('*')
          .eq('id', userData.establishment_id)
          .single()

        if (estError && estError.code !== 'PGRST116') {
          throw estError
        }

        setEstablishment(estData)
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  // Verificar se é super admin
  const isSuperAdmin = () => {
    return profile?.is_super_admin === true || profile?.role === 'super_admin'
  }

  // Verificar se é admin (dono de empresa)
  const isAdmin = () => {
    return profile?.role === 'admin' || isSuperAdmin()
  }

  // Verificar se é colaborador
  const isColaborador = () => {
    return profile?.role === 'colaborador'
  }

  // Verificar se pode acessar uma empresa específica
  const canAccessEstablishment = (establishmentId) => {
    if (isSuperAdmin()) return true
    if (!profile?.establishment_id) return false
    return profile.establishment_id === establishmentId
  }

  // Verificar se pode gerenciar usuários
  const canManageUsers = () => {
    return isAdmin() || isSuperAdmin()
  }

  // Verificar se pode gerenciar estabelecimentos
  const canManageEstablishments = () => {
    return isSuperAdmin()
  }

  // Verificar se pode criar estabelecimentos
  const canCreateEstablishments = () => {
    return isSuperAdmin()
  }

  // Verificar se pode editar configurações da empresa
  const canEditEstablishmentSettings = () => {
    return isAdmin() || isSuperAdmin()
  }

  // Obter o nome da role em português
  const getRoleName = () => {
    if (isSuperAdmin()) return 'Super Administrador'
    if (isAdmin()) return 'Administrador'
    if (isColaborador()) return 'Colaborador'
    return 'Usuário'
  }

  const value = {
    profile,
    establishment,
    loading,
    isSuperAdmin,
    isAdmin,
    isColaborador,
    canAccessEstablishment,
    canManageUsers,
    canManageEstablishments,
    canCreateEstablishments,
    canEditEstablishmentSettings,
    getRoleName,
    refreshProfile: fetchUserProfile,
  }

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}
