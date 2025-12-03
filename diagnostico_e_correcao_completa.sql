-- Diagnóstico e Correção Completa para Colaborador Não Ver Clientes

-- ========================================
-- 1. VERIFICAR ESTADO ATUAL
-- ========================================

-- Ver meu ID quando logado
SELECT
  '=== MEU ID ===' as info,
  auth.uid() as meu_id_uuid,
  auth.uid()::text as meu_id_text;

-- Ver meus dados
SELECT
  '=== MEUS DADOS ===' as info,
  id,
  nome,
  email,
  role,
  establishment_id,
  is_super_admin
FROM users
WHERE id = auth.uid()::text;

-- Ver todos os usuários
SELECT
  '=== TODOS OS USUÁRIOS ===' as info,
  u.nome,
  u.email,
  u.role,
  u.establishment_id,
  e.nome as empresa_nome
FROM users u
LEFT JOIN establishments e ON u.establishment_id = e.id
WHERE u.is_super_admin IS NOT TRUE
ORDER BY u.nome;

-- Ver clientes
SELECT
  '=== CLIENTES ===' as info,
  c.nome,
  c.establishment_id,
  e.nome as empresa_nome
FROM clients c
LEFT JOIN establishments e ON c.establishment_id = e.id
ORDER BY c.nome;

-- Ver veículos
SELECT
  '=== VEÍCULOS ===' as info,
  v.placa,
  v.establishment_id,
  e.nome as empresa_nome,
  c.nome as cliente_nome
FROM vehicles v
LEFT JOIN establishments e ON v.establishment_id = e.id
LEFT JOIN clients c ON v.cliente_id = c.id
ORDER BY v.placa;

-- Ver policies
SELECT
  '=== POLICIES ===' as info,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('clients', 'vehicles')
ORDER BY tablename, policyname;

-- ========================================
-- 2. TESTAR SE CONSIGO VER CLIENTES
-- ========================================

-- Esta query vai mostrar QUANTOS clientes você consegue ver
SELECT
  '=== TESTE DE ACESSO ===' as info,
  COUNT(*) as total_clientes_que_consigo_ver
FROM clients;

-- Se retornar 0, tem problema!

-- ========================================
-- 3. VERIFICAR RLS NA TABELA USERS
-- ========================================

-- Ver se RLS está habilitado em users
SELECT
  '=== RLS USERS ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Ver policies na tabela users
SELECT
  '=== POLICIES USERS ===' as info,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'users';

-- ========================================
-- 4. DIAGNÓSTICO RESUMIDO
-- ========================================

DO $$
DECLARE
  meu_id TEXT;
  meu_establishment UUID;
  users_sem_est INTEGER;
  clients_sem_est INTEGER;
  vehicles_sem_est INTEGER;
  policies_count INTEGER;
  clients_consigo_ver INTEGER;
  rls_users BOOLEAN;
BEGIN
  -- Pegar meu ID e establishment
  SELECT auth.uid()::text INTO meu_id;
  SELECT establishment_id INTO meu_establishment FROM users WHERE id = meu_id;

  -- Contar problemas
  SELECT COUNT(*) INTO users_sem_est FROM users WHERE establishment_id IS NULL AND is_super_admin IS NOT TRUE;
  SELECT COUNT(*) INTO clients_sem_est FROM clients WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO vehicles_sem_est FROM vehicles WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename IN ('clients', 'vehicles');

  -- Testar acesso
  SELECT COUNT(*) INTO clients_consigo_ver FROM clients;

  -- Ver se RLS está habilitado em users
  SELECT rowsecurity INTO rls_users FROM pg_tables WHERE tablename = 'users';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== DIAGNÓSTICO COMPLETO ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Meu ID: %', meu_id;
  RAISE NOTICE 'Meu establishment_id: %', meu_establishment;
  RAISE NOTICE '';
  RAISE NOTICE 'Usuários sem establishment_id: %', users_sem_est;
  RAISE NOTICE 'Clientes sem establishment_id: %', clients_sem_est;
  RAISE NOTICE 'Veículos sem establishment_id: %', vehicles_sem_est;
  RAISE NOTICE 'Policies RLS criadas: %', policies_count;
  RAISE NOTICE 'RLS habilitado em users: %', rls_users;
  RAISE NOTICE '';
  RAISE NOTICE 'TESTE: Clientes que consigo ver: %', clients_consigo_ver;
  RAISE NOTICE '';

  -- Identificar problemas
  IF meu_establishment IS NULL THEN
    RAISE NOTICE '❌❌❌ PROBLEMA CRÍTICO: Você não tem establishment_id!';
    RAISE NOTICE 'Execute:';
    RAISE NOTICE 'UPDATE users SET establishment_id = ''SEU-ESTABLISHMENT-ID'' WHERE id = ''%'';', meu_id;
    RAISE NOTICE '';
  END IF;

  IF clients_sem_est > 0 THEN
    RAISE NOTICE '❌ Problema: % clientes sem establishment_id', clients_sem_est;
    RAISE NOTICE '';
  END IF;

  IF vehicles_sem_est > 0 THEN
    RAISE NOTICE '❌ Problema: % veículos sem establishment_id', vehicles_sem_est;
    RAISE NOTICE '';
  END IF;

  IF policies_count = 0 THEN
    RAISE NOTICE '❌ Problema: Nenhuma policy criada';
    RAISE NOTICE 'Execute: fix_rls_policies_with_cast.sql';
    RAISE NOTICE '';
  ELSIF policies_count < 8 THEN
    RAISE NOTICE '⚠️ Atenção: Apenas % policies (esperado: 8)', policies_count;
    RAISE NOTICE 'Execute: fix_rls_policies_with_cast.sql';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ Policies: OK (% policies)', policies_count;
    RAISE NOTICE '';
  END IF;

  IF rls_users = true THEN
    RAISE NOTICE '⚠️ ATENÇÃO: RLS está habilitado na tabela users!';
    RAISE NOTICE 'Isso pode estar bloqueando o acesso.';
    RAISE NOTICE 'Desabilite com: ALTER TABLE users DISABLE ROW LEVEL SECURITY;';
    RAISE NOTICE '';
  END IF;

  IF clients_consigo_ver = 0 AND clients_sem_est = 0 THEN
    RAISE NOTICE '❌ PROBLEMA: Existem clientes mas você não consegue ver nenhum!';
    RAISE NOTICE '';
    RAISE NOTICE 'Possíveis causas:';
    RAISE NOTICE '1. RLS na tabela users está bloqueando';
    RAISE NOTICE '2. Policies não estão funcionando corretamente';
    RAISE NOTICE '3. Seu establishment_id não bate com o dos clientes';
    RAISE NOTICE '';
  END IF;

  IF meu_establishment IS NOT NULL AND clients_sem_est = 0 AND policies_count >= 8 AND clients_consigo_ver > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ TUDO OK! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Você consegue ver % cliente(s)!', clients_consigo_ver;
    RAISE NOTICE '';
  END IF;
END $$;

-- ========================================
-- 5. SOLUÇÕES RÁPIDAS
-- ========================================

-- DESCOMENTE AS SOLUÇÕES QUE PRECISA:

-- SOLUÇÃO 1: Desabilitar RLS na tabela users (se estiver bloqueando)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- SOLUÇÃO 2: Atualizar establishment_id do usuário logado
-- UPDATE users
-- SET establishment_id = (SELECT id FROM establishments LIMIT 1)
-- WHERE id = auth.uid()::text;

-- SOLUÇÃO 3: Atualizar clientes sem establishment_id
-- UPDATE clients
-- SET establishment_id = (SELECT id FROM establishments LIMIT 1)
-- WHERE establishment_id IS NULL;

-- SOLUÇÃO 4: Atualizar veículos sem establishment_id
-- UPDATE vehicles v
-- SET establishment_id = c.establishment_id
-- FROM clients c
-- WHERE v.cliente_id = c.id
-- AND v.establishment_id IS NULL;
