import { NextRequest, NextResponse } from "next/server"

/**
 * API route para cerrar sesión y limpiar cookies
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: "Sesión cerrada exitosamente",
  })

  // Limpiar todas las cookies de autenticación
  response.cookies.delete("vams_token")
  response.cookies.delete("vams_user")
  response.cookies.delete("vams_authenticated")

  return response
}

