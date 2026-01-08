import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Verifica si la respuesta de ORDS indica que el token es inválido o expirado
 * @param data - Datos de respuesta de ORDS
 * @returns true si el token es inválido, false en caso contrario
 */
export function isTokenInvalid(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  
  // Verificar si success es 'false' o false y el mensaje indica token inválido
  const success = data.success
  const message = data.message || ''
  
  if ((success === 'false' || success === false) && 
      typeof message === 'string' && 
      message.toLowerCase().includes('token inválido')) {
    return true
  }
  
  return false
}

/**
 * Crea una respuesta de error 401 con cookies limpiadas cuando el token es inválido
 * @param message - Mensaje de error opcional
 * @returns NextResponse con status 401 y cookies limpiadas
 */
export async function createUnauthorizedResponse(message: string = "Token inválido o expirado"): Promise<NextResponse> {
  const cookieStore = await cookies()
  
  const response = NextResponse.json(
    { 
      success: false,
      error: message,
      message: message 
    },
    { status: 401 }
  )
  
  // Limpiar todas las cookies de autenticación
  response.cookies.delete("vams_token")
  response.cookies.delete("vams_user")
  response.cookies.delete("vams_authenticated")
  
  return response
}

/**
 * Verifica la respuesta de ORDS y maneja automáticamente tokens inválidos
 * @param data - Datos de respuesta de ORDS
 * @returns NextResponse con 401 si el token es inválido, null si es válido
 */
export async function checkAndHandleInvalidToken(data: any): Promise<NextResponse | null> {
  if (isTokenInvalid(data)) {
    console.log('Token inválido detectado en respuesta de ORDS, cerrando sesión automáticamente')
    return await createUnauthorizedResponse()
  }
  return null
}

