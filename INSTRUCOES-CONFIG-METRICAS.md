# Instruções para Adicionar Configuração de Métricas

## 1. Execute o SQL no Supabase
Execute o arquivo: `ADICIONAR-CONFIG-METRICAS.sql`

## 2. Atualize o tipo Cliente no ClienteContext.tsx

Adicione o campo `metricas_visiveis`:

```typescript
interface Cliente {
  id: string;
  nome: string;
  slug?: string;
  logo_url?: string;
  email?: string;
  telefone?: string;
  empresa_id: string;
  metricas_visiveis?: {
    investimento?: boolean;
    faturamento?: boolean;
    roas?: boolean;
    leads?: boolean;
    vendas?: boolean;
    custo_por_lead?: boolean;
    alcance?: boolean;
    cliques?: boolean;
    impressoes?: boolean;
    visualizacoes?: boolean;
    checkouts?: boolean;
  };
}
```

## 3. No admin/page.tsx - Modal de Editar Cliente

### 3.1 Importe o componente:
```typescript
import { MetricasConfigurator } from '@/components/admin/MetricasConfigurator';
```

### 3.2 No estado do clienteEditando, adicione:
```typescript
const [clienteEditando, setClienteEditando] = useState<{
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  metricas_visiveis?: any; // ADICIONAR
} | null>(null);
```

### 3.3 Adicione o MetricasConfigurator no modal, APÓS os campos de telefone:

```tsx
{/* Configuração de Métricas Visíveis */}
<div className="col-span-2">
  <MetricasConfigurator
    value={clienteEditando.metricas_visiveis || {
      investimento: true,
      faturamento: true,
      roas: true,
      leads: true,
      vendas: true,
      custo_por_lead: true,
      alcance: true,
      cliques: true,
      impressoes: true,
      visualizacoes: true,
      checkouts: true,
    }}
    onChange={(config) => 
      setClienteEditando({ ...clienteEditando, metricas_visiveis: config })
    }
  />
</div>
```

### 3.4 Atualize a função handleAtualizarCliente para salvar metricas_visiveis:

```typescript
const { error } = await supabase
  .from('clientes')
  .update({
    nome: clienteEditando.nome,
    email: clienteEditando.email || null,
    telefone: clienteEditando.telefone || null,
    metricas_visiveis: clienteEditando.metricas_visiveis, // ADICIONAR
  })
  .eq('id', clienteEditando.id);
```

## 4. Filtrar métricas no Dashboard Público

Isso será implementado na próxima etapa - criar wrapper que lê a configuração e 
esconde cards/métricas não selecionadas.

---

**Status:** Pronto para integrar! Execute o SQL e me confirme para continuar.
