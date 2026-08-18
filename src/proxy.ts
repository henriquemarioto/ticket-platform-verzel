import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = process.env.AUTH_SECRET;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/", "/events", "/login", "/register", "/forbidden", "/api/events"];
  
  // Rotas que não exigem auth específica mas podem ter
  const isPublicRoute = 
    publicRoutes.includes(pathname) || 
    pathname.startsWith("/api/auth/") || 
    pathname.startsWith("/api/events/") || 
    pathname.startsWith("/events/") || 
    pathname.startsWith("/tickets/share/");

  const sessionToken = request.cookies.get("session")?.value;

  let payload = null;

  if (sessionToken && SECRET) {
    try {
      const secret = new TextEncoder().encode(SECRET);
      const verified = await jwtVerify(sessionToken, secret);
      payload = verified.payload as { id: string; email: string; role: string };
    } catch (_error) {
      // Token inválido
      payload = null;
    }
  }

  // Se a rota for protegida e o usuário não estiver logado
  if (!payload && !isPublicRoute) {
    // Se for uma requisição para a API, retorna 401 ao invés de redirecionar
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    // Redireciona para o login salvando a URL de retorno
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("returnUrl", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Proteção de rotas baseada no Role (RBAC)
  if (payload) {
    const { role } = payload;

    if (pathname.startsWith("/organizer") && role !== "ORGANIZER") {
      return NextResponse.rewrite(new URL("/forbidden", request.url));
    }

    if (pathname.startsWith("/gatekeeper") && role !== "GATEKEEPER") {
      return NextResponse.rewrite(new URL("/forbidden", request.url));
    }
  }

  // Cria a resposta e injeta cabeçalhos downstream, se o payload existir
  const response = NextResponse.next();

  if (payload) {
    response.headers.set("x-user-id", payload.id);
    response.headers.set("x-user-email", payload.email);
    response.headers.set("x-user-role", payload.role);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
