import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Plus, Search, Edit2, Trash2, X, Check } from 'lucide-react'

const PAYMENT_TYPES = [
    'Dinheiro',
    'Crédito',
    'Débito',
    'Boleto',
    'ConectCar',
    'Sem Parar Park',
    'Sem Parar Lava Car',
    'A faturar',
    'Pix'
]

const DESTINATION_ACCOUNTS = [
    'Conta Principal',
    'Caixinha',
    'Banco Inter',
    'Nubank'
]

export default function PaymentMethods() {
    const { profile } = usePermissions()
    const [methods, setMethods] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingMethod, setEditingMethod] = useState(null)

    // Filters
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('Ativado')
    const [searchTerm, setSearchTerm] = useState('')

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        tax: 0,
        active: true,
        destination_account: ''
    })

    useEffect(() => {
        if (profile?.establishment_id) {
            fetchMethods()
        }
    }, [profile])

    const fetchMethods = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('establishment_id', profile.establishment_id)
                .order('name')

            if (error) throw error
            setMethods(data || [])
        } catch (error) {
            console.error('Erro ao buscar meios de pagamento:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (method = null) => {
        if (method) {
            setEditingMethod(method)
            setFormData({
                name: method.name,
                type: method.type,
                tax: method.tax,
                active: method.active,
                destination_account: method.destination_account || ''
            })
        } else {
            setEditingMethod(null)
            setFormData({
                name: '',
                type: '',
                tax: 0,
                active: true,
                destination_account: ''
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingMethod(null)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.type) {
            alert('Preencha os campos obrigatórios')
            return
        }

        try {
            const methodData = {
                ...formData,
                establishment_id: profile.establishment_id
            }

            let error
            if (editingMethod) {
                const { error: updateError } = await supabase
                    .from('payment_methods')
                    .update(methodData)
                    .eq('id', editingMethod.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('payment_methods')
                    .insert([methodData])
                error = insertError
            }

            if (error) throw error

            alert('Meio de pagamento salvo com sucesso!')
            handleCloseModal()
            fetchMethods()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar: ' + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este meio de pagamento?')) return

        try {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchMethods()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir: ' + error.message)
        }
    }

    const handleToggleStatus = async (method) => {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .update({ active: !method.active })
                .eq('id', method.id)

            if (error) throw error
            fetchMethods()
        } catch (error) {
            console.error('Erro ao alterar status:', error)
        }
    }

    const filteredMethods = methods.filter(method => {
        const matchesType = filterType ? method.type === filterType : true
        const matchesStatus = filterStatus === 'Ativado' ? method.active :
            filterStatus === 'Desativado' ? !method.active : true
        const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesType && matchesStatus && matchesSearch
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Meios de Pagamento</h1>
                    <p className="text-metallic-light">Gerencie as formas de pagamento aceitas</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-metallic-light block mb-1">Tipo de meio de pagamento</label>
                            <select
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {PAYMENT_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="text-xs text-metallic-light block mb-1">Situação</label>
                            <select
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                            >
                                <option value="Todos">Todos</option>
                                <option value="Ativado">Ativado</option>
                                <option value="Desativado">Desativado</option>
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-metallic-light" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar"
                                    className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 pl-9 text-white"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button variant="primary" className="bg-green-600 hover:bg-green-700">
                            FILTRAR
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Button variant="primary" onClick={() => handleOpenModal()} className="bg-blue-900 hover:bg-blue-800">
                <Plus className="w-4 h-4 mr-2" />
                ADICIONAR MEIO DE PAGAMENTO
            </Button>

            {/* List */}
            <div className="bg-dark-light rounded-lg border border-dark-lighter overflow-hidden">
                <table className="w-full">
                    <thead className="bg-blue-900 text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Nome</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Tipo de pagamento</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Taxa</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-lighter">
                        {filteredMethods.map(method => (
                            <tr key={method.id} className="hover:bg-dark-lighter/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-white">{method.name}</td>
                                <td className="px-6 py-4 text-sm text-metallic-light">{method.type}</td>
                                <td className="px-6 py-4 text-sm text-metallic-light">{method.tax}%</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleStatus(method)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${method.active ? 'bg-green-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${method.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleOpenModal(method)} className="text-blue-400 hover:text-blue-300">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(method.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredMethods.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-metallic-light">
                                    Nenhum meio de pagamento encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-xl font-bold text-blue-900">Cadastro de meio de pagamento</h3>
                            <div className="flex gap-2">
                                <button className="p-1 hover:bg-gray-100 rounded">
                                    <div className="w-4 h-4 border-2 border-gray-400 rounded-sm"></div>
                                </button>
                                <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded">
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-blue-900 block mb-1">Método de pagamento</label>
                                <select
                                    className="w-full border-b-2 border-blue-900 bg-transparent py-2 focus:outline-none text-gray-700"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="">--</option>
                                    {PAYMENT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">Nome</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded p-2 text-gray-700"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">Selecione o status:</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-blue-900 font-semibold"
                                        value={formData.active ? 'Ativado' : 'Desativado'}
                                        onChange={e => setFormData({ ...formData, active: e.target.value === 'Ativado' })}
                                    >
                                        <option value="Ativado">Ativado</option>
                                        <option value="Desativado">Desativado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">Taxa</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border border-gray-300 rounded p-2 text-gray-700"
                                        value={formData.tax}
                                        onChange={e => setFormData({ ...formData, tax: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">Conta destino</label>
                                    <select
                                        className="w-full border border-gray-300 rounded p-2 text-gray-700"
                                        value={formData.destination_account}
                                        onChange={e => setFormData({ ...formData, destination_account: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {DESTINATION_ACCOUNTS.map(acc => (
                                            <option key={acc} value={acc}>{acc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded border border-gray-300"
                            >
                                FECHAR
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-green-600 text-white font-semibold hover:bg-green-700 rounded shadow-sm"
                            >
                                SALVAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
