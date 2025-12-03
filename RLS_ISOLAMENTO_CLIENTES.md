# RLS - Isolamento de Clientes por Estabelecimento

## O Que Foi Implementado

Sistema de **Row Level Security (RLS)** para garantir que:

1. ✅ **Cada estabelecimento vê apenas seus próprios clientes**
2. ✅ **Colaboradores podem criar clientes vinculados ao seu estabelecimento**
3. ✅ **Super Admin pode ver e gerenciar todos os clientes**
4. ✅ **Isolamento completo de dados entre empresas**

---

## Problemas Resolvidos

### ❌ Problema 1: Admins viam clientes de outros estabelecimentos

**Antes:**
```sql
SELECT * FROM clients;
-- Retornava TODOS os clientes de TODAS as empresas
```

**Depois:**
```sql
SELECT * FROM clients;
-- Retorna apenas clientes do estabelecimento do usuário logado
```

### ❌ Problema 2: Colaboradores não conseguiam criar clientes

**Erro:**
```
Erro ao salvar: Erro ao criar cliente: new row violates row-level security policy for table "clients"
```

**Causa:** RLS estava habilitado mas sem policies adequadas

**Solução:** Criadas policies que permitem INSERT baseado no `establishment_id`

---

## Estrutura do Banco de Dados

### Tabela `clients`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID do cliente |
| `nome` | TEXT | Nome do cliente |
| `telefone` | TEXT | Telefone |
| `email` | TEXT | Email |
| **`establishment_id`** | UUID | **FK para establishments** |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `vehicles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID do veículo |
| `placa` | TEXT | Placa |
| `modelo` | TEXT | Modelo |
| `cor` | TEXT | Cor |
| `categoria` | TEXT | Categoria (Hatch, SUV, etc) |
| `cliente_id` | UUID | FK para clients |
| **`establishment_id`** | UUID | **FK para establishments** |
| `created_at` | TIMESTAMP | Data de criação |

---

## Políticas RLS Implementadas

### Para `clients`

#### 1. SELECT (Leitura)
```sql
CREATE POLICY "Isolamento por estabelecimento - SELECT"
ON clients FOR SELECT
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

**Comportamento:**
- Admin vê apenas clientes do seu estabelecimento
- Colaborador vê apenas clientes do seu estabelecimento
- Super Admin vê todos os clientes

#### 2. INSERT (Criação)
```sql
CREATE POLICY "Isolamento por estabelecimento - INSERT"
ON clients FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

**Comportamento:**
- Usuário só pode criar clientes vinculados ao seu estabelecimento
- Super Admin pode criar clientes em qualquer estabelecimento

#### 3. UPDATE (Atualização)
```sql
CREATE POLICY "Isolamento por estabelecimento - UPDATE"
ON clients FOR UPDATE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

**Comportamento:**
- Usuário só pode atualizar clientes do seu estabelecimento
- Super Admin pode atualizar qualquer cliente

#### 4. DELETE (Exclusão)
```sql
CREATE POLICY "Isolamento por estabelecimento - DELETE"
ON clients FOR DELETE
TO authenticated
USING (
  establishment_id IN (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

**Comportamento:**
- Usuário só pode excluir clientes do seu estabelecimento
- Super Admin pode excluir qualquer cliente

### Para `vehicles`

As mesmas 4 políticas (SELECT, INSERT, UPDATE, DELETE) foram criadas para a tabela `vehicles` com a mesma lógica de isolamento por estabelecimento.

---

## Alterações no Código React

### Arquivo: `src/pages/ClientsWithVehicles.jsx`

#### 1. Importar usePermissions
```javascript
import { usePermissions } from '../contexts/PermissionsContext'

export default function ClientsWithVehicles() {
  const { profile } = usePermissions()
  // ...
}
```

#### 2. Validar establishment_id antes de criar
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()

  // Validar que usuário tem establishment_id
  if (!profile?.establishment_id) {
    alert('Erro: Você não está vinculado a nenhuma empresa.')
    return
  }

  // ... resto do código
}
```

#### 3. Incluir establishment_id ao criar cliente
```javascript
const { data: newClient, error: clientError } = await supabase
  .from('clients')
  .insert([{
    nome: formData.nome,
    telefone: formData.telefone,
    email: formData.email,
    establishment_id: profile.establishment_id  // ← NOVO
  }])
```

#### 4. Incluir establishment_id ao criar veículo
```javascript
const { error: vehicleError } = await supabase
  .from('vehicles')
  .insert([{
    placa: formData.placa,
    modelo: formData.modelo || null,
    cor: formData.cor || null,
    categoria: formData.categoria,
    cliente_id: newClient.id,
    establishment_id: profile.establishment_id  // ← NOVO
  }])
```

---

## Como Funciona na Prática

### Cenário 1: Empresa A cria cliente

```
Usuário: João (Admin da Empresa A)
establishment_id: abc-123

João cria cliente:
  Nome: Maria Santos

Cliente salvo:
  id: cliente-001
  nome: Maria Santos
  establishment_id: abc-123  ← Automaticamente vinculado
```

### Cenário 2: Empresa B tenta ver clientes

```
Usuário: Pedro (Admin da Empresa B)
establishment_id: xyz-789

Pedro consulta clientes:
  SELECT * FROM clients

RLS filtra automaticamente:
  ✅ Retorna apenas clientes com establishment_id = xyz-789
  ❌ NÃO retorna clientes da Empresa A
```

### Cenário 3: Super Admin vê tudo

```
Usuário: Super Admin
is_super_admin: true

Super Admin consulta clientes:
  SELECT * FROM clients

RLS retorna:
  ✅ Clientes da Empresa A (abc-123)
  ✅ Clientes da Empresa B (xyz-789)
  ✅ Clientes de TODAS as empresas
```

---

## Relação entre Tabelas

```
establishments (Empresa A - ID: abc-123)
  └─ max_colaboradores: 5

users (João - Admin da Empresa A)
  └─ establishment_id: abc-123
  └─ role: admin

clients (Criados por João)
  └─ establishment_id: abc-123  ← Mesmo ID
  └─ Cliente 1: Maria Santos
  └─ Cliente 2: José Silva
  └─ Cliente 3: Ana Costa

vehicles (Criados por João)
  └─ establishment_id: abc-123  ← Mesmo ID
  └─ Veículo 1: Placa ABC-1234 (cliente_id: Maria)
  └─ Veículo 2: Placa XYZ-5678 (cliente_id: José)
```

---

## Scripts SQL Necessários

### 1. Executar Script Principal

**Arquivo:** `fix_clients_rls_establishment.sql`

Esse script:
1. ✅ Adiciona coluna `establishment_id` em `clients`
2. ✅ Adiciona coluna `establishment_id` em `vehicles`
3. ✅ Cria foreign keys
4. ✅ Habilita RLS
5. ✅ Remove policies antigas
6. ✅ Cria policies novas com isolamento

**Como executar:**
```sql
-- No Supabase SQL Editor, execute:
-- fix_clients_rls_establishment.sql
```

### 2. Verificar Estrutura

```sql
-- Ver policies criadas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('clients', 'vehicles')
ORDER BY tablename, cmd;

-- Ver colunas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('clients', 'vehicles')
AND column_name IN ('id', 'establishment_id', 'cliente_id');
```

---

## Testando o Isolamento

### Teste 1: Criar Cliente como Admin

```javascript
// Admin da Empresa A (establishment_id: abc-123)
// Cria cliente Maria Santos

// Resultado esperado:
{
  id: 'cliente-001',
  nome: 'Maria Santos',
  establishment_id: 'abc-123'  // ✅ Vinculado automaticamente
}
```

### Teste 2: Listar Clientes como Admin

```javascript
// Admin da Empresa A consulta clientes
const { data } = await supabase.from('clients').select('*')

// Resultado esperado:
[
  { id: 'cliente-001', nome: 'Maria Santos', establishment_id: 'abc-123' },
  { id: 'cliente-002', nome: 'José Silva', establishment_id: 'abc-123' }
]
// ❌ NÃO retorna clientes de outras empresas
```

### Teste 3: Super Admin Vê Tudo

```javascript
// Super Admin consulta clientes
const { data } = await supabase.from('clients').select('*')

// Resultado esperado:
[
  { id: 'cliente-001', nome: 'Maria Santos', establishment_id: 'abc-123' },
  { id: 'cliente-002', nome: 'José Silva', establishment_id: 'abc-123' },
  { id: 'cliente-003', nome: 'Pedro Oliveira', establishment_id: 'xyz-789' },
  { id: 'cliente-004', nome: 'Ana Costa', establishment_id: 'xyz-789' }
]
// ✅ Retorna clientes de TODAS as empresas
```

---

## Troubleshooting

### Erro: "new row violates row-level security policy"

**Causa:** Tentando criar cliente sem `establishment_id` ou com `establishment_id` inválido

**Solução:**
```javascript
// ✅ CORRETO - Incluir establishment_id
const { data } = await supabase.from('clients').insert([{
  nome: 'Maria',
  establishment_id: profile.establishment_id
}])

// ❌ ERRADO - Sem establishment_id
const { data } = await supabase.from('clients').insert([{
  nome: 'Maria'
}])
```

### Erro: Colaborador não vê clientes

**Verificar:**
```sql
-- 1. Usuário tem establishment_id?
SELECT id, nome, establishment_id FROM users WHERE email = 'colaborador@empresa.com';

-- 2. Clientes têm establishment_id?
SELECT id, nome, establishment_id FROM clients LIMIT 5;

-- 3. IDs batem?
SELECT u.email, u.establishment_id as user_est, c.nome as cliente, c.establishment_id as client_est
FROM users u
CROSS JOIN clients c
WHERE u.email = 'colaborador@empresa.com'
LIMIT 5;
```

### Clientes criados antes não aparecem

**Causa:** Clientes antigos não têm `establishment_id`

**Solução:** Atualizar clientes existentes
```sql
-- Associar clientes órfãos ao estabelecimento correto
-- CUIDADO: Ajustar para o estabelecimento correto!
UPDATE clients
SET establishment_id = 'ID_DO_ESTABELECIMENTO'
WHERE establishment_id IS NULL;
```

---

## Arquivos Modificados

### SQL
- **fix_clients_rls_establishment.sql** (NOVO)
  - Adiciona colunas establishment_id
  - Configura RLS e policies

### React
- **src/pages/ClientsWithVehicles.jsx** (MODIFICADO)
  - Importa usePermissions
  - Valida establishment_id
  - Inclui establishment_id ao criar cliente
  - Inclui establishment_id ao criar veículo

---

## Status

```
✅ Coluna establishment_id adicionada em clients
✅ Coluna establishment_id adicionada em vehicles
✅ Foreign keys criadas
✅ RLS habilitado
✅ Policies criadas (SELECT, INSERT, UPDATE, DELETE)
✅ Código React atualizado
✅ Validações implementadas
```

**Sistema pronto para uso!** 🎉

---

## Benefícios

1. ✅ **Segurança:** Dados isolados por estabelecimento
2. ✅ **Privacidade:** Empresas não veem dados umas das outras
3. ✅ **Automático:** RLS funciona no nível do banco de dados
4. ✅ **Transparente:** Aplicação não precisa adicionar filtros manualmente
5. ✅ **Flexível:** Super Admin mantém acesso total

---

## Conclusão

Agora o sistema garante que:

1. ✅ **Cada estabelecimento vê apenas seus clientes**
2. ✅ **Colaboradores podem criar clientes sem erros**
3. ✅ **Dados completamente isolados entre empresas**
4. ✅ **Super Admin mantém visão global**

**Isolamento multi-tenant completo implementado!** 🔒
