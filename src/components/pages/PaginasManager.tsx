'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Globe, 
  Edit, 
  Trash2, 
  Eye,
  Code,
  Sparkles,
  FileText,
  ExternalLink,
  Copy,
  Download,
  Settings,
  Upload,
  Image as ImageIcon,
  Edit2,
  Check,
  X,
  Palette,
  Type,
  Layout,
  Layers,
  Move,
  RotateCcw,
  Save,
  Paintbrush,
  ImageIcon as BackgroundIcon,
  Link,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

// Função utilitária para classes CSS
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Componente EditableText simplificado
interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'white' | 'gray' | 'purple' | 'gradient';
  editMode?: boolean;
}

function EditableText({
  value,
  onChange,
  className,
  multiline = false,
  size = 'md',
  weight = 'normal',
  color = 'white',
  editMode = false
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      case '4xl': return 'text-4xl';
      default: return 'text-base';
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'white': return 'text-white';
      case 'gray': return 'text-gray-300';
      case 'purple': return 'text-purple-300';
      case 'gradient': return 'bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent';
      default: return 'text-white';
    }
  };

  const baseClasses = cn(
    getSizeClasses(),
    getWeightClasses(),
    getColorClasses(),
    className
  );

  if (!editMode) {
    return <span className={baseClasses}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 w-full">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white resize-none"
            rows={3}
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        )}
        <div className="flex gap-1 mt-1">
          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 p-1 h-8 w-8">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleCancel} variant="outline" className="border-slate-600 p-1 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block w-full">
      <span className={baseClasses}>{value}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 absolute -right-8 top-0 p-1 h-6 w-6 text-slate-400 hover:text-white transition-opacity"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// Componente ImageUpload simplificado
interface ImageUploadProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  onImageChange?: (src: string) => void;
  editMode?: boolean;
  placeholder?: string;
}

function ImageUpload({
  src,
  alt = '',
  width,
  height,
  className,
  onImageChange,
  editMode = false,
  placeholder = 'Clique para fazer upload da imagem'
}: ImageUploadProps) {
  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const inputId = `file-input-${Math.random()}`;

  if (!editMode && src) {
    return (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height}
        className={cn("object-cover", className)} 
      />
    );
  }

  if (!editMode && !src) {
    return (
      <div 
        className={cn(
          "bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">{placeholder}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          src 
            ? "border-slate-600 hover:border-slate-500" 
            : "border-slate-600 hover:border-purple-400 bg-slate-800/50",
          className
        )}
        style={{ width, height }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {src ? (
          <>
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Alterar imagem</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Upload className="h-8 w-8 mb-2 text-slate-400" />
            <p className="text-sm text-slate-400">{placeholder}</p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF até 5MB</p>
          </div>
        )}
      </div>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {src && editMode && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onImageChange?.('');
          }}
          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface PaginaVenda {
  id: string;
  nome: string;
  tipo: 'landing' | 'checkout' | 'thankyou' | 'webinar';
  status: 'rascunho' | 'publicada' | 'pausada';
  url?: string;
  criadaEm: Date;
  ultimaEdicao: Date;
  descricao?: string;
}

export function PaginasManager() {
  const [paginas, setPaginas] = useState<PaginaVenda[]>([
    {
      id: '1',
      nome: 'Página Lídia Cabral - Consultoria',
      tipo: 'landing',
      status: 'publicada',
      url: 'https://lidiacabral.com/consultoria',
      criadaEm: new Date('2024-10-20'),
      ultimaEdicao: new Date('2024-10-27'),
      descricao: 'Página principal da consultoria Lídia Cabral'
    }
  ]);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedPageForLink, setSelectedPageForLink] = useState<PaginaVenda | null>(null);

  const [paginaSelecionada, setPaginaSelecionada] = useState<PaginaVenda | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  const abrirEditor = (pagina: PaginaVenda) => {
    setPaginaSelecionada(pagina);
    setModoEdicao(true);
  };



  const criarNovaPagina = () => {
    const novaPagina: PaginaVenda = {
      id: Date.now().toString(),
      nome: 'Nova Página',
      tipo: 'landing',
      status: 'rascunho',
      criadaEm: new Date(),
      ultimaEdicao: new Date(),
      descricao: 'Nova página criada'
    };

    setPaginas(prev => [novaPagina, ...prev]);
    abrirEditor(novaPagina);
    toast.success(`✨ Nova página criada com sucesso!`);
  };

  const salvarPagina = () => {
    if (!paginaSelecionada) return;
    
    setPaginas(prev => prev.map(p => 
      p.id === paginaSelecionada.id 
        ? { ...paginaSelecionada, ultimaEdicao: new Date() }
        : p
    ));
    
    setModoEdicao(false);
    setPaginaSelecionada(null);
    toast.success('Página salva com sucesso!');
  };

  const gerarLinkPublico = (pagina: PaginaVenda) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://seudominio.com';
    return `${baseUrl}/public/${pagina.id}`;
  };

  const copiarLink = async (pagina: PaginaVenda) => {
    const link = gerarLinkPublico(pagina);
    
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copiado para a área de transferência!');
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copiado para a área de transferência!');
    }
  };

  const publicarPagina = (pagina: PaginaVenda) => {
    setPaginas(prev => prev.map(p => 
      p.id === pagina.id 
        ? { ...p, status: 'publicada' as const, ultimaEdicao: new Date() }
        : p
    ));
    toast.success('Página publicada com sucesso!');
  };

  const despublicarPagina = (pagina: PaginaVenda) => {
    setPaginas(prev => prev.map(p => 
      p.id === pagina.id 
        ? { ...p, status: 'rascunho' as const, ultimaEdicao: new Date() }
        : p
    ));
    toast.success('Página despublicada com sucesso!');
  };

  const abrirLinkExterno = (pagina: PaginaVenda) => {
    const link = gerarLinkPublico(pagina);
    window.open(link, '_blank');
  };

  const obterCorStatus = (status: PaginaVenda['status']) => {
    switch (status) {
      case 'publicada': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rascunho': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'pausada': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const obterIconeTipo = (tipo: PaginaVenda['tipo']) => {
    switch (tipo) {
      case 'landing': return <Globe className="h-4 w-4" />;
      case 'checkout': return <FileText className="h-4 w-4" />;
      case 'thankyou': return <Sparkles className="h-4 w-4" />;
      case 'webinar': return <Globe className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (modoEdicao && paginaSelecionada) {
    return <LidiaCabralEditor pagina={paginaSelecionada} onSalvar={salvarPagina} onCancelar={() => setModoEdicao(false)} />;
  }

  return (
    <div className="space-y-8 p-2">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-3xl" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Páginas de Vendas
              </h1>
              <p className="text-slate-300 text-lg mt-2">
                Gerencie e edite suas páginas de alta conversão
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={criarNovaPagina}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Página
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Páginas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Suas Páginas</h2>
          <Badge variant="outline" className="text-slate-300">
            {paginas.length} páginas
          </Badge>
        </div>

        <div className="space-y-4">
          {paginas.map((pagina) => (
            <Card key={pagina.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50 hover:border-slate-600/50 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {obterIconeTipo(pagina.tipo)}
                      <h3 className="text-lg font-semibold text-white">{pagina.nome}</h3>
                      <Badge className={cn("text-xs", obterCorStatus(pagina.status))}>
                        {pagina.status}
                      </Badge>
                    </div>
                    
                    {pagina.descricao && (
                      <p className="text-slate-400 text-sm mb-3">{pagina.descricao}</p>
                    )}
                    
                    {pagina.url && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{pagina.url}</span>
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-500">
                      Criada: {pagina.criadaEm.toLocaleDateString('pt-BR')} • 
                      Editada: {pagina.ultimaEdicao.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {/* Visualizar */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-slate-400 hover:text-white"
                      onClick={() => {
                        if (pagina.status === 'publicada') {
                          abrirLinkExterno(pagina);
                        } else {
                          toast.error('Página precisa estar publicada para visualizar');
                        }
                      }}
                      title="Visualizar página"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {/* Editar */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-slate-400 hover:text-white"
                      onClick={() => abrirEditor(pagina)}
                      title="Editar página"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Link Público */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-slate-400 hover:text-white"
                      onClick={() => copiarLink(pagina)}
                      title={pagina.status === 'publicada' ? 'Copiar link público' : 'Publicar para gerar link'}
                    >
                      <Link className="h-4 w-4" />
                    </Button>

                    {/* Publicar/Despublicar */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={pagina.status === 'publicada' ? 'text-green-400 hover:text-green-300' : 'text-yellow-400 hover:text-yellow-300'}
                      onClick={() => {
                        if (pagina.status === 'publicada') {
                          despublicarPagina(pagina);
                        } else {
                          publicarPagina(pagina);
                        }
                      }}
                      title={pagina.status === 'publicada' ? 'Despublicar página' : 'Publicar página'}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>

                    {/* Excluir */}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-400 hover:text-red-300"
                      title="Excluir página"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PaginasPage() {
  const [modoEdicao, setModoEdicao] = useState(false);
  const [paginaSelecionada, setPaginaSelecionada] = useState<PaginaVenda | null>(null);

  if (modoEdicao && paginaSelecionada) {
    return (
      <LidiaCabralEditor 
        pagina={paginaSelecionada} 
        onSalvar={() => {
          setModoEdicao(false);
          toast.success('Página salva com sucesso!');
        }} 
        onCancelar={() => setModoEdicao(false)} 
      />
    );
  }

  return <PaginasManager />;
}

// Componente Editor da Página Lídia Cabral
function LidiaCabralEditor({ pagina, onSalvar, onCancelar }: { 
  pagina: PaginaVenda; 
  onSalvar: () => void; 
  onCancelar: () => void; 
}) {
  return (
    <div className="space-y-6 p-2">
      {/* Header do Editor */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 blur-3xl" />
        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Editando: {pagina.nome}</h1>
              <p className="text-slate-300 mt-1">Editor visual da página</p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={onCancelar}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={onSalvar}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                Salvar Página
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview da Página */}
      <LidiaCabralPage />
    </div>
  );
}

// Componente da Página Outsider School com editor visual (estilo Elementor)
function LidiaCabralPage() {
  const [editMode, setEditMode] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [pageContent, setPageContent] = useState({
    // Hero Section
    heroTitle: "Programa de Aceleração",
    heroSubtitle: "para você faturar de 5 a 6 dígitos todos os meses com infoprodutos e mentorias no perpétuo.",
    heroDescription: "Acompanhamento personalizado e individualizado validado por mais de 40 nichos diferentes com uma metodologia que já gerou mais de R$ 100 milhões em vendas.",
    ctaPrincipal: "QUERO FAZER MINHA APLICAÇÃO",
    
    // Social Proof
    socialProofTitle: "Bruno já deu aula em lugares como:",
    socialProofEmpresas: ["ONM", "EDUZZ", "KIWIFY", "ANHANGUERA", "UNIVERSIDADE DE FORTALEZA"],
    
    // Benefícios
    beneficios: [
      "Acompanhamento individual e em grupo durante 12 meses",
      "Plano de Ação de Perpétuo Personalizado", 
      "Scripts e processos prontos para copiar e colar",
      "Direcionamento com Bruno e estrategistas de 7 dígitos no perpétuo"
    ],

    // Depoimentos
    depoimentos: [
      {
        titulo: "Entenda como a Ana implementou os funis de perpétuo e chegou a um faturamento de R$400 mil reais",
        imagem: ""
      },
      {
        titulo: "Descubra como a Milena está vendendo R$ 13 mil todos os meses, sem página de vendas e investindo menos de R$ 60 por dia",
        imagem: ""
      },
      {
        titulo: "Entenda como a Priscila Espinoza faturou R$ 700 mil reais com perpétuo e dobrou seu faturamento",
        imagem: ""
      },
      {
        titulo: "A Carla Basilio, empresária da saúde, faturou mais de R$ 1.000.000 com mentorias (de uma forma leve e automatizada).",
        imagem: ""
      },
      {
        titulo: "Empresária da área de nutrição faturou mais de R$ 450.000,00 somente em 2024 (apenas aplicando os funis perpétuos)",
        imagem: ""
      },
      {
        titulo: "Nathan e Maria iniciaram o Instagram do zero e faturaram R$ 315 mil reais em 4 meses com menos de 1.300 seguidores",
        imagem: ""
      }
    ],

    // Time
    timeItens: [
      "Direcionamento estratégico de Bruno Gomes",
      "Time de Sucesso do Cliente te acompanhando no seu grupo individual",
      "Equipe de estrategistas que já fizeram mais de 7 dígitos no perpétuo"
    ],

    // Professores
    professoresTitle: "Professores convidados do Mastermind Outsider",
    
    // FAQ
    faqTitle: "Tem alguma dúvida?",
    
    // Images
    socialProofLogos: ["", "", "", "", ""], // 5 logos
    professorImages: ["", "", "", "", "", "", "", "", "", ""], // 10 professores

    // Footer CTA
    footerCta: "QUERO PARTICIPAR AGORA"
  });

  // Estado para estilos das seções
  const [sectionStyles, setSectionStyles] = useState({
    hero: {
      backgroundColor: '#0a0a0a',
      backgroundImage: '',
      backgroundGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      textColor: '#ffffff',
      padding: '100px 0',
      useGradient: true,
      useImage: false
    },
    socialProof: {
      backgroundColor: '#1a1a2e',
      backgroundImage: '',
      backgroundGradient: '',
      textColor: '#ffffff',
      padding: '60px 0',
      useGradient: false,
      useImage: false
    },
    benefits: {
      backgroundColor: '#16213e',
      backgroundImage: '',
      backgroundGradient: 'linear-gradient(45deg, #0093E9 0%, #80D0C7 100%)',
      textColor: '#ffffff',
      padding: '80px 0',
      useGradient: true,
      useImage: false
    },
    testimonials: {
      backgroundColor: '#0f3460',
      backgroundImage: '',
      backgroundGradient: '',
      textColor: '#ffffff',
      padding: '80px 0',
      useGradient: false,
      useImage: false
    },
    team: {
      backgroundColor: '#16213e',
      backgroundImage: '',
      backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      padding: '80px 0',
      useGradient: true,
      useImage: false
    },
    professors: {
      backgroundColor: '#1a1a2e',
      backgroundImage: '',
      backgroundGradient: '',
      textColor: '#ffffff',
      padding: '80px 0',
      useGradient: false,
      useImage: false
    },
    faq: {
      backgroundColor: '#0f0f23',
      backgroundImage: '',
      backgroundGradient: 'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
      textColor: '#ffffff',
      padding: '80px 0',
      useGradient: true,
      useImage: false
    },
    footer: {
      backgroundColor: '#667eea',
      backgroundImage: '',
      backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      padding: '80px 0',
      useGradient: true,
      useImage: false
    }
  });

  const updateContent = (key: string, value: string) => {
    setPageContent(prev => ({
      ...prev,
      [key]: value
    } as typeof prev));
  };

  const updateArrayItem = (arrayKey: string, index: number, value: string | { titulo: string; imagem: string }) => {
    setPageContent(prev => {
      const currentArray = (prev as any)[arrayKey];
      return {
        ...prev,
        [arrayKey]: currentArray.map((item: any, i: number) => 
          i === index ? value : item
        )
      } as typeof prev;
    });
  };

  const updateSectionStyle = (section: string, property: string, value: string | boolean) => {
    setSectionStyles(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [property]: value
      }
    }));
  };

  const getSectionStyle = (section: keyof typeof sectionStyles) => {
    const style = sectionStyles[section];
    let background = style.backgroundColor;
    
    if (style.useGradient && style.backgroundGradient) {
      background = style.backgroundGradient;
    } else if (style.useImage && style.backgroundImage) {
      background = `url(${style.backgroundImage})`;
    }

    return {
      background,
      backgroundSize: style.useImage ? 'cover' : undefined,
      backgroundPosition: style.useImage ? 'center' : undefined,
      backgroundRepeat: style.useImage ? 'no-repeat' : undefined,
      color: style.textColor,
      padding: style.padding,
    };
  };

  const selectSection = (sectionId: string) => {
    setSelectedSection(sectionId);
    setSidebarOpen(true);
  };

  // Componente do Painel Lateral (estilo Elementor)
  const ElementorSidebar = () => {
    if (!sidebarOpen || !selectedSection) return null;

    const currentStyle = sectionStyles[selectedSection as keyof typeof sectionStyles];

    return (
      <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-y-auto">
        {/* Header do Painel */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-semibold">Editor de Seção</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo do Painel */}
        <div className="p-4 space-y-6">
          {/* Seção: Fundo */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <BackgroundIcon className="h-4 w-4" />
              Fundo da Seção
            </h4>
            
            {/* Tipo de Fundo */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={!currentStyle.useGradient && !currentStyle.useImage ? "default" : "outline"}
                  onClick={() => {
                    updateSectionStyle(selectedSection, 'useGradient', false);
                    updateSectionStyle(selectedSection, 'useImage', false);
                  }}
                  className="flex-1"
                >
                  Cor
                </Button>
                <Button
                  size="sm"
                  variant={currentStyle.useGradient ? "default" : "outline"}
                  onClick={() => {
                    updateSectionStyle(selectedSection, 'useGradient', true);
                    updateSectionStyle(selectedSection, 'useImage', false);
                  }}
                  className="flex-1"
                >
                  Gradiente
                </Button>
                <Button
                  size="sm"
                  variant={currentStyle.useImage ? "default" : "outline"}
                  onClick={() => {
                    updateSectionStyle(selectedSection, 'useImage', true);
                    updateSectionStyle(selectedSection, 'useGradient', false);
                  }}
                  className="flex-1"
                >
                  Imagem
                </Button>
              </div>

              {/* Cor de Fundo */}
              {!currentStyle.useGradient && !currentStyle.useImage && (
                <div>
                  <label className="text-slate-300 text-sm">Cor de Fundo</label>
                  <Input
                    type="color"
                    value={currentStyle.backgroundColor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSectionStyle(selectedSection, 'backgroundColor', e.target.value)}
                    className="h-10 p-1 bg-slate-800 border-slate-600"
                  />
                </div>
              )}

              {/* Gradiente */}
              {currentStyle.useGradient && (
                <div>
                  <label className="text-slate-300 text-sm">Gradiente</label>
                  <div className="space-y-2">
                    {[
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      'linear-gradient(45deg, #0093E9 0%, #80D0C7 100%)',
                      'linear-gradient(45deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
                      'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
                      'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                    ].map((gradient, index) => (
                      <div
                        key={index}
                        className="h-8 rounded cursor-pointer border-2 border-transparent hover:border-white/50 transition-all"
                        style={{ background: gradient }}
                        onClick={() => updateSectionStyle(selectedSection, 'backgroundGradient', gradient)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upload de Imagem */}
              {currentStyle.useImage && (
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">Imagem de Fundo</label>
                  <ImageUpload
                    src={currentStyle.backgroundImage}
                    alt="Background"
                    width={240}
                    height={120}
                    onImageChange={(src) => updateSectionStyle(selectedSection, 'backgroundImage', src)}
                    editMode={true}
                    placeholder="Clique para enviar imagem de fundo"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Seção: Texto */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Type className="h-4 w-4" />
              Texto
            </h4>
            
            <div>
              <label className="text-slate-300 text-sm">Cor do Texto</label>
              <Input
                type="color"
                value={currentStyle.textColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSectionStyle(selectedSection, 'textColor', e.target.value)}
                className="h-10 p-1 bg-slate-800 border-slate-600"
              />
            </div>
          </div>

          {/* Seção: Layout */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Layout
            </h4>
            
            <div>
              <label className="text-slate-300 text-sm">Padding (ex: 80px 0)</label>
              <Input
                value={currentStyle.padding}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSectionStyle(selectedSection, 'padding', e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
                placeholder="80px 0"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <Button
              onClick={() => {
                setSidebarOpen(false);
                setSelectedSection(null);
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                // Reset to default styles
                const defaultStyle = {
                  backgroundColor: '#0f0f23',
                  backgroundImage: '',
                  backgroundGradient: '',
                  textColor: '#ffffff',
                  padding: '80px 0',
                  useGradient: false,
                  useImage: false
                };
                setSectionStyles(prev => ({
                  ...prev,
                  [selectedSection]: defaultStyle
                }));
              }}
              className="w-full border-slate-600 text-slate-300"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar Seção
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Função para obter largura do viewport baseada no modo
  const getViewportWidth = () => {
    switch (viewportSize) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen relative">
      {/* Container do Viewport */}
      <div 
        className="mx-auto transition-all duration-300"
        style={{ 
          width: editMode ? getViewportWidth() : '100%',
          minHeight: '100vh'
        }}
      >
        {/* Header com logos */}
        <div className="bg-black py-8">
          <div className="max-w-6xl mx-auto px-4 flex justify-center">
            <div className="animate-fadeInUp">
              <img 
                src="https://outsiderschool.com.br/wp-content/uploads/2025/08/logo-chave.svg" 
                alt="Logo Chave" 
                className="h-16 w-auto"
              />
            </div>
          </div>
        </div>
      
      {/* Painel Lateral do Editor */}
      <ElementorSidebar />

      {/* Toolbar de Edição */}
      {editMode && (
        <div className="fixed top-4 left-4 z-40 bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <Layers className="h-4 w-4 text-purple-400" />
            <span className="text-white text-sm font-medium">Editor Visual</span>
            
            {/* Controles de Visualização */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewportSize('mobile')}
                className={cn(
                  "border-slate-600 text-slate-300",
                  viewportSize === 'mobile' && "bg-purple-600 border-purple-600 text-white"
                )}
              >
                📱
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewportSize('tablet')}
                className={cn(
                  "border-slate-600 text-slate-300",
                  viewportSize === 'tablet' && "bg-purple-600 border-purple-600 text-white"
                )}
              >
                📋
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewportSize('desktop')}
                className={cn(
                  "border-slate-600 text-slate-300",
                  viewportSize === 'desktop' && "bg-purple-600 border-purple-600 text-white"
                )}
              >
                🖥️
              </Button>
            </div>

            <Button 
              size="sm"
              onClick={() => {
                setEditMode(false);
                setSidebarOpen(false);
                setSelectedSection(null);
              }}
              className="bg-green-600 hover:bg-green-700 ml-4"
            >
              <Save className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      )}

      {!editMode && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            onClick={() => setEditMode(true)}
            className="bg-blue-600 hover:bg-blue-700 shadow-xl"
          >
            <Paintbrush className="h-4 w-4 mr-2" />
            Editar com Elementor
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <div 
        className={cn(
          "relative min-h-screen flex items-center transition-all duration-300 cursor-pointer",
          "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'hero' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('hero')}
        onClick={() => editMode && selectSection('hero')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Palette className="h-3 w-3 inline mr-1" />
            Hero Section
          </div>
        )}
        
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="space-y-8 animate-fadeInUp">
            {/* Headline Principal */}
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              <div className="mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
                  <EditableText
                    value={pageContent.heroTitle}
                    onChange={(value) => updateContent('heroTitle', value)}
                    size="3xl"
                    weight="bold"
                    multiline
                    editMode={editMode}
                  />
                </span>
              </div>
              <div className="text-white leading-relaxed">
                <EditableText
                  value={pageContent.heroSubtitle}
                  onChange={(value) => updateContent('heroSubtitle', value)}
                  size="3xl"
                  weight="bold"
                  multiline
                  editMode={editMode}
                />
              </div>
            </h1>

            {/* Subtítulo */}
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-300 leading-relaxed">
                <span className="text-gray-400">
                  <EditableText
                    value={pageContent.heroDescription}
                    onChange={(value) => updateContent('heroDescription', value)}
                    size="xl"
                    multiline
                    editMode={editMode}
                  />
                </span>
              </h2>
            </div>

            {/* CTA Principal */}
            <div className="pt-12 animate-fadeInUp">
              {editMode ? (
                <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-lg px-12 py-6 rounded-md font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border border-green-400/30 flex items-center gap-3 cursor-pointer inline-flex">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M12.8859 12.4912C12.7684 12.1384 12.7096 11.9621 12.7126 11.8178C12.7158 11.6661 12.7361 11.5865 12.806 11.4518C12.8724 11.3237 13.0501 11.1584 13.4053 10.8278C14.3864 9.91494 15 8.61247 15 7.16669C15 4.40526 12.7614 2.16669 10 2.16669C7.23858 2.16669 5 4.40526 5 7.16669C5 8.61247 5.61364 9.91494 6.59468 10.8278C6.94993 11.1584 7.12755 11.3237 7.19399 11.4518C7.26386 11.5865 7.28416 11.6661 7.28737 11.8178C7.29043 11.9621 7.23164 12.1384 7.11406 12.4912L5.58499 17.0784C5.38749 17.6709 5.28873 17.9672 5.34795 18.203C5.39978 18.4094 5.52863 18.5882 5.70807 18.7026C5.91305 18.8334 6.22534 18.8334 6.8499 18.8334H13.1501C13.7747 18.8334 14.0869 18.8334 14.2919 18.7026C14.4714 18.5882 14.6002 18.4094 14.6521 18.203C14.7113 17.9672 14.6125 17.6709 14.415 17.0784L12.8859 12.4912Z" fill="white"/>
                  </svg>
                  <EditableText
                    value={pageContent.ctaPrincipal}
                    onChange={(value) => updateContent('ctaPrincipal', value)}
                    editMode={editMode}
                  />
                </div>
              ) : (
                <Button className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-lg px-12 py-6 rounded-md font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border border-green-400/30 flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M12.8859 12.4912C12.7684 12.1384 12.7096 11.9621 12.7126 11.8178C12.7158 11.6661 12.7361 11.5865 12.806 11.4518C12.8724 11.3237 13.0501 11.1584 13.4053 10.8278C14.3864 9.91494 15 8.61247 15 7.16669C15 4.40526 12.7614 2.16669 10 2.16669C7.23858 2.16669 5 4.40526 5 7.16669C5 8.61247 5.61364 9.91494 6.59468 10.8278C6.94993 11.1584 7.12755 11.3237 7.19399 11.4518C7.26386 11.5865 7.28416 11.6661 7.28737 11.8178C7.29043 11.9621 7.23164 12.1384 7.11406 12.4912L5.58499 17.0784C5.38749 17.6709 5.28873 17.9672 5.34795 18.203C5.39978 18.4094 5.52863 18.5882 5.70807 18.7026C5.91305 18.8334 6.22534 18.8334 6.8499 18.8334H13.1501C13.7747 18.8334 14.0869 18.8334 14.2919 18.7026C14.4714 18.5882 14.6002 18.4094 14.6521 18.203C14.7113 17.9672 14.6125 17.6709 14.415 17.0784L12.8859 12.4912Z" fill="white"/>
                  </svg>
                  {pageContent.ctaPrincipal}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof - Logos */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'socialProof' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('socialProof')}
        onClick={() => editMode && selectSection('socialProof')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Globe className="h-3 w-3 inline mr-1" />
            Social Proof
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl lg:text-3xl font-bold text-center mb-12">
            <EditableText
              value={pageContent.socialProofTitle}
              onChange={(value) => updateContent('socialProofTitle', value)}
              size="3xl"
              weight="bold"
              editMode={editMode}
            />
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {(pageContent.socialProofEmpresas || ["SEBRAE", "FIAP", "Universidade Estácio", "RD Station", "Hotmart"]).map((empresa, index) => (
              <div key={index} className="flex justify-center items-center bg-white/10 backdrop-blur-sm rounded-xl p-6 h-20 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <span className="text-white font-bold text-lg text-center">
                  <EditableText
                    value={empresa}
                    onChange={(value) => updateArrayItem('socialProofEmpresas', index, value)}
                    editMode={editMode}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefícios Principais */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'benefits' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('benefits')}
        onClick={() => editMode && selectSection('benefits')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Benefícios
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {pageContent.beneficios.map((beneficio, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur border-white/20 p-8 text-center hover:bg-white/20 transition-all shadow-xl">
                <h4 className="font-bold text-xl leading-tight">
                  <EditableText
                    value={beneficio}
                    onChange={(value) => updateArrayItem('beneficios', index, value)}
                    size="xl"
                    weight="bold"
                    multiline
                    editMode={editMode}
                  />
                </h4>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Depoimentos com Imagens */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'testimonials' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('testimonials')}
        onClick={() => editMode && selectSection('testimonials')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <FileText className="h-3 w-3 inline mr-1" />
            Depoimentos
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <div className="space-y-16">
            {pageContent.depoimentos.map((depoimento, index) => (
              <div key={index} className={cn(
                "flex gap-8 lg:gap-12 items-center",
                index % 2 === 0 ? "flex-col lg:flex-row" : "flex-col lg:flex-row-reverse"
              )}>
                {/* Imagem */}
                <div className="w-full lg:w-1/3">
                  <ImageUpload
                    src={depoimento.imagem}
                    alt={`Depoimento ${index + 1}`}
                    width={400}
                    height={300}
                    className="rounded-xl shadow-2xl"
                    onImageChange={(src) => 
                      updateArrayItem('depoimentos', index, { ...depoimento, imagem: src })
                    }
                    editMode={editMode}
                    placeholder={`Imagem do depoimento ${index + 1}`}
                  />
                </div>

                {/* Texto */}
                <div className="w-full lg:w-2/3">
                  <h4 className="text-2xl lg:text-3xl font-bold leading-tight">
                    <EditableText
                      value={depoimento.titulo}
                      onChange={(value) => 
                        updateArrayItem('depoimentos', index, { ...depoimento, titulo: value })
                      }
                      size="3xl"
                      weight="bold"
                      multiline
                      editMode={editMode}
                    />
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time e Estrategistas */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'team' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('team')}
        onClick={() => editMode && selectSection('team')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Settings className="h-3 w-3 inline mr-1" />
            Time
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {pageContent.timeItens.map((item, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur border-white/20 p-8 text-center hover:bg-white/20 transition-all shadow-xl">
                <h4 className="font-bold text-xl">
                  <EditableText
                    value={item}
                    onChange={(value) => updateArrayItem('timeItens', index, value)}
                    size="xl"
                    weight="bold"
                    multiline
                    editMode={editMode}
                  />
                </h4>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Professores Convidados */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'professors' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('professors')}
        onClick={() => editMode && selectSection('professors')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Eye className="h-3 w-3 inline mr-1" />
            Professores
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl lg:text-4xl font-bold text-center mb-16">
            <EditableText
              value={pageContent.professoresTitle}
              onChange={(value) => updateContent('professoresTitle', value)}
              size="4xl"
              weight="bold"
              editMode={editMode}
            />
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {pageContent.professorImages.map((imagem, index) => (
              <div key={index} className="flex justify-center">
                <ImageUpload
                  src={imagem}
                  alt={`Professor ${index + 1}`}
                  width={160}
                  height={160}
                  className="rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
                  onImageChange={(src) => updateArrayItem('professorImages', index, src)}
                  editMode={editMode}
                  placeholder={`Professor ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'faq' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('faq')}
        onClick={() => editMode && selectSection('faq')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Code className="h-3 w-3 inline mr-1" />
            FAQ
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold mb-8">
            <EditableText
              value={pageContent.faqTitle}
              onChange={(value) => updateContent('faqTitle', value)}
              size="4xl"
              weight="bold"
              editMode={editMode}
            />
          </h3>
          
          <div className="mb-12">
            <ImageUpload
              src=""
              alt="FAQ Image"
              width={300}
              height={300}
              className="mx-auto rounded-full shadow-2xl"
              onImageChange={(src) => updateContent('faqImage', src)}
              editMode={editMode}
              placeholder="Imagem FAQ"
            />
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div 
        className={cn(
          "relative transition-all duration-300 cursor-pointer",
          editMode && "hover:ring-2 hover:ring-purple-400",
          selectedSection === 'footer' && "ring-2 ring-purple-400"
        )}
        style={getSectionStyle('footer')}
        onClick={() => editMode && selectSection('footer')}
      >
        {editMode && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
            <Sparkles className="h-3 w-3 inline mr-1" />
            CTA Final
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-8">
            <Button className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-xl px-16 py-8 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse">
              <EditableText
                value={pageContent.footerCta}
                onChange={(value) => updateContent('footerCta', value)}
                editMode={editMode}
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}