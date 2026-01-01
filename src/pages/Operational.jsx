import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Play, User, Car, Clock, CheckCircle, Eye, QrCode, DollarSign } from 'lucide-react'
import QRCode from 'qrcode'

export default function Operational() {
  const { profile } = usePermissions()
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState(null)

  // Estados para finalização
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finishData, setFinishData] = useState({
    valor: 0,
    metodoPagamento: 'pix',
    estaPago: true
  })

  useEffect(() => {
    if (profile?.establishment_id) {
      fetchActiveAppointments()
      fetchServices()
    }
  }, [profile])

  const fetchActiveAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          clients!appointments_client_id_fkey (id, nome, telefone, email),
          vehicles!appointments_vehicle_id_fkey (id, placa, modelo, marca, categoria, cor),
          users!appointments_colaborador_id_fkey (id, nome, email)
        `)
        .eq('establishment_id', profile.establishment_id)
        .in('status', ['pendente', 'confirmado', 'em_andamento'])
        .order('data_agendamento', { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos ativos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (newStatus === 'concluido') {
      const appointment = appointments.find(a => a.id === appointmentId)
      setSelectedAppointment(appointment)
      setFinishData({
        valor: appointment.valor_estimado || 0,
        metodoPagamento: 'pix',
        estaPago: true
      })
      setShowFinishModal(true)
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)

      if (error) throw error
      fetchActiveAppointments()
      alert('Status atualizado com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      alert('Erro ao atualizar status.')
    }
  }

  const handleFinishService = async () => {
    if (!selectedAppointment) return

    try {
      // 1. Atualizar status do agendamento
      const { error: appError } = await supabase
        .from('appointments')
        .update({ status: 'concluido' })
        .eq('id', selectedAppointment.id)

      if (appError) throw appError

      // 2. Criar transação financeira
      // Se estiver pago, cria como receita realizada. Se não, talvez pendente? 
      // O usuário disse que "situacao financeira" vem de "se existe transação".
      // Vamos assumir que criamos a transação sempre, mas talvez precisemos de um campo de status na transação?
      // A query do usuário dizia: CASE WHEN ft.id IS NOT NULL THEN 'Pago' ELSE 'Pendente' END
      // Isso implica que se não pagou, NÃO cria transação? Ou cria mas com outro status?
      // O usuário disse: "o meio de pagamento esta na coluna categoria da tabela financial_transactions"
      // Vamos criar a transação. Se não estiver pago, talvez não devêssemos criar?
      // Mas precisamos do registro para o histórico (permanência, etc).
      // Vou criar a transação sempre, pois a View depende dela para mostrar os dados.
      // Se não estiver pago, o ideal seria ter um campo status na financial_transactions, mas a view deduz "Pago" se existir.
      // Vou assumir que "Concluir" implica gerar a cobrança.

      const transactionData = {
        tipo: 'receita',
        categoria: finishData.metodoPagamento, // Usando categoria para meio de pagamento conforme solicitado
        descricao: `Serviço - ${selectedAppointment.vehicles?.placa} - ${selectedAppointment.clients?.nome}`,
        valor: parseFloat(finishData.valor),
        data: new Date().toISOString().split('T')[0],
        establishment_id: profile.establishment_id,
        os_id: selectedAppointment.id, // VINCULO IMPORTANTE
        created_by: profile.id
      }

      const { error: transError } = await supabase
        .from('financial_transactions')
        .insert([transactionData])

      if (transError) throw transError

      setShowFinishModal(false)
      fetchActiveAppointments()
      alert('Serviço concluído e transação gerada com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao finalizar serviço:', error)
      alert(`Erro ao finalizar: ${error.message}`)
    }
  }

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
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
      } else {
        alert('Este agendamento não possui QR Code')
      }
    } catch (error) {
      console.error('❌ Erro ao exibir QR Code:', error)
      alert('Erro ao exibir QR Code')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pendente: 'bg-yellow-500/20 text-yellow-400',
      confirmado: 'bg-blue-500/20 text-blue-400',
      em_andamento: 'bg-purple-500/20 text-purple-400'
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pendente: <Clock className="w-4 h-4" />,
      confirmado: <CheckCircle className="w-4 h-4" />,
      em_andamento: <Play className="w-4 h-4" />
    }
    return icons[status] || <Clock className="w-4 h-4" />
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

  const stats = {
    pendentes: appointments.filter(a => a.status === 'pendente').length,
    confirmados: appointments.filter(a => a.status === 'confirmado').length,
    emAndamento: appointments.filter(a => a.status === 'em_andamento').length,
    total: appointments.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-metallic-light">Carregando operacional...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Play className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Operacional</h1>
            <p className="text-metallic-light">Acompanhe os agendamentos em andamento</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/history')} className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Ver Histórico
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total Ativo</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Play className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendentes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Confirmados</p>
                <p className="text-2xl font-bold text-blue-400">{stats.confirmados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Em Andamento</p>
                <p className="text-2xl font-bold text-purple-400">{stats.emAndamento}</p>
              </div>
              <Play className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Agendamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos Ativos ({appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhum agendamento ativo</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-lighter">
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Data/Hora</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Cliente</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Veículo</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Status</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Valor</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-dark-lighter hover:bg-dark-lighter/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <Clock className="w-4 h-4 text-metallic-light" />
                          {formatDate(appointment.data_agendamento)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-white font-medium">{appointment.clients?.nome}</div>
                          <div className="text-metallic-light text-xs">{appointment.clients?.telefone}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="text-white font-medium">{appointment.vehicles?.placa}</div>
                          <div className="text-metallic-light text-xs">
                            {appointment.vehicles?.marca} {appointment.vehicles?.modelo}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold w-fit ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-green-400 font-semibold">
                          R$ {parseFloat(appointment.valor_estimado || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {appointment.status === 'pendente' && (
                            <button
                              onClick={() => handleStatusChange(appointment.id, 'confirmado')}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {appointment.status === 'confirmado' && (
                            <button
                              onClick={() => handleStatusChange(appointment.id, 'em_andamento')}
                              className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors"
                            >
                              Iniciar
                            </button>
                          )}
                          {appointment.status === 'em_andamento' && (
                            <button
                              onClick={() => handleStatusChange(appointment.id, 'concluido')}
                              className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30 transition-colors"
                            >
                              Concluir
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetails(appointment)}
                            className="p-2 hover:bg-dark-lighter rounded text-primary"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {appointment.qr_code && (
                            <button
                              onClick={() => handleViewQRCode(appointment)}
                              className="p-2 hover:bg-dark-lighter rounded text-yellow-400"
                              title="Ver QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Modal de Finalização */}
      {showFinishModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark rounded-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-lighter pb-4">
              <h2 className="text-xl font-bold text-white">Finalizar Serviço</h2>
              <button
                onClick={() => setShowFinishModal(false)}
                className="text-metallic-light hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-metallic-light mb-1 block">Valor Final (R$)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-metallic-light" />
                  <input
                    type="number"
                    step="0.01"
                    value={finishData.valor}
                    onChange={(e) => setFinishData({ ...finishData, valor: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-metallic-light mb-1 block">Meio de Pagamento</label>
                <select
                  value={finishData.metodoPagamento}
                  onChange={(e) => setFinishData({ ...finishData, metodoPagamento: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="pix">Pix</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="estaPago"
                  checked={finishData.estaPago}
                  onChange={(e) => setFinishData({ ...finishData, estaPago: e.target.checked })}
                  className="w-4 h-4 rounded border-dark-lighter bg-dark-lighter text-primary focus:ring-primary"
                />
                <label htmlFor="estaPago" className="text-white text-sm">Pagamento já realizado</label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowFinishModal(false)} variant="secondary" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleFinishService} variant="primary" className="flex-1">
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark rounded-lg w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-lighter pb-4">
              <h2 className="text-xl font-bold text-white">Detalhes do Agendamento</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-metallic-light hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-metallic-light text-sm">Cliente</p>
                <p className="text-white font-medium">{selectedAppointment.clients?.nome}</p>
                <p className="text-metallic-light text-xs">{selectedAppointment.clients?.telefone}</p>
              </div>
              <div>
                <p className="text-metallic-light text-sm">Veículo</p>
                <p className="text-white font-medium">{selectedAppointment.vehicles?.placa}</p>
                <p className="text-metallic-light text-xs">
                  {selectedAppointment.vehicles?.marca} {selectedAppointment.vehicles?.modelo} - {selectedAppointment.vehicles?.cor}
                </p>
              </div>
              <div>
                <p className="text-metallic-light text-sm">Data/Hora</p>
                <p className="text-white font-medium">{formatDate(selectedAppointment.data_agendamento)}</p>
              </div>
              <div>
                <p className="text-metallic-light text-sm">Status</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                  {getStatusIcon(selectedAppointment.status)}
                  {selectedAppointment.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {selectedAppointment.servicos && Array.isArray(selectedAppointment.servicos) && selectedAppointment.servicos.length > 0 && (
              <div>
                <p className="text-metallic-light text-sm mb-2">Serviços</p>
                <div className="space-y-2">
                  {selectedAppointment.servicos.map((servico, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-dark-lighter rounded">
                      <span className="text-white">{servico.nome || 'Serviço sem nome'}</span>
                      {servico.valor > 0 && (
                        <span className="text-green-400 font-semibold">
                          R$ {parseFloat(servico.valor).toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-dark-lighter pt-4">
              <p className="text-metallic-light text-sm">Valor Total</p>
              <p className="text-3xl font-bold text-green-400">
                R$ {parseFloat(selectedAppointment.valor_estimado || 0).toFixed(2)}
              </p>
            </div>

            {selectedAppointment.observacoes && (
              <div>
                <p className="text-metallic-light text-sm">Observações</p>
                <p className="text-white">{selectedAppointment.observacoes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowDetailsModal(false)} variant="secondary" className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal QR Code */}
      {showQRModal && selectedQRCode && (
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

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={selectedQRCode.qrCodeImage}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-xs text-metallic-light text-center">
                {selectedQRCode.qr_code}
              </p>
            </div>

            <Button onClick={() => setShowQRModal(false)} variant="secondary" className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
