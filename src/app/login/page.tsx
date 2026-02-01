'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Login iniciado');

    if (!email || !senha) {
      toast.error('Preencha email e senha');
      return;
    }

    setLoading(true);
    console.log('📧 Email:', email);

    try {
      // 1. Autenticar com Supabase
      console.log('🔐 Tentando autenticar...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) {
        console.error('❌ Erro de autenticação:', authError);
        
        // Tratar erros específicos de autenticação
        if (authError.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else if (authError.message.includes('Email not confirmed')) {
          toast.error('Email não confirmado. Entre em contato com o administrador.');
        } else if (authError.message.includes('Email not found')) {
          toast.error('Email não cadastrado no sistema');
        } else {
          toast.error('Erro ao fazer login. Verifique suas credenciais.');
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        console.error('❌ Usuário não retornado');
        toast.error('Erro ao processar login. Tente novamente.');
        setLoading(false);
        return;
      }

      console.log('✅ Autenticado! User ID:', authData.user.id);

      // 2. Buscar dados do usuário na tabela usuarios
      console.log('📊 Buscando dados na tabela usuarios...');
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('❌ Erro ao buscar dados do usuário:', userError);
        toast.error('Erro ao carregar perfil. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!userData) {
        console.error('❌ Usuário não encontrado na tabela usuarios');
        toast.error('Perfil não encontrado no sistema. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('✅ Dados encontrados:', userData);

      // 3. Salvar dados no localStorage
      console.log('💾 Salvando no localStorage...');
      localStorage.setItem('user-role', userData.papel);
      localStorage.setItem('user-name', userData.nome);

      console.log('🎉 Login bem-sucedido!');
      toast.success(`Bem-vindo(a), ${userData.nome}!`);

      // 4. Redirecionar baseado no papel
      console.log('🔄 Redirecionando para:', userData.papel);
      setTimeout(() => {
        if (userData.papel === 'admin' || userData.papel === 'gestor') {
          console.log('➡️ Redirecionando para /admin');
          router.push('/admin');
        } else {
          console.log('➡️ Redirecionando para /');
          router.push('/');
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ ERRO NO LOGIN:', error);
      
      // Não mostrar erro genérico já que tratamos os erros específicos acima
      // Isso só vai pegar erros inesperados
      if (error?.message) {
        console.error('Detalhes:', error.message);
      }
      
      toast.error('Erro inesperado. Tente novamente ou entre em contato com o suporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="text-center md:text-left space-y-6 order-2 md:order-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-purple-200 font-medium">Plataforma Exclusiva</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                PORTAL DO TRÁFEGO
              </span>
              <br />
              <span className="text-white">IGOR MACEDO</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-md">
              Sistema de gestão de tráfego pago e análise de métricas.
            </p>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Sistema Online</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                <Lock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">100% Seguro</span>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="order-1 md:order-2">
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Acesse sua conta</h2>
                <p className="text-gray-400">Digite seu email e senha</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email */}
                <div>
                  <Label className="text-white mb-2 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label className="text-white mb-2 block">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg group"
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
                <p className="text-center text-sm text-gray-500">
                  Não tem acesso?{' '}
                  <button type="button" className="text-purple-400 hover:text-purple-300 font-medium">
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
