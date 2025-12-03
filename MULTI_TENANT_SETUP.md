# 🏢 Sistema Multi-Tenant Hierárquico - Facilicar

## 📋 Visão Geral

O Facilicar agora é um sistema SaaS multi-tenant com hierarquia de usuários, permitindo que você (Super Admin) gerencie múltiplas empresas, cada uma com seus próprios administradores e colaboradores.

## 👥 Hierarquia de Usuários

```
┌─────────────────────────────────────────┐
│         Super Admin (VOCÊ)              │
│  • Gerencia TODAS as empresas           │
│  • Cadastra novas empresas              │
│  • Define admins para cada empresa      │
└────────────────┬────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│  Empresa A    │  │  Empresa B    │
│  Admin        │  │  Admin        │
│  (Dono)       │  │  (Dono)       │
└───────┬───────┘  └───────┬───────┘
        │                  │
    ┌───┴───┐          ┌───┴───┐
    ▼       ▼          ▼       ▼
 Colab  Colab      Colab  Colab
```

### 1️⃣ Super Admin (Você)
- **Acesso:** Todas as empresas do sistema
- **Permissões:**
  - ✅ Cadastrar novas empresas
  - ✅ Editar/Desativar empresas
  - ✅ Gerenciar pagamentos e vencimentos
  - ✅ Acessar dashboard de gestão de empresas
  - ✅ Visualizar todas as empresas cadastradas
  - ✅ Dashboard especial com badge "SUPER"

### 2️⃣ Admin (Dono da Empresa)
- **Acesso:** Apenas sua própria empresa
- **Permissões:**
  - ✅ Gerenciar dados da empresa
  - ✅ Cadastrar colaboradores
  - ✅ Gerenciar serviços
  - ✅ Gerenciar clientes
  - ✅ Acessar relatórios financeiros
  - ✅ Dashboard da empresa com badge "ADMIN"

### 3️⃣ Colaborador
- **Acesso:** Apenas sua empresa (modo operacional)
- **Permissões:**
  - ✅ Gerenciar clientes
  - ✅ Criar ordens de serviço
  - ✅ Registrar atividades operacionais
  - ❌ Não pode cadastrar outros usuários
  - ❌ Não pode alterar configurações da empresa

---

## 🚀 Setup Inicial

### Passo 1: Executar Script SQL Multi-Tenant

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá para **SQL Editor**
3. Execute o script [`setup_multi_tenant.sql`](setup_multi_tenant.sql)

Este script irá:
- ✅ Adicionar colunas de roles aos usuários
- ✅ Criar tabela de convites
- ✅ Atualizar establishments para multi-tenant
- ✅ Criar índices de performance
- ✅ Criar funções de permissão

### Passo 2: Tornar-se Super Admin

1. **Criar seu usuário no Supabase Auth:**
   - Vá para **Authentication** > **Users**
   - Clique em "Add User"
   - Crie com seu email e senha

2. **Copiar o UUID do usuário:**
   - Na lista de usuários, copie o ID (UUID)

3. **Executar SQL para tornar-se Super Admin:**

```sql
-- Substituir 'SEU_UUID_AQUI' pelo UUID copiado
INSERT INTO users (id, nome, email, role, is_super_admin, tipo)
VALUES (
  'SEU_UUID_AQUI',
  'Seu Nome',
  'seu-email@exemplo.com',
  'super_admin',
  true,
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET is_super_admin = true, role = 'super_admin';
```

### Passo 3: Fazer Login

```bash
npm run dev
```

Acesse: http://localhost:5173/login

Use as credenciais criadas no Passo 2.

---

## 📊 Funcionalidades por Role

### Super Admin - Dashboard `/super-admin`

**Tela de Gestão de Empresas:**
- 📈 Cards de estatísticas (Total, Ativas, Inativas)
- 🏢 Grid com todas as empresas cadastradas
- ➕ Botão "Nova Empresa"
- ✏️ Editar empresa
- ⚡ Ativar/Desativar empresa
- 🗑️ Excluir empresa

**Campos de Cadastro de Empresa:**
- Nome da Empresa *
- CNPJ
- Email de Contato
- Telefone
- Status de Pagamento (Ativo/Pendente/Atrasado)
- Vencimento
- Valor da Mensalidade
- Status Ativo/Inativo

### Admin (Dono) - Dashboard `/dashboard`

**Menu Disponível:**
- Dashboard
- Estabelecimento (editar dados da empresa)
- Usuários (gerenciar colaboradores)
- Tabela de Serviço
- Novo Usuário
- Clientes
- Produtos
- Financeiro

### Colaborador - Dashboard `/dashboard`

**Menu Disponível:**
- Dashboard (limitado)
- Clientes (CRUD)
- Operacional
- Produtos (visualização)

---

## 🔐 Sistema de Permissões

### Contexto de Permissões

Criado em [`src/contexts/PermissionsContext.jsx`](src/contexts/PermissionsContext.jsx)

**Funções Disponíveis:**

```javascript
import { usePermissions } from '../contexts/PermissionsContext'

const {
  profile,                          // Perfil do usuário
  establishment,                    // Dados do estabelecimento
  isSuperAdmin,                     // () => boolean
  isAdmin,                          // () => boolean
  isColaborador,                    // () => boolean
  canAccessEstablishment,           // (id) => boolean
  canManageUsers,                   // () => boolean
  canManageEstablishments,          // () => boolean
  canCreateEstablishments,          // () => boolean
  canEditEstablishmentSettings,     // () => boolean
  getRoleName,                      // () => string
  refreshProfile                    // () => Promise<void>
} = usePermissions()
```

**Exemplo de Uso:**

```javascript
// Mostrar botão apenas para admins
{canManageUsers() && (
  <Button onClick={() => navigate('/novo-usuario')}>
    Novo Usuário
  </Button>
)}

// Redirecionar se não for super admin
if (!isSuperAdmin()) {
  return <Navigate to="/dashboard" />
}
```

---

## 📱 Sidebar Baseado em Roles

### Super Admin

```
👑 SUPER
└─ Super Admin
   ├─ Gestão de Empresas
   └─ Dashboard
└─ Negócio
   └─ Dashboard
└─ Clientes
└─ Operacional
└─ Produtos
└─ Financeiro
```

### Admin (Dono)

```
🛡️ Administrador
└─ Negócio
   ├─ Dashboard
   ├─ Estabelecimento
   ├─ Usuários
   ├─ Tabela de Serviço
   └─ Novo Usuário
└─ Clientes
└─ Operacional
└─ Produtos
└─ Financeiro
```

### Colaborador

```
🔧 Colaborador
└─ Negócio
   └─ Dashboard
└─ Clientes
└─ Operacional
```

---

## 🔄 Fluxo de Cadastro

### 1. Super Admin Cadastra Empresa

1. Acessa `/super-admin`
2. Clica em "Nova Empresa"
3. Preenche dados da empresa
4. Salva

### 2. Criar Admin (Dono) da Empresa

**Opção A: Criar no Supabase Auth**
1. Super Admin cria usuário no Supabase
2. Executar SQL:

```sql
INSERT INTO users (id, nome, email, telefone, role, establishment_id, tipo)
VALUES (
  'UUID_DO_USUARIO_AUTH',
  'Nome do Dono',
  'dono@empresa.com',
  '(00) 00000-0000',
  'admin',
  'UUID_DA_EMPRESA',
  'admin'
);
```

**Opção B: Sistema de Convites (Futura Implementação)**
- Super Admin envia convite por email
- Dono clica no link e cria conta
- Automaticamente vinculado à empresa

### 3. Admin Cadastra Colaboradores

1. Admin faz login
2. Acessa "Usuários" > "Novo Usuário"
3. Preenche dados do colaborador
4. Sistema cria com `role: 'colaborador'`

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | FK para auth.users |
| `nome` | TEXT | Nome completo |
| `email` | TEXT | Email (opcional se já no auth) |
| `telefone` | TEXT | Telefone |
| `role` | TEXT | super_admin / admin / colaborador |
| `is_super_admin` | BOOLEAN | Flag de super admin |
| `establishment_id` | UUID | FK para establishments |
| `tipo` | TEXT | Tipo legado |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `establishments`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `nome` | TEXT | Nome da empresa |
| `cnpj` | TEXT | CNPJ (único) |
| `email` | TEXT | Email de contato |
| `telefone` | TEXT | Telefone |
| `owner_id` | UUID | FK para users (dono) |
| `status_pagamento` | TEXT | ativo/pendente/atrasado |
| `vencimento` | DATE | Data de vencimento |
| `valor` | DECIMAL | Valor da mensalidade |
| `ativo` | BOOLEAN | Empresa ativa? |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `establishment_invites` (Nova)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `establishment_id` | UUID | FK para establishments |
| `email` | TEXT | Email do convidado |
| `role` | TEXT | admin / colaborador |
| `token` | TEXT | Token único do convite |
| `accepted` | BOOLEAN | Convite aceito? |
| `expires_at` | TIMESTAMP | Data de expiração |
| `created_by` | UUID | FK para users |
| `created_at` | TIMESTAMP | Data de criação |

---

## 🎨 Componentes Criados

### 1. [`PermissionsContext.jsx`](src/contexts/PermissionsContext.jsx)
Contexto de permissões com funções de verificação de roles

### 2. [`SuperAdminDashboard.jsx`](src/pages/SuperAdminDashboard.jsx)
Dashboard exclusivo do Super Admin para gestão de empresas

### 3. [`RoleBasedSidebar.jsx`](src/components/layout/RoleBasedSidebar.jsx)
Sidebar que muda dinamicamente baseado na role do usuário

### 4. Scripts SQL:
- [`setup_multi_tenant.sql`](setup_multi_tenant.sql) - Setup do multi-tenant

---

## ✅ Checklist de Implementação

- [x] Schema multi-tenant no banco de dados
- [x] Sistema de roles (super_admin, admin, colaborador)
- [x] Contexto de permissões
- [x] Dashboard do Super Admin
- [x] Sidebar baseado em roles
- [x] CRUD de empresas para Super Admin
- [x] Proteção de rotas por permissão
- [ ] Sistema de convites por email
- [ ] Dashboard diferenciado para cada role
- [ ] Relatórios por empresa
- [ ] Isolamento de dados por empresa (RLS)

---

## 🔒 Segurança - Row Level Security (RLS)

**IMPORTANTE:** Configure RLS no Supabase para garantir isolamento de dados!

```sql
-- Exemplo: Clientes só podem ser vistos pela própria empresa

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their establishment's clients"
ON clients FOR SELECT
USING (
  establishment_id = (
    SELECT establishment_id
    FROM users
    WHERE id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_super_admin = true
  )
);
```

---

## 🚀 Próximos Passos

1. **Configurar RLS** para todas as tabelas
2. **Implementar sistema de convites** por email
3. **Criar dashboard específico** para cada role
4. **Adicionar relatórios** filtrados por empresa
5. **Implementar billing** automático
6. **Notificações** de vencimento para admins
7. **Logs de auditoria** para ações do super admin

---

## 📞 Como Usar

### Para Você (Super Admin):

1. Faça login
2. Acesse `/super-admin`
3. Cadastre empresas clicando em "Nova Empresa"
4. Crie usuários admin para cada empresa
5. Gerencie pagamentos e vencimentos

### Para Donos de Empresa (Admin):

1. Faça login
2. Acesse `/dashboard`
3. Configure sua empresa em "Estabelecimento"
4. Cadastre colaboradores em "Usuários"
5. Gerencie serviços, clientes, etc.

### Para Colaboradores:

1. Faça login
2. Acesse funções operacionais
3. Gerenciar clientes
4. Criar OS (ordens de serviço)

---

**Sistema Facilicar Multi-Tenant**
**Versão:** 2.0.0
**Data:** 2025-11-12
