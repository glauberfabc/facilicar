-- ========================================
-- CORRIGIR RLS DA TABELA USERS
-- Execute este arquivo no Supabase SQL Editor
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Corrigindo RLS de users...';
  RAISE NOTICE '';
END $$;

-- Remover policies antigas
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;

-- Policy: Cada usuário pode ver seu próprio perfil + usuários do mesmo establishment
CREATE POLICY "users_select"
ON users FOR SELECT
TO authenticated
USING (
  -- Pode ver seu próprio perfil
  id = auth.uid()
  OR
  -- Pode ver usuários do mesmo establishment
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR
  -- Super admin pode ver tudo
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Policy: Super admin pode criar usuários
CREATE POLICY "users_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Policy: Usuário pode atualizar seu próprio perfil OU super admin pode atualizar qualquer usuário
CREATE POLICY "users_update"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
)
WITH CHECK (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Policy: Somente super admin pode deletar usuários
CREATE POLICY "users_delete"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND COALESCE(is_super_admin, false) = true
  )
);

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS de users corrigido!';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora cada usuário pode:';
  RAISE NOTICE '  ✅ Ver seu próprio perfil';
  RAISE NOTICE '  ✅ Ver outros usuários do mesmo establishment';
  RAISE NOTICE '  ✅ Atualizar seu próprio perfil';
  RAISE NOTICE '';
  RAISE NOTICE 'Admins podem:';
  RAISE NOTICE '  ✅ Criar usuários no establishment';
  RAISE NOTICE '  ✅ Atualizar usuários do establishment';
  RAISE NOTICE '  ✅ Deletar usuários do establishment';
  RAISE NOTICE '';
END $$;

-- Verificar policies criadas
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
