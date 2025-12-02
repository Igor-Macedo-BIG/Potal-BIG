'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [roleSelected, setRoleSelected] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast.error('Preencha email e senha');
      return;
    }

    if (!roleSelected) {
      toast.error('Selecione seu tipo de acesso');
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticar com Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Usuário não encontrado');
      }

      // 2. Buscar dados do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('Erro ao buscar dados do usuário:', userError);
        throw new Error('Erro ao carregar dados do usuário');
      }

      // 3. Verificar se o role corresponde
      if (userData.role !== roleSelected) {
        toast.error(`Este usuário não tem acesso como ${roles.find(r => r.value === roleSelected)?.label}`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 4. Verificar se está ativo
      if (!userData.ativo) {
        toast.error('Usuário inativo. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 5. Salvar role no localStorage
      localStorage.setItem('user-role', userData.role);
      localStorage.setItem('user-name', userData.nome);

      toast.success(`Bem-vindo(a), ${userData.nome}!`);

      // 6. Redirecionar baseado no role
      setTimeout(() => {
        switch (userData.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'gestor':
            router.push('/admin'); // Gestor também tem acesso ao admin
            break;
          case 'cs':
            router.push('/cs');
            break;
          case 'sdr':
            router.push('/sdr');
            break;
          case 'closer':
            router.push('/closer');
            break;
          case 'social-seller':
            router.push('/social-seller');
            break;
          default:
            router.push('/');
        }
      }, 1000);

    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Email ou senha incorretos');
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
                PORTAL
              </span>
              <br />
              <span className="text-white">LÍDIA CABRAL</span>
            </h1>

            <p className="text-xl text-gray-300 max-w-md">
              Sistema integrado de gestão de tráfego pago, funis e equipes comerciais.
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
                <p className="text-gray-400">Selecione seu tipo de acesso abaixo</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Role Selection */}
                <div>
                  <Label className="text-white mb-3 block">Tipo de Acesso</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => {
                      const Icon = role.icon;
                      const isSelected = roleSelected === role.value;
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => setRoleSelected(role.value)}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-purple-500 bg-purple-500/20 scale-105'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs text-white font-medium text-center">
                              {role.label}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-purple-500 rounded-full flex items-center justify-center">
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
