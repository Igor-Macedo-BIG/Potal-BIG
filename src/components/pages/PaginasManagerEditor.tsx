'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Eye, Layers, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface PaginasManagerEditorProps {
  slug: string;
}

export function PaginasManagerEditor({ slug }: PaginasManagerEditorProps) {
  const [editMode, setEditMode] = useState(true);
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

  // Estado dos estilos de tipografia
  const [textStyles, setTextStyles] = useState<Record<string, any>>({
    title: {
      fontFamily: 'Inter',
      fontSize: 56,
      fontWeight: 700,
      color: '#ffffff',
      lineHeight: 1.2,
      letterSpacing: 0,
      textAlign: 'center'
    },
    subtitle: {
      fontFamily: 'Inter',
      fontSize: 32,
      fontWeight: 600,
      color: '#a855f7',
      lineHeight: 1.3,
      letterSpacing: 0,
      textAlign: 'center'
    },
    description: {
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: 400,
      color: '#cbd5e1',
      lineHeight: 1.6,
      letterSpacing: 0,
      textAlign: 'center'
    },
    cta: {
      fontFamily: 'Inter',
      fontSize: 18,
      fontWeight: 700,
      color: '#ffffff',
      lineHeight: 1.4,
      letterSpacing: 0,
      textAlign: 'center'
    }
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

  // Função para atualizar estilos de texto
  const updateTextStyle = (sectionId: string, property: string, value: any) => {
    setTextStyles(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [property]: value
      }
    }));
  };

  // Função para obter estilos CSS dinâmicos
  const getTextStyle = (sectionId: string) => {
    const styles = textStyles[sectionId];
    if (!styles) return {};
    
    return {
      fontFamily: styles.fontFamily,
      fontSize: `${styles.fontSize}px`,
      fontWeight: styles.fontWeight,
      color: styles.color,
      lineHeight: styles.lineHeight,
      letterSpacing: `${styles.letterSpacing}px`,
      textAlign: styles.textAlign as 'left' | 'center' | 'right' | 'justify'
    };
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

  const handleSave = () => {
    toast.success('Página salva com sucesso!');
  };

  // Função utilitária para classes CSS
  function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <div className="bg-slate-950 min-h-screen relative">
      {/* Barra de ferramentas superior */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/paginas">
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Layers className="h-4 w-4 text-purple-400" />
            <span className="text-white text-sm font-medium">Editando: {slug}</span>
            
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
              onClick={() => setEditMode(!editMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {editMode ? 'Visualizar' : 'Editar'}
            </Button>
            <Button 
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Palette className="h-4 w-4 mr-2" />
              Estilos
            </Button>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSave}
            >
              <Save className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar de Edição */}
      {sidebarOpen && (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Type className="h-4 w-4" />
                Tipografia
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                ×
              </Button>
            </div>
            
            {selectedSection && textStyles[selectedSection] ? (
              <div className="space-y-6">
                {/* Edição de Texto */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Texto</label>
                  <textarea
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white min-h-[80px] resize-none"
                    value={
                      selectedSection === 'title' ? pageContent.heroTitle :
                      selectedSection === 'subtitle' ? pageContent.heroSubtitle :
                      selectedSection === 'description' ? pageContent.heroDescription :
                      selectedSection === 'cta' ? pageContent.heroCta :
                      selectedSection === 'faq-title' ? pageContent.faqTitle :
                      selectedSection === 'footer-cta' ? pageContent.footerCta : ''
                    }
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setPageContent(prev => ({
                        ...prev,
                        ...(selectedSection === 'title' && { heroTitle: newValue }),
                        ...(selectedSection === 'subtitle' && { heroSubtitle: newValue }),
                        ...(selectedSection === 'description' && { heroDescription: newValue }),
                        ...(selectedSection === 'cta' && { heroCta: newValue }),
                        ...(selectedSection === 'faq-title' && { faqTitle: newValue }),
                        ...(selectedSection === 'footer-cta' && { footerCta: newValue })
                      }));
                    }}
                  />
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Fonte</label>
                  <select 
                    className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                    value={textStyles[selectedSection]?.fontFamily || 'Inter'}
                    onChange={(e) => updateTextStyle(selectedSection, 'fontFamily', e.target.value)}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Tamanho: {textStyles[selectedSection]?.fontSize || 16}px
                  </label>
                  <input 
                    type="range" 
                    min="12" 
                    max="96" 
                    value={textStyles[selectedSection]?.fontSize || 16}
                    onChange={(e) => updateTextStyle(selectedSection, 'fontSize', parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Font Weight */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Peso da Fonte</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[300, 400, 500, 600, 700, 800].map((weight) => (
                      <Button
                        key={weight}
                        size="sm"
                        variant={textStyles[selectedSection]?.fontWeight === weight ? "default" : "outline"}
                        className="border-slate-600 text-slate-300"
                        onClick={() => updateTextStyle(selectedSection, 'fontWeight', weight)}
                      >
                        {weight}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Cor do Texto</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={textStyles[selectedSection]?.color || '#ffffff'}
                      onChange={(e) => updateTextStyle(selectedSection, 'color', e.target.value)}
                      className="w-12 h-10 bg-slate-800 border border-slate-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textStyles[selectedSection]?.color || '#ffffff'}
                      onChange={(e) => updateTextStyle(selectedSection, 'color', e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Line Height */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Altura da Linha: {textStyles[selectedSection]?.lineHeight || 1.5}
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1"
                    value={textStyles[selectedSection]?.lineHeight || 1.5}
                    onChange={(e) => updateTextStyle(selectedSection, 'lineHeight', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Letter Spacing */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Espaçamento: {textStyles[selectedSection]?.letterSpacing || 0}px
                  </label>
                  <input 
                    type="range" 
                    min="-2" 
                    max="5" 
                    step="0.1"
                    value={textStyles[selectedSection]?.letterSpacing || 0}
                    onChange={(e) => updateTextStyle(selectedSection, 'letterSpacing', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Text Align */}
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Alinhamento</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight },
                      { value: 'justify', icon: AlignJustify }
                    ].map(({ value, icon: Icon }) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={textStyles[selectedSection]?.textAlign === value ? "default" : "outline"}
                        className="border-slate-600 text-slate-300 p-2"
                        onClick={() => updateTextStyle(selectedSection, 'textAlign', value)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 mt-8">
                <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Clique em qualquer texto na página para editá-lo</p>
                <p className="text-xs mt-2 opacity-70">Você poderá alterar fonte, tamanho, cor e mais</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Container do Viewport */}
      <div 
        className="mx-auto transition-all duration-300"
        style={{ 
          width: getViewportWidth(),
          minHeight: '100vh'
        }}
      >
        {/* Header com logo */}
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

        {/* Hero Section */}
        <div 
          className={cn(
            "relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center py-20 transition-all duration-300 cursor-pointer",
            editMode && "hover:ring-2 hover:ring-purple-400",
            selectedSection === 'hero' && "ring-2 ring-purple-400"
          )}
          onClick={() => editMode && selectSection('hero')}
        >
          {editMode && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
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
              <h1 
                className="cursor-text transition-all duration-200"
                style={{
                  ...getTextStyle('title'),
                  ...(selectedSection === 'title' && { outline: '2px solid #a855f7' })
                }}
                onClick={(e: React.MouseEvent) => {
                  if (editMode) {
                    e.stopPropagation();
                    selectSection('title');
                  }
                }}
              >
                {pageContent.heroTitle}
              </h1>
              
              <h2 
                className="cursor-text transition-all duration-200"
                style={{
                  ...getTextStyle('subtitle'),
                  ...(selectedSection === 'subtitle' && { outline: '2px solid #a855f7' })
                }}
                onClick={(e: React.MouseEvent) => {
                  if (editMode) {
                    e.stopPropagation();
                    selectSection('subtitle');
                  }
                }}
              >
                {pageContent.heroSubtitle}
              </h2>
              
              <p 
                className="max-w-3xl mx-auto cursor-text transition-all duration-200"
                style={{
                  ...getTextStyle('description'),
                  ...(selectedSection === 'description' && { outline: '2px solid #a855f7' })
                }}
                onClick={(e: React.MouseEvent) => {
                  if (editMode) {
                    e.stopPropagation();
                    selectSection('description');
                  }
                }}
              >
                {pageContent.heroDescription}
              </p>
              
              <div className="pt-8">
                <button 
                  className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 px-16 py-8 rounded-full transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse cursor-pointer"
                  style={{
                    ...getTextStyle('cta'),
                    ...(selectedSection === 'cta' && { outline: '2px solid #a855f7' })
                  }}
                  onClick={(e: React.MouseEvent) => {
                    if (editMode) {
                      e.stopPropagation();
                      selectSection('cta');
                    }
                  }}
                >
                  {pageContent.heroCta}
                </button>
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
          onClick={() => editMode && selectSection('faq')}
        >
          {editMode && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
              FAQ Section
            </div>
          )}

          <div className="max-w-4xl mx-auto px-4 text-center">
            <h3 
              className="text-4xl font-bold text-white mb-12 animate-fadeInUp cursor-text"
              onClick={(e: React.MouseEvent) => {
                if (editMode) {
                  e.stopPropagation();
                  selectSection('faq-title');
                }
              }}
            >
              {pageContent.faqTitle}
            </h3>
          </div>
        </div>

        {/* CTA Final */}
        <div 
          className={cn(
            "relative transition-all duration-300 cursor-pointer py-20 bg-gradient-to-r from-slate-900 to-purple-900",
            editMode && "hover:ring-2 hover:ring-purple-400",
            selectedSection === 'footer' && "ring-2 ring-purple-400"
          )}
          onClick={() => editMode && selectSection('footer')}
        >
          {editMode && (
            <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
              CTA Final
            </div>
          )}

          <div className="max-w-4xl mx-auto px-4 text-center">
            <Button 
              className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-xl px-16 py-8 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border-2 border-green-400/30 animate-pulse"
              onClick={(e: React.MouseEvent) => {
                if (editMode) {
                  e.stopPropagation();
                  selectSection('footer-cta');
                }
              }}
            >
              {pageContent.footerCta}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}