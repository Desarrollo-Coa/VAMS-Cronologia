import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/login", "/api/auth/login"]

// Rutas de API que requieren autenticación
const protectedApiRoutes = ["/api"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Obtener token y usuario de las cookies
  const token = request.cookies.get("vams_token")?.value
  const user = request.cookies.get("vams_user")?.value

  // Crear respuesta base
  let response: NextResponse

  // Si es una ruta pública, permitir acceso
  if (isPublicRoute) {
    // Si ya está autenticado y trata de acceder a /login, redirigir a home
    if (pathname === "/login" && token && user) {
      response = NextResponse.redirect(new URL("/", request.url))
    } else {
      response = NextResponse.next()
    }
  } else if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth/login")) {
    // Si es una ruta de API protegida, verificar token
    if (!token) {
      return NextResponse.json(
        { success: false, message: "No autorizado" },
        { status: 401 }
      )
    }
    response = NextResponse.next()
  } else {
    // Para rutas protegidas (no públicas, no API)
    if (!token || !user) {
      // Redirigir a login si no está autenticado
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      response = NextResponse.redirect(loginUrl)
    } else {
      response = NextResponse.next()
    }
  }

  // Configurar headers para permitir iframe desde el dominio específico
  const allowedFrameOrigin = "https://apps.fortoxsecurity.com:8888"
  
  // Agregar headers de seguridad para iframe
  // Content-Security-Policy permite control granular de qué dominios pueden embeber la página
  response.headers.set(
    "Content-Security-Policy",
    `frame-ancestors 'self' ${allowedFrameOrigin}`
  )
  
  // X-Frame-Options: No establecerlo o usar ALLOWALL para que CSP tenga control completo
  // Si establecemos SAMEORIGIN, podría bloquear el iframe desde otro dominio
  // Mejor no establecerlo y dejar que CSP maneje la seguridad
  response.headers.delete("X-Frame-Options")

  return response
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

