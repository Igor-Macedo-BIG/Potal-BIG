# 🧪 Guia de Teste - Dashboard Público

## ✅ Status: Servidor Rodando
- Local: http://localhost:3000
- Network: http://192.168.100.26:3000

## 🎯 Testes para Executar

### 1. Teste do Botão "Copiar Link Público"

**Passos:**
1. Acesse: http://localhost:3000
2. Faça login (se necessário)
3. Selecione "Dr. Leonardo" no dropdown de clientes
4. Observe que apareceu o botão "Link Público" ao lado do seletor
5. Clique no botão "Link Público"
6. Verifique que o ícone mudou para ✓ e texto para "Copiado!"
7. Abra uma nova aba anônima (Ctrl+Shift+N)
8. Cole o link copiado (Ctrl+V) e pressione Enter

**Resultado Esperado:**
- Link deve ser: `http://localhost:3000/public-view/265b7609-5310-4b3b-8806-157eb86a48bd`
- Página pública deve carregar mostrando métricas do Dr. Leonardo
- Identidade visual deve ser a mesma do dashboard (roxo/preto)

### 2. Teste de Troca de Cliente

**Passos:**
1. Volte para a aba do dashboard principal
2. Selecione "Guezzo Imóveis" no dropdown
3. Clique novamente no botão "Link Público"
4. Cole em nova aba anônima

**Resultado Esperado:**
- Link deve mudar para: `http://localhost:3000/public-view/785805f4-44f3-4a5a-96fc-78dab21ac435`
- Página deve mostrar métricas do Guezzo Imóveis
- Dados devem ser diferentes do Dr. Leonardo

### 3. Teste de Cliente Inválido

**Passos:**
1. Acesse manualmente: `http://localhost:3000/public-view/00000000-0000-0000-0000-000000000000`

**Resultado Esperado:**
- Deve redirecionar para página 404
- Não deve exibir erro de sistema

### 4. Validação de Métricas

**Para Dr. Leonardo:**
```
URL: http://localhost:3000/public-view/265b7609-5310-4b3b-8806-157eb86a48bd
```

**Verificar:**
- [ ] Nome "Dr. Leonardo" aparece no cabeçalho
- [ ] Logo do cliente (se configurado)
- [ ] Card de Impressões mostra número total
- [ ] Card de Cliques mostra número e CTR%
- [ ] Card de Conversões mostra total de vendas
- [ ] Card de ROAS mostra multiplicador (ex: 2.5x)
- [ ] Card de Investimento Total mostra valor em R$
- [ ] Card de Receita Total mostra valor em R$
- [ ] Card de Lucro Líquido mostra diferença (verde se positivo, vermelho se negativo)
- [ ] Tabela de Performance mostra últimas campanhas
- [ ] Valores batem com dashboard administrativo

**Para Guezzo Imóveis:**
```
URL: http://localhost:3000/public-view/785805f4-44f3-4a5a-96fc-78dab21ac435
```

**Verificar:**
- [ ] Nome "Guezzo Imóveis" aparece no cabeçalho
- [ ] Métricas diferentes do Dr. Leonardo
- [ ] Apenas campanhas do Guezzo na tabela

### 5. Teste Responsivo

**Mobile (375px):**
1. Abra DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Selecione "iPhone SE" ou similar
4. Navegue pela página

**Verificar:**
- [ ] Cards empilham em 1 coluna
- [ ] Tabela tem scroll horizontal
- [ ] Textos são legíveis
- [ ] Logo do cliente não quebra layout

**Tablet (768px):**
1. Selecione "iPad Mini"

**Verificar:**
- [ ] Cards em 2 colunas
- [ ] Layout confortável

**Desktop (1920px):**
1. Maximize janela

**Verificar:**
- [ ] Cards em 4 colunas (métricas principais)
- [ ] Cards em 3 colunas (financeiras)
- [ ] Conteúdo centralizado (max-width-7xl)

### 6. Teste de Performance

**Passos:**
1. Abra DevTools → Network
2. Recarregue a página pública (F5)
3. Observe a aba Network

**Verificar:**
- [ ] Primeira carga em menos de 2 segundos
- [ ] HTML já vem com conteúdo (SSR funcionando)
- [ ] Sem erros 404 ou 500

### 7. Teste de SEO

**Passos:**
1. View Page Source (Ctrl+U) na página pública
2. Procure por `<title>` no HTML

**Verificar:**
- [ ] Tag `<title>` contém nome do cliente
- [ ] Meta description presente
- [ ] Conteúdo renderizado no HTML (não apenas JavaScript)

## 🐛 Problemas Conhecidos

### Se aparecer erro "Cannot read property 'nome' of null":
- Verifique se o cliente realmente existe no banco
- Execute: `SELECT * FROM clientes WHERE id = 'ID_AQUI'`

### Se métricas estiverem zeradas:
- Verifique se há métricas para o mês atual
- Execute queries do arquivo `TESTE-DASHBOARD-PUBLICO.sql`

### Se botão "Link Público" não aparecer:
- Verifique se um cliente está selecionado
- Abra Console (F12) e veja se há erros

## 📊 Comparação com Dashboard Admin

**Acesse lado a lado:**
- **Admin**: http://localhost:3000 (com autenticação)
- **Público**: http://localhost:3000/public-view/265b7609-5310-4b3b-8806-157eb86a48bd

**Verificar:**
- [ ] Totais de Impressões são iguais
- [ ] Totais de Cliques são iguais
- [ ] ROAS é o mesmo
- [ ] Receita bate

## ✨ Checklist Final

- [ ] Servidor iniciou sem erros
- [ ] Botão "Link Público" aparece ao selecionar cliente
- [ ] Link é copiado para clipboard
- [ ] Página pública carrega com métricas corretas
- [ ] Cliente inválido redireciona para 404
- [ ] Visual idêntico ao dashboard admin
- [ ] Responsivo em mobile/tablet/desktop
- [ ] SSR funcionando (HTML já vem preenchido)
- [ ] Sem erros no console do navegador
- [ ] Dados batem com dashboard administrativo

## 🎉 Se Todos os Testes Passarem

**Parabéns! A implementação está perfeita e pronta para produção!**

### Próximos Passos:
1. Deploy para produção (Vercel/Netlify)
2. Configurar domínio customizado
3. Compartilhar links com clientes
4. Monitorar acessos (opcional: adicionar analytics)

---

**Desenvolvido com 💜 seguindo as melhores práticas**
