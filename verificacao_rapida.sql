-- VERIFICAÇÃO RÁPIDA - Execute isso no Supabase SQL Editor

-- Ver se RLS está desabilitado em users
SELECT
  '=== STATUS RLS ===' as info,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename IN ('users', 'clients', 'vehicles')
ORDER BY tablename;

-- Ver quantas policies existem
SELECT
  '=== POLICIES ===' as info,
  tablename,
  COUNT(*) as quantidade_policies
FROM pg_policies
WHERE tablename IN ('clients', 'vehicles')
GROUP BY tablename;

-- Ver todos os clientes com seus establishments
SELECT
  '=== CLIENTES ===' as info,
  c.id,
  c.nome,
  c.establishment_id,
  e.nome as empresa_nome
FROM clients c
LEFT JOIN establishments e ON c.establishment_id = e.id
ORDER BY c.nome;

-- Ver todos os usuários com seus establishments
SELECT
  '=== USUÁRIOS ===' as info,
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

-- RESUMO FINAL
DO $$
DECLARE
  rls_users BOOLEAN;
  policies_clients INTEGER;
  policies_vehicles INTEGER;
  total_clients INTEGER;
  users_sem_est INTEGER;
  clients_sem_est INTEGER;
BEGIN
  SELECT rowsecurity INTO rls_users FROM pg_tables WHERE tablename = 'users';
  SELECT COUNT(*) INTO policies_clients FROM pg_policies WHERE tablename = 'clients';
  SELECT COUNT(*) INTO policies_vehicles FROM pg_policies WHERE tablename = 'vehicles';
  SELECT COUNT(*) INTO total_clients FROM clients;
  SELECT COUNT(*) INTO users_sem_est FROM users WHERE establishment_id IS NULL AND is_super_admin IS NOT TRUE;
  SELECT COUNT(*) INTO clients_sem_est FROM clients WHERE establishment_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== RESUMO ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS em users: % (deve ser FALSE)', rls_users;
  RAISE NOTICE 'Policies em clients: % (deve ser 4)', policies_clients;
  RAISE NOTICE 'Policies em vehicles: % (deve ser 4)', policies_vehicles;
  RAISE NOTICE '';
  RAISE NOTICE 'Total de clientes: %', total_clients;
  RAISE NOTICE 'Usuários sem establishment_id: %', users_sem_est;
  RAISE NOTICE 'Clientes sem establishment_id: %', clients_sem_est;
  RAISE NOTICE '';

  IF rls_users = false AND policies_clients = 4 AND policies_vehicles = 4 AND users_sem_est = 0 AND clients_sem_est = 0 THEN
    RAISE NOTICE '✅ TUDO CORRETO!';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Faça LOGOUT do sistema';
    RAISE NOTICE '2. Faça LOGIN novamente';
    RAISE NOTICE '3. Acesse Clientes';
    RAISE NOTICE '4. Abra o Console do navegador (F12)';
    RAISE NOTICE '5. Veja as mensagens de DEBUG';
  ELSE
    RAISE NOTICE '❌ HÁ PROBLEMAS:';
    IF rls_users = true THEN
      RAISE NOTICE '  - RLS ainda está HABILITADO em users!';
    END IF;
    IF policies_clients <> 4 THEN
      RAISE NOTICE '  - Policies incorretas em clients: %', policies_clients;
    END IF;
    IF policies_vehicles <> 4 THEN
      RAISE NOTICE '  - Policies incorretas em vehicles: %', policies_vehicles;
    END IF;
    IF users_sem_est > 0 THEN
      RAISE NOTICE '  - Usuários sem establishment_id: %', users_sem_est;
    END IF;
    IF clients_sem_est > 0 THEN
      RAISE NOTICE '  - Clientes sem establishment_id: %', clients_sem_est;
    END IF;
    RAISE NOTICE '';
    RAISE NOTICE 'RODE O SCRIPT: solucao_final_definitiva.sql';
  END IF;
END $$;
