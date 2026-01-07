import { User } from "./types"

/**
 * Obtiene el usuario actual desde cookies (solo en servidor)
 * Para cliente, usar getCurrentUserClient()
 */
export async function getCurrentUser(): Promise<User | null> {
  if (typeof window !== "undefined") {
    // En cliente, hacer fetch a API route
    try {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        return data.user || null
      }
    } catch {
      return null
    }
    return null
  }

  // En servidor, leer de cookies directamente
  try {
    // Importación dinámica para evitar errores en Client Components
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const userStr = cookieStore.get("vams_user")?.value
    if (!userStr) return null

    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

/**
 * Obtiene el usuario actual desde cookies (versión cliente)
 */
export function getCurrentUserClient(): User | null {
  if (typeof window === "undefined") return null

  try {
    // Leer cookie no HttpOnly
    const cookies = document.cookie.split(";")
    const userCookie = cookies.find((c) => c.trim().startsWith("vams_user="))
    if (!userCookie) return null

    const userStr = decodeURIComponent(userCookie.split("=")[1].trim())
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

/**
 * Verifica si el usuario está autenticado (solo en servidor)
 * Para cliente, usar isAuthenticatedClient()
 */
export async function isAuthenticated(): Promise<boolean> {
  if (typeof window !== "undefined") {
    // En cliente, verificar cookie no HttpOnly
    return isAuthenticatedClient()
  }

  // En servidor, leer de cookies
  try {
    // Importación dinámica para evitar errores en Client Components
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value
    const user = cookieStore.get("vams_user")?.value
    return !!(token && user)
  } catch {
    return false
  }
}

/**
 * Verifica si el usuario está autenticado (versión cliente)
 */
export function isAuthenticatedClient(): boolean {
  if (typeof window === "undefined") return false

  try {
    const cookies = document.cookie.split(";")
    const authCookie = cookies.find((c) => c.trim().startsWith("vams_authenticated="))
    return authCookie?.split("=")[1] === "true"
  } catch {
    return false
  }
}

/**
 * Cierra la sesión del usuario
 */
export function logout(): void {
  if (typeof window === "undefined") return

  // Llamar a API route para limpiar cookies
  fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).then(() => {
    window.location.href = "/login"
  })
}

/**
 * Verifica si el usuario tiene un rol específico (versión cliente)
 */
export function hasRole(roleId: number): boolean {
  const user = getCurrentUserClient()
  return user?.RL_IDROL_FK === roleId
}

/**
 * Verifica si el usuario es administrador (versión cliente)
 */
export function isAdmin(): boolean {
  return hasRole(1) // 1 = ADMINISTRADOR según el SQL
}

