# Instruções para Corrigir Métricas SDR

## Problema Identificado
Os cards KPI do dashboard SDR estão usando nomes de campos ANTIGOS que não existem mais no banco de dados.

## Campos Antigos vs Novos

### ❌ ANTIGOS (NÃO USAR MAIS):
- `preencheram_diagnostico` 

### ✅ NOVOS (USAR):
- `comecou_diagnostico` - Lead começou preencher diagnóstico
- `chegaram_crm_kommo` - Leads que chegaram ao CRM Kommo
- `qualificados_para_mentoria` - Leads qualificados para Mentoria (mantido)
- `para_downsell` - Leads Para Downsell (mantido)
- `agendados_diagnostico` - Leads agendados para Diagnóstico (mantido)
- `agendados_mentoria` - Leads Agendados para Mentoria (mantido)

## Como Buscar Dados do SDR Corretamente

```typescript
const buscarMetricasSdr = async () => {
  try {
    const { data, error } = await supabase
      .from('metricas')
      .select('detalhe_sdr, periodo_inicio, periodo_fim')
      .not('detalhe_sdr', 'is', null)
      .order('periodo_inicio', { ascending: false })
      .limit(30);

    if (!error && data && data.length > 0) {
      // Agregar os valores
      let totais = {
        comecou_diagnostico: 0,
        chegaram_crm_kommo: 0,
        qualificados_mentoria: 0,
        para_downsell: 0,
        agendados_diagnostico: 0,
        agendados_mentoria: 0,
        nomes_qualificados: [] as string[]
      };

      data.forEach((item: any) => {
        const detalhe = item.detalhe_sdr;
        if (detalhe) {
          // Usar os nomes corretos dos campos JSONB
          totais.comecou_diagnostico += detalhe.comecou_diagnostico || 0;
          totais.chegaram_crm_kommo += detalhe.chegaram_crm_kommo || 0;
          totais.qualificados_mentoria += detalhe.qualificados_para_mentoria || 0;
          totais.para_downsell += detalhe.para_downsell || 0;
          totais.agendados_diagnostico += detalhe.agendados_diagnostico || 0;
          totais.agendados_mentoria += detalhe.agendados_mentoria || 0;
          
          if (detalhe.nomes_qualificados) {
            totais.nomes_qualificados.push(...detalhe.nomes_qualificados.split('\n').filter(Boolean));
          }
        }
      });

      return totais;
    }
  } catch (err) {
    console.error('Erro ao carregar métricas SDR:', err);
  }
  
  return null;
};
```

## Cards KPI que Devem Aparecer

1. **Lead começou preencher diagnóstico** - `comecou_diagnostico`
2. **Leads que chegaram ao CRM Kommo** - `chegaram_crm_kommo`
3. **Leads qualificados para Mentoria** - `qualificados_para_mentoria`
4. **Leads Para Downsell** - `para_downsell`
5. **Agendados para Diagnóstico** - `agendados_diagnostico`
6. **Agendados para Mentoria** - `agendados_mentoria`
7. **Nomes dos Leads Qualificados** - `nomes_qualificados` (campo texto)
8. **Taxa de Conversão** - Calcular: `(qualificados_mentoria / comecou_diagnostico) * 100`

## Exemplo de Atualização de Cards

```typescript
const metricasCards = [
  {
    titulo: 'Lead começou preencher diagnóstico',
    valor: totais.comecou_diagnostico,
    icone: Edit3,
    cor: 'cyan'
  },
  {
    titulo: 'Leads que chegaram ao CRM Kommo',
    valor: totais.chegaram_crm_kommo,
    icone: Users,
    cor: 'blue'
  },
  {
    titulo: 'Leads qualificados para Mentoria',
    valor: totais.qualificados_mentoria,
    icone: UserCheck,
    cor: 'green'
  },
  // ... resto dos cards
];
```

## Onde Procurar no Código

Os cards KPI provavelmente estão em um destes locais:
- Um componente que recebe `department="sdr"` como prop
- Dentro de `DashboardCampanha.tsx` com lógica condicional
- Em um hook customizado como `useDashboard` ou `useMetricasSdr`
- Dentro do `CampanhaContext` que agrega as métricas

Procure por textos como:
- "PREENCHERAM DIAGNÓSTICO"
- "preencheram_diagnostico"
- Cards com valores hardcoded ou vindos de `metricasCampanha`
