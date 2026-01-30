'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import ModalCriarFunil from '@/components/modals/ModalCriarFunil';
import ModalCriarCampanha from '@/components/modals/ModalCriarCampanha';
import ModalCriacaoAninhada from '@/components/modals/ModalCriacaoAninhada';
import { toast } from 'sonner';
import { 
  BarChart3,
  Megaphone,
  LogOut,
  Home,
  Target,
  ChevronDown,
  ChevronRight,
  Plus,
  Zap,
  Layers,
  Trash2,
  FileText,
  Phone,
  Handshake,
  HeadphonesIcon,
  Share2,
  Shield
} from 'lucide-react';
import type { Funil, Campanha } from '@/types/hierarchical';

const navigationBase = [
  { name: 'Painel Admin', href: '/admin', icon: Shield, roles: ['admin', 'gestor'] },
  { name: 'Dashboard', href: '/', icon: Home, roles: ['admin', 'gestor', 'trafego', 'sdr', 'closer', 'social-seller', 'cs'] },
  { name: 'Tráfego', href: '/trafego', icon: Megaphone, roles: ['admin', 'gestor', 'trafego'] },
  { name: 'SDR', href: '/sdr', icon: Phone, roles: ['admin', 'gestor', 'sdr'] },
  { name: 'Closer', href: '/closer', icon: Handshake, roles: ['admin', 'gestor', 'closer'] },
  { name: 'Social Seller', href: '/social-seller', icon: Share2, roles: ['admin', 'gestor', 'social-seller'] },
  { name: 'Customer Success', href: '/cs', icon: HeadphonesIcon, roles: ['admin', 'gestor', 'cs'] },
];

interface SidebarProps {
  empresaNome?: string;
}

export function SidebarComFunis({ empresaNome }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selecionarCampanha, campanhaAtiva } = useCampanhaContext();
  const [funis, setFunis] = useState<Funil[]>([]);
  const [campanhasPorFunil, setCampanhasPorFunil] = useState<Record<string, Campanha[]>>({});
  const [funisExpandidos, setFunisExpandidos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    carregarFunis();
    carregarUserRole();
  }, []);

  const carregarUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setUserRole(userData.role);
          console.log('👤 Role do usuário:', userData.role);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar role:', error);
    }
  };

  const carregarFunis = async () => {
    setLoading(true);
    try {
      // Carregar funis diretamente do Supabase
      const { data: funis, error: errorFunis } = await supabase
        .from('funis')
        .select('*')
        .eq('empresa_id', '550e8400-e29b-41d4-a716-446655440000')
        .order('created_at', { ascending: false });

      if (errorFunis) {
        console.error('❌ Erro ao carregar funis:', {
          error: errorFunis,
          message: errorFunis?.message,
          details: errorFunis?.details,
          hint: errorFunis?.hint,
          code: errorFunis?.code
        });
        toast.error(`Erro ao carregar funis: ${errorFunis?.message || 'Erro desconhecido'}`);
        return;
      }

      console.log('✅ Funis carregados:', funis?.length || 0);

      // Carregar campanhas dos funis
      const { data: campanhas, error: errorCampanhas } = await supabase
        .from('campanhas')
        .select('*')
        .in('funil_id', funis?.map(f => f.id) || [])
        .order('created_at', { ascending: false });

      if (errorCampanhas) {
        console.error('❌ Erro ao carregar campanhas:', {
          error: errorCampanhas,
          message: errorCampanhas?.message,
          details: errorCampanhas?.details,
          hint: errorCampanhas?.hint,
          code: errorCampanhas?.code
        });
      } else {
        console.log('✅ Campanhas carregadas:', campanhas?.length || 0);
      }

      // Agrupar campanhas por funil
      const campanhasPorFunil: Record<string, Campanha[]> = {};
      campanhas?.forEach(campanha => {
        if (!campanhasPorFunil[campanha.funil_id]) {
          campanhasPorFunil[campanha.funil_id] = [];
        }
        campanhasPorFunil[campanha.funil_id].push(campanha);
      });

      setFunis(funis || []);
      setCampanhasPorFunil(campanhasPorFunil);
    } catch (error) {
      console.error('Erro ao carregar funis:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarCampanhaRapida = async (funilId: string, nome: string) => {
    try {
      const { data: campanha, error } = await supabase
        .from('campanhas')
        .insert({
          nome: nome.trim(),
          tipo: 'leads',
          funil_id: funilId,
          plataforma: 'Meta Ads',
        })
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        toast.error(`Erro ao criar campanha: ${error.message}`);
        return;
      }

      toast.success(`Campanha "${campanha.nome}" criada com sucesso!`);
      carregarFunis(); // Recarregar para atualizar a lista
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro interno. Tente novamente.');
    }
  };

  const toggleFunilExpansao = (funilId: string) => {
    const novosExpandidos = new Set(funisExpandidos);
    if (funisExpandidos.has(funilId)) {
      novosExpandidos.delete(funilId);
    } else {
      novosExpandidos.add(funilId);
    }
    setFunisExpandidos(novosExpandidos);
  };

  const handleFunilCriado = () => {
    carregarFunis();
  };

  const handleCampanhaCriada = () => {
    carregarFunis();
  };

  const handleSelecionarCampanha = (campanha: Campanha) => {
    selecionarCampanha(campanha);
    toast.success(`Dashboard atualizado para campanha "${campanha.nome}"`);
  };

  const excluirCampanha = async (campanhaId: string) => {
    try {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', campanhaId);

      if (error) {
        console.error('Erro ao excluir campanha:', error);
        toast.error('Erro ao excluir campanha');
        return;
      }

      toast.success('Campanha excluída com sucesso!');
      
      // Se a campanha excluída era a ativa, limpar seleção
      if (campanhaAtiva?.id === campanhaId) {
        selecionarCampanha(null);
      }
      
      // Recarregar lista
      carregarFunis();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro interno. Tente novamente.');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro ao fazer logout:', error);
        toast.error('Erro ao sair');
        return;
      }

      // Limpar localStorage
      localStorage.removeItem('user-role');
      localStorage.removeItem('user-name');
      
      console.log('✅ Logout realizado com sucesso!');
      toast.success('Até logo!');
      
      // Redirecionar para login
      router.push('/login');
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao sair');
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700/50 backdrop-blur-xl">
      {/* Logo e nome da empresa */}
      <div className="relative flex h-16 items-center justify-center border-b border-slate-700/50 px-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-xl" />
        <div className="relative flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Neural Traffic
            </p>
            {empresaNome && (
              <Badge className="text-xs bg-gradient-to-r from-slate-700 to-slate-600 text-cyan-300 border-slate-600">
                {empresaNome}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
        {/* Navegação base */}
        {navigationBase
          .filter((item) => !userRole || item.roles.includes(userRole))
          .map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isAdminRoute = item.roles.includes('admin') && item.roles.length <= 2; // Admin ou Gestor apenas

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left group relative overflow-hidden transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/30',
                  isAdminRoute && 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20'
                )}
                onClick={() => {
                  if (item.name === 'Dashboard') {
                    selecionarCampanha(null);
                    toast.success('Dashboard resetado para visão geral');
                  }
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-sm" />
                )}
                <Icon className={cn(
                  "mr-3 h-4 w-4 relative z-10 transition-all duration-300",
                  isActive ? "text-cyan-400" : isAdminRoute ? "text-purple-400" : "group-hover:text-purple-400"
                )} />
                <span className="relative z-10 font-medium">{item.name}</span>
                {isAdminRoute && (
                  <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                    Admin
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700/50 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-white border border-transparent hover:border-red-500/30 transition-all duration-300 group"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:text-red-400 transition-colors duration-300" />
          <span className="font-medium">Sair</span>
        </Button>
      </div>

      {/* Modais */}
      <ModalCriacaoAninhada 
        open={modalCriacaoAberto}
        onOpenChange={setModalCriacaoAberto}
        onConcluido={carregarFunis}
      />
      

    </div>
  );
}