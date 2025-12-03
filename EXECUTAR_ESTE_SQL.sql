-- ========================================
-- SCRIPT COMPLETO PARA CORRIGIR APPOINTMENTS
-- Execute este arquivo INTEIRO no Supabase SQL Editor
-- ========================================

-- Passo 1: Remover todas as constraints antigas
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  FOR constraint_rec IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'appointments'::regclass
      AND contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS %I CASCADE', constraint_rec.conname);
    RAISE NOTICE '✅ Constraint removida: %', constraint_rec.conname;
  END LOOP;
END $$;

-- Passo 2: Alterar service_id para TEXT (se necessário)
DO $$
BEGIN
  ALTER TABLE appointments ALTER COLUMN service_id TYPE TEXT;
  RAISE NOTICE '✅ Coluna service_id alterada para TEXT';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ service_id já é TEXT ou erro: %', SQLERRM;
END $$;

-- Passo 3: Criar foreign keys com nomes corretos
ALTER TABLE appointments
ADD CONSTRAINT appointments_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_vehicle_id_fkey
FOREIGN KEY (vehicle_id)
REFERENCES vehicles(id)
ON DELETE SET NULL;

ALTER TABLE appointments
ADD CONSTRAINT appointments_establishment_id_fkey
FOREIGN KEY (establishment_id)
REFERENCES establishments(id)
ON DELETE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT appointments_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- Passo 4: Verificar as constraints criadas
SELECT
  conname AS constraint_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass
  AND contype = 'f'
ORDER BY conname;

-- Passo 5: Mensagem final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ TUDO PRONTO! ✅✅✅';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora faça um HARD REFRESH no navegador:';
  RAISE NOTICE 'Windows: Ctrl + Shift + R';
  RAISE NOTICE 'Mac: Cmd + Shift + R';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
