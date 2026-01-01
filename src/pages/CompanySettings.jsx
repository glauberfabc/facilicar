import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Building2, Save, MapPin, Phone, Mail } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export default function CompanySettings() {
  const { profile, establishment, isAdmin, isSuperAdmin, loading: permLoading } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    responsavel: '',
    cnpj: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    bairro: '',
    cidade: '',
    estado: '',
    logo_url: ''
  })

  useEffect(() => {
    if (!permLoading && profile?.establishment_id) {
      fetchEstablishmentData()
    }
  }, [permLoading, profile])

  const fetchEstablishmentData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .eq('id', profile.establishment_id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          nome: data.nome || '',
          responsavel: data.responsavel || '',
          cnpj: data.cnpj || '',
          telefone: data.telefone || '',
          email: data.email || '',
          cep: data.cep || '',
          endereco: data.endereco || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          logo_url: data.logo_url || ''
        })
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e) => {
    try {
      setUploading(true)
      const file = e.target.files[0]
      if (!file) return

      // Validar tipo e tamanho
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem.')
        return
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('A imagem deve ter no máximo 2MB.')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.establishment_id}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Upload para o bucket 'empresa'
      const { error: uploadError } = await supabase.storage
        .from('empresa')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('empresa')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, logo_url: publicUrl }))
      alert('Logo carregada com sucesso! Clique em Salvar para confirmar.')

    } catch (error) {
      console.error('Erro ao fazer upload da logo:', error)
      alert('Erro ao fazer upload da logo. Verifique se o bucket "empresa" existe e está configurado como público.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase
        .from('establishments')
        .update(formData)
        .eq('id', profile.establishment_id)

      if (error) throw error

      alert('Dados da empresa atualizados com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar dados da empresa.')
    } finally {
      setSaving(false)
    }
  }

  const fetchAddressByCEP = async () => {
    if (!formData.cep || formData.cep.length < 8) return

    try {
      const cep = formData.cep.replace(/\D/g, '')
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }))
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  // Redirecionar se não for admin
  if (!permLoading && !isAdmin() && !isSuperAdmin()) {
    return <Navigate to="/dashboard" replace />
  }

  if (loading || permLoading) {
    return <div className="flex items-center justify-center h-64">
      <div className="text-metallic-light">Carregando...</div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dados da Empresa</h1>
          <p className="text-metallic-light">Configure as informações do seu estabelecimento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo da Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Logo da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-lg bg-dark-lighter border-2 border-dashed border-metallic-light flex items-center justify-center overflow-hidden relative group">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo da empresa"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Building2 className="w-8 h-8 text-metallic-light mx-auto mb-2" />
                    <span className="text-xs text-metallic-light">Sem logo</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Alterar Logo
                </label>
                <p className="text-xs text-metallic-light mb-4">
                  Recomendado: Imagem quadrada (PNG ou JPG), máx. 2MB.
                </p>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={`
                      inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                      bg-dark-lighter text-white border border-dark-lighter
                      hover:bg-dark-lighter/80 cursor-pointer transition-colors
                      ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="Nome fantasia ou razão social"
              />
            </div>

            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">
                Nome do Responsável
              </label>
              <input
                type="text"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="Nome do responsável pela empresa"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  CNPJ (opcional)
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="00.000.000/0000-00"
                  maxLength="18"
                />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-metallic-light" />
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">
                Email (opcional)
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-metallic-light" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  onBlur={fetchAddressByCEP}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                  placeholder="00000-000"
                  maxLength="9"
                />
                <p className="text-xs text-metallic-light mt-1">
                  Preenche automaticamente o endereço
                </p>
              </div>
            </div>

            <div>
              <label className="block text-metallic-light text-sm font-medium mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                placeholder="Rua, Avenida, número"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-metallic-light text-sm font-medium mb-2">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-lighter border border-dark-lighter rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex items-center gap-2 px-8"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  )
}
