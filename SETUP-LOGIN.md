# 🔐 SETUP SISTEMA DE LOGIN - PORTAL LÍDIA CABRAL

## 📋 INSTRUÇÕES DE CONFIGURAÇÃO

### 1. **Criar Tabela no Supabase**

Acesse o **SQL Editor** no Supabase e execute o arquivo `supabase-setup.sql`:

```sql
-- O arquivo está em: supabase-setup.sql
-- Copie e cole todo o conteúdo no SQL Editor do Supabase
-- Clique em "Run" para criar a tabela users
```

### 2. **Configurar Políticas de Segurança (RLS)**

As políticas já estão no arquivo SQL, mas você pode verificar:
- Vá em **Authentication** → **Policies**
- Certifique-se que a tabela `users` tem as 4 policies criadas

### 3. **Criar Primeiro Usuário Admin**

Como você ainda não tem nenhum usuário admin, crie o primeiro manualmente:

**Opção A: Via SQL Editor (Recomendado)**
```sql
-- 1. Primeiro, crie o usuário no Auth (substitua os valores)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@lidiacabral.com',  -- ⚠️ ALTERE AQUI
  crypt('SuaSenhaSegura123', gen_salt('bf')),  -- ⚠️ ALTERE AQUI
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"nome":"Admin Sistema"}',
  NOW(),
  NOW(),
  '',
  ''
) RETURNING id;

-- 2. Copie o ID retornado acima e use aqui
INSERT INTO public.users (id, nome, email, role, ativo)
VALUES (
  'COLE_O_ID_AQUI',  -- ⚠️ Cole o UUID retornado acima
  'Admin Sistema',
  'admin@lidiacabral.com',
  'admin',
  true
);
```

**Opção B: Via Dashboard do Supabase**
1. Vá em **Authentication** → **Users**
2. Clique em **Add User**
3. Preencha:
   - Email: `admin@lidiacabral.com`
   - Password: `SuaSenhaSegura123`
   - Auto Confirm User: ✅ (marque)
4. Após criar, copie o **User UID**
5. Vá em **Table Editor** → **users**
6. Clique em **Insert** → **Insert row**
7. Preencha:
   - id: (Cole o User UID copiado)
   - nome: `Admin Sistema`
   - email: `admin@lidiacabral.com`
   - role: `admin`
   - ativo: `true`

### 4. **Testar o Login**

1. Acesse: `http://localhost:3000/login`
2. Selecione: **Administrador**
3. Email: `admin@lidiacabral.com`
4. Senha: `SuaSenhaSegura123`
5. Clique em **Entrar no Portal**

✅ Você deve ser redirecionado para `/admin`

### 5. **Criar Outros Usuários**

Agora que você está logado como admin:

1. Vá em `/admin`
2. Aba **Usuários**
3. Clique em **Novo Usuário**
4. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Tipo de Acesso (SDR, Closer, etc.)
5. Clique em **Criar Usuário**

---

## 🎨 PÁGINA DE LOGIN

A nova página de login está em: `/login`

**Características:**
- ✅ Design premium com animações
- ✅ Seleção visual de tipo de acesso (6 opções)
- ✅ Validação de email e senha
- ✅ Verificação de role correspondente
- ✅ Verificação de usuário ativo
- ✅ Redirecionamento automático baseado no role
- ✅ Branding "Portal Lídia Cabral"

**Tipos de Acesso:**
1. 🛡️ **Administrador** → `/admin`
2. 💼 **Gestor de Marketing** → `/admin`
3. 🎧 **Customer Success** → `/cs`
4. 📞 **SDR** → `/sdr`
5. 🤝 **Closer** → `/closer`
6. 📱 **Social Seller** → `/social-seller`

---

## 🔒 SEGURANÇA

**Proteções Implementadas:**
- ✅ Autenticação via Supabase Auth
- ✅ Senhas criptografadas (bcrypt)
- ✅ Row Level Security (RLS) no banco
- ✅ Verificação de role antes do login
- ✅ Verificação de usuário ativo
- ✅ Apenas admins podem criar usuários

**Próximos Passos (Opcional):**
- [ ] Middleware para proteger rotas automaticamente
- [ ] Recuperação de senha
- [ ] Alteração de senha
- [ ] Logs de acesso
- [ ] Sessão com expiração

---

## 📝 VARIÁVEIS DE AMBIENTE

Certifique-se que o `.env.local` tem:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

---

## 🐛 TROUBLESHOOTING

**Erro: "Email já cadastrado"**
- O email já existe no Supabase Auth
- Use outro email ou delete o usuário existente

**Erro: "Usuário não encontrado"**
- O email/senha estão incorretos
- Ou o usuário não foi criado na tabela `users`

**Erro: "Não tem acesso como X"**
- O role selecionado não corresponde ao cadastrado
- Verifique o role na tabela `users`

**Erro: "Usuário inativo"**
- O campo `ativo` está como `false`
- Mude para `true` na tabela `users`

---

## ✅ CHECKLIST DE DEPLOY

Antes de fazer deploy na Vercel:

- [ ] Executar `supabase-setup.sql` no Supabase de produção
- [ ] Criar usuário admin inicial
- [ ] Configurar variáveis de ambiente na Vercel
- [ ] Testar login em produção
- [ ] Criar usuários de teste para cada role

---

**🎉 Sistema pronto para uso!**
