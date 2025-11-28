'use client';

import { LayoutComFunis } from '@/components/layout/LayoutComFunis';
import { PaginasManagerEditor } from '@/components/pages/PaginasManagerEditor';
import { use } from 'react';

interface PaginaEditorProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function PaginaEditor({ params }: PaginaEditorProps) {
  const { slug } = use(params);
  
  return (
    <LayoutComFunis>
      <PaginasManagerEditor slug={slug} />
    </LayoutComFunis>
  );
}