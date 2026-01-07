import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * API Route para obtener credenciales de Firebase temporalmente
 * Solo se devuelven si el usuario está autenticado
 * POST /api/upload/credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 }
      )
    }

    // Devolver credenciales temporalmente (solo si está autenticado)
    // Las credenciales están solo en el servidor (sin NEXT_PUBLIC_) para no exponerlas en el bundle
    const credentials = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    }

    // Validar que todas las credenciales estén configuradas
    if (!credentials.apiKey || !credentials.projectId || !credentials.storageBucket) {
      return NextResponse.json(
        { error: "Las credenciales de Firebase no están configuradas correctamente" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credentials,
    })
  } catch (error) {
    console.error("Error getting credentials:", error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al obtener credenciales" },
      { status: 500 }
    )
  }
}

