-- Sistema Multi-Tenant para Facilicar
-- Hierarquia: Super Admin > Admin (Dono) > Colaborador

-- ========================================
-- PASSO 1: Atualizar tabela de usuários para incluir roles e super admin
-- ========================================

-- Adicionar coluna de role se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'colaborador';
    RAISE NOTICE 'Coluna role adicionada à tabela users';
  END IF;
END $$;

-- Adicionar coluna is_super_admin se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
    RAISE NOTICE 'Coluna is_super_admin adicionada à tabela users';
  END IF;
END $$;

-- Adicionar constraint para validar roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'users_role_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('super_admin', 'admin', 'colaborador'));
    RAISE NOTICE 'Constraint de validação de role adicionada';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Constraint users_role_check já existe';
END $$;

-- ========================================
-- PASSO 2: Atualizar tabela establishments para multi-tenant
-- ========================================

-- Adicionar owner_id (referência ao admin/dono) com tipo adaptável
DO $$
DECLARE
  users_id_type TEXT;
BEGIN
  -- Verificar tipo da coluna users.id
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id' AND table_schema = 'public';

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'owner_id'
  ) THEN
    IF users_id_type = 'uuid' THEN
      EXECUTE 'ALTER TABLE establishments ADD COLUMN owner_id UUID';
      RAISE NOTICE 'Coluna owner_id (UUID) adicionada à tabela establishments';
    ELSE
      EXECUTE 'ALTER TABLE establishments ADD COLUMN owner_id TEXT';
      RAISE NOTICE 'Coluna owner_id (TEXT) adicionada à tabela establishments';
    END IF;
  END IF;
END $$;

-- Adicionar campo de ativo/inativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'ativo'
  ) THEN
    ALTER TABLE establishments ADD COLUMN ativo BOOLEAN DEFAULT true;
    RAISE NOTICE 'Coluna ativo adicionada à tabela establishments';
  END IF;
END $$;

-- Adicionar email de contato
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'email'
  ) THEN
    ALTER TABLE establishments ADD COLUMN email TEXT;
    RAISE NOTICE 'Coluna email adicionada à tabela establishments';
  END IF;
END $$;

-- Adicionar telefone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'establishments' AND column_name = 'telefone'
  ) THEN
    ALTER TABLE establishments ADD COLUMN telefone TEXT;
    RAISE NOTICE 'Coluna telefone adicionada à tabela establishments';
  END IF;
END $$;

-- ========================================
-- PASSO 3: Criar tabela de convites (para donos de empresas)
-- ========================================

-- Detectar tipo da coluna users.id
DO $$
DECLARE
  users_id_type TEXT;
BEGIN
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'id' AND table_schema = 'public';

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'establishment_invites') THEN
    IF users_id_type = 'uuid' THEN
      CREATE TABLE establishment_invites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        establishment_id UUID REFERENCES establishments,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'colaborador')),
        token TEXT UNIQUE NOT NULL,
        accepted BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_by UUID REFERENCES users,
        created_at TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela establishment_invites criada com created_by UUID';
    ELSE
      CREATE TABLE establishment_invites (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        establishment_id UUID REFERENCES establishments,
        email TEXT NOT NULL,
        role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'colaborador')),
        token TEXT UNIQUE NOT NULL,
        accepted BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      RAISE NOTICE 'Tabela establishment_invites criada com created_by TEXT (sem FK)';
    END IF;
  ELSE
    RAISE NOTICE 'Tabela establishment_invites já existe';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invites_token ON establishment_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON establishment_invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_created_by ON establishment_invites(created_by);

-- ========================================
-- PASSO 4: Atualizar índices
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_users_establishment_id ON users(establishment_id);
CREATE INDEX IF NOT EXISTS idx_establishments_owner_id ON establishments(owner_id);
CREATE INDEX IF NOT EXISTS idx_establishments_ativo ON establishments(ativo);

-- ========================================
-- PASSO 5: Criar view para facilitar consultas (com cast para compatibilidade)
-- ========================================

DO $$
DECLARE
  users_id_type TEXT;
  establishments_id_type TEXT;
BEGIN
  -- Verificar tipos das colunas
  SELECT data_type INTO users_id_type
  FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'establishment_id' AND table_schema = 'public';

  SELECT data_type INTO establishments_id_type
  FROM information_schema.columns
  WHERE table_name = 'establishments' AND column_name = 'id' AND table_schema = 'public';

  -- Criar view com cast se necessário
  IF users_id_type = 'text' AND establishments_id_type = 'uuid' THEN
    EXECUTE 'CREATE OR REPLACE VIEW user_with_establishment AS
      SELECT
        u.id,
        u.nome,
        u.email,
        u.telefone,
        u.role,
        u.is_super_admin,
        u.establishment_id,
        e.nome as establishment_nome,
        e.cnpj as establishment_cnpj,
        e.ativo as establishment_ativo,
        u.created_at
      FROM users u
      LEFT JOIN establishments e ON u.establishment_id::uuid = e.id';
  ELSIF users_id_type = 'uuid' AND establishments_id_type = 'text' THEN
    EXECUTE 'CREATE OR REPLACE VIEW user_with_establishment AS
      SELECT
        u.id,
        u.nome,
        u.email,
        u.telefone,
        u.role,
        u.is_super_admin,
        u.establishment_id,
        e.nome as establishment_nome,
        e.cnpj as establishment_cnpj,
        e.ativo as establishment_ativo,
        u.created_at
      FROM users u
      LEFT JOIN establishments e ON u.establishment_id = e.id::uuid';
  ELSE
    EXECUTE 'CREATE OR REPLACE VIEW user_with_establishment AS
      SELECT
        u.id,
        u.nome,
        u.email,
        u.telefone,
        u.role,
        u.is_super_admin,
        u.establishment_id,
        e.nome as establishment_nome,
        e.cnpj as establishment_cnpj,
        e.ativo as establishment_ativo,
        u.created_at
      FROM users u
      LEFT JOIN establishments e ON u.establishment_id = e.id';
  END IF;

  RAISE NOTICE 'View user_with_establishment criada/atualizada';
END $$;

-- ========================================
-- PASSO 6: Criar função para verificar permissões
-- ========================================

CREATE OR REPLACE FUNCTION check_user_permission(
  user_id UUID,
  required_role TEXT,
  target_establishment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_super_admin BOOLEAN;
  user_establishment UUID;
BEGIN
  -- Buscar informações do usuário
  SELECT role, is_super_admin, establishment_id
  INTO user_role, user_super_admin, user_establishment
  FROM users
  WHERE id = user_id;

  -- Super admin pode tudo
  IF user_super_admin THEN
    RETURN TRUE;
  END IF;

  -- Verificar role específica
  IF required_role = 'super_admin' THEN
    RETURN FALSE;
  END IF;

  IF required_role = 'admin' THEN
    -- Precisa ser admin e do mesmo establishment (se especificado)
    IF user_role = 'admin' THEN
      IF target_establishment_id IS NULL THEN
        RETURN TRUE;
      ELSE
        RETURN user_establishment = target_establishment_id;
      END IF;
    END IF;
    RETURN FALSE;
  END IF;

  -- Para colaborador, apenas verificar se está no mesmo establishment
  IF target_establishment_id IS NOT NULL THEN
    RETURN user_establishment = target_establishment_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASSO 7: Dados iniciais (opcional)
-- ========================================

-- Criar super admin padrão (descomente e ajuste se necessário)
-- IMPORTANTE: Você deve criar o usuário no Supabase Auth primeiro
-- e então executar este INSERT com o UUID correto do auth.users

/*
INSERT INTO users (id, nome, email, role, is_super_admin, tipo)
VALUES (
  'UUID_DO_SEU_USUARIO_AUTH',  -- Substituir pelo UUID real do auth.users
  'Super Admin',
  'seu-email@exemplo.com',
  'super_admin',
  true,
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET is_super_admin = true, role = 'super_admin';
*/

-- ========================================
-- Mensagem final
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Schema multi-tenant configurado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE 'Hierarquia de usuários:';
  RAISE NOTICE '  1. Super Admin (você) - Gerencia todas as empresas';
  RAISE NOTICE '  2. Admin (donos) - Gerenciam sua própria empresa';
  RAISE NOTICE '  3. Colaborador - Acessam apenas sua empresa';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '  1. Criar seu usuário no Supabase Auth';
  RAISE NOTICE '  2. Executar INSERT para tornar-se super admin';
  RAISE NOTICE '  3. Usar a interface para cadastrar empresas';
END $$;
