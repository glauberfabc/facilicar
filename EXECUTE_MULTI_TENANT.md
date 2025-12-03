# ⚡ EXECUTE AGORA - Setup Multi-Tenant

## 🚨 Você quer o sistema hierárquico?

```
👑 Você (Super Admin)
    ↓
🏢 Múltiplas Empresas
    ↓
👤 Dono de cada empresa (Admin)
    ↓
👷 Colaboradores
```

## ✅ SOLUÇÃO EM 4 PASSOS:

### 1️⃣ Execute o Script SQL Multi-Tenant

1. Acesse: https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Copie TODO o conteúdo de [`setup_multi_tenant.sql`](setup_multi_tenant.sql)
4. Cole e clique em **Run**

**Você verá mensagens como:**
```
✅ Coluna role adicionada à tabela users
✅ Coluna is_super_admin adicionada à tabela users
✅ Coluna owner_id (TEXT) adicionada à tabela establishments
✅ Tabela establishment_invites criada
✅ Schema multi-tenant configurado com sucesso!
```

### 2️⃣ Criar Seu Usuário no Supabase

1. No Supabase: **Authentication** > **Users**
2. Clique em **Add User**
3. Email: `seu-email@exemplo.com`
4. Senha: `SuaSenhaSegura123!`
5. **Copie o UUID** do usuário criado (algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 3️⃣ Tornar-se Super Admin

No **SQL Editor**, execute (substitua o UUID):

```sql
-- IMPORTANTE: Substituir 'COLE_SEU_UUID_AQUI' pelo UUID copiado no passo anterior
INSERT INTO users (id, nome, email, role, is_super_admin, tipo)
VALUES (
  'COLE_SEU_UUID_AQUI',
  'Seu Nome Completo',
  'seu-email@exemplo.com',
  'super_admin',
  true,
  'admin'
);
```

**Se der erro "duplicate key"**, significa que já existe um registro. Use UPDATE:

```sql
UPDATE users
SET
  role = 'super_admin',
  is_super_admin = true,
  nome = 'Seu Nome Completo',
  email = 'seu-email@exemplo.com'
WHERE id = 'COLE_SEU_UUID_AQUI';
```

### 4️⃣ Fazer Login e Acessar

```bash
# Iniciar aplicação
npm run dev
```

1. Acesse: http://localhost:5173/login
2. Email: `seu-email@exemplo.com`
3. Senha: `SuaSenhaSegura123!`
4. Você será redirecionado automaticamente

**Acesse o Super Admin:**
- URL: http://localhost:5173/super-admin

---

## 🎯 O Que Você Pode Fazer Agora

### ✅ Como Super Admin:

1. **Cadastrar Empresas:**
   - Clique em "Nova Empresa"
   - Nome: Ex: "Lava-Jato Alpha"
   - CNPJ: 00.000.000/0000-00
   - Email: contato@lavajato.com
   - Telefone: (11) 99999-9999
   - Valor: 199.00
   - Status: Ativo

2. **Criar Dono da Empresa:**

   **No Supabase > Authentication > Add User:**
   - Email: dono@lavajato.com
   - Senha: SenhaDoDono123!
   - Copie o UUID

   **No SQL Editor:**
   ```sql
   -- 1. Primeiro, pegue o ID da empresa criada
   SELECT id, nome FROM establishments ORDER BY created_at DESC LIMIT 1;

   -- 2. Copie o UUID da empresa e execute:
   INSERT INTO users (id, nome, email, telefone, role, establishment_id, tipo)
   VALUES (
     'UUID_DO_DONO',           -- UUID do auth.users
     'João Silva',             -- Nome do dono
     'dono@lavajato.com',      -- Email
     '(11) 99999-9999',        -- Telefone
     'admin',                  -- Role = admin (dono)
     'UUID_DA_EMPRESA',        -- ID da empresa
     'admin'                   -- Tipo
   );
   ```

3. **Atualizar o owner_id da empresa:**
   ```sql
   UPDATE establishments
   SET owner_id = 'UUID_DO_DONO'
   WHERE id = 'UUID_DA_EMPRESA';
   ```

---

## 📊 Testando o Sistema

### Teste 1: Login como Super Admin
- ✅ Vê menu "Super Admin" com badge SUPER
- ✅ Acessa `/super-admin`
- ✅ Vê todas as empresas

### Teste 2: Login como Dono (Admin)
- ✅ Vê menu "Administrador" com badge ADMIN
- ✅ Acessa apenas sua empresa
- ✅ Pode cadastrar colaboradores
- ✅ Gerencia clientes, serviços, etc.

### Teste 3: Criar Colaborador

**Como Admin (dono), acesse:**
- `/usuarios` > "Novo Usuário"

**Ou no SQL:**
```sql
-- 1. Criar no Supabase Auth primeiro
-- 2. Executar:
INSERT INTO users (id, nome, email, telefone, role, establishment_id, tipo)
VALUES (
  'UUID_DO_COLABORADOR',
  'Maria Santos',
  'maria@lavajato.com',
  '(11) 88888-8888',
  'colaborador',
  'UUID_DA_EMPRESA',
  'colaborador'
);
```

---

## 🔍 Verificar se Deu Certo

Execute no SQL Editor:

```sql
-- Ver todos os usuários com suas roles
SELECT
  u.nome,
  u.email,
  u.role,
  u.is_super_admin,
  e.nome as empresa
FROM users u
LEFT JOIN establishments e ON u.establishment_id = e.id
ORDER BY u.is_super_admin DESC, u.role;
```

**Resultado esperado:**
```
nome          | email              | role        | is_super_admin | empresa
------------- | ------------------ | ----------- | -------------- | ----------------
Seu Nome      | seu@email.com      | super_admin | true           | null
João Silva    | dono@lavajato.com  | admin       | false          | Lava-Jato Alpha
Maria Santos  | maria@lavajato.com | colaborador | false          | Lava-Jato Alpha
```

---

## 🎨 Como Funciona Cada Role

### 👑 Super Admin (Você)

**Menu:**
```
👑 Super Admin
  ├─ Gestão de Empresas  ← EXCLUSIVO
  └─ Dashboard

Negócio
  └─ Dashboard

Clientes, Operacional, Produtos, Financeiro
```

**Permissões:**
- ✅ Ver TODAS as empresas
- ✅ Cadastrar novas empresas
- ✅ Editar/Desativar empresas
- ✅ Gerenciar pagamentos

### 🛡️ Admin (Dono da Empresa)

**Menu:**
```
🛡️ Administrador

Negócio
  ├─ Dashboard
  ├─ Estabelecimento
  ├─ Usuários
  ├─ Tabela de Serviço
  └─ Novo Usuário

Clientes, Operacional, Produtos, Financeiro
```

**Permissões:**
- ✅ Ver APENAS sua empresa
- ✅ Cadastrar colaboradores
- ✅ Gerenciar serviços
- ✅ Gerenciar clientes
- ✅ Acessar financeiro

### 🔧 Colaborador

**Menu:**
```
🔧 Colaborador

Negócio
  └─ Dashboard (limitado)

Clientes
Operacional
```

**Permissões:**
- ✅ Gerenciar clientes
- ✅ Criar OS
- ❌ NÃO pode cadastrar usuários
- ❌ NÃO pode alterar empresa

---

## 🐛 Problemas Comuns

### "Não vejo o menu Super Admin"

**Solução:**
1. Faça logout
2. Verifique no SQL se `is_super_admin = true`:
   ```sql
   SELECT * FROM users WHERE email = 'seu-email@exemplo.com';
   ```
3. Se não estiver, execute o UPDATE do passo 3
4. Faça login novamente

### "Erro ao criar empresa"

**Solução:**
1. Verifique se executou `setup_multi_tenant.sql`
2. Verifique se a tabela tem as novas colunas:
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'establishments';
   ```

### "Foreign key error"

**Solução:**
- O script foi atualizado para detectar automaticamente o tipo (TEXT ou UUID)
- Re-execute `setup_multi_tenant.sql`

---

## 📚 Próximos Passos

1. ✅ Cadastre 2-3 empresas de teste
2. ✅ Crie donos para cada empresa
3. ✅ Teste login como cada tipo de usuário
4. ✅ Configure RLS (Row Level Security)
5. ⏭️ Personalize para suas necessidades

---

## 🔒 IMPORTANTE: Segurança

Após testar, configure RLS para isolamento de dados:

```sql
-- Exemplo: Isolar clientes por empresa
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolamento por empresa"
ON clients FOR ALL
USING (
  -- Super admin vê tudo
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND is_super_admin = true
  )
  OR
  -- Outros veem apenas da sua empresa
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
);
```

Aplique para todas as tabelas sensíveis!

---

**Pronto! Seu sistema multi-tenant está funcionando!** 🎉

Dúvidas? Veja: [MULTI_TENANT_SETUP.md](MULTI_TENANT_SETUP.md)
