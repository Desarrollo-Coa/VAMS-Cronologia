import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || errorData.error || "Error al eliminar la categoría" },
        { status: response.status }
      )
    }

    const data = await response.json()

    if (data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al eliminar la categoría" },
        { status: 400 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error deleting categoria:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

