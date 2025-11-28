'use client';

import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';
import ModalEditarMetricasInteligente from '@/components/modals/ModalEditarMetricasInteligente';

interface BotaoEditarMetricasProps {
  campanhaId?: string;
  onMetricasSalvas?: () => void;
}

export default function BotaoEditarMetricas({ onMetricasSalvas }: BotaoEditarMetricasProps) {
  return (
    <ModalEditarMetricasInteligente 
      onMetricasAlteradas={onMetricasSalvas}
      trigger={
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
          <Edit3 className="h-4 w-4 mr-2" />
          Editar Métricas
        </Button>
      }
    />
  );
}