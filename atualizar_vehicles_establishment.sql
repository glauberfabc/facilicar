-- Atualizar veículos para ter o mesmo establishment_id do cliente

-- ========================================
-- VER VEÍCULOS SEM ESTABLISHMENT_ID
-- ========================================

SELECT
  v.id,
  v.placa,
  v.establishment_id as veiculo_est,
  c.nome as cliente_nome,
  c.establishment_id as cliente_est
FROM vehicles v
LEFT JOIN clients c ON v.cliente_id = c.id
WHERE v.establishment_id IS NULL;

-- ========================================
-- ATUALIZAR VEÍCULOS
-- ========================================

-- Atualizar veículos para ter o mesmo establishment_id do seu cliente
UPDATE vehicles v
SET establishment_id = c.establishment_id
FROM clients c
WHERE v.cliente_id = c.id
AND v.establishment_id IS NULL
AND c.establishment_id IS NOT NULL;

-- ========================================
-- VERIFICAR RESULTADO
-- ========================================

SELECT
  CASE
    WHEN establishment_id IS NULL THEN '❌ SEM establishment_id'
    ELSE '✅ COM establishment_id'
  END as status,
  COUNT(*) as quantidade
FROM vehicles
GROUP BY establishment_id IS NULL;

-- Ver todos os veículos
SELECT
  v.placa,
  v.establishment_id,
  e.nome as empresa_nome,
  c.nome as cliente_nome
FROM vehicles v
LEFT JOIN establishments e ON v.establishment_id = e.id
LEFT JOIN clients c ON v.cliente_id = c.id
ORDER BY v.placa;

-- ========================================
-- MENSAGEM
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Veículos atualizados!';
  RAISE NOTICE '';
  RAISE NOTICE 'Agora todos os veículos devem ter o establishment_id do seu cliente.';
  RAISE NOTICE '';
END $$;
