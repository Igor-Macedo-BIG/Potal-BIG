'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useCampanhaContext } from '@/contexts/CampanhaContext';
import { useTheme } from '@/contexts/ThemeContext';
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
  Shield,
  Camera
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
  isOpen?: boolean;
  onClose?: () => void;
}

export function SidebarComFunis({ empresaNome, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selecionarCampanha, campanhaAtiva } = useCampanhaContext();
  const { isClean } = useTheme();
  const [funis, setFunis] = useState<Funil[]>([]);
  const [campanhasPorFunil, setCampanhasPorFunil] = useState<Record<string, Campanha[]>>({});
  const [funisExpandidos, setFunisExpandidos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [modalCriacaoAberto, setModalCriacaoAberto] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    carregarFunis();
    carregarUserRole();
    // Carregar foto de perfil do localStorage
    const savedPhoto = localStorage.getItem('profile-photo');
    if (savedPhoto) setProfilePhoto(savedPhoto);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfilePhoto(dataUrl);
      localStorage.setItem('profile-photo', dataUrl);
      toast.success('Foto atualizada!');
    };
    reader.readAsDataURL(file);
  };

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
      // Carregar funis via API route (não direto do Supabase)
      const response = await fetch('/api/funis');
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao carregar funis');
      }

      const data = await response.json();
      console.log('✅ Funis carregados:', data.funis?.length || 0);

      setFunis(data.funis || []);
      setCampanhasPorFunil(data.campanhasPorFunil || {});
    } catch (error) {
      console.error('❌ Erro ao carregar funis:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar funis');
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
    <div className={cn(
      "sidebar-wrapper flex h-full w-64 flex-col border-r backdrop-blur-xl",
      isClean
        ? 'bg-white border-gray-200'
        : 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-slate-700/50',
      isOpen && "sidebar-open"
    )}>
      {/* Logo e nome da empresa */}
      <div className={cn(
        "sidebar-logo-area relative flex h-16 items-center justify-center border-b px-4",
        isClean
          ? 'border-gray-100 bg-amber-50/40'
          : 'border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-purple-500/10'
      )}>
        {!isClean && <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 blur-xl" />}
        <div className="relative flex items-center space-x-3">
          <div
            className={cn(
              "relative w-10 h-10 rounded-xl overflow-hidden cursor-pointer group flex-shrink-0",
              isClean
                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                : 'bg-gradient-to-r from-cyan-500 to-purple-500'
            )}
            onClick={() => fileInputRef.current?.click()}
            title="Clique para alterar foto de perfil"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="text-left">
            <p className={cn(
              "text-sm font-bold",
              isClean
                ? 'text-gray-900'
                : 'text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent'
            )}>
              Portal Empresarial
            </p>
            {empresaNome && (
              <Badge className={cn(
                "text-xs",
                isClean
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gradient-to-r from-slate-700 to-slate-600 text-cyan-300 border-slate-600'
              )}>
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
          const isAdminRoute = item.roles.includes('admin') && item.roles.length <= 2;

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'sidebar-nav-item w-full justify-start text-left group relative overflow-hidden transition-all duration-300',
                  isClean
                    ? cn(
                        isActive
                          ? 'active bg-amber-50 text-amber-800 border border-amber-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent hover:border-gray-200/60',
                        isAdminRoute && !isActive && 'bg-amber-50/50 border-amber-100'
                      )
                    : cn(
                        isActive
                          ? 'active bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/50 hover:to-slate-700/50 hover:text-white border border-transparent hover:border-slate-600/30',
                        isAdminRoute && 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20'
                      )
                )}
                onClick={() => {
                  if (item.name === 'Dashboard') {
                    selecionarCampanha(null);
                    toast.success('Dashboard resetado para visão geral');
                  }
                  if (onClose) onClose();
                }}
              >
                {isActive && !isClean && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-sm" />
                )}
                <Icon className={cn(
                  "nav-icon mr-3 h-4 w-4 relative z-10 transition-all duration-300",
                  isClean
                    ? (isActive ? "text-amber-600" : isAdminRoute ? "text-amber-500" : "text-gray-400 group-hover:text-gray-600")
                    : (isActive ? "text-cyan-400" : isAdminRoute ? "text-purple-400" : "group-hover:text-purple-400")
                )} />
                <span className="relative z-10 font-medium">{item.name}</span>
                {isAdminRoute && (
                  <Badge className={cn(
                    "ml-auto text-xs",
                    isClean
                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  )}>
                    Admin
                  </Badge>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className={cn(
        "sidebar-logout border-t p-4",
        isClean
          ? 'border-gray-200 bg-gray-50/50'
          : 'border-slate-700/50 bg-gradient-to-r from-red-500/10 to-pink-500/10'
      )}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start transition-all duration-300 group border border-transparent",
            isClean
              ? 'text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
              : 'text-slate-300 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 hover:text-white hover:border-red-500/30'
          )}
          onClick={handleLogout}
        >
          <LogOut className={cn(
            "mr-3 h-4 w-4 transition-colors duration-300",
            isClean ? 'group-hover:text-red-500' : 'group-hover:text-red-400'
          )} />
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