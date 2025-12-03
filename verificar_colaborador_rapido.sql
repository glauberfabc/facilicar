-- Verificação rápida para colaborador não ver clientes

-- ========================================
-- 1. VER USUÁRIOS E SEUS ESTABLISHMENTS
-- ========================================

SELECT
  'USUÁRIOS' as categoria,
  u.nome,
  u.email,
  u.role,
  u.establishment_id,
  e.nome as empresa_nome
FROM users u
LEFT JOIN establishments e ON u.establishment_id = e.id
WHERE u.is_super_admin IS NOT TRUE
ORDER BY u.nome;

-- ========================================
-- 2. VER CLIENTES E SEUS ESTABLISHMENTS
-- ========================================

SELECT
  'CLIENTES' as categoria,
  c.nome,
  c.establishment_id,
  e.nome as empresa_nome
FROM clients c
LEFT JOIN establishments e ON c.establishment_id = e.id
ORDER BY c.nome;

-- ========================================
-- 3. VER VEÍCULOS E SEUS ESTABLISHMENTS
-- ========================================

SELECT
  'VEÍCULOS' as categoria,
  v.placa,
  v.establishment_id,
  e.nome as empresa_nome,
  c.nome as cliente_nome
FROM vehicles v
LEFT JOIN establishments e ON v.establishment_id = e.id
LEFT JOIN clients c ON v.cliente_id = c.id
ORDER BY v.placa;

-- ========================================
-- 4. VERIFICAR POLICIES
-- ========================================

SELECT
  'POLICIES' as categoria,
  tablename,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename IN ('clients', 'vehicles')
ORDER BY tablename, policyname;

-- ========================================
-- 5. DIAGNÓSTICO RESUMIDO
-- ========================================

DO $$
DECLARE
  users_sem_est INTEGER;
  clients_sem_est INTEGER;
  vehicles_sem_est INTEGER;
  policies_count INTEGER;
BEGIN
  -- Contar problemas
  SELECT COUNT(*) INTO users_sem_est FROM users WHERE establishment_id IS NULL AND is_super_admin IS NOT TRUE;
  SELECT COUNT(*) INTO clients_sem_est FROM clients WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO vehicles_sem_est FROM vehicles WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename IN ('clients', 'vehicles');

  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNÓSTICO RESUMIDO ===';
  RAISE NOTICE '';
  RAISE NOTICE 'Usuários sem establishment_id: %', users_sem_est;
  RAISE NOTICE 'Clientes sem establishment_id: %', clients_sem_est;
  RAISE NOTICE 'Veículos sem establishment_id: %', vehicles_sem_est;
  RAISE NOTICE 'Policies RLS criadas: %', policies_count;
  RAISE NOTICE '';

  IF users_sem_est > 0 THEN
    RAISE NOTICE '❌ Corrigir: Usuários sem establishment_id';
  END IF;

  IF clients_sem_est > 0 THEN
    RAISE NOTICE '❌ Corrigir: Clientes sem establishment_id';
    RAISE NOTICE '   Execute: update_existing_clients_establishment.sql';
  END IF;

  IF vehicles_sem_est > 0 THEN
    RAISE NOTICE '❌ Corrigir: Veículos sem establishment_id';
    RAISE NOTICE '   Execute: update_existing_clients_establishment.sql';
  END IF;

  IF policies_count < 8 THEN
    RAISE NOTICE '❌ Corrigir: Faltam policies RLS';
    RAISE NOTICE '   Execute: fix_rls_colaborador_view.sql';
  ELSE
    RAISE NOTICE '✅ Policies RLS: OK';
  END IF;

  IF users_sem_est = 0 AND clients_sem_est = 0 AND vehicles_sem_est = 0 AND policies_count >= 8 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅✅✅ TUDO OK! ✅✅✅';
    RAISE NOTICE '';
  END IF;
END $$;
