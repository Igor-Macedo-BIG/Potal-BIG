/**
 * Helper para obter o usuário atual da tabela `usuarios`.
 * Se o usuário estiver autenticado mas não tiver registro na tabela,
 * cria automaticamente vinculado à primeira empresa disponível.
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface UsuarioInfo {
  empresa_id: string;
  role: string;
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

  if (usuario?.empresa_id) {
    return { empresa_id: usuario.empresa_id, role: usuario.role || 'admin' };
  }

  // 2. Não encontrou - buscar a primeira empresa disponível
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id')
    .limit(1)
    .single();

  if (!empresa) return null;

  // 3. Auto-criar o registro do usuário
  const { error } = await supabase
    .from('usuarios')
    .insert({
      id: sessionUserId,
      nome: sessionEmail.split('@')[0],
      email: sessionEmail,
      empresa_id: empresa.id,
      role: 'admin',
      ativo: true
    });

  if (error) {
    // Se falhou ao criar (ex: coluna role não existe), tentar sem role
    await supabase.from('usuarios').insert({
      id: sessionUserId,
      nome: sessionEmail.split('@')[0],
      email: sessionEmail,
      empresa_id: empresa.id,
      ativo: true
    });
  }

  return { empresa_id: empresa.id, role: 'admin' };
}
