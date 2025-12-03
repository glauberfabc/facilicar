# Cadastro de Cliente com Veículo - Atualização

## O Que Foi Modificado

Agora ao cadastrar um **novo cliente**, o sistema já solicita os dados do **primeiro veículo** junto. Isso torna o processo mais rápido e garante que todo cliente já tenha pelo menos um veículo cadastrado.

---

## Campos do Formulário

### Dados do Cliente

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Nome** | ✅ Sim | Nome completo do cliente |
| **Telefone** | ❌ Não | Telefone de contato |
| **Email** | ❌ Não | Email do cliente |

### Dados do Primeiro Veículo

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **Placa** | ✅ Sim | Placa do veículo (ABC-1234) |
| **Categoria** | ✅ Sim | Tipo de veículo (Hatch, Sedan, SUV, etc.) |
| **Modelo** | ❌ Não | Modelo do veículo (ex: Civic, Gol) |
| **Cor** | ❌ Não | Cor do veículo |

**Nota:** A **categoria** é obrigatória porque define o preço dos serviços.

---

## Categorias Disponíveis

- **Hatch** - Carros pequenos (Gol, Onix, etc.)
- **Sedan** - Carros médios (Civic, Corolla, etc.)
- **SUV** - Utilitários esportivos
- **Caminhonete** - Pickups e caminhonetes
- **Moto** - Motocicletas
- **Van** - Vans e utilitários
- **Pickup** - Picapes

---

## Como Funciona

### 1. Cadastrar Novo Cliente

1. Clique em **"Novo Cliente"**
2. Preencha os dados do cliente:
   - Nome (obrigatório)
   - Telefone (opcional)
   - Email (opcional)
3. Preencha os dados do primeiro veículo:
   - Placa (obrigatório)
   - Categoria (obrigatório)
   - Modelo (opcional)
   - Cor (opcional)
4. Clique em **"Cadastrar Cliente"**

**Resultado:** Cliente e veículo são criados simultaneamente.

---

### 2. Editar Cliente Existente

Ao clicar no botão de editar (✏️) em um cliente:
- Aparece apenas os campos do cliente (Nome, Telefone, Email)
- **NÃO** aparece campos de veículo
- Para adicionar mais veículos, use o botão **"+ Adicionar Veículo"**

---

### 3. Adicionar Mais Veículos

Depois de cadastrar o cliente, você pode adicionar quantos veículos quiser:

1. No card do cliente, clique em **"+ Adicionar Veículo"**
2. Preencha:
   - Placa (obrigatório)
   - Categoria (obrigatório)
   - Modelo (opcional)
   - Cor (opcional)
3. Clique em **"Adicionar Veículo"**

---

## Interface Visual

### Modal "Novo Cliente"

```
┌──────────────────────────────────────────────┐
│ Novo Cliente                                 │
│ Cadastre o cliente e seu primeiro veículo   │
├──────────────────────────────────────────────┤
│ Dados do Cliente                             │
│ ─────────────────────                        │
│ Nome *                                       │
│ [Nome completo do cliente              ]    │
│                                              │
│ Telefone              Email                 │
│ [(00) 00000-0000]    [email@exemplo.com]    │
│                                              │
├──────────────────────────────────────────────┤
│ 🚗 Primeiro Veículo                          │
│ ─────────────────────                        │
│ Placa *               Categoria *            │
│ [ABC-1234]           [v Hatch          ]    │
│                                              │
│ Modelo                Cor                   │
│ [Ex: Civic, Gol]     [Ex: Branco]           │
│                                              │
│ ℹ️ A categoria define o preço do serviço.   │
│    Você pode adicionar mais veículos depois. │
├──────────────────────────────────────────────┤
│ [Cancelar]          [Cadastrar Cliente]     │
└──────────────────────────────────────────────┘
```

### Modal "Editar Cliente"

```
┌────────────────────────────────┐
│ Editar Cliente                 │
├────────────────────────────────┤
│ Dados do Cliente               │
│ ─────────────────              │
│ Nome *                         │
│ [João Silva              ]     │
│                                │
│ Telefone       Email           │
│ [(11) 99999]  [joao@email.com] │
├────────────────────────────────┤
│ [Cancelar]        [Salvar]     │
└────────────────────────────────┘
```

### Modal "Adicionar Veículo"

```
┌────────────────────────────────┐
│ Adicionar Veículo              │
│ Cliente: João Silva            │
├────────────────────────────────┤
│ Placa *        Categoria *     │
│ [ABC-1234]    [v Sedan    ]    │
│                                │
│ Modelo         Cor             │
│ [Civic]       [Preto]          │
│                                │
│ ℹ️ A categoria define o preço  │
│    do serviço                  │
├────────────────────────────────┤
│ [Cancelar]  [Adicionar Veículo]│
└────────────────────────────────┘
```

---

## Fluxo de Dados

### Criação de Cliente + Veículo

```javascript
// 1. Cria o cliente
const newClient = await supabase
  .from('clients')
  .insert([{
    nome: 'João Silva',
    telefone: '(11) 99999-9999',
    email: 'joao@email.com'
  }])

// 2. Cria o veículo vinculado
await supabase
  .from('vehicles')
  .insert([{
    placa: 'ABC-1234',
    modelo: 'Civic',
    cor: 'Preto',
    categoria: 'Sedan',
    cliente_id: newClient.id  // Vincula ao cliente
  }])
```

---

## Vantagens dessa Abordagem

✅ **Mais rápido:** Cadastra cliente e veículo de uma vez
✅ **Dados completos:** Garante que todo cliente tem pelo menos um veículo
✅ **Categoria obrigatória:** Necessária para cálculo de preços
✅ **Flexível:** Cliente pode ter múltiplos veículos depois
✅ **Simplicidade:** Formulário intuitivo e organizado

---

## Estrutura no Banco de Dados

### Tabela `clients`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  establishment_id UUID,
  created_at TIMESTAMP
);
```

### Tabela `vehicles`

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  categoria TEXT NOT NULL,  -- Hatch, Sedan, SUV, etc
  cliente_id UUID REFERENCES clients(id),
  created_at TIMESTAMP
);
```

### Relação

```
Cliente (1) ──────── (N) Veículos
   │
   └─> João Silva
         ├─ ABC-1234 (Civic, Sedan)
         ├─ XYZ-5678 (HB20, Hatch)
         └─ DEF-9012 (Hilux, Caminhonete)
```

---

## Validações

### Cliente
- ✅ Nome é obrigatório
- ✅ Email deve ter formato válido (se preenchido)

### Veículo (no cadastro de cliente)
- ✅ Placa é obrigatória
- ✅ Categoria é obrigatória
- ✅ Placa convertida automaticamente para maiúsculas
- ✅ Limite de 8 caracteres na placa

### Veículo (adicionar posteriormente)
- ✅ Mesmas validações acima

---

## Exemplo de Uso

### Cenário 1: Cliente com um carro

```
Cliente: Maria Santos
Telefone: (11) 98765-4321
Email: maria@email.com

Veículo:
  Placa: DEF-5678
  Categoria: SUV
  Modelo: HR-V
  Cor: Branca
```

**Ação:** Preencher tudo no formulário "Novo Cliente" e clicar em "Cadastrar Cliente"

---

### Cenário 2: Cliente com múltiplos veículos

**Passo 1:** Cadastrar cliente com primeiro veículo
```
Cliente: Pedro Oliveira
Veículo 1: ABC-1111 (Gol, Hatch, Prata)
```

**Passo 2:** Adicionar segundo veículo
```
No card do Pedro, clicar "+ Adicionar Veículo"
Veículo 2: XYZ-2222 (Hilux, Caminhonete, Preta)
```

**Passo 3:** Adicionar terceiro veículo
```
Veículo 3: JKL-3333 (CG 160, Moto, Vermelha)
```

**Resultado:** Pedro tem 3 veículos cadastrados com categorias diferentes.

---

## Preços por Categoria

Com a categoria definida, os serviços podem ter preços diferentes:

| Serviço | Hatch | Sedan | SUV | Caminhonete |
|---------|-------|-------|-----|-------------|
| Lavagem Simples | R$ 30 | R$ 40 | R$ 50 | R$ 60 |
| Lavagem Completa | R$ 50 | R$ 60 | R$ 80 | R$ 100 |
| Polimento | R$ 150 | R$ 180 | R$ 250 | R$ 300 |

**Tabela:** `service_prices` (criada no update_client_vehicle_schema.sql)

---

## Arquivos Modificados

### [src/pages/ClientsWithVehicles.jsx](src/pages/ClientsWithVehicles.jsx)

**Mudanças:**
1. `formData` agora inclui campos do veículo (placa, modelo, cor, categoria)
2. `handleSubmit` cria cliente E veículo quando é novo cadastro
3. Modal "Novo Cliente" mostra campos do veículo
4. Modal "Editar Cliente" mostra apenas dados do cliente
5. Modal "Adicionar Veículo" permanece igual (para adicionar mais veículos depois)

---

## Checklist de Teste

- [ ] Cadastrar novo cliente com veículo completo (todos os campos)
- [ ] Cadastrar novo cliente apenas com campos obrigatórios (Nome e Placa/Categoria)
- [ ] Editar cliente existente (sem alterar veículos)
- [ ] Adicionar segundo veículo a um cliente
- [ ] Adicionar terceiro veículo a um cliente
- [ ] Deletar um veículo
- [ ] Deletar um cliente (deve deletar todos os veículos)
- [ ] Buscar cliente por nome
- [ ] Buscar cliente por telefone
- [ ] Verificar se a placa fica em maiúsculas automaticamente

---

## Status

```
✅ Build funcionando
✅ Modal de novo cliente com campos de veículo
✅ Campos obrigatórios corretos
✅ Validações implementadas
✅ Criação de cliente + veículo simultânea
✅ Modal de edição sem campos de veículo
✅ Modal de adicionar veículo mantido
```

**Sistema atualizado e pronto para uso!** 🎉

---

## Próximos Passos Sugeridos

1. **Implementar busca por placa** - Adicionar busca de veículos na lista
2. **Histórico de serviços por veículo** - Ver todos os serviços já feitos em cada veículo
3. **Sugestão de categoria** - Baseado no modelo digitado (API externa?)
4. **Upload de foto do veículo** - Permitir adicionar imagem do carro
5. **QR Code por veículo** - Gerar QR Code único para cada veículo
