'use client';

import { useState, useEffect } from 'react';

interface PublicPageData {
  id: string;
  nome: string;
  conteudo: any;
  estilos: any;
  status: 'publicada' | 'rascunho' | 'pausada';
}

interface PaginasManagerPublicProps {
  pageId: string;
}

export function PaginasManagerPublic({ pageId }: PaginasManagerPublicProps) {
  const [pageData, setPageData] = useState<PublicPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simular busca da página no banco de dados
    const loadPageData = async () => {
      try {
        setLoading(true);
        
        // Por enquanto, vamos usar dados mockados
        // Em produção, aqui faria uma chamada para a API
        const mockData: PublicPageData = {
          id: pageId,
          nome: 'Outsider School - Bruno Gomes',
          status: 'publicada',
          conteudo: {
            heroTitle: "Programa de Aceleração",
            heroSubtitle: "para você faturar de 5 a 6 dígitos todos os meses com infoprodutos e mentorias no perpétuo.",
            heroDescription: "Acompanhamento personalizado e individualizado validado por mais de 40 nichos diferentes com uma metodologia que já gerou mais de R$ 100 milhões em vendas.",
            ctaPrincipal: "QUERO FAZER MINHA APLICAÇÃO",
            socialProofTitle: "Bruno já deu aula em lugares como:",
            beneficios: [
              "Acompanhamento individual e em grupo durante 12 meses",
              "Plano de Ação de Perpétuo Personalizado", 
              "Scripts e processos prontos para copiar e colar",
              "Direcionamento com Bruno e estrategistas de 7 dígitos no perpétuo"
            ],
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
            timeItens: [
              "Direcionamento estratégico de Bruno Gomes",
              "Time de Sucesso do Cliente te acompanhando no seu grupo individual",
              "Equipe de estrategistas que já fizeram mais de 7 dígitos no perpétuo"
            ],
            professoresTitle: "Professores convidados do Mastermind Outsider",
            faqTitle: "Tem alguma dúvida?",
            socialProofLogos: ["", "", "", "", ""],
            professorImages: ["", "", "", "", "", "", "", "", "", ""],
            footerCta: "QUERO FAZER MINHA APLICAÇÃO"
          },
          estilos: {
            hero: {
              backgroundColor: '#0f0f23',
              backgroundImage: '',
              backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              textColor: '#ffffff',
              padding: '80px 0',
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
          }
        };

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (mockData.status !== 'publicada') {
          throw new Error('Página não está publicada');
        }

        setPageData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar página');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [pageId]);

  const getSectionStyle = (section: string) => {
    if (!pageData || !pageData.estilos) return {};
    
    const style = pageData.estilos[section as keyof typeof pageData.estilos];
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando página...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
          <p className="text-slate-400 mb-6">
            {error || 'A página que você está procurando não existe ou não está publicada.'}
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  const { conteudo } = pageData;

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Header com logo */}
      <div className="bg-black py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center">
          <div className="animate-fadeInUp">
            <img 
              src="https://outsiderschool.com.br/wp-content/uploads/2025/08/logo-chave.svg" 
              alt="Logo Chave" 
              className="h-12 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div 
        className="relative min-h-screen flex items-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
        style={getSectionStyle('hero')}
      >
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="space-y-8 animate-fadeInUp">
            {/* Headline Principal */}
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              <div className="mb-4">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
                  {conteudo.heroTitle}
                </span>
              </div>
              <div className="text-white leading-relaxed">
                {conteudo.heroSubtitle}
              </div>
            </h1>

            {/* Descrição */}
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-300 leading-relaxed">
                <span className="text-gray-400">
                  {conteudo.heroDescription}
                </span>
              </h2>
            </div>

            {/* CTA Principal */}
            <div className="pt-12 animate-fadeInUp">
              <button className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white text-lg px-12 py-6 rounded-md font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl border border-green-400/30 flex items-center gap-3 mx-auto">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M12.8859 12.4912C12.7684 12.1384 12.7096 11.9621 12.7126 11.8178C12.7158 11.6661 12.7361 11.5865 12.806 11.4518C12.8724 11.3237 13.0501 11.1584 13.4053 10.8278C14.3864 9.91494 15 8.61247 15 7.16669C15 4.40526 12.7614 2.16669 10 2.16669C7.23858 2.16669 5 4.40526 5 7.16669C5 8.61247 5.61364 9.91494 6.59468 10.8278C6.94993 11.1584 7.12755 11.3237 7.19399 11.4518C7.26386 11.5865 7.28416 11.6661 7.28737 11.8178C7.29043 11.9621 7.23164 12.1384 7.11406 12.4912L5.58499 17.0784C5.38749 17.6709 5.28873 17.9672 5.34795 18.203C5.39978 18.4094 5.52863 18.5882 5.70807 18.7026C5.91305 18.8334 6.22534 18.8334 6.8499 18.8334H13.1501C13.7747 18.8334 14.0869 18.8334 14.2919 18.7026C14.4714 18.5882 14.6002 18.4094 14.6521 18.203C14.7113 17.9672 14.6125 17.6709 14.415 17.0784L12.8859 12.4912Z" fill="white"/>
                </svg>
                {conteudo.ctaPrincipal}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof - Logos */}
      <div 
        className="relative"
        style={getSectionStyle('socialProof')}
      >
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-2xl lg:text-3xl font-bold text-center mb-12">
            {conteudo.socialProofTitle}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center">
            {conteudo.socialProofLogos.map((logo: string, index: number) => (
              <div key={index} className="flex justify-center">
                {logo ? (
                  <img 
                    src={logo} 
                    alt={`Logo ${index + 1}`}
                    className="w-40 h-20 object-contain grayscale hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="w-40 h-20 bg-white/10 rounded-lg flex items-center justify-center">
                    <span className="text-white/50 text-sm">Logo {index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefícios Principais */}
      <div 
        className="relative"
        style={getSectionStyle('benefits')}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {conteudo.beneficios.map((beneficio: string, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur border-white/20 p-8 text-center hover:bg-white/20 transition-all shadow-xl rounded-lg">
                <h4 className="font-bold text-xl leading-tight">
                  {beneficio}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Depoimentos com Imagens */}
      <div 
        className="relative"
        style={getSectionStyle('testimonials')}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="space-y-16">
            {conteudo.depoimentos.map((depoimento: any, index: number) => (
              <div key={index} className={`flex gap-8 lg:gap-12 items-center ${
                index % 2 === 0 ? 'flex-col lg:flex-row' : 'flex-col lg:flex-row-reverse'
              }`}>
                {/* Imagem */}
                <div className="w-full lg:w-1/3">
                  {depoimento.imagem ? (
                    <img 
                      src={depoimento.imagem}
                      alt={`Depoimento ${index + 1}`}
                      className="w-full h-72 object-cover rounded-xl shadow-2xl"
                    />
                  ) : (
                    <div className="w-full h-72 bg-white/10 rounded-xl shadow-2xl flex items-center justify-center">
                      <span className="text-white/50">Imagem do depoimento {index + 1}</span>
                    </div>
                  )}
                </div>

                {/* Texto */}
                <div className="w-full lg:w-2/3">
                  <h4 className="text-2xl lg:text-3xl font-bold leading-tight">
                    {depoimento.titulo}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time e Estrategistas */}
      <div 
        className="relative"
        style={getSectionStyle('team')}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {conteudo.timeItens.map((item: string, index: number) => (
              <div key={index} className="bg-white/10 backdrop-blur border-white/20 p-8 text-center hover:bg-white/20 transition-all shadow-xl rounded-lg">
                <h4 className="font-bold text-xl">
                  {item}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Professores Convidados */}
      <div 
        className="relative"
        style={getSectionStyle('professors')}
      >
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl lg:text-4xl font-bold text-center mb-16">
            {conteudo.professoresTitle}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {conteudo.professorImages.map((imagem: string, index: number) => (
              <div key={index} className="flex justify-center">
                {imagem ? (
                  <img 
                    src={imagem}
                    alt={`Professor ${index + 1}`}
                    className="w-40 h-40 object-cover rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
                  />
                ) : (
                  <div className="w-40 h-40 bg-white/10 rounded-full shadow-xl flex items-center justify-center">
                    <span className="text-white/50 text-sm">Prof {index + 1}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div 
        className="relative"
        style={getSectionStyle('faq')}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold mb-8">
            {conteudo.faqTitle}
          </h3>
          
          <div className="mb-12">
            <div className="w-72 h-72 bg-white/10 rounded-full shadow-2xl mx-auto flex items-center justify-center">
              <span className="text-white/50">Imagem FAQ</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div 
        className="relative"
        style={getSectionStyle('footer')}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-8">
            <button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-xl px-12 py-6 rounded-full font-bold transform hover:scale-105 transition-all duration-300 shadow-2xl">
              {conteudo.footerCta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}