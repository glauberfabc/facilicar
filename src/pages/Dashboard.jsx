import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Car, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    green: 'text-green-400 bg-green-400/10',
    red: 'text-red-400 bg-red-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    yellow: 'text-yellow-400 bg-yellow-400/10',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-metallic-light mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            {trend && (
              <p className={`text-sm mt-2 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {trend === 'up' ? '↗' : '↘'} {trendValue}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const Dashboard = () => {
  const { profile } = usePermissions()
  const [dateFilter, setDateFilter] = useState('today')
  const [customDateStart, setCustomDateStart] = useState('')
  const [customDateEnd, setCustomDateEnd] = useState('')
  const [loading, setLoading] = useState(true)

  // Estados para dados
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidOrders: 0,
    canceledOrders: 0,
    carsInYard: 0,
    revenueChange: 0,
    paidChange: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [servicesData, setServicesData] = useState([])

  useEffect(() => {
    if (profile?.establishment_id) {
      fetchDashboardData()
    }
  }, [profile, dateFilter, customDateStart, customDateEnd])

  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let startDate, endDate

    switch (dateFilter) {
      case 'today':
        startDate = today
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'yesterday':
        startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        endDate = today
        break
      case 'last7days':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'custom':
        if (customDateStart && customDateEnd) {
          startDate = new Date(customDateStart)
          endDate = new Date(new Date(customDateEnd).getTime() + 24 * 60 * 60 * 1000)
        } else {
          startDate = today
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
        break
      default:
        startDate = today
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }

    return { startDate, endDate }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const { startDate, endDate } = getDateRange()

      // Buscar agendamentos do período
      const { data: appointmentsData, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('establishment_id', profile.establishment_id)
        .gte('data_agendamento', startDate.toISOString())
        .lt('data_agendamento', endDate.toISOString())

      if (error) throw error

      setAppointments(appointmentsData || [])

      // Calcular estatísticas
      const totalRevenue = appointmentsData
        ?.filter(a => a.status === 'concluido')
        .reduce((sum, a) => sum + parseFloat(a.valor_estimado || 0), 0) || 0

      const paidOrders = appointmentsData?.filter(a => a.status === 'concluido').length || 0
      const canceledOrders = appointmentsData?.filter(a => a.status === 'cancelado').length || 0
      const carsInYard = appointmentsData?.filter(a => a.status === 'em_andamento').length || 0

      setStats({
        totalRevenue,
        paidOrders,
        canceledOrders,
        carsInYard,
        revenueChange: 12.5, // TODO: Calcular variação real
        paidChange: paidOrders - canceledOrders
      })

      // Preparar dados para gráfico de linha (últimos 30 dias)
      await fetchRevenueChart()

      // Preparar dados para gráfico de pizza (distribuição de serviços)
      await fetchServicesDistribution()

    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRevenueChart = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('appointments')
        .select('data_agendamento, valor_estimado, status')
        .eq('establishment_id', profile.establishment_id)
        .eq('status', 'concluido')
        .gte('data_agendamento', startDate.toISOString())
        .lte('data_agendamento', endDate.toISOString())
        .order('data_agendamento', { ascending: true })

      if (error) throw error

      // Agrupar por dia
      const revenueByDay = {}
      data?.forEach(appointment => {
        const date = new Date(appointment.data_agendamento).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit'
        })
        revenueByDay[date] = (revenueByDay[date] || 0) + parseFloat(appointment.valor_estimado || 0)
      })

      const chartData = Object.keys(revenueByDay).map(date => ({
        data: date,
        faturamento: revenueByDay[date]
      }))

      setRevenueData(chartData)
    } catch (error) {
      console.error('❌ Erro ao buscar dados do gráfico de faturamento:', error)
    }
  }

  const fetchServicesDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('servicos, status')
        .eq('establishment_id', profile.establishment_id)
        .eq('status', 'concluido')

      if (error) throw error

      // Contar serviços
      const serviceCounts = {}
      data?.forEach(appointment => {
        if (appointment.servicos && Array.isArray(appointment.servicos)) {
          appointment.servicos.forEach(servico => {
            const name = typeof servico === 'object' ? servico.nome : 'Serviço sem nome'
            serviceCounts[name] = (serviceCounts[name] || 0) + 1
          })
        }
      })

      const chartData = Object.keys(serviceCounts).map(name => ({
        name,
        value: serviceCounts[name]
      }))

      setServicesData(chartData)
    } catch (error) {
      console.error('❌ Erro ao buscar distribuição de serviços:', error)
    }
  }

  const COLORS = ['#00E396', '#008FFB', '#FEB019', '#FF4560', '#775DD0', '#3F51B5']

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-metallic-light">Carregando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-metallic-light">Visão geral do seu negócio</p>
      </div>

      {/* Filtros de Data */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-metallic-light" />
              <span className="text-sm font-semibold text-white">Período:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === 'today' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('today')}
                className="text-sm px-4 py-2"
              >
                Hoje
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('yesterday')}
                className="text-sm px-4 py-2"
              >
                Ontem
              </Button>
              <Button
                variant={dateFilter === 'last7days' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('last7days')}
                className="text-sm px-4 py-2"
              >
                Últimos 7 dias
              </Button>
              <Button
                variant={dateFilter === 'custom' ? 'primary' : 'ghost'}
                onClick={() => setDateFilter('custom')}
                className="text-sm px-4 py-2"
              >
                Personalizado
              </Button>
            </div>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={customDateStart}
                  onChange={(e) => setCustomDateStart(e.target.value)}
                  className="px-3 py-2 bg-dark border border-dark-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-metallic-light">até</span>
                <input
                  type="date"
                  value={customDateEnd}
                  onChange={(e) => setCustomDateEnd(e.target.value)}
                  className="px-3 py-2 bg-dark border border-dark-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Faturamento Total"
          value={`R$ ${stats.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          trend={stats.revenueChange >= 0 ? 'up' : 'down'}
          trendValue={`${stats.revenueChange >= 0 ? '+' : ''}${stats.revenueChange.toFixed(1)}%`}
          color="primary"
        />
        <StatCard
          title="OS Concluídas"
          value={stats.paidOrders.toString()}
          icon={CheckCircle}
          trend={stats.paidChange >= 0 ? 'up' : 'down'}
          trendValue={`${stats.paidChange >= 0 ? '+' : ''}${stats.paidChange}`}
          color="green"
        />
        <StatCard
          title="OS Canceladas"
          value={stats.canceledOrders.toString()}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Carros em Serviço"
          value={stats.carsInYard.toString()}
          icon={Car}
          color="yellow"
        />
      </div>

      {/* Área de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Faturamento */}
        <Card>
          <CardHeader>
            <CardTitle>Faturamento dos Últimos 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="data" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#FFF'
                    }}
                    formatter={(value) => `R$ ${parseFloat(value).toFixed(2)}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="faturamento"
                    stroke="#00E396"
                    strokeWidth={2}
                    dot={{ fill: '#00E396', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-metallic-light">
                Nenhum dado de faturamento disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Serviços */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {servicesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={servicesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {servicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#FFF'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-metallic-light">
                Nenhum serviço realizado no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
