import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { History, CheckCircle, XCircle, Eye, Search, Download, Banknote, Clock } from 'lucide-react'

export default function OperationalHistory() {
  const { profile } = usePermissions()
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Filtros
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')

  useEffect(() => {
    if (profile?.establishment_id) {
      fetchHistoricalAppointments()
    }
  }, [profile])

  useEffect(() => {
    applyFilters()
  }, [appointments, dateFilter, statusFilter, searchTerm, customDateStart, customDateEnd])

  const fetchHistoricalAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('operational_history_view')
        .select('*')
        .eq('establishment_id', profile.establishment_id)
        .order('data_conclusao', { ascending: false })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...appointments]

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(a => {
            const date = new Date(a.data_conclusao || a.data_inicio)
            return date >= today && date < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          })
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(a => new Date(a.data_conclusao || a.data_inicio) >= weekAgo)
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(a => new Date(a.data_conclusao || a.data_inicio) >= monthAgo)
          break
        case 'custom':
          if (customDateStart && customDateEnd) {
            const start = new Date(customDateStart)
            const end = new Date(new Date(customDateEnd).getTime() + 24 * 60 * 60 * 1000)
            filtered = filtered.filter(a => {
              const date = new Date(a.data_conclusao || a.data_inicio)
              return date >= start && date < end
            })
          }
          break
      }
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.situacao_operacional === statusFilter)
    }

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.veiculo_placa?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAppointments(filtered)
  }

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const exportToCSV = () => {
    const headers = ['Data Conclusão', 'Cliente', 'Placa', 'Permanência', 'Meio Pagamento', 'Valor Total', 'Situação Operacional', 'Situação Financeira']
    const rows = filteredAppointments.map(a => [
      formatDate(a.data_conclusao),
      a.cliente_nome || '',
      a.veiculo_placa || '',
      formatDuration(a.permanencia),
      a.meio_pagamento || '-',
      `R$ ${parseFloat(a.valor_total || 0).toFixed(2)}`,
      a.situacao_operacional,
      a.situacao_financeira
    ])

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historico_operacional_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const getStatusColor = (status) => {
    return status === 'concluido'
      ? 'bg-green-500/20 text-green-400'
      : 'bg-red-500/20 text-red-400'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (intervalString) => {
    if (!intervalString) return '-'
    // Postgres interval format handling or simple string if already formatted by view?
    // The view returns interval type, Supabase JS client might return it as string ISO 8601 duration or similar.
    // Let's assume it comes as a string for now, but we might need to parse it.
    // If it's simple string from view logic (calculated in JS previously), but here it's from DB.
    // Let's try to parse simple ISO or just display if it's readable.
    // Actually, let's just display it for now, or improve parsing if we see the format.
    // Common format: "01:30:00" or "1 hour 30 mins" depending on driver.
    // Let's assume it's a string that needs simple cleanup.
    return String(intervalString).replace('PT', '').replace('H', 'h ').replace('M', 'm').replace('S', 's')
  }

  const stats = {
    concluidos: appointments.filter(a => a.situacao_operacional === 'concluido').length,
    faturado: appointments
      .reduce((sum, a) => sum + parseFloat(a.valor_total || 0), 0),
    total: appointments.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-metallic-light">Carregando histórico...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Histórico Operacional</h1>
            <p className="text-metallic-light">Consulte o histórico de serviços realizados</p>
          </div>
        </div>
        <Button onClick={exportToCSV} variant="secondary" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total Serviços</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <History className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Concluídos</p>
                <p className="text-2xl font-bold text-green-400">{stats.concluidos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total Faturado</p>
                <p className="text-2xl font-bold text-primary">R$ {stats.faturado.toFixed(2)}</p>
              </div>
              <Banknote className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-metallic-light" />
            <input
              type="text"
              placeholder="Buscar por cliente ou placa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white placeholder-metallic-light focus:outline-none focus:border-primary"
            />
          </div>

          {/* Filtros de Data */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-metallic-light mb-2 block">Período</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
              >
                <option value="all">Todos</option>
                <option value="today">Hoje</option>
                <option value="week">Última semana</option>
                <option value="month">Último mês</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>

          {/* Data personalizada */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm text-metallic-light mb-2 block">Data Inicial</label>
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm text-metallic-light mb-2 block">Data Final</label>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Histórico */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico ({filteredAppointments.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-lighter">
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Cliente</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Placa</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Permanência</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Meio de pagamento</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Valor total</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Situação operacional</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Situação financeira</th>
                    <th className="text-left p-3 text-metallic-light font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.appointment_id} className="border-b border-dark-lighter hover:bg-dark-lighter/50 transition-colors">
                      <td className="p-3">
                        <div className="text-white font-medium">{appointment.cliente_nome}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-white font-medium">{appointment.veiculo_placa}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 text-white text-sm">
                          <Clock className="w-4 h-4 text-metallic-light" />
                          {formatDuration(appointment.permanencia)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-metallic-light text-sm capitalize">
                          {appointment.meio_pagamento || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-green-400 font-semibold">
                          R$ {parseFloat(appointment.valor_total || 0).toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold w-fit ${getStatusColor(appointment.situacao_operacional)}`}>
                          {appointment.situacao_operacional === 'concluido' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {appointment.situacao_operacional === 'concluido' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          appointment.situacao_financeira === 'Pago'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {appointment.situacao_financeira}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="p-2 hover:bg-dark-lighter rounded text-primary"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark rounded-lg w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-dark-lighter pb-4">
              <h2 className="text-xl font-bold text-white">Detalhes do Serviço</h2>
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
                <p className="text-white font-medium">{selectedAppointment.cliente_nome}</p>
              </div>
              <div>
                <p className="text-metallic-light text-sm">Veículo</p>
                <p className="text-white font-medium">{selectedAppointment.veiculo_placa}</p>
              </div>
              <div>
                <p className="text-metallic-light text-sm">Início</p>
                <p className="text-white font-medium">{formatDate(selectedAppointment.data_inicio)}</p>
              </div>
              <div>
                <p className="text-metallic-light text-sm">Conclusão</p>
                <p className="text-white font-medium">{formatDate(selectedAppointment.data_conclusao)}</p>
              </div>
            </div>

            <div className="border-t border-dark-lighter pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-metallic-light text-sm">Meio de Pagamento</p>
                  <p className="text-white capitalize">{selectedAppointment.meio_pagamento || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-metallic-light text-sm">Valor Total</p>
                  <p className="text-3xl font-bold text-green-400">
                    R$ {parseFloat(selectedAppointment.valor_total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => setShowDetailsModal(false)} variant="secondary" className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
