import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAndHandleInvalidToken } from "@/lib/api-server-utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado. Token requerido." }, { status: 401 })
    }

    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL
    if (!apiUrl) {
      return NextResponse.json({ error: "DB_API_URL no está configurada" }, { status: 500 })
    }

    const body = await request.json()
    // negocios_ids debe ser un string separado por comas, ej: "1,2,3" o vacío ""
    const negocios_ids = body.negocios_ids !== undefined ? body.negocios_ids : ""

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/usuarios/${id}/negocios`

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ negocios_ids: negocios_ids || " " }), // Evitar nulos completos en PL/SQL si es vacío
    })

    const data = await response.json()

    const invalidTokenResponse = await checkAndHandleInvalidToken(data)
    if (invalidTokenResponse) return invalidTokenResponse

    if (!response.ok || data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al actualizar negocios del usuario" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message
    })

  } catch (error) {
    console.error("Error updating user negocios:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
