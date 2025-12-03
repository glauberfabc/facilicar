# 🚨 LEIA ISSO PRIMEIRO!

## ⚡ RESUMO RÁPIDO

Você tem **7 problemas** que são **super fáceis de resolver**:

### Problema 1: Menu com ordem errada
**Solução**: Pressione `Ctrl + Shift + R` (já corrigido no código!)
**Tempo**: 1 segundo

### Problema 2: Erro 403 ao criar categorias
**Solução**: Execute [CORRIGIR_TUDO_DEFINITIVO.sql](CORRIGIR_TUDO_DEFINITIVO.sql) no Supabase
**Tempo**: 2 minutos

### Problema 3: Erro 400 nos agendamentos
**Solução**: Execute [CORRIGIR_TUDO_DEFINITIVO.sql](CORRIGIR_TUDO_DEFINITIVO.sql) no Supabase

### Problema 4: Erro "column marca does not exist"
**Solução**: Execute [CORRIGIR_TUDO_DEFINITIVO.sql](CORRIGIR_TUDO_DEFINITIVO.sql) no Supabase

### Problema 5: Erro 406 ao buscar placa
**Solução**: Execute [CORRIGIR_TUDO_DEFINITIVO.sql](CORRIGIR_TUDO_DEFINITIVO.sql) no Supabase

### Problema 6: Erro 403 ao criar cliente
**Solução**: Execute [CORRIGIR_TUDO_DEFINITIVO.sql](CORRIGIR_TUDO_DEFINITIVO.sql) no Supabase

### Problema 7: Erro 403 ao criar veículo
**Solução**: Execute [CORRIGIR_TUDO_DEFINITIVO.sql](CORRIGIR_TUDO_DEFINITIVO.sql) no Supabase

---

## 📝 PASSO A PASSO (2 MINUTOS)

### 1️⃣ ARRUMAR O BANCO DE DADOS

1. Abra https://supabase.com
2. Entre no seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Abra o arquivo **CORRIGIR_TUDO_DEFINITIVO.sql** (deste projeto)
5. **Copie TODO o conteúdo** (são ~480 linhas)
6. Cole no SQL Editor
7. Clique em **RUN** ou pressione `Ctrl+Enter`
8. Aguarde aparecer "✅✅✅ TUDO CORRIGIDO! ✅✅✅"

### 2️⃣ LIMPAR CACHE DO NAVEGADOR

**Pressione**: `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)

**⚠️ IMPORTANTE**: Não é só F5! Precisa ser Ctrl+Shift+R!

---

## ✅ PRONTO! AGORA TESTE:

### Teste 1: Menu
1. Olhe o menu "Negócio"
2. ✅ "Gerenciar Categorias" deve estar ANTES de "Tabela de Serviço"
3. ❌ NÃO deve ter "Novo Usuário"

### Teste 2: Criar Categoria
1. Clique em **Negócio → Gerenciar Categorias**
2. Clique em **Nova Categoria**
3. Preencha: Nome = "Sedan", Ordem = 1
4. Clique em **Salvar**
5. ✅ Deve salvar **sem erro 403**

### Teste 3: Criar Cliente/Veículo Novo
1. Vá em **Clientes → Agendamentos**
2. Clique em **Novo Agendamento**
3. Digite uma placa NOVA (ex: XYZ9999)
4. Preencha: Nome, Telefone, Marca, Modelo, Cor, Categoria
5. Clique em **Cadastrar Cliente e Veículo**
6. ✅ Deve criar **sem erro 403 ou 406**

### Teste 4: Buscar Veículo Existente
1. Digite uma placa existente
2. ✅ Deve mostrar dados do cliente e veículo **sem erro 406**
3. ✅ Deve mostrar Marca, Modelo, Cor

### Teste 5: Criar Agendamento
1. Após ter cliente/veículo (criado ou encontrado)
2. Selecione múltiplos serviços (checkboxes)
3. Veja o total calculando automaticamente
4. Preencha data/hora
5. Clique em **Criar Agendamento**
6. ✅ Deve salvar **sem erro 400**

### Teste 6: Listar Agendamentos
1. A página deve carregar a lista
2. ✅ Deve mostrar **sem erro 400**
3. ✅ Deve exibir placa, marca, modelo de cada veículo

---

## 🔍 SE DER ERRO

Abra o console do navegador (F12) e:

### Se erro 403 (Forbidden) ao criar categoria/cliente:
- Confirme que executou o SQL no Supabase (PARTE 2 e PARTE 4)
- Verifique se você é Admin (não Colaborador)
- Faça logout e login novamente
- Aguarde 30 segundos (cache do Supabase)

### Se erro 400 (Bad Request) ao carregar agendamentos:
- Confirme que executou o SQL no Supabase (PARTE 3)
- Aguarde 30 segundos para cache atualizar
- Faça hard refresh (Ctrl+Shift+R)

### Se erro 406 (Not Acceptable) ao buscar placa:
- Confirme que executou o SQL (PARTE 1 - vehicles)
- Aguarde 30 segundos
- Tente novamente

### Se erro "column marca does not exist":
- Confirme que executou o SQL (PARTE 1)
- Aguarde 30 segundos
- Recarregue a página

### Se menu não mudou:
- Certifique-se de pressionar **Ctrl+Shift+R** (não apenas F5)
- Ou: DevTools (F12) → Application → Clear storage → Clear site data

---

## 📚 DOCUMENTAÇÃO COMPLETA

Leia [README_CORRECOES.md](README_CORRECOES.md) para entender TODOS os detalhes técnicos.

---

## 🎯 O QUE O SQL FAZ?

**PARTE 1: Vehicles (Colunas)**
- Adiciona colunas: marca, modelo, cor
- Resolve erro "column marca does not exist"
- Resolve erro 406 ao buscar placa

**PARTE 1.5: Vehicles (RLS)**
- Corrige políticas de segurança (RLS)
- Permite criar veículos
- Resolve erro 403 ao cadastrar veículo

**PARTE 2: Clients**
- Corrige políticas de segurança (RLS)
- Permite criar clientes
- Resolve erro 403 ao cadastrar cliente

**PARTE 3: Appointments**
- Recria tabela com estrutura correta
- Adiciona foreign keys (client_id, vehicle_id, etc.)
- Define service_id como TEXT (múltiplos serviços)
- Configura segurança (RLS)
- Resolve erro 400 ao carregar/criar agendamentos

**PARTE 4: Vehicle Categories**
- Corrige políticas de segurança (RLS)
- Permite criar/editar/deletar categorias
- Resolve erro 403 ao criar categoria
- Garante isolamento por empresa

---

**🎯 TL;DR**:
1. Execute **CORRIGIR_TUDO_DEFINITIVO.sql** no Supabase
2. Pressione **Ctrl+Shift+R** no navegador
3. Pronto! ✅
