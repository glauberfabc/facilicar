-- Script SQL inteligente que se adapta ao schema existente
-- Este script verifica os tipos das colunas antes de criar foreign keys

-- ========================================
-- PASSO 1: Criar tabelas básicas (sem foreign keys problemáticas)
-- ========================================

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
-- NOTA: Esta tabela pode já existir com id do tipo TEXT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE TABLE users (
      id UUID REFERENCES auth.users PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT,
      tipo TEXT NOT NULL,
      establishment_id UUID REFERENCES establishments,
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE 'Tabela users criada com id do tipo UUID';
  ELSE
    RAISE NOTICE 'Tabela users já existe, mantendo estrutura atual';
  END IF;
END $$;

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

-- Tabela de fornecedores (criar antes de products)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cnpj TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- PASSO 2: Criar tabelas que dependem das anteriores
-- ========================================

-- Tabela de veículos (sem foreign key se já existir)
DO $$
BEGIN
  -- Se a tabela não existir, cria com UUID
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
    CREATE TABLE vehicles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      placa TEXT NOT NULL,
      modelo TEXT,
      cor TEXT,
      cliente_id UUID REFERENCES clients,
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE 'Tabela vehicles criada com id do tipo UUID';
  ELSE
    RAISE NOTICE 'Tabela vehicles já existe, mantendo estrutura atual';
  END IF;
END $$;

-- Tabela de OS (adaptável ao tipo de vehicles.id)
DO $$
DECLARE
  vehicles_id_type TEXT;
BEGIN
  -- Verificar o tipo da coluna id na tabela vehicles
  SELECT data_type INTO vehicles_id_type
  FROM information_schema.columns
  WHERE table_name = 'vehicles'
  AND column_name = 'id'
  AND table_schema = 'public';

  -- Se a tabela OS não existir, cria com o tipo correto
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'os') THEN
    IF vehicles_id_type = 'uuid' THEN
      CREATE TABLE os (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id UUID REFERENCES vehicles(id),
        servicos JSONB,
        status TEXT DEFAULT 'pendente',
        qr_code TEXT,
        valor_total DECIMAL(10,2),
        data_entrada TIMESTAMP DEFAULT NOW(),
        data_conclusao TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela OS criada com veiculo_id do tipo UUID';
    ELSIF vehicles_id_type = 'text' THEN
      CREATE TABLE os (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id TEXT,
        servicos JSONB,
        status TEXT DEFAULT 'pendente',
        qr_code TEXT,
        valor_total DECIMAL(10,2),
        data_entrada TIMESTAMP DEFAULT NOW(),
        data_conclusao TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela OS criada com veiculo_id do tipo TEXT (sem foreign key devido a incompatibilidade)';
    ELSE
      RAISE EXCEPTION 'Tipo inesperado para vehicles.id: %', vehicles_id_type;
    END IF;
  ELSE
    RAISE NOTICE 'Tabela OS já existe, mantendo estrutura atual';
  END IF;
END $$;

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES suppliers,
  preco DECIMAL(10,2),
  quantidade INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL, -- receita, despesa
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT,
  descricao TEXT,
  os_id UUID, -- Sem foreign key por enquanto, pode ser adicionada depois
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de logs operacionais (adaptável ao tipo de users.id)
DO $$
DECLARE
  users_id_type TEXT;
BEGIN
  -- Verificar o tipo da coluna id na tabela users
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users'
  AND column_name = 'id'
  AND table_schema = 'public';

  -- Se a tabela operational_logs não existir, cria com o tipo correto
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operational_logs') THEN
    IF users_id_type = 'uuid' THEN
      CREATE TABLE operational_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID REFERENCES users(id),
        acao TEXT NOT NULL,
        detalhes JSONB,
        data TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela operational_logs criada com usuario_id do tipo UUID';
    ELSIF users_id_type = 'text' THEN
      CREATE TABLE operational_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id TEXT,
        acao TEXT NOT NULL,
        detalhes JSONB,
        data TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela operational_logs criada com usuario_id do tipo TEXT (sem foreign key devido a incompatibilidade)';
    ELSE
      -- Se users não existe ou tem tipo inesperado, cria com UUID
      CREATE TABLE operational_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID,
        acao TEXT NOT NULL,
        detalhes JSONB,
        data TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela operational_logs criada com usuario_id do tipo UUID (sem foreign key, users não encontrada)';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela operational_logs já existe, mantendo estrutura atual';
  END IF;
END $$;

-- ========================================
-- PASSO 3: Criar índices
-- ========================================

-- Índices para clientes
CREATE INDEX IF NOT EXISTS idx_clients_nome ON clients(nome);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_telefone ON clients(telefone);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Índices para veículos
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_vehicles_cliente_id ON vehicles(cliente_id);

-- Índices para OS
CREATE INDEX IF NOT EXISTS idx_os_status ON os(status);
CREATE INDEX IF NOT EXISTS idx_os_veiculo_id ON os(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_os_data_entrada ON os(data_entrada);

-- Índices para transações financeiras
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tipo ON financial_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_data ON financial_transactions(data);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_os_id ON financial_transactions(os_id);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_products_nome ON products(nome);
CREATE INDEX IF NOT EXISTS idx_products_fornecedor_id ON products(fornecedor_id);

-- Índices para fornecedores
CREATE INDEX IF NOT EXISTS idx_suppliers_nome ON suppliers(nome);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);

-- Índices para logs operacionais
CREATE INDEX IF NOT EXISTS idx_operational_logs_usuario_id ON operational_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_operational_logs_data ON operational_logs(data);

-- ========================================
-- PASSO 4: Adicionar foreign key para OS se possível
-- ========================================

DO $$
DECLARE
  os_id_type TEXT;
BEGIN
  -- Verificar o tipo da coluna id na tabela os
  SELECT data_type INTO os_id_type
  FROM information_schema.columns
  WHERE table_name = 'os'
  AND column_name = 'id'
  AND table_schema = 'public';

  -- Adicionar foreign key em financial_transactions se os tipos forem compatíveis
  IF os_id_type = 'uuid' AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'financial_transactions'
    AND constraint_name = 'financial_transactions_os_id_fkey'
  ) THEN
    ALTER TABLE financial_transactions
    ADD CONSTRAINT financial_transactions_os_id_fkey
    FOREIGN KEY (os_id) REFERENCES os(id);
    RAISE NOTICE 'Foreign key financial_transactions.os_id -> os.id adicionada';
  END IF;
END $$;

-- ========================================
-- Mensagem final
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database setup completed successfully!';
  RAISE NOTICE 'Execute check_existing_schema.sql para verificar a estrutura final';
END $$;
