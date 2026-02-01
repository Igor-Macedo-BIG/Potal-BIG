$filePath = "C:\Users\igor_\lasy-apps\Painel Geral - BIG\src\contexts\CampanhaContext.tsx"
$content = Get-Content $filePath -Raw -Encoding UTF8

# 1. Adicionar import do useCliente
$content = $content -replace "(import type { Campanha, MetricasAgregadas } from '@/types/hierarchical';)", "`$1`nimport { useCliente } from './ClienteContext';"

# 2. Adicionar useCliente no início do componente
$content = $content -replace "(export function CampanhaProvider\(\{ children \}: CampanhaProviderProps\) \{)", "`$1`n  const { clienteSelecionado } = useCliente();"

# 3. Modificar o primeiro useEffect para incluir verificação de cliente e filtro
$oldUseEffect1 = @"
  // Carregar campanha ativa do localStorage se existir
  useEffect\(\(\) => \{
    try \{
      if \(typeof window !== 'undefined'\) \{
        const raw = localStorage\.getItem\('campanhaAtivaId'\);
        if \(raw\) \{
          // Buscar campanha por id
          \(async \(\) => \{
            try \{
              const \{ data, error \} = await supabase
                \.from\('campanhas'\)
                \.select\('\*'\)
                \.eq\('id', raw\)
                \.limit\(1\)
                \.maybeSingle\(\);
"@

$newUseEffect1 = @"
  // Carregar campanha ativa do localStorage se existir
  useEffect(() => {
    if (!clienteSelecionado) {
      console.log(' Nenhum cliente selecionado - limpando dados');
      setCampanhaAtiva(null);
      setMetricasCampanha(null);
      setMetricasGerais(null);
      return;
    }

    console.log(' Filtrando por cliente:', clienteSelecionado?.nome);

    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('campanhaAtivaId');
        if (raw) {
          // Buscar campanha por id
          (async () => {
            try {
              const { data, error } = await supabase
                .from('campanhas')
                .select('*')
                .eq('id', raw)
                .eq('cliente_id', clienteSelecionado.id)
                .limit(1)
                .maybeSingle();
"@

$content = $content -replace [regex]::Escape($oldUseEffect1), $newUseEffect1

# 4. Adicionar dependência clienteSelecionado no useEffect
$content = $content -replace "(\s+}\s+catch \(err\) \{\s+// ignore\s+}\s+}\s+}, \[\]\);)", "`$1`n  }, [clienteSelecionado]);"

# Salvar arquivo
Set-Content $filePath $content -Encoding UTF8 -NoNewline
Write-Host " Parte 1 concluída: imports e useEffect atualizados"
