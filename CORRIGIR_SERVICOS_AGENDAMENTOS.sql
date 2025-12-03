-- ========================================
-- CORRIGIR CAMPO SERVICOS DOS AGENDAMENTOS ANTIGOS
-- Este script atualiza agendamentos que têm servicos como array de IDs
-- e converte para array de objetos com nome, descricao e valor
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Corrigindo campo servicos dos agendamentos...';
  RAISE NOTICE '';
END $$;

-- Criar função temporária para converter IDs em objetos
CREATE OR REPLACE FUNCTION convert_servicos_to_objects()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  appt_record RECORD;
  servico_id TEXT;
  servicos_array JSONB;
  servico_obj JSONB;
  new_servicos JSONB;
BEGIN
  -- Iterar sobre todos os agendamentos que têm servicos
  FOR appt_record IN
    SELECT id, servicos, vehicle_id
    FROM appointments
    WHERE servicos IS NOT NULL
      AND servicos != 'null'::jsonb
      AND jsonb_array_length(servicos) > 0
  LOOP
    servicos_array := appt_record.servicos;

    -- Verificar se o primeiro elemento é uma string (ID) em vez de objeto
    IF jsonb_typeof(servicos_array->0) = 'string' OR
       (jsonb_typeof(servicos_array->0) = 'object' AND servicos_array->0->>'nome' IS NULL) THEN

      RAISE NOTICE 'Processando agendamento %', appt_record.id;

      new_servicos := '[]'::jsonb;

      -- Iterar sobre cada ID de serviço
      FOR servico_id IN
        SELECT jsonb_array_elements_text(appt_record.servicos)
      LOOP
        -- Buscar dados do serviço e preço
        SELECT jsonb_build_object(
          'id', s.id,
          'nome', s.nome,
          'descricao', COALESCE(s.descricao, ''),
          'valor', COALESCE(sp.valor, 0)
        )
        INTO servico_obj
        FROM services s
        LEFT JOIN service_prices sp ON sp.service_id = s.id
          AND sp.categoria = (
            SELECT categoria FROM vehicles WHERE id = appt_record.vehicle_id
          )
        WHERE s.id::text = servico_id;

        -- Se encontrou o serviço, adicionar ao array
        IF servico_obj IS NOT NULL THEN
          new_servicos := new_servicos || servico_obj;
        ELSE
          RAISE WARNING 'Serviço % não encontrado', servico_id;
        END IF;
      END LOOP;

      -- Atualizar o agendamento com os novos dados
      UPDATE appointments
      SET servicos = new_servicos
      WHERE id = appt_record.id;

      RAISE NOTICE '✅ Agendamento % atualizado com % serviços',
        appt_record.id, jsonb_array_length(new_servicos);
    ELSE
      RAISE NOTICE '⏭️  Agendamento % já está no formato correto', appt_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Executar a função
SELECT convert_servicos_to_objects();

-- Remover a função temporária
DROP FUNCTION convert_servicos_to_objects();

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Correção concluída!';
  RAISE NOTICE '';
  RAISE NOTICE 'Verifique os agendamentos na interface para confirmar que os nomes dos serviços aparecem.';
  RAISE NOTICE '';
END $$;

-- Visualizar um exemplo de agendamento corrigido
SELECT
  id,
  data_agendamento,
  servicos
FROM appointments
WHERE servicos IS NOT NULL
LIMIT 1;
