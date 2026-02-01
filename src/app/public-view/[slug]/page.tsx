import { Metadata } from 'next';
import { createClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PublicClienteView from '@/components/public/PublicClienteView';

interface PageProps {
  params: Promise<{ slug: string; }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cliente } = await supabase.from('clientes').select('nome').eq('slug', slug).single();
  return { title: cliente ? `${cliente.nome} - Portal do Tráfego | Igor Macedo` : 'Cliente não encontrado', description: 'Dashboard público de métricas de tráfego pago' };
}

export default async function PublicClientePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  console.log(' SERVER: Buscando cliente por slug:', slug);
  const { data: cliente, error } = await supabase.from('clientes').select('id, nome, logo_url, slug, metricas_visiveis, empresa_id').eq('slug', slug).single();
  console.log(' SERVER: Resultado:', { cliente, error });
  if (error) { console.error(' SERVER: Erro detalhado:', JSON.stringify(error, null, 2)); }
  if (error || !cliente) { console.log(' SERVER: Cliente não encontrado!'); notFound(); }
  return <PublicClienteView cliente={cliente} />;
}