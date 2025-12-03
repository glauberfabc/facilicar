# Resolver: Colaborador Não Vê Clientes

## Problema

O colaborador não consegue visualizar os clientes e veículos que ele mesmo criou.

## Causa Provável

Existem 3 possíveis causas:

1. **Clientes não têm `establishment_id`** - Clientes criados antes da implementação do RLS
2. **Policies RLS incorretas** - Políticas não permitem acesso adequado
3. **Usuário sem `establishment_id`** - Colaborador não está vinculado a uma empresa

---

## Solução Passo a Passo

### Passo 1: Diagnóstico

Execute o script de diagnóstico para identificar o problema:

```sql
-- No Supabase SQL Editor:
diagnostico_colaborador.sql
```

**O que esperar:**
- Lista de todos os usuários e seus `establishment_id`
- Lista de clientes e seus `establishment_id`
- Identificação de dados sem `establishment_id`
- Status das policies RLS

### Passo 2: Executar Scripts na Ordem

#### 2.1. Adicionar Colunas e Configurar RLS

```sql
-- Execute primeiro:
fix_clients_rls_establishment.sql
```

**O que faz:**
- ✅ Adiciona coluna `establishment_id` em `clients`
- ✅ Adiciona coluna `establishment_id` em `vehicles`
- ✅ Cria foreign keys
- ✅ Habilita RLS
- ✅ Cria policies básicas

#### 2.2. Atualizar Dados Existentes

```sql
-- Execute segundo:
update_existing_clients_establishment.sql
```

**Escolha uma opção:**

**OPÇÃO 1 - Se você tem apenas 1 empresa:**
```sql
-- Descomente no arquivo e execute:
DO $$
DECLARE
  primeiro_estabelecimento UUID;
BEGIN
  SELECT id INTO primeiro_estabelecimento FROM establishments LIMIT 1;

  UPDATE clients
  SET establishment_id = primeiro_estabelecimento
  WHERE establishment_id IS NULL;

  UPDATE vehicles
  SET establishment_id = primeiro_estabelecimento
  WHERE establishment_id IS NULL;
END $$;
```

**OPÇÃO 2 - Se você tem múltiplas empresas:**
```sql
-- 1. Ver estabelecimentos:
SELECT id, nome FROM establishments;

-- 2. Atualizar manualmente:
UPDATE clients
SET establishment_id = 'SEU-ID-AQUI'
WHERE establishment_id IS NULL;

UPDATE vehicles
SET establishment_id = 'SEU-ID-AQUI'
WHERE establishment_id IS NULL;
```

#### 2.3. Corrigir Policies RLS

```sql
-- Execute terceiro:
fix_rls_colaborador_view.sql
```

**O que faz:**
- ✅ Remove policies antigas
- ✅ Cria policies simplificadas
- ✅ Usa `auth.uid()` para verificar permissões
- ✅ Permite SELECT, INSERT, UPDATE, DELETE baseado em `establishment_id`

---

## Verificação

### 1. Verificar no Supabase

```sql
-- Ver se clientes têm establishment_id
SELECT id, nome, establishment_id FROM clients LIMIT 10;

-- Ver se usuário tem establishment_id
SELECT id, nome, email, establishment_id, role FROM users
WHERE email = 'colaborador@empresa.com';

-- Verificar policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('clients', 'vehicles');
```

### 2. Testar no Frontend

**Como Admin:**
1. Faça login como admin
2. Crie um novo cliente
3. ✅ Cliente deve ser criado com `establishment_id`
4. ✅ Cliente deve aparecer na lista

**Como Colaborador:**
1. Faça login como colaborador
2. Acesse "Clientes e Veículos"
3. ✅ Deve ver clientes do seu estabelecimento
4. Crie um novo cliente
5. ✅ Deve funcionar sem erro RLS
6. ✅ Cliente criado deve aparecer na lista

---

## Políticas RLS Criadas

### Para `clients`

```sql
-- SELECT: Ver clientes do mesmo estabelecimento
CREATE POLICY "clients_select_policy"
ON clients FOR SELECT
TO authenticated
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()
  ) = true
);

-- INSERT: Criar clientes no seu estabelecimento
CREATE POLICY "clients_insert_policy"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR (
    SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid()
  ) = true
);

-- UPDATE e DELETE: Similar
```

### Para `vehicles`

As mesmas 4 políticas (SELECT, INSERT, UPDATE, DELETE) com a mesma lógica.

---

## Troubleshooting

### Problema: Clientes ainda não aparecem

**Verifique:**
```sql
-- 1. Colaborador tem establishment_id?
SELECT id, nome, establishment_id FROM users WHERE email = 'colaborador@empresa.com';

-- 2. Clientes têm establishment_id?
SELECT id, nome, establishment_id FROM clients;

-- 3. IDs são iguais?
SELECT
  u.establishment_id as user_est,
  c.establishment_id as client_est,
  u.establishment_id = c.establishment_id as match
FROM users u
CROSS JOIN clients c
WHERE u.email = 'colaborador@empresa.com'
LIMIT 5;
```

**Se não aparecem ainda:**
```sql
-- Forçar atualização dos clientes
UPDATE clients
SET establishment_id = (
  SELECT establishment_id FROM users WHERE email = 'admin@empresa.com' LIMIT 1
)
WHERE establishment_id IS NULL;
```

### Problema: Erro ao criar cliente

**Erro:** "new row violates row-level security policy"

**Causa:** Policy INSERT não permite

**Solução:**
```sql
-- Executar novamente:
fix_rls_colaborador_view.sql
```

### Problema: Usuário sem establishment_id

**Verificar:**
```sql
SELECT id, nome, email, establishment_id FROM users WHERE establishment_id IS NULL;
```

**Corrigir:**
```sql
-- Para um usuário específico:
UPDATE users
SET establishment_id = 'ID-DA-EMPRESA'
WHERE email = 'colaborador@empresa.com';

-- Para todos os usuários de uma empresa:
UPDATE users
SET establishment_id = 'ID-DA-EMPRESA'
WHERE establishment_id IS NULL
AND is_super_admin IS NOT TRUE;
```

---

## Como Funciona o RLS

### Quando Colaborador Consulta Clientes

```javascript
// Frontend executa:
const { data } = await supabase.from('clients').select('*')

// RLS automaticamente converte para:
SELECT * FROM clients
WHERE establishment_id = (
  SELECT establishment_id FROM users WHERE id = auth.uid()
)
```

### Quando Colaborador Cria Cliente

```javascript
// Frontend executa:
const { data } = await supabase.from('clients').insert([{
  nome: 'Maria',
  establishment_id: profile.establishment_id  // ← Importante!
}])

// RLS verifica se:
// establishment_id inserido == establishment_id do usuário
```

---

## Checklist de Verificação

Antes de considerar resolvido, verifique:

- [ ] Script `fix_clients_rls_establishment.sql` executado
- [ ] Script `update_existing_clients_establishment.sql` executado
- [ ] Script `fix_rls_colaborador_view.sql` executado
- [ ] Coluna `establishment_id` existe em `clients`
- [ ] Coluna `establishment_id` existe em `vehicles`
- [ ] Todos os clientes têm `establishment_id` preenchido
- [ ] Todos os usuários têm `establishment_id` preenchido
- [ ] 8 policies criadas (4 para clients + 4 para vehicles)
- [ ] Admin consegue ver clientes
- [ ] Colaborador consegue ver clientes
- [ ] Colaborador consegue criar clientes sem erro
- [ ] Novos clientes aparecem imediatamente na lista

---

## Resumo dos Scripts

| Script | Ordem | Função |
|--------|-------|--------|
| `diagnostico_colaborador.sql` | 1º | Identificar problema |
| `fix_clients_rls_establishment.sql` | 2º | Adicionar colunas e RLS |
| `update_existing_clients_establishment.sql` | 3º | Atualizar dados antigos |
| `fix_rls_colaborador_view.sql` | 4º | Corrigir policies |

---

## Resultado Esperado

Após executar todos os scripts:

✅ **Colaborador consegue:**
- Ver todos os clientes do seu estabelecimento
- Criar novos clientes
- Editar clientes existentes
- Excluir clientes
- Ver todos os veículos do seu estabelecimento
- Criar novos veículos

❌ **Colaborador NÃO consegue:**
- Ver clientes de outros estabelecimentos
- Ver veículos de outros estabelecimentos
- Criar clientes em outros estabelecimentos

✅ **Super Admin consegue:**
- Ver TODOS os clientes de TODOS os estabelecimentos
- Gerenciar tudo sem restrições

---

## Conclusão

Se após executar todos os scripts o problema persistir:

1. **Verifique os logs do console do navegador** (F12)
2. **Execute o diagnóstico novamente**: `diagnostico_colaborador.sql`
3. **Verifique se o usuário está realmente logado**: `SELECT auth.uid();`
4. **Tente fazer logout e login novamente**

Em caso de dúvida, execute os scripts na ordem exata e verifique cada passo.

**Problemas resolvidos!** 🎉
