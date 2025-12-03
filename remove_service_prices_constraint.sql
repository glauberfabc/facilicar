-- Remover constraint que limita os valores de categoria em service_prices

-- ========================================
-- VERIFICAR CONSTRAINTS EXISTENTES
-- ========================================

SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'service_prices'::regclass
  AND contype = 'c'; -- 'c' = CHECK constraint

-- ========================================
-- REMOVER CONSTRAINT DE CATEGORIA
-- ========================================

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Buscar constraint que contém 'categoria'
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'service_prices'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%categoria%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE service_prices DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE '✅ Constraint removida: %', constraint_name;
  ELSE
    RAISE NOTICE '⚠️ Nenhuma constraint de categoria encontrada';
  END IF;
END $$;

-- ========================================
-- VERIFICAR SE FOI REMOVIDA
-- ========================================

DO $$
DECLARE
  remaining_constraints INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_constraints
  FROM pg_constraint
  WHERE conrelid = 'service_prices'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%categoria%';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  IF remaining_constraints = 0 THEN
    RAISE NOTICE '✅✅✅ CONSTRAINT REMOVIDA COM SUCESSO! ✅✅✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Agora você pode usar qualquer nome de categoria!';
    RAISE NOTICE 'Ex: Pequeno, Médio, Grande, etc.';
  ELSE
    RAISE NOTICE '⚠️ Ainda há % constraint(s) de categoria', remaining_constraints;
  END IF;
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
