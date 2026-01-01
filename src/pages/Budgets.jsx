import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Plus, FileText } from 'lucide-react'

export default function Budgets() {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Orçamentos</h1>
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Orçamento
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Lista de Orçamentos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-metallic-light">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
                        <p className="text-sm">Clique em "Novo Orçamento" para criar um.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
