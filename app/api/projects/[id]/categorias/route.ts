import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(
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

    // Obtener token de las cookies (servidor)
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    // Obtener URL base de la API
    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL

    if (!apiUrl) {
      return NextResponse.json(
        { error: "DB_API_URL no está configurada" },
        { status: 500 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Token requerido." },
        { status: 401 }
      )
    }

    // Construir headers con el token
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    // Construir URL del endpoint
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/categorias`

    // Llamar al endpoint ORDS para obtener categorías
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS response:', response.status, errorText)
      return NextResponse.json(
        { error: "Error al obtener categorías" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // La nueva estructura devuelve { success, message, result_json }
    if (!data.success) {
      return NextResponse.json(
        { error: data.message || "Error al obtener categorías" },
        { status: 401 }
      )
    }

    // Parsear el JSON string que viene en result_json
    let categorias: any[] = []
    if (data.result_json) {
      try {
        categorias = typeof data.result_json === 'string' 
          ? JSON.parse(data.result_json) 
          : data.result_json
      } catch (e) {
        console.error('Error parsing result_json:', e)
        categorias = []
      }
    }

    // Transformar campos de minúsculas a mayúsculas
    const transformedCategorias = categorias.map((cat: any) => ({
      CT_IDCATEGORIA_PK: cat.ct_idcategoria_pk || cat.CT_IDCATEGORIA_PK,
      PR_IDPROYECTO_FK: cat.pr_idproyecto_fk || cat.PR_IDPROYECTO_FK,
      CT_NOMBRE: cat.ct_nombre || cat.CT_NOMBRE,
      CT_DESCRIPCION: cat.ct_descripcion || cat.CT_DESCRIPCION,
      CT_ICONO: cat.ct_icono || cat.CT_ICONO,
      CT_COLOR: cat.ct_color || cat.CT_COLOR,
      CT_ORDEN: cat.ct_orden || cat.CT_ORDEN,
      CT_ACTIVO: cat.ct_activo || cat.CT_ACTIVO,
    }))

    return NextResponse.json(transformedCategorias)
  } catch (error) {
    console.error("Error fetching categorias:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Obtener token de las cookies (servidor)
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener datos del body
    const body = await request.json()

    // Validar campos requeridos
    if (!body.CT_NOMBRE) {
      return NextResponse.json(
        { error: "CT_NOMBRE es requerido" },
        { status: 400 }
      )
    }

    // Obtener URL base de la API
    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL

    if (!apiUrl) {
      return NextResponse.json(
        { error: "DB_API_URL no está configurada" },
        { status: 500 }
      )
    }

    // Construir headers con el token
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    // Construir URL del endpoint
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/categorias`

    // Llamar al endpoint ORDS para crear la categoría
    console.log('POST /api/projects/[id]/categorias - Enviando datos:', {
      projectId,
      body,
      endpoint,
    })

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...body,
        PR_IDPROYECTO_FK: projectId,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS al crear categoría:', response.status, errorText)
      const errorData = await response.json().catch(() => ({ error: errorText }))
      return NextResponse.json(
        { error: errorData.error || errorData.message || "Error al crear la categoría" },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Categoría creada exitosamente:', data)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating categoria:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

