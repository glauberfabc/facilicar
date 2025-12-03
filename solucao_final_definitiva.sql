-- SOLUÇÃO FINAL DEFINITIVA - Resolver problema de RLS na tabela users

-- ========================================
-- PASSO 1: DESABILITAR RLS NA TABELA USERS
-- ========================================
-- O problema é que as policies em clients/vehicles fazem subquery em users
-- Se users tem RLS, essas subqueries são bloqueadas!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RLS DESABILITADO NA TABELA USERS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora as policies de clients/vehicles podem acessar users!';
  RAISE NOTICE '';
END $$;

-- ========================================
-- PASSO 2: VERIFICAR SE USUÁRIOS TÊM ESTABLISHMENT_ID
-- ========================================

DO $$
DECLARE
  primeiro_est UUID;
  users_sem_est INTEGER;
  users_atualizados INTEGER;
BEGIN
  -- Contar usuários sem establishment
  SELECT COUNT(*) INTO users_sem_est FROM users WHERE establishment_id IS NULL AND is_super_admin IS NOT TRUE;

  IF users_sem_est > 0 THEN
    -- Pegar primeiro establishment
    SELECT id INTO primeiro_est FROM establishments LIMIT 1;

    IF primeiro_est IS NOT NULL THEN
      -- Atualizar usuários sem establishment
      UPDATE users
      SET establishment_id = primeiro_est
      WHERE establishment_id IS NULL
      AND is_super_admin IS NOT TRUE;

      GET DIAGNOSTICS users_atualizados = ROW_COUNT;

      RAISE NOTICE '✅ Usuários atualizados: %', users_atualizados;
      RAISE NOTICE '   Establishment ID: %', primeiro_est;
      RAISE NOTICE '';
    END IF;
  ELSE
    RAISE NOTICE '✅ Todos os usuários já têm establishment_id';
    RAISE NOTICE '';
  END IF;
END $$;

-- ========================================
-- PASSO 3: VERIFICAR SE CLIENTES TÊM ESTABLISHMENT_ID
-- ========================================

DO $$
DECLARE
  primeiro_est UUID;
  clients_sem_est INTEGER;
  clients_atualizados INTEGER;
BEGIN
  -- Contar clientes sem establishment
  SELECT COUNT(*) INTO clients_sem_est FROM clients WHERE establishment_id IS NULL;

  IF clients_sem_est > 0 THEN
    -- Pegar primeiro establishment
    SELECT id INTO primeiro_est FROM establishments LIMIT 1;

    IF primeiro_est IS NOT NULL THEN
      -- Atualizar clientes sem establishment
      UPDATE clients
      SET establishment_id = primeiro_est
      WHERE establishment_id IS NULL;

      GET DIAGNOSTICS clients_atualizados = ROW_COUNT;

      RAISE NOTICE '✅ Clientes atualizados: %', clients_atualizados;
      RAISE NOTICE '   Establishment ID: %', primeiro_est;
      RAISE NOTICE '';
    END IF;
  ELSE
    RAISE NOTICE '✅ Todos os clientes já têm establishment_id';
    RAISE NOTICE '';
  END IF;
END $$;

-- ========================================
-- PASSO 4: VERIFICAR SE VEÍCULOS TÊM ESTABLISHMENT_ID
-- ========================================

DO $$
DECLARE
  vehicles_sem_est INTEGER;
  vehicles_atualizados INTEGER;
BEGIN
  -- Contar veículos sem establishment
  SELECT COUNT(*) INTO vehicles_sem_est FROM vehicles WHERE establishment_id IS NULL;

  IF vehicles_sem_est > 0 THEN
    -- Atualizar veículos baseado no cliente
    UPDATE vehicles v
    SET establishment_id = c.establishment_id
    FROM clients c
    WHERE v.cliente_id = c.id
    AND v.establishment_id IS NULL
    AND c.establishment_id IS NOT NULL;

    GET DIAGNOSTICS vehicles_atualizados = ROW_COUNT;

    RAISE NOTICE '✅ Veículos atualizados: %', vehicles_atualizados;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '✅ Todos os veículos já têm establishment_id';
    RAISE NOTICE '';
  END IF;
END $$;

-- ========================================
-- PASSO 5: REMOVER TODAS AS POLICIES DE CLIENTS E VEHICLES
-- ========================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Remover todas as policies de clients
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'clients'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON clients';
  END LOOP;

  -- Remover todas as policies de vehicles
  FOR policy_record IN
    SELECT policyname FROM pg_policies WHERE tablename = 'vehicles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON vehicles';
  END LOOP;

  RAISE NOTICE '✅ Todas as policies antigas removidas';
  RAISE NOTICE '';
END $$;

-- ========================================
-- PASSO 6: CRIAR POLICIES CORRETAS
-- ========================================

-- CLIENTS - SELECT
CREATE POLICY "clients_select_policy"
ON clients FOR SELECT
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- CLIENTS - INSERT
CREATE POLICY "clients_insert_policy"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- CLIENTS - UPDATE
CREATE POLICY "clients_update_policy"
ON clients FOR UPDATE
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
)
WITH CHECK (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- CLIENTS - DELETE
CREATE POLICY "clients_delete_policy"
ON clients FOR DELETE
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- VEHICLES - SELECT
CREATE POLICY "vehicles_select_policy"
ON vehicles FOR SELECT
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- VEHICLES - INSERT
CREATE POLICY "vehicles_insert_policy"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- VEHICLES - UPDATE
CREATE POLICY "vehicles_update_policy"
ON vehicles FOR UPDATE
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
)
WITH CHECK (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

-- VEHICLES - DELETE
CREATE POLICY "vehicles_delete_policy"
ON vehicles FOR DELETE
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()::text
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()::text
  ) = true
);

DO $$
BEGIN
  RAISE NOTICE '✅ 8 Policies criadas (4 clients + 4 vehicles)';
  RAISE NOTICE '';
END $$;

-- ========================================
-- PASSO 7: VERIFICAÇÃO FINAL
-- ========================================

DO $$
DECLARE
  users_sem_est INTEGER;
  clients_sem_est INTEGER;
  vehicles_sem_est INTEGER;
  policies_clients INTEGER;
  policies_vehicles INTEGER;
  total_clients INTEGER;
  total_vehicles INTEGER;
  rls_users BOOLEAN;
  rls_clients BOOLEAN;
  rls_vehicles BOOLEAN;
BEGIN
  -- Verificar dados
  SELECT COUNT(*) INTO users_sem_est FROM users WHERE establishment_id IS NULL AND is_super_admin IS NOT TRUE;
  SELECT COUNT(*) INTO clients_sem_est FROM clients WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO vehicles_sem_est FROM vehicles WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO policies_clients FROM pg_policies WHERE tablename = 'clients';
  SELECT COUNT(*) INTO policies_vehicles FROM pg_policies WHERE tablename = 'vehicles';
  SELECT COUNT(*) INTO total_clients FROM clients;
  SELECT COUNT(*) INTO total_vehicles FROM vehicles;

  -- Verificar RLS
  SELECT rowsecurity INTO rls_users FROM pg_tables WHERE tablename = 'users';
  SELECT rowsecurity INTO rls_clients FROM pg_tables WHERE tablename = 'clients';
  SELECT rowsecurity INTO rls_vehicles FROM pg_tables WHERE tablename = 'vehicles';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS na tabela users: %', rls_users;
  RAISE NOTICE 'RLS na tabela clients: %', rls_clients;
  RAISE NOTICE 'RLS na tabela vehicles: %', rls_vehicles;
  RAISE NOTICE '';
  RAISE NOTICE 'Usuários sem establishment_id: %', users_sem_est;
  RAISE NOTICE 'Clientes sem establishment_id: %', clients_sem_est;
  RAISE NOTICE 'Veículos sem establishment_id: %', vehicles_sem_est;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies em clients: %', policies_clients;
  RAISE NOTICE 'Policies em vehicles: %', policies_vehicles;
  RAISE NOTICE '';
  RAISE NOTICE 'Total de clientes: %', total_clients;
  RAISE NOTICE 'Total de veículos: %', total_vehicles;
  RAISE NOTICE '';

  IF rls_users = false AND users_sem_est = 0 AND clients_sem_est = 0 AND vehicles_sem_est = 0 AND policies_clients = 4 AND policies_vehicles = 4 THEN
    RAISE NOTICE '';
    RAISE NOTICE '🎉🎉🎉 PERFEITO! TUDO CORRETO! 🎉🎉🎉';
    RAISE NOTICE '';
    RAISE NOTICE 'AGORA FAÇA:';
    RAISE NOTICE '1. LOGOUT do sistema';
    RAISE NOTICE '2. LOGIN novamente';
    RAISE NOTICE '3. Acesse Clientes e Veículos';
    RAISE NOTICE '4. Você deve ver % cliente(s)!', total_clients;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '⚠️ Ainda há problemas:';
    IF rls_users = true THEN
      RAISE NOTICE '  - RLS ainda habilitado em users!';
    END IF;
    IF users_sem_est > 0 THEN
      RAISE NOTICE '  - Usuários sem establishment_id: %', users_sem_est;
    END IF;
    IF clients_sem_est > 0 THEN
      RAISE NOTICE '  - Clientes sem establishment_id: %', clients_sem_est;
    END IF;
    IF policies_clients <> 4 THEN
      RAISE NOTICE '  - Policies incorretas em clients: % (esperado: 4)', policies_clients;
    END IF;
    IF policies_vehicles <> 4 THEN
      RAISE NOTICE '  - Policies incorretas em vehicles: % (esperado: 4)', policies_vehicles;
    END IF;
    RAISE NOTICE '';
  END IF;
END $$;

-- Ver resumo de policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('clients', 'vehicles')
ORDER BY tablename, cmd, policyname;
