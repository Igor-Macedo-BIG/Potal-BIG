# 🚀 GUIA COMPLETO - MIGRAÇÃO PARA NOVO PROJETO SUPABASE

## 📌 Objetivo
Configurar o projeto "Painel Geral - BIG" para usar um NOVO banco Supabase (azumehnucufvhczmazoe) 
sem mexer no projeto antigo que já tem dados.

---

## ✅ PASSO 1: Configurar Banco de Dados no Supabase

### 1.1 - Criar Schema
1. Acesse: https://supabase.com/dashboard/project/azumehnucufvhczmazoe/sql/new
2. Abra o arquivo `SETUP-NOVO-PROJETO.sql` (está na raiz do projeto)
3. Copie TODO o conteúdo
4. Cole no SQL Editor do Supabase
5. Clique em **RUN** (ou Ctrl+Enter)

✅ **Resultado esperado**: "Success. No rows returned"

---

## ✅ PASSO 2: Pegar Credenciais do Novo Projeto

### 2.1 - Acessar configurações
Acesse: https://supabase.com/dashboard/project/azumehnucufvhczmazoe/settings/api

### 2.2 - Copiar informações
Você vai precisar de:
- **Project URL** (começa com https://azumehnucufvhczmazoe.supabase.co)
- **anon/public key** (uma chave grande que começa com "eyJ...")

---

## ✅ PASSO 3: Atualizar .env.local

Abra o arquivo `.env.local` e substitua as credenciais antigas pelas novas:

```env
# Configurações do Supabase - NOVO PROJETO BIG DIVULGAÇÃO
NEXT_PUBLIC_SUPABASE_URL=https://azumehnucufvhczmazoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=cole_a_chave_anon_aqui
```

**IMPORTANTE**: NÃO faça commit do .env.local no GitHub!

---

## ✅ PASSO 4: Criar Primeiro Usuário Admin

### 4.1 - Criar usuário no Authentication
1. Acesse: https://supabase.com/dashboard/project/azumehnucufvhczmazoe/auth/users
2. Clique em **Add user** > **Create new user**
3. Preencha:
   - Email: seu-email@exemplo.com
   - Password: SuaSenhaSegura123!
   - Auto Confirm User: ✅ MARQUE ESTA OPÇÃO
4. Clique em **Create user**

### 4.2 - Anotar UUID do usuário
Depois de criar, você verá uma lista de usuários. **COPIE O UUID** (ID) do usuário que acabou de criar.

### 4.3 - Inserir na tabela usuarios
1. Abra o arquivo `CRIAR-PRIMEIRO-ADMIN.sql`
2. Substitua `COLE-O-UUID-DO-USUARIO-AQUI` pelo UUID copiado
3. Substitua o nome e email
4. Copie o script inteiro
5. Acesse: https://supabase.com/dashboard/project/azumehnucufvhczmazoe/sql/new
6. Cole e execute

---

## ✅ PASSO 5: Reiniciar Servidor Local

No terminal do VS Code:
```bash
# Parar o servidor (Ctrl+C)
# Depois:
pnpm dev
```

Acesse: http://localhost:3000

---

## ✅ PASSO 6: Fazer Login e Testar

1. Acesse http://localhost:3000/login
2. Faça login com:
   - Email: o email que você criou
   - Senha: a senha que você criou
3. Você deve ser redirecionado para o dashboard

---

## 🎯 PASSO 7 (OPCIONAL): Configurar GitHub

Se quiser criar um repositório NOVO no GitHub para este projeto:

### Opção 1: Desconectar do repo antigo
```bash
cd "C:\Users\igor_\lasy-apps\Painel Geral - BIG"
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "Initial commit - BIG Divulgação"
```

Depois crie um novo repositório no GitHub e conecte:
```bash
git remote add origin https://github.com/seu-usuario/nome-do-novo-repo.git
git push -u origin main
```

### Opção 2: Manter conectado ao repo antigo
Se quiser manter conectado, não faça nada. Mas CUIDADO para não sobrescrever o projeto antigo!

---

## 📊 Estrutura do Banco (hierarquia)

```
Empresa (BIG DIVULGAÇÃO)
  └── Funis
       └── Campanhas
            └── Conjuntos de Anúncio
                 └── Criativos
                      └── Métricas (dados diários)
```

---

## ⚠️ IMPORTANTE - Checklist Final

- [ ] Schema criado no Supabase (SETUP-NOVO-PROJETO.sql)
- [ ] .env.local atualizado com novas credenciais
- [ ] Primeiro usuário admin criado
- [ ] Servidor reiniciado (pnpm dev)
- [ ] Login funcionando
- [ ] Dashboard carregando sem erros

---

## 🆘 Problemas Comuns

### Erro: "Invalid credentials"
- Verifique se o .env.local está correto
- Reinicie o servidor (Ctrl+C e pnpm dev)

### Erro: "relation usuarios does not exist"
- Execute o SETUP-NOVO-PROJETO.sql novamente

### Não consigo fazer login
- Verifique se criou o usuário no Authentication
- Verifique se executou o CRIAR-PRIMEIRO-ADMIN.sql
- Verifique se marcou "Auto Confirm User"

---

## ✨ Próximos Passos

Depois que tudo estiver funcionando:

1. Criar funis, campanhas, conjuntos e criativos via interface
2. Começar a inserir métricas
3. Este projeto está 100% separado do anterior! 🎉

---

**Qualquer dúvida, pode chamar!**
