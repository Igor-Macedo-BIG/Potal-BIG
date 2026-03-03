'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isClean } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error('Preencha email e senha');
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Tentando autenticar com email:', email);
      
      // 1. Autenticar com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      console.log('[Login] Auth response:', { authData: authData?.user?.id, authError });

      if (authError) {
        console.error('[Login] Auth error:', authError);
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado');
        } else {
          toast.error(`Erro ao fazer login: ${authError.message}`);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('[Login] Nenhum usuário retornado');
        toast.error('Erro ao processar login');
        setLoading(false);
        return;
      }

      console.log('[Login] Autenticação bem-sucedida, ID:', authData.user.id);
      console.log('[Login] Buscando dados do usuário na tabela users...');

      // 2. Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('[Login] Query users response:', { userData, userError });

      if (userError) {
        console.error('[Login] Erro ao buscar usuário:', userError);
        if (userError.message.includes('406')) {
          // 406 pode significar: nenhum resultado ou múltiplos resultados
          const { data: allUsers, error: allError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id);
          
          console.log('[Login] Debug - todos os users com esse ID:', { allUsers, allError });
          toast.error('Perfil de usuário não encontrado. Contate o administrador.');
        } else {
          toast.error('Perfil não encontrado');
        }
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!userData) {
        console.error('[Login] userData é nulo');
        toast.error('Perfil não encontrado');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 3. Verificar se está ativo
      if (!userData.ativo) {
        console.warn('[Login] Usuário inativo');
        toast.error('Usuário inativo');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('[Login] Login bem-sucedido para:', userData.nome);

      // 4. Salvar dados no localStorage
      localStorage.setItem('user-role', userData.role);
      localStorage.setItem('user-name', userData.nome);
      localStorage.setItem('user-id', authData.user.id);
      if (userData.empresa_id) {
        localStorage.setItem('empresa-id', userData.empresa_id);
      }

      toast.success(`Bem-vindo(a), ${userData.nome}!`);

      // 5. Redirecionar
      setTimeout(() => {
        router.push('/');
      }, 1000);

    } catch (error: any) {
      console.error('[Login] Erro inesperado:', error);
      toast.error('Erro inesperado. Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
      isClean
        ? 'bg-gradient-to-br from-amber-50 via-white to-gray-50'
        : 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900'
    }`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isClean ? (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/40 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-50/30 rounded-full blur-3xl"></div>
          </>
        ) : (
          <>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </>
        )}
      </div>

      {/* Particles - only on dark */}
      {!isClean && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
              style={{
                left: `${((i * 37 + 13) % 100)}%`,
                top: `${((i * 53 + 7) % 100)}%`,
                animationDelay: `${(i * 0.25) % 5}s`,
                animationDuration: `${5 + (i * 0.5) % 10}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-center md:text-left space-y-6 order-1">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm ${
              isClean
                ? 'bg-amber-100/60 border border-amber-200'
                : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
            }`}>
              <Sparkles className={isClean ? 'h-4 w-4 text-amber-600' : 'h-4 w-4 text-purple-400'} />
              <span className={isClean ? 'text-sm text-amber-700 font-medium' : 'text-sm text-purple-200 font-medium'}>Plataforma Exclusiva</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold">
              <span className={isClean
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient'
              }>
                PORTAL
              </span>
              <br />
              <span className={isClean ? 'text-gray-900' : 'text-white'}>IGOR MACEDO</span>
            </h1>

            <p className={isClean ? 'text-xl text-gray-500 max-w-md' : 'text-xl text-gray-300 max-w-md'}>
              Sistema integrado de gestão de tráfego pago, funis e equipes comerciais.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm border ${
                isClean ? 'bg-white/70 border-gray-200' : 'bg-white/10 border-white/20'
              }`}>
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className={isClean ? 'text-sm text-gray-600' : 'text-sm text-gray-300'}>Sistema Online</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg backdrop-blur-sm border ${
                isClean ? 'bg-white/70 border-gray-200' : 'bg-white/10 border-white/20'
              }`}>
                <Lock className={isClean ? 'h-4 w-4 text-gray-400' : 'h-4 w-4 text-gray-400'} />
                <span className={isClean ? 'text-sm text-gray-600' : 'text-sm text-gray-300'}>100% Seguro</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="order-2">
            <div className={`backdrop-blur-xl rounded-2xl p-8 shadow-2xl ${
              isClean
                ? 'bg-white/80 border border-gray-200'
                : 'bg-gray-900/40 border border-gray-700/50'
            }`}>
              <div className="text-center mb-8">
                <h2 className={`text-3xl font-bold mb-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>Acesse sua conta</h2>
                <p className={isClean ? 'text-gray-500' : 'text-gray-400'}>Digite suas credenciais para continuar</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">

                {/* Email */}
                <div>
                  <Label className={`mb-2 block ${isClean ? 'text-gray-700' : 'text-white'}`}>Email</Label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isClean ? 'text-gray-400' : 'text-gray-400'}`} />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className={`pl-10 h-12 ${
                        isClean
                          ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
                          : 'bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label className={`mb-2 block ${isClean ? 'text-gray-700' : 'text-white'}`}>Senha</Label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isClean ? 'text-gray-400' : 'text-gray-400'}`} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className={`pl-10 pr-10 h-12 ${
                        isClean
                          ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-amber-200'
                          : 'bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                        isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className={`w-full h-12 text-white font-semibold text-lg group ${
                    isClean
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200/50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Entrar no Portal</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>

                {/* Footer */}
                <p className={`text-center text-sm ${isClean ? 'text-gray-400' : 'text-gray-500'}`}>
                  Não tem acesso?{' '}
                  <button type="button" className={`font-medium ${isClean ? 'text-amber-600 hover:text-amber-500' : 'text-purple-400 hover:text-purple-300'}`}>
                    Solicitar cadastro
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }

        .animate-float {
          animation: float linear infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
