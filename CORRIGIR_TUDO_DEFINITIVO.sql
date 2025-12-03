-- ========================================
-- SCRIPT DEFINITIVO: CORRIGIR TODOS OS PROBLEMAS
-- Execute este arquivo COMPLETO no Supabase SQL Editor
-- ========================================

-- ==========================================
-- PARTE 1: ADICIONAR COLUNAS FALTANTES NA TABELA VEHICLES
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PARTE 1: Corrigindo tabela vehicles...';
  RAISE NOTICE '';
END $$;

-- Adicionar coluna 'marca' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'marca'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN marca TEXT;
    RAISE NOTICE '✅ Coluna marca adicionada à tabela vehicles';
  ELSE
    RAISE NOTICE '⚠️ Coluna marca já existe';
  END IF;
END $$;

-- Adicionar coluna 'modelo' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'modelo'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN modelo TEXT;
    RAISE NOTICE '✅ Coluna modelo adicionada à tabela vehicles';
  ELSE
    RAISE NOTICE '⚠️ Coluna modelo já existe';
  END IF;
END $$;

-- Adicionar coluna 'cor' se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'cor'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN cor TEXT;
    RAISE NOTICE '✅ Coluna cor adicionada à tabela vehicles';
  ELSE
    RAISE NOTICE '⚠️ Coluna cor já existe';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Colunas adicionadas em vehicles!';
  RAISE NOTICE '';
END $$;

-- ==========================================
-- PARTE 1.5: CORRIGIR RLS DA TABELA VEHICLES
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PARTE 1.5: Corrigindo RLS de vehicles...';
  RAISE NOTICE '';
END $$;

-- Remover policies antigas
DROP POLICY IF EXISTS "vehicles_select" ON vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicles_update" ON vehicles;
DROP POLICY IF EXISTS "vehicles_delete" ON vehicles;

-- Criar policies corretas para vehicles
CREATE POLICY "vehicles_select"
ON vehicles FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "vehicles_insert"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "vehicles_update"
ON vehicles FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "vehicles_delete"
ON vehicles FOR DELETE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE establishment_id IN (
      SELECT establishment_id FROM users WHERE id = auth.uid()
    )
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS de vehicles corrigido!';
  RAISE NOTICE '';
END $$;

-- ==========================================
-- PARTE 2: CORRIGIR RLS DA TABELA CLIENTS
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PARTE 2: Corrigindo RLS de clients...';
  RAISE NOTICE '';
END $$;

-- Remover policies antigas
DROP POLICY IF EXISTS "clients_select" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;
DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_delete" ON clients;

-- Criar policies corretas para clients
CREATE POLICY "clients_select"
ON clients FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "clients_insert"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "clients_update"
ON clients FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "clients_delete"
ON clients FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS de clients corrigido!';
  RAISE NOTICE '';
END $$;

-- ==========================================
-- PARTE 3: RECRIAR TABELA APPOINTMENTS
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PARTE 3: Recriando tabela appointments...';
  RAISE NOTICE '';
END $$;

-- Backup opcional (descomente se houver dados)
/*
CREATE TABLE appointments_backup AS
SELECT * FROM appointments;
*/

-- Dropar tabela antiga
DROP TABLE IF EXISTS appointments CASCADE;

-- Criar tabela com estrutura correta
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL,
  client_id UUID NOT NULL,
  vehicle_id UUID,
  service_id TEXT,
  data_agendamento TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  observacoes TEXT,
  valor_estimado NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Criar foreign keys
ALTER TABLE appointments
ADD CONSTRAINT appointments_establishment_id_fkey
FOREIGN KEY (establishment_id)
REFERENCES establishments(id)
ON DELETE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_vehicle_id_fkey
FOREIGN KEY (vehicle_id)
REFERENCES vehicles(id)
ON DELETE SET NULL;

ALTER TABLE appointments
ADD CONSTRAINT appointments_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- Criar índices
CREATE INDEX idx_appointments_establishment ON appointments(establishment_id);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(data_agendamento);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Criar policies para appointments
DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;

CREATE POLICY "appointments_select"
ON appointments FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "appointments_insert"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "appointments_update"
ON appointments FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "appointments_delete"
ON appointments FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointments_updated_at();

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tabela appointments recriada!';
  RAISE NOTICE '';
END $$;

-- ==========================================
-- PARTE 4: CORRIGIR RLS DE VEHICLE_CATEGORIES
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PARTE 4: Corrigindo RLS de vehicle_categories...';
  RAISE NOTICE '';
END $$;

-- Remover policies antigas
DROP POLICY IF EXISTS "vehicle_categories_select" ON vehicle_categories;
DROP POLICY IF EXISTS "vehicle_categories_insert" ON vehicle_categories;
DROP POLICY IF EXISTS "vehicle_categories_update" ON vehicle_categories;
DROP POLICY IF EXISTS "vehicle_categories_delete" ON vehicle_categories;

-- Criar policies corretas
CREATE POLICY "vehicle_categories_select"
ON vehicle_categories FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "vehicle_categories_insert"
ON vehicle_categories FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "vehicle_categories_update"
ON vehicle_categories FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
)
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

CREATE POLICY "vehicle_categories_delete"
ON vehicle_categories FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS de vehicle_categories corrigido!';
  RAISE NOTICE '';
END $$;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ TUDO CORRIGIDO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'O que foi feito:';
  RAISE NOTICE '  ✅ Colunas marca, modelo, cor adicionadas em vehicles';
  RAISE NOTICE '  ✅ RLS de vehicles corrigido';
  RAISE NOTICE '  ✅ RLS de clients corrigido';
  RAISE NOTICE '  ✅ Tabela appointments recriada';
  RAISE NOTICE '  ✅ Foreign keys criadas';
  RAISE NOTICE '  ✅ RLS de appointments configurado';
  RAISE NOTICE '  ✅ RLS de vehicle_categories corrigido';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASSOS:';
  RAISE NOTICE '  1. Faça HARD REFRESH no navegador';
  RAISE NOTICE '     Windows: Ctrl + Shift + R';
  RAISE NOTICE '     Mac: Cmd + Shift + R';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Teste criar categorias';
  RAISE NOTICE '  3. Teste criar clientes e veículos';
  RAISE NOTICE '  4. Teste criar agendamentos';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- Verificar estrutura de vehicles
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Verificar estrutura de appointments
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Verificar policies de vehicles
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'vehicles'
ORDER BY policyname;

-- Verificar policies de clients
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'clients'
ORDER BY policyname;

-- Verificar policies de appointments
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- Verificar policies de vehicle_categories
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'vehicle_categories'
ORDER BY policyname;
