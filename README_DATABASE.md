# 📚 Documentação do Banco de Dados - Facilicar

## 📁 Índice de Arquivos

### 🚀 Começar Aqui
1. **[EXECUTE_AGORA.md](EXECUTE_AGORA.md)** ⭐
   - Solução rápida e direta para o erro atual
   - Código pronto para copiar e colar
   - 3 passos simples

### 📖 Documentação Completa
2. **[QUICK_START.md](QUICK_START.md)**
   - Guia rápido do projeto
   - Como usar a lista de clientes
   - Comandos úteis
   - Tecnologias utilizadas

3. **[DATABASE_SETUP.md](DATABASE_SETUP.md)**
   - Documentação completa do setup
   - Escolha do script correto
   - Estrutura das tabelas
   - Relacionamentos
   - Troubleshooting detalhado

4. **[FIX_SUMMARY.md](FIX_SUMMARY.md)**
   - Resumo técnico das correções
   - Problemas encontrados e soluções
   - Tabelas afetadas
   - Verificação pós-instalação

### 🛠️ Scripts SQL
5. **[setup_database_smart.sql](setup_database_smart.sql)** ⭐ RECOMENDADO
   - Script inteligente que detecta tipos automaticamente
   - Adapta-se ao schema existente
   - Resolve incompatibilidades de tipo
   - Use este se tiver dúvidas!

6. **[setup_database.sql](setup_database.sql)**
   - Script padrão com IF NOT EXISTS
   - Para instalações novas
   - Tipos otimizados (UUID)

7. **[check_existing_schema.sql](check_existing_schema.sql)**
   - Script de diagnóstico
   - Mostra tabelas existentes e tipos
   - Útil para troubleshooting

---

## 🎯 Fluxo de Uso Recomendado

```
┌─────────────────────────────────────┐
│  Você tem erro de foreign key?     │
└─────────────┬───────────────────────┘
              │
              ▼ SIM
┌─────────────────────────────────────┐
│  Leia: EXECUTE_AGORA.md            │
│  Execute: setup_database_smart.sql  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Erro resolvido?                    │
└─────────────┬───────────────────────┘
              │
       ┌──────┴──────┐
       │             │
       ▼ SIM         ▼ NÃO
   ┌─────────┐  ┌──────────────┐
   │ SUCCESS │  │ FIX_SUMMARY  │
   │  🎉     │  │ + diagnóstico│
   └─────────┘  └──────────────┘
```

---

## 🚨 Erros Comuns e Soluções

### Erro 1: "relation already exists"
```
ERROR: relation "users" already exists
```
**Solução:** Use `setup_database_smart.sql` (tem IF NOT EXISTS)

---

### Erro 2: "foreign key constraint cannot be implemented"
```
ERROR: foreign key constraint "os_veiculo_id_fkey" cannot be implemented
DETAIL: Key columns are of incompatible types: uuid and text
```
**Solução:** Use `setup_database_smart.sql` (detecta tipos automaticamente)

---

### Erro 3: "permission denied"
```
ERROR: permission denied for schema public
```
**Solução:**
1. Verifique que está usando a conexão de administrador
2. No Supabase, use o SQL Editor (já tem permissões corretas)

---

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas

| # | Tabela | Descrição | Dependências |
|---|--------|-----------|--------------|
| 1 | `establishments` | Estabelecimentos | - |
| 2 | `users` | Usuários do sistema | auth.users, establishments |
| 3 | `services` | Serviços oferecidos | - |
| 4 | `clients` | Clientes do lava-jato | - |
| 5 | `suppliers` | Fornecedores | - |
| 6 | `vehicles` | Veículos dos clientes | clients |
| 7 | `os` | Ordens de serviço | vehicles |
| 8 | `products` | Produtos em estoque | suppliers |
| 9 | `financial_transactions` | Transações financeiras | os |
| 10 | `operational_logs` | Logs de atividades | users |

### Diagrama de Relacionamentos

```
establishments
    └── users
        └── operational_logs

clients
    └── vehicles
        └── os
            └── financial_transactions

suppliers
    └── products

services (independente)
```

---

## 🔍 Verificações Úteis

### Ver todas as tabelas
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Ver tipos de colunas ID
```sql
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'id'
ORDER BY table_name;
```

### Ver foreign keys
```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### Contar registros
```sql
SELECT
    schemaname,
    tablename,
    n_tup_ins AS total_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 📝 Notas Importantes

### ⚠️ Sobre Tipos UUID vs TEXT

**Problema:**
- Algumas tabelas podem ter sido criadas com `id` do tipo TEXT
- Isso causa incompatibilidade ao criar foreign keys UUID

**Solução:**
- `setup_database_smart.sql` detecta o tipo existente
- Adapta as foreign keys automaticamente
- Se incompatível, cria sem foreign key (apenas referência lógica)

### ✅ Vantagens do UUID
- Único globalmente
- Melhor para sistemas distribuídos
- Mais seguro (não sequencial)

### ⚠️ Quando usar TEXT para IDs
- Legado/compatibilidade
- IDs customizados (ex: "CLI-001")
- Integração com sistemas externos

---

## 🆘 Precisa de Ajuda?

### Passo 1: Diagnóstico
Execute `check_existing_schema.sql` e analise o resultado

### Passo 2: Documentação
Leia `FIX_SUMMARY.md` para entender o problema

### Passo 3: Solução
Execute `setup_database_smart.sql`

### Passo 4: Verificação
```sql
-- Deve retornar 10 tabelas
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';
```

---

## 📞 Informações de Contato

**Projeto:** Facilicar - Sistema de Gestão para Lava-Jato
**Banco de Dados:** Supabase (PostgreSQL)
**Versão:** 1.0.0
**Data:** 2025-11-11

---

## ✅ Checklist de Setup

- [ ] Executar `setup_database_smart.sql`
- [ ] Verificar mensagens de sucesso
- [ ] Confirmar 10 tabelas criadas
- [ ] Testar lista de clientes (`/clientes`)
- [ ] Adicionar dados de teste (opcional)
- [ ] Configurar RLS (Row Level Security)
- [ ] Fazer backup inicial

---

**Happy Coding! 🚀**
