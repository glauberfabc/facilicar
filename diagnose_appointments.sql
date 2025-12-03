-- Diagnóstico da tabela appointments

-- ========================================
-- VERIFICAR SE A TABELA EXISTE
-- ========================================

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'appointments';

-- ========================================
-- VERIFICAR COLUNAS DA TABELA
-- ========================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
ORDER BY ordinal_position;

-- ========================================
-- VERIFICAR FOREIGN KEYS
-- ========================================

SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass
  AND contype = 'f'
ORDER BY conname;

-- ========================================
-- VERIFICAR RLS (Row Level Security)
-- ========================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'appointments';

-- ========================================
-- VERIFICAR POLICIES
-- ========================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- ========================================
-- TESTAR INSERÇÃO (comentado para segurança)
-- ========================================

-- Descomente as linhas abaixo para testar uma inserção manual
/*
INSERT INTO appointments (
  client_id,
  vehicle_id,
  service_id,
  data_agendamento,
  status,
  valor_estimado,
  establishment_id,
  created_by
) VALUES (
  'SEU_CLIENT_ID_AQUI',
  'SEU_VEHICLE_ID_AQUI',
  'service1,service2',
  NOW() + INTERVAL '1 day',
  'pendente',
  150.00,
  'SEU_ESTABLISHMENT_ID_AQUI',
  'SEU_USER_ID_AQUI'
) RETURNING *;
*/
