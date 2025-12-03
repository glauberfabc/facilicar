import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Plus, Search, Edit2, Trash2, X, Filter } from 'lucide-react'

export default function Suppliers() {
    const { profile } = usePermissions()
    const [suppliers, setSuppliers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState(null)

    // Filters
    const [filters, setFilters] = useState({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        contact_name: ''
    })

    // Form Data
    const [formData, setFormData] = useState({
        nome: '', // Nome Fantasia
        corporate_name: '', // Razão Social
        cnpj: '',
        active: true,
        contact_name: '',
        email: '',
        telefone: '',
        observation: '',
        zip_code: '',
        address: '',
        number: '',
        complement: '',
        city: '',
        neighborhood: '',
        state: ''
    })

    useEffect(() => {
        if (profile?.establishment_id) {
            fetchSuppliers()
        }
    }, [profile])

    const fetchSuppliers = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('suppliers')
                .select('*')
                .eq('establishment_id', profile.establishment_id)
                .order('nome')

            const { data, error } = await query

            if (error) throw error
            setSuppliers(data || [])
        } catch (error) {
            console.error('Erro ao buscar fornecedores:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier)
            setFormData({
                nome: supplier.nome || '',
                corporate_name: supplier.corporate_name || '',
                cnpj: supplier.cnpj || '',
                active: supplier.active ?? true,
                contact_name: supplier.contact_name || '',
                email: supplier.email || '',
                telefone: supplier.telefone || '',
                observation: supplier.observation || '',
                zip_code: supplier.zip_code || '',
                address: supplier.address || '',
                number: supplier.number || '',
                complement: supplier.complement || '',
                city: supplier.city || '',
                neighborhood: supplier.neighborhood || '',
                state: supplier.state || ''
            })
        } else {
            setEditingSupplier(null)
            setFormData({
                nome: '',
                corporate_name: '',
                cnpj: '',
                active: true,
                contact_name: '',
                email: '',
                telefone: '',
                observation: '',
                zip_code: '',
                address: '',
                number: '',
                complement: '',
                city: '',
                neighborhood: '',
                state: ''
            })
        }
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingSupplier(null)
    }

    const handleSave = async () => {
        if (!formData.nome) {
            alert('Nome Fantasia é obrigatório')
            return
        }

        try {
            const supplierData = {
                ...formData,
                establishment_id: profile.establishment_id
            }

            let error
            if (editingSupplier) {
                const { error: updateError } = await supabase
                    .from('suppliers')
                    .update(supplierData)
                    .eq('id', editingSupplier.id)
                error = updateError
            } else {
                const { error: insertError } = await supabase
                    .from('suppliers')
                    .insert([supplierData])
                error = insertError
            }

            if (error) throw error

            alert('Fornecedor salvo com sucesso!')
            handleCloseModal()
            fetchSuppliers()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar: ' + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return

        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchSuppliers()
        } catch (error) {
            console.error('Erro ao excluir:', error)
            alert('Erro ao excluir: ' + error.message)
        }
    }

    const filteredSuppliers = suppliers.filter(supplier => {
        const matchNome = supplier.nome?.toLowerCase().includes(filters.nome.toLowerCase())
        const matchCnpj = supplier.cnpj?.includes(filters.cnpj)
        const matchEmail = supplier.email?.toLowerCase().includes(filters.email.toLowerCase())
        const matchTelefone = supplier.telefone?.includes(filters.telefone)
        const matchContact = supplier.contact_name?.toLowerCase().includes(filters.contact_name.toLowerCase())

        return matchNome && matchCnpj && matchEmail && matchTelefone && matchContact
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
                    <p className="text-metallic-light">Gerencie seus fornecedores</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <input
                                type="text"
                                placeholder="Empresa"
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filters.nome}
                                onChange={e => setFilters({ ...filters, nome: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="CNPJ"
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filters.cnpj}
                                onChange={e => setFilters({ ...filters, cnpj: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Email"
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filters.email}
                                onChange={e => setFilters({ ...filters, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Telefone"
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filters.telefone}
                                onChange={e => setFilters({ ...filters, telefone: e.target.value })}
                            />
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Responsável"
                                className="w-full bg-dark-lighter border border-dark-lighter rounded p-2 text-white"
                                value={filters.contact_name}
                                onChange={e => setFilters({ ...filters, contact_name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between mt-4">
                        <div className="flex gap-2">
                            <Button variant="primary" onClick={() => handleOpenModal()} className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4 mr-2" />
                                ADICIONAR FORNECEDOR
                            </Button>
                            <Button variant="outline" className="text-metallic-light border-dark-lighter hover:bg-dark-lighter">
                                EXPORTAR
                            </Button>
                        </div>
                        <Button variant="primary" className="bg-green-600 hover:bg-green-700">
                            FILTRAR
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <div className="bg-dark-light rounded-lg border border-dark-lighter overflow-hidden">
                <table className="w-full">
                    <thead className="bg-blue-900 text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Responsável</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Nome</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">CNPJ</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Telefone</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-lighter">
                        {filteredSuppliers.map(supplier => (
                            <tr key={supplier.id} className="hover:bg-dark-lighter/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-white">{supplier.contact_name || '-'}</td>
                                <td className="px-6 py-4 text-sm text-metallic-light">{supplier.nome}</td>
                                <td className="px-6 py-4 text-sm text-metallic-light">{supplier.cnpj || '-'}</td>
                                <td className="px-6 py-4 text-sm text-metallic-light">{supplier.telefone || '-'}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleOpenModal(supplier)} className="text-blue-400 hover:text-blue-300">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredSuppliers.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-metallic-light">
                                    Nenhum fornecedor encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-10" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b bg-blue-900 text-white rounded-t-lg">
                            <h3 className="text-xl font-bold">Preencha as informações do fornecedor</h3>
                            <button onClick={handleCloseModal} className="p-1 hover:bg-blue-800 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 text-gray-700">
                            {/* Fornecedor Section */}
                            <div>
                                <h4 className="text-lg font-bold text-blue-900 mb-4">Fornecedor</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">CNPJ</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.cnpj}
                                            onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
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
                                        <label className="text-sm text-gray-500 block mb-1">Nome Fantasia</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.nome}
                                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Razão Social</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.corporate_name}
                                            onChange={e => setFormData({ ...formData, corporate_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contatos Section */}
                            <div>
                                <h4 className="text-lg font-bold text-blue-900 mb-4">Contatos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Nome</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.contact_name}
                                            onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">E-mail</label>
                                        <input
                                            type="email"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <label className="text-sm text-gray-500 block mb-1">Telefone</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded p-2"
                                                value={formData.telefone}
                                                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                            />
                                        </div>
                                        <button className="bg-blue-900 text-white p-2 rounded hover:bg-blue-800 h-[42px] w-[42px] flex items-center justify-center">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500 block mb-1">Observação</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded p-2"
                                        value={formData.observation}
                                        onChange={e => setFormData({ ...formData, observation: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Endereço Section */}
                            <div>
                                <h4 className="text-lg font-bold text-blue-900 mb-4">Endereço</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">CEP</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.zip_code}
                                            onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm text-gray-500 block mb-1">Endereço</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Número</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.number}
                                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Complemento</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.complement}
                                            onChange={e => setFormData({ ...formData, complement: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Cidade</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">Bairro</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.neighborhood}
                                            onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500 block mb-1">UF</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded p-2"
                                            value={formData.state}
                                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 rounded-b-lg">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded border border-gray-300"
                            >
                                CANCELAR
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
