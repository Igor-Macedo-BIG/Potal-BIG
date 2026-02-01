'use client';

import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopyPublicLinkButtonProps {
  clienteSlug: string;
  clienteNome: string;
}

export function CopyPublicLinkButton({ clienteSlug, clienteNome }: CopyPublicLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const publicUrl = `${window.location.origin}/public-view/${clienteSlug}`;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="gap-2 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20 text-purple-300"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Link Público
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copiar link público de {clienteNome}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
