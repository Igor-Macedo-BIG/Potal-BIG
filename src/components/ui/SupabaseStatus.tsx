'use client';

import { useEffect, useState } from 'react';

export default function SupabaseStatus() {
  const [reachable, setReachable] = useState<boolean | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    if (!supabaseUrl) {
      setReachable(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        // Tentar uma requisição simples para detectar falha de DNS/CONNECT
        const res = await fetch(supabaseUrl, { method: 'GET', mode: 'cors' });
        if (!cancelled) setReachable(res.ok);
      } catch (err) {
        if (!cancelled) setReachable(false);
      }
    };

    check();

    return () => { cancelled = true };
  }, [supabaseUrl]);

  if (reachable === null) return null; // ainda checando

  if (reachable) return null; // tudo certo, não mostrar banner

  return (
    <div className="mb-4 p-3 rounded-lg bg-red-900/60 border border-red-700 text-red-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-bold">Erro de Conectividade com Supabase</div>
          <div className="text-sm text-red-200 mt-1">
            O cliente tentou contatar o endpoint do Supabase configurado em <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> e não obteve resposta ("Failed to fetch").
          </div>
          <div className="text-xs text-red-200 mt-2">
            Verifique sua conexão de rede, configuração de DNS ou confirme as variáveis em <code className="text-xs">.env.local</code>.
          </div>
        </div>

        <div className="flex-shrink-0">
          <a
            href="/"
            className="inline-block px-3 py-1 bg-red-700/80 text-white rounded-md text-sm hover:bg-red-600"
            onClick={(e) => {
              // link apenas informativo — permitir navegação normal
            }}
          >
            Fechar
          </a>
        </div>
      </div>
    </div>
  );
}
