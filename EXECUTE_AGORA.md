# ⚡ EXECUTE AGORA - Solução Rápida

## 🚨 Você está vendo este erro?

```
ERROR: foreign key constraint "operational_logs_usuario_id_fkey" cannot be implemented
DETAIL: Key columns "usuario_id" and "id" are of incompatible types: uuid and text.
```

## ✅ SOLUÇÃO EM 3 PASSOS:

### 1️⃣ Abra o Supabase SQL Editor
- Acesse: https://supabase.com/dashboard
- Clique no seu projeto
- Menu lateral: **SQL Editor**

### 2️⃣ Execute Este Script

Copie e cole TODO o conteúdo do arquivo **`setup_database_smart.sql`** e clique em **Run**.

**OU** copie e cole o código abaixo:

```sql
-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabelas básicas
CREATE TABLE IF NOT EXISTS establishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  status_pagamento TEXT DEFAULT 'ativo',
  vencimento DATE,
  valor DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  tempo_estimado INTEGER,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cpf TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  telefone TEXT,
  cnpj TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar users com detecção
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE TABLE users (
      id UUID REFERENCES auth.users PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT,
      tipo TEXT NOT NULL,
      establishment_id UUID REFERENCES establishments,
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '✅ Tabela users criada';
  ELSE
    RAISE NOTICE '⚠️ Tabela users já existe';
  END IF;
END $$;

-- Criar vehicles com detecção
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
    CREATE TABLE vehicles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      placa TEXT NOT NULL,
      modelo TEXT,
      cor TEXT,
      cliente_id UUID REFERENCES clients,
      created_at TIMESTAMP DEFAULT NOW()
    );
    RAISE NOTICE '✅ Tabela vehicles criada';
  ELSE
    RAISE NOTICE '⚠️ Tabela vehicles já existe';
  END IF;
END $$;

-- Criar OS com detecção de tipo
DO $$
DECLARE
  vehicles_id_type TEXT;
BEGIN
  SELECT data_type INTO vehicles_id_type
  FROM information_schema.columns
  WHERE table_name = 'vehicles' AND column_name = 'id' AND table_schema = 'public';

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'os') THEN
    IF vehicles_id_type = 'uuid' THEN
      EXECUTE 'CREATE TABLE os (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id UUID REFERENCES vehicles(id),
        servicos JSONB,
        status TEXT DEFAULT ''pendente'',
        qr_code TEXT,
        valor_total DECIMAL(10,2),
        data_entrada TIMESTAMP DEFAULT NOW(),
        data_conclusao TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )';
      RAISE NOTICE '✅ OS criada com UUID';
    ELSE
      EXECUTE 'CREATE TABLE os (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        veiculo_id TEXT,
        servicos JSONB,
        status TEXT DEFAULT ''pendente'',
        qr_code TEXT,
        valor_total DECIMAL(10,2),
        data_entrada TIMESTAMP DEFAULT NOW(),
        data_conclusao TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )';
      RAISE NOTICE '✅ OS criada com TEXT';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Tabela OS já existe';
  END IF;
END $$;

-- Criar operational_logs com detecção de tipo
DO $$
DECLARE
  users_id_type TEXT;
BEGIN
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id' AND table_schema = 'public';

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operational_logs') THEN
    IF users_id_type = 'uuid' THEN
      EXECUTE 'CREATE TABLE operational_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id UUID REFERENCES users(id),
        acao TEXT NOT NULL,
        detalhes JSONB,
        data TIMESTAMP DEFAULT NOW()
      )';
      RAISE NOTICE '✅ operational_logs criada com UUID';
    ELSE
      EXECUTE 'CREATE TABLE operational_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        usuario_id TEXT,
        acao TEXT NOT NULL,
        detalhes JSONB,
        data TIMESTAMP DEFAULT NOW()
      )';
      RAISE NOTICE '✅ operational_logs criada com TEXT';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Tabela operational_logs já existe';
  END IF;
END $$;

-- Criar demais tabelas
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  fornecedor_id UUID REFERENCES suppliers,
  preco DECIMAL(10,2),
  quantidade INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  categoria TEXT,
  descricao TEXT,
  os_id UUID,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_clients_nome ON clients(nome);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_os_status ON os(status);

-- Mensagem final
DO $$ BEGIN RAISE NOTICE '🎉 CONCLUÍDO COM SUCESSO!'; END $$;
```

### 3️⃣ Verifique o Resultado

Você deve ver mensagens como:
```
✅ Tabela users criada (ou já existe)
✅ Tabela vehicles criada (ou já existe)
✅ OS criada com TEXT
✅ operational_logs criada com TEXT
🎉 CONCLUÍDO COM SUCESSO!
```

## 🎯 Próximo Passo

Execute sua aplicação:
```bash
npm run dev
```

Acesse: http://localhost:5173/clientes

## 📚 Mais Informações

- Ver detalhes: [FIX_SUMMARY.md](FIX_SUMMARY.md)
- Guia completo: [DATABASE_SETUP.md](DATABASE_SETUP.md)
- Início rápido: [QUICK_START.md](QUICK_START.md)

---

**Última atualização:** 2025-11-11
**Status:** ✅ Pronto para usar
