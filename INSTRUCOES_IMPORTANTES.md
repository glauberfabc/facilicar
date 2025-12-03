# 🚨 INSTRUÇÕES PARA CORRIGIR OS PROBLEMAS

## ❌ PROBLEMA 1: Agendamentos não funcionam (Erro 400)

**Causa**: As foreign keys da tabela `appointments` não existem no banco de dados.

**Solução**:
1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `EXECUTAR_ESTE_SQL.sql` deste projeto
4. **COPIE TODO O CONTEÚDO** e cole no SQL Editor
5. Clique em **Run** (ou Ctrl+Enter)
6. Aguarde as mensagens de sucesso ✅

---

## ❌ PROBLEMA 2: Menu não mostra "Gerenciar Categorias" / Ainda mostra "Novo Usuário"

**Causa**: Cache do navegador está desatualizado.

**Solução**: Faça um **HARD REFRESH** no navegador:

### Windows:
- `Ctrl + Shift + R` ou `Ctrl + F5`

### Mac:
- `Cmd + Shift + R`

### Alternativa:
1. Abra o DevTools (F12)
2. Clique com botão direito no botão de atualizar do navegador
3. Selecione "Esvaziar cache e atualizar forçadamente"

---

## ✅ VERIFICAÇÃO

Após executar os passos acima, você deve ver:

### No Menu "Negócio":
- ✅ Dashboard
- ✅ Estabelecimento
- ✅ Usuários
- ✅ Tabela de Serviço
- ✅ **Gerenciar Categorias** (ESTE DEVE APARECER)
- ✅ Novo Estabelecimento
- ❌ **NÃO DEVE TER** "Novo Usuário" aqui

### Nos Agendamentos:
- ✅ Deve carregar sem erro 400
- ✅ Deve permitir criar novos agendamentos
- ✅ Busca por placa deve funcionar
- ✅ Seleção de múltiplos serviços deve funcionar

---

## 🔍 DEBUG

Se ainda houver problemas após executar o SQL e fazer hard refresh:

1. **Abra o Console do navegador** (F12 → Console)
2. **Clique em Agendamentos**
3. **Tire um print dos erros** que aparecerem
4. **Compartilhe os prints** para análise

---

## 📝 CONFIRMAÇÃO

O arquivo **Sidebar.jsx linha 67** JÁ TEM:
```javascript
{ name: 'Gerenciar Categorias', href: '/categorias-veiculos' }
```

E **NÃO TEM** "Novo Usuário" no menu Negócio! ✅

O problema é **100% cache do navegador**.
