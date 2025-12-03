-- Atualizar Schema de Clientes e Veículos
-- Clientes agora têm veículos vinculados com categorias

-- ========================================
-- PASSO 1: Atualizar tabela de clientes
-- ========================================

-- Remover campos de veículo da tabela clients (mover para vehicles)
-- Nota: Se houver dados, você precisará migrá-los manualmente

-- Adicionar establishment_id aos clientes (para multi-tenant)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'establishment_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN establishment_id UUID;
    RAISE NOTICE 'Coluna establishment_id adicionada à tabela clients';
  END IF;
END $$;

-- ========================================
-- PASSO 2: Atualizar tabela de veículos
-- ========================================

-- Adicionar categoria ao veículo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'categoria'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN categoria TEXT;
    RAISE NOTICE 'Coluna categoria adicionada à tabela vehicles';
  END IF;
END $$;

-- Adicionar constraint para validar categorias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'vehicles_categoria_check'
  ) THEN
    ALTER TABLE vehicles ADD CONSTRAINT vehicles_categoria_check
    CHECK (categoria IN ('Hatch', 'Sedan', 'SUV', 'Caminhonete', 'Moto', 'Van', 'Pickup'));
    RAISE NOTICE 'Constraint de validação de categoria adicionada';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint vehicles_categoria_check já existe';
END $$;

-- ========================================
-- PASSO 3: Atualizar tabela establishments (dados da empresa)
-- ========================================

-- Adicionar CEP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'cep'
  ) THEN
    ALTER TABLE establishments ADD COLUMN cep TEXT;
    RAISE NOTICE 'Coluna cep adicionada à tabela establishments';
  END IF;
END $$;

-- Adicionar Endereço
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'endereco'
  ) THEN
    ALTER TABLE establishments ADD COLUMN endereco TEXT;
    RAISE NOTICE 'Coluna endereco adicionada à tabela establishments';
  END IF;
END $$;

-- Adicionar Bairro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'bairro'
  ) THEN
    ALTER TABLE establishments ADD COLUMN bairro TEXT;
    RAISE NOTICE 'Coluna bairro adicionada à tabela establishments';
  END IF;
END $$;

-- Adicionar Cidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'cidade'
  ) THEN
    ALTER TABLE establishments ADD COLUMN cidade TEXT;
    RAISE NOTICE 'Coluna cidade adicionada à tabela establishments';
  END IF;
END $$;

-- Adicionar Estado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'estado'
  ) THEN
    ALTER TABLE establishments ADD COLUMN estado TEXT;
    RAISE NOTICE 'Coluna estado adicionada à tabela establishments';
  END IF;
END $$;

-- ========================================
-- PASSO 4: Criar tabela de preços por categoria
-- ========================================

CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services,
  categoria TEXT NOT NULL CHECK (categoria IN ('Hatch', 'Sedan', 'SUV', 'Caminhonete', 'Moto', 'Van', 'Pickup')),
  valor DECIMAL(10,2) NOT NULL,
  tempo_estimado INTEGER,
  establishment_id UUID REFERENCES establishments,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, categoria, establishment_id)
);

CREATE INDEX IF NOT EXISTS idx_service_prices_service_id ON service_prices(service_id);
CREATE INDEX IF NOT EXISTS idx_service_prices_categoria ON service_prices(categoria);
CREATE INDEX IF NOT EXISTS idx_service_prices_establishment_id ON service_prices(establishment_id);

-- ========================================
-- PASSO 5: Criar índices adicionais
-- ========================================

CREATE INDEX IF NOT EXISTS idx_clients_establishment_id ON clients(establishment_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_categoria ON vehicles(categoria);

-- ========================================
-- Mensagem final
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Schema de clientes e veículos atualizado!';
  RAISE NOTICE '';
  RAISE NOTICE 'Mudanças aplicadas:';
  RAISE NOTICE '  1. Clientes agora têm establishment_id';
  RAISE NOTICE '  2. Veículos têm categoria (Hatch, Sedan, SUV, etc)';
  RAISE NOTICE '  3. Establishments têm endereço completo (CEP, Rua, Bairro, Cidade, Estado)';
  RAISE NOTICE '  4. Tabela service_prices para preços por categoria';
  RAISE NOTICE '';
  RAISE NOTICE 'Estrutura:';
  RAISE NOTICE '  Cliente (nome, telefone, email)';
  RAISE NOTICE '    └─> Veículo (placa, modelo, cor, categoria)';
  RAISE NOTICE '        └─> Serviço tem preço específico por categoria';
END $$;
