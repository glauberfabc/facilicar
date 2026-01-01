import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Users, Plus, Search, Edit, Trash2, Phone, Mail, Car, ChevronDown, ChevronRight } from 'lucide-react'

const CATEGORIAS = ['Hatch', 'Sedan', 'SUV', 'Caminhonete', 'Moto', 'Van', 'Pickup']

export default function ClientsWithVehicles() {
  const { profile } = usePermissions()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [expandedClients, setExpandedClients] = useState({})

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    placa: '',
    modelo: '',
    cor: '',
    categoria: 'Hatch'
  })

  const [vehicleFormData, setVehicleFormData] = useState({
    placa: '',
    modelo: '',
    cor: '',
    categoria: 'Hatch'
  })

  const location = useLocation()

  useEffect(() => {
    fetchClients()
    if (location.state?.openNew) {
      setShowModal(true)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(client =>
        client.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefone?.includes(searchTerm) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredClients(filtered)
    } else {
      setFilteredClients(clients)
    }
  }, [searchTerm, clients])

  const fetchClients = async () => {
    try {
      setLoading(true)

      let { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          vehicles (*)
        `)
        .order('nome', { ascending: true })

      if (error && error.message?.includes('relationship')) {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .order('nome', { ascending: true })

        if (clientsError) throw clientsError

        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')

        if (vehiclesError) throw vehiclesError

        data = clientsData.map(client => ({
          ...client,
          vehicles: vehiclesData.filter(v => v.client_id === client.id)
        }))
      } else if (error) {
        throw error
      }

      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleClientExpanded = (clientId) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!profile?.establishment_id) {
      alert('Erro: Você não está vinculado a nenhuma empresa.')
      return
    }

    try {
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update({
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email
          })
          .eq('id', editingClient.id)
        if (error) throw error
        alert('Cliente atualizado com sucesso!')
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{
            nome: formData.nome,
            telefone: formData.telefone,
            email: formData.email,
            establishment_id: profile.establishment_id
          }])
          .select()
          .single()

        if (clientError) throw clientError

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .insert([{
            placa: formData.placa,
            modelo: formData.modelo || null,
            cor: formData.cor || null,
            categoria: formData.categoria,
            client_id: newClient.id,
            establishment_id: profile.establishment_id
          }])

        if (vehicleError) throw vehicleError

        alert('Cliente e veículo cadastrados com sucesso!')
      }
      handleCloseModal()
      fetchClients()
    } catch (error) {
      console.error('Erro:', error)
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleVehicleSubmit = async (e) => {
    e.preventDefault()

    if (!profile?.establishment_id) {
      alert('Erro: Você não está vinculado a nenhuma empresa.')
      return
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([{
          ...vehicleFormData,
          client_id: selectedClient.id,
          establishment_id: profile.establishment_id
        }])
      if (error) throw error
      alert('Veículo adicionado com sucesso!')
      handleCloseVehicleModal()
      fetchClients()
    } catch (error) {
      console.error('Erro ao adicionar veículo:', error)
      alert('Erro ao adicionar veículo.')
    }
  }

  const handleDeleteVehicle = async (vehicleId) => {
    if (!confirm('Remover este veículo?')) return
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId)
      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Erro ao deletar veículo:', error)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      nome: client.nome || '',
      telefone: client.telefone || '',
      email: client.email || '',
      placa: '',
      modelo: '',
      cor: '',
      categoria: 'Hatch'
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Excluir este cliente e todos os veículos?')) return
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      fetchClients()
    } catch (error) {
      console.error('Erro ao deletar cliente:', error)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      placa: '',
      modelo: '',
      cor: '',
      categoria: 'Hatch'
    })
  }

  const handleCloseVehicleModal = () => {
    setShowVehicleModal(false)
    setSelectedClient(null)
    setVehicleFormData({ placa: '', modelo: '', cor: '', categoria: 'Hatch' })
  }

  const openAddVehicle = (client) => {
    setSelectedClient(client)
    setShowVehicleModal(true)
  }

  const handleExport = () => {
    const headers = ['Nome', 'Telefone', 'Email', 'Placa', 'Modelo', 'Cor', 'Categoria']

    // Flatten data: one row per vehicle
    const rows = []
    filteredClients.forEach(client => {
      if (client.vehicles && client.vehicles.length > 0) {
        client.vehicles.forEach(vehicle => {
          rows.push([
            `"${client.nome || ''}"`,
            `"${client.telefone || ''}"`,
            `"${client.email || ''}"`,
            `"${vehicle.placa || ''}"`,
            `"${vehicle.modelo || ''}"`,
            `"${vehicle.cor || ''}"`,
            `"${vehicle.categoria || ''}"`
          ])
        })
      } else {
        // Client without vehicles
        rows.push([
          `"${client.nome || ''}"`,
          `"${client.telefone || ''}"`,
          `"${client.email || ''}"`,
          '""', '""', '""', '""'
        ])
      }
    })

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // Add BOM for Excel utf-8 compatibility
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'clientes_veiculos.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!profile?.establishment_id) {
      alert('Erro: Você não está vinculado a nenhuma empresa.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n')

        // Detect delimiter
        const firstLine = lines[0]
        const delimiter = firstLine.includes(';') ? ';' : ','

        const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''))

        // Group by client (using email or name+phone as key)
        const clientsMap = new Map()

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue
          const values = lines[i].split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''))

          const rowData = {}
          headers.forEach((header, index) => {
            if (header === 'nome') rowData.nome = values[index]
            if (header === 'telefone') rowData.telefone = values[index]
            if (header === 'email') rowData.email = values[index]
            if (header === 'placa') rowData.placa = values[index]
            if (header === 'modelo') rowData.modelo = values[index]
            if (header === 'cor') rowData.cor = values[index]
            if (header === 'categoria') rowData.categoria = values[index]
          })

          if (!rowData.nome) continue

          // Create unique key for client
          const clientKey = rowData.email || `${rowData.nome}-${rowData.telefone}`

          if (!clientsMap.has(clientKey)) {
            clientsMap.set(clientKey, {
              nome: rowData.nome,
              telefone: rowData.telefone,
              email: rowData.email,
              vehicles: []
            })
          }

          if (rowData.placa) {
            clientsMap.get(clientKey).vehicles.push({
              placa: rowData.placa,
              modelo: rowData.modelo,
              cor: rowData.cor,
              categoria: rowData.categoria || 'Hatch'
            })
          }
        }

        let importedCount = 0

        // Process each client
        for (const clientData of clientsMap.values()) {
          // 1. Insert Client
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert([{
              nome: clientData.nome,
              telefone: clientData.telefone,
              email: clientData.email,
              establishment_id: profile.establishment_id
            }])
            .select()
            .single()

          if (clientError) {
            console.error('Erro ao importar cliente:', clientData.nome, clientError)
            continue
          }

          importedCount++

          // 2. Insert Vehicles
          if (clientData.vehicles.length > 0) {
            const vehiclesToInsert = clientData.vehicles.map(v => ({
              ...v,
              client_id: newClient.id,
              establishment_id: profile.establishment_id
            }))

            const { error: vehicleError } = await supabase
              .from('vehicles')
              .insert(vehiclesToInsert)

            if (vehicleError) {
              console.error('Erro ao importar veículos de:', clientData.nome, vehicleError)
            }
          }
        }

        if (importedCount > 0) {
          alert(`${importedCount} clientes importados com sucesso!`)
          fetchClients()
        } else {
          alert('Nenhum cliente importado. Verifique o arquivo.')
        }

      } catch (error) {
        console.error('Erro na importação:', error)
        alert('Erro ao importar: ' + error.message)
      }
      event.target.value = ''
    }
    reader.readAsText(file)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-metallic-light">Carregando clientes...</div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Clientes e Veículos</h1>
              <p className="text-metallic-light">Gerencie clientes e seus veículos</p>
            </div>
          </div>

          <div className="flex gap-2 border-l border-dark-lighter pl-6">
            <Button variant="outline" onClick={handleExport} className="text-metallic-light border-dark-lighter hover:bg-dark-lighter">
              Exportar
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
              <Button as="span" variant="outline" className="text-metallic-light border-dark-lighter hover:bg-dark-lighter pointer-events-none">
                Importar
              </Button>
            </label>
          </div>
        </div>

        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>


      {/* Stats */}
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
                <p className="text-metallic-light text-sm">Total de Veículos</p>
                <p className="text-2xl font-bold text-white">
                  {clients.reduce((acc, c) => acc + (c.vehicles?.length || 0), 0)}
                </p>
              </div>
              <Car className="w-8 h-8 text-primary" />
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
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-metallic-light" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-lighter">
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm w-8"></th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Nome</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Telefone</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Email</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Veículos</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <>
                      <tr key={client.id} className="border-b border-dark-lighter hover:bg-dark-lighter/50 transition-colors">
                        <td className="p-3">
                          <button
                            onClick={() => toggleClientExpanded(client.id)}
                            className="text-metallic-light hover:text-white"
                          >
                            {expandedClients[client.id] ? (
                              <ChevronDown className="w-5 h-5" />
                            ) : (
                              <ChevronRight className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <div className="text-white font-medium">{client.nome}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-metallic-light text-sm">
                            {client.telefone && (
                              <>
                                <Phone className="w-4 h-4" />
                                {client.telefone}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 text-metallic-light text-sm">
                            {client.email && (
                              <>
                                <Mail className="w-4 h-4" />
                                {client.email}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                            {client.vehicles?.length || 0} veículo(s)
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openAddVehicle(client)}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                            >
                              + Veículo
                            </button>
                            <button
                              onClick={() => handleEdit(client)}
                              className="p-2 hover:bg-dark-lighter rounded text-primary"
                              title="Editar cliente"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="p-2 hover:bg-dark-lighter rounded text-red-500"
                              title="Excluir cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Vehicles Row */}
                      {expandedClients[client.id] && (
                        <tr className="bg-dark-lighter/30">
                          <td colSpan="6" className="p-4">
                            <div className="ml-8">
                              <div className="flex items-center gap-2 mb-3">
                                <Car className="w-4 h-4 text-primary" />
                                <h4 className="font-semibold text-white">Veículos ({client.vehicles?.length || 0})</h4>
                              </div>

                              {client.vehicles && client.vehicles.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="border-b border-dark-lighter/50">
                                        <th className="text-left p-2 text-metallic-light text-xs font-semibold">Placa</th>
                                        <th className="text-left p-2 text-metallic-light text-xs font-semibold">Modelo</th>
                                        <th className="text-left p-2 text-metallic-light text-xs font-semibold">Cor</th>
                                        <th className="text-left p-2 text-metallic-light text-xs font-semibold">Categoria</th>
                                        <th className="text-left p-2 text-metallic-light text-xs font-semibold">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {client.vehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="border-b border-dark-lighter/30">
                                          <td className="p-2">
                                            <span className="text-white font-semibold">{vehicle.placa}</span>
                                          </td>
                                          <td className="p-2">
                                            <span className="text-metallic-light text-sm">{vehicle.modelo || '-'}</span>
                                          </td>
                                          <td className="p-2">
                                            <span className="text-metallic-light text-sm">{vehicle.cor || '-'}</span>
                                          </td>
                                          <td className="p-2">
                                            <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">
                                              {vehicle.categoria}
                                            </span>
                                          </td>
                                          <td className="p-2">
                                            <button
                                              onClick={() => handleDeleteVehicle(vehicle.id)}
                                              className="p-1 hover:bg-dark rounded text-red-500"
                                              title="Remover veículo"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-sm text-metallic-light italic">Nenhum veículo cadastrado</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark rounded-lg max-w-2xl w-full border border-dark-lighter max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-dark-lighter sticky top-0 bg-dark z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
                    {!editingClient && (
                      <p className="text-sm text-metallic-light mt-1">Cadastre o cliente e seu primeiro veículo</p>
                    )}
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-metallic-light hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Dados do Cliente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white border-b border-dark-lighter pb-2">
                    Dados do Cliente
                  </h3>
                  <div>
                    <label className="block text-metallic-light text-sm font-medium mb-2">Nome *</label>
                    <input type="text" required value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="Nome completo do cliente" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-metallic-light text-sm font-medium mb-2">Telefone</label>
                      <input type="tel" value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                      <label className="block text-metallic-light text-sm font-medium mb-2">Email</label>
                      <input type="email" value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                        placeholder="email@exemplo.com" />
                    </div>
                  </div>
                </div>

                {/* Dados do Veículo (somente ao criar novo cliente) */}
                {!editingClient && (
                  <div className="space-y-4 pt-4 border-t border-dark-lighter">
                    <h3 className="text-lg font-semibold text-white border-b border-dark-lighter pb-2 flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary" />
                      Primeiro Veículo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-metallic-light text-sm font-medium mb-2">Placa *</label>
                        <input type="text" required value={formData.placa}
                          onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                          placeholder="ABC-1234" maxLength="8" />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-sm font-medium mb-2">Categoria *</label>
                        <select required value={formData.categoria}
                          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                          className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary">
                          {CATEGORIAS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-metallic-light text-sm font-medium mb-2">Modelo</label>
                        <input type="text" value={formData.modelo}
                          onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                          className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                          placeholder="Ex: Civic, Gol, HB20" />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-sm font-medium mb-2">Cor</label>
                        <input type="text" value={formData.cor}
                          onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                          className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                          placeholder="Ex: Branco, Prata" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">Cancelar</Button>
                  <Button type="submit" variant="primary" className="flex-1">{editingClient ? 'Salvar' : 'Cadastrar Cliente'}</Button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* Vehicle Modal */}
      {
        showVehicleModal && selectedClient && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark rounded-lg max-w-md w-full border border-dark-lighter">
              <div className="p-6 border-b border-dark-lighter">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Adicionar Veículo</h2>
                    <p className="text-sm text-metallic-light mt-1">Cliente: {selectedClient.nome}</p>
                  </div>
                  <button
                    onClick={handleCloseVehicleModal}
                    className="text-metallic-light hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-metallic-light text-sm font-medium mb-2">Placa *</label>
                    <input type="text" required value={vehicleFormData.placa}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, placa: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="ABC-1234" maxLength="8" />
                  </div>
                  <div>
                    <label className="block text-metallic-light text-sm font-medium mb-2">Categoria *</label>
                    <select required value={vehicleFormData.categoria}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, categoria: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary">
                      {CATEGORIAS.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-metallic-light text-sm font-medium mb-2">Modelo</label>
                    <input type="text" value={vehicleFormData.modelo}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, modelo: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="Ex: Civic, Gol, HB20" />
                  </div>
                  <div>
                    <label className="block text-metallic-light text-sm font-medium mb-2">Cor</label>
                    <input type="text" value={vehicleFormData.cor}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, cor: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="Ex: Branco, Prata" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={handleCloseVehicleModal} className="flex-1">Cancelar</Button>
                  <Button type="submit" variant="primary" className="flex-1">Adicionar Veículo</Button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  )
}
