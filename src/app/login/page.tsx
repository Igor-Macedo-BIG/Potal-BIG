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
  Shield, 
  Briefcase, 
  HeadphonesIcon, 
  Phone, 
  Handshake, 
  Share2,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';

type UserRole = 'admin' | 'gestor' | 'cs' | 'sdr' | 'closer' | 'social-seller';

interface RoleOption {
  value: UserRole;
  label: string;
  icon: any;
  color: string;
  gradient: string;
}

const roles: RoleOption[] = [
  {
    value: 'admin',
    label: 'Administrador',
    icon: Shield,
    color: 'from-purple-600 to-pink-600',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
  },
  {
    value: 'gestor',
    label: 'Gestor de Marketing',
    icon: Briefcase,
    color: 'from-blue-600 to-cyan-600',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
  },
  {
    value: 'cs',
    label: 'Customer Success',
    icon: HeadphonesIcon,
    color: 'from-green-600 to-emerald-600',
    gradient: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
  },
  {
    value: 'sdr',
    label: 'SDR',
    icon: Phone,
    color: 'from-orange-600 to-yellow-600',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-yellow-500/20'
  },
  {
    value: 'closer',
    label: 'Closer',
    icon: Handshake,
    color: 'from-red-600 to-rose-600',
    gradient: 'bg-gradient-to-br from-red-500/20 to-rose-500/20'
  },
  {
    value: 'social-seller',
    label: 'Social Seller',
    icon: Share2,
    color: 'from-indigo-600 to-purple-600',
    gradient: 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20'
  }
];

const rolesClean: RoleOption[] = [
  {
    value: 'admin',
    label: 'Administrador',
    icon: Shield,
    color: 'from-amber-600 to-amber-700',
    gradient: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20'
  },
  {
    value: 'gestor',
    label: 'Gestor de Marketing',
    icon: Briefcase,
    color: 'from-blue-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20'
  },
  {
    value: 'cs',
    label: 'Customer Success',
    icon: HeadphonesIcon,
    color: 'from-emerald-500 to-emerald-600',
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20'
  },
  {
    value: 'sdr',
    label: 'SDR',
    icon: Phone,
    color: 'from-orange-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20'
  },
  {
    value: 'closer',
    label: 'Closer',
    icon: Handshake,
    color: 'from-rose-500 to-rose-600',
    gradient: 'bg-gradient-to-br from-rose-500/20 to-rose-600/20'
  },
  {
    value: 'social-seller',
    label: 'Social Seller',
    icon: Share2,
    color: 'from-indigo-500 to-indigo-600',
    gradient: 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/20'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [roleSelected, setRoleSelected] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isClean } = useTheme();
  const activeRoles = isClean ? rolesClean : roles;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Login iniciado');

    if (!email || !senha) {
      toast.error('Preencha email e senha');
      return;
    }

    if (!roleSelected) {
      toast.error('Selecione seu tipo de acesso');
      return;
    }

    setLoading(true);
    console.log('📧 Email:', email);
    console.log('🎯 Role selecionado:', roleSelected);

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

      // 2. Buscar dados do usuário na tabela users
      console.log('📊 Buscando dados na tabela users...');
      const { data: userData, error: userError } = await supabase
        .from('users')
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
        console.error('❌ Usuário não encontrado na tabela users');
        toast.error('Perfil não encontrado no sistema. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      console.log('✅ Dados encontrados:', userData);

      // 3. Verificar se o role corresponde
      if (userData.role !== roleSelected) {
        console.error('❌ Role não corresponde:', userData.role, 'vs', roleSelected);
        toast.error(`Este usuário não tem acesso como ${roles.find(r => r.value === roleSelected)?.label}`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 4. Verificar se está ativo
      if (!userData.ativo) {
        console.error('❌ Usuário inativo');
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 5. Salvar role no localStorage
      console.log('💾 Salvando no localStorage...');
      localStorage.setItem('user-role', userData.role);
      localStorage.setItem('user-name', userData.nome);

      console.log('🎉 Login bem-sucedido!');
      toast.success(`Bem-vindo(a), ${userData.nome}!`);

      // 6. Redirecionar para Dashboard Geral
      console.log('🔄 Redirecionando para Dashboard Geral...');
      setTimeout(() => {
        router.push('/');
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
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
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
              <span className={isClean ? 'text-gray-900' : 'text-white'}>LÍDIA CABRAL</span>
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
                <p className={isClean ? 'text-gray-500' : 'text-gray-400'}>Selecione seu tipo de acesso abaixo</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Role Selection */}
                <div>
                  <Label className={`mb-3 block ${isClean ? 'text-gray-700' : 'text-white'}`}>Tipo de Acesso</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {activeRoles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = roleSelected === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setRoleSelected(role.value)}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            isClean
                              ? isSelected
                                ? 'border-amber-400 bg-amber-50 scale-105 shadow-md'
                                : 'border-gray-200 bg-gray-50 hover:border-amber-200 hover:bg-amber-50/50'
                              : isSelected
                                ? 'border-purple-500 bg-purple-500/20 scale-105'
                                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <span className={`text-xs font-medium text-center ${isClean ? 'text-gray-700' : 'text-white'}`}>
                              {role.label}
                            </span>
                          </div>
                          {isSelected && (
                            <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center ${isClean ? 'bg-amber-500' : 'bg-purple-500'}`}>
                              <div className="h-2 w-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

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
