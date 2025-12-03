-- Script para atualizar clientes e veículos existentes que não têm establishment_id

-- ========================================
-- DIAGNÓSTICO INICIAL
-- ========================================

-- Contar clientes sem establishment_id
DO $$
DECLARE
  clients_sem_est INTEGER;
  vehicles_sem_est INTEGER;
BEGIN
  SELECT COUNT(*) INTO clients_sem_est FROM clients WHERE establishment_id IS NULL;
  SELECT COUNT(*) INTO vehicles_sem_est FROM vehicles WHERE establishment_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNÓSTICO ===';
  RAISE NOTICE 'Clientes sem establishment_id: %', clients_sem_est;
  RAISE NOTICE 'Veículos sem establishment_id: %', vehicles_sem_est;
  RAISE NOTICE '';
END $$;

-- ========================================
-- OPÇÃO 1: ATUALIZAR AUTOMATICAMENTE
-- ========================================
-- Use se você tem apenas 1 estabelecimento no sistema

-- DESCOMENTE as linhas abaixo SE você tem apenas 1 estabelecimento:
/*
DO $$
DECLARE
  primeiro_estabelecimento UUID;
BEGIN
  -- Pegar o primeiro estabelecimento
  SELECT id INTO primeiro_estabelecimento FROM establishments LIMIT 1;

  IF primeiro_estabelecimento IS NOT NULL THEN
    -- Atualizar clientes
    UPDATE clients
    SET establishment_id = primeiro_estabelecimento
    WHERE establishment_id IS NULL;

    -- Atualizar veículos
    UPDATE vehicles
    SET establishment_id = primeiro_estabelecimento
    WHERE establishment_id IS NULL;

    RAISE NOTICE '✅ Clientes e veículos atualizados para establishment: %', primeiro_estabelecimento;
  ELSE
    RAISE NOTICE '❌ Nenhum estabelecimento encontrado!';
  END IF;
END $$;
*/

-- ========================================
-- OPÇÃO 2: ATUALIZAR MANUALMENTE
-- ========================================
-- Use se você tem MÚLTIPLOS estabelecimentos

-- 1. Primeiro, veja seus estabelecimentos:
SELECT id, nome, email FROM establishments ORDER BY created_at;

-- 2. Escolha o establishment_id correto e substitua abaixo:
/*
-- EXEMPLO - Substitua 'SEU-ESTABLISHMENT-ID-AQUI' pelo ID real:
UPDATE clients
SET establishment_id = 'SEU-ESTABLISHMENT-ID-AQUI'
WHERE establishment_id IS NULL;

UPDATE vehicles
SET establishment_id = 'SEU-ESTABLISHMENT-ID-AQUI'
WHERE establishment_id IS NULL;
*/

-- ========================================
-- OPÇÃO 3: ATUALIZAR BASEADO NO USUÁRIO QUE CRIOU
-- ========================================
-- Esta é a melhor opção se você rastreia created_by

/*
-- Se você tem uma coluna created_by nos clients:
UPDATE clients c
SET establishment_id = (
  SELECT establishment_id
  FROM users u
  WHERE u.id = c.created_by
)
WHERE c.establishment_id IS NULL
AND c.created_by IS NOT NULL;

-- Para veículos, usar o establishment_id do cliente:
UPDATE vehicles v
SET establishment_id = (
  SELECT establishment_id
  FROM clients c
  WHERE c.id = v.cliente_id
)
WHERE v.establishment_id IS NULL;
*/

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Ver clientes com e sem establishment_id
SELECT
  CASE
    WHEN establishment_id IS NULL THEN '❌ SEM establishment_id'
    ELSE '✅ COM establishment_id'
  END as status,
  COUNT(*) as quantidade
FROM clients
GROUP BY establishment_id IS NULL;

-- Ver veículos com e sem establishment_id
SELECT
  CASE
    WHEN establishment_id IS NULL THEN '❌ SEM establishment_id'
    ELSE '✅ COM establishment_id'
  END as status,
  COUNT(*) as quantidade
FROM vehicles
GROUP BY establishment_id IS NULL;

-- Ver amostra de clientes
SELECT
  id,
  nome,
  email,
  establishment_id,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 10;

-- ========================================
-- MENSAGEM FINAL
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== PRÓXIMOS PASSOS ===';
  RAISE NOTICE '';
  RAISE NOTICE '1. Escolha uma das opções acima (OPÇÃO 1, 2 ou 3)';
  RAISE NOTICE '2. Descomente a opção escolhida';
  RAISE NOTICE '3. Execute este script novamente';
  RAISE NOTICE '4. Verifique se todos os clientes agora têm establishment_id';
  RAISE NOTICE '';
END $$;
