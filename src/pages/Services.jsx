import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Wrench, Plus, Edit, Trash2, Clock, DollarSign, Car, Settings } from 'lucide-react'

export default function Services() {
  const { profile } = usePermissions()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([]) // Categorias dinâmicas do banco
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // FormData agora inclui preços por categoria
  const [formData, setFormData] = useState({
    nome: '',
    tempo_estimado: '',
    descricao: '',
    ativo: true,
    precos: {} // { 'Hatch': 50, 'Sedan': 60, ... }
  })

  useEffect(() => {
    fetchCategories()
    fetchServices()
  }, [profile])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error)
        // Se der erro, usar categorias padrão como fallback
        setCategories([
          { nome: 'Hatch' },
          { nome: 'Sedan' },
          { nome: 'SUV' },
          { nome: 'Caminhonete' },
          { nome: 'Moto' },
          { nome: 'Van' },
          { nome: 'Pickup' }
        ])
        return
      }

      setCategories(data || [])
      console.log('🔍 DEBUG Services - Categorias carregadas:', data?.length || 0)
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error)
    }
  }

  const fetchServices = async () => {
    try {
      setLoading(true)

      // Buscar serviços com seus preços por categoria
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_prices (
            id,
            categoria,
            valor
          )
        `)
        .order('nome', { ascending: true })

      console.log('🔍 DEBUG Services - Dados retornados:', data)
      console.log('🔍 DEBUG Services - Erro:', error)

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar serviços:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      console.log('🔍 DEBUG Services - Salvando:', editingItem ? 'UPDATE' : 'INSERT')
      console.log('🔍 DEBUG Services - FormData:', formData)
      console.log('🔍 DEBUG Services - Establishment ID:', profile?.establishment_id)

      if (!profile?.establishment_id) {
        alert('Erro: Você não está vinculado a nenhuma empresa.')
        return
      }

      // Dados do serviço (sem preços)
      const serviceData = {
        nome: formData.nome,
        tempo_estimado: formData.tempo_estimado || null,
        descricao: formData.descricao || null,
        ativo: formData.ativo,
        establishment_id: profile.establishment_id
      }

      if (editingItem) {
        // ===== EDITAR SERVIÇO EXISTENTE =====
        console.log('🔍 DEBUG Services - Editando ID:', editingItem.id)

        // 1. Atualizar dados do serviço
        const { error: serviceError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingItem.id)

        if (serviceError) throw serviceError

        // 2. Atualizar preços por categoria
        for (const category of categories) {
          const categoria = category.nome
          const valor = parseFloat(formData.precos[categoria] || 0)

          // Verificar se já existe preço para esta categoria
          const { data: existingPrice } = await supabase
            .from('service_prices')
            .select('id')
            .eq('service_id', editingItem.id)
            .eq('categoria', categoria)
            .single()

          if (existingPrice) {
            // Atualizar
            await supabase
              .from('service_prices')
              .update({ valor })
              .eq('id', existingPrice.id)
          } else {
            // Criar
            await supabase
              .from('service_prices')
              .insert([{
                service_id: editingItem.id,
                categoria,
                valor,
                establishment_id: profile.establishment_id
              }])
          }
        }

        alert('Serviço atualizado com sucesso!')
      } else {
        // ===== CRIAR NOVO SERVIÇO =====

        // 1. Criar serviço
        const { data: newService, error: serviceError } = await supabase
          .from('services')
          .insert([serviceData])
          .select()
          .single()

        console.log('🔍 DEBUG Services - Novo serviço criado:', newService)

        if (serviceError) throw serviceError
        if (!newService) throw new Error('Serviço criado mas dados não retornados')

        // 2. Criar preços para cada categoria
        const precosData = categories.map(category => ({
          service_id: newService.id,
          categoria: category.nome,
          valor: parseFloat(formData.precos[category.nome] || 0),
          establishment_id: profile.establishment_id
        }))

        const { error: pricesError } = await supabase
          .from('service_prices')
          .insert(precosData)

        if (pricesError) throw pricesError

        alert('Serviço cadastrado com sucesso!')
      }

      handleCloseModal()
      fetchServices()
    } catch (error) {
      console.error('❌ Erro completo ao salvar serviço:', error)
      alert(`Erro ao salvar serviço: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)

    // Converter array de service_prices em objeto { categoria: valor }
    const precos = {}
    if (item.service_prices && Array.isArray(item.service_prices)) {
      item.service_prices.forEach(price => {
        precos[price.categoria] = price.valor
      })
    }

    // Se alguma categoria não tiver preço, inicializar com 0
    categories.forEach(category => {
      if (!precos[category.nome]) precos[category.nome] = 0
    })

    setFormData({
      nome: item.nome || '',
      tempo_estimado: item.tempo_estimado || '',
      descricao: item.descricao || '',
      ativo: item.ativo !== false,
      precos
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este serviço? Os preços associados também serão removidos.')) return
    try {
      console.log('🔍 DEBUG Services - Deletando serviço ID:', id)
      const { error } = await supabase.from('services').delete().eq('id', id)
      if (error) {
        console.error('❌ Erro ao deletar:', error)
        throw error
      }
      console.log('✅ Serviço deletado com sucesso')
      alert('Serviço deletado com sucesso!')
      fetchServices()
    } catch (error) {
      console.error('❌ Erro completo ao deletar:', error)
      alert(`Erro ao deletar serviço: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)

    // Resetar form com preços zerados para todas as categorias
    const precosZerados = {}
    categories.forEach(category => { precosZerados[category.nome] = 0 })

    setFormData({
      nome: '',
      tempo_estimado: '',
      descricao: '',
      ativo: true,
      precos: precosZerados
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-metallic-light">Carregando serviços...</div>
    </div>
  }

  const activeServices = services.filter(s => s.ativo !== false)
  const inactiveServices = services.filter(s => s.ativo === false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tabela de Serviços</h1>
            <p className="text-metallic-light">Gerencie os serviços oferecidos</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total de Serviços</p>
                <p className="text-2xl font-bold text-white">{services.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Serviços Ativos</p>
                <p className="text-2xl font-bold text-green-400">{activeServices.length}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Serviços Inativos</p>
                <p className="text-2xl font-bold text-red-400">{inactiveServices.length}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {activeServices.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhum serviço ativo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeServices.map((service) => (
                <div key={service.id} className="p-4 bg-dark-lighter rounded-lg border border-dark-lighter">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{service.nome}</h3>
                      {service.descricao && (
                        <p className="text-sm text-metallic-light mb-2">{service.descricao}</p>
                      )}
                      {service.tempo_estimado && (
                        <div className="flex items-center gap-2 text-sm text-metallic-light mb-3">
                          <Clock className="w-4 h-4" />
                          <span>{service.tempo_estimado} minutos</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preços por Categoria */}
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-2">
                      <Car className="w-3 h-3" />
                      <span>Preços por Categoria:</span>
                    </div>
                    {service.service_prices && service.service_prices.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1">
                        {service.service_prices.map((price) => (
                          <div key={price.id} className="flex justify-between items-center text-xs bg-dark/50 px-2 py-1 rounded">
                            <span className="text-metallic-light">{price.categoria}:</span>
                            <span className="font-semibold text-green-400">R$ {parseFloat(price.valor).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-metallic-light italic">Nenhum preço configurado</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(service)} className="flex-1 p-2 hover:bg-dark rounded-lg transition-colors text-primary text-sm flex items-center justify-center gap-1">
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button onClick={() => handleDelete(service.id)} className="flex-1 p-2 hover:bg-dark rounded-lg transition-colors text-red-500 text-sm flex items-center justify-center gap-1">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-light rounded-xl shadow-2xl max-w-3xl w-full border border-dark-lighter max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-lighter sticky top-0 bg-dark-light z-10">
              <h2 className="text-xl font-bold text-white">{editingItem ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <p className="text-sm text-metallic-light mt-1">Configure o nome, descrição e preços por categoria de veículo</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-dark-lighter pb-2">
                  Dados Básicos
                </h3>
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Nome do Serviço *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="Ex: Lavagem Completa"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-metallic-light text-sm font-medium mb-2">Tempo Estimado (minutos)</label>
                    <input
                      type="number"
                      value={formData.tempo_estimado}
                      onChange={(e) => setFormData({ ...formData, tempo_estimado: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                      placeholder="30"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="ativo"
                        checked={formData.ativo}
                        onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-metallic-light text-sm">Serviço ativo</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-metallic-light text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="Descrição opcional do serviço"
                  ></textarea>
                </div>
              </div>

              {/* Preços por Categoria */}
              <div className="space-y-4 pt-4 border-t border-dark-lighter">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-white">Preços por Categoria de Veículo</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/categorias-veiculos'}
                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Gerenciar Categorias
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-8 bg-dark-lighter rounded-lg border border-dark-lighter">
                    <Car className="w-12 h-12 text-metallic-light mx-auto mb-3" />
                    <p className="text-metallic-light text-sm mb-3">Nenhuma categoria criada</p>
                    <button
                      type="button"
                      onClick={() => window.location.href = '/categorias-veiculos'}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Criar Categorias →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <div key={category.id || category.nome} className="p-3 bg-dark-lighter rounded-lg border border-dark-lighter">
                        <label className="block text-metallic-light text-sm font-medium mb-2">
                          {category.nome}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 font-semibold">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={formData.precos[category.nome] || ''}
                            onChange={(e) => setFormData({
                              ...formData,
                              precos: { ...formData.precos, [category.nome]: e.target.value }
                            })}
                            className="w-full pl-10 pr-4 py-2 bg-dark border border-dark rounded-lg text-white focus:outline-none focus:border-primary"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mt-3">
                  <p className="text-xs text-primary flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <span>Configure preços diferentes para cada tipo de veículo. Por exemplo, SUVs costumam ter preços maiores que Hatchs.</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">{editingItem ? 'Salvar Alterações' : 'Cadastrar Serviço'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
