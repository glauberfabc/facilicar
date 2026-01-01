import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Calendar, Plus, Clock, User, Car, CheckCircle, XCircle, Play, AlertCircle, QrCode } from 'lucide-react'
import QRCode from 'qrcode'

export default function Appointments() {
  const { profile } = usePermissions()
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [vehicleCategories, setVehicleCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [statusFilter, setStatusFilter] = useState('todos')

  const [searchPlaca, setSearchPlaca] = useState('')
  const [vehicleFound, setVehicleFound] = useState(null)
  const [clientFound, setClientFound] = useState(null)
  const [showNewClientForm, setShowNewClientForm] = useState(false)

  const [newClientData, setNewClientData] = useState({
    nome: '',
    telefone: '',
    email: '',
    placa: '',
    categoria: '',
    modelo: '',
    marca: '',
    cor: ''
  })

  const [selectedServices, setSelectedServices] = useState([])
  const [servicePrices, setServicePrices] = useState({})
  const [colaboradores, setColaboradores] = useState([])
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState(null)

  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    service_id: '',
    data_agendamento: '',
    status: 'pendente',
    observacoes: '',
    valor_estimado: 0,
    colaborador_id: ''
  })

  const location = useLocation()

  useEffect(() => {
    if (profile?.establishment_id) {
      fetchAppointments()
      fetchClients()
      fetchServices()
      fetchVehicleCategories()
      fetchColaboradores()
    }

    if (location.state?.openNew) {
      setShowModal(true)
      // Clear state to prevent reopening on refresh (optional but good practice)
      window.history.replaceState({}, document.title)
    }
  }, [profile, location])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          client_id,
          vehicle_id,
          service_id,
          servicos,
          qr_code,
          colaborador_id,
          data_agendamento,
          status,
          observacoes,
          valor_estimado,
          created_at,
          updated_at,
          clients!appointments_client_id_fkey (id, nome, telefone),
          vehicles!appointments_vehicle_id_fkey (id, placa, modelo, marca, categoria)
        `)
        .neq('status', 'concluido')
        .order('data_agendamento', { ascending: true })

      if (error) throw error
      console.log('✅ Agendamentos carregados:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('📋 Exemplo de agendamento:', data[0])
      }
      setAppointments(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, nome')
        .order('nome', { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error)
    }
  }

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, nome, descricao')
        .eq('ativo', true)
        .order('nome', { ascending: true })

      if (error) throw error
      setServices(data || [])
      console.log('✅ Serviços carregados:', data?.length || 0)
    } catch (error) {
      console.error('❌ Erro ao buscar serviços:', error)
    }
  }

  const fetchServicePrices = async (categoria) => {
    try {
      if (!categoria) return

      const { data, error } = await supabase
        .from('service_prices')
        .select('service_id, categoria, valor')
        .eq('categoria', categoria)

      if (error) throw error

      // Criar um mapa { service_id: valor }
      const pricesMap = {}
      data?.forEach(price => {
        pricesMap[price.service_id] = parseFloat(price.valor)
      })

      setServicePrices(pricesMap)
      console.log('✅ Preços carregados para categoria:', categoria, pricesMap)
    } catch (error) {
      console.error('❌ Erro ao buscar preços:', error)
    }
  }

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceId)
      const newSelection = isSelected
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]

      // Calcular valor total
      calculateTotal(newSelection)
      return newSelection
    })
  }

  const calculateTotal = (serviceIds) => {
    const total = serviceIds.reduce((sum, serviceId) => {
      const price = servicePrices[serviceId] || 0
      return sum + price
    }, 0)

    setFormData(prev => ({
      ...prev,
      valor_estimado: total,
      service_id: serviceIds.join(',')
    }))
  }

  const fetchVehicleCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('id, nome')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) throw error
      setVehicleCategories(data || [])
      console.log('✅ Categorias carregadas:', data?.length || 0)
    } catch (error) {
      console.error('❌ Erro ao buscar categorias de veículos:', error)
    }
  }

  const fetchColaboradores = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, nome, email')
        .eq('establishment_id', profile?.establishment_id)

      if (error) {
        console.warn('⚠️ Não foi possível carregar colaboradores:', error.message)
        setColaboradores([])
        return
      }

      // Usar nome ou email como fallback
      const colaboradoresFormatados = (data || []).map(user => ({
        id: user.id,
        nome: user.nome || user.email?.split('@')[0] || 'Sem nome'
      }))

      setColaboradores(colaboradoresFormatados)
      console.log('✅ Colaboradores carregados:', colaboradoresFormatados.length)
    } catch (error) {
      console.error('❌ Erro ao buscar colaboradores:', error)
      setColaboradores([])
    }
  }

  const generateQRCode = async (appointmentId) => {
    try {
      // Gerar código único baseado no ID do agendamento
      const qrData = `APPT-${appointmentId}`
      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      return { qrCode: qrData, qrCodeImage: qrCodeDataURL }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error)
      return null
    }
  }

  const handleViewQRCode = async (appointment) => {
    try {
      if (appointment.qr_code) {
        const qrCodeDataURL = await QRCode.toDataURL(appointment.qr_code, {
          width: 400,
          margin: 2
        })
        setSelectedQRCode({ ...appointment, qrCodeImage: qrCodeDataURL })
        setShowQRModal(true)
      }
    } catch (error) {
      console.error('❌ Erro ao exibir QR Code:', error)
      alert('Erro ao exibir QR Code')
    }
  }

  const fetchVehiclesByClient = async (clientId) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, placa, modelo, marca')
        .eq('client_id', clientId)
        .order('placa', { ascending: true })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar veículos:', error)
      setVehicles([])
    }
  }

  const handleClientChange = (clientId) => {
    setFormData({ ...formData, client_id: clientId, vehicle_id: '' })
    if (clientId) {
      fetchVehiclesByClient(clientId)
    } else {
      setVehicles([])
    }
  }

  const handleSearchPlaca = async () => {
    try {
      if (!searchPlaca.trim()) {
        alert('Digite uma placa para buscar')
        return
      }

      const placaNormalizada = searchPlaca.trim().toUpperCase()

      // Buscar veículo pela placa
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select(`
          *,
          clients (id, nome, telefone, email)
        `)
        .eq('placa', placaNormalizada)
        .single()

      if (vehicleError) {
        if (vehicleError.code === 'PGRST116') {
          // Não encontrou - mostrar formulário de cadastro
          console.log('Placa não encontrada, mostrando formulário de cadastro')
          setVehicleFound(null)
          setClientFound(null)
          setShowNewClientForm(true)
          setNewClientData({ ...newClientData, placa: placaNormalizada })
        } else {
          throw vehicleError
        }
        return
      }

      // Encontrou - preencher dados
      console.log('Veículo encontrado:', vehicleData)
      setVehicleFound(vehicleData)
      setClientFound(vehicleData.clients)
      setShowNewClientForm(false)
      setFormData({
        ...formData,
        client_id: vehicleData.client_id,
        vehicle_id: vehicleData.id
      })

      // Carregar preços da categoria do veículo
      if (vehicleData.categoria) {
        await fetchServicePrices(vehicleData.categoria)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar placa:', error)
      alert(`Erro ao buscar placa: ${error.message}`)
    }
  }

  const handleCreateNewClient = async () => {
    try {
      if (!newClientData.nome || !newClientData.telefone || !newClientData.placa || !newClientData.categoria) {
        alert('Preencha os campos obrigatórios: Nome, Telefone, Placa e Categoria')
        return
      }

      if (!profile?.establishment_id) {
        alert('Erro: Você não está vinculado a nenhuma empresa.')
        return
      }

      // 1. Criar cliente
      const clientData = {
        nome: newClientData.nome,
        telefone: newClientData.telefone,
        email: newClientData.email || null,
        establishment_id: profile.establishment_id
      }

      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (clientError) throw clientError

      console.log('✅ Cliente criado:', newClient)

      // 2. Criar veículo
      const vehicleData = {
        client_id: newClient.id,
        placa: newClientData.placa.toUpperCase(),
        modelo: newClientData.modelo || null,
        marca: newClientData.marca || null,
        cor: newClientData.cor || null,
        categoria: newClientData.categoria || null
      }

      const { data: newVehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert([vehicleData])
        .select()
        .single()

      if (vehicleError) throw vehicleError

      console.log('✅ Veículo criado:', newVehicle)

      // 3. Atualizar estado
      setVehicleFound(newVehicle)
      setClientFound(newClient)
      setShowNewClientForm(false)
      setFormData({
        ...formData,
        client_id: newClient.id,
        vehicle_id: newVehicle.id
      })

      // 4. Carregar preços da categoria
      if (newClientData.categoria) {
        await fetchServicePrices(newClientData.categoria)
      }

      alert('Cliente e veículo cadastrados com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error)
      alert(`Erro ao criar cliente: ${error.message}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log('🔵 Iniciando criação de agendamento...')
      console.log('🔵 Profile:', profile)
      console.log('🔵 FormData:', formData)

      if (!profile?.establishment_id) {
        alert('Erro: Você não está vinculado a nenhuma empresa.')
        return
      }

      if (!formData.client_id || !formData.vehicle_id) {
        alert('Erro: Cliente e veículo são obrigatórios.')
        return
      }

      if (!formData.data_agendamento) {
        alert('Erro: Data e hora são obrigatórias.')
        return
      }

      // Preparar dados dos serviços selecionados em formato JSONB
      console.log('🔍 DEBUG selectedServices:', selectedServices)
      console.log('🔍 DEBUG services array:', services)
      console.log('🔍 DEBUG servicePrices:', servicePrices)

      const servicosDetalhados = selectedServices.map(serviceId => {
        const service = services.find(s => s.id === serviceId)
        const price = servicePrices[serviceId] || 0
        console.log(`🔍 DEBUG Processando serviço ${serviceId}:`, { service, price })
        return {
          id: serviceId,
          nome: service?.nome || '',
          descricao: service?.descricao || '',
          valor: price
        }
      })

      console.log('🔍 DEBUG servicosDetalhados:', servicosDetalhados)

      const appointmentData = {
        client_id: formData.client_id,
        vehicle_id: formData.vehicle_id || null,
        service_id: formData.service_id || null,
        servicos: servicosDetalhados.length > 0 ? servicosDetalhados : null,
        data_agendamento: formData.data_agendamento,
        status: formData.status,
        observacoes: formData.observacoes || null,
        valor_estimado: parseFloat(formData.valor_estimado) || 0,
        colaborador_id: formData.colaborador_id || null,
        establishment_id: profile.establishment_id,
        created_by: profile.id
      }

      console.log('🔵 Dados a serem salvos:', appointmentData)
      console.log('🔵 servicos que será salvo:', appointmentData.servicos)

      if (editingAppointment) {
        console.log('🔵 Atualizando agendamento:', editingAppointment.id)
        const { data, error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', editingAppointment.id)
          .select()

        console.log('🔵 Resposta update:', { data, error })
        if (error) throw error
        alert('Agendamento atualizado com sucesso!')
      } else {
        console.log('🔵 Criando novo agendamento...')
        const { data, error } = await supabase
          .from('appointments')
          .insert([appointmentData])
          .select()

        console.log('🔵 Resposta insert:', { data, error })
        if (error) throw error
        console.log('✅ Agendamento criado:', data)

        // Gerar QR Code para o novo agendamento
        if (data && data[0]?.id) {
          const qrResult = await generateQRCode(data[0].id)
          if (qrResult) {
            // Atualizar o agendamento com o QR code
            const { error: qrError } = await supabase
              .from('appointments')
              .update({ qr_code: qrResult.qrCode })
              .eq('id', data[0].id)

            if (qrError) {
              console.error('❌ Erro ao salvar QR Code:', qrError)
            } else {
              console.log('✅ QR Code gerado e salvo:', qrResult.qrCode)
            }
          }
        }

        alert('Agendamento criado com sucesso!')
      }

      handleCloseModal()
      fetchAppointments()
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error)
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleEdit = async (appointment) => {
    setEditingAppointment(appointment)
    setFormData({
      client_id: appointment.client_id || '',
      vehicle_id: appointment.vehicle_id || '',
      service_id: appointment.service_id || '',
      data_agendamento: appointment.data_agendamento?.slice(0, 16) || '',
      status: appointment.status || 'pendente',
      observacoes: appointment.observacoes || '',
      valor_estimado: appointment.valor_estimado || 0
    })

    // Carregar veículos do cliente
    if (appointment.client_id) {
      fetchVehiclesByClient(appointment.client_id)
    }

    // Carregar veículo completo para obter categoria
    if (appointment.vehicle_id) {
      try {
        const { data: vehicleData, error } = await supabase
          .from('vehicles')
          .select(`
            *,
            clients (id, nome, telefone, email)
          `)
          .eq('id', appointment.vehicle_id)
          .single()

        if (!error && vehicleData) {
          setVehicleFound(vehicleData)
          setClientFound(vehicleData.clients)

          // Carregar preços da categoria
          if (vehicleData.categoria) {
            await fetchServicePrices(vehicleData.categoria)

            // Restaurar serviços selecionados
            if (appointment.service_id) {
              const serviceIds = appointment.service_id.split(',').filter(id => id.trim())
              setSelectedServices(serviceIds)
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do veículo:', error)
      }
    }

    setShowModal(true)
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error
      fetchAppointments()
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      alert(`Erro ao atualizar status: ${error.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Agendamento deletado com sucesso!')
      fetchAppointments()
    } catch (error) {
      console.error('❌ Erro ao deletar:', error)
      alert(`Erro ao deletar: ${error.message}`)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAppointment(null)
    setSearchPlaca('')
    setVehicleFound(null)
    setClientFound(null)
    setShowNewClientForm(false)
    setSelectedServices([])
    setServicePrices({})
    setNewClientData({
      nome: '',
      telefone: '',
      email: '',
      placa: '',
      categoria: '',
      modelo: '',
      marca: '',
      cor: ''
    })
    setFormData({
      client_id: '',
      vehicle_id: '',
      service_id: '',
      data_agendamento: '',
      status: 'pendente',
      observacoes: '',
      valor_estimado: 0
    })
    setVehicles([])
  }

  const getStatusColor = (status) => {
    const colors = {
      pendente: 'text-yellow-400 bg-yellow-500/20',
      confirmado: 'text-blue-400 bg-blue-500/20',
      em_andamento: 'text-purple-400 bg-purple-500/20',
      concluido: 'text-green-400 bg-green-500/20',
      cancelado: 'text-red-400 bg-red-500/20'
    }
    return colors[status] || 'text-metallic-light bg-dark-lighter'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pendente: <Clock className="w-4 h-4" />,
      confirmado: <CheckCircle className="w-4 h-4" />,
      em_andamento: <Play className="w-4 h-4" />,
      concluido: <CheckCircle className="w-4 h-4" />,
      cancelado: <XCircle className="w-4 h-4" />
    }
    return icons[status] || <AlertCircle className="w-4 h-4" />
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não definida'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredAppointments = statusFilter === 'todos'
    ? appointments
    : appointments.filter(a => a.status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-metallic-light">Carregando agendamentos...</div>
      </div>
    )
  }

  const statusCounts = {
    todos: appointments.length,
    pendente: appointments.filter(a => a.status === 'pendente').length,
    confirmado: appointments.filter(a => a.status === 'confirmado').length,
    em_andamento: appointments.filter(a => a.status === 'em_andamento').length,
    concluido: appointments.filter(a => a.status === 'concluido').length,
    cancelado: appointments.filter(a => a.status === 'cancelado').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Agendamentos</h1>
            <p className="text-metallic-light">Gerencie os agendamentos de serviços</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Filtros de Status */}
      <div className="flex flex-wrap gap-2">
        {['todos', 'pendente', 'confirmado', 'em_andamento', 'cancelado'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
              ? 'bg-primary text-white'
              : 'bg-dark-lighter text-metallic-light hover:bg-dark hover:text-white'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Lista de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter === 'todos' ? 'Todos os Agendamentos' : `Agendamentos: ${statusFilter.replace('_', ' ')}`}
            ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhum agendamento encontrado</p>
              <p className="text-metallic-light text-sm mt-2">Clique em "Novo Agendamento" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 bg-dark-lighter rounded-lg border border-dark-lighter hover:border-primary transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Data e Status */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <Clock className="w-4 h-4" />
                          {formatDate(appointment.data_agendamento)}
                        </div>
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Cliente */}
                      {appointment.clients && (
                        <div className="flex items-center gap-2 text-sm text-metallic-light">
                          <User className="w-4 h-4" />
                          <span>{appointment.clients.nome}</span>
                          {appointment.clients.telefone && (
                            <span className="text-metallic">• {appointment.clients.telefone}</span>
                          )}
                        </div>
                      )}

                      {/* Veículo */}
                      {appointment.vehicles && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-metallic-light">
                            <Car className="w-4 h-4" />
                            <span>{appointment.vehicles.marca} {appointment.vehicles.modelo}</span>
                            <span className="text-metallic">• Placa: {appointment.vehicles.placa}</span>
                          </div>
                          {appointment.vehicles.categoria && (
                            <div className="text-xs text-metallic-light ml-5">
                              Categoria: <span className="text-primary font-medium">{appointment.vehicles.categoria}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Serviços Detalhados (JSONB) */}
                      {appointment.servicos && Array.isArray(appointment.servicos) && appointment.servicos.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs text-metallic-light font-semibold">Serviços:</div>
                          {appointment.servicos.map((servico, idx) => {
                            let nomeServico = 'Serviço sem nome'
                            let valorServico = 0

                            if (typeof servico === 'string') {
                              // Formato antigo: array de IDs
                              const s = services.find(s => s.id === servico)
                              if (s) nomeServico = s.nome
                            } else if (typeof servico === 'object') {
                              // Novo formato: array de objetos
                              nomeServico = servico.nome || 'Serviço sem nome'
                              valorServico = servico.valor || 0
                            }

                            return (
                              <div key={idx} className="text-sm text-primary flex items-center justify-between">
                                <span>• {nomeServico}</span>
                                {valorServico > 0 && (
                                  <span className="text-green-400 font-medium ml-2">
                                    R$ {parseFloat(valorServico).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : appointment.service_id ? (
                        <div className="text-sm text-metallic-light">
                          <span className="text-xs font-semibold">Serviços (IDs):</span>
                          <div className="text-primary mt-1">
                            {appointment.service_id.split(',').map((id, idx) => (
                              <span key={idx}>
                                • Serviço {id.trim()}
                                {idx < appointment.service_id.split(',').length - 1 && <br />}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-metallic-light italic">
                          Nenhum serviço registrado
                        </div>
                      )}

                      {/* Observações */}
                      {appointment.observacoes && (
                        <div className="text-sm text-metallic-light italic">
                          Obs: {appointment.observacoes}
                        </div>
                      )}

                      {/* Valor */}
                      {appointment.valor_estimado > 0 && (
                        <div className="text-sm font-semibold text-green-400">
                          Valor estimado: R$ {parseFloat(appointment.valor_estimado).toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      {/* Botões de Status */}
                      {appointment.status === 'pendente' && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'confirmado')}
                          className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium hover:bg-blue-500/30 transition-colors"
                        >
                          Confirmar
                        </button>
                      )}
                      {appointment.status === 'confirmado' && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'em_andamento')}
                          className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors"
                        >
                          Iniciar
                        </button>
                      )}
                      {appointment.status === 'em_andamento' && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'concluido')}
                          className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium hover:bg-green-500/30 transition-colors"
                        >
                          Concluir
                        </button>
                      )}
                      {!['concluido', 'cancelado'].includes(appointment.status) && (
                        <button
                          onClick={() => handleStatusChange(appointment.id, 'cancelado')}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium hover:bg-red-500/30 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                      {appointment.qr_code && (
                        <button
                          onClick={() => handleViewQRCode(appointment)}
                          className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium hover:bg-yellow-500/30 transition-colors flex items-center gap-1 justify-center"
                        >
                          <QrCode className="w-3 h-3" />
                          QR Code
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(appointment)}
                        className="px-3 py-1 bg-primary/20 text-primary rounded text-xs font-medium hover:bg-primary/30 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(appointment.id)}
                        className="px-3 py-1 bg-dark text-metallic-light rounded text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {
        showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-light rounded-xl shadow-2xl max-w-2xl w-full border border-dark-lighter max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-dark-lighter">
                <h2 className="text-xl font-bold text-white">
                  {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Busca por Placa */}
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <label className="block text-white text-sm font-semibold mb-3">🔍 Buscar por Placa</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchPlaca}
                      onChange={(e) => setSearchPlaca(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary uppercase"
                      placeholder="Ex: ABC1234"
                      maxLength="7"
                    />
                    <Button type="button" variant="primary" onClick={handleSearchPlaca}>
                      Buscar
                    </Button>
                  </div>
                </div>

                {/* Dados Encontrados */}
                {clientFound && vehicleFound && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
                    <p className="text-green-400 font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Veículo encontrado!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-metallic-light">Cliente:</span>
                        <p className="text-white font-medium">{clientFound.nome}</p>
                      </div>
                      <div>
                        <span className="text-metallic-light">Telefone:</span>
                        <p className="text-white font-medium">{clientFound.telefone}</p>
                      </div>
                      {clientFound.email && (
                        <div>
                          <span className="text-metallic-light">Email:</span>
                          <p className="text-white font-medium">{clientFound.email}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-metallic-light">Placa:</span>
                        <p className="text-white font-medium">{vehicleFound.placa}</p>
                      </div>
                      {vehicleFound.marca && (
                        <div>
                          <span className="text-metallic-light">Marca:</span>
                          <p className="text-white font-medium">{vehicleFound.marca}</p>
                        </div>
                      )}
                      {vehicleFound.modelo && (
                        <div>
                          <span className="text-metallic-light">Modelo:</span>
                          <p className="text-white font-medium">{vehicleFound.modelo}</p>
                        </div>
                      )}
                      {vehicleFound.cor && (
                        <div>
                          <span className="text-metallic-light">Cor:</span>
                          <p className="text-white font-medium">{vehicleFound.cor}</p>
                        </div>
                      )}
                      {vehicleFound.categoria && (
                        <div>
                          <span className="text-metallic-light">Categoria:</span>
                          <p className="text-white font-medium">{vehicleFound.categoria}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Formulário de Cadastro de Novo Cliente */}
                {showNewClientForm && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-3">
                    <p className="text-yellow-400 font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Placa não encontrada - Cadastre o novo cliente
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Nome *</label>
                        <input
                          type="text"
                          required
                          value={newClientData.nome}
                          onChange={(e) => setNewClientData({ ...newClientData, nome: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                          placeholder="Nome do cliente"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Telefone *</label>
                        <input
                          type="tel"
                          required
                          value={newClientData.telefone}
                          onChange={(e) => setNewClientData({ ...newClientData, telefone: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Email (opcional)</label>
                        <input
                          type="email"
                          value={newClientData.email}
                          onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Placa *</label>
                        <input
                          type="text"
                          required
                          value={newClientData.placa}
                          onChange={(e) => setNewClientData({ ...newClientData, placa: e.target.value.toUpperCase() })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary uppercase"
                          placeholder="ABC1234"
                          maxLength="7"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Marca (opcional)</label>
                        <input
                          type="text"
                          value={newClientData.marca}
                          onChange={(e) => setNewClientData({ ...newClientData, marca: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                          placeholder="Ex: Toyota"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Modelo (opcional)</label>
                        <input
                          type="text"
                          value={newClientData.modelo}
                          onChange={(e) => setNewClientData({ ...newClientData, modelo: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                          placeholder="Ex: Corolla"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Cor (opcional)</label>
                        <input
                          type="text"
                          value={newClientData.cor}
                          onChange={(e) => setNewClientData({ ...newClientData, cor: e.target.value })}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                          placeholder="Ex: Branco"
                        />
                      </div>
                      <div>
                        <label className="block text-metallic-light text-xs font-medium mb-1">Categoria *</label>
                        <select
                          required
                          value={newClientData.categoria}
                          onChange={(e) => {
                            const categoria = e.target.value
                            setNewClientData({ ...newClientData, categoria })
                            // Carregar preços assim que a categoria for selecionada
                            if (categoria) {
                              fetchServicePrices(categoria)
                            }
                          }}
                          className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded text-white text-sm focus:outline-none focus:border-primary"
                        >
                          <option value="">Selecione uma categoria</option>
                          {vehicleCategories.map((cat) => (
                            <option key={cat.id} value={cat.nome}>
                              {cat.nome}
                            </option>
                          ))}
                        </select>
                        {vehicleCategories.length === 0 && (
                          <p className="text-xs text-red-400 mt-1">
                            Nenhuma categoria cadastrada. Cadastre em Negócio → Gerenciar Categorias
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleCreateNewClient}
                      className="w-full"
                      disabled={vehicleCategories.length === 0}
                    >
                      Cadastrar Cliente e Veículo
                    </Button>
                    {vehicleCategories.length === 0 && (
                      <p className="text-xs text-red-400 text-center">
                        É necessário cadastrar categorias antes de criar um novo cliente
                      </p>
                    )}
                  </div>
                )}

                {/* Seleção de Serviços */}
                {(clientFound || showNewClientForm) && Object.keys(servicePrices).length > 0 && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <label className="block text-white text-sm font-semibold mb-3">📋 Serviços</label>

                    {services.length === 0 ? (
                      <p className="text-metallic-light text-sm">
                        Nenhum serviço disponível. Cadastre serviços em Negócio → Tabela de Serviço
                      </p>
                    ) : (
                      <>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {services.map((service) => {
                            const price = servicePrices[service.id]
                            const isAvailable = price !== undefined

                            return (
                              <div
                                key={service.id}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all ${isAvailable
                                  ? 'bg-dark-lighter hover:bg-dark border border-dark-lighter hover:border-primary cursor-pointer'
                                  : 'bg-dark-lighter/50 opacity-50 cursor-not-allowed'
                                  }`}
                              >
                                <label className="flex items-center gap-3 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={selectedServices.includes(service.id)}
                                    onChange={() => isAvailable && handleServiceToggle(service.id)}
                                    disabled={!isAvailable}
                                    className="w-4 h-4 text-primary rounded focus:ring-primary focus:ring-offset-0"
                                  />
                                  <div className="flex-1">
                                    <span className="text-white font-medium">{service.nome}</span>
                                    {service.descricao && (
                                      <p className="text-xs text-metallic-light mt-0.5">{service.descricao}</p>
                                    )}
                                    {!isAvailable && (
                                      <p className="text-xs text-yellow-400 mt-0.5">
                                        Preço não definido para esta categoria
                                      </p>
                                    )}
                                  </div>
                                </label>
                                {isAvailable && (
                                  <span className="text-green-400 font-semibold ml-3">
                                    R$ {price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Total */}
                        <div className="mt-4 pt-4 border-t border-primary/20">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-metallic-light text-sm">
                                {selectedServices.length} {selectedServices.length === 1 ? 'serviço selecionado' : 'serviços selecionados'}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-metallic-light mb-1">Valor Total</p>
                              <p className="text-2xl font-bold text-green-400">
                                R$ {formData.valor_estimado.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Mensagem caso categoria não esteja selecionada */}
                {(clientFound || showNewClientForm) && Object.keys(servicePrices).length === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Aguardando categoria do veículo para carregar preços dos serviços
                    </p>
                  </div>
                )}

                {/* Data e Hora */}
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Data e Hora *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>

                {/* Colaborador */}
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Colaborador (opcional)</label>
                  <select
                    value={formData.colaborador_id}
                    onChange={(e) => setFormData({ ...formData, colaborador_id: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Selecione um colaborador</option>
                    {colaboradores.map((colab) => (
                      <option key={colab.id} value={colab.id}>
                        {colab.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor Total (somente leitura) */}
                <div className="bg-dark-lighter/50 border border-dark-lighter rounded-lg p-4">
                  <label className="block text-metallic-light text-sm font-medium mb-2">
                    💰 Valor Estimado (calculado automaticamente)
                  </label>
                  <div className="text-3xl font-bold text-green-400">
                    R$ {formData.valor_estimado.toFixed(2)}
                  </div>
                  <p className="text-xs text-metallic-light mt-1">
                    Este valor é calculado automaticamente com base nos serviços selecionados
                  </p>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="Observações sobre o agendamento..."
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={!formData.client_id || !formData.vehicle_id}
                  >
                    {editingAppointment ? 'Salvar Alterações' : 'Criar Agendamento'}
                  </Button>
                </div>
                {(!formData.client_id || !formData.vehicle_id) && (
                  <p className="text-xs text-yellow-400 text-center">
                    {!searchPlaca ? '⬆️ Digite uma placa e clique em Buscar' : '⬆️ Complete o cadastro do cliente primeiro'}
                  </p>
                )}
              </form>
            </div>
          </div>
        )
      }

      {/* Modal QR Code */}
      {
        showQRModal && selectedQRCode && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-dark rounded-lg w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">QR Code do Agendamento</h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-metallic-light hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Informações do Agendamento */}
              <div className="space-y-2 text-sm">
                <div className="text-metallic-light">
                  <span className="font-semibold text-white">Cliente:</span> {selectedQRCode.clients?.nome}
                </div>
                <div className="text-metallic-light">
                  <span className="font-semibold text-white">Veículo:</span> {selectedQRCode.vehicles?.placa}
                </div>
                <div className="text-metallic-light">
                  <span className="font-semibold text-white">Data:</span> {formatDate(selectedQRCode.data_agendamento)}
                </div>
                <div className="text-metallic-light">
                  <span className="font-semibold text-white">Código:</span> {selectedQRCode.qr_code}
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={selectedQRCode.qrCodeImage}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-xs text-metallic-light text-center">
                  Escaneie este QR Code para visualizar os detalhes do agendamento
                </p>
              </div>

              {/* Botão Fechar */}
              <Button
                onClick={() => setShowQRModal(false)}
                variant="secondary"
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </div>
        )
      }
    </div >
  )
}
