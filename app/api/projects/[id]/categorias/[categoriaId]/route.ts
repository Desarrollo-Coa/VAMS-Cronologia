import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAndHandleInvalidToken } from "@/lib/api-server-utils"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoriaId: string }> }
) {
  try {
    const { id, categoriaId } = await params
    const projectId = parseInt(id)
    const categoriaIdNum = parseInt(categoriaId)

    if (isNaN(projectId) || isNaN(categoriaIdNum)) {
      return NextResponse.json(
        { error: "ID de proyecto o categoría inválido" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()

    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL

    if (!apiUrl) {
      return NextResponse.json(
        { error: "DB_API_URL no está configurada" },
        { status: 500 }
      )
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/categorias/${categoriaIdNum}`

    const response = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Error al actualizar la categoría" },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Verificar si el token es inválido
    const invalidTokenResponse = await checkAndHandleInvalidToken(data)
    if (invalidTokenResponse) {
      return invalidTokenResponse
    }

    if (data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al actualizar la categoría" },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating categoria:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoriaId: string }> }
) {
  try {
    const { id, categoriaId } = await params
    const projectId = parseInt(id)
    const categoriaIdNum = parseInt(categoriaId)

    if (isNaN(projectId) || isNaN(categoriaIdNum)) {
      return NextResponse.json(
        { error: "ID de proyecto o categoría inválido" },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL

    if (!apiUrl) {
      return NextResponse.json(
        { error: "DB_API_URL no está configurada" },
        { status: 500 }
      )
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/categorias/${categoriaIdNum}`

    console.log('DELETE categoria:', { projectId, categoriaIdNum, endpoint })

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers,
    })

    console.log('ORDS DELETE response:', { status: response.status, statusText: response.statusText })

    // Intentar obtener el cuerpo de la respuesta
    let responseData: any = {}
    let responseText = ""
    try {
      responseText = await response.text()
      if (responseText) {
        // Verificar si es HTML (error de ORDS)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error("ORDS devolvió HTML en lugar de JSON:", responseText.substring(0, 500))
          return NextResponse.json(
            { error: "El endpoint DELETE no está disponible en el servidor. Por favor, ejecuta el script SQL actualizado." },
            { status: 500 }
          )
        }
        responseData = JSON.parse(responseText)
      }
    } catch (e) {
      console.error("Error parsing response:", e, "Response text:", responseText.substring(0, 200))
      // Si no es JSON, probablemente es HTML de error
      if (responseText && (responseText.includes('<!DOCTYPE') || responseText.includes('<html'))) {
        return NextResponse.json(
          { error: "El endpoint DELETE no está disponible en el servidor. Por favor, ejecuta el script SQL actualizado." },
          { status: 500 }
        )
      }
    }

    if (!response.ok) {
      console.error("ORDS DELETE error:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        responseText: responseText.substring(0, 500)
      })
      return NextResponse.json(
        { error: responseData.message || responseData.error || "Error al eliminar la categoría" },
        { status: response.status }
      )
    }

    // Verificar si el token es inválido
    const invalidTokenResponse = await checkAndHandleInvalidToken(responseData)
    if (invalidTokenResponse) {
      return invalidTokenResponse
    }

    // Verificar si la respuesta indica éxito o error
    if (responseData.success === 'false' || responseData.success === false) {
      return NextResponse.json(
        { error: responseData.message || "Error al eliminar la categoría" },
        { status: 400 }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error deleting categoria:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

