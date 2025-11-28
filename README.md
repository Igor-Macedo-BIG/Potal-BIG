# Painel de Tráfego Pago Multiempresa

Este projeto é um painel de resultados de tráfego pago multiempresa e multicampanha, com login individual para cada cliente, permitindo que cada empresa visualize suas próprias métricas e criativos de forma isolada.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Gráficos**: Recharts
- **Banco de dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Backend**: API Routes do Next.js

## 📊 Funcionalidades

### ✅ Implementadas
- [x] **Sistema de Login**: Autenticação por empresa
- [x] **Dashboard Principal**: Métricas de investimento, leads, CTR e conversão
- [x] **Visualização de Campanhas**: Tabela com campanhas ativas e pausadas
- [x] **Gráficos Interativos**: Evolução de métricas ao longo do tempo
- [x] **Layout Responsivo**: Interface otimizada para desktop e mobile
- [x] **Navegação Lateral**: Menu com diferentes seções do painel

### 🔄 Em Desenvolvimento
- [ ] **Gestão de Criativos**: Upload e acompanhamento de performance
- [ ] **Relatórios PDF**: Exportação de dados
- [ ] **Integração com APIs**: Meta Ads, Google Ads
- [ ] **Notificações**: Alertas de performance
- [ ] **Configurações**: Personalização por empresa

## 🏗️ Arquitetura de Dados

```sql
-- Estrutura do banco de dados
Empresas (id, nome, logo_url, created_at, updated_at)
Usuarios (id, nome, email, empresa_id, created_at, updated_at)
Campanhas (id, nome, plataforma, empresa_id, ativa, created_at, updated_at)
Metricas (id, campanha_id, data, investido, cliques, leads, ctr, conversao, faturamento)
Criativos (id, campanha_id, titulo, imagem_url, desempenho, ativo)
```

## ⚙️ Configuração do Projeto

### 1. Clonar o repositório
```bash
git clone [url-do-repositorio]
cd painel-trafego-pago
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env.local` baseado no `.env.local.example`:
```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Executar em desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para visualizar a aplicação.

## 📱 Estrutura de Componentes

```
src/
├── app/                    # App Router do Next.js
├── components/
│   ├── auth/              # Componentes de autenticação
│   ├── dashboard/         # Componentes do dashboard
│   ├── layout/            # Layout e navegação
│   └── ui/                # Componentes shadcn/ui
├── lib/                   # Configurações e utilitários
└── hooks/                 # React hooks customizados
```

## 🎯 Casos de Uso

### Para Agências de Marketing
- **Multi-cliente**: Cada empresa tem sua própria conta isolada
- **Transparência**: Clientes visualizam métricas em tempo real
- **Relatórios**: Exportação de dados para apresentações

### Para Empresas
- **Acompanhamento**: Métricas de ROI e performance
- **Campanhas**: Visualização de todas as campanhas ativas
- **Criativos**: Performance de cada material publicitário

## 🔧 Próximos Passos

1. **Configurar Supabase**: Criar tabelas e configurar autenticação
2. **Integração com APIs**: Conectar com Meta Ads e Google Ads
3. **Sistema de Uploads**: Implementar upload de criativos
4. **Relatórios**: Adicionar geração de PDF
5. **Notificações**: Sistema de alertas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através do email: [seu-email@exemplo.com]
