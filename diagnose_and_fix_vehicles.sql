-- Diagnóstico e correção completa da tabela vehicles

-- ========================================
-- PASSO 1: Habilitar extensão UUID
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- PASSO 2: Verificar estrutura atual
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '=== ESTRUTURA ATUAL DA TABELA VEHICLES ===';
END $$;

SELECT
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- ========================================
-- PASSO 3: Verificar tipo do ID
-- ========================================
DO $$
DECLARE
  id_type TEXT;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_name = 'vehicles' AND column_name = 'id';

  RAISE NOTICE 'Tipo do vehicles.id: %', id_type;

  IF id_type = 'text' THEN
    RAISE NOTICE '⚠️ PROBLEMA: vehicles.id é TEXT, deveria ser UUID!';
    RAISE NOTICE 'Será necessário recriar a tabela.';
  ELSIF id_type = 'uuid' THEN
    RAISE NOTICE '✅ Tipo correto: UUID';
  END IF;
END $$;

-- ========================================
-- PASSO 4: Verificar se há dados na tabela
-- ========================================
DO $$
DECLARE
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO record_count FROM vehicles;
  RAISE NOTICE 'Registros na tabela vehicles: %', record_count;
END $$;

-- ========================================
-- PASSO 5: RECRIAR TABELA (apenas se ID for TEXT)
-- ========================================
-- ATENÇÃO: Isso vai deletar todos os veículos!
-- Remova o comentário abaixo APENAS se ID for TEXT e você confirmar

/*
-- Backup dos dados (se existirem)
CREATE TEMP TABLE vehicles_backup AS SELECT * FROM vehicles;

-- Deletar tabela antiga
DROP TABLE IF EXISTS vehicles CASCADE;

-- Criar tabela correta
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Hatch', 'Sedan', 'SUV', 'Caminhonete', 'Moto', 'Van', 'Pickup')),
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_vehicles_cliente_id ON vehicles(cliente_id);
CREATE INDEX idx_vehicles_categoria ON vehicles(categoria);
CREATE INDEX idx_vehicles_placa ON vehicles(placa);

-- Mensagem
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela vehicles recriada com sucesso!';
END $$;
*/

-- ========================================
-- PASSO 6: SE ID JÁ FOR UUID, apenas garantir DEFAULT
-- ========================================
DO $$
DECLARE
  id_type TEXT;
  current_default TEXT;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_name = 'vehicles' AND column_name = 'id';

  SELECT column_default INTO current_default
  FROM information_schema.columns
  WHERE table_name = 'vehicles' AND column_name = 'id';

  IF id_type = 'uuid' THEN
    IF current_default IS NULL OR current_default NOT LIKE '%uuid_generate_v4%' THEN
      EXECUTE 'ALTER TABLE vehicles ALTER COLUMN id SET DEFAULT uuid_generate_v4()';
      RAISE NOTICE '✅ DEFAULT uuid_generate_v4() adicionado';
    ELSE
      RAISE NOTICE '✅ DEFAULT já está configurado: %', current_default;
    END IF;
  END IF;
END $$;

-- ========================================
-- PASSO 7: Verificar se categoria existe
-- ========================================
DO $$
DECLARE
  has_categoria BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'categoria'
  ) INTO has_categoria;

  IF NOT has_categoria THEN
    RAISE NOTICE '⚠️ Coluna categoria NÃO existe! Execute update_client_vehicle_schema.sql';
  ELSE
    RAISE NOTICE '✅ Coluna categoria existe';
  END IF;
END $$;

-- ========================================
-- PASSO 8: Verificar foreign key cliente_id
-- ========================================
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'vehicles'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%cliente_id%'
  ) INTO fk_exists;

  IF NOT fk_exists THEN
    RAISE NOTICE '⚠️ Foreign key cliente_id não existe!';
  ELSE
    RAISE NOTICE '✅ Foreign key cliente_id existe';
  END IF;
END $$;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
  RAISE NOTICE 'Execute esta query para ver a estrutura completa:';
  RAISE NOTICE 'SELECT * FROM information_schema.columns WHERE table_name = ''vehicles'';';
END $$;
