# 🚀 Guia: Limpar Dados Mistos e Sincronizar Apenas Campanhas Recentes

Você pediu para puxar apenas campanhas do mês com gasto, começar do zero e limpar dados mistos. Aqui está o passo-a-passo:

---

## ✅ Passo 1: Limpar o Banco de Dados

**Objetivo**: Deletar TODOS os dados de campanhas, métricas, conjuntos e anúncios (dados mistos + API).  
**Mantém**: Estrutura base (empresas, usuários, funis).

### Como executar:

1. **Abra o Supabase SQL Editor**
   - Acesse seu projeto Supabase
   - Vá para: SQL Editor → New Query

2. **Copie o conteúdo** de:
   ```
   scripts/LIMPEZA-dados-mistos.sql
   ```

3. **Cole no editor e execute**
   - Clique em **RUN**
   - Aguarde a conclusão

4. **Verifique o resultado**
   - Deverá mostrar: `campanhas_restantes: 0`, `metricas_restantes: 0`, etc.
   - Funis e usuários devem estar intactos

**⚠️ ATENÇÃO**: Este script é **IRREVERSÍVEL**. Se precisar iterar, é possível restaurar de backup, mas melhor fazer certo na primeira vez.

---

## ✅ Passo 2: Deploy da Aplicação (Novo Código)

O código foi atualizado para:
- ✅ Filtrar apenas campanhas criadas no **mês atual** 
- ✅ Puxar apenas campanhas que tiveram gasto > 0

### Como fazer o deploy:

```bash
# Na raiz do projeto
git add .
git commit -m "feat: filtrar sync por mês e limpar dados mistos"
git push
```

Ou, se usar Vercel/deploy automático, a atualização será deployada automaticamente.

---

## ✅ Passo 3: Executar o Novo Sync

Agora que o banco está limpo:

1. **Abra o painel**: Admin → Meta Ads Integration → Sincronizar
2. **Selecione opções**:
   - Período: "Últimos 30 dias" (ou seu preference)
   - Funil Padrão: "Não vincular automaticamente" (você vinculará depois)
3. **Clique**: Sincronizar Agora
4. **Aguarde**: Deve sincronizar apenas campanhas recentes do mês

---

## ✅ Passo 4: Vincular Campanhas (Bulk)

Após o sync:

1. **Vá para**: Admin → Meta Ads Integration → Campanhas
2. **Na seção "X campanha(s) sem funil"**:
   - Selecione um funil na dropdown
   - Clique: **"Vincular todas (N)"**
3. **Atualizar dashboard**: Abra o dashboard → métricas devem aparecer!

---

## 📊 O que mudou no código

### 1. **Filtro por Data** (`meta-sync.ts`)
```typescript
// Agora apenas empresas criadas NO MÊS ATUAL são sincronizadas
const metaCampaigns = todasCampanhas.filter(campaign => {
  const createdTime = campaign.created_time ? new Date(campaign.created_time) : null;
  return createdTime && createdTime >= getFirstDayOfMonth();
});
```

### 2. **UI Atualizada** (`MetaIntegrationCard.tsx`)
```typescript
// Automaticamente passa o primeiro dia do mês ao sincronizar
const periodoInicio = primeiroDia.toISOString().split('T')[0]; // YYYY-MM-DD
```

### 3. **Suporte a Data Customizada**
Se quiser sincronizar de outro período, pode passar `periodo_inicio` na API:
```bash
curl -X POST http://localhost:3000/api/meta/sync \
  -H "Content-Type: application/json" \
  -d '{"periodo_inicio": "2025-12-01"}'
```

---

## 🎯 Resultado Esperado

Após completar os 4 passos:

✅ Dashboard mostra apenas campanhas do **mês atual**  
✅ Dados estão **limpos e consistentes**  
✅ UI mostra "X campanhas sem funil" mas **dados da API aparecem corretamente**  
✅ Não há **dados dublicados ou misturados**  

---

## ⚠️ Troubleshooting

### "Dashboard ainda vazio depois do sync"
→ Verifique:
1. Campanhas têm `funil_id` preenchido? (vincule com bulk)
2. API retornou campanhas? (confira aba Campanhas → lista)
3. Navegador em cache? (Ctrl+Shift+R para limpar)

### "Sync puxou campanhas antigas/ de meses passados"
→ Primeiro deploy pode ter sido com código antigo. Faça um refresh da página (F5) e execute sync novamente.

### "Erro ao executar limpeza SQL"
→ Verifique se you has permissões no Supabase (usuário não pode ser read-only). Teste com a instrução SELECT inicial do script.

---

## ✨ Próximos Passos Opcionais

1. **Agendar sync automático**: Ir para settings e ativar "Sincronizar automaticamente"
2. **Filtrar por período customizado**: Modificar `periodo_inicio` na chamada da API
3. **Criar alertas**: Se campanha tiver 0 lead, avisar via toast

Tudo certo? Bora testar! 🚀
