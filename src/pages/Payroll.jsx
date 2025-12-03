import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Users, Plus, Search, Edit, Trash2, Filter, Download } from 'lucide-react'

export default function Payroll() {
    const { profile } = usePermissions()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState(null)
    const [users, setUsers] = useState([]) // For linking users

    // Filters
    const [filterName, setFilterName] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [filterStatus, setFilterStatus] = useState('Ativado')

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        status: 'Ativado',
        expense_category: '',
        linked_user_id: '',
        frequency: 'Mensal',
        pay_day: '',
        first_payment_date: '',
        salary: ''
    })

    useEffect(() => {
        fetchEmployees()
        fetchUsers()
    }, [])

    const fetchEmployees = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('employees')
                .select('*')
                .order('name', { ascending: true })

            if (filterName) query = query.ilike('name', `%${filterName}%`)
            if (filterRole) query = query.ilike('role', `%${filterRole}%`)
            if (filterStatus && filterStatus !== 'Todos') query = query.eq('status', filterStatus)

            const { data, error } = await query
            if (error) throw error
            setEmployees(data || [])
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, nome, email')
                .order('nome')
            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Erro ao buscar usuários:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!profile?.establishment_id) return

        try {
            const payload = {
                ...formData,
                salary: formData.salary ? parseFloat(formData.salary.replace('R$', '').replace('.', '').replace(',', '.')) : 0,
                establishment_id: profile.establishment_id
            }

            if (editingEmployee) {
                const { error } = await supabase
                    .from('employees')
                    .update(payload)
                    .eq('id', editingEmployee.id)
                if (error) throw error
                alert('Funcionário atualizado com sucesso!')
            } else {
                const { error } = await supabase
                    .from('employees')
                    .insert([payload])
                if (error) throw error
                alert('Funcionário cadastrado com sucesso!')
            }
            handleCloseModal()
            fetchEmployees()
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar funcionário.')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este funcionário?')) return
        try {
            const { error } = await supabase.from('employees').delete().eq('id', id)
            if (error) throw error
            fetchEmployees()
        } catch (error) {
            console.error('Erro ao excluir:', error)
        }
    }

    const handleEdit = (employee) => {
        setEditingEmployee(employee)
        setFormData({
            name: employee.name,
            role: employee.role || '',
            status: employee.status || 'Ativado',
            expense_category: employee.expense_category || '',
            linked_user_id: employee.linked_user_id || '',
            frequency: employee.frequency || 'Mensal',
            pay_day: employee.pay_day || '',
            first_payment_date: employee.first_payment_date || '',
            salary: employee.salary ? employee.salary.toString() : ''
        })
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingEmployee(null)
        setFormData({
            name: '',
            role: '',
            status: 'Ativado',
            expense_category: '',
            linked_user_id: '',
            frequency: 'Mensal',
            pay_day: '',
            first_payment_date: '',
            salary: ''
        })
    }

    const handleExport = () => {
        const headers = ['Nome', 'Cargo', 'Status', 'Salário', 'Dia Pagamento']
        const csvContent = [
            headers.join(';'),
            ...employees.map(emp => [
                `"${emp.name}"`,
                `"${emp.role || ''}"`,
                `"${emp.status}"`,
                `"${emp.salary || 0}"`,
                `"${emp.pay_day || ''}"`
            ].join(';'))
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'funcionarios.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Folha de Pagamento</h1>
                        <p className="text-metallic-light">Gerencie seus funcionários e pagamentos</p>
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
                            <label className="text-sm text-metallic-light mb-1 block">Cargo</label>
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                            >
                                <option value="">Todos</option>
                                <option value="Gerente">Gerente</option>
                                <option value="Vendedor">Vendedor</option>
                                <option value="Atendente">Atendente</option>
                                <option value="Lavador">Lavador</option>
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
                                ADICIONAR FUNCIONÁRIO
                            </Button>
                            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
                                <Download className="w-4 h-4" />
                                EXPORTAR
                            </Button>
                        </div>
                        <Button variant="secondary" onClick={fetchEmployees} className="flex items-center gap-2">
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
                                    <th className="text-left p-4 text-metallic-light font-medium">Cargo</th>
                                    <th className="text-left p-4 text-metallic-light font-medium">Situação</th>
                                    <th className="text-left p-4 text-metallic-light font-medium">Vencimento</th>
                                    <th className="text-left p-4 text-metallic-light font-medium">Valor</th>
                                    <th className="text-right p-4 text-metallic-light font-medium">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((employee) => (
                                    <tr key={employee.id} className="border-b border-dark-lighter hover:bg-dark-lighter/50">
                                        <td className="p-4 text-white font-medium">{employee.name}</td>
                                        <td className="p-4 text-metallic-light">{employee.role || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.status === 'Ativado'
                                                    ? 'bg-green-500/20 text-green-500'
                                                    : 'bg-red-500/20 text-red-500'
                                                }`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-metallic-light">Dia {employee.pay_day || '-'}</td>
                                        <td className="p-4 text-white">
                                            {employee.salary ? `R$ ${parseFloat(employee.salary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(employee)}
                                                    className="p-2 hover:bg-dark-lighter rounded-lg text-primary transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="p-2 hover:bg-dark-lighter rounded-lg text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-metallic-light">
                                            Nenhum funcionário encontrado
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
                                    {editingEmployee ? 'Editar Funcionário' : 'Adicionar Funcionário'}
                                </h2>
                                <button onClick={handleCloseModal} className="text-metallic-light hover:text-white">✕</button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Nome</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Cargo</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Gerente">Gerente</option>
                                            <option value="Vendedor">Vendedor</option>
                                            <option value="Atendente">Atendente</option>
                                            <option value="Lavador">Lavador</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Estabelecimento financeiro</label>
                                        <input
                                            type="text"
                                            disabled
                                            value="Estabelecimento Atual" // Placeholder, ideally fetch establishment name
                                            className="w-full bg-dark-lighter/50 border border-dark-lighter rounded-lg px-3 py-2 text-metallic-light cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Frequência</label>
                                        <select
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="Mensal">Mensal</option>
                                            <option value="Quinzenal">Quinzenal</option>
                                            <option value="Semanal">Semanal</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Data do primeiro pagamento</label>
                                        <input
                                            type="date"
                                            value={formData.first_payment_date}
                                            onChange={(e) => setFormData({ ...formData, first_payment_date: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
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

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Categoria da despesa</label>
                                        <select
                                            value={formData.expense_category}
                                            onChange={(e) => setFormData({ ...formData, expense_category: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Salários">Salários</option>
                                            <option value="Comissões">Comissões</option>
                                            <option value="Adiantamentos">Adiantamentos</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Vincular usuário</label>
                                        <select
                                            value={formData.linked_user_id}
                                            onChange={(e) => setFormData({ ...formData, linked_user_id: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Selecione...</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>{user.nome || user.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Pagar sempre no dia</label>
                                        <select
                                            value={formData.pay_day}
                                            onChange={(e) => setFormData({ ...formData, pay_day: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="">Selecione...</option>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-metallic-light mb-1">Salário</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.salary}
                                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                            className="w-full bg-dark-lighter border border-dark-lighter rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
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
