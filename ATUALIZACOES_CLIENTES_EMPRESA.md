# 🚗 Atualização: Clientes com Veículos e Dados da Empresa

## ✅ O Que Foi Implementado

### 1. **Nova Estrutura de Clientes e Veículos**

#### Antes:
```
Cliente:
- Nome
- Telefone
- Email
- CPF
```

#### Agora:
```
Cliente:
- Nome
- Telefone
- Email

  └─> Veículo 1:
      - Placa
      - Modelo
      - Cor
      - Categoria (Hatch, Sedan, SUV, etc)

  └─> Veículo 2:
      - Placa
      - Modelo
      - Cor
      - Categoria
```

**Vantagens:**
- ✅ Um cliente pode ter múltiplos veículos
- ✅ Categoria define o preço do serviço
- ✅ Removido CPF (simplificado)

---

### 2. **Categorias de Veículos**

Cada veículo tem uma categoria que define o preço dos serviços:

| Categoria | Descrição |
|-----------|-----------|
| **Hatch** | Carros pequenos (Gol, Onix, etc) |
| **Sedan** | Carros médios (Civic, Corolla, etc) |
| **SUV** | Utilitários esportivos |
| **Caminhonete** | Pickups e caminhonetes |
| **Moto** | Motocicletas |
| **Van** | Vans e utilitários |
| **Pickup** | Picapes |

---

### 3. **Página de Dados da Empresa**

Nova página para gerenciar informações do estabelecimento:

**Rota:** `/empresa`

**Campos:**

**Informações Básicas:**
- Nome do Estabelecimento *
- CNPJ (opcional)
- Telefone
- Email (opcional)

**Endereço:**
- CEP (busca automática via ViaCEP)
- Endereço
- Bairro
- Cidade
- Estado

**Quem pode acessar:**
- ✅ Admin (dono da empresa)
- ✅ Super Admin
- ❌ Colaborador (não tem acesso)

---

## 📁 Arquivos Criados/Modificados

### SQL - Atualização de Schema

1. **[update_client_vehicle_schema.sql](update_client_vehicle_schema.sql)**
   - Adiciona `categoria` em vehicles
   - Adiciona `establishment_id` em clients
   - Adiciona campos de endereço em establishments
   - Cria tabela `service_prices` (preços por categoria)

2. **[setup_multi_tenant.sql](setup_multi_tenant.sql)** (corrigido)
   - Fix no erro de tipo incompatível (TEXT vs UUID)
   - View com cast automático para compatibilidade

### Páginas React

3. **[src/pages/ClientsWithVehicles.jsx](src/pages/ClientsWithVehicles.jsx)** ⭐ NOVO
   - Lista de clientes com seus veículos
   - Modal para adicionar cliente
   - Modal para adicionar veículo ao cliente
   - Busca por nome, telefone ou email
   - Cards expansíveis mostrando veículos de cada cliente

4. **[src/pages/CompanySettings.jsx](src/pages/CompanySettings.jsx)** ⭐ NOVO
   - Formulário completo de dados da empresa
   - Integração com ViaCEP
   - Validação de permissões (apenas admins)

### Atualizações

5. **[src/App.jsx](src/App.jsx)**
   - Rota `/clientes` → `ClientsWithVehicles`
   - Nova rota `/empresa` → `CompanySettings`

6. **[src/components/layout/RoleBasedSidebar.jsx](src/components/layout/RoleBasedSidebar.jsx)**
   - Menu "Empresa" adicionado para admins

---

## 🚀 Como Usar

### Passo 1: Executar Scripts SQL

```sql
-- 1. Executar no Supabase SQL Editor
-- Arquivo: update_client_vehicle_schema.sql
```

Isso irá:
- ✅ Adicionar coluna `categoria` em vehicles
- ✅ Adicionar coluna `establishment_id` em clients
- ✅ Adicionar CEP, endereço, bairro, cidade, estado em establishments
- ✅ Criar tabela `service_prices`

### Passo 2: Iniciar Aplicação

```bash
npm run dev
```

### Passo 3: Acessar as Novas Funcionalidades

#### Como Admin:

**1. Configurar Dados da Empresa:**
- Menu **Negócio** > **Empresa**
- URL: http://localhost:5173/empresa
- Preencher nome, telefone, endereço, etc.
- Salvar

**2. Gerenciar Clientes e Veículos:**
- Menu **Clientes** > **Lista de Clientes**
- URL: http://localhost:5173/clientes

**Adicionar Cliente:**
1. Clique em "Novo Cliente"
2. Preencha: Nome, Telefone, Email
3. Salve

**Adicionar Veículo ao Cliente:**
1. No card do cliente, clique "+ Adicionar Veículo"
2. Preencha:
   - Placa: ABC-1234
   - Modelo: Ex: Civic
   - Cor: Ex: Preto
   - Categoria: Selecione (Hatch, Sedan, SUV, etc)
3. Salve

---

## 📊 Estrutura do Banco de Dados

### Tabela `clients`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `nome` | TEXT | Nome do cliente |
| `telefone` | TEXT | Telefone |
| `email` | TEXT | Email |
| `establishment_id` | UUID | FK para establishments |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `vehicles`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID/TEXT | PK |
| `placa` | TEXT | Placa do veículo |
| `modelo` | TEXT | Modelo |
| `cor` | TEXT | Cor |
| `categoria` | TEXT | Hatch, Sedan, SUV, etc |
| `cliente_id` | UUID | FK para clients |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `establishments` (atualizada)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `nome` | TEXT | Nome do estabelecimento |
| `cnpj` | TEXT | CNPJ |
| `telefone` | TEXT | Telefone |
| `email` | TEXT | Email |
| `cep` | TEXT | **NOVO** - CEP |
| `endereco` | TEXT | **NOVO** - Endereço completo |
| `bairro` | TEXT | **NOVO** - Bairro |
| `cidade` | TEXT | **NOVO** - Cidade |
| `estado` | TEXT | **NOVO** - Estado (UF) |
| `owner_id` | UUID/TEXT | FK para users |
| `ativo` | BOOLEAN | Empresa ativa? |
| `created_at` | TIMESTAMP | Data de criação |

### Tabela `service_prices` (nova)

Permite definir preços diferentes por categoria:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `service_id` | UUID | FK para services |
| `categoria` | TEXT | Hatch, Sedan, SUV, etc |
| `valor` | DECIMAL | Preço para esta categoria |
| `tempo_estimado` | INTEGER | Tempo em minutos |
| `establishment_id` | UUID | FK para establishments |

**Exemplo:**
```
Serviço: Lavagem Completa
  - Hatch: R$ 40,00
  - Sedan: R$ 50,00
  - SUV: R$ 70,00
  - Caminhonete: R$ 80,00
```

---

## 🎨 Interface - Clientes e Veículos

### Lista de Clientes

**Card Expansível:**
```
┌─────────────────────────────────────────┐
│ 👤 João Silva                    ✏️ 🗑️ │
│ 📞 (11) 99999-9999                      │
│ ✉️ joao@email.com                       │
├─────────────────────────────────────────┤
│ 🚗 Veículos (2)     [+ Adicionar]      │
│                                         │
│ ┌──────────────┐  ┌──────────────┐    │
│ │ ABC-1234  🗑️│  │ XYZ-5678  🗑️│    │
│ │ Civic        │  │ HB20         │    │
│ │ Preto        │  │ Branco       │    │
│ │ [Sedan]      │  │ [Hatch]      │    │
│ └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────┘
```

### Modal de Adicionar Veículo

```
┌──────────────────────────────────┐
│ Adicionar Veículo                │
│ Cliente: João Silva              │
├──────────────────────────────────┤
│ Placa *          [ABC-1234    ] │
│ Modelo *         [Civic       ] │
│ Cor              [Preto       ] │
│ Categoria *      [v Sedan    ] │
│                  └─ Hatch       │
│                     Sedan ✓     │
│                     SUV         │
│                     Caminhonete │
│                                  │
│ ℹ️ A categoria define o preço   │
├──────────────────────────────────┤
│ [Cancelar]      [Adicionar]     │
└──────────────────────────────────┘
```

---

## 🎨 Interface - Dados da Empresa

```
┌────────────────────────────────────────┐
│ 🏢 Dados da Empresa                   │
├────────────────────────────────────────┤
│ Informações Básicas                    │
│                                        │
│ Nome do Estabelecimento *              │
│ [Lava-Jato Alpha                    ] │
│                                        │
│ CNPJ (opcional)         Telefone       │
│ [00.000.000/0000-00]   [(11) 9999-0000]│
│                                        │
│ Email (opcional)                       │
│ [📧 contato@lavajato.com            ] │
├────────────────────────────────────────┤
│ 📍 Endereço                            │
│                                        │
│ CEP                                    │
│ [01310-100]  (preenche automaticamente)│
│                                        │
│ Endereço                               │
│ [Av. Paulista, 1000                 ] │
│                                        │
│ Bairro          Cidade        Estado   │
│ [Bela Vista]   [São Paulo]   [v SP ]  │
│                                        │
├────────────────────────────────────────┤
│                        [💾 Salvar]     │
└────────────────────────────────────────┘
```

---

## 🔄 Migração de Dados (se necessário)

Se você já tem clientes cadastrados com a estrutura antiga:

```sql
-- Criar veículos a partir dos dados antigos (se existirem)
-- ATENÇÃO: Só execute se tiver dados antigos com placa, modelo, etc.

-- Exemplo - adapte conforme sua necessidade:
/*
INSERT INTO vehicles (placa, modelo, cor, categoria, cliente_id)
SELECT
  old_placa_field,
  old_modelo_field,
  old_cor_field,
  'Hatch' as categoria, -- definir categoria padrão
  id as cliente_id
FROM clients
WHERE old_placa_field IS NOT NULL;
*/
```

---

## ✅ Checklist de Setup

- [ ] Executar `update_client_vehicle_schema.sql` no Supabase
- [ ] Executar `setup_multi_tenant.sql` (se ainda não executou)
- [ ] Fazer build da aplicação: `npm run build`
- [ ] Iniciar aplicação: `npm run dev`
- [ ] Acessar `/empresa` e preencher dados da empresa
- [ ] Testar cadastro de cliente
- [ ] Testar adição de veículo ao cliente
- [ ] Verificar se categorias estão funcionando

---

## 🎯 Próximos Passos Sugeridos

1. **Implementar Preços por Categoria**
   - Criar interface para definir preços de cada serviço por categoria
   - Usar tabela `service_prices`

2. **Ordens de Serviço (OS)**
   - Selecionar cliente
   - Selecionar veículo do cliente
   - Adicionar serviços (preço automático pela categoria)
   - Gerar total

3. **Histórico de Veículos**
   - Ver todos os serviços já feitos em cada veículo
   - Última lavagem
   - Valor total gasto

---

## 📊 Status

```
✅ Build funcionando
✅ Sem erros
✅ Clientes com veículos implementado
✅ Categorias implementadas
✅ Página de dados da empresa implementada
✅ Menu atualizado
✅ Rotas configuradas
```

**Sistema pronto para uso!** 🎉
