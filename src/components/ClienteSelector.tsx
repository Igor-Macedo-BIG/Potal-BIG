'use client';

import { useCliente } from '@/contexts/ClienteContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { CopyPublicLinkButton } from '@/components/dashboard/CopyPublicLinkButton';

export default function ClienteSelector() {
  const { clienteSelecionado, clientes, selecionarCliente, loading } = useCliente();
  
  if (loading) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Building2 className='h-4 w-4 animate-pulse' />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Building2 className='h-4 w-4' />
        <span>Nenhum cliente cadastrado</span>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <Building2 className='h-4 w-4 text-muted-foreground' />
        <Select
          value={clienteSelecionado?.id || ''}
          onValueChange={(value) => {
            const cliente = clientes.find((c) => c.id === value);
            selecionarCliente(cliente || null);
          }}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Selecione um cliente' />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                {cliente.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {clienteSelecionado && clienteSelecionado.slug && (
        <div className='pl-7'>
          <CopyPublicLinkButton
            clienteSlug={clienteSelecionado.slug}
            clienteNome={clienteSelecionado.nome}
          />
        </div>
      )}
    </div>
  );
}