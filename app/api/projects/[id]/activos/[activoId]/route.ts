import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activoId: string }> }
) {
  try {
    const { id, activoId } = await params
    const projectId = parseInt(id)
    const activoIdNum = parseInt(activoId)

    if (isNaN(projectId) || isNaN(activoIdNum)) {
      return NextResponse.json(
        { error: "ID de proyecto o activo inválido" },
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
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/activos/${activoIdNum}`

    const response = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Error al actualizar el activo visual" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al actualizar el activo visual" },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating activo:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; activoId: string }> }
) {
  try {
    const { id, activoId } = await params
    const projectId = parseInt(id)
    const activoIdNum = parseInt(activoId)

    if (isNaN(projectId) || isNaN(activoIdNum)) {
      return NextResponse.json(
        { error: "ID de proyecto o activo inválido" },
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
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/activos/${activoIdNum}`

    console.log('DELETE activo (usando PUT):', { projectId, activoIdNum, endpoint })

    // Usar PUT para marcar el activo como inactivo
    const response = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        AV_ACTIVO: 'NO'
      }),
    })

    console.log('ORDS PUT response:', { status: response.status, statusText: response.statusText })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Error al eliminar el activo visual" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al eliminar el activo visual" },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error deleting activo:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

