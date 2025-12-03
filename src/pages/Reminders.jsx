import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Bell, Plus } from 'lucide-react'

export default function Reminders() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lembretes</h1>
            <p className="text-metallic-light">Gerencie lembretes e notificações</p>
          </div>
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Lembrete
        </Button>
      </div>

      <Card>
        <CardContent className="p-12 text-center">
          <Bell className="w-16 h-16 text-metallic-light mx-auto mb-4" />
          <p className="text-metallic-light text-lg mb-2">Funcionalidade em Desenvolvimento</p>
          <p className="text-metallic-light text-sm">
            Sistema de lembretes para acompanhamento de clientes estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
