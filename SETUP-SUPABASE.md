# Configuração do Supabase

Para que o painel funcione completamente, você precisa configurar um projeto no Supabase.

## 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Crie um novo projeto
4. Anote a URL e a chave anônima do projeto

## 2. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.local.example` para `.env.local`
2. Substitua os valores pelas suas credenciais:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua.chave.anonima.aqui
```

## 3. Criar Tabelas no Banco de Dados

Execute os seguintes comandos SQL no editor de SQL do Supabase:

```sql
-- Tabela de empresas
CREATE TABLE empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de campanhas
CREATE TABLE campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR NOT NULL,
  plataforma VARCHAR NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de métricas
CREATE TABLE metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  investido DECIMAL(10,2) NOT NULL,
  cliques INTEGER NOT NULL,
  leads INTEGER NOT NULL,
  ctr DECIMAL(5,2) NOT NULL,
  conversao DECIMAL(5,2) NOT NULL,
  faturamento DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de criativos
CREATE TABLE criativos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  titulo VARCHAR NOT NULL,
  imagem_url TEXT NOT NULL,
  desempenho DECIMAL(5,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Configurar Autenticação

1. No painel do Supabase, vá para "Authentication" > "Settings"
2. Configure os providers de autenticação desejados (email, Google, etc.)
3. Configure as URLs de redirecionamento se necessário

## 5. Inserir Dados de Exemplo

```sql
-- Inserir uma empresa de exemplo
INSERT INTO empresas (nome) VALUES ('Lídia Cabral Consultoria');

-- Inserir campanhas de exemplo (substitua o empresa_id pelo ID gerado)
INSERT INTO campanhas (nome, plataforma, empresa_id, ativa) 
VALUES 
  ('Masterclass Vendas', 'Meta Ads', 'SEU_EMPRESA_ID', true),
  ('Funil de Aplicação', 'Google Ads', 'SEU_EMPRESA_ID', true);

-- Inserir métricas de exemplo
INSERT INTO metricas (campanha_id, data, investido, cliques, leads, ctr, conversao)
VALUES 
  ('SEU_CAMPANHA_ID', '2024-10-24', 500.00, 250, 45, 2.6, 12.0);
```

## 6. Testar a Aplicação

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Acesse http://localhost:3000
3. Teste o login e as funcionalidades do dashboard

## Problemas Comuns

- **Erro de CORS**: Verifique se as URLs estão configuradas corretamente no Supabase
- **Falha na autenticação**: Verifique se as chaves estão corretas no `.env.local`
- **Dados não aparecem**: Verifique se as tabelas foram criadas e têm dados