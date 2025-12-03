import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { usePermissions } from '../contexts/PermissionsContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Package, Plus, Filter, Edit, Trash2, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Products() {
    const { profile } = usePermissions()
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [brands, setBrands] = useState([])
    const [categories, setCategories] = useState([])

    // Filters
    const [filterName, setFilterName] = useState('')
    const [filterBrand, setFilterBrand] = useState('')
    const [filterCategory, setFilterCategory] = useState('')

    useEffect(() => {
        fetchData()
    }, [profile])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch Brands
            const { data: brandsData } = await supabase
                .from('product_brands')
                .select('*')
                .order('name')

            if (brandsData) setBrands(brandsData)

            // Fetch Categories
            const { data: categoriesData } = await supabase
                .from('product_categories')
                .select('*')
                .order('name')

            if (categoriesData) setCategories(categoriesData)

            // Fetch Products
            let query = supabase
                .from('products')
                .select(`
          *,
          brand:product_brands(name),
          category:product_categories(name)
        `)
                .order('nome')

            const { data, error } = await query

            if (error) throw error
            setProducts(data || [])

        } catch (error) {
            console.error('Erro ao carregar produtos:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return
        try {
            const { error } = await supabase.from('products').delete().eq('id', id)
            if (error) throw error
            fetchData()
        } catch (error) {
            alert('Erro ao excluir produto')
        }
    }

    const filteredProducts = products.filter(product => {
        const matchName = product.nome.toLowerCase().includes(filterName.toLowerCase())
        const matchBrand = filterBrand ? product.brand_id === filterBrand : true
        const matchCategory = filterCategory ? product.category_id === filterCategory : true
        return matchName && matchBrand && matchCategory
    })

    if (loading) {
        return <div className="flex justify-center p-8 text-metallic-light">Carregando...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Produtos</h1>
                    <p className="text-metallic-light">Gerencie o estoque e cadastro de produtos</p>
                </div>
            </div>

            {/* Filters Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-metallic-light mb-1 block">Nome</label>
                            <input
                                type="text"
                                value={filterName}
                                onChange={e => setFilterName(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded px-3 py-2 text-white focus:border-primary outline-none"
                                placeholder="Buscar produto..."
                            />
                        </div>
                        <div className="w-[200px]">
                            <label className="text-xs text-metallic-light mb-1 block">Marca</label>
                            <select
                                value={filterBrand}
                                onChange={e => setFilterBrand(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded px-3 py-2 text-white focus:border-primary outline-none"
                            >
                                <option value="">Todas</option>
                                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div className="w-[200px]">
                            <label className="text-xs text-metallic-light mb-1 block">Categoria</label>
                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="w-full bg-dark-lighter border border-dark-lighter rounded px-3 py-2 text-white focus:border-primary outline-none"
                            >
                                <option value="">Todas</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <Button variant="primary" onClick={() => navigate('/novo-produto')} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            ADICIONAR PRODUTO
                        </Button>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button variant="secondary" className="text-xs" onClick={() => alert('Funcionalidade em breve')}>CATEGORIAS</Button>
                        <Button variant="secondary" className="text-xs" onClick={() => alert('Funcionalidade em breve')}>MARCAS</Button>
                        <Button variant="outline" className="text-xs ml-auto">EXPORTAR</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="bg-dark-light rounded-lg border border-dark-lighter overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-primary/20 text-left">
                            <th className="p-4 text-white font-semibold">Nome</th>
                            <th className="p-4 text-white font-semibold">Categoria</th>
                            <th className="p-4 text-white font-semibold">Marca</th>
                            <th className="p-4 text-white font-semibold">Estoque</th>
                            <th className="p-4 text-white font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id} className="border-t border-dark-lighter hover:bg-dark-lighter/50 transition-colors">
                                <td className="p-4 text-white font-medium">{product.nome}</td>
                                <td className="p-4 text-metallic-light">{product.category?.name || '-'}</td>
                                <td className="p-4 text-metallic-light">{product.brand?.name || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${product.current_stock <= product.min_stock
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-green-500/20 text-green-400'
                                        }`}>
                                        {product.current_stock} {product.unit_of_measure}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-end gap-2">
                                    <button className="p-2 text-metallic-light hover:text-white transition-colors">
                                        <History className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-primary hover:text-primary/80 transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-metallic-light">
                                    Nenhum produto encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
