# Facilicar - Sistema Web de Gestão Automotiva

## Status do Projeto
✅ Vite + React configurado
✅ TailwindCSS configurado com tema escuro automotivo
✅ Dependências instaladas (react-router-dom, lucide-react, @supabase/supabase-js)

## Próximos Passos

### 1. Configurar Supabase (.env)
Crie o arquivo `.env` na raiz com:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

### 2. Estrutura de Arquivos a Criar

```
src/
├── services/
│   └── supabase.js          # Cliente Supabase
├── contexts/
│   └── AuthContext.jsx      # Contexto de autenticação
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx      # Menu lateral
│   │   ├── Header.jsx       # Cabeçalho com ícones
│   │   └── Layout.jsx       # Layout principal
│   └── ui/
│       ├── Card.jsx         # Card component
│       └── Button.jsx       # Button component
├── pages/
│   ├── LandingPage.jsx      # Página inicial
│   ├── Login.jsx            # Tela de login
│   └── Dashboard.jsx        # Dashboard principal
└── App.jsx                  # Router principal
```

### 3. Tabelas Supabase

Execute no SQL Editor do Supabase:

```sql
-- Tabela de estabelecimentos
CREATE TABLE establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  status_pagamento TEXT DEFAULT 'ativo',
  vencimento DATE,
  valor DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de usuários (complementa auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  tipo TEXT NOT NULL, -- admin, colaborador, cliente
  establishment_id UUID REFERENCES establishments,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tempo_estimado INTEGER, -- em minutos
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de veículos
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  cliente_id UUID REFERENCES users,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de OS (Ordens de Serviço)
CREATE TABLE os (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  veiculo_id UUID REFERENCES vehicles,
  servicos JSONB, -- [{id, nome, valor}]
  status TEXT DEFAULT 'pendente', -- pendente, em_andamento, concluida, cancelada
  qr_code TEXT,
  valor_total DECIMAL(10,2),
  data_entrada TIMESTAMP DEFAULT NOW(),
  data_conclusao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações financeiras
CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- receita, despesa
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT,
  descricao TEXT,
  os_id UUID REFERENCES os,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  fornecedor_id UUID,
  preco DECIMAL(10,2),
  quantidade INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de fornecedores
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cnpj TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs operacionais
CREATE TABLE operational_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES users,
  acao TEXT NOT NULL,
  detalhes JSONB,
  data TIMESTAMP DEFAULT NOW()
);
```

### 4. Landing Page - Elementos Principais

- Fundo escuro com imagem de carro esportivo preto
- Título: "Facilicar — Controle total do seu lava-rápido e estética automotiva"
- Subtítulo: "Gerencie faturamento, clientes e operações em um só lugar"
- Botão "Entrar no Sistema" (canto superior direito)
- Cards de planos:
  - Mensal: R$ 49,90/mês
  - Anual: R$ 499,00/ano (economize R$ 99)
- Rodapé: © Facilicar 2025

### 5. Dashboard - Indicadores

Cards com ícones (lucide-react):
- 💰 Faturamento Total
- 📈 Receita
- 📉 Despesa
- 💵 Lucro
- 🚗 Carros no Pátio
- ✅ OS Pagas
- ❌ OS Canceladas

Filtros de data:
- Hoje
- Ontem
- Últimos 7 dias
- Personalizado (data inicial/final)

### 6. Sidebar - Estrutura de Menus

**Menu Negócio**
- Controle
  - Estabelecimento
  - Usuários
  - Tabela de Serviço
- Cadastro
  - Novo Estabelecimento
  - Novo Usuário

**Menu Operacional**
- Histórico Operacional
- Registro de Atividades
- Registro de Sessões
- Dossiê de Avarias

**Menu Produtos**
- Controle
  - Lista de Produtos
  - Fornecedores
- Operações
  - Cadastrar Produto

**Menu Financeiro**
- Relatórios
  - Fluxo de Caixa
  - Transações
  - Notas Fiscais
- Operações
  - Folha de Pagamento
  - Comissionamento

**Menu Clientes**
- Controle
  - Clientes
  - Lembretes
  - Agendamentos
- Cadastro
  - Novo Cliente

### 7. Header - Ícones do Topo Direito

1. **Ícone de Dinheiro (💰)**
   - Modal com informações da empresa:
     - Nome
     - Status de pagamento
     - CNPJ
     - Vencimento
     - Valor
     - Botão "Renovar Plano"

2. **Ícone de Engrenagem (⚙️)**
   - Menu dropdown:
     - Operacional: Comprovantes, Operação, Caixa
     - Financeiro: Nota Fiscal, Categorias, Centros de Custo, Contas, Meios de Pagamento

3. **Ícone de Perfil (👤)**
   - Menu dropdown:
     - Perfil
     - Sair
     - Versão do App (v1.0.0)

### 8. Tema de Cores (Tailwind)

```javascript
// tailwind.config.js (já configurado)
colors: {
  primary: '#2563eb',        // Azul elétrico
  'primary-dark': '#1e40af',
  dark: '#0f172a',          // Fundo escuro
  'dark-light': '#1e293b',
  'dark-lighter': '#334155',
  metallic: '#64748b',       // Cinza metálico
}
```

### 9. Comandos para Desenvolvimento

```bash
# Rodar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

### 10. Integração com o App Flutter

O Facilicar compartilhará o mesmo Supabase do app Flutter:
- Use as mesmas credenciais do Supabase
- As tabelas já existentes serão reutilizadas
- Sincronização automática entre web e mobile

## Tecnologias Utilizadas

- **Frontend**: Vite 6.0 + React 18
- **Styling**: TailwindCSS 3.4
- **Routing**: React Router DOM 7.1
- **Icons**: Lucide React 0.469
- **Backend**: Supabase (Auth + Database + Storage)
- **Utils**: clsx + tailwind-merge

## Estrutura Recomendada de Componentes

Use shadcn/ui como referência para criar componentes:
- Buttons com variantes (primary, secondary, ghost)
- Cards com bordas arredondadas e sombras
- Inputs estilizados
- Modal/Dialog components
- Dropdown menus

## Boas Práticas

1. Use contextos para estado global (Auth, Theme)
2. Crie hooks customizados (useAuth, useSupabase)
3. Componentes pequenos e reutilizáveis
4. Tipagem com JSDoc se não usar TypeScript
5. Lazy loading de rotas com React.lazy()
6. Protected routes para páginas autenticadas

## Próximo Passo Imediato

1. Criar arquivo `.env` com credenciais do Supabase
2. Criar `src/services/supabase.js`
3. Criar `src/contexts/AuthContext.jsx`
4. Criar `src/App.jsx` com React Router
5. Criar Landing Page
6. Criar tela de Login
7. Criar Dashboard com layout

---

**Projeto iniciado em:** 11/11/2025
**Status:** Em desenvolvimento - Base configurada ✅
