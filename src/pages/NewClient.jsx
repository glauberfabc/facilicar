import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { UserCircle, ArrowLeft } from 'lucide-react'

export default function NewClient() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    cpf: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('clients').insert([formData])
      if (error) throw error
      alert('Cliente cadastrado com sucesso!')
      navigate('/clientes')
    } catch (error) {
      console.error('Erro ao cadastrar:', error)
      alert('Erro ao cadastrar cliente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clientes')} className="p-2 hover:bg-dark-lighter rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-metallic-light" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <UserCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Novo Cliente</h1>
            <p className="text-metallic-light">Cadastre um novo cliente</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">Nome Completo *</label>
              <input type="text" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="Digite o nome completo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">Telefone</label>
                <input type="tel" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">CPF</label>
                <input type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="000.000.000-00" />
              </div>
            </div>
            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">Email</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="cliente@email.com" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/clientes')} className="flex-1">Cancelar</Button>
              <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
