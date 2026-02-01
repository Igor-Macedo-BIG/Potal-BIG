import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <FileQuestion className="h-24 w-24 text-purple-400" />
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Cliente não encontrado
        </h1>
        
        <p className="text-xl text-purple-300 mb-8 max-w-md mx-auto">
          O dashboard público que você está procurando não existe ou foi removido.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Home className="h-5 w-5" />
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
