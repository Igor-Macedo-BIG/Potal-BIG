'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import CriarPortalDialog from '@/components/portais/CriarPortalDialog';
import { Copy, Edit, Trash2, Plus, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Portal {
  id: string;
  cliente_id: string;
  titulo: string;
  slug: string;
  visualizacoes: number;
  ativo: boolean;
  data_expiracao: string | null;
  clientes: {
    nome: string;
  };
  portal_campanhas: {
    campanha_id: string;
  }[];
}

export default function AdminPortais() {
  const [portais, setPortais] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    carregarPortais();
  }, []);

  const carregarPortais = async () => {
    try {
      const { data, error } = await supabase
        .from('portais_clientes')
        .select(`
          *,
          clientes (nome),
          portal_campanhas (campanha_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPortais(data || []);
    } catch (error) {
      console.error('Erro ao carregar portais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os portais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = (slug: string) => {
    const url = `${window.location.origin}/portal/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link copiado!',
      description: 'O link do portal foi copiado para a área de transferência.',
    });
  };

  const deletarPortal = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este portal?')) return;

    try {
      // Deletar relacionamentos primeiro
      await supabase.from('portal_campanhas').delete().eq('portal_id', id);

      // Deletar portal
      const { error } = await supabase.from('portais_clientes').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Portal deletado',
        description: 'O portal foi deletado com sucesso.',
      });

      carregarPortais();
    } catch (error) {
      console.error('Erro ao deletar portal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o portal.',
        variant: 'destructive',
      });
    }
  };

  const getStatusPortal = (portal: Portal) => {
    if (!portal.ativo) return <Badge variant="secondary">Inativo</Badge>;
    if (portal.data_expiracao && new Date(portal.data_expiracao) < new Date()) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Ativo</Badge>;
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Carregando portais...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Portais de Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os portais de acesso dos seus clientes
          </p>
        </div>
        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Portal
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Portais</CardTitle>
        </CardHeader>
        <CardContent>
          {portais.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum portal criado ainda. Clique em "Criar Portal" para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Campanhas</TableHead>
                  <TableHead>Visualizações</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portais.map((portal) => (
                  <TableRow key={portal.id}>
                    <TableCell className="font-medium">
                      {portal.clientes?.nome || 'N/A'}
                    </TableCell>
                    <TableCell>{portal.titulo}</TableCell>
                    <TableCell className="font-mono text-sm">{portal.slug}</TableCell>
                    <TableCell>{portal.portal_campanhas?.length || 0}</TableCell>
                    <TableCell>{portal.visualizacoes || 0}</TableCell>
                    <TableCell>{getStatusPortal(portal)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copiarLink(portal.slug)}
                          title="Copiar link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/portal/${portal.slug}`, '_blank')}
                          title="Abrir portal"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            toast({
                              title: 'Em desenvolvimento',
                              description: 'Funcionalidade de edição em breve.',
                            });
                          }}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletarPortal(portal.id)}
                          title="Deletar"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CriarPortalDialog
        aberto={dialogAberto}
        onFechar={() => setDialogAberto(false)}
        onSucesso={() => {
          setDialogAberto(false);
          carregarPortais();
        }}
      />
    </div>
  );
}
