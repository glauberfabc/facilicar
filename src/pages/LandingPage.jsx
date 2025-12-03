import { useNavigate } from 'react-router-dom'
import { Car, Check } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'

export const LandingPage = () => {
  const navigate = useNavigate()

  const plans = [
    {
      name: 'Plano Mensal',
      price: 'R$ 49,90',
      period: '/mês',
      features: [
        'Gestão completa de clientes',
        'Controle de ordens de serviço',
        'Relatórios financeiros',
        'Suporte por email',
      ],
    },
    {
      name: 'Plano Anual',
      price: 'R$ 499,00',
      period: '/ano',
      discount: 'Economize R$ 99',
      features: [
        'Tudo do plano mensal',
        '2 meses grátis',
        'Suporte prioritário',
        'Backups automáticos',
        'Relatórios avançados',
      ],
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark via-dark-light to-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark/80 backdrop-blur-md border-b border-dark-lighter">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Car className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-white">Facilicar</h1>
          </div>
          <Button onClick={() => navigate('/login')} variant="primary">
            Entrar no Sistema
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Facilicar — Controle total do seu lava-rápido e estética automotiva
          </h2>
          <p className="text-xl text-metallic-light mb-8">
            Gerencie faturamento, clientes e operações em um só lugar.
          </p>

          {/* Car Image Placeholder */}
          <div className="relative w-full h-96 bg-gradient-radial from-primary/20 to-transparent rounded-2xl flex items-center justify-center mb-12">
            <Car className="w-64 h-64 text-primary opacity-20" />
            <div className="absolute inset-0 bg-[url('/car-lights.png')] bg-cover bg-center opacity-30 rounded-2xl" />
          </div>

          <Button onClick={() => navigate('/login')} variant="primary" className="text-lg px-8 py-4">
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-6 bg-dark-light/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4">
              Escolha seu plano
            </h3>
            <p className="text-metallic-light text-lg">
              Comece com 7 dias grátis, sem compromisso
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? 'border-2 border-primary relative' : ''}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.discount && (
                    <p className="text-sm text-green-400 font-semibold">{plan.discount}</p>
                  )}
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-metallic-light">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-metallic-light">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => navigate('/login')}
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    Começar Teste Grátis
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-lighter">
        <div className="container mx-auto text-center">
          <p className="text-metallic-light">
            © Facilicar 2025 · Todos os direitos reservados
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-metallic-light hover:text-primary transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="text-metallic-light hover:text-primary transition-colors">
              Política de Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
