-- Script SQL seguro para criar tabelas do Facilicar
-- Usa CREATE TABLE IF NOT EXISTS para evitar erros de tabelas duplicadas

-- Tabela de estabelecimentos
CREATE TABLE IF NOT EXISTS establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  status_pagamento TEXT DEFAULT 'ativo',
  vencimento DATE,
  valor DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de usuários (complementa auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  tipo TEXT NOT NULL, -- admin, colaborador, cliente
  establishment_id UUID REFERENCES establishments,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tempo_estimado INTEGER, -- em minutos
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de veículos
-- NOTA: Se a tabela já existir com id do tipo TEXT, este CREATE não terá efeito
-- devido ao IF NOT EXISTS. Neste caso, as foreign keys devem usar TEXT também.
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  cliente_id UUID REFERENCES clients, -- Referencia clients ao invés de users
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de OS (Ordens de Serviço)
-- IMPORTANTE: Se vehicles.id for TEXT (tabela já existente), veiculo_id deve ser TEXT
-- Se vehicles.id for UUID (nova instalação), veiculo_id deve ser UUID
CREATE TABLE IF NOT EXISTS os (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  veiculo_id TEXT, -- Alterado para TEXT para compatibilidade com schema existente
  servicos JSONB, -- [{id, nome, valor}]
  status TEXT DEFAULT 'pendente', -- pendente, em_andamento, concluida, cancelada
  qr_code TEXT,
  valor_total DECIMAL(10,2),
  data_entrada TIMESTAMP DEFAULT NOW(),
  data_conclusao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
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
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES suppliers,
  preco DECIMAL(10,2),
  quantidade INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cnpj TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs operacionais
CREATE TABLE IF NOT EXISTS operational_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES users,
  acao TEXT NOT NULL,
  detalhes JSONB,
  data TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_clients_nome ON clients(nome);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_telefone ON clients(telefone);
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_vehicles_cliente_id ON vehicles(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON os(status);
CREATE INDEX IF NOT EXISTS idx_os_veiculo_id ON os(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tipo ON financial_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_data ON financial_transactions(data);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
END $$;
