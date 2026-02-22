'use client';

import { useState, useEffect } from 'react';
import { LayoutComFunis } from '@/components/layout/LayoutComFunis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetaIntegrationCard } from '@/components/admin/MetaIntegrationCard';
import { TypebotIntegrationCard } from '@/components/admin/TypebotIntegrationCard';
import { KommoIntegrationCard } from '@/components/admin/KommoIntegrationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Users, 
  Target, 
  Layers, 
  Plus, 
  Settings, 
  Shield,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Phone,
  Handshake,
  Share2,
  HeadphonesIcon,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Palette,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

type UserRole = 'admin' | 'gestor' | 'sdr' | 'closer' | 'social-seller' | 'cs' | 'trafego';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
}

interface Funil {
  id: string;
  nome: string;
  descricao?: string;
  campanhas_count: number;
  created_at: string;
}

interface Campanha {
  id: string;
  nome: string;
  tipo?: string;
  plataforma?: string;
  ativo?: boolean;
  funil_id: string;
  funil_nome?: string;
  created_at: string;
  conjuntos_anuncio?: ConjuntoAnuncio[];
}

interface ConjuntoAnuncio {
  id: string;
  nome: string;
  ativo?: boolean;
  campanha_id: string;
  anuncios?: Anuncio[];
}

interface Anuncio {
  id: string;
  nome: string;
  tipo?: string;
  conjunto_anuncio_id: string;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor de Marketing',
  sdr: 'SDR',
  closer: 'Closer',
  'social-seller': 'Social Seller',
  cs: 'Customer Success',
  trafego: 'Tráfego'
};

const roleIcons: Record<UserRole, any> = {
  admin: Shield,
  gestor: Target,
  sdr: Phone,
  closer: Handshake,
  'social-seller': Share2,
  cs: HeadphonesIcon,
  trafego: Megaphone
};

const roleColorsDark: Record<UserRole, string> = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  gestor: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
  sdr: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  closer: 'bg-green-500/20 text-green-300 border-green-500/30',
  'social-seller': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  cs: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  trafego: 'bg-pink-500/20 text-pink-300 border-pink-500/30'
};

const roleColorsClean: Record<UserRole, string> = {
  admin: 'bg-purple-50 text-purple-700 border-purple-200',
  gestor: 'bg-blue-50 text-blue-700 border-blue-200',
  sdr: 'bg-blue-50 text-blue-700 border-blue-200',
  closer: 'bg-green-50 text-green-700 border-green-200',
  'social-seller': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  cs: 'bg-orange-50 text-orange-700 border-orange-200',
  trafego: 'bg-pink-50 text-pink-700 border-pink-200'
};

export default function PainelAdmin() {
  const { theme, setTheme, isClean } = useTheme();
  const roleColors = isClean ? roleColorsClean : roleColorsDark;
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [funis, setFunis] = useState<Funil[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [campanhasPorFunil, setCampanhasPorFunil] = useState<Record<string, Campanha[]>>({});
  const [funisExpandidos, setFunisExpandidos] = useState<Set<string>>(new Set());
  const [campanhasExpandidas, setCampanhasExpandidas] = useState<Set<string>>(new Set());
  const [conjuntosExpandidos, setConjuntosExpandidos] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [funilSelecionadoParaCampanha, setFunilSelecionadoParaCampanha] = useState<string>('');
  const [campanhaSelecionadaParaConjunto, setCampanhaSelecionadaParaConjunto] = useState<string>('');
  const [campanhaSelecionadaParaAnuncio, setCampanhaSelecionadaParaAnuncio] = useState<string>('');
  const [conjuntoSelecionadoParaAnuncio, setConjuntoSelecionadoParaAnuncio] = useState<string>('');

  // Modal states
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [modalEditarUsuarioAberto, setModalEditarUsuarioAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [modalFunilAberto, setModalFunilAberto] = useState(false);
  const [modalCampanhaAberto, setModalCampanhaAberto] = useState(false);
  const [modalConjuntoAberto, setModalConjuntoAberto] = useState(false);
  const [modalAnuncioAberto, setModalAnuncioAberto] = useState(false);
  const [modalEditarFunilAberto, setModalEditarFunilAberto] = useState(false);
  const [modalEditarCampanhaAberto, setModalEditarCampanhaAberto] = useState(false);
  const [modalEditarConjuntoAberto, setModalEditarConjuntoAberto] = useState(false);
  const [funilEditando, setFunilEditando] = useState<Funil | null>(null);
  const [campanhaEditando, setCampanhaEditando] = useState<Campanha | null>(null);
  const [conjuntoEditando, setConjuntoEditando] = useState<ConjuntoAnuncio | null>(null);

  // Form states
  const [novoUsuario, setNovoUsuario] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'sdr' as UserRole
  });

  const [novoFunil, setNovoFunil] = useState({
    nome: '',
    descricao: ''
  });

  const [novaCampanha, setNovaCampanha] = useState({
    nome: '',
    funil_id: ''
  });

  const [novoConjunto, setNovoConjunto] = useState({
    nome: ''
  });

  const [novoAnuncio, setNovoAnuncio] = useState({
    nome: '',
    tipo: 'image',
    arquivo: null as File | null
  });

  // Carregar funis e campanhas ao montar
  useEffect(() => {
    carregarUsuarios();
    carregarFunis();
  }, []);

  const carregarUsuarios = async () => {
    try {
      console.log('📊 Carregando usuários...');
      
      // Verificar sessão atual
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('👤 Sessão atual:', sessionData?.session?.user?.email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        console.error('❌ Detalhes:', error.message, error.hint);
        toast.error('Erro ao carregar usuários: ' + error.message);
        return;
      }

      console.log('✅ Usuários carregados:', data);
      console.log('📈 Total:', data?.length || 0);
      setUsuarios(data || []);
      
      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum usuário encontrado no banco!');
      }
    } catch (error: any) {
      console.error('❌ Erro exception:', error);
      toast.error('Erro ao carregar usuários');
    }
  };

  const handleCriarUsuario = async () => {
    try {
      // Validações
      if (!novoUsuario.nome || !novoUsuario.email || !novoUsuario.senha) {
        toast.error('Preencha todos os campos');
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(novoUsuario.email)) {
        toast.error('Email inválido');
        return;
      }

      // Validar senha
      if (novoUsuario.senha.length < 6) {
        toast.error('A senha deve ter no mínimo 6 caracteres');
        return;
      }

      setLoading(true);
      console.log('🔐 Criando usuário no Supabase Auth...');

      // Criar usuário no Supabase Auth (auto-confirmado)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: novoUsuario.email,
        password: novoUsuario.senha,
        options: {
          data: {
            nome: novoUsuario.nome,
          },
          emailRedirectTo: `${window.location.origin}/login`,
          // Auto-confirmar email (requer desabilitar confirmação nas configs do Supabase)
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar auth:', authError);
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error('Erro ao criar usuário: ' + authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário');
        setLoading(false);
        return;
      }

      console.log('✅ Auth criado! User ID:', authData.user.id);

      // Pequeno delay para garantir que o auth foi processado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Criar registro na tabela users
      console.log('💾 Inserindo na tabela users...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          role: novoUsuario.role,
          ativo: true
        });

      if (insertError) {
        console.error('❌ Erro ao inserir na tabela:', insertError);
        toast.error('Erro ao criar registro: ' + insertError.message);
        setLoading(false);
        return;
      }

      console.log('✅ Usuário criado com sucesso!');
      toast.success('Usuário criado com sucesso!');
      
      // Limpar form e fechar modal
      setNovoUsuario({ nome: '', email: '', senha: '', role: 'sdr' });
      setModalUsuarioAberto(false);
      
      // Recarregar lista
      await carregarUsuarios();

    } catch (error: any) {
      console.error('❌ Erro geral:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirUsuario = async (usuarioId: string, usuarioNome: string) => {
    if (!confirm(`Deseja realmente excluir o usuário "${usuarioNome}"?`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Excluindo usuário:', usuarioId);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', usuarioId);

      if (error) {
        console.error('❌ Erro ao excluir:', error);
        toast.error('Erro ao excluir usuário: ' + error.message);
        return;
      }

      console.log('✅ Usuário excluído!');
      toast.success('Usuário excluído com sucesso!');
      await carregarUsuarios();
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async (usuarioId: string, ativoAtual: boolean) => {
    try {
      setLoading(true);
      console.log('🔄 Alterando status:', usuarioId, !ativoAtual);

      const { error } = await supabase
        .from('users')
        .update({ ativo: !ativoAtual })
        .eq('id', usuarioId);

      if (error) {
        console.error('❌ Erro ao atualizar:', error);
        toast.error('Erro ao atualizar status: ' + error.message);
        return;
      }

      console.log('✅ Status atualizado!');
      toast.success(ativoAtual ? 'Usuário desativado' : 'Usuário ativado');
      await carregarUsuarios();
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setModalEditarUsuarioAberto(true);
  };

  const handleSalvarEdicao = async (novaSenha?: string) => {
    if (!usuarioEditando) return;

    try {
      setLoading(true);
      console.log('💾 Atualizando usuário:', usuarioEditando.id);

      // Atualizar dados na tabela users
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nome: usuarioEditando.nome,
          role: usuarioEditando.role,
          ativo: usuarioEditando.ativo
        })
        .eq('id', usuarioEditando.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar:', updateError);
        toast.error('Erro ao atualizar usuário: ' + updateError.message);
        return;
      }

      // Se forneceu nova senha, resetar no Auth
      if (novaSenha && novaSenha.length >= 6) {
        console.log('🔑 Resetando senha...');
        // Nota: Isso requer permissões de admin no Supabase
        // Por enquanto, vamos apenas notificar
        toast.info('Para alterar senha, use o painel de Authentication do Supabase');
      }

      console.log('✅ Usuário atualizado!');
      toast.success('Usuário atualizado com sucesso!');
      setModalEditarUsuarioAberto(false);
      setUsuarioEditando(null);
      await carregarUsuarios();
    } catch (error: any) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const carregarFunis = async () => {
    setLoading(true);
    try {
      // Buscar dados via API route (não direto do Supabase)
      const response = await fetch('/api/funis');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const data = await response.json();

      setFunis(data.funis || []);
      setCampanhasPorFunil(data.campanhasPorFunil || {});
      setCampanhas(data.campanhas || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const toggleFunil = (funilId: string) => {
    const novoSet = new Set(funisExpandidos);
    if (novoSet.has(funilId)) {
      novoSet.delete(funilId);
    } else {
      novoSet.add(funilId);
    }
    setFunisExpandidos(novoSet);
  };

  const toggleCampanha = (campanhaId: string) => {
    const novoSet = new Set(campanhasExpandidas);
    if (novoSet.has(campanhaId)) {
      novoSet.delete(campanhaId);
    } else {
      novoSet.add(campanhaId);
    }
    setCampanhasExpandidas(novoSet);
  };

  const toggleConjunto = (conjuntoId: string) => {
    const novoSet = new Set(conjuntosExpandidos);
    if (novoSet.has(conjuntoId)) {
      novoSet.delete(conjuntoId);
    } else {
      novoSet.add(conjuntoId);
    }
    setConjuntosExpandidos(novoSet);
  };

  const handleCriarFunil = async () => {
    if (!novoFunil.nome) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('funis')
        .insert({
          nome: novoFunil.nome,
          descricao: novoFunil.descricao,
          empresa_id: '550e8400-e29b-41d4-a716-446655440000' // ID fixo da empresa
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Funil criado com sucesso!');
      setModalFunilAberto(false);
      setNovoFunil({ nome: '', descricao: '' });
      carregarFunis(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao criar funil:', error);
      toast.error('Erro ao criar funil');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarCampanha = async () => {
    if (!novaCampanha.nome || !novaCampanha.funil_id) {
      toast.error('Nome e funil são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const dadosCampanha = {
        nome: novaCampanha.nome,
        funil_id: novaCampanha.funil_id
      };
      
      console.log('Criando campanha com dados:', dadosCampanha);
      
      const { data: campanhaData, error: campanhaError } = await supabase
        .from('campanhas')
        .insert(dadosCampanha)
        .select()
        .single();

      console.log('Resultado completo:', JSON.stringify({ campanhaData, campanhaError }, null, 2));

      if (campanhaError) {
        console.error('Erro detalhado do Supabase:', JSON.stringify(campanhaError, null, 2));
        throw new Error(campanhaError.message || campanhaError.hint || 'Erro desconhecido do Supabase');
      }

      toast.success('Campanha criada com sucesso!');
      setModalCampanhaAberto(false);
      setNovaCampanha({ nome: '', funil_id: '' });
      setFunilSelecionadoParaCampanha('');
      carregarFunis(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao criar campanha:', error);
      const errorMessage = error?.message || error?.error_description || 'Erro ao criar campanha';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarConjunto = async () => {
    if (!novoConjunto.nome) {
      toast.error('Nome do conjunto é obrigatório');
      return;
    }

    if (!campanhaSelecionadaParaConjunto) {
      toast.error('Selecione uma campanha');
      return;
    }

    setLoading(true);
    try {
      const dadosConjunto = {
        nome: novoConjunto.nome,
        campanha_id: campanhaSelecionadaParaConjunto,
        ativo: true
      };
      
      console.log('Criando conjunto com dados:', dadosConjunto);
      
      const { data, error } = await supabase
        .from('conjuntos_anuncio')
        .insert(dadosConjunto)
        .select()
        .single();

      console.log('Resultado completo:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('Erro detalhado do Supabase:', JSON.stringify(error, null, 2));
        throw new Error(error.message || error.hint || 'Erro desconhecido do Supabase');
      }

      toast.success('Conjunto de anúncio criado com sucesso!');
      setModalConjuntoAberto(false);
      setNovoConjunto({ nome: '' });
      setCampanhaSelecionadaParaConjunto('');
      carregarFunis(); // Recarregar lista
    } catch (error: any) {
      console.error('Erro ao criar conjunto:', error);
      const errorMessage = error?.message || error?.error_description || 'Erro ao criar conjunto';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCriarAnuncio = async () => {
    if (!novoAnuncio.nome) {
      toast.error('Nome do anúncio é obrigatório');
      return;
    }

    if (!conjuntoSelecionadoParaAnuncio) {
      toast.error('Selecione um conjunto de anúncio');
      return;
    }

    setLoading(true);
    try {
      const dadosAnuncio = {
        nome: novoAnuncio.nome,
        tipo: novoAnuncio.tipo,
        conjunto_anuncio_id: conjuntoSelecionadoParaAnuncio
      };
      
      console.log('Criando anúncio com dados:', dadosAnuncio);
      
      const { data, error } = await supabase
        .from('anuncios')
        .insert(dadosAnuncio)
        .select()
        .single();

      console.log('Resultado completo:', JSON.stringify({ data, error }, null, 2));

      if (error) {
        console.error('Erro detalhado do Supabase:', JSON.stringify(error, null, 2));
        throw new Error(error.message || error.hint || 'Erro desconhecido do Supabase');
      }

      toast.success('Anúncio criado com sucesso!');
      
      // Expandir o conjunto automaticamente para mostrar o anúncio
      const novoSet = new Set(conjuntosExpandidos);
      novoSet.add(conjuntoSelecionadoParaAnuncio);
      setConjuntosExpandidos(novoSet);
      
      const conjuntoTemp = conjuntoSelecionadoParaAnuncio;
      setModalAnuncioAberto(false);
      setNovoAnuncio({ nome: '', tipo: 'image', arquivo: null });
      setCampanhaSelecionadaParaAnuncio('');
      setConjuntoSelecionadoParaAnuncio('');
      
      await carregarFunis(); // Recarregar lista
      
      // Expandir novamente após recarregar (caso o estado seja resetado)
      const novoSetFinal = new Set(conjuntosExpandidos);
      novoSetFinal.add(conjuntoTemp);
      setConjuntosExpandidos(novoSetFinal);
    } catch (error: any) {
      console.error('Erro ao criar anúncio:', error);
      const errorMessage = error?.message || error?.error_description || 'Erro ao criar anúncio';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============= FUNÇÕES DE EDIÇÃO =============
  const handleEditarFunil = (funil: Funil) => {
    setFunilEditando(funil);
    setModalEditarFunilAberto(true);
  };

  const handleSalvarEdicaoFunil = async () => {
    if (!funilEditando) return;

    if (!funilEditando.nome) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('funis')
        .update({
          nome: funilEditando.nome,
          descricao: funilEditando.descricao
        })
        .eq('id', funilEditando.id);

      if (error) throw error;

      toast.success('Funil atualizado com sucesso!');
      setModalEditarFunilAberto(false);
      setFunilEditando(null);
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao atualizar funil:', error);
      toast.error('Erro ao atualizar funil');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarCampanha = (campanha: Campanha) => {
    setCampanhaEditando(campanha);
    setModalEditarCampanhaAberto(true);
  };

  const handleSalvarEdicaoCampanha = async () => {
    if (!campanhaEditando) return;

    if (!campanhaEditando.nome) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('campanhas')
        .update({
          nome: campanhaEditando.nome,
          tipo: campanhaEditando.tipo,
          plataforma: campanhaEditando.plataforma,
          ativo: campanhaEditando.ativo
        })
        .eq('id', campanhaEditando.id);

      if (error) throw error;

      toast.success('Campanha atualizada com sucesso!');
      setModalEditarCampanhaAberto(false);
      setCampanhaEditando(null);
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao atualizar campanha:', error);
      toast.error('Erro ao atualizar campanha');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarConjunto = (conjunto: ConjuntoAnuncio) => {
    setConjuntoEditando(conjunto);
    setModalEditarConjuntoAberto(true);
  };

  const handleSalvarEdicaoConjunto = async () => {
    if (!conjuntoEditando) return;

    if (!conjuntoEditando.nome) {
      toast.error('Nome do conjunto é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('conjuntos_anuncio')
        .update({
          nome: conjuntoEditando.nome,
          ativo: conjuntoEditando.ativo
        })
        .eq('id', conjuntoEditando.id);

      if (error) throw error;

      toast.success('Conjunto atualizado com sucesso!');
      setModalEditarConjuntoAberto(false);
      setConjuntoEditando(null);
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao atualizar conjunto:', error);
      toast.error('Erro ao atualizar conjunto');
    } finally {
      setLoading(false);
    }
  };

  // ============= FUNÇÃO DE DUPLICAR CONJUNTO =============
  const handleDuplicarConjunto = async (conjunto: ConjuntoAnuncio) => {
    setLoading(true);
    try {
      // Criar cópia do conjunto
      const { data: novoConjuntoData, error: conjuntoError } = await supabase
        .from('conjuntos_anuncio')
        .insert({
          nome: `${conjunto.nome} (Cópia)`,
          campanha_id: conjunto.campanha_id,
          ativo: conjunto.ativo
        })
        .select()
        .single();

      if (conjuntoError) throw conjuntoError;

      // Se o conjunto tem anúncios, duplicá-los também
      if (conjunto.anuncios && conjunto.anuncios.length > 0) {
        const anunciosDuplicados = conjunto.anuncios.map(anuncio => ({
          nome: anuncio.nome,
          tipo: anuncio.tipo,
          conjunto_anuncio_id: novoConjuntoData.id
        }));

        const { error: anunciosError } = await supabase
          .from('anuncios')
          .insert(anunciosDuplicados);

        if (anunciosError) throw anunciosError;
      }

      toast.success('Conjunto duplicado com sucesso!');
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao duplicar conjunto:', error);
      toast.error('Erro ao duplicar conjunto');
    } finally {
      setLoading(false);
    }
  };

  // ============= FUNÇÕES DE EXCLUSÃO =============
  const handleExcluirFunil = async (funilId: string, funilNome: string) => {
    if (!confirm(`Deseja realmente excluir o funil "${funilNome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('funis')
        .delete()
        .eq('id', funilId);

      if (error) throw error;

      toast.success('Funil excluído com sucesso!');
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao excluir funil:', error);
      if (error.code === '23503') {
        toast.error('Não é possível excluir este funil pois ele possui campanhas vinculadas');
      } else {
        toast.error('Erro ao excluir funil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirCampanha = async (campanhaId: string, campanhaNome: string) => {
    if (!confirm(`Deseja realmente excluir a campanha "${campanhaNome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', campanhaId);

      if (error) throw error;

      toast.success('Campanha excluída com sucesso!');
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao excluir campanha:', error);
      if (error.code === '23503') {
        toast.error('Não é possível excluir esta campanha pois ela possui conjuntos vinculados');
      } else {
        toast.error('Erro ao excluir campanha');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirConjunto = async (conjuntoId: string, conjuntoNome: string) => {
    if (!confirm(`Deseja realmente excluir o conjunto "${conjuntoNome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('conjuntos_anuncio')
        .delete()
        .eq('id', conjuntoId);

      if (error) throw error;

      toast.success('Conjunto excluído com sucesso!');
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao excluir conjunto:', error);
      if (error.code === '23503') {
        toast.error('Não é possível excluir este conjunto pois ele possui anúncios vinculados');
      } else {
        toast.error('Erro ao excluir conjunto');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExcluirAnuncio = async (anuncioId: string, anuncioNome: string) => {
    if (!confirm(`Deseja realmente excluir o anúncio "${anuncioNome}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('anuncios')
        .delete()
        .eq('id', anuncioId);

      if (error) throw error;

      toast.success('Anúncio excluído com sucesso!');
      carregarFunis();
    } catch (error: any) {
      console.error('Erro ao excluir anúncio:', error);
      toast.error('Erro ao excluir anúncio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutComFunis>
      <div className={`min-h-screen p-6 ${isClean ? 'bg-gray-50' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isClean ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-purple-600 to-pink-600'}`}>
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isClean ? 'text-gray-900' : 'text-white'}`}>Painel Administrativo</h1>
                <p className={isClean ? 'text-gray-500' : 'text-gray-400'}>Gerencie usuários, funis e campanhas</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className={isClean ? 'bg-white border border-gray-200 shadow-sm' : 'bg-gray-800/50 border border-gray-700'}>
              <TabsTrigger value="usuarios" className={isClean ? 'data-[state=active]:bg-amber-600 data-[state=active]:text-white' : 'data-[state=active]:bg-purple-600'}>
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="funis" className={isClean ? 'data-[state=active]:bg-amber-600 data-[state=active]:text-white' : 'data-[state=active]:bg-cyan-600'}>
                <Layers className="h-4 w-4 mr-2" />
                Funis
              </TabsTrigger>
              <TabsTrigger value="aparencia" className={isClean ? 'data-[state=active]:bg-amber-600 data-[state=active]:text-white' : 'data-[state=active]:bg-pink-600'}>
                <Palette className="h-4 w-4 mr-2" />
                Aparência
              </TabsTrigger>
              <TabsTrigger value="configuracoes" className={isClean ? 'data-[state=active]:bg-amber-600 data-[state=active]:text-white' : 'data-[state=active]:bg-gray-600'}>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </TabsTrigger>
            </TabsList>

            {/* Tab: Usuários */}
            <TabsContent value="usuarios" className="space-y-4">
              <Card className={isClean ? 'bg-white border border-gray-200/60 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                        <Users className="h-5 w-5" />
                        Gerenciar Usuários
                      </CardTitle>
                      <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                        Crie e gerencie usuários do sistema
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => carregarUsuarios()}
                        variant="outline"
                        className={isClean ? 'border-gray-200' : 'border-gray-600'}
                        disabled={loading}
                      >
                        {loading ? 'Carregando...' : 'Recarregar'}
                      </Button>
                      <Button
                        onClick={() => setModalUsuarioAberto(true)}
                        className={isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Usuário
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className={`absolute left-3 top-3 h-4 w-4 ${isClean ? 'text-gray-400' : 'text-gray-400'}`} />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-10 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-600 text-white'}`}
                    />
                  </div>

                  {/* Debug Info */}
                  <div className="text-xs text-gray-500">
                    Total de usuários: {usuarios.length}
                  </div>

                  {/* User List */}
                  <div className="grid gap-3">
                    {usuarios.length === 0 ? (
                      <div className={`text-center py-8 ${isClean ? 'text-gray-400' : 'text-gray-400'}`}>
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum usuário encontrado</p>
                        <p className="text-xs mt-1">Clique em "Novo Usuário" para adicionar</p>
                      </div>
                    ) : (
                      usuarios
                        .filter((usuario) => 
                          usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((usuario) => {
                          const IconRole = roleIcons[usuario.role];
                          return (
                            <div
                              key={usuario.id}
                              className={`rounded-lg p-4 transition-colors ${isClean ? 'bg-gray-50 border border-gray-200 hover:border-gray-300' : 'bg-gray-900/50 border border-gray-700 hover:border-gray-600'}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isClean ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-purple-600 to-pink-600'}`}>
                                    <IconRole className="h-5 w-5 text-white" />
                                  </div>
                              <div>
                                <h4 className={`font-medium ${isClean ? 'text-gray-900' : 'text-white'}`}>{usuario.nome}</h4>
                                <p className={`text-sm ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>{usuario.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={roleColors[usuario.role]}>
                                {roleLabels[usuario.role]}
                              </Badge>
                              <Badge 
                                variant={usuario.ativo ? 'default' : 'secondary'}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleToggleAtivo(usuario.id, usuario.ativo)}
                              >
                                {usuario.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className={isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}
                                onClick={() => handleEditarUsuario(usuario)}
                                disabled={loading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleExcluirUsuario(usuario.id, usuario.nome)}
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    }))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Funis */}
            <TabsContent value="funis" className="space-y-4">
              <Card className={isClean ? 'bg-white border border-gray-200/60 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                        <Layers className="h-5 w-5" />
                        Gerenciar Funis
                      </CardTitle>
                      <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                        Crie e organize seus funis de vendas
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => setModalFunilAberto(true)}
                        className={isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Funil
                      </Button>
                      <Button
                        onClick={() => {
                          setFunilSelecionadoParaCampanha('');
                          setNovaCampanha({ nome: '', funil_id: '' });
                          setModalCampanhaAberto(true);
                        }}
                        className={isClean ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Campanha
                      </Button>
                      <Button
                        onClick={() => {
                          setCampanhaSelecionadaParaConjunto('');
                          setModalConjuntoAberto(true);
                        }}
                        className={isClean ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Conjunto
                      </Button>
                      <Button
                        onClick={() => {
                          setConjuntoSelecionadoParaAnuncio('');
                          setModalAnuncioAberto(true);
                        }}
                        className={isClean ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Anúncio
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {funis.map((funil) => {
                      const isExpanded = funisExpandidos.has(funil.id);
                      const campanhasDeste = campanhasPorFunil[funil.id] || [];
                      
                      return (
                        <div key={funil.id} className="space-y-2">
                          <div
                            className={`rounded-lg p-4 transition-colors cursor-pointer ${isClean ? 'bg-gray-50 border border-gray-200 hover:border-amber-300' : 'bg-gray-900/50 border border-gray-700 hover:border-orange-600/50'}`}
                            onClick={() => toggleFunil(funil.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-gray-400"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFunil(funil.id);
                                  }}
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <div>
                                  <h4 className={`font-medium flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                                    <Layers className={isClean ? 'h-4 w-4 text-amber-600' : 'h-4 w-4 text-cyan-400'} />
                                    {funil.nome}
                                  </h4>
                                  {funil.descricao && (
                                    <p className={`text-sm mt-1 ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>{funil.descricao}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className={`text-xs ${isClean ? 'text-gray-600 border-gray-300' : 'text-gray-300 border-gray-600'}`}>
                                      {funil.campanhas_count} campanhas
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className={isClean ? 'text-amber-600 hover:text-amber-700' : 'text-cyan-400 hover:text-cyan-300'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFunilSelecionadoParaCampanha(funil.id);
                                    setNovaCampanha({ nome: '', funil_id: funil.id });
                                    setModalCampanhaAberto(true);
                                  }}
                                  title="Adicionar campanha neste funil"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className={isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarFunil(funil);
                                  }}
                                  title="Editar funil"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-400 hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExcluirFunil(funil.id, funil.nome);
                                  }}
                                  title="Excluir funil"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Campanhas do funil */}
                          {isExpanded && campanhasDeste.length > 0 && (
                            <div className={`ml-8 space-y-2 border-l-2 pl-4 ${isClean ? 'border-amber-200' : 'border-orange-600/30'}`}>
                              {campanhasDeste.map((campanha) => {
                                const campanhaExpandida = campanhasExpandidas.has(campanha.id);
                                const temConjuntos = campanha.conjuntos_anuncio && campanha.conjuntos_anuncio.length > 0;
                                
                                return (
                                  <div key={campanha.id}>
                                    <div
                                      className={`rounded-lg p-3 transition-colors cursor-pointer ${isClean ? 'bg-white border border-gray-200 hover:border-blue-300 shadow-sm' : 'bg-gray-900/30 border border-gray-700/50 hover:border-blue-600/50'}`}
                                      onClick={() => toggleCampanha(campanha.id)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {temConjuntos && (
                                            campanhaExpandida ? 
                                              <ChevronDown className="h-3 w-3 text-gray-400" /> : 
                                              <ChevronRight className="h-3 w-3 text-gray-400" />
                                          )}
                                          <h5 className={`text-sm font-medium flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                                            <Target className="h-3 w-3 text-blue-400" />
                                            {campanha.nome}
                                          </h5>
                                          {temConjuntos && (
                                            <span className="text-xs text-gray-500">
                                              ({campanha.conjuntos_anuncio?.length || 0} conjuntos)
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="text-green-400 hover:text-green-300 h-6 w-6 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setCampanhaSelecionadaParaConjunto(campanha.id);
                                              setModalConjuntoAberto(true);
                                            }}
                                            title="Adicionar conjunto"
                                          >
                                            <Plus className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className={`h-6 w-6 p-0 ${isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleEditarCampanha(campanha);
                                            }}
                                            title="Editar campanha"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleExcluirCampanha(campanha.id, campanha.nome);
                                            }}
                                            title="Excluir campanha"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Conjuntos da campanha */}
                                    {campanhaExpandida && temConjuntos && (
                                      <div className={`ml-6 mt-2 space-y-2 border-l-2 pl-4 ${isClean ? 'border-blue-200' : 'border-blue-600/30'}`}>
                                        {campanha.conjuntos_anuncio!.map((conjunto) => {
                                          const conjuntoExpandido = conjuntosExpandidos.has(conjunto.id);
                                          const temAnuncios = conjunto.anuncios && conjunto.anuncios.length > 0;
                                          
                                          return (
                                            <div key={conjunto.id}>
                                              <div 
                                                className={`rounded-md p-2 transition-colors cursor-pointer ${isClean ? 'bg-gray-50 border border-gray-200 hover:border-green-300' : 'bg-gray-900/20 border border-gray-700/30 hover:border-green-600/40'}`}
                                                onClick={() => toggleConjunto(conjunto.id)}
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    {temAnuncios && (
                                                      conjuntoExpandido ? 
                                                        <ChevronDown className="h-2.5 w-2.5 text-gray-400" /> : 
                                                        <ChevronRight className="h-2.5 w-2.5 text-gray-400" />
                                                    )}
                                                    <Users className="h-3 w-3 text-green-400" />
                                                    <span className={`text-xs ${isClean ? 'text-gray-900' : 'text-white'}`}>{conjunto.nome}</span>
                                                    {temAnuncios && (
                                                      <span className="text-xs text-gray-500">
                                                        ({conjunto.anuncios?.length || 0} anúncios)
                                                      </span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-5 w-5 p-0 text-purple-400 hover:text-purple-300"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConjuntoSelecionadoParaAnuncio(conjunto.id);
                                                        setModalAnuncioAberto(true);
                                                      }}
                                                      title="Adicionar anúncio"
                                                    >
                                                      <Plus className="h-2.5 w-2.5" />
                                                    </Button>
                                                    {conjunto.ativo !== undefined && (
                                                      <Badge variant={conjunto.ativo ? 'default' : 'secondary'} className="text-xs h-5">
                                                        {conjunto.ativo ? 'Ativo' : 'Inativo'}
                                                      </Badge>
                                                    )}
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-5 w-5 p-0 text-blue-400 hover:text-blue-300"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDuplicarConjunto(conjunto);
                                                      }}
                                                      title="Duplicar conjunto"
                                                    >
                                                      <Copy className="h-2.5 w-2.5" />
                                                    </Button>
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className={`h-5 w-5 p-0 ${isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditarConjunto(conjunto);
                                                      }}
                                                      title="Editar conjunto"
                                                    >
                                                      <Edit className="h-2.5 w-2.5" />
                                                    </Button>
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExcluirConjunto(conjunto.id, conjunto.nome);
                                                      }}
                                                      title="Excluir conjunto"
                                                    >
                                                      <Trash2 className="h-2.5 w-2.5" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Anúncios do conjunto */}
                                              {conjuntoExpandido && temAnuncios && (
                                                <div className={`ml-4 mt-1 space-y-1 border-l-2 pl-3 ${isClean ? 'border-green-200' : 'border-green-600/30'}`}>
                                                  {conjunto.anuncios!.map((anuncio) => (
                                                    <div 
                                                      key={anuncio.id}
                                                      className={`rounded p-1.5 transition-colors ${isClean ? 'bg-white border border-gray-200 hover:border-purple-300' : 'bg-gray-900/10 border border-gray-700/20 hover:border-purple-600/40'}`}
                                                    >
                                                      <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                          <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                                                          <span className={`text-xs ${isClean ? 'text-gray-900' : 'text-white'}`}>{anuncio.nome}</span>
                                                          {anuncio.tipo && (
                                                            <Badge variant="outline" className="text-xs h-4 px-1">
                                                              {anuncio.tipo}
                                                            </Badge>
                                                          )}
                                                        </div>
                                                        <div className="flex items-center gap-0.5">
                                                          <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className={`h-4 w-4 p-0 ${isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                          >
                                                            <Edit className="h-2 w-2" />
                                                          </Button>
                                                          <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleExcluirAnuncio(anuncio.id, anuncio.nome);
                                                            }}
                                                            title="Excluir anúncio"
                                                          >
                                                            <Trash2 className="h-2 w-2" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty state */}
                  {funis.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Layers className={`h-12 w-12 mx-auto mb-4 ${isClean ? 'text-gray-300' : 'text-gray-600'}`} />
                      <p className={`mb-4 ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum funil cadastrado</p>
                      <Button
                        onClick={() => setModalFunilAberto(true)}
                        className={isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Funil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Aparência */}
            <TabsContent value="aparencia" className="space-y-4">
              <Card className={`admin-card ${isClean ? 'bg-white border border-gray-200/60 shadow-sm' : 'bg-gray-800/50 border-gray-700'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`admin-card-title flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                        <Palette className="h-5 w-5" />
                        Tema do Painel
                      </CardTitle>
                      <CardDescription className={`admin-card-desc ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>
                        Escolha entre o tema escuro ou claro
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">

                    {/* Tema Dark */}
                    <button
                      onClick={() => {
                        setTheme('dark');
                        toast.success('Tema alterado para Dark');
                      }}
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                        theme === 'dark' 
                          ? 'border-purple-500 shadow-xl shadow-purple-500/20 scale-[1.02]' 
                          : 'border-gray-700 hover:border-gray-500 hover:shadow-lg'
                      }`}
                    >
                      <div className="aspect-[16/10] bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 p-6 relative overflow-hidden">
                        <div className="absolute top-3 right-3 flex space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse animation-delay-200"></div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 w-16 bg-purple-600/60 rounded-full"></div>
                          <div className="space-y-1.5">
                            <div className="h-2 bg-gray-700 rounded w-full"></div>
                            <div className="h-2 bg-gray-700/60 rounded w-3/4"></div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="h-10 bg-gray-800/80 rounded-lg border border-gray-700/50">
                              <div className="h-1 mx-2 mt-3 bg-cyan-500/30 rounded-full"></div>
                            </div>
                            <div className="h-10 bg-gray-800/80 rounded-lg border border-gray-700/50">
                              <div className="h-1 mx-2 mt-3 bg-purple-500/30 rounded-full"></div>
                            </div>
                            <div className="h-10 bg-gray-800/80 rounded-lg border border-gray-700/50">
                              <div className="h-1 mx-2 mt-3 bg-emerald-500/30 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-950">
                        <h3 className="font-bold text-white flex items-center gap-2 text-base">
                          Dark
                          {theme === 'dark' && (
                            <Badge className="bg-purple-600 text-xs">Ativo</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          Sofisticado e tecnológico
                        </p>
                      </div>
                    </button>

                    {/* Tema Clean */}
                    <button
                      onClick={() => {
                        setTheme('clean');
                        toast.success('Tema alterado para Clean');
                      }}
                      className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                        theme === 'clean' 
                          ? 'border-rose-400 shadow-xl shadow-rose-400/20 scale-[1.02]' 
                          : 'border-gray-700 hover:border-gray-500 hover:shadow-lg'
                      }`}
                    >
                      <div className="aspect-[16/10] bg-gradient-to-br from-stone-50 via-rose-50/50 to-orange-50/30 p-6 relative overflow-hidden">
                        <div className="absolute top-3 right-3 flex space-x-1">
                          <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        </div>
                        <div className="space-y-3">
                          <div className="h-3 w-16 bg-rose-400/40 rounded-full"></div>
                          <div className="space-y-1.5">
                            <div className="h-2 bg-stone-200/80 rounded w-full"></div>
                            <div className="h-2 bg-stone-200/50 rounded w-3/4"></div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-4">
                            <div className="h-10 bg-white rounded-lg border border-stone-200 shadow-sm">
                              <div className="h-1 mx-2 mt-3 bg-rose-300/50 rounded-full"></div>
                            </div>
                            <div className="h-10 bg-white rounded-lg border border-stone-200 shadow-sm">
                              <div className="h-1 mx-2 mt-3 bg-amber-300/50 rounded-full"></div>
                            </div>
                            <div className="h-10 bg-white rounded-lg border border-stone-200 shadow-sm">
                              <div className="h-1 mx-2 mt-3 bg-rose-200/50 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white border-t border-stone-100">
                        <h3 className="font-bold text-stone-800 flex items-center gap-2 text-base">
                          Clean
                          {theme === 'clean' && (
                            <Badge className="bg-rose-500 text-white text-xs">Ativo</Badge>
                          )}
                        </h3>
                        <p className="text-sm text-stone-500 mt-1">
                          Elegante e sofisticado
                        </p>
                      </div>
                    </button>

                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Campanhas */}
            <TabsContent value="campanhas" className="space-y-4">
              <Card className={isClean ? 'bg-white border border-gray-200/60 shadow-sm' : 'bg-gray-800/50 border-gray-700'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                        <Target className="h-5 w-5" />
                        Gerenciar Campanhas
                      </CardTitle>
                      <CardDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
                        Crie e gerencie campanhas de marketing
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setModalCampanhaAberto(true)}
                      className={isClean ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Campanha
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {/* Mock data */}
                    {[
                      { id: '1', nome: 'Campanha Black Friday', funil_nome: 'Funil Contínuo', ativa: true },
                      { id: '2', nome: 'Lançamento Produto X', funil_nome: 'Cursos', ativa: true },
                      { id: '3', nome: 'Lead Magnet eBook', funil_nome: 'Iscas Gratuitas', ativa: false },
                    ].map((campanha) => (
                      <div
                        key={campanha.id}
                        className={`rounded-lg p-4 transition-colors ${isClean ? 'bg-gray-50 border border-gray-200 hover:border-blue-300' : 'bg-gray-900/50 border border-gray-700 hover:border-blue-600/50'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className={`font-medium flex items-center gap-2 ${isClean ? 'text-gray-900' : 'text-white'}`}>
                              <Target className="h-4 w-4 text-blue-400" />
                              {campanha.nome}
                            </h4>
                            <p className={`text-sm mt-1 ${isClean ? 'text-gray-500' : 'text-gray-400'}`}>
                              Funil: {campanha.funil_nome}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={campanha.ativa ? 'default' : 'secondary'}>
                              {campanha.ativa ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Button size="sm" variant="ghost" className={isClean ? 'text-gray-400 hover:text-gray-700' : 'text-gray-400 hover:text-white'}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Configurações */}
            <TabsContent value="configuracoes" className="space-y-4">
              {/* Integração Meta Ads */}
              <MetaIntegrationCard />

              {/* Integração Typebot */}
              <TypebotIntegrationCard />

              {/* Integração Kommo CRM */}
              <KommoIntegrationCard />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal Criar Usuário */}
      {modalUsuarioAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 max-w-md w-full ${isClean ? 'bg-white border border-gray-200 shadow-lg' : 'bg-gray-900 border border-gray-700'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>Criar Novo Usuário</h3>
            <div className="space-y-4">
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome Completo</Label>
                <Input
                  value={novoUsuario.nome}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Email</Label>
                <Input
                  type="email"
                  value={novoUsuario.email}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Senha</Label>
                <Input
                  type="password"
                  value={novoUsuario.senha}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Função</Label>
                <select
                  value={novoUsuario.role}
                  onChange={(e) => setNovoUsuario({ ...novoUsuario, role: e.target.value as UserRole })}
                  className={`w-full px-3 py-2 rounded border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                >
                  <option value="admin">Administrador - Acesso Total</option>
                  <option value="trafego">Tráfego - Apenas Dashboard Tráfego</option>
                  <option value="sdr">SDR - Apenas Dashboard SDR</option>
                  <option value="closer">Closer - Apenas Dashboard Closer</option>
                  <option value="social-seller">Social Seller - Apenas Dashboard Social Seller</option>
                  <option value="cs">Customer Success - Apenas Dashboard CS</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setModalUsuarioAberto(false)}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarUsuario}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Funil */}
      {modalFunilAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 max-w-md w-full ${isClean ? 'bg-white border border-gray-200 shadow-lg' : 'bg-gray-900 border border-gray-700'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>Criar Novo Funil</h3>
            <div className="space-y-4">
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome do Funil</Label>
                <Input
                  value={novoFunil.nome}
                  onChange={(e) => setNovoFunil({ ...novoFunil, nome: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="Ex: Funil de Vendas"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Descrição (opcional)</Label>
                <textarea
                  value={novoFunil.descricao}
                  onChange={(e) => setNovoFunil({ ...novoFunil, descricao: e.target.value })}
                  className={`w-full px-3 py-2 rounded h-24 border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                  placeholder="Descreva o objetivo deste funil..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setModalFunilAberto(false)}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarFunil}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
              >
                {loading ? 'Criando...' : 'Criar Funil'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Campanha */}
      {modalCampanhaAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg p-6 max-w-md w-full ${isClean ? 'bg-white border border-gray-200 shadow-lg' : 'bg-gray-900 border border-gray-700'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>Criar Nova Campanha</h3>
            <div className="space-y-4">
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome da Campanha</Label>
                <Input
                  value={novaCampanha.nome}
                  onChange={(e) => setNovaCampanha({ ...novaCampanha, nome: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="Ex: Black Friday 2024"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Funil</Label>
                <select
                  value={novaCampanha.funil_id}
                  onChange={(e) => setNovaCampanha({ ...novaCampanha, funil_id: e.target.value })}
                  className={`w-full px-3 py-2 rounded border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                >
                  <option value="">Selecione um funil</option>
                  {funis.map(funil => (
                    <option key={funil.id} value={funil.id}>{funil.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setModalCampanhaAberto(false)}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarCampanha}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Conjunto de Anúncio */}
      {modalConjuntoAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className={`rounded-lg p-6 max-w-md w-full ${isClean ? 'bg-white border border-gray-200 shadow-lg' : 'bg-gray-900 border border-gray-700'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>Criar Novo Conjunto de Anúncio</h3>
            <div className="space-y-4">
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Campanha</Label>
                <select
                  value={campanhaSelecionadaParaConjunto}
                  onChange={(e) => setCampanhaSelecionadaParaConjunto(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                >
                  <option value="">Selecione uma campanha</option>
                  {campanhas.map(campanha => (
                    <option key={campanha.id} value={campanha.id}>{campanha.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome do Conjunto</Label>
                <Input
                  value={novoConjunto.nome}
                  onChange={(e) => setNovoConjunto({ ...novoConjunto, nome: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="Ex: Conjunto Black Friday"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setModalConjuntoAberto(false)}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarConjunto}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {loading ? 'Criando...' : 'Criar Conjunto'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Anúncio */}
      {modalAnuncioAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className={`rounded-lg p-6 max-w-md w-full ${isClean ? 'bg-white border border-gray-200 shadow-lg' : 'bg-gray-900 border border-gray-700'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isClean ? 'text-gray-900' : 'text-white'}`}>Criar Novo Anúncio</h3>
            <div className="space-y-4">
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Campanha</Label>
                <select
                  value={campanhaSelecionadaParaAnuncio}
                  onChange={(e) => {
                    setCampanhaSelecionadaParaAnuncio(e.target.value);
                    setConjuntoSelecionadoParaAnuncio(''); // Limpar conjunto ao mudar campanha
                  }}
                  className={`w-full px-3 py-2 rounded border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                >
                  <option value="">Selecione uma campanha</option>
                  {campanhas.map(campanha => (
                    <option key={campanha.id} value={campanha.id}>{campanha.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Conjunto de Anúncio</Label>
                <select
                  value={conjuntoSelecionadoParaAnuncio}
                  onChange={(e) => setConjuntoSelecionadoParaAnuncio(e.target.value)}
                  className={`w-full px-3 py-2 rounded border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                  disabled={!campanhaSelecionadaParaAnuncio}
                >
                  <option value="">Selecione um conjunto</option>
                  {campanhas
                    .filter(c => c.id === campanhaSelecionadaParaAnuncio)
                    .flatMap(c => c.conjuntos_anuncio || [])
                    .map(conjunto => (
                      <option key={conjunto.id} value={conjunto.id}>{conjunto.nome}</option>
                    ))}
                </select>
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome do Anúncio</Label>
                <Input
                  value={novoAnuncio.nome}
                  onChange={(e) => setNovoAnuncio({ ...novoAnuncio, nome: e.target.value })}
                  className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}
                  placeholder="Ex: Banner Black Friday"
                />
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Tipo (opcional)</Label>
                <select
                  value={novoAnuncio.tipo}
                  onChange={(e) => setNovoAnuncio({ ...novoAnuncio, tipo: e.target.value })}
                  className={`w-full px-3 py-2 rounded border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                >
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                  <option value="carousel">Carrossel</option>
                </select>
              </div>
              <div>
                <Label className={isClean ? 'text-gray-700' : 'text-gray-300'}>Criativo (Imagem/Vídeo)</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isClean ? 'border-gray-300 hover:border-gray-400' : 'border-gray-600 hover:border-gray-500'}`}
                  onPaste={(e) => {
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const blob = items[i].getAsFile();
                        if (blob) {
                          setNovoAnuncio({ ...novoAnuncio, arquivo: blob });
                          toast.success('Imagem colada com sucesso!');
                        }
                      }
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setNovoAnuncio({ ...novoAnuncio, arquivo: file });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <input
                    type="file"
                    id="arquivo-anuncio"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNovoAnuncio({ ...novoAnuncio, arquivo: file });
                      }
                    }}
                  />
                  {novoAnuncio.arquivo ? (
                    <div className="space-y-2">
                      {novoAnuncio.arquivo.type.startsWith('image/') && (
                        <img 
                          src={URL.createObjectURL(novoAnuncio.arquivo)} 
                          alt="Preview" 
                          className="max-h-32 mx-auto rounded"
                        />
                      )}
                      <p className="text-sm text-gray-400">{novoAnuncio.arquivo.name}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNovoAnuncio({ ...novoAnuncio, arquivo: null })}
                        className="text-xs"
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-400 text-sm">Arraste uma imagem ou</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById('arquivo-anuncio')?.click()}
                      >
                        Escolher Arquivo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">Ou pressione Ctrl+V para colar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setModalAnuncioAberto(false)}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarAnuncio}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-purple-500 hover:bg-purple-600' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {loading ? 'Criando...' : 'Criar Anúncio'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar Usuário */}
      <Dialog open={modalUsuarioAberto} onOpenChange={setModalUsuarioAberto}>
        <DialogContent className={`max-w-md ${isClean ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className={isClean ? 'h-5 w-5 text-amber-600' : 'h-5 w-5 text-purple-400'} />
              Criar Novo Usuário
            </DialogTitle>
            <DialogDescription className={isClean ? 'text-gray-500' : 'text-gray-400'}>
              Preencha os dados do novo usuário do sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                placeholder="Igor Macedo"
                value={novoUsuario.nome}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })}
                className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-600 text-white'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="igorwillian.macedo@gmail.com"
                value={novoUsuario.email}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
                className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-600 text-white'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novoUsuario.senha}
                onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
                className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-600 text-white'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Select
                value={novoUsuario.role}
                onValueChange={(value) => setNovoUsuario({ ...novoUsuario, role: value as UserRole })}
              >
                <SelectTrigger className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-600 text-white'}>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                  <SelectItem value="admin" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Administrador - Acesso Total
                  </SelectItem>
                  <SelectItem value="gestor" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Gestor de Marketing
                  </SelectItem>
                  <SelectItem value="sdr" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    SDR
                  </SelectItem>
                  <SelectItem value="closer" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Closer
                  </SelectItem>
                  <SelectItem value="social-seller" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Social Seller
                  </SelectItem>
                  <SelectItem value="cs" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Customer Success
                  </SelectItem>
                  <SelectItem value="trafego" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Tráfego Pago
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setModalUsuarioAberto(false)}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarUsuario}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {loading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Usuário */}
      <Dialog open={modalEditarUsuarioAberto} onOpenChange={setModalEditarUsuarioAberto}>
        <DialogContent className={isClean ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isClean ? 'text-amber-600' : 'text-purple-400'}`}>
              Editar Usuário
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium mb-2">Nome Completo</label>
              <input
                type="text"
                value={usuarioEditando?.nome || ''}
                onChange={(e) => setUsuarioEditando(prev => 
                  prev ? { ...prev, nome: e.target.value } : null
                )}
                className={`w-full p-3 rounded-lg border ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
                placeholder="Digite o nome completo"
              />
            </div>

            {/* E-mail (somente leitura) */}
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                value={usuarioEditando?.email || ''}
                disabled
                className={`w-full p-3 rounded-lg border cursor-not-allowed ${isClean ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-gray-700 border-gray-600 text-gray-400'}`}
              />
              <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
            </div>

            {/* Função */}
            <div>
              <label className="block text-sm font-medium mb-2">Função</label>
              <Select
                value={usuarioEditando?.role || ''}
                onValueChange={(value) => setUsuarioEditando(prev => 
                  prev ? { ...prev, role: value as Usuario['role'] } : null
                )}
              >
                <SelectTrigger className={isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-900 border-gray-600 text-white'}>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent className={isClean ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'}>
                  <SelectItem value="admin" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Administrador - Acesso Total
                  </SelectItem>
                  <SelectItem value="gestor" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Gestor de Marketing
                  </SelectItem>
                  <SelectItem value="sdr" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    SDR
                  </SelectItem>
                  <SelectItem value="closer" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Closer
                  </SelectItem>
                  <SelectItem value="social-seller" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    Social Seller
                  </SelectItem>
                  <SelectItem value="cs" className={isClean ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-gray-700'}>
                    CS - Customer Success
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Ativo */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isClean ? 'bg-gray-50' : 'bg-gray-800'}`}>
              <input
                type="checkbox"
                id="ativo-edit"
                checked={usuarioEditando?.ativo || false}
                onChange={(e) => setUsuarioEditando(prev => 
                  prev ? { ...prev, ativo: e.target.checked } : null
                )}
                className={`w-4 h-4 rounded ${isClean ? 'text-amber-600 bg-white border-gray-300 focus:ring-amber-600' : 'text-purple-600 bg-gray-700 border-gray-600 focus:ring-purple-500'}`}
              />
              <label htmlFor="ativo-edit" className="text-sm font-medium cursor-pointer">
                Usuário Ativo
              </label>
            </div>

            {/* Nota sobre senha */}
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ Para alterar a senha, entre em contato com o suporte ou use a opção de reset de senha no login.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setModalEditarUsuarioAberto(false);
                  setUsuarioEditando(null);
                }}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleSalvarEdicao()}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Funil */}
      <Dialog open={modalEditarFunilAberto} onOpenChange={setModalEditarFunilAberto}>
        <DialogContent className={isClean ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isClean ? 'text-amber-600' : 'text-cyan-400'}`}>
              Editar Funil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome-funil" className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome do Funil</Label>
              <Input
                id="edit-nome-funil"
                value={funilEditando?.nome || ''}
                onChange={(e) => setFunilEditando(prev => prev ? {...prev, nome: e.target.value} : null)}
                placeholder="Ex: Funil de Vendas"
                className={`mt-2 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div>
              <Label htmlFor="edit-descricao-funil" className={isClean ? 'text-gray-700' : 'text-gray-300'}>Descrição (opcional)</Label>
              <Input
                id="edit-descricao-funil"
                value={funilEditando?.descricao || ''}
                onChange={(e) => setFunilEditando(prev => prev ? {...prev, descricao: e.target.value} : null)}
                placeholder="Breve descrição do funil"
                className={`mt-2 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setModalEditarFunilAberto(false);
                  setFunilEditando(null);
                }}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarEdicaoFunil}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'}`}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Campanha */}
      <Dialog open={modalEditarCampanhaAberto} onOpenChange={setModalEditarCampanhaAberto}>
        <DialogContent className={isClean ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isClean ? 'text-blue-500' : 'text-blue-400'}`}>
              Editar Campanha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome-campanha" className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome da Campanha</Label>
              <Input
                id="edit-nome-campanha"
                value={campanhaEditando?.nome || ''}
                onChange={(e) => setCampanhaEditando(prev => prev ? {...prev, nome: e.target.value} : null)}
                placeholder="Ex: Campanha Black Friday"
                className={`mt-2 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div>
              <Label htmlFor="edit-tipo-campanha" className={isClean ? 'text-gray-700' : 'text-gray-300'}>Tipo (opcional)</Label>
              <Input
                id="edit-tipo-campanha"
                value={campanhaEditando?.tipo || ''}
                onChange={(e) => setCampanhaEditando(prev => prev ? {...prev, tipo: e.target.value} : null)}
                placeholder="Ex: Conversão, Tráfego"
                className={`mt-2 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div>
              <Label htmlFor="edit-plataforma-campanha" className={isClean ? 'text-gray-700' : 'text-gray-300'}>Plataforma (opcional)</Label>
              <Input
                id="edit-plataforma-campanha"
                value={campanhaEditando?.plataforma || ''}
                onChange={(e) => setCampanhaEditando(prev => prev ? {...prev, plataforma: e.target.value} : null)}
                placeholder="Ex: Facebook, Google"
                className={`mt-2 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isClean ? 'bg-gray-50' : 'bg-gray-800'}`}>
              <input
                type="checkbox"
                id="ativo-campanha-edit"
                checked={campanhaEditando?.ativo || false}
                onChange={(e) => setCampanhaEditando(prev => prev ? {...prev, ativo: e.target.checked} : null)}
                className={`w-4 h-4 rounded ${isClean ? 'text-blue-500 bg-white border-gray-300 focus:ring-blue-500' : 'text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500'}`}
              />
              <label htmlFor="ativo-campanha-edit" className="text-sm font-medium cursor-pointer">
                Campanha Ativa
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setModalEditarCampanhaAberto(false);
                  setCampanhaEditando(null);
                }}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarEdicaoCampanha}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Conjunto */}
      <Dialog open={modalEditarConjuntoAberto} onOpenChange={setModalEditarConjuntoAberto}>
        <DialogContent className={isClean ? 'bg-white border-gray-200 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isClean ? 'text-green-500' : 'text-green-400'}`}>
              Editar Conjunto de Anúncio
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome-conjunto" className={isClean ? 'text-gray-700' : 'text-gray-300'}>Nome do Conjunto</Label>
              <Input
                id="edit-nome-conjunto"
                value={conjuntoEditando?.nome || ''}
                onChange={(e) => setConjuntoEditando(prev => prev ? {...prev, nome: e.target.value} : null)}
                placeholder="Ex: Público Quente"
                className={`mt-2 ${isClean ? 'bg-white border-gray-200 text-gray-700' : 'bg-gray-800 border-gray-600 text-white'}`}
              />
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-lg ${isClean ? 'bg-gray-50' : 'bg-gray-800'}`}>
              <input
                type="checkbox"
                id="ativo-conjunto-edit"
                checked={conjuntoEditando?.ativo || false}
                onChange={(e) => setConjuntoEditando(prev => prev ? {...prev, ativo: e.target.checked} : null)}
                className={`w-4 h-4 rounded ${isClean ? 'text-green-500 bg-white border-gray-300 focus:ring-green-500' : 'text-green-600 bg-gray-700 border-gray-600 focus:ring-green-500'}`}
              />
              <label htmlFor="ativo-conjunto-edit" className="text-sm font-medium cursor-pointer">
                Conjunto Ativo
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setModalEditarConjuntoAberto(false);
                  setConjuntoEditando(null);
                }}
                variant="outline"
                className={`flex-1 ${isClean ? 'border-gray-200' : 'border-gray-600'}`}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarEdicaoConjunto}
                disabled={loading}
                className={`flex-1 ${isClean ? 'bg-green-500 hover:bg-green-600' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutComFunis>
  );
}
