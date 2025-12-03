import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Users, Plus, Search, Edit, Trash2, Filter, Settings, AlertTriangle } from 'lucide-react'

export default function Commissions() {
    const { profile } = usePermissions()
    const [commissions, setCommissions] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCommission, setEditingCommission] = useState(null)

    // Filters
    const [filterName, setFilterName] = useState('')
    const [filterProfile, setFilterProfile] = useState('')
    const [filterStatus, setFilterStatus] = useState('Ativado')

    const [formData, setFormData] = useState({
        employee_id: '',
        profile: '',
        days_to_due: '0',
        status: 'Ativado'
    })

    useEffect(() => {
        fetchCommissions()
        fetchEmployees()
    }, [])

    const fetchCommissions = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('commissioned_employees')
                .select(`
          *,
          employees (name)
        `)
                .order('created_at', { ascending: false })

            if (filterStatus && filterStatus !== 'Todos') query = query.eq('status', filterStatus)
            if (filterProfile) query = query.ilike('profile', `%${filterProfile}%`)

            const { data, error } = await query
            if (error) throw error

            let filteredData = data || []

            // Client-side filtering for employee name (since it's a relation)
            if (filterName) {
                filteredData = filteredData.filter(item =>
                    item.employees?.name?.toLowerCase().includes(filterName.toLowerCase())
                )
            }

            setCommissions(filteredData)
        } catch (error) {
            console.error('Erro ao buscar comissionados:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id, name')
                .eq('status', 'Ativado')
                .order('name')
            if (error) throw error
            setEmployees(data || [])
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!profile?.establishment_id) return

        try {
            const payload = {
                ...formData,
                establishment_id: profile.establishment_id
            }

            if (editingCommission) {
                const { error } = await supabase
                    .from('commissioned_employees')
                    .update(payload)
                    .eq('id', editingCommission.id)
                if (error) throw error
                alert('Comissionado atualizado com sucesso!')
            } else {
                const { error } = await supabase
                    .from('commissioned_employees')
                    .insert([payload])
                if (error) throw error
                alert('Comissionado cadastrado com sucesso!')
            }
            handleCloseModal()
            fetchCommissions()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar comissionado. Verifique se o funcionário já não possui comissão configurada.')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este comissionado?')) return
        try {
            const { error } = await supabase.from('commissioned_employees').delete().eq('id', id)
            if (error) throw error
            fetchCommissions()
        } catch (error) {
            console.error('Erro ao excluir:', error)
        }
    }

    const handleEdit = (commission) => {
        setEditingCommission(commission)
        setFormData({
            employee_id: commission.employee_id,
            profile: commission.profile,
            days_to_due: commission.days_to_due,
            status: commission.status
        })
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCommission(null)
        setFormData({
            employee_id: '',
            profile: '',
            days_to_due: '0',
            status: 'Ativado'
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Comissionamento</h1>
                        <p className="text-metallic-light">Gerencie os funcionários comissionados</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-sm text-metallic-light mb-1 block">Nome</label>
                            <input
                                type="text"
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                placeholder="Buscar por nome..."
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-sm text-metallic-light mb-1 block">Perfil</label>
                            <select
                                value={filterProfile}
                                onChange={(e) => setFilterProfile(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                            >
                                <option value="">Todos</option>
                                <option value="Vendedor">Vendedor</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Atendente">Atendente</option>
                            </select>
                        </div>
                        <div className="w-40">
                            <label className="text-sm text-metallic-light mb-1 block">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                            >
                                <option value="Todos">Todos</option>
                                <option value="Ativado">Ativado</option>
                                <option value="Desativado">Desativado</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="primary" onClick={() => setShowModal(true)} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                ADICIONAR COMISSIONADO
                            </Button>
                            <Button variant="outline" className="flex items-center gap-2 text-metallic-light border-dark-lighter hover:bg-dark-lighter">
                                <Settings className="w-4 h-4" />
                                CONFIGURAÇÕES
                            </Button>
                        </div>
                        <Button variant="secondary" onClick={fetchCommissions} className="flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            FILTRAR
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-lighter">
                                <tr>
                                    <th className="text-left p-4 text-metallic-light font-medium">Nome</th>
                                    <th className="text-left p-4 text-metallic-light font-medium">Perfil</th>
                                    <th className="text-right p-4 text-metallic-light font-medium">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {commissions.map((item) => (
                                    <tr key={item.id} className="border-b border-dark-lighter hover:bg-dark-lighter/50">
                                        <td className="p-4 text-white font-medium">{item.employees?.name}</td>
                                        <td className="p-4 text-metallic-light">{item.profile}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 hover:bg-dark-lighter rounded-lg text-primary transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 hover:bg-dark-lighter rounded-lg text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {commissions.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-metallic-light">
                                            Nenhum comissionado encontrado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark rounded-lg w-full max-w-4xl border border-dark-lighter max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-dark-lighter sticky top-0 bg-dark z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">
                                    {editingCommission ? 'Editar Comissionado' : 'Novo comissionado'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-metallic-light hover:text-white">✕</button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">

                            {!editingCommission && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                                    <div>
                                        <h4 className="text-red-400 font-semibold text-sm">Atenção:</h4>
                                        <p className="text-red-400/80 text-sm">Crie um funcionário antes de criar um comissionado.</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-metallic-light mb-1">Vincular funcionário</label>
                                    <select
                                        required
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        disabled={!!editingCommission}
                                    >
                                        <option value="">Selecione...</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-metallic-light mb-1">Perfil</label>
                                    <select
                                        required
                                        value={formData.profile}
                                        onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Vendedor">Vendedor</option>
                                        <option value="Gerente">Gerente</option>
                                        <option value="Atendente">Atendente</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-metallic-light mb-1">Vincular estabelecimentos</label>
                                    <input
                                        type="text"
                                        disabled
                                        value="Estabelecimento Atual" // Placeholder
                                        className="w-full bg-dark-lighter/50 border border-dark-lighter rounded-lg px-3 py-2 text-metallic-light cursor-not-allowed"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-metallic-light mb-1">Após fechar comissão vencer em X dias</label>
                                    <select
                                        value={formData.days_to_due}
                                        onChange={(e) => setFormData({ ...formData, days_to_due: e.target.value })}
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="0">No mesmo dia</option>
                                        <option value="5">5 dias</option>
                                        <option value="10">10 dias</option>
                                        <option value="15">15 dias</option>
                                        <option value="30">30 dias</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-metallic-light mb-1">Selecione o status:</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="Ativado">Ativado</option>
                                        <option value="Desativado">Desativado</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-dark-lighter">
                                <Button type="button" variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
                                <Button type="submit" variant="primary">SALVAR</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
