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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MetricasConfigurator } from '@/components/admin/MetricasConfigurator';

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  metricas_visiveis?: string[];
  created_at: string;
}

export default function AdminClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    metricas_visiveis: [] as string[],
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os clientes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const abrirDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditando(cliente);
      setFormData({
        nome: cliente.nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        metricas_visiveis: cliente.metricas_visiveis || [],
      });
    } else {
      setEditando(null);
      setFormData({ nome: '', email: '', telefone: '', metricas_visiveis: [] });
    }
    setDialogAberto(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome do cliente é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editando) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nome: formData.nome,
            email: formData.email || null,
            telefone: formData.telefone || null,
            metricas_visiveis: formData.metricas_visiveis,
          })
          .eq('id', editando.id);

        if (error) throw error;

        toast({
          title: 'Cliente atualizado',
          description: 'O cliente foi atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase.from('clientes').insert({
          nome: formData.nome,
          email: formData.email || null,
          telefone: formData.telefone || null,
          metricas_visiveis: formData.metricas_visiveis,
        });

        if (error) throw error;

        toast({
          title: 'Cliente criado',
          description: 'O cliente foi criado com sucesso.',
        });
      }

      setDialogAberto(false);
      carregarClientes();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o cliente.',
        variant: 'destructive',
      });
    }
  };

  const deletarCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cliente? Todos os dados vinculados serão removidos.')) {
      return;
    }

    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cliente deletado',
        description: 'O cliente foi deletado com sucesso.',
      });

      carregarClientes();
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o cliente.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Carregando clientes...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus clientes</p>
        </div>
        <Button onClick={() => abrirDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>{cliente.telefone || '-'}</TableCell>
                    <TableCell>
                      {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirDialog(cliente)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletarCliente(cliente.id)}
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

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <MetricasConfigurator
              value={formData.metricas_visiveis || {}}
              onChange={(config) => setFormData({ ...formData, metricas_visiveis: config })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editando ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
