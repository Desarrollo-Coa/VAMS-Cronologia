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

    // Obtener año del query string (opcional)
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

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
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/activos`

    // Llamar al endpoint ORDS para obtener activos visuales
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS response:', response.status, errorText)
      return NextResponse.json(
        { error: "Error al obtener activos visuales" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // La nueva estructura devuelve { success, message, result_json }
    if (!data.success) {
      return NextResponse.json(
        { error: data.message || "Error al obtener activos visuales" },
        { status: 401 }
      )
    }

    // Parsear el JSON string que viene en result_json
    let activos: any[] = []
    if (data.result_json) {
      try {
        activos = typeof data.result_json === 'string' 
          ? JSON.parse(data.result_json) 
          : data.result_json
      } catch (e) {
        console.error('Error parsing result_json:', e)
        activos = []
      }
    }

    // Transformar campos de minúsculas a mayúsculas
    let transformedActivos = activos.map((activo: any) => ({
      AV_IDACTIVO_PK: activo.av_idactivo_pk || activo.AV_IDACTIVO_PK,
      PR_IDPROYECTO_FK: activo.pr_idproyecto_fk || activo.PR_IDPROYECTO_FK,
      CT_IDCATEGORIA_FK: activo.ct_idcategoria_fk || activo.CT_IDCATEGORIA_FK,
      AV_NOMBRE: activo.av_nombre || activo.AV_NOMBRE,
      AV_DESCRIPCION: activo.av_descripcion || activo.AV_DESCRIPCION,
      AV_URL: activo.av_url || activo.AV_URL,
      AV_FECHA_CAPTURA: activo.av_fecha_captura || activo.AV_FECHA_CAPTURA,
      AV_FECHA_CARGA: activo.av_fecha_carga || activo.AV_FECHA_CARGA,
    }))

    // Filtrar por año si se proporciona
    if (year) {
      const añoFiltro = parseInt(year)
      transformedActivos = transformedActivos.filter((activo) => {
        if (!activo.AV_FECHA_CAPTURA) return false
        const fecha = new Date(activo.AV_FECHA_CAPTURA)
        return fecha.getFullYear() === añoFiltro
      })
    }

    return NextResponse.json(transformedActivos)
  } catch (error) {
    console.error("Error fetching activos:", error)
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
    if (!body.AV_URL || !body.AV_FECHA_CAPTURA) {
      return NextResponse.json(
        { error: "AV_URL y AV_FECHA_CAPTURA son requeridos" },
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
    const endpoint = `${cleanApiUrl}/proyectos/${projectId}/activos`

    // Llamar al endpoint ORDS para crear el activo visual
    console.log('POST /api/projects/[id]/activos - Enviando datos:', {
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
      console.error('Error ORDS al crear activo:', response.status, errorText)
      const errorData = await response.json().catch(() => ({ error: errorText }))
      return NextResponse.json(
        { error: errorData.error || errorData.message || "Error al crear el activo visual" },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Activo creado exitosamente:', data)
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating activo:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
