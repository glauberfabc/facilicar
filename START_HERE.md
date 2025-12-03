# 🚀 Comece Aqui - Facilicar Multi-Tenant

## ⚡ Setup Rápido em 5 Minutos

### 1️⃣ Execute o Script SQL (2 min)

1. Abra: https://supabase.com/dashboard
2. SQL Editor
3. Cole e execute: [`setup_multi_tenant.sql`](setup_multi_tenant.sql)

### 2️⃣ Torne-se Super Admin (2 min)

1. **Authentication** > **Users** > **Add User**
   - Email: seu-email@exemplo.com
   - Senha: sua-senha-segura

2. Copie o **UUID** do usuário criado

3. Execute no **SQL Editor:**

```sql
INSERT INTO users (id, nome, email, role, is_super_admin, tipo)
VALUES (
  'COLE_O_UUID_AQUI',
  'Seu Nome',
  'seu-email@exemplo.com',
  'super_admin',
  true,
  'admin'
);
```

### 3️⃣ Inicie a Aplicação (1 min)

```bash
npm run dev
```

### 4️⃣ Faça Login

- Acesse: http://localhost:5173/login
- Email: seu-email@exemplo.com
- Senha: sua-senha-segura

### 5️⃣ Acesse o Dashboard Super Admin

Você será redirecionado para `/super-admin`

**Ou acesse manualmente:** http://localhost:5173/super-admin

---

## 🎯 O Que Você Pode Fazer Agora

### Como Super Admin:

✅ **Cadastrar Empresas**
- Clique em "Nova Empresa"
- Preencha: Nome, CNPJ, Email, Telefone
- Defina vencimento e valor da mensalidade
- Salve

✅ **Gerenciar Empresas**
- Ver todas as empresas cadastradas
- Ativar/Desativar empresas
- Editar informações
- Excluir empresas

✅ **Criar Donos de Empresas (Admins)**

Para cada empresa criada, você precisa criar um usuário admin:

1. **No Supabase:**
   - Authentication > Users > Add User
   - Email do dono
   - Copie o UUID

2. **No SQL Editor:**
```sql
INSERT INTO users (id, nome, email, telefone, role, establishment_id, tipo)
VALUES (
  'UUID_DO_USUARIO',
  'Nome do Dono',
  'dono@empresa.com',
  '(11) 99999-9999',
  'admin',
  'UUID_DA_EMPRESA',  -- Pegue em /super-admin
  'admin'
);
```

3. **O dono poderá:**
   - Fazer login
   - Ver dashboard da empresa dele
   - Cadastrar colaboradores
   - Gerenciar clientes, serviços, etc.

---

## 📋 Hierarquia Visual

```
👑 VOCÊ (Super Admin)
    │
    ├── 🏢 Empresa A (Lava-Jato Alpha)
    │   ├── 👤 João (Admin/Dono)
    │   ├── 👷 Maria (Colaboradora)
    │   └── 👷 Pedro (Colaborador)
    │
    ├── 🏢 Empresa B (AutoBrilho)
    │   ├── 👤 Ana (Admin/Dono)
    │   └── 👷 Carlos (Colaborador)
    │
    └── 🏢 Empresa C (Estética Car)
        └── 👤 Rafael (Admin/Dono)
```

---

## 🎨 Diferenças no Sistema

### Menu Super Admin (Você)
```
👑 Super Admin
  ├─ Gestão de Empresas  ← Exclusivo!
  └─ Dashboard

Negócio
  └─ Dashboard

Clientes
Operacional
Produtos
Financeiro
```

### Menu Admin (Dono)
```
🛡️ Administrador

Negócio
  ├─ Dashboard
  ├─ Estabelecimento
  ├─ Usuários
  ├─ Tabela de Serviço
  └─ Novo Usuário

Clientes
Operacional
Produtos
Financeiro
```

### Menu Colaborador
```
🔧 Colaborador

Negócio
  └─ Dashboard

Clientes
Operacional
```

---

## 🔐 Segurança

### IMPORTANTE: Configure RLS

Após cadastrar empresas, configure Row Level Security no Supabase:

```sql
-- Exemplo para tabela clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolamento por empresa"
ON clients FOR ALL
USING (
  establishment_id = (
    SELECT establishment_id FROM users WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_super_admin = true
  )
);
```

**Aplique para todas as tabelas:**
- clients
- vehicles
- os (ordens de serviço)
- services
- products
- financial_transactions

---

## 📚 Documentação Completa

- **Setup Detalhado:** [MULTI_TENANT_SETUP.md](MULTI_TENANT_SETUP.md)
- **Database Setup:** [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)

---

## 🆘 Problemas Comuns

### "Não vejo a opção Super Admin no menu"

**Solução:**
1. Verifique se executou o INSERT para is_super_admin
2. Faça logout e login novamente
3. Verifique no Supabase SQL:
```sql
SELECT id, nome, email, role, is_super_admin
FROM users
WHERE email = 'seu-email@exemplo.com';
```

### "Erro ao acessar /super-admin"

**Solução:**
1. Certifique-se de que is_super_admin = true
2. Limpe cache do navegador
3. Faça logout e login novamente

### "Empresas não aparecem"

**Solução:**
1. Verifique se executou setup_multi_tenant.sql
2. Cadastre uma empresa de teste
3. Verifique no SQL:
```sql
SELECT * FROM establishments;
```

---

## 🎉 Próximos Passos

1. ✅ Cadastre 2-3 empresas de teste
2. ✅ Crie admins para cada empresa
3. ✅ Teste login como admin (dono)
4. ✅ Admin cadastra colaboradores
5. ✅ Teste login como colaborador
6. ✅ Configure RLS para segurança
7. ✅ Customize para suas necessidades

---

## 💡 Dicas

- **Badge no Sidebar:** Mostra sua role (SUPER/ADMIN/Colaborador)
- **Super Admin vê tudo:** Você pode acessar dados de qualquer empresa
- **Admins são isolados:** Cada dono vê apenas sua empresa
- **Colaboradores limitados:** Apenas funções operacionais

---

**Sistema Pronto para Produção!** 🚀

Qualquer dúvida, consulte [MULTI_TENANT_SETUP.md](MULTI_TENANT_SETUP.md)
