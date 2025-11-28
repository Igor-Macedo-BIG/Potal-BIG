# Painel de Tráfego Pago Multiempresa

Este projeto é um painel de resultados de tráfego pago multiempresa e multicampanha, com login individual para cada cliente.

## Estrutura do Projeto

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: API Routes do Next.js
- **Banco de dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **UI Components**: shadcn/ui
- **Gráficos**: Recharts

## Funcionalidades Principais

1. **Autenticação por empresa**: Cada cliente tem sua própria conta
2. **Dashboard de métricas**: Investimento, leads, CTR, conversão
3. **Gestão de campanhas**: Visualização de campanhas ativas e históricas
4. **Criativos**: Upload e acompanhamento de performance
5. **Relatórios**: Exportação de dados em PDF
6. **Multiempresa**: Isolamento completo de dados por empresa

## Arquitetura de Dados

- **Empresas**: Cadastro de clientes (Lídia Cabral, Son, etc.)
- **Usuários**: Pessoas que acessam o painel de cada empresa
- **Campanhas**: Meta Ads, Google Ads, etc.
- **Métricas**: Dados históricos de performance
- **Criativos**: Assets e performance de cada creative

## Tecnologias

- Next.js 14 com App Router
- TypeScript para type safety
- Tailwind CSS para estilização
- Supabase para backend-as-a-service
- shadcn/ui para componentes prontos
- Recharts para visualização de dados

## Desenvolvimento

O projeto segue as melhores práticas de desenvolvimento React/Next.js com componentes reutilizáveis e estrutura escalável.