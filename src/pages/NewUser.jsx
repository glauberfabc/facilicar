import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Users, ArrowLeft, Mail, Lock } from 'lucide-react'

export default function NewUser() {
  const navigate = useNavigate()
  const { profile, establishment, isAdmin } = usePermissions()
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    tipo: 'colaborador'
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validações básicas
    if (!profile?.establishment_id) {
      alert('Erro: Você não está vinculado a nenhuma empresa.')
      return
    }

    if (!isAdmin()) {
      alert('Erro: Apenas administradores podem criar novos usuários.')
      return
    }

    try {
      setLoading(true)

      // 1. Verificar limite de colaboradores
      const { count: currentCount, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('establishment_id', profile.establishment_id)
        .eq('role', 'colaborador')

      if (countError) throw countError

      const maxColaboradores = establishment?.max_colaboradores || 5

      if (currentCount >= maxColaboradores) {
        alert(`Limite de colaboradores atingido!\n\nVocê pode cadastrar no máximo ${maxColaboradores} colaboradores.\nAtualmente você tem ${currentCount} colaborador(es) cadastrado(s).\n\nEntre em contato com o suporte para aumentar o limite.`)
        setLoading(false)
        return
      }

      // 2. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            nome: formData.nome,
            tipo: formData.tipo
          }
        }
      })

      if (authError) throw new Error(`Erro ao criar usuário: ${authError.message}`)
      if (!authData.user) throw new Error('Usuário não foi criado no sistema de autenticação')

      // 3. Criar registro do usuário na tabela users
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone || null,
          role: formData.tipo,
          tipo: formData.tipo,
          establishment_id: profile.establishment_id,
          senha: formData.senha  // Senha definida no cadastro
        }])

      if (userError) throw new Error(`Erro ao salvar dados do usuário: ${userError.message}`)

      // 4. Mostrar mensagem de sucesso
      alert(`✅ Usuário criado com sucesso!\n\nNome: ${formData.nome}\nEmail: ${formData.email}\nSenha: ${formData.senha}\nTipo: ${formData.tipo}\n\nO usuário já pode fazer login no sistema com o email e senha informados.`)

      // Redirecionar para lista de usuários
      navigate('/usuarios')

    } catch (error) {
      console.error('Erro completo:', error)
      alert(`Erro ao criar usuário:\n${error.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/usuarios')} className="p-2 hover:bg-dark-lighter rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-metallic-light" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Novo Usuário</h1>
            <p className="text-metallic-light">Cadastre um novo usuário do sistema</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-primary flex items-center gap-2">
              <Users className="w-4 h-4" />
              O novo usuário receberá as credenciais de acesso (email e senha) para fazer login no sistema.
            </p>
            {establishment && (
              <p className="text-xs text-metallic-light mt-2">
                Limite de colaboradores: {establishment.max_colaboradores || 5}
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">Nome Completo *</label>
              <input type="text" required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="Digite o nome completo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="email@exemplo.com" />
              </div>

              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Senha *
                </label>
                <input type="password" required value={formData.senha} onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="Mínimo 6 caracteres" minLength="6" />
              </div>
            </div>

            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">Telefone</label>
              <input type="tel" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="(00) 00000-0000" />
            </div>

            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">Tipo *</label>
              <select required value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary">
                <option value="colaborador">Colaborador</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="text-xs text-metallic-light mt-1">
                {formData.tipo === 'colaborador' ? 'Acesso padrão ao sistema' : 'Acesso completo com permissões de gerenciamento'}
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => navigate('/usuarios')} className="flex-1">Cancelar</Button>
              <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
