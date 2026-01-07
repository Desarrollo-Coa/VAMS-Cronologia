/**
 * Cliente API para hacer llamadas a la API ORDS
 * Incluye automáticamente el token de autenticación en los headers
 */

/**
 * Realiza una llamada a la API ORDS con el token de autenticación incluido
 * @param endpoint - Endpoint relativo (ej: '/vams/projects')
 * @param options - Opciones de fetch estándar
 * @returns Response de fetch
 */
/**
 * Obtiene el token de las cookies
 */
function getTokenFromCookie(): string | null {
  if (typeof window === "undefined") return null

  try {
    const cookies = document.cookie.split(";")
    const tokenCookie = cookies.find((c) => c.trim().startsWith("vams_token="))
    if (!tokenCookie) return null

    return decodeURIComponent(tokenCookie.split("=")[1].trim())
  } catch {
    return null
  }
}

export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // Obtener token de las cookies
  const token = getTokenFromCookie()

  // Obtener URL base de la API
  const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL

  if (!apiUrl) {
    throw new Error("DB_API_URL no está configurada en las variables de entorno")
  }

  // Construir headers con el token
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { "X-API-Token": token }), // Agregar token en header si existe
    ...options.headers,
  }

  // Realizar la llamada
  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Incluir cookies en la petición
  })

  // Si el token es inválido (401), hacer logout automático
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      // Llamar a logout API route
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).then(() => {
        window.location.href = "/login"
      })
    }
    throw new Error("Token inválido o expirado")
  }

  return response
}

/**
 * Realiza una llamada GET a la API
 */
export async function apiGet(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return apiCall(endpoint, {
    ...options,
    method: "GET",
  })
}

/**
 * Realiza una llamada POST a la API
 */
export async function apiPost(endpoint: string, body?: any, options: RequestInit = {}): Promise<Response> {
  return apiCall(endpoint, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Realiza una llamada PUT a la API
 */
export async function apiPut(endpoint: string, body?: any, options: RequestInit = {}): Promise<Response> {
  return apiCall(endpoint, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Realiza una llamada DELETE a la API
 */
export async function apiDelete(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return apiCall(endpoint, {
    ...options,
    method: "DELETE",
  })
}

