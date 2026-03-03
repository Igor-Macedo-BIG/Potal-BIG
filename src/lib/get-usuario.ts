/**
 * Helper para obter o usuário atual da tabela `usuarios`.
 * Admin pode não ter empresa_id — ele gerencia múltiplas empresas.
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface UsuarioInfo {
  empresa_id: string | null;
  role: string;
  is_admin: boolean;
}

export async function getOrCreateUsuario(
  supabase: SupabaseClient,
  sessionUserId: string,
  sessionEmail: string
): Promise<UsuarioInfo | null> {
  // 1. Tentar buscar usuário existente
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, role')
    .eq('id', sessionUserId)
    .single();

  if (usuario) {
    const isAdmin = usuario.role === 'admin';
    return { 
      empresa_id: usuario.empresa_id || null, 
      role: usuario.role || 'admin',
      is_admin: isAdmin
    };
  }

  // 2. Não encontrou em usuarios — tentar na tabela users
  const { data: user } = await supabase
    .from('users')
    .select('empresa_id, role')
    .eq('id', sessionUserId)
    .single();

  if (user) {
    // Auto-criar na tabela usuarios baseado no users
    await supabase.from('usuarios').upsert({
      id: sessionUserId,
      nome: sessionEmail.split('@')[0],
      email: sessionEmail,
      empresa_id: user.empresa_id,
      role: user.role || 'admin',
      ativo: true
    });

    const isAdmin = (user.role || 'admin') === 'admin';
    return { 
      empresa_id: user.empresa_id || null, 
      role: user.role || 'admin',
      is_admin: isAdmin
    };
  }

  // 3. Não encontrou em nenhum lugar — criar como admin sem empresa
  await supabase.from('usuarios').upsert({
    id: sessionUserId,
    nome: sessionEmail.split('@')[0],
    email: sessionEmail,
    role: 'admin',
    ativo: true
  });

  await supabase.from('users').upsert({
    id: sessionUserId,
    nome: sessionEmail.split('@')[0],
    email: sessionEmail,
    role: 'admin',
    ativo: true
  });

  return { empresa_id: null, role: 'admin', is_admin: true };
}

/**
 * Resolve o empresa_id efetivo para uma request.
 * Admin pode especificar via query param `empresa_id`.
 * Usuário normal usa o empresa_id da própria conta.
 */
export function resolveEmpresaId(usuario: UsuarioInfo, requestUrl: string): string | null {
  if (usuario.empresa_id) return usuario.empresa_id;
  if (usuario.is_admin) {
    try {
      const { searchParams } = new URL(requestUrl);
      return searchParams.get('empresa_id');
    } catch {
      return null;
    }
  }
  return null;
}
