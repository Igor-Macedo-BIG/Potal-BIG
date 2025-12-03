import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não precisam de autenticação
const publicRoutes = ['/login'];

// Mapeamento de roles para suas rotas permitidas
const roleRoutes: Record<string, string[]> = {
  admin: ['/admin', '/dashboard', '/trafego', '/sdr', '/closer', '/social-seller', '/cs', '/', '/api'], // Admin acessa tudo
  gestor: ['/admin', '/dashboard', '/trafego', '/sdr', '/closer', '/social-seller', '/cs', '/', '/api'], // Gestor acessa tudo
  trafego: ['/trafego', '/dashboard', '/', '/api'], // Só tráfego
  cs: ['/cs', '/dashboard', '/', '/api'], // Só CS
  sdr: ['/sdr', '/dashboard', '/', '/api'], // Só SDR
  closer: ['/closer', '/dashboard', '/', '/api'], // Só Closer
  'social-seller': ['/social-seller', '/dashboard', '/', '/api'], // Só Social Seller
};

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Permitir acesso a arquivos estáticos e API routes do Next.js
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return response;
  }

  // Se for rota pública, permitir acesso
  if (isPublicRoute) {
    return response;
  }

  // Verificar sessão do usuário
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se não houver sessão, redirecionar para login
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Buscar dados do usuário no banco
  const { data: userData } = await supabase
    .from('users')
    .select('role, ativo')
    .eq('id', session.user.id)
    .single();

  // Se usuário não existe ou está inativo, deslogar
  if (!userData || !userData.ativo) {
    await supabase.auth.signOut();
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'user_inactive');
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o usuário tem permissão para acessar a rota
  const userRole = userData.role;
  const allowedRoutes = roleRoutes[userRole] || [];

  // Verificar se a rota atual está nas rotas permitidas do usuário
  const hasAccess = allowedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Se não tiver acesso, redirecionar para a primeira rota permitida
  if (!hasAccess) {
    const defaultRoute = allowedRoutes[0] || '/login';
    const accessDeniedUrl = new URL(defaultRoute, req.url);
    return NextResponse.redirect(accessDeniedUrl);
  }

  // Usuário autenticado e com permissão - permitir acesso
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
