import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Car, Plus, Edit, Trash2, GripVertical } from 'lucide-react'

export default function VehicleCategories() {
  const { profile, isAdmin, isSuperAdmin } = usePermissions()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    ordem: 0,
    ativo: true
  })

  useEffect(() => {
    fetchCategories()
  }, [profile])

  const fetchCategories = async () => {
    try {
      setLoading(true)

      if (!profile?.establishment_id && !isSuperAdmin) {
        console.error('❌ Usuário sem establishment_id!')
        return
      }

      const { data, error } = await supabase
        .from('vehicle_categories')
        .select('*')
        .order('ordem', { ascending: true })

      console.log('🔍 DEBUG Categories - Dados:', data)
      console.log('🔍 DEBUG Categories - Erro:', error)

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!profile?.establishment_id) {
        alert('Erro: Você não está vinculado a nenhuma empresa.')
        return
      }

      const categoryData = {
        ...formData,
        establishment_id: profile.establishment_id
      }

      if (editingCategory) {
        const { error } = await supabase
          .from('vehicle_categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error
        alert('Categoria atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('vehicle_categories')
          .insert([categoryData])

        if (error) throw error
        alert('Categoria criada com sucesso!')
      }

      handleCloseModal()
      fetchCategories()
    } catch (error) {
      console.error('❌ Erro ao salvar categoria:', error)
      alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      nome: category.nome || '',
      ordem: category.ordem || 0,
      ativo: category.ativo !== false
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar os serviços existentes.')) return
    try {
      const { error } = await supabase
        .from('vehicle_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Categoria deletada com sucesso!')
      fetchCategories()
    } catch (error) {
      console.error('❌ Erro ao deletar categoria:', error)
      alert(`Erro ao deletar: ${error.message || 'Erro desconhecido'}`)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({ nome: '', ordem: 0, ativo: true })
  }

  // Drag and Drop Functions
  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = async (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return

    try {
      const newCategories = [...categories]
      const [draggedItem] = newCategories.splice(draggedIndex, 1)
      newCategories.splice(dropIndex, 0, draggedItem)

      // Atualizar ordem localmente primeiro (para UI responsiva)
      setCategories(newCategories)

      // Atualizar ordem no banco de dados
      const updates = newCategories.map((cat, index) => ({
        id: cat.id,
        ordem: index + 1
      }))

      // Atualizar cada categoria com a nova ordem
      for (const update of updates) {
        await supabase
          .from('vehicle_categories')
          .update({ ordem: update.ordem })
          .eq('id', update.id)
      }

      console.log('✅ Ordem atualizada com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao atualizar ordem:', error)
      // Recarregar categorias em caso de erro
      fetchCategories()
    } finally {
      setDraggedIndex(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-metallic-light">Carregando categorias...</div>
      </div>
    )
  }

  const activeCategories = categories.filter(c => c.ativo !== false)
  const inactiveCategories = categories.filter(c => c.ativo === false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Categorias de Veículos</h1>
            <p className="text-metallic-light">Gerencie as categorias para sua tabela de preços</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Total de Categorias</p>
                <p className="text-2xl font-bold text-white">{categories.length}</p>
              </div>
              <Car className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-metallic-light text-sm">Categorias Ativas</p>
                <p className="text-2xl font-bold text-green-400">{activeCategories.length}</p>
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
                <p className="text-metallic-light text-sm">Categorias Inativas</p>
                <p className="text-2xl font-bold text-red-400">{inactiveCategories.length}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias Ativas ({activeCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCategories.length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-metallic-light mx-auto mb-4" />
              <p className="text-metallic-light text-lg">Nenhuma categoria ativa</p>
              <p className="text-metallic-light text-sm mt-2">Clique em "Nova Categoria" para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCategories.map((category, index) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 bg-dark-lighter rounded-lg border border-dark-lighter hover:border-primary transition-all cursor-move ${
                    draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-5 h-5 text-metallic-light" />
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{category.nome}</h3>
                        <p className="text-sm text-metallic-light">Ordem: {category.ordem}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(category)
                        }}
                        className="p-2 hover:bg-dark rounded-lg transition-colors text-primary"
                        title="Editar categoria"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(category.id)
                        }}
                        className="p-2 hover:bg-dark rounded-lg transition-colors text-red-500"
                        title="Excluir categoria"
                      >
                        <Trash2 className="w-4 h-4" />
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
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-light rounded-xl shadow-2xl max-w-md w-full border border-dark-lighter">
            <div className="p-6 border-b border-dark-lighter">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-sm text-metallic-light mt-1">
                Ex: Pequeno, Médio, Grande ou Hatch, Sedan, SUV
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Ex: Pequeno, Médio, Grande"
                />
              </div>

              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="0"
                />
                <p className="text-xs text-metallic-light mt-1">
                  Número menor aparece primeiro na lista
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="ativo" className="text-metallic-light text-sm">
                  Categoria ativa
                </label>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span>
                    Você pode criar categorias personalizadas como "Pequeno", "Médio", "Grande"
                    ou manter as tradicionais "Hatch", "Sedan", "SUV", etc.
                  </span>
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  {editingCategory ? 'Salvar' : 'Criar Categoria'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
