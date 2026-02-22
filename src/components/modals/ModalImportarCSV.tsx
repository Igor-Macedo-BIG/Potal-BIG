'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X, AlertTriangle,
  Loader2, ChevronDown, FolderOpen, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { autoDetectarMapeamento, getCamposDisponiveis, LABELS_CAMPOS } from '@/lib/csv-mapping';
import type { MapeamentoCampo, CampoBD } from '@/lib/csv-mapping';
import { processarLinhasCSV, importarCSVParaSupabase } from '@/lib/csv-processor';
import type { LinhaCSVProcessada, ResultadoImportacao } from '@/lib/csv-processor';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDadosAtualizados?: () => void;
}

type Etapa = 'upload' | 'funil' | 'mapeamento' | 'importando' | 'resultado';

export default function ModalImportarCSV({ open, onOpenChange, onDadosAtualizados }: Props) {
  // Estado geral
  const [etapa, setEtapa] = useState<Etapa>('upload');
  const [loading, setLoading] = useState(false);
  
  // Etapa 1 — Upload
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [linhasBrutas, setLinhasBrutas] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  
  // Etapa 2 — Seleção de funil
  const [funis, setFunis] = useState<{ id: string; nome: string }[]>([]);
  const [funilSelecionado, setFunilSelecionado] = useState('');
  
  // Etapa 3 — Mapeamento
  const [mapeamento, setMapeamento] = useState<MapeamentoCampo[]>([]);
  const [filtrarZerados, setFiltrarZerados] = useState(true);
  const [preview, setPreview] = useState<LinhaCSVProcessada[]>([]);
  const [totalZeradas, setTotalZeradas] = useState(0);
  
  // Etapa 4 — Importação
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  
  // Etapa 5 — Resultado
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  
  // Carregar funis
  useEffect(() => {
    if (open) {
      carregarFunis();
    }
  }, [open]);
  
  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setEtapa('upload');
        setArquivo(null);
        setLinhasBrutas([]);
        setHeaders([]);
        setMapeamento([]);
        setFunilSelecionado('');
        setPreview([]);
        setTotalZeradas(0);
        setProgresso(0);
        setResultado(null);
      }, 300);
    }
  }, [open]);
  
  const carregarFunis = async () => {
    try {
      const response = await fetch('/api/funis');
      if (response.ok) {
        const data = await response.json();
        const funisList = (data.funis || []).map((f: any) => ({ id: f.id, nome: f.nome }));
        setFunis(funisList);
        if (funisList.length === 1) setFunilSelecionado(funisList[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
    }
  };
  
  // ======================================
  // Etapa 1 — Upload do arquivo CSV
  // ======================================
  
  const processarArquivo = useCallback((file: File) => {
    setArquivo(file);
    setLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('Avisos do parser CSV:', results.errors);
        }
        
        const dados = results.data as Record<string, string>[];
        
        if (dados.length === 0) {
          toast.error('Arquivo CSV vazio ou com formato inválido');
          setLoading(false);
          return;
        }
        
        const csvHeaders = results.meta.fields || Object.keys(dados[0]);
        setHeaders(csvHeaders);
        setLinhasBrutas(dados);
        
        // Auto-detectar mapeamento
        const mapeamentoDetectado = autoDetectarMapeamento(csvHeaders);
        setMapeamento(mapeamentoDetectado);
        
        toast.success(`${dados.length} linhas carregadas com sucesso`);
        setLoading(false);
        setEtapa('funil');
      },
      error: (error) => {
        toast.error(`Erro ao ler CSV: ${error.message}`);
        setLoading(false);
      },
    });
  }, []);
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      processarArquivo(file);
    } else {
      toast.error('Por favor, envie um arquivo .csv');
    }
  };
  
  // ======================================
  // Etapa 3 — Mapeamento
  // ======================================
  
  const atualizarMapeamento = (index: number, novoCampo: CampoBD) => {
    setMapeamento(prev => {
      const novo = [...prev];
      novo[index] = { ...novo[index], campoBD: novoCampo, label: LABELS_CAMPOS[novoCampo] };
      return novo;
    });
  };
  
  // Recalcular preview quando mapeamento ou filtro mudar
  useEffect(() => {
    if (linhasBrutas.length > 0 && mapeamento.length > 0 && etapa === 'mapeamento') {
      const { linhasComDados, linhasZeradas } = processarLinhasCSV(linhasBrutas, mapeamento, filtrarZerados);
      setPreview(linhasComDados.slice(0, 10));
      setTotalZeradas(linhasZeradas);
    }
  }, [mapeamento, filtrarZerados, linhasBrutas, etapa]);
  
  // ======================================
  // Etapa 4 — Importar
  // ======================================
  
  const executarImportacao = async () => {
    setEtapa('importando');
    setProgresso(0);
    
    const { linhasComDados } = processarLinhasCSV(linhasBrutas, mapeamento, filtrarZerados);
    
    const resultado = await importarCSVParaSupabase(
      linhasComDados,
      funilSelecionado,
      (msg, prog) => {
        setMensagemProgresso(msg);
        setProgresso(prog);
      }
    );
    
    resultado.linhasZeradas = totalZeradas;
    setResultado(resultado);
    setEtapa('resultado');
    
    if (resultado.erros.length === 0) {
      toast.success(`Importação concluída! ${resultado.metricasInseridas + resultado.metricasAtualizadas} métricas processadas.`);
    } else {
      toast.warning(`Importação com ${resultado.erros.length} erro(s). Verifique o resumo.`);
    }
  };
  
  // ======================================
  // Checagens
  // ======================================
  
  const temCampoNomeCampanha = mapeamento.some(m => m.campoBD === 'nome_campanha');
  const temCampoPeriodoInicio = mapeamento.some(m => m.campoBD === 'periodo_inicio');
  const temCampoPeriodoFim = mapeamento.some(m => m.campoBD === 'periodo_fim');
  const temAlgumCampoMetrica = mapeamento.some(m => 
    !['ignorar', 'nome_campanha', 'periodo_inicio', 'periodo_fim', 'frequencia'].includes(m.campoBD)
  );
  const mapeamentoValido = temCampoNomeCampanha && temCampoPeriodoInicio && temCampoPeriodoFim && temAlgumCampoMetrica;
  
  const { linhasComDados: linhasParaImportar } = linhasBrutas.length > 0 && mapeamento.length > 0
    ? processarLinhasCSV(linhasBrutas, mapeamento, filtrarZerados)
    : { linhasComDados: [] };
  
  const nomesCampanhasUnicos = [...new Set(linhasParaImportar.map(l => l.nome_campanha))];
  
  // ======================================
  // Render
  // ======================================
  
  return (
    <Dialog open={open} onOpenChange={etapa === 'importando' ? undefined : onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0f1e] border border-cyan-900/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
            Importar CSV — Meta Ads
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {etapa === 'upload' && 'Envie o arquivo CSV exportado do Meta Ads'}
            {etapa === 'funil' && 'Selecione o funil de destino para as campanhas'}
            {etapa === 'mapeamento' && 'Confirme o mapeamento das colunas e visualize os dados'}
            {etapa === 'importando' && 'Importando dados...'}
            {etapa === 'resultado' && 'Resumo da importação'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-2 py-2">
          {(['upload', 'funil', 'mapeamento', 'resultado'] as const).map((e, i) => {
            const labels = ['Upload', 'Funil', 'Mapear', 'Resultado'];
            const isActive = etapa === e || (etapa === 'importando' && e === 'resultado');
            const isPast = ['upload', 'funil', 'mapeamento', 'resultado'].indexOf(etapa === 'importando' ? 'resultado' : etapa) > i;
            
            return (
              <div key={e} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isPast ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                  'bg-gray-800/50 text-gray-500 border border-gray-700/30'
                }`}>
                  {isPast ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
                  {labels[i]}
                </div>
                {i < 3 && <ArrowRight className="h-3 w-3 text-gray-600" />}
              </div>
            );
          })}
        </div>
        
        <Separator className="bg-cyan-900/20" />
        
        {/* ============================== */}
        {/* ETAPA 1 — UPLOAD               */}
        {/* ============================== */}
        {etapa === 'upload' && (
          <div className="space-y-4 py-4">
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                dragOver ? 'border-cyan-400 bg-cyan-400/5' : 'border-gray-700 hover:border-cyan-600 hover:bg-cyan-900/5'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-file-input')?.click()}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
                  <p className="text-gray-300">Lendo arquivo...</p>
                </div>
              ) : arquivo ? (
                <div className="flex flex-col items-center gap-3">
                  <FileSpreadsheet className="h-12 w-12 text-green-400" />
                  <p className="text-green-400 font-medium">{arquivo.name}</p>
                  <p className="text-sm text-gray-400">{linhasBrutas.length} linhas · {headers.length} colunas</p>
                  <p className="text-xs text-gray-500">Clique para trocar o arquivo</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-gray-500" />
                  <p className="text-gray-300 font-medium">Arraste o arquivo CSV aqui</p>
                  <p className="text-sm text-gray-500">ou clique para selecionar</p>
                  <p className="text-xs text-gray-600 mt-2">Suporta exportações do Meta Ads, Google Ads e outros</p>
                </div>
              )}
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>
        )}
        
        {/* ============================== */}
        {/* ETAPA 2 — SELEÇÃO DE FUNIL     */}
        {/* ============================== */}
        {etapa === 'funil' && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Funil de destino</Label>
              <p className="text-xs text-gray-500">
                As campanhas encontradas no CSV serão vinculadas a este funil. 
                Campanhas que ainda não existem serão criadas automaticamente.
              </p>
              <select
                value={funilSelecionado}
                onChange={(e) => setFunilSelecionado(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-900/80 border border-gray-700 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                <option value="">Selecione um funil...</option>
                {funis.map((f) => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
            </div>
            
            {funilSelecionado && (
              <div className="bg-cyan-900/10 border border-cyan-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-300">
                  <strong className="text-cyan-400">{linhasBrutas.length}</strong> linhas no CSV serão processadas 
                  e vinculadas ao funil selecionado.
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* ============================== */}
        {/* ETAPA 3 — MAPEAMENTO           */}
        {/* ============================== */}
        {etapa === 'mapeamento' && (
          <div className="space-y-4 py-2">
            {/* Tabela de mapeamento */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Mapeamento de Colunas</Label>
              <p className="text-xs text-gray-500">
                Verifique se as colunas foram detectadas corretamente. Ajuste clicando no dropdown.
              </p>
              <div className="max-h-[250px] overflow-y-auto border border-gray-800 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/80 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-gray-400 font-medium">Coluna do CSV</th>
                      <th className="text-left p-2 text-gray-400 font-medium">Mapear para →</th>
                      <th className="text-center p-2 text-gray-400 font-medium w-16">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapeamento.map((m, i) => (
                      <tr key={i} className="border-t border-gray-800/50 hover:bg-gray-900/30">
                        <td className="p-2">
                          <span className="text-gray-300 text-xs truncate block max-w-[200px]" title={m.csvHeader}>
                            {m.csvHeader}
                          </span>
                        </td>
                        <td className="p-2">
                          <select
                            value={m.campoBD}
                            onChange={(e) => atualizarMapeamento(i, e.target.value as CampoBD)}
                            className={`w-full px-2 py-1 rounded text-xs border transition-colors ${
                              m.campoBD !== 'ignorar'
                                ? 'bg-cyan-900/20 border-cyan-800/40 text-cyan-300'
                                : 'bg-gray-900/50 border-gray-700/40 text-gray-500'
                            }`}
                          >
                            {getCamposDisponiveis().map((campo) => (
                              <option key={campo.value} value={campo.value}>{campo.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          {m.campoBD !== 'ignorar' ? (
                            <Check className="h-4 w-4 text-green-400 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-gray-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Validação */}
            {!mapeamentoValido && (
              <div className="bg-amber-900/10 border border-amber-700/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300 space-y-1">
                  {!temCampoNomeCampanha && <p>• Mapeie uma coluna para &quot;Nome da Campanha&quot;</p>}
                  {!temCampoPeriodoInicio && <p>• Mapeie uma coluna para &quot;Data Início&quot;</p>}
                  {!temCampoPeriodoFim && <p>• Mapeie uma coluna para &quot;Data Fim&quot;</p>}
                  {!temAlgumCampoMetrica && <p>• Mapeie pelo menos uma coluna de métricas (Investimento, Alcance, etc.)</p>}
                </div>
              </div>
            )}
            
            {/* Toggle zerados + resumo */}
            <div className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtrarZerados}
                  onChange={(e) => setFiltrarZerados(e.target.checked)}
                  className="rounded border-gray-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-300">Filtrar campanhas com todas métricas zeradas</span>
              </label>
              <span className="text-xs text-gray-500">
                {totalZeradas} zeradas · {linhasParaImportar.length} com dados
              </span>
            </div>
            
            {/* Resumo antes de importar */}
            {mapeamentoValido && linhasParaImportar.length > 0 && (
              <div className="bg-cyan-900/10 border border-cyan-900/20 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-cyan-400">Resumo da importação:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                  <span>Campanhas encontradas:</span>
                  <span className="text-white font-medium">{nomesCampanhasUnicos.length}</span>
                  <span>Linhas com dados:</span>
                  <span className="text-white font-medium">{linhasParaImportar.length}</span>
                  <span>Linhas zeradas (filtradas):</span>
                  <span className="text-white font-medium">{totalZeradas}</span>
                  <span>Período:</span>
                  <span className="text-white font-medium">
                    {linhasParaImportar[0]?.periodo_inicio} → {linhasParaImportar[0]?.periodo_fim}
                  </span>
                </div>
              </div>
            )}
            
            {/* Preview dos dados */}
            {preview.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Preview (primeiras {Math.min(10, preview.length)} linhas)</Label>
                <div className="max-h-[180px] overflow-auto border border-gray-800 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-900/80 sticky top-0">
                      <tr>
                        <th className="p-1.5 text-left text-gray-400">Campanha</th>
                        <th className="p-1.5 text-right text-gray-400">Invest.</th>
                        <th className="p-1.5 text-right text-gray-400">Alcance</th>
                        <th className="p-1.5 text-right text-gray-400">Cliques</th>
                        <th className="p-1.5 text-right text-gray-400">Leads</th>
                        <th className="p-1.5 text-right text-gray-400">Vendas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((linha, i) => (
                        <tr key={i} className="border-t border-gray-800/50">
                          <td className="p-1.5 text-gray-300 truncate max-w-[200px]" title={linha.nome_campanha}>
                            {linha.nome_campanha.length > 40 
                              ? linha.nome_campanha.substring(0, 40) + '...' 
                              : linha.nome_campanha}
                          </td>
                          <td className="p-1.5 text-right text-green-400">
                            {linha.investimento > 0 ? `R$ ${linha.investimento.toFixed(2)}` : '—'}
                          </td>
                          <td className="p-1.5 text-right text-gray-300">
                            {linha.alcance > 0 ? linha.alcance.toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="p-1.5 text-right text-gray-300">
                            {linha.cliques > 0 ? linha.cliques.toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="p-1.5 text-right text-cyan-400">
                            {linha.leads > 0 ? linha.leads : '—'}
                          </td>
                          <td className="p-1.5 text-right text-purple-400">
                            {linha.vendas > 0 ? linha.vendas : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* ============================== */}
        {/* ETAPA 4 — IMPORTANDO           */}
        {/* ============================== */}
        {etapa === 'importando' && (
          <div className="py-12 flex flex-col items-center gap-6">
            <Loader2 className="h-16 w-16 text-cyan-400 animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-white">{mensagemProgresso}</p>
              <div className="w-64 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progresso}%` }}
                />
              </div>
              <p className="text-sm text-gray-400">{progresso}%</p>
            </div>
          </div>
        )}
        
        {/* ============================== */}
        {/* ETAPA 5 — RESULTADO            */}
        {/* ============================== */}
        {etapa === 'resultado' && resultado && (
          <div className="space-y-4 py-4">
            {/* Resumo visual */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{resultado.metricasInseridas}</p>
                <p className="text-xs text-gray-400">Métricas criadas</p>
              </div>
              <div className="bg-cyan-900/10 border border-cyan-800/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-cyan-400">{resultado.metricasAtualizadas}</p>
                <p className="text-xs text-gray-400">Métricas atualizadas</p>
              </div>
              <div className="bg-purple-900/10 border border-purple-800/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">{resultado.campanhasNovas}</p>
                <p className="text-xs text-gray-400">Campanhas criadas</p>
              </div>
              <div className="bg-gray-900/30 border border-gray-700/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-400">{resultado.linhasZeradas}</p>
                <p className="text-xs text-gray-500">Linhas zeradas filtradas</p>
              </div>
            </div>
            
            {/* Erros, se houver */}
            {resultado.erros.length > 0 && (
              <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <p className="text-sm font-medium text-red-400">
                    {resultado.erros.length} erro(s) durante a importação:
                  </p>
                </div>
                <div className="max-h-[120px] overflow-y-auto space-y-1">
                  {resultado.erros.map((err, i) => (
                    <p key={i} className="text-xs text-red-300/80">• {err}</p>
                  ))}
                </div>
              </div>
            )}
            
            {resultado.erros.length === 0 && (
              <div className="bg-green-900/10 border border-green-800/30 rounded-lg p-4 text-center">
                <Check className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-medium">Importação concluída com sucesso!</p>
                <p className="text-xs text-gray-400 mt-1">
                  Os dados já estão disponíveis no dashboard.
                </p>
              </div>
            )}
          </div>
        )}
        
        <Separator className="bg-cyan-900/20" />
        
        {/* ============================== */}
        {/* Botões de navegação             */}
        {/* ============================== */}
        <DialogFooter className="flex justify-between sm:justify-between">
          {/* Botão Voltar */}
          <div>
            {etapa === 'funil' && (
              <Button variant="ghost" onClick={() => setEtapa('upload')} className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {etapa === 'mapeamento' && (
              <Button variant="ghost" onClick={() => setEtapa('funil')} className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {etapa === 'resultado' && (
              <Button variant="ghost" onClick={() => { setEtapa('upload'); setArquivo(null); }} className="text-gray-400 hover:text-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Importar outro
              </Button>
            )}
          </div>
          
          {/* Botão Avançar / Importar / Fechar */}
          <div className="flex gap-2">
            {etapa !== 'importando' && etapa !== 'resultado' && (
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
                Cancelar
              </Button>
            )}
            
            {etapa === 'upload' && arquivo && linhasBrutas.length > 0 && (
              <Button
                onClick={() => setEtapa('funil')}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600"
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {etapa === 'funil' && (
              <Button
                onClick={() => setEtapa('mapeamento')}
                disabled={!funilSelecionado}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600 disabled:opacity-40"
              >
                Avançar
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {etapa === 'mapeamento' && (
              <Button
                onClick={executarImportacao}
                disabled={!mapeamentoValido || linhasParaImportar.length === 0}
                className="bg-gradient-to-r from-green-500 to-cyan-500 text-white hover:from-green-600 hover:to-cyan-600 disabled:opacity-40"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar {linhasParaImportar.length} linha(s)
              </Button>
            )}
            
            {etapa === 'resultado' && (
              <Button
                onClick={() => {
                  onDadosAtualizados?.();
                  onOpenChange(false);
                }}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-600 hover:to-purple-600"
              >
                <Check className="h-4 w-4 mr-2" />
                Fechar e atualizar dashboard
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
