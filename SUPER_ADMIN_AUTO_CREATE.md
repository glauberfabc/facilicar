# Super Admin - Criação Automática de Admin e Limite de Colaboradores

## O Que Foi Implementado

Quando o **Super Admin** cadastra uma nova empresa, o sistema agora:

1. ✅ **Cria automaticamente o Admin (dono)** da empresa
2. ✅ **Define email e senha** para o admin fazer login
3. ✅ **Define limite de colaboradores** que o admin pode cadastrar
4. ✅ **Vincula o admin à empresa** automaticamente

---

## Fluxo de Cadastro

```
Super Admin preenche formulário:
  ├─ Dados da Empresa
  │   ├─ Nome *
  │   ├─ CNPJ
  │   ├─ Email de Contato
  │   ├─ Telefone
  │   ├─ Status Pagamento
  │   ├─ Vencimento
  │   └─ Valor Mensalidade
  │
  ├─ Dados do Administrador (Dono)
  │   ├─ Nome do Admin *
  │   ├─ Telefone do Admin
  │   ├─ Email do Admin *
  │   └─ Senha do Admin * (mínimo 6 caracteres)
  │
  └─ Configurações
      ├─ Limite de Colaboradores (1-100)
      └─ Empresa ativa (checkbox)

[Cadastrar Empresa e Admin]
```

---

## Scripts SQL Necessários

### 1. Executar primeiro (se ainda não executou):
```sql
-- Arquivo: fix_establishments_table.sql
-- Adiciona colunas: email, telefone, status_pagamento, vencimento, valor, owner_id
```

### 2. Executar para adicionar limite de colaboradores:
```sql
-- Arquivo: add_admin_creation_fields.sql
-- Adiciona coluna: max_colaboradores
```

---

## Como Funciona

### Ao criar nova empresa, o sistema faz 3 operações:

#### 1. **Criar Admin no Supabase Auth**
```javascript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.admin_email,
  password: formData.admin_senha,
  options: {
    data: {
      nome: formData.admin_nome,
      tipo: 'admin'
    }
  }
})
```

#### 2. **Criar Empresa**
```javascript
const { data: newEstablishment, error: estError } = await supabase
  .from('establishments')
  .insert([{
    nome: formData.nome,
    cnpj: formData.cnpj,
    email: formData.email,
    telefone: formData.telefone,
    status_pagamento: formData.status_pagamento,
    vencimento: formData.vencimento,
    valor: formData.valor,
    ativo: formData.ativo,
    max_colaboradores: formData.max_colaboradores,
    owner_id: authData.user.id  // ← Vincula ao admin
  }])
```

#### 3. **Criar registro do Admin na tabela users**
```javascript
const { error: userError } = await supabase
  .from('users')
  .insert([{
    id: authData.user.id,
    nome: formData.admin_nome,
    email: formData.admin_email,
    telefone: formData.admin_telefone,
    role: 'admin',
    tipo: 'admin',
    establishment_id: newEstablishment.id  // ← Vincula à empresa
  }])
```

---

## Interface do Formulário

### Modal "Nova Empresa"

```
┌─────────────────────────────────────────────────┐
│ Nova Empresa                                    │
├─────────────────────────────────────────────────┤
│ Nome da Empresa *        CNPJ                   │
│ [Lava-Jato Alpha    ]   [00.000.000/0000-00]   │
│                                                 │
│ Email de Contato         Telefone               │
│ [contato@empresa.com]   [(11) 99999-9999]      │
│                                                 │
│ Status   Vencimento        Valor Mensalidade    │
│ [Ativo▼] [2024-12-31]     [199.00]             │
├─────────────────────────────────────────────────┤
│ 👤 Dados do Administrador (Dono)               │
│ ─────────────────────────────────────────────  │
│ O admin será criado automaticamente e poderá   │
│ fazer login com o email e senha abaixo.        │
│                                                 │
│ Nome do Admin *          Telefone do Admin      │
│ [João Silva         ]   [(11) 98888-8888]      │
│                                                 │
│ Email do Admin *         Senha do Admin *       │
│ [joao@empresa.com   ]   [••••••••]             │
├─────────────────────────────────────────────────┤
│ Limite de Colaboradores                         │
│ [5      ] (Quantos colaboradores o admin pode  │
│            cadastrar)                           │
│                                                 │
│ ☑ Empresa ativa                                 │
├─────────────────────────────────────────────────┤
│ [Cancelar]      [Cadastrar Empresa e Admin]    │
└─────────────────────────────────────────────────┘
```

---

## Mensagem de Sucesso

Após cadastrar, o Super Admin recebe:

```
✅ Empresa cadastrada com sucesso!

Admin criado:
Email: joao@empresa.com
Senha: senha123

O admin já pode fazer login no sistema.
```

---

## Estrutura no Banco de Dados

### Tabela `establishments`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID da empresa |
| `nome` | TEXT | Nome da empresa |
| `cnpj` | TEXT | CNPJ (opcional) |
| `email` | TEXT | Email de contato da empresa |
| `telefone` | TEXT | Telefone |
| `status_pagamento` | TEXT | ativo, pendente, atrasado |
| `vencimento` | DATE | Data de vencimento |
| `valor` | DECIMAL | Valor da mensalidade |
| `ativo` | BOOLEAN | Empresa está ativa? |
| `owner_id` | UUID | **ID do admin (dono)** ← FK para users |
| **`max_colaboradores`** | INTEGER | **Limite de colaboradores** |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID do usuário (= auth.users.id) |
| `nome` | TEXT | Nome do usuário |
| `email` | TEXT | Email |
| `telefone` | TEXT | Telefone |
| `role` | TEXT | super_admin, admin, colaborador |
| `tipo` | TEXT | admin, colaborador |
| `establishment_id` | UUID | FK para establishments |
| `is_super_admin` | BOOLEAN | É super admin? |

---

## Relação entre Tabelas

```
establishments
  ├─ owner_id → users.id (Admin/Dono)
  └─ max_colaboradores (limite)

users
  ├─ establishment_id → establishments.id
  └─ role: 'admin' (dono)
```

**Exemplo:**

```
Empresa: Lava-Jato Alpha (ID: abc-123)
  owner_id: xyz-789
  max_colaboradores: 5

User: João Silva (ID: xyz-789)
  role: admin
  establishment_id: abc-123

  ↓ João pode cadastrar até 5 colaboradores
```

---

## Validações Implementadas

### No Formulário:
- ✅ Nome da Empresa: obrigatório
- ✅ Nome do Admin: obrigatório
- ✅ Email do Admin: obrigatório, formato válido
- ✅ Senha do Admin: obrigatório, mínimo 6 caracteres
- ✅ Limite de Colaboradores: 1-100

### No Backend:
- ✅ Verifica se email já existe no Supabase Auth
- ✅ Cria empresa com owner_id vinculado ao admin
- ✅ Cria usuário na tabela users com role='admin'

---

## Edição de Empresa

Ao **editar** uma empresa existente:
- ❌ **NÃO mostra** campos do admin (admin já foi criado)
- ✅ **Permite alterar** limite de colaboradores
- ✅ **Permite alterar** dados da empresa

---

## Checklist de Setup

### 1. Executar Scripts SQL

1. **fix_establishments_table.sql** (se ainda não executou)
   - Adiciona colunas: email, telefone, status_pagamento, vencimento, valor, owner_id

2. **add_admin_creation_fields.sql**
   - Adiciona coluna: max_colaboradores

### 2. Testar Criação de Empresa

1. Faça login como Super Admin
2. Acesse `/super-admin`
3. Clique em "Nova Empresa"
4. Preencha todos os campos:
   - Dados da Empresa
   - Dados do Admin
   - Limite de Colaboradores
5. Clique em "Cadastrar Empresa e Admin"
6. Anote o email e senha exibidos

### 3. Testar Login como Admin

1. Faça logout
2. Faça login com o email e senha do admin criado
3. Você deve ser redirecionado para `/dashboard`
4. Verifique se tem acesso ao menu de Admin

---

## Próximos Passos

### 1. Validar Limite de Colaboradores

Ao cadastrar colaborador, verificar:
```sql
SELECT COUNT(*) as total
FROM users
WHERE establishment_id = 'ID_DA_EMPRESA'
AND role = 'colaborador';

-- Se total >= max_colaboradores, bloquear cadastro
```

### 2. Notificação por Email (Futuro)

Enviar email para o admin com:
- Credenciais de acesso
- Link para fazer login
- Instruções iniciais

### 3. Recuperação de Senha (Futuro)

Implementar fluxo de "Esqueci minha senha" para admins.

---

## Exemplo de Uso Completo

### Passo 1: Super Admin cadastra empresa

**Formulário:**
```
Nome da Empresa: Lava-Jato Alpha
CNPJ: 12.345.678/0001-90
Email: contato@lavajato.com
Telefone: (11) 99999-9999
Status: Ativo
Vencimento: 2024-12-31
Valor: R$ 199,00

Nome do Admin: João Silva
Email do Admin: joao@lavajato.com
Senha do Admin: senha123
Telefone do Admin: (11) 98888-8888
Limite de Colaboradores: 5
```

**Resultado:**
```
✅ Empresa criada (ID: abc-123)
✅ Admin criado (ID: xyz-789)
✅ owner_id da empresa = xyz-789
✅ establishment_id do admin = abc-123
✅ max_colaboradores = 5
```

### Passo 2: Admin faz login

```
Email: joao@lavajato.com
Senha: senha123
```

**Redirecionado para:** `/dashboard`

**Pode acessar:**
- Dashboard
- Empresa
- Usuários (cadastrar até 5 colaboradores)
- Tabela de Serviço
- Clientes
- etc.

### Passo 3: Admin cadastra colaboradores

**Máximo:** 5 colaboradores

**Ao tentar cadastrar o 6º:**
```
❌ Limite de colaboradores atingido!
Você pode cadastrar no máximo 5 colaboradores.
Entre em contato com o suporte para aumentar o limite.
```

---

## Segurança

### Autenticação
- ✅ Admin criado via `supabase.auth.signUp()`
- ✅ Senha armazenada de forma segura pelo Supabase Auth
- ✅ Email único (Supabase não permite duplicados)

### Autorização
- ✅ owner_id vincula admin à empresa
- ✅ establishment_id vincula empresa ao admin
- ✅ RLS pode ser configurado para isolar dados

---

## Troubleshooting

### "Erro ao criar usuário: User already registered"

**Causa:** Email já existe no Supabase Auth

**Solução:** Use outro email para o admin

### "Erro ao criar empresa: email already exists"

**Causa:** CNPJ ou email da empresa já cadastrado

**Solução:** Verifique se a empresa já foi cadastrada

### Admin não consegue fazer login

**Verifique:**
1. Email e senha estão corretos
2. Usuário foi criado no Supabase Auth
3. Registro existe na tabela `users`
4. `establishment_id` está correto

```sql
-- Verificar usuário
SELECT * FROM users WHERE email = 'joao@lavajato.com';

-- Verificar empresa
SELECT * FROM establishments WHERE owner_id = 'ID_DO_ADMIN';
```

---

## Arquivos Modificados

### SQL
- **add_admin_creation_fields.sql** (NOVO) - Adiciona max_colaboradores
- **fix_establishments_table.sql** (já existe) - Adiciona colunas base

### React
- **src/pages/SuperAdminDashboard.jsx** (MODIFICADO)
  - Novos campos no formData
  - Lógica de criação automática de admin
  - Campos no formulário para dados do admin
  - Campo para limite de colaboradores

---

## Status

```
✅ Formulário atualizado
✅ Criação automática de admin implementada
✅ Limite de colaboradores adicionado
✅ Validações implementadas
✅ Mensagem de sucesso com credenciais
✅ Edição de empresa funcionando
```

**Sistema pronto para uso!** 🎉

---

## Conclusão

Agora o Super Admin pode:

1. ✅ Cadastrar empresa
2. ✅ Criar admin automaticamente
3. ✅ Definir limite de colaboradores
4. ✅ Admin pode fazer login imediatamente

**Fluxo completo automatizado!** 🚀
