'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  onImageChange?: (src: string) => void;
  editMode?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  src,
  alt = '',
  width,
  height,
  className,
  onImageChange,
  editMode = false,
  placeholder = 'Clique para fazer upload da imagem'
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageChange?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  if (!editMode && src) {
    return (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height}
        className={cn("object-cover", className)} 
      />
    );
  }

  if (!editMode && !src) {
    return (
      <div 
        className={cn(
          "bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <Image className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">{placeholder}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
          dragOver 
            ? "border-purple-400 bg-purple-500/10" 
            : src 
            ? "border-slate-600 hover:border-slate-500" 
            : "border-slate-600 hover:border-purple-400 bg-slate-800/50",
          className
        )}
        style={{ width, height }}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => document.getElementById(`file-input-${Math.random()}`)?.click()}
      >
        {src ? (
          <>
            <img 
              src={src} 
              alt={alt} 
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Alterar imagem</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <Upload className={cn(
              "h-8 w-8 mb-2",
              dragOver ? "text-purple-400" : "text-slate-400"
            )} />
            <p className={cn(
              "text-sm",
              dragOver ? "text-purple-300" : "text-slate-400"
            )}>
              {dragOver ? "Solte a imagem aqui" : placeholder}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PNG, JPG, GIF até 5MB
            </p>
          </div>
        )}
      </div>

      <input
        id={`file-input-${Math.random()}`}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {src && editMode && (
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onImageChange?.('');
          }}
          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 h-6 w-6"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}