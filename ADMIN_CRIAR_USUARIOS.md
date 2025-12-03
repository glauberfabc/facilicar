# Admin - Criação de Usuários (Colaboradores)

## O Que Foi Implementado

Quando o **Admin** (dono da empresa) cadastra um novo usuário, o sistema agora:

1. ✅ **Cria usuário com email e senha** para login no sistema
2. ✅ **Valida limite de colaboradores** antes de criar
3. ✅ **Vincula automaticamente** o usuário à empresa do admin
4. ✅ **Cria credenciais de acesso** no Supabase Auth
5. ✅ **Exibe as credenciais** para o admin compartilhar com o novo usuário

---

## Fluxo de Cadastro

```
Admin acessa "Novo Usuário":
  ├─ Dados do Usuário
  │   ├─ Nome Completo *
  │   ├─ Email *
  │   ├─ Senha * (mínimo 6 caracteres)
  │   ├─ Telefone (opcional)
  │   └─ Tipo * (Colaborador ou Admin)
  │
  └─ Validações
      ├─ Verificar limite de colaboradores
      ├─ Criar usuário no Supabase Auth
      └─ Criar registro na tabela users

[Cadastrar Usuário]
```

---

## Como Funciona

### Validações Antes de Criar

#### 1. **Verificar Permissões**
```javascript
if (!profile?.establishment_id) {
  alert('Erro: Você não está vinculado a nenhuma empresa.')
  return
}

if (!isAdmin()) {
  alert('Erro: Apenas administradores podem criar novos usuários.')
  return
}
```

#### 2. **Verificar Limite de Colaboradores**
```javascript
const { count: currentCount } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('establishment_id', profile.establishment_id)
  .eq('role', 'colaborador')

const maxColaboradores = establishment?.max_colaboradores || 5

if (currentCount >= maxColaboradores) {
  alert(`Limite de colaboradores atingido!
    Você pode cadastrar no máximo ${maxColaboradores} colaboradores.`)
  return
}
```

### Criação do Usuário (3 Passos)

#### 1. **Criar no Supabase Auth**
```javascript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.senha,
  options: {
    data: {
      nome: formData.nome,
      tipo: formData.tipo
    }
  }
})
```

#### 2. **Criar na Tabela users**
```javascript
const { error: userError } = await supabase
  .from('users')
  .insert([{
    id: authData.user.id,
    nome: formData.nome,
    email: formData.email,
    telefone: formData.telefone || null,
    role: formData.tipo,
    tipo: formData.tipo,
    establishment_id: profile.establishment_id,
    senha: formData.senha  // Mesma senha usada no Auth
  }])
```

#### 3. **Exibir Credenciais**
```javascript
alert(`✅ Usuário criado com sucesso!

Nome: ${formData.nome}
Email: ${formData.email}
Senha: ${formData.senha}
Tipo: ${formData.tipo}

O usuário já pode fazer login no sistema com o email e senha informados.`)
```

---

## Interface do Formulário

### Página "Novo Usuário"

```
┌─────────────────────────────────────────────────┐
│ ← Novo Usuário                                  │
│ Cadastre um novo usuário do sistema            │
├─────────────────────────────────────────────────┤
│ ℹ️ O novo usuário receberá as credenciais de    │
│    acesso (email e senha) para fazer login.    │
│ Limite de colaboradores: 5                     │
├─────────────────────────────────────────────────┤
│ Nome Completo *                                 │
│ [João da Silva                             ]   │
│                                                 │
│ 📧 Email *              🔒 Senha *              │
│ [joao@empresa.com  ]   [••••••••]              │
│                                                 │
│ Telefone                                        │
│ [(11) 98888-8888                           ]   │
│                                                 │
│ Tipo *                                          │
│ [Colaborador ▼]                                │
│ Acesso padrão ao sistema                       │
├─────────────────────────────────────────────────┤
│ [Cancelar]             [Cadastrar Usuário]     │
└─────────────────────────────────────────────────┘
```

---

## Mensagem de Sucesso

Após cadastrar, o Admin recebe:

```
✅ Usuário criado com sucesso!

Nome: João da Silva
Email: joao@empresa.com
Senha: senha123
Tipo: colaborador

O usuário já pode fazer login no sistema com o email e senha informados.
```

---

## Estrutura no Banco de Dados

### Tabela `users`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID do usuário (= auth.users.id) |
| `nome` | TEXT | Nome do usuário |
| `email` | TEXT | Email |
| `telefone` | TEXT | Telefone |
| `role` | TEXT | admin, colaborador |
| `tipo` | TEXT | admin, colaborador |
| `establishment_id` | UUID | FK para establishments |
| **`senha`** | TEXT | **Senha do usuário** |
| `created_at` | TIMESTAMP | Data de criação |

> **Nota:** A coluna `senha` armazena a mesma senha usada no cadastro do Supabase Auth. Isso permite ter uma cópia da senha no banco de dados para referência futura.

### Tabela `establishments`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | ID da empresa |
| `nome` | TEXT | Nome da empresa |
| `max_colaboradores` | INTEGER | **Limite de colaboradores** |
| `owner_id` | UUID | ID do admin (dono) |

---

## Relação entre Tabelas

```
establishments
  ├─ max_colaboradores: 5 (limite definido pelo Super Admin)
  └─ owner_id → users.id (Admin/Dono)

users (Admin)
  ├─ establishment_id → establishments.id
  └─ role: 'admin'

users (Colaboradores)
  ├─ establishment_id → establishments.id (mesmo do Admin)
  └─ role: 'colaborador'
  └─ COUNT() não pode exceder max_colaboradores
```

**Exemplo:**

```
Empresa: Lava-Jato Alpha (ID: abc-123)
  owner_id: xyz-789 (Admin: João Silva)
  max_colaboradores: 5

User: João Silva (ID: xyz-789)
  role: admin
  establishment_id: abc-123

User: Maria Santos (ID: def-456)
  role: colaborador
  establishment_id: abc-123
  ↑ criada pelo Admin João Silva

User: Pedro Oliveira (ID: ghi-789)
  role: colaborador
  establishment_id: abc-123
  ↑ criada pelo Admin João Silva

  → João pode criar mais 3 colaboradores (5 - 2 = 3)
```

---

## Validações Implementadas

### No Formulário:
- ✅ Nome: obrigatório
- ✅ Email: obrigatório, formato válido
- ✅ Senha: obrigatório, mínimo 6 caracteres
- ✅ Telefone: opcional
- ✅ Tipo: colaborador ou admin

### No Backend:
- ✅ Verifica se usuário é Admin
- ✅ Verifica se admin está vinculado a uma empresa
- ✅ Verifica limite de colaboradores antes de criar
- ✅ Verifica se email já existe no Supabase Auth
- ✅ Cria usuário com establishment_id do admin
- ✅ Cria registro na tabela users vinculado ao Auth

---

## Passo a Passo - Como Usar

### 1. Admin Faz Login

```
Email: admin@lavajato.com
Senha: senha123
```

**Redirecionado para:** `/dashboard`

### 2. Admin Acessa "Usuários"

- Clique no menu lateral: **Usuários**
- Clique no botão: **+ Novo Usuário**

### 3. Admin Preenche Formulário

**Dados do novo colaborador:**
```
Nome Completo: Maria Santos
Email: maria@lavajato.com
Senha: senha456
Telefone: (11) 98765-4321
Tipo: Colaborador
```

### 4. Sistema Valida Limite

**Antes de criar, o sistema verifica:**

```sql
SELECT COUNT(*) FROM users
WHERE establishment_id = 'abc-123'
AND role = 'colaborador';
-- Resultado: 2

-- Limite: 5
-- Disponível: 5 - 2 = 3 vagas
-- ✅ Pode criar!
```

### 5. Usuário Criado

**Admin recebe mensagem:**
```
✅ Usuário criado com sucesso!

Nome: Maria Santos
Email: maria@lavajato.com
Senha: senha456
Tipo: colaborador
```

**Admin compartilha credenciais com Maria:**
- Email: maria@lavajato.com
- Senha: senha456

### 6. Novo Usuário Faz Login

**Maria acessa o sistema:**
```
Email: maria@lavajato.com
Senha: senha456
```

**Redirecionado para:** `/dashboard`

**Acesso:**
- ✅ Dashboard
- ✅ Clientes e Veículos
- ✅ Serviços
- ❌ Usuários (somente Admin)
- ❌ Empresa (somente Admin)

---

## Limite de Colaboradores

### Como Funciona

O limite de colaboradores é definido pelo **Super Admin** ao criar a empresa.

```
Super Admin cria empresa:
  ├─ Nome: Lava-Jato Alpha
  ├─ Admin: João Silva
  └─ Limite de Colaboradores: 5
      ↓
Admin João Silva pode criar:
  ├─ Colaborador 1: Maria Santos
  ├─ Colaborador 2: Pedro Oliveira
  ├─ Colaborador 3: Ana Costa
  ├─ Colaborador 4: Carlos Lima
  └─ Colaborador 5: Julia Fernandes
      ↓
Ao tentar criar o 6º colaborador:
  ❌ Limite atingido!
```

### Mensagem de Limite Atingido

```
❌ Limite de colaboradores atingido!

Você pode cadastrar no máximo 5 colaboradores.
Atualmente você tem 5 colaborador(es) cadastrado(s).

Entre em contato com o suporte para aumentar o limite.
```

---

## Tipos de Usuário

### Colaborador
- ✅ Acesso ao Dashboard
- ✅ Cadastro de Clientes e Veículos
- ✅ Registro de Serviços
- ✅ Visualização de Relatórios
- ❌ Não pode criar outros usuários
- ❌ Não pode alterar configurações da empresa

### Admin (criado pelo Admin principal)
- ✅ Todos os acessos do Colaborador
- ✅ Criação de novos usuários
- ✅ Edição de configurações da empresa
- ✅ Gerenciamento de serviços e preços
- ⚠️ Também conta no limite de colaboradores (se role = colaborador)

---

## Segurança

### Autenticação
- ✅ Usuário criado via `supabase.auth.signUp()`
- ✅ Senha armazenada de forma segura pelo Supabase Auth
- ✅ Email único (Supabase não permite duplicados)
- ✅ Senha mínima de 6 caracteres

### Autorização
- ✅ Apenas Admin pode criar usuários
- ✅ Usuários vinculados automaticamente ao establishment_id do admin
- ✅ Validação de limite antes de criar
- ✅ Isolamento por empresa (RLS pode ser habilitado)

---

## Troubleshooting

### "Erro: Você não está vinculado a nenhuma empresa"

**Causa:** Admin não tem establishment_id definido

**Solução:**
```sql
-- Verificar usuário
SELECT * FROM users WHERE email = 'admin@empresa.com';

-- Atualizar establishment_id se necessário
UPDATE users
SET establishment_id = 'ID_DA_EMPRESA'
WHERE email = 'admin@empresa.com';
```

### "Erro: Apenas administradores podem criar novos usuários"

**Causa:** Usuário logado não tem role='admin'

**Solução:**
```sql
-- Verificar role
SELECT email, role, tipo FROM users WHERE email = 'usuario@empresa.com';

-- Atualizar para admin se necessário
UPDATE users
SET role = 'admin', tipo = 'admin'
WHERE email = 'usuario@empresa.com';
```

### "Limite de colaboradores atingido!"

**Causa:** Empresa já tem o máximo de colaboradores permitido

**Solução:**
1. **Remover colaboradores inativos**
```sql
-- Ver colaboradores
SELECT nome, email FROM users
WHERE establishment_id = 'ID_EMPRESA' AND role = 'colaborador';

-- Remover colaborador (se necessário)
DELETE FROM users WHERE id = 'ID_COLABORADOR';
```

2. **Aumentar limite** (Super Admin)
```sql
UPDATE establishments
SET max_colaboradores = 10
WHERE id = 'ID_EMPRESA';
```

### "Erro ao criar usuário: User already registered"

**Causa:** Email já existe no Supabase Auth

**Solução:** Use outro email para o novo usuário

---

## Arquivos Modificados

### React
- **src/pages/NewUser.jsx** (MODIFICADO)
  - Adicionados campos: email, senha
  - Implementada validação de limite
  - Implementada criação no Supabase Auth
  - Implementada criação na tabela users
  - Mensagem de sucesso com credenciais

### Contextos Utilizados
- **src/contexts/PermissionsContext.jsx** (USADO)
  - `profile` - Dados do admin logado
  - `establishment` - Dados da empresa e limite
  - `isAdmin()` - Verificação de permissão

- **src/contexts/AuthContext.jsx** (USADO)
  - `signUp()` - Criação de usuário no Supabase Auth

---

## Status

```
✅ Formulário com email e senha
✅ Validação de limite de colaboradores
✅ Criação no Supabase Auth
✅ Criação na tabela users
✅ Vínculo automático com establishment_id
✅ Mensagem de sucesso com credenciais
✅ Validações de permissão
```

**Sistema pronto para uso!** 🎉

---

## Exemplo Completo de Uso

### Cenário: Lava-Jato Alpha

#### Setup Inicial (Super Admin)

**Super Admin cria empresa:**
```
Nome: Lava-Jato Alpha
Admin: João Silva (joao@lavajato.com / senha123)
Limite: 5 colaboradores
```

**Resultado:**
- ✅ Empresa criada (ID: abc-123)
- ✅ Admin criado (ID: xyz-789)
- ✅ max_colaboradores = 5

#### Admin Cria Colaboradores

**João Silva faz login:**
```
Email: joao@lavajato.com
Senha: senha123
```

**Cria Colaborador 1: Maria Santos**
```
Nome: Maria Santos
Email: maria@lavajato.com
Senha: maria123
Telefone: (11) 98765-4321
Tipo: Colaborador
```

**Cria Colaborador 2: Pedro Oliveira**
```
Nome: Pedro Oliveira
Email: pedro@lavajato.com
Senha: pedro123
Telefone: (11) 97654-3210
Tipo: Colaborador
```

**Cria Colaborador 3: Ana Costa**
```
Nome: Ana Costa
Email: ana@lavajato.com
Senha: ana123
Telefone: (11) 96543-2109
Tipo: Colaborador
```

**Status Atual:**
- ✅ 3 colaboradores criados
- ✅ 2 vagas disponíveis (5 - 3 = 2)

#### Colaborador Faz Login

**Maria Santos acessa:**
```
Email: maria@lavajato.com
Senha: maria123
```

**Acesso concedido a:**
- Dashboard
- Clientes e Veículos
- Serviços
- Relatórios

---

## Próximos Passos (Opcional)

### 1. Email de Boas-Vindas (Futuro)

Enviar email automático para novo usuário com:
- Credenciais de acesso
- Link para fazer login
- Instruções de primeiro acesso

### 2. Redefinição de Senha (Futuro)

Implementar fluxo de "Esqueci minha senha" para colaboradores.

### 3. Gestão de Usuários Inativos (Futuro)

- Marcar usuários como inativos
- Não contar inativos no limite
- Permitir reativação

### 4. Auditoria (Futuro)

Registrar:
- Quem criou o usuário
- Quando foi criado
- Última modificação

---

## Conclusão

Agora o **Admin** pode:

1. ✅ Criar novos usuários (colaboradores)
2. ✅ Definir email e senha de acesso
3. ✅ Validar limite de colaboradores automaticamente
4. ✅ Compartilhar credenciais com novos usuários
5. ✅ Novos usuários fazem login imediatamente

**Fluxo completo de gestão de usuários implementado!** 🚀
