import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Building2, Plus, Edit, Trash2, Calendar, DollarSign } from 'lucide-react'

export default function Establishments() {
  const [establishments, setEstablishments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    status_pagamento: 'ativo',
    vencimento: '',
    valor: ''
  })

  useEffect(() => {
    fetchEstablishments()
  }, [])

  const fetchEstablishments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEstablishments(data || [])
    } catch (error) {
      console.error('Erro ao buscar estabelecimentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('establishments')
          .update(formData)
          .eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('establishments')
          .insert([formData])
        if (error) throw error
      }
      handleCloseModal()
      fetchEstablishments()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar estabelecimento.')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      nome: item.nome || '',
      cnpj: item.cnpj || '',
      status_pagamento: item.status_pagamento || 'ativo',
      vencimento: item.vencimento || '',
      valor: item.valor || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este estabelecimento?')) return
    try {
      const { error } = await supabase.from('establishments').delete().eq('id', id)
      if (error) throw error
      fetchEstablishments()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      alert('Erro ao deletar estabelecimento.')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    setFormData({ nome: '', cnpj: '', status_pagamento: 'ativo', vencimento: '', valor: '' })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-metallic-light">Carregando...</div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Estabelecimentos</h1>
            <p className="text-metallic-light">Gerencie seus estabelecimentos</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Estabelecimento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {establishments.map((est) => (
          <Card key={est.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-10 h-10 text-primary" />
                  <div>
                    <h3 className="font-bold text-white">{est.nome}</h3>
                    <p className="text-sm text-metallic-light">{est.cnpj}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  est.status_pagamento === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {est.status_pagamento}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {est.vencimento && (
                  <div className="flex items-center gap-2 text-sm text-metallic-light">
                    <Calendar className="w-4 h-4" />
                    <span>Vencimento: {new Date(est.vencimento).toLocaleDateString()}</span>
                  </div>
                )}
                {est.valor && (
                  <div className="flex items-center gap-2 text-sm text-metallic-light">
                    <DollarSign className="w-4 h-4" />
                    <span>R$ {parseFloat(est.valor).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(est)} className="flex-1 p-2 hover:bg-dark-lighter rounded-lg transition-colors text-primary flex items-center justify-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button onClick={() => handleDelete(est.id)} className="flex-1 p-2 hover:bg-dark-lighter rounded-lg transition-colors text-red-500 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {establishments.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 text-metallic-light mx-auto mb-4" />
            <p className="text-metallic-light text-lg">Nenhum estabelecimento cadastrado</p>
            <p className="text-metallic-light text-sm mt-2">Clique em "Novo Estabelecimento" para começar</p>
          </CardContent>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-light rounded-xl shadow-2xl max-w-md w-full border border-dark-lighter">
            <div className="p-6 border-b border-dark-lighter">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">Nome *</label>
                <input type="text" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">CNPJ</label>
                <input type="text" value={formData.cnpj} onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">Status</label>
                <select value={formData.status_pagamento} onChange={(e) => setFormData({ ...formData, status_pagamento: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">Vencimento</label>
                <input type="date" value={formData.vencimento} onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">Valor</label>
                <input type="number" step="0.01" value={formData.valor} onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1">{editingItem ? 'Salvar' : 'Cadastrar'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
