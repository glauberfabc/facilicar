import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SearchableSelect } from '../components/ui/SearchableSelect'
import { MultiSelect } from '../components/ui/MultiSelect'
import { ArrowLeft, Check, ChevronRight, Plus, Trash2, Info } from 'lucide-react'

export default function NewProduct() {
    const { profile } = usePermissions()
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Data for dropdowns
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])
    const [services, setServices] = useState([])

    // Form Data
    const [formData, setFormData] = useState({
        nome: '',
        ativo: true,
        brand_id: '',
        category_id: '',
        application: '',
        unit_of_measure: 'un',
        unit_quantity: 1,
        current_stock: 0,
        min_stock: 0,
        consumption: [] // Array of { service_id, quantity, unit }
    })

    useEffect(() => {
        fetchDropdownData()
    }, [])

    const fetchDropdownData = async () => {
        const { data: b } = await supabase.from('product_brands').select('*').order('name')
        if (b) setBrands(b)

        const { data: c } = await supabase.from('product_categories').select('*').order('name')
        if (c) setCategories(c)

        const { data: s } = await supabase.from('services').select('*').eq('ativo', true).order('nome')
        if (s) setServices(s)
    }

    const handleAddConsumption = () => {
        setFormData({
            ...formData,
            consumption: [...formData.consumption, { service_id: '', quantity: 0, unit: 'ml' }]
        })
    }

    const handleRemoveConsumption = (index) => {
        const newConsumption = [...formData.consumption]
        newConsumption.splice(index, 1)
        setFormData({ ...formData, consumption: newConsumption })
    }

    const handleConsumptionChange = (index, field, value) => {
        const newConsumption = [...formData.consumption]
        newConsumption[index][field] = value
        setFormData({ ...formData, consumption: newConsumption })
    }

    const handleSubmit = async () => {
        if (!profile?.establishment_id) return alert('Erro: Sem estabelecimento vinculado')

        try {
            setLoading(true)

            // 1. Create Product
            const { data: product, error: prodError } = await supabase
                .from('products')
                .insert([{
                    nome: formData.nome,
                    ativo: formData.ativo,
                    brand_id: formData.brand_id || null,
                    category_id: formData.category_id || null,
                    application: formData.application,
                    unit_of_measure: formData.unit_of_measure,
                    unit_quantity: formData.unit_quantity,
                    current_stock: formData.current_stock,
                    min_stock: formData.min_stock,
                    establishment_id: profile.establishment_id
                }])
                .select()
                .single()

            if (prodError) throw prodError

            // 2. Create Product Services (Consumption)
            if (formData.consumption.length > 0) {
                const consumptionData = formData.consumption
                    .filter(c => c.service_id && c.quantity > 0)
                    .map(c => ({
                        product_id: product.id,
                        service_id: c.service_id,
                        quantity: c.quantity,
                        unit: c.unit
                    }))

                if (consumptionData.length > 0) {
                    const { error: consError } = await supabase
                        .from('product_services')
                        .insert(consumptionData)

                    if (consError) throw consError
                }
            }

            alert('Produto cadastrado com sucesso!')
            navigate('/produtos')

        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar produto: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/produtos')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-white">Cadastrar Produto</h1>
                    <p className="text-metallic-light">Passo {step} de 3</p>
                </div>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center gap-2 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`flex-1 h-2 rounded-full ${i <= step ? 'bg-primary' : 'bg-dark-lighter'}`} />
                ))}
            </div>

            <Card>
                <CardContent className="p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-4">Informações Básicas</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-sm text-metallic-light block mb-1">Nome do Produto *</label>
                                    <input
                                        type="text"
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <SearchableSelect
                                        label="Marca"
                                        options={brands.map(b => ({ value: b.id, label: b.name }))}
                                        value={formData.brand_id}
                                        onChange={(val) => setFormData({ ...formData, brand_id: val })}
                                        placeholder="Selecione a marca..."
                                    />
                                </div>

                                <div>
                                    <SearchableSelect
                                        label="Categoria"
                                        options={categories.map(c => ({ value: c.id, label: c.name, group: c.category_type }))}
                                        value={formData.category_id}
                                        onChange={(val) => setFormData({ ...formData, category_id: val })}
                                        placeholder="Selecione a categoria..."
                                    />
                                </div>

                                <div>
                                    <MultiSelect
                                        label="Aplicação"
                                        options={[
                                            "CAIXA DE RODAS", "CHASSI", "ESTOFADO DE COURO", "ESTOFADO DE TECIDO",
                                            "FARÓIS", "MOTOR", "MOTOS", "PLÁSTICO INTERNO", "PLÁSTICO EXTERNO",
                                            "PNEUS", "RODAS", "TECIDO DE COURO", "USO INTERNO", "USO EXTERNO", "VIDRO"
                                        ].map(opt => ({ value: opt, label: opt }))}
                                        value={formData.application ? formData.application.split(',').filter(Boolean) : []}
                                        onChange={(val) => setFormData({ ...formData, application: val.join(',') })}
                                        placeholder="Selecione as aplicações..."
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-metallic-light block mb-1">Status</label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.ativo}
                                            onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-white">Ativo</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-metallic-light block mb-1">Unidade de Medida</label>
                                    <select
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                        value={formData.unit_of_measure}
                                        onChange={e => setFormData({ ...formData, unit_of_measure: e.target.value })}
                                    >
                                        <option value="un">Unidade (un)</option>
                                        <option value="ml">Mililitros (ml)</option>
                                        <option value="l">Litros (l)</option>
                                        <option value="g">Gramas (g)</option>
                                        <option value="kg">Quilogramas (kg)</option>
                                    </select>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <label className="text-sm text-metallic-light">Qtd. por Item</label>
                                        <div className="relative group">
                                            <Info className="w-4 h-4 text-metallic-light cursor-help" />
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-dark-light border border-dark-lighter rounded shadow-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                                                Peso líquido ou conteúdo que se encontra na embalagem. Ex: 1.500ml
                                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-dark-lighter"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                        value={formData.unit_quantity}
                                        onChange={e => setFormData({ ...formData, unit_quantity: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-4">Estoque</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-metallic-light block mb-1">Estoque Atual</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                        value={formData.current_stock}
                                        onChange={e => setFormData({ ...formData, current_stock: e.target.value })}
                                    />
                                    <p className="text-xs text-metallic-light mt-1">
                                        Total: {(formData.current_stock * formData.unit_quantity).toFixed(2)} {formData.unit_of_measure}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm text-metallic-light block mb-1">Estoque Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                        value={formData.min_stock}
                                        onChange={e => setFormData({ ...formData, min_stock: e.target.value })}
                                    />
                                    <p className="text-xs text-metallic-light mt-1">
                                        Alerta quando atingir: {(formData.min_stock * formData.unit_quantity).toFixed(2)} {formData.unit_of_measure}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-white mb-4">Consumo por Serviço</h2>
                            <p className="text-metallic-light text-sm mb-4">Defina quanto deste produto é consumido em cada serviço.</p>

                            {formData.consumption.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end bg-dark-lighter p-3 rounded">
                                    <div className="flex-1">
                                        <label className="text-xs text-metallic-light block mb-1">Serviço</label>
                                        <select
                                            className="w-full bg-dark border border-dark rounded p-2 text-white"
                                            value={item.service_id}
                                            onChange={e => handleConsumptionChange(index, 'service_id', e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {services.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <label className="text-xs text-metallic-light block mb-1">Qtd</label>
                                        <input
                                            type="number"
                                            className="w-full bg-dark border border-dark rounded p-2 text-white"
                                            value={item.quantity}
                                            onChange={e => handleConsumptionChange(index, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-xs text-metallic-light block mb-1">Unidade</label>
                                        <select
                                            className="w-full bg-dark border border-dark rounded p-2 text-white"
                                            value={item.unit}
                                            onChange={e => handleConsumptionChange(index, 'unit', e.target.value)}
                                        >
                                            <option value="ml">ml</option>
                                            <option value="l">l</option>
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="un">un</option>
                                        </select>
                                    </div>
                                    <Button variant="ghost" onClick={() => handleRemoveConsumption(index)} className="text-red-500">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button variant="outline" onClick={handleAddConsumption} className="w-full border-dashed">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Serviço
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-between mt-8 pt-4 border-t border-dark-lighter">
                        <Button
                            variant="secondary"
                            onClick={() => step > 1 ? setStep(step - 1) : navigate('/produtos')}
                        >
                            {step > 1 ? 'Voltar' : 'Cancelar'}
                        </Button>

                        {step < 3 ? (
                            <Button variant="primary" onClick={() => setStep(step + 1)}>
                                Próximo <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        ) : (
                            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Salvando...' : 'Finalizar Cadastro'} <Check className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
