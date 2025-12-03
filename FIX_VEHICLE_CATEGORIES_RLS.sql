-- ========================================
-- CORRIGIR RLS DA TABELA VEHICLE_CATEGORIES
-- Execute este arquivo no Supabase SQL Editor
-- ========================================

-- PASSO 1: Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "vehicle_categories_select" ON vehicle_categories;
DROP POLICY IF EXISTS "vehicle_categories_insert" ON vehicle_categories;
DROP POLICY IF EXISTS "vehicle_categories_update" ON vehicle_categories;
DROP POLICY IF EXISTS "vehicle_categories_delete" ON vehicle_categories;

-- PASSO 2: Criar policies corretas

-- Policy: Ver categorias do próprio establishment
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

-- Policy: Inserir categorias
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

-- Policy: Atualizar categorias
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

-- Policy: Deletar categorias
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

-- PASSO 3: Verificar se RLS está habilitado
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Verificar policies criadas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'vehicle_categories'
ORDER BY policyname;

-- MENSAGEM FINAL
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ RLS CORRIGIDO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies criadas:';
  RAISE NOTICE '  ✅ vehicle_categories_select';
  RAISE NOTICE '  ✅ vehicle_categories_insert';
  RAISE NOTICE '  ✅ vehicle_categories_update';
  RAISE NOTICE '  ✅ vehicle_categories_delete';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora você pode criar categorias!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
