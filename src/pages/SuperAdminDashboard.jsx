import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Building2, Users, Plus, Edit, Trash2, CheckCircle, XCircle, Mail, Phone } from 'lucide-react'
import { usePermissions } from '../contexts/PermissionsContext'
import { Navigate } from 'react-router-dom'

export default function SuperAdminDashboard() {
  const { isSuperAdmin, loading: permLoading } = usePermissions()
  const [establishments, setEstablishments] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    status_pagamento: 'ativo',
    vencimento: '',
    valor: '',
    ativo: true,
    // Dados do Admin (dono)
    admin_nome: '',
    admin_email: '',
    admin_senha: '',
    admin_telefone: '',
    max_colaboradores: 5
  })

  useEffect(() => {
    if (!permLoading && isSuperAdmin()) {
      fetchEstablishments()
    }
  }, [permLoading])

  const fetchEstablishments = async () => {
    try {
      setLoading(true)
      const { data, error} = await supabase
        .from('establishments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar estabelecimentos:', error)
        throw error
      }

      setEstablishments(data || [])

      // Calcular estatísticas
      const active = data?.filter(e => e.ativo).length || 0
      const inactive = data?.filter(e => !e.ativo).length || 0
      setStats({
        total: data?.length || 0,
        active,
        inactive
      })
    } catch (error) {
      console.error('Erro completo ao buscar:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        // Editando empresa
        const { error } = await supabase
          .from('establishments')
          .update({
            nome: formData.nome,
            cnpj: formData.cnpj,
            email: formData.email,
            telefone: formData.telefone,
            status_pagamento: formData.status_pagamento,
            vencimento: formData.vencimento,
            valor: formData.valor,
            ativo: formData.ativo,
            max_colaboradores: formData.max_colaboradores
          })
          .eq('id', editingItem.id)
        if (error) throw error
        alert('Empresa atualizada com sucesso!')
      } else {
        // Criando nova empresa
        console.log('Criando empresa e admin...')

        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.admin_email,
          password: formData.admin_senha,
          options: {
            data: {
              nome: formData.admin_nome,
              tipo: 'admin'
            }
          }
        })

        if (authError) {
          console.error('Erro ao criar usuário no Auth:', authError)
          throw new Error(`Erro ao criar usuário: ${authError.message}`)
        }

        if (!authData.user) {
          throw new Error('Usuário não foi criado no Auth')
        }

        console.log('Admin criado no Auth:', authData.user.id)

        // 2. Criar empresa
        const { data: newEstablishment, error: estError } = await supabase
          .from('establishments')
          .insert([{
            nome: formData.nome,
            cnpj: formData.cnpj,
            email: formData.email,
            telefone: formData.telefone,
            status_pagamento: formData.status_pagamento,
            vencimento: formData.vencimento,
            valor: formData.valor,
            ativo: formData.ativo,
            max_colaboradores: formData.max_colaboradores,
            owner_id: authData.user.id
          }])
          .select()
          .single()

        if (estError) {
          console.error('Erro ao criar empresa:', estError)
          throw new Error(`Erro ao criar empresa: ${estError.message}`)
        }

        console.log('Empresa criada:', newEstablishment)

        // 3. Criar registro do admin na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            nome: formData.admin_nome,
            email: formData.admin_email,
            telefone: formData.admin_telefone,
            role: 'admin',
            tipo: 'admin',
            establishment_id: newEstablishment.id,
            senha: formData.admin_senha  // Senha definida no cadastro
          }])

        if (userError) {
          console.error('Erro ao criar usuário na tabela users:', userError)
          // Não vou fazer throw aqui para não bloquear, mas vou avisar
          console.warn('Empresa criada mas erro ao vincular admin:', userError.message)
        }

        alert(`Empresa cadastrada com sucesso!

Admin criado:
Email: ${formData.admin_email}
Senha: ${formData.admin_senha}

O admin já pode fazer login no sistema.`)
      }
      handleCloseModal()
      fetchEstablishments()
    } catch (error) {
      console.error('Erro completo:', error)
      alert(`Erro: ${error.message || 'Erro desconhecido ao salvar empresa'}`)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      nome: item.nome || '',
      cnpj: item.cnpj || '',
      email: item.email || '',
      telefone: item.telefone || '',
      status_pagamento: item.status_pagamento || 'ativo',
      vencimento: item.vencimento || '',
      valor: item.valor || '',
      ativo: item.ativo !== false,
      max_colaboradores: item.max_colaboradores || 5,
      // Não carrega dados do admin ao editar
      admin_nome: '',
      admin_email: '',
      admin_senha: '',
      admin_telefone: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) return
    try {
      const { error } = await supabase.from('establishments').delete().eq('id', id)
      if (error) throw error
      fetchEstablishments()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar empresa.')
    }
  }

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('establishments')
        .update({ ativo: !currentStatus })
        .eq('id', id)
      if (error) throw error
      fetchEstablishments()
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status.')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({
      nome: '',
      cnpj: '',
      email: '',
      telefone: '',
      status_pagamento: 'ativo',
      vencimento: '',
      valor: '',
      ativo: true,
      admin_nome: '',
      admin_email: '',
      admin_senha: '',
      admin_telefone: '',
      max_colaboradores: 5
    })
  }

  // Redirecionar se não for super admin
  if (!permLoading && !isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading || permLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-metallic-light">Carregando...</div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Building2 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Super Admin - Gestão de Empresas</h1>
            <p className="text-metallic-light">Gerencie todas as empresas do sistema</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total de Empresas</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Building2 className="w-10 h-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Empresas Ativas</p>
                <p className="text-3xl font-bold text-green-400">{stats.active}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Empresas Inativas</p>
                <p className="text-3xl font-bold text-red-400">{stats.inactive}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {establishments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhuma empresa cadastrada</p>
              <p className="text-metallic-light text-sm mt-2">Clique em "Nova Empresa" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {establishments.map((est) => (
                <div key={est.id} className={`p-4 rounded-lg border ${est.ativo ? 'bg-dark-lighter border-dark-lighter' : 'bg-red-900/10 border-red-500/30'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{est.nome}</h3>
                        {est.ativo ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      {est.cnpj && <p className="text-xs text-metallic-light">CNPJ: {est.cnpj}</p>}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3 text-sm">
                    {est.email && (
                      <div className="flex items-center gap-2 text-metallic-light">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{est.email}</span>
                      </div>
                    )}
                    {est.telefone && (
                      <div className="flex items-center gap-2 text-metallic-light">
                        <Phone className="w-4 h-4" />
                        <span>{est.telefone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-dark-lighter space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleEdit(est)}
                        className="p-2 hover:bg-dark rounded-lg transition-colors text-primary text-sm flex items-center justify-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActive(est.id, est.ativo)}
                        className={`p-2 hover:bg-dark rounded-lg transition-colors text-sm flex items-center justify-center gap-1 ${est.ativo ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {est.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        {est.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleDelete(est.id)}
                      className="w-full p-2 hover:bg-dark rounded-lg transition-colors text-red-500 text-sm flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-light rounded-xl shadow-2xl max-w-2xl w-full border border-dark-lighter max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-lighter">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Editar Empresa' : 'Nova Empresa'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Nome da Empresa *</label>
                  <input type="text" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">CNPJ</label>
                  <input type="text" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="00.000.000/0000-00" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Email de Contato</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Telefone</label>
                  <input type="tel" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="(00) 00000-0000" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Status Pagamento</label>
                  <select value={formData.status_pagamento} onChange={(e) => setFormData({ ...formData, status_pagamento: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary">
                    <option value="ativo">Ativo</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Vencimento</label>
                  <input type="date" value={formData.vencimento} onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Valor Mensalidade</label>
                  <input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="0.00" />
                </div>
              </div>

              {/* Dados do Admin (somente ao criar nova empresa) */}
              {!editingItem && (
                <div className="space-y-4 pt-4 border-t border-dark-lighter">
                  <h3 className="text-lg font-semibold text-white border-b border-dark-lighter pb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    Dados do Administrador (Dono)
                  </h3>
                  <p className="text-sm text-metallic-light">
                    O admin será criado automaticamente e poderá fazer login com o email e senha abaixo.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-metallic-light text-sm font-medium mb-2">Nome do Admin *</label>
                      <input
                        type="text"
                        required={!editingItem}
                        value={formData.admin_nome}
                        onChange={(e) => setFormData({ ...formData, admin_nome: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="Nome completo do admin"
                      />
                    </div>
                    <div>
                      <label className="block text-metallic-light text-sm font-medium mb-2">Telefone do Admin</label>
                      <input
                        type="tel"
                        value={formData.admin_telefone}
                        onChange={(e) => setFormData({ ...formData, admin_telefone: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-metallic-light text-sm font-medium mb-2">Email do Admin *</label>
                      <input
                        type="email"
                        required={!editingItem}
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="admin@empresa.com"
                      />
                    </div>
                    <div>
                      <label className="block text-metallic-light text-sm font-medium mb-2">Senha do Admin *</label>
                      <input
                        type="password"
                        required={!editingItem}
                        value={formData.admin_senha}
                        onChange={(e) => setFormData({ ...formData, admin_senha: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="Mínimo 6 caracteres"
                        minLength="6"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Limite de Colaboradores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">
                    Limite de Colaboradores
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.max_colaboradores}
                    onChange={(e) => setFormData({ ...formData, max_colaboradores: parseInt(e.target.value) || 5 })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                  <p className="text-xs text-metallic-light mt-1">
                    Quantos colaboradores o admin pode cadastrar
                  </p>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="ativo" checked={formData.ativo} onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                      className="w-4 h-4" />
                    <label htmlFor="ativo" className="text-metallic-light text-sm">Empresa ativa</label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">{editingItem ? 'Salvar' : 'Cadastrar Empresa e Admin'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
