import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAndHandleInvalidToken } from "@/lib/api-server-utils"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
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
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}`

    const response = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Error al actualizar el proyecto" },
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
        { error: data.message || "Error al actualizar el proyecto" },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projectId = parseInt(id)

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "ID de proyecto inválido" },
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

    // DELETE no necesita Content-Type porque no envía body
    // Si enviamos Content-Type: application/json sin body, ORDS falla con "Expected one of: <<{,[>> but got: <<EOF>>"
    const headers: HeadersInit = {
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}`

    console.log('DELETE /api/projects/[id] - Llamando a ORDS:', {
      endpoint,
      method: 'DELETE',
      headers,
      projectId
    })

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers,
    })

    console.log('DELETE /api/projects/[id] - ORDS response status:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    })

    // Intentar obtener el cuerpo de la respuesta
    let responseData: any = {}
    let responseText = ""
    
    try {
      responseText = await response.text()
      console.log('DELETE /api/projects/[id] - Response text (COMPLETO):', responseText)
      console.log('DELETE /api/projects/[id] - Response text length:', responseText.length)
      
      if (responseText) {
        // Verificar si es HTML (error de ORDS)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error("ORDS devolvió HTML en lugar de JSON (COMPLETO):", responseText)
          return NextResponse.json(
            { error: "El endpoint DELETE no está disponible en el servidor. Por favor, ejecuta el script SQL actualizado." },
            { status: 500 }
          )
        }
        
        // Intentar parsear como JSON
        try {
          responseData = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Error parsing JSON response:", parseError)
          // Si no es JSON válido, puede ser un mensaje de error en texto plano
          if (responseText.trim()) {
            responseData = { message: responseText.trim() }
          }
        }
      }
    } catch (e) {
      console.error("Error reading response:", e)
    }
    
    console.log('DELETE /api/projects/[id] - Parsed data:', responseData)

    // Verificar si el token es inválido
    const invalidTokenResponse = await checkAndHandleInvalidToken(responseData)
    if (invalidTokenResponse) {
      return invalidTokenResponse
    }

    // ORDS puede devolver success: 'false' incluso con status 200
    if (responseData.success === 'false' || responseData.success === false || !response.ok) {
      const errorMessage = responseData.message || responseData.error || responseText || "Error al eliminar el proyecto"
      console.log('DELETE /api/projects/[id] - Error:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.ok ? 400 : response.status }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

