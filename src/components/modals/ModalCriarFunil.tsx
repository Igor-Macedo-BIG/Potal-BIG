'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Target, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Props {
  onFunilCriado?: () => void;
  trigger?: React.ReactNode;
}

export default function ModalCriarFunil({ onFunilCriado, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome do funil é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      // Conectar diretamente com o Supabase
      const { data: funil, error } = await supabase
        .from('funis')
        .insert({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          empresa_id: '550e8400-e29b-41d4-a716-446655440000', // ID da empresa padrão
        })
        .select()
        .single();

      if (error) {
        console.error('Erro do Supabase:', error);
        toast.error(`Erro ao criar funil: ${error.message}`);
        return;
      }

      toast.success(`Funil "${funil.nome}" criado com sucesso!`);
      setFormData({ nome: '', descricao: '' });
      setOpen(false);
      onFunilCriado?.();

    } catch (error) {
      console.error('Erro ao criar funil:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Funil
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            Criar Novo Funil
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Crie um novo funil para organizar suas campanhas de tráfego pago.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-gray-300">
              Nome do Funil *
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Masterclass de Vendas"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="text-gray-300">
              Descrição
            </Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o objetivo deste funil..."
              value={formData.descricao}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('descricao', e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400 min-h-[100px]"
              disabled={loading}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.nome.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <div className="flex items-center">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <span>Criar Funil</span>
              </div>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
