import { PaginasManagerPublic } from '@/components/pages/PaginasManagerPublic';

interface PublicPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PublicPage({ params }: PublicPageProps) {
  const { id } = await params;
  return <PaginasManagerPublic pageId={id} />;
}

export async function generateStaticParams() {
  // Aqui você pode buscar todos os IDs das páginas do banco de dados
  // Por enquanto, retornamos alguns exemplos
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}