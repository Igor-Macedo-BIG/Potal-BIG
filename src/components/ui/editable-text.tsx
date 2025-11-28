'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'white' | 'gray' | 'purple' | 'gradient';
  editMode?: boolean;
}

export function EditableText({
  value,
  onChange,
  className,
  multiline = false,
  placeholder,
  size = 'md',
  weight = 'normal',
  color = 'white',
  editMode = false
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      case '4xl': return 'text-4xl';
      default: return 'text-base';
    }
  };

  const getWeightClasses = () => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'white': return 'text-white';
      case 'gray': return 'text-gray-300';
      case 'purple': return 'text-purple-300';
      case 'gradient': return 'bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent';
      default: return 'text-white';
    }
  };

  const baseClasses = cn(
    getSizeClasses(),
    getWeightClasses(),
    getColorClasses(),
    className
  );

  if (!editMode) {
    return <span className={baseClasses}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 w-full">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white resize-none"
            rows={3}
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        )}
        <div className="flex gap-1 mt-1">
          <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 p-1 h-8 w-8">
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleCancel} variant="outline" className="border-slate-600 p-1 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block w-full">
      <span className={baseClasses}>{value}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 absolute -right-8 top-0 p-1 h-6 w-6 text-slate-400 hover:text-white transition-opacity"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}