-- Fix: Garantir que vehicles.id tenha DEFAULT uuid_generate_v4()

-- 1. Verificar se a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Alterar a coluna id para ter DEFAULT uuid_generate_v4()
ALTER TABLE vehicles
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Verificar a estrutura
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Tabela vehicles corrigida!';
  RAISE NOTICE 'A coluna id agora gera UUID automaticamente.';
END $$;
