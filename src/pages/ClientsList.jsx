import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, FileText } from 'lucide-react'

export default function ClientsList() {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    // Filter clients based on search term
    if (searchTerm) {
      const filtered = clients.filter(client =>
        client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf?.includes(searchTerm)
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clients)
    }
  }, [searchTerm, clients])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id)

        if (error) throw error
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([formData])

        if (error) throw error
      }

      // Reset form and close modal
      setFormData({ nome: '', telefone: '', email: '', cpf: '' })
      setShowAddModal(false)
      setEditingClient(null)
      fetchClients()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente. Por favor, tente novamente.')
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      nome: client.nome || '',
      telefone: client.telefone || '',
      email: client.email || '',
      cpf: client.cpf || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
      alert('Erro ao deletar cliente. Por favor, tente novamente.')
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingClient(null)
    setFormData({ nome: '', telefone: '', email: '', cpf: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-metallic-light">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lista de Clientes</h1>
            <p className="text-metallic-light">Gerencie seus clientes</p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Resultados da Busca</p>
                <p className="text-2xl font-bold text-white">{filteredClients.length}</p>
              </div>
              <Search className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Clientes Ativos</p>
                <p className="text-2xl font-bold text-white">{clients.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-metallic-light" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </p>
              <p className="text-metallic-light text-sm mt-2">
                {searchTerm ? 'Tente buscar com outros termos' : 'Clique em "Novo Cliente" para começar'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-lighter">
                    <th className="text-left py-3 px-4 text-metallic-light font-semibold">Nome</th>
                    <th className="text-left py-3 px-4 text-metallic-light font-semibold">Telefone</th>
                    <th className="text-left py-3 px-4 text-metallic-light font-semibold">Email</th>
                    <th className="text-left py-3 px-4 text-metallic-light font-semibold">CPF</th>
                    <th className="text-right py-3 px-4 text-metallic-light font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-dark-lighter hover:bg-dark-lighter/30 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">{client.nome || '-'}</td>
                      <td className="py-3 px-4 text-metallic-light">
                        {client.telefone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {client.telefone}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-metallic-light">
                        {client.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-metallic-light">{client.cpf || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-2 hover:bg-dark-lighter rounded-lg transition-colors text-primary"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="p-2 hover:bg-dark-lighter rounded-lg transition-colors text-red-500"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-light rounded-xl shadow-2xl max-w-md w-full border border-dark-lighter">
            <div className="p-6 border-b border-dark-lighter">
              <h2 className="text-xl font-bold text-white">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary transition-colors"
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary transition-colors"
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary transition-colors"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  {editingClient ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
