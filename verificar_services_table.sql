-- Verificar estrutura e RLS da tabela services

-- ========================================
-- 1. VERIFICAR ESTRUTURA DA TABELA
-- ========================================

SELECT
  '=== COLUNAS DA TABELA SERVICES ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- ========================================
-- 2. VERIFICAR RLS
-- ========================================

SELECT
  '=== STATUS RLS ===' as info,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'services';

-- ========================================
-- 3. VERIFICAR POLICIES
-- ========================================

SELECT
  '=== POLICIES ===' as info,
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'services';

-- ========================================
-- 4. VER SERVIÇOS EXISTENTES
-- ========================================

SELECT
  '=== SERVIÇOS ===' as info,
  id,
  nome,
  valor,
  tempo_estimado,
  ativo
FROM services
ORDER BY nome;

-- ========================================
-- 5. VERIFICAR SE HÁ COLUNA ESTABLISHMENT_ID
-- ========================================

DO $$
DECLARE
  has_establishment_col BOOLEAN;
  rls_enabled BOOLEAN;
  policies_count INTEGER;
BEGIN
  -- Verificar coluna establishment_id
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'establishment_id'
  ) INTO has_establishment_col;

  -- Verificar RLS
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'services';

  -- Contar policies
  SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename = 'services';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== DIAGNÓSTICO SERVICES ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tem coluna establishment_id: %', has_establishment_col;
  RAISE NOTICE 'RLS habilitado: %', rls_enabled;
  RAISE NOTICE 'Número de policies: %', policies_count;
  RAISE NOTICE '';

  IF NOT has_establishment_col THEN
    RAISE NOTICE '⚠️ TABELA SERVICES NÃO TEM establishment_id';
    RAISE NOTICE 'Isso significa que TODOS os estabelecimentos compartilham';
    RAISE NOTICE 'a mesma tabela de serviços (pode ser intencional)';
    RAISE NOTICE '';
  END IF;

  IF rls_enabled AND policies_count = 0 THEN
    RAISE NOTICE '❌ RLS HABILITADO MAS SEM POLICIES!';
    RAISE NOTICE 'Isso vai BLOQUEAR todas as operações!';
    RAISE NOTICE '';
    RAISE NOTICE 'Solução: Execute um destes comandos:';
    RAISE NOTICE '1. Desabilitar RLS: ALTER TABLE services DISABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '2. Criar policies adequadas';
    RAISE NOTICE '';
  END IF;

  IF rls_enabled AND policies_count > 0 THEN
    RAISE NOTICE '✅ RLS habilitado com % policy(ies)', policies_count;
    RAISE NOTICE '';
  END IF;

  IF NOT rls_enabled THEN
    RAISE NOTICE '✅ RLS desabilitado - todos podem acessar';
    RAISE NOTICE '';
  END IF;
END $$;
