-- ========================================
-- CORRIGIR RLS DA TABELA USERS (SEM RECURSÃO)
-- Execute este arquivo no Supabase SQL Editor
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Corrigindo RLS de users (versão sem recursão)...';
  RAISE NOTICE '';
END $$;

-- Remover policies antigas
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;

-- Criar funções auxiliares para evitar recursão
-- Estas funções usam SECURITY DEFINER para bypassar RLS temporariamente

-- Função: Obter establishment_id do usuário atual
CREATE OR REPLACE FUNCTION get_user_establishment_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_establishment_id UUID;
BEGIN
  SELECT establishment_id INTO v_establishment_id
  FROM users
  WHERE id = auth.uid();

  RETURN v_establishment_id;
END;
$$;

-- Função: Verificar se o usuário atual é super admin
CREATE OR REPLACE FUNCTION is_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin BOOLEAN;
BEGIN
  SELECT COALESCE(is_super_admin, false) INTO v_is_super_admin
  FROM users
  WHERE id = auth.uid();

  RETURN COALESCE(v_is_super_admin, false);
END;
$$;

-- Policy: Cada usuário pode ver seu próprio perfil + usuários do mesmo establishment
CREATE POLICY "users_select"
ON users FOR SELECT
TO authenticated
USING (
  -- Pode ver seu próprio perfil
  id = auth.uid()
  OR
  -- Pode ver usuários do mesmo establishment
  establishment_id = get_user_establishment_id()
  OR
  -- Super admin pode ver tudo
  is_user_super_admin() = true
);

-- Policy: Somente super admin pode criar usuários
CREATE POLICY "users_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  is_user_super_admin() = true
);

-- Policy: Usuário pode atualizar seu próprio perfil OU super admin pode atualizar qualquer usuário
CREATE POLICY "users_update"
ON users FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR
  is_user_super_admin() = true
)
WITH CHECK (
  id = auth.uid()
  OR
  is_user_super_admin() = true
);

-- Policy: Somente super admin pode deletar usuários
CREATE POLICY "users_delete"
ON users FOR DELETE
TO authenticated
USING (
  is_user_super_admin() = true
);

-- Garantir que RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS de users corrigido (sem recursão)!';
  RAISE NOTICE '';
  RAISE NOTICE 'O que foi feito:';
  RAISE NOTICE '  ✅ Criadas funções auxiliares (get_user_establishment_id, is_user_super_admin)';
  RAISE NOTICE '  ✅ Policy SELECT: ver próprio perfil + usuários do mesmo establishment';
  RAISE NOTICE '  ✅ Policy INSERT: somente super admin';
  RAISE NOTICE '  ✅ Policy UPDATE: próprio perfil ou super admin';
  RAISE NOTICE '  ✅ Policy DELETE: somente super admin';
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
