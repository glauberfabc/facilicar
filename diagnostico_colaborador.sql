-- Script de diagnóstico completo para descobrir por que colaborador não vê clientes

-- ========================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 1. ESTRUTURA DAS TABELAS ===';
  RAISE NOTICE '';
END $$;

-- Ver colunas da tabela users
SELECT
  'users' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('id', 'email', 'establishment_id', 'role', 'is_super_admin')
ORDER BY ordinal_position;

-- Ver colunas da tabela clients
SELECT
  'clients' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clients'
AND column_name IN ('id', 'nome', 'establishment_id', 'created_at')
ORDER BY ordinal_position;

-- Ver colunas da tabela vehicles
SELECT
  'vehicles' as tabela,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
AND column_name IN ('id', 'placa', 'establishment_id', 'cliente_id', 'created_at')
ORDER BY ordinal_position;

-- ========================================
-- 2. VERIFICAR RLS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 2. STATUS DO RLS ===';
  RAISE NOTICE '';
END $$;

-- Ver se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('clients', 'vehicles', 'users')
ORDER BY tablename;

-- Ver policies existentes
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operacao,
  CASE
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE array_to_string(roles, ', ')
  END as usuarios
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('clients', 'vehicles')
ORDER BY tablename, policyname;

-- ========================================
-- 3. VERIFICAR DADOS DOS USUÁRIOS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 3. USUÁRIOS NO SISTEMA ===';
  RAISE NOTICE '';
END $$;

-- Ver todos os usuários
SELECT
  u.id,
  u.nome,
  u.email,
  u.role,
  u.establishment_id,
  u.is_super_admin,
  e.nome as empresa_nome
FROM users u
LEFT JOIN establishments e ON u.establishment_id = e.id
ORDER BY u.nome;

-- Contar usuários por estabelecimento
SELECT
  e.nome as empresa,
  u.role,
  COUNT(*) as quantidade
FROM users u
LEFT JOIN establishments e ON u.establishment_id = e.id
GROUP BY e.nome, u.role
ORDER BY e.nome, u.role;

-- ========================================
-- 4. VERIFICAR DADOS DOS CLIENTES
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 4. CLIENTES NO SISTEMA ===';
  RAISE NOTICE '';
END $$;

-- Ver clientes e seus establishments
SELECT
  c.id,
  c.nome as cliente_nome,
  c.establishment_id,
  e.nome as empresa_nome,
  c.created_at
FROM clients c
LEFT JOIN establishments e ON c.establishment_id = e.id
ORDER BY c.created_at DESC
LIMIT 20;

-- Contar clientes por estabelecimento
SELECT
  CASE
    WHEN c.establishment_id IS NULL THEN '❌ SEM EMPRESA'
    ELSE e.nome
  END as empresa,
  COUNT(*) as total_clientes
FROM clients c
LEFT JOIN establishments e ON c.establishment_id = e.id
GROUP BY c.establishment_id, e.nome
ORDER BY total_clientes DESC;

-- ========================================
-- 5. VERIFICAR DADOS DOS VEÍCULOS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 5. VEÍCULOS NO SISTEMA ===';
  RAISE NOTICE '';
END $$;

-- Ver veículos e seus establishments
SELECT
  v.id,
  v.placa,
  v.establishment_id,
  e.nome as empresa_nome,
  c.nome as cliente_nome
FROM vehicles v
LEFT JOIN establishments e ON v.establishment_id = e.id
LEFT JOIN clients c ON v.cliente_id = c.id
ORDER BY v.placa
LIMIT 20;

-- Contar veículos por estabelecimento
SELECT
  CASE
    WHEN v.establishment_id IS NULL THEN '❌ SEM EMPRESA'
    ELSE e.nome
  END as empresa,
  COUNT(*) as total_veiculos
FROM vehicles v
LEFT JOIN establishments e ON v.establishment_id = e.id
GROUP BY v.establishment_id, e.nome
ORDER BY total_veiculos DESC;

-- ========================================
-- 6. SIMULAR QUERY DO COLABORADOR
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 6. SIMULAÇÃO DE ACESSO ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Para testar como colaborador, execute esta query:';
  RAISE NOTICE '';
  RAISE NOTICE 'SELECT * FROM clients WHERE establishment_id = (';
  RAISE NOTICE '  SELECT establishment_id FROM users WHERE email = ''colaborador@empresa.com''';
  RAISE NOTICE ');';
  RAISE NOTICE '';
END $$;

-- ========================================
-- 7. IDENTIFICAR PROBLEMAS
-- ========================================

DO $$
DECLARE
  users_sem_est INTEGER;
  clients_sem_est INTEGER;
  vehicles_sem_est INTEGER;
  policies_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 7. DIAGNÓSTICO DE PROBLEMAS ===';
  RAISE NOTICE '';

  -- Contar usuários sem establishment_id
  SELECT COUNT(*) INTO users_sem_est
  FROM users
  WHERE establishment_id IS NULL AND is_super_admin IS NOT TRUE;

  -- Contar clientes sem establishment_id
  SELECT COUNT(*) INTO clients_sem_est
  FROM clients
  WHERE establishment_id IS NULL;

  -- Contar veículos sem establishment_id
  SELECT COUNT(*) INTO vehicles_sem_est
  FROM vehicles
  WHERE establishment_id IS NULL;

  -- Contar policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE tablename IN ('clients', 'vehicles');

  -- Reportar problemas
  IF users_sem_est > 0 THEN
    RAISE NOTICE '❌ PROBLEMA: % usuários sem establishment_id', users_sem_est;
    RAISE NOTICE '   SOLUÇÃO: Atualizar tabela users com establishment_id correto';
    RAISE NOTICE '';
  END IF;

  IF clients_sem_est > 0 THEN
    RAISE NOTICE '❌ PROBLEMA: % clientes sem establishment_id', clients_sem_est;
    RAISE NOTICE '   SOLUÇÃO: Execute update_existing_clients_establishment.sql';
    RAISE NOTICE '';
  END IF;

  IF vehicles_sem_est > 0 THEN
    RAISE NOTICE '❌ PROBLEMA: % veículos sem establishment_id', vehicles_sem_est;
    RAISE NOTICE '   SOLUÇÃO: Execute update_existing_clients_establishment.sql';
    RAISE NOTICE '';
  END IF;

  IF policies_count = 0 THEN
    RAISE NOTICE '❌ PROBLEMA: Nenhuma policy RLS encontrada';
    RAISE NOTICE '   SOLUÇÃO: Execute fix_rls_colaborador_view.sql';
    RAISE NOTICE '';
  ELSIF policies_count < 8 THEN
    RAISE NOTICE '⚠️ ATENÇÃO: Apenas % policies encontradas (esperado: 8)', policies_count;
    RAISE NOTICE '   SOLUÇÃO: Execute fix_rls_colaborador_view.sql';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ Policies RLS: OK (% policies)', policies_count;
  END IF;

  IF users_sem_est = 0 AND clients_sem_est = 0 AND vehicles_sem_est = 0 AND policies_count >= 8 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ TUDO OK! Estrutura está correta.';
    RAISE NOTICE '';
    RAISE NOTICE 'Se ainda não funciona, verifique:';
    RAISE NOTICE '1. O colaborador está fazendo login corretamente?';
    RAISE NOTICE '2. O auth.uid() retorna o ID correto do usuário?';
    RAISE NOTICE '3. Execute: SELECT auth.uid(); (quando logado)';
  END IF;
END $$;

-- ========================================
-- 8. COMANDOS ÚTEIS PARA CORRIGIR
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== 8. COMANDOS PARA CORRIGIR ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Se encontrou problemas, execute na ordem:';
  RAISE NOTICE '';
  RAISE NOTICE '1. fix_clients_rls_establishment.sql';
  RAISE NOTICE '   (Adiciona colunas e configura RLS)';
  RAISE NOTICE '';
  RAISE NOTICE '2. update_existing_clients_establishment.sql';
  RAISE NOTICE '   (Atualiza dados existentes)';
  RAISE NOTICE '';
  RAISE NOTICE '3. fix_rls_colaborador_view.sql';
  RAISE NOTICE '   (Corrige policies RLS)';
  RAISE NOTICE '';
END $$;
