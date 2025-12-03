# Configuração do Banco de Dados - Facilicar

## 🚨 IMPORTANTE: Escolha o Script Correto

### Se você já tem tabelas criadas (erro de "relation already exists"):
**Use: `setup_database_smart.sql`** ✅
- Detecta automaticamente os tipos de dados existentes
- Adapta-se ao schema atual do banco
- Não sobrescreve tabelas existentes
- Resolve problemas de incompatibilidade de tipos

### Se é uma instalação nova (banco vazio):
**Use: `setup_database.sql`** ✅
- Cria todas as tabelas do zero
- Usa tipos otimizados (UUID)
- Mais simples e direto

## Como Executar o Setup do Banco de Dados

### Opção 1: Via Supabase Dashboard (Recomendado)

#### Passo 1: Verificar Schema Existente (Opcional)
1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto Facilicar
3. Vá para a seção **SQL Editor** no menu lateral
4. Copie o conteúdo do arquivo `check_existing_schema.sql`
5. Execute para ver quais tabelas já existem e seus tipos
6. Isso ajuda a escolher qual script usar

#### Passo 2: Executar o Script Principal
1. No **SQL Editor** do Supabase
2. Escolha o script apropriado:
   - `setup_database_smart.sql` (se já tem tabelas)
   - `setup_database.sql` (instalação nova)
3. Copie todo o conteúdo do arquivo escolhido
4. Cole no editor SQL do Supabase
5. Clique em **Run** para executar

### Opção 2: Via CLI do Supabase

```bash
# Se você tiver o CLI do Supabase instalado
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.hmzoijoahhacrhhfecfv.supabase.co:5432/postgres"
```

## Mudanças Importantes no Schema

### 1. Uso de `CREATE TABLE IF NOT EXISTS`

O script foi modificado para usar `CREATE TABLE IF NOT EXISTS` em todas as tabelas. Isso significa que:
- ✅ Se a tabela já existe, ela não será recriada (não dá erro)
- ✅ Se a tabela não existe, ela será criada normalmente
- ✅ É seguro executar o script múltiplas vezes

### 2. Correção na Tabela `vehicles`

**Antes:**
```sql
cliente_id UUID REFERENCES users
```

**Depois:**
```sql
cliente_id UUID REFERENCES clients
```

**Motivo:** A tabela `users` é para usuários do sistema (admin, colaboradores), enquanto `clients` é para clientes do lava-jato. Faz mais sentido os veículos pertencerem aos clientes.

### 3. Correção na Tabela `products`

**Antes:**
```sql
fornecedor_id UUID, -- sem FOREIGN KEY
```

**Depois:**
```sql
fornecedor_id UUID REFERENCES suppliers
```

**Motivo:** Adicionar integridade referencial entre produtos e fornecedores.

### 4. Índices Adicionados

Para melhorar a performance do sistema, foram criados índices nas colunas mais consultadas:

```sql
-- Clientes
CREATE INDEX IF NOT EXISTS idx_clients_nome ON clients(nome);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_telefone ON clients(telefone);

-- Veículos
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_vehicles_cliente_id ON vehicles(cliente_id);

-- Ordens de Serviço
CREATE INDEX IF NOT EXISTS idx_os_status ON os(status);
CREATE INDEX IF NOT EXISTS idx_os_veiculo_id ON os(veiculo_id);

-- Transações Financeiras
CREATE INDEX IF NOT EXISTS idx_financial_transactions_tipo ON financial_transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_data ON financial_transactions(data);
```

**Benefícios:**
- ⚡ Buscas por nome, CPF e telefone de clientes serão muito mais rápidas
- ⚡ Consultas de OS por status serão otimizadas
- ⚡ Relatórios financeiros por data/tipo serão mais eficientes

## Estrutura das Tabelas

### 📊 Tabelas Principais

| Tabela | Descrição | Campos Principais |
|--------|-----------|-------------------|
| `establishments` | Dados dos estabelecimentos | nome, cnpj, status_pagamento |
| `users` | Usuários do sistema | nome, telefone, tipo, establishment_id |
| `services` | Serviços oferecidos | nome, valor, tempo_estimado |
| `clients` | Clientes do lava-jato | nome, telefone, email, cpf |
| `vehicles` | Veículos dos clientes | placa, modelo, cor, cliente_id |
| `os` | Ordens de serviço | veiculo_id, servicos, status, valor_total |
| `financial_transactions` | Transações financeiras | tipo, valor, categoria, data |
| `products` | Produtos em estoque | nome, preco, quantidade |
| `suppliers` | Fornecedores | nome, telefone, cnpj, email |
| `operational_logs` | Logs de atividades | usuario_id, acao, detalhes |

### 🔐 Relacionamentos

```
establishments
    └── users (1:N)

clients
    └── vehicles (1:N)
        └── os (1:N)
            └── financial_transactions (1:N)

suppliers
    └── products (1:N)

users
    └── operational_logs (1:N)
```

## Verificar se as Tabelas Foram Criadas

Execute esta query no SQL Editor do Supabase para verificar:

```sql
SELECT
    table_name,
    (SELECT COUNT(*)
     FROM information_schema.columns
     WHERE table_schema = 'public'
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

## Próximos Passos

Após executar o script de setup:

1. ✅ Verifique se todas as tabelas foram criadas
2. ✅ Configure as políticas de RLS (Row Level Security) no Supabase
3. ✅ Adicione dados de exemplo (opcional)
4. ✅ Teste a aplicação acessando `/clientes` para ver a lista de clientes

## Problemas Comuns

### Erro: "relation already exists"

**Solução:** Use o arquivo `setup_database_smart.sql` que detecta tabelas existentes automaticamente.

### Erro: "foreign key constraint cannot be implemented" (incompatibilidade de tipos)

**Causa:** Você tem uma tabela `vehicles` com `id` do tipo TEXT, mas o script tenta criar `os.veiculo_id` como UUID.

**Solução:**
1. Use `setup_database_smart.sql` - ele detecta o tipo automaticamente
2. OU execute `check_existing_schema.sql` para ver os tipos atuais
3. OU delete a tabela `vehicles` se estiver vazia: `DROP TABLE IF EXISTS vehicles CASCADE;`

### Erro: "permission denied for schema public"

**Solução:** Certifique-se de estar usando uma conexão com privilégios de administrador no Supabase.

### Erro: "foreign key violation"

**Solução:** As tabelas precisam ser criadas na ordem correta. O script `setup_database_smart.sql` já faz isso automaticamente:
1. establishments, users, services, clients, suppliers (tabelas base)
2. vehicles (depende de clients)
3. os (depende de vehicles)
4. products (depende de suppliers)
5. financial_transactions (depende de os)
6. operational_logs (depende de users)

## 📁 Arquivos Disponíveis

### `check_existing_schema.sql`
Script de diagnóstico que mostra:
- Todas as tabelas existentes
- Tipos de dados de cada coluna
- Constraints de foreign key
- Útil para entender o estado atual do banco

### `setup_database.sql`
Script padrão com `IF NOT EXISTS`:
- Cria todas as tabelas com tipos UUID
- Usa `IF NOT EXISTS` para evitar erros
- **Problema:** Não resolve incompatibilidade de tipos em tabelas existentes
- **Use:** Apenas em bancos novos ou após limpar tabelas problemáticas

### `setup_database_smart.sql` ⭐ (RECOMENDADO)
Script inteligente e adaptável:
- Detecta tipos de dados existentes automaticamente
- Adapta foreign keys ao tipo correto (UUID ou TEXT)
- Cria tabelas apenas se não existirem
- Adiciona foreign keys condicionalmente
- Exibe mensagens de log do progresso
- **Use:** Sempre que tiver dúvida ou tabelas já existentes

## 🔍 Como Escolher o Script Certo

```
Tenho tabelas existentes?
├─ SIM
│  ├─ Erro de incompatibilidade de tipos?
│  │  └─ Use: setup_database_smart.sql ✅
│  └─ Sem erros?
│     └─ Use: setup_database_smart.sql ✅ (mais seguro)
└─ NÃO (banco vazio)
   └─ Use: setup_database.sql ✅ ou setup_database_smart.sql ✅
```

## Suporte

Se encontrar problemas, verifique:
- ✅ Conexão com o Supabase está funcionando
- ✅ Credenciais no arquivo `.env` estão corretas
- ✅ Você tem permissões de administrador no projeto Supabase
- ✅ Execute `check_existing_schema.sql` para diagnosticar o problema
