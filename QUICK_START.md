# 🚀 Guia Rápido - Facilicar

## Resolução Rápida do Erro de Foreign Key

### ❌ Você está vendo este erro?
```
ERROR: 42804: foreign key constraint "os_veiculo_id_fkey" cannot be implemented
DETAIL: Key columns "veiculo_id" and "id" are of incompatible types: uuid and text.
```

### ✅ Solução em 3 Passos:

#### Passo 1: Acesse o SQL Editor do Supabase
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

#### Passo 2: Execute o Script Inteligente
1. Abra o arquivo [`setup_database_smart.sql`](setup_database_smart.sql)
2. Copie **TODO** o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

#### Passo 3: Verifique os Resultados
Você verá mensagens como:
```
NOTICE: Tabela vehicles já existe, mantendo estrutura atual
NOTICE: Tabela OS criada com veiculo_id do tipo TEXT (sem foreign key devido a incompatibilidade)
NOTICE: ✅ Database setup completed successfully!
```

### 🎉 Pronto!
Seu banco está configurado e a lista de clientes está funcionando!

## Estrutura do Projeto

```
facilicar/
├── src/
│   ├── pages/
│   │   ├── ClientsList.jsx      ← 📋 Lista de clientes (NOVO!)
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   └── LandingPage.jsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   └── Card.jsx
│   │   └── layout/
│   │       ├── Layout.jsx
│   │       ├── Sidebar.jsx      ← 🔗 Link para /clientes adicionado
│   │       └── Header.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── supabase.js
│   └── App.jsx                  ← 🛣️ Rota /clientes adicionada
├── setup_database_smart.sql     ← ⭐ Use este! (detecta tipos automaticamente)
├── setup_database.sql           ← Para bancos novos
├── check_existing_schema.sql    ← Para diagnóstico
├── DATABASE_SETUP.md            ← Documentação completa
└── QUICK_START.md              ← Este arquivo
```

## Funcionalidades Implementadas

### ✅ Lista de Clientes
- 📋 Tabela com todos os clientes
- 🔍 Busca em tempo real por nome, telefone, email ou CPF
- ➕ Adicionar novos clientes
- ✏️ Editar clientes existentes
- 🗑️ Deletar clientes (com confirmação)
- 📊 Cards de estatísticas
- 🎨 Interface dark moderna

### 🔗 Acesso
1. Faça login no sistema
2. No sidebar, clique em **"Clientes"** → **"Lista de Clientes"**
3. Ou acesse diretamente: `http://localhost:5173/clientes`

## Próximos Passos

### 1. Testar a Lista de Clientes
```bash
npm run dev
```
Acesse: http://localhost:5173/clientes

### 2. Adicionar Dados de Teste (Opcional)
No SQL Editor do Supabase, execute:
```sql
INSERT INTO clients (nome, telefone, email, cpf) VALUES
  ('João Silva', '(11) 98765-4321', 'joao@email.com', '123.456.789-00'),
  ('Maria Santos', '(11) 91234-5678', 'maria@email.com', '987.654.321-00'),
  ('Pedro Oliveira', '(11) 99999-8888', 'pedro@email.com', '456.789.123-00');
```

### 3. Implementar Outras Páginas
Seguindo o mesmo padrão de `ClientsList.jsx`, você pode criar:
- **Veículos** (`/vehicles`)
- **Ordens de Serviço** (`/os`)
- **Serviços** (`/services`)
- **Produtos** (`/products`)
- **Fornecedores** (`/suppliers`)
- **Transações Financeiras** (`/financial`)

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## Tecnologias Utilizadas

- ⚛️ **React 19.2.0** - UI library
- 🎨 **Tailwind CSS 4.1.17** - Styling (com tema dark)
- 🔐 **Supabase 2.81.0** - Backend (Auth + Database)
- 🛣️ **React Router 7.9.5** - Roteamento
- 🎭 **Lucide React** - Ícones
- ⚡ **Vite 7.2.2** - Build tool

## Dúvidas ou Problemas?

1. **Erro de build do Tailwind?**
   - ✅ Já corrigido! Migrado para Tailwind CSS v4 com `@tailwindcss/postcss`

2. **Erro "relation already exists"?**
   - ✅ Use `setup_database_smart.sql`

3. **Erro de foreign key?**
   - ✅ Use `setup_database_smart.sql`

4. **Lista de clientes vazia?**
   - Adicione dados de teste (veja seção acima)
   - Verifique se o Supabase está conectado (arquivo `.env`)

5. **Não consegue acessar `/clientes`?**
   - Verifique se está logado
   - Verifique se executou o setup do banco de dados

## Links Úteis

- 📖 [Documentação Completa](DATABASE_SETUP.md)
- 🗄️ [Supabase Dashboard](https://supabase.com/dashboard)
- 📦 [Tailwind CSS v4 Docs](https://tailwindcss.com)
- ⚛️ [React Router Docs](https://reactrouter.com)

---

**Projeto:** Facilicar - Sistema de Gestão para Lava-Jato
**Desenvolvido com:** Claude Code ⚡
