# 🚀 Configuração Rápida do Banco de Dados

Para ativar a funcionalidade de registro de usuários, siga estes passos:

## 1. Acesse o Supabase
- Vá para: https://supabase.com/dashboard
- Entre no seu projeto: https://evtjqkvgoupxmcbatezi.supabase.co

## 2. Execute o Script SQL
- Vá para **SQL Editor** no menu lateral
- Copie e cole todo o conteúdo do arquivo `database-setup.sql`
- Clique em **RUN** para executar

## 3. Configure a Autenticação
- Vá para **Authentication** > **Settings**
- Em **Site URL**, configure: `http://localhost:3000`
- Em **Redirect URLs**, adicione: `http://localhost:3000/auth/callback`
- **Salve as configurações**

## 4. Teste o Sistema
1. Acesse http://localhost:3000
2. Clique em "Criar Nova Conta"
3. Preencha os dados e crie uma conta
4. A conta será automaticamente vinculada à empresa "Lídia Cabral Consultoria"

## 🎯 O que acontece quando você cria uma conta:
1. ✅ Usuário é criado no Supabase Auth
2. ✅ Dados são inseridos na tabela `usuarios` 
3. ✅ Usuário é automaticamente vinculado à empresa padrão
4. ✅ Login automático após confirmação do email

## 📧 Confirmação de Email
- O Supabase enviará um email de confirmação
- Para desenvolvimento, você pode desabilitar isso em **Authentication** > **Settings** > **Email Confirmations** (marcar "Enable email confirmations" como false)

## 🔧 Troubleshooting
- **Erro "relation usuarios does not exist"**: Execute o script SQL completo
- **Erro de autenticação**: Verifique as URLs de redirect
- **Email não chega**: Desabilite confirmação de email para testes