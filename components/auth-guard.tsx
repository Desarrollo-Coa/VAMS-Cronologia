"use client"

import { useEffect, useState } from "react"
import { isAuthenticatedClient } from "@/lib/auth"

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

/**
 * AuthGuard - Componente de protección de rutas
 * NOTA: El middleware ya maneja las redirecciones automáticamente.
 * Este componente solo muestra un loading mientras se verifica la autenticación.
 * Si el middleware detecta que no hay autenticación, ya redirigió antes de
 * que este componente se renderice.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [mounted, setMounted] = useState(false)
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsAuth(isAuthenticatedClient())
  }, [])

  // Mientras se monta, mostrar loading
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, el middleware ya debería haber redirigido
  // Pero por si acaso, mostramos un mensaje (aunque no debería llegar aquí)
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

