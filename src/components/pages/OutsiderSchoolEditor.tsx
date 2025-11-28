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
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  editMode: boolean;
}

function EditableText({ 
  value, 
  onChange, 
  className = '', 
  size = 'base', 
  weight = 'normal',
  editMode 
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
    toast.success('Texto atualizado!');
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (!editMode) {
    return (
      <span className={cn(sizeClasses[size], weightClasses[weight], className)}>
        {value}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 w-full">
        {size === '4xl' || size === '5xl' || size === '6xl' ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={cn('flex-1 min-h-[60px] bg-slate-800 border-slate-600 text-white', className)}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={cn('flex-1 bg-slate-800 border-slate-600 text-white', className)}
            autoFocus
          />
        )}
        <div className="flex gap-1 mt-1">
          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Check className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel} className="border-slate-600">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block w-full">
      <span 
        className={cn(sizeClasses[size], weightClasses[weight], className, 'cursor-pointer hover:bg-purple-500/10 px-2 py-1 rounded transition-colors')}
        onClick={() => setIsEditing(true)}
      >
        {value}
      </span>
    </div>
  );
}

// Componente ImageUpload simplificado
interface ImageUploadProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  onImageChange: (src: string) => void;
  editMode: boolean;
  placeholder?: string;
}

function ImageUpload({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  onImageChange, 
  editMode,
  placeholder = 'Clique para adicionar imagem'
}: ImageUploadProps) {
  const handleImageUpload = () => {
    // Simulação de upload de imagem
    const newImageUrl = prompt('Cole a URL da nova imagem:');
    if (newImageUrl) {
      onImageChange(newImageUrl);
      toast.success('Imagem atualizada!');
    }
  };

  if (!src && !editMode) {
    return null;
  }

  if (!src && editMode) {
    return (
      <div 
        className={cn(
          'border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition-colors',
          className
        )}
        style={{ width, height }}
        onClick={handleImageUpload}
      >
        <div className="text-center p-4">
          <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">{placeholder}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        className={cn('overflow-hidden', className)}
        style={{ width, height }}
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
        {editMode && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <div className="text-white text-center">
              <Edit className="h-6 w-6 mx-auto mb-1" />
              <p className="text-xs">Alterar Imagem</p>
            </div>
          </div>
        )}
      </div>
      
      {editMode && (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
          <p className="text-slate-400 text-xs">{placeholder}</p>
        </div>
      )}
    </div>
  );
}

// Componente da Página Outsider School com editor visual
export function OutsiderSchoolEditorPage() {
  const [editMode, setEditMode] = useState(true); // Sempre em modo de edição
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Estado do conteúdo da página
  const [pageContent, setPageContent] = useState({
    heroTitle: 'Programa de Aceleração',
    heroSubtitle: 'Para Profissionais de Ecommerce',
    heroDescription: 'O único método que vai te ajudar a conseguir as melhores oportunidades no mercado digital, mesmo que você não tenha experiência ou seja iniciante.',
    heroCta: 'QUERO PARTICIPAR DO PROGRAMA',
    benefitsTitle: 'O que você vai aprender',
    footerCta: 'GARANTIR MINHA VAGA AGORA',
    faqTitle: 'Perguntas Frequentes',
    faqImage: ''
  });

  // Função para atualizar conteúdo
  const updateContent = (key: keyof typeof pageContent, value: string) => {
    setPageContent(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Função para selecionar seção
  const selectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
    setSidebarOpen(true);
  };

  // Função para obter estilos da seção
  const getSectionStyle = (sectionId: string) => {
    return selectedSection === sectionId ? {
      outline: '2px solid #9333ea',
      outlineOffset: '4px'
    } : {};
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
      {/* Barra de ferramentas superior */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      {/* Container do Viewport */}
      <div 
        className="mx-auto transition-all duration-300"
        style={{ 
          width: getViewportWidth(),
          minHeight: '100vh'
        }}
      >
        {/* Header com logos */}
        <div className="bg-black py-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col items-center space-y-4">
            <div className="animate-fadeInUp">
              <img 
                src="https://outsiderschool.com.br/wp-content/uploads/2025/08/logo-chave.svg" 
                alt="Logo Chave" 
                className="h-12 w-auto"
              />
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <img 
                src="https://outsiderschool.com.br/wp-content/uploads/2025/08/logo-comprido-400x61.png" 
                alt="Outsider School" 
                className="h-8 w-auto"
              />
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div 
          className={cn(
            "relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center py-20 transition-all duration-300 cursor-pointer",
            editMode && "hover:ring-2 hover:ring-purple-400",
            selectedSection === 'hero' && "ring-2 ring-purple-400"
          )}
          style={getSectionStyle('hero')}
          onClick={() => editMode && selectSection('hero')}
        >
          {editMode && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Hero Section
            </div>
          )}

          {/* Background decorativo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <div className="space-y-8 animate-fadeInUp">
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
                <EditableText
                  value={pageContent.heroTitle}
                  onChange={(value) => updateContent('heroTitle', value)}
                  size="6xl"
                  weight="bold"
                  editMode={editMode}
                />
              </h1>
              
              <h2 className="text-3xl md:text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                <EditableText
                  value={pageContent.heroSubtitle}
                  onChange={(value) => updateContent('heroSubtitle', value)}
                  size="4xl"
                  weight="semibold"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                  editMode={editMode}
                />
              </h2>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                <EditableText
                  value={pageContent.heroDescription}
                  onChange={(value) => updateContent('heroDescription', value)}
                  size="xl"
                  editMode={editMode}
                />
              </p>
              
              <div className="pt-8">
                {editMode ? (
                  <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white text-xl px-16 py-8 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse flex items-center justify-center max-w-md mx-auto">
                    <EditableText
                      value={pageContent.heroCta}
                      onChange={(value) => updateContent('heroCta', value)}
                      editMode={editMode}
                    />
                  </div>
                ) : (
                  <Button className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-xl px-16 py-8 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse">
                    {pageContent.heroCta}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div 
          className={cn(
            "py-20 bg-slate-900 transition-all duration-300 cursor-pointer",
            editMode && "hover:ring-2 hover:ring-purple-400",
            selectedSection === 'faq' && "ring-2 ring-purple-400"
          )}
          style={getSectionStyle('faq')}
          onClick={() => editMode && selectSection('faq')}
        >
          {editMode && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
              <Sparkles className="h-3 w-3 inline mr-1" />
              FAQ Section
            </div>
          )}

          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 className="text-4xl font-bold text-white mb-12 animate-fadeInUp">
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
            "relative transition-all duration-300 cursor-pointer py-20 bg-gradient-to-r from-slate-900 to-purple-900",
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
              {editMode ? (
                <div className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white text-xl px-16 py-8 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse flex items-center justify-center max-w-md mx-auto">
                  <EditableText
                    value={pageContent.footerCta}
                    onChange={(value) => updateContent('footerCta', value)}
                    editMode={editMode}
                  />
                </div>
              ) : (
                <Button className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-xl px-16 py-8 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse">
                  {pageContent.footerCta}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}