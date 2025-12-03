import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Users as UsersIcon, Plus, Search, Edit, Trash2, Phone, Mail, Key, Shield } from 'lucide-react'

export default function Users() {
  const { profile, isAdmin, isSuperAdmin } = usePermissions()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [profile])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.telefone?.includes(searchTerm) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Debug
      console.log('🔍 DEBUG Users - Profile:', profile)
      console.log('🔍 DEBUG Users - isAdmin:', isAdmin)
      console.log('🔍 DEBUG Users - isSuperAdmin:', isSuperAdmin)

      let query = supabase.from('users').select('*')

      // Admin vê apenas colaboradores do seu estabelecimento
      if (isAdmin && !isSuperAdmin) {
        if (!profile?.establishment_id) {
          console.error('❌ Admin sem establishment_id!')
          alert('Erro: Você não está vinculado a nenhuma empresa.')
          return
        }
        query = query
          .eq('establishment_id', profile.establishment_id)
          .eq('role', 'colaborador')
      }
      // Super Admin vê todos (ou pode filtrar como quiser)
      else if (isSuperAdmin) {
        // Super admin vê todos os usuários
        query = query.neq('role', 'super_admin') // Não mostrar outros super admins
      }

      const { data, error } = await query.order('nome', { ascending: true })

      console.log('🔍 DEBUG Users - Usuários retornados:', data?.length || 0)
      console.log('🔍 DEBUG Users - Erro:', error)

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error)
        alert(`Erro ao buscar usuários: ${error.message}`)
        throw error
      }

      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('❌ Erro completo ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      const { error} = await supabase.from('users').delete().eq('id', id)
      if (error) throw error
      fetchUsers()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar usuário.')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-metallic-light">Carregando usuários...</div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <UsersIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Usuários</h1>
            <p className="text-metallic-light">Gerencie os usuários do sistema</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => window.location.href = '/novo-usuario'} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total de Usuários</p>
                <p className="text-2xl font-bold text-white">{users.length}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Colaboradores</p>
                <p className="text-2xl font-bold text-white">
                  {users.filter(u => u.role === 'colaborador').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Resultados da Busca</p>
                <p className="text-2xl font-bold text-white">{filteredUsers.length}</p>
              </div>
              <Search className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-metallic-light" />
            <input type="text" placeholder="Buscar por nome, email ou role..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">{searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{user.nome}</h3>
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary font-semibold uppercase">
                        {user.role || 'colaborador'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      {user.email && (
                        <div className="flex items-center gap-2 text-sm text-metallic-light">
                          <Mail className="w-4 h-4 text-primary" />
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.telefone && (
                        <div className="flex items-center gap-2 text-sm text-metallic-light">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{user.telefone}</span>
                        </div>
                      )}
                      {user.senha && (
                        <div className="flex items-center gap-2 text-sm text-metallic-light">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="font-mono">Senha: {user.senha}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="p-2 hover:bg-dark-lighter rounded-lg text-red-500 transition-colors"
                      onClick={() => handleDelete(user.id)}
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
