# Troubleshooting - Erro ao Cadastrar Cliente

## Problema Reportado
"deu erro ao salvar cliente"

---

## Possíveis Causas e Soluções

### 1. ❌ Tabela `vehicles` não tem coluna `categoria`

**Sintoma:** Erro ao inserir veículo

**Solução:**
```sql
-- Execute no Supabase SQL Editor:
-- Copie e execute TODO o conteúdo de update_client_vehicle_schema.sql
```

**Como verificar:**
```sql
-- Verifique se a coluna categoria existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'vehicles';
```

**Deve retornar:**
```
column_name | data_type
------------|----------
id          | uuid
placa       | text
modelo      | text
cor         | text
categoria   | text      ← DEVE EXISTIR
cliente_id  | uuid
created_at  | timestamp
```

---

### 2. ❌ Erro de Foreign Key (cliente_id)

**Sintoma:** Erro "foreign key constraint violated"

**Causa:** A tabela `vehicles` está tentando referenciar `clients.id` mas o tipo pode estar incompatível (UUID vs TEXT)

**Solução:**

```sql
-- Verificar tipo do id em clients
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'id';

-- Verificar tipo do cliente_id em vehicles
SELECT data_type
FROM information_schema.columns
WHERE table_name = 'vehicles' AND column_name = 'cliente_id';

-- Se forem diferentes, ajustar:
-- Exemplo: Se clients.id é UUID e vehicles.cliente_id é TEXT
ALTER TABLE vehicles
ALTER COLUMN cliente_id TYPE UUID USING cliente_id::uuid;
```

---

### 3. ❌ Erro "null value in column cliente_id violates not-null constraint"

**Sintoma:** Erro ao criar veículo dizendo que cliente_id é nulo

**Causa:** O cliente não foi criado corretamente ou o ID não foi retornado

**Solução:** Código já atualizado com validação:
```javascript
if (!newClient) {
  throw new Error('Cliente criado mas dados não retornados')
}
```

**Verificar se Supabase está configurado para retornar dados:**
- Verifique se RLS (Row Level Security) está desabilitado OU
- Configure policies corretas

---

### 4. ❌ RLS (Row Level Security) bloqueando insert

**Sintoma:** Erro "new row violates row-level security policy"

**Solução Temporária (para desenvolvimento):**
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
```

**Solução Permanente (para produção):**
```sql
-- Habilitar RLS mas criar policy permissiva
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy para inserção (ajuste conforme sua necessidade)
CREATE POLICY "Permitir insert para usuários autenticados"
ON clients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir insert para usuários autenticados"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy para leitura
CREATE POLICY "Permitir leitura para usuários autenticados"
ON clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir leitura para usuários autenticados"
ON vehicles FOR SELECT
TO authenticated
USING (true);
```

---

### 5. ❌ Coluna `establishment_id` obrigatória mas não preenchida

**Sintoma:** Erro "null value in column establishment_id"

**Causa:** A coluna `establishment_id` pode ter constraint NOT NULL

**Solução 1 - Remover NOT NULL:**
```sql
ALTER TABLE clients ALTER COLUMN establishment_id DROP NOT NULL;
```

**Solução 2 - Preencher com ID do estabelecimento:**
Atualizar o código para incluir `establishment_id`:

```javascript
// No ClientsWithVehicles.jsx
import { usePermissions } from '../contexts/PermissionsContext'

// Dentro do componente:
const { profile } = usePermissions()

// Na criação do cliente:
const { data: newClient, error: clientError } = await supabase
  .from('clients')
  .insert([{
    nome: formData.nome,
    telefone: formData.telefone,
    email: formData.email,
    establishment_id: profile?.establishment_id // ADICIONAR
  }])
  .select()
  .single()
```

---

## Como Debugar

### 1. Abrir DevTools do Navegador
- Pressione F12
- Vá para aba "Console"
- Tente cadastrar um cliente
- Veja as mensagens de erro detalhadas

### 2. Mensagens de Erro Esperadas

**Erro de coluna:**
```
Erro ao criar veículo: column "categoria" does not exist
```
**Solução:** Execute `update_client_vehicle_schema.sql`

**Erro de FK:**
```
Erro ao criar veículo: foreign key constraint violated
```
**Solução:** Verifique tipos de `clients.id` e `vehicles.cliente_id`

**Erro de RLS:**
```
Erro ao criar cliente: new row violates row-level security policy
```
**Solução:** Configure policies ou desabilite RLS temporariamente

**Erro de NOT NULL:**
```
Erro ao criar cliente: null value in column "establishment_id"
```
**Solução:** Adicione `establishment_id` ao insert ou remova NOT NULL

---

## Checklist de Verificação

Execute no Supabase SQL Editor:

```sql
-- 1. Verificar se tabela clients existe e suas colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- 2. Verificar se tabela vehicles existe e suas colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- 3. Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('clients', 'vehicles');

-- 4. Verificar policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('clients', 'vehicles');

-- 5. Teste manual de insert
-- Tente inserir um cliente manualmente
INSERT INTO clients (nome, telefone, email)
VALUES ('Teste Manual', '11999999999', 'teste@teste.com')
RETURNING *;

-- 6. Pegue o ID retornado e tente inserir um veículo
INSERT INTO vehicles (placa, modelo, cor, categoria, cliente_id)
VALUES ('TST-1234', 'Civic', 'Preto', 'Sedan', 'COLE_O_ID_AQUI')
RETURNING *;
```

---

## Script de Correção Completo

Se nada funcionar, execute este script que recria tudo do zero:

```sql
-- ATENÇÃO: Isso vai DELETAR todos os dados!
-- Só execute se for um ambiente de desenvolvimento

DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Criar tabela clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  establishment_id UUID, -- Sem NOT NULL
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Hatch', 'Sedan', 'SUV', 'Caminhonete', 'Moto', 'Van', 'Pickup')),
  cliente_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Desabilitar RLS (temporário para desenvolvimento)
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

-- Criar índices
CREATE INDEX idx_clients_establishment_id ON clients(establishment_id);
CREATE INDEX idx_vehicles_cliente_id ON vehicles(cliente_id);
CREATE INDEX idx_vehicles_categoria ON vehicles(categoria);
CREATE INDEX idx_vehicles_placa ON vehicles(placa);

-- Teste
INSERT INTO clients (nome, telefone, email)
VALUES ('Cliente Teste', '11987654321', 'cliente@teste.com')
RETURNING *;

-- Copie o ID do cliente e use abaixo:
INSERT INTO vehicles (placa, modelo, cor, categoria, cliente_id)
VALUES ('ABC-1234', 'Gol', 'Branco', 'Hatch', 'COLE_O_ID_DO_CLIENTE_AQUI')
RETURNING *;
```

---

## Verificação Final

Depois de aplicar as correções, teste:

1. ✅ Cadastrar cliente com todos os campos preenchidos
2. ✅ Cadastrar cliente apenas com Nome + Placa + Categoria
3. ✅ Verificar se cliente aparece na lista
4. ✅ Verificar se veículo aparece vinculado ao cliente
5. ✅ Adicionar segundo veículo ao mesmo cliente
6. ✅ Editar cliente (sem alterar veículos)
7. ✅ Deletar veículo
8. ✅ Deletar cliente (deve deletar todos os veículos em cascata)

---

## Logs Úteis

O código atualizado agora mostra logs detalhados:

```javascript
console.log('Cliente criado:', newClient)
console.error('Erro ao criar cliente:', clientError)
console.error('Erro ao criar veículo:', vehicleError)
console.error('Erro completo:', error)
```

Verifique o console do navegador (F12) para ver esses logs.

---

## Próximos Passos

Depois de resolver:

1. Me informe qual era o erro exato (mensagem do console)
2. Confirme se funcionou após a correção
3. Posso ajustar o código se necessário
