import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAndHandleInvalidToken } from "@/lib/api-server-utils"

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
    
    // Debug: agregar logs para diagnosticar
    console.log('Raw ORDS activos response:', {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
      dataPreview: Array.isArray(data) ? `Array[${data.length}]` : JSON.stringify(data).substring(0, 300),
      hasItems: data && typeof data === 'object' && 'items' in data,
      itemsLength: data && typeof data === 'object' && 'items' in data ? data.items?.length : 'N/A'
    })
    
    // ORDS con json/query devuelve un objeto con estructura { items: [...], first: ... }
    let activos: any[] = []
    
    if (Array.isArray(data)) {
      // ORDS devolvió directamente el array (formato antiguo o caso especial)
      activos = data
    } else if (data && typeof data === 'object') {
      // Verificar si tiene la estructura de json/query con items
      if ('items' in data && Array.isArray(data.items)) {
        // Formato json/query: { items: [...], first: ... }
        activos = data.items
        console.log('Activos received from ORDS json/query format:', activos.length, 'activos')
      } else if (data.success !== undefined && data.message !== undefined) {
        // Verificar si el token es inválido
        const invalidTokenResponse = await checkAndHandleInvalidToken(data)
        if (invalidTokenResponse) {
          return invalidTokenResponse
        }
        
        // Formato antiguo con { success, message, result_json }
        if (!data.success) {
          return NextResponse.json(
            { error: data.message || "Error al obtener activos visuales" },
            { status: 401 }
          )
        }

        if (data.result_json) {
          try {
            const parsed = typeof data.result_json === 'string' 
              ? JSON.parse(data.result_json) 
              : data.result_json
            activos = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            console.error('Error parsing result_json:', e)
            activos = []
          }
        }
      } else {
        // Objeto vacío o formato inesperado
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

    console.log('Activos transformados (antes de filtrar por año):', {
      count: transformedActivos.length,
      first: transformedActivos[0] || null,
      yearFilter: year || 'none'
    })

    // Filtrar por año si se proporciona
    if (year) {
      const añoFiltro = parseInt(year)
      transformedActivos = transformedActivos.filter((activo) => {
        if (!activo.AV_FECHA_CAPTURA) return false
        const fecha = new Date(activo.AV_FECHA_CAPTURA)
        return fecha.getFullYear() === añoFiltro
      })
      console.log('Activos después de filtrar por año', year, ':', transformedActivos.length)
    }

    console.log('Activos finales a devolver:', {
      count: transformedActivos.length,
      ids: transformedActivos.map(a => a.AV_IDACTIVO_PK)
    })

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
    
    // Debug: ver qué se está recibiendo
    console.log('POST /api/projects/[id]/activos - Body recibido:', {
      AV_NOMBRE: body.AV_NOMBRE,
      AV_URL: body.AV_URL ? `${body.AV_URL.substring(0, 50)}...` : null,
      AV_FECHA_CAPTURA: body.AV_FECHA_CAPTURA,
      AV_FECHA_CAPTURA_length: body.AV_FECHA_CAPTURA?.length,
      CT_IDCATEGORIA_FK: body.CT_IDCATEGORIA_FK,
      AV_FILENAME: body.AV_FILENAME,
      AV_TAMANIO: body.AV_TAMANIO,
      body_keys: Object.keys(body)
    })

    // Validar campos requeridos
    if (!body.AV_URL || !body.AV_FECHA_CAPTURA) {
      console.error('Campos requeridos faltantes:', {
        hasAV_URL: !!body.AV_URL,
        hasAV_FECHA_CAPTURA: !!body.AV_FECHA_CAPTURA
      })
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

    // Preparar payload para ORDS
    const payloadToORDS = {
      ...body,
      PR_IDPROYECTO_FK: projectId,
    }
    
    // Llamar al endpoint ORDS para crear el activo visual
    console.log('POST /api/projects/[id]/activos - Enviando a ORDS:', {
      projectId,
      endpoint,
      payload: {
        ...payloadToORDS,
        AV_URL: payloadToORDS.AV_URL ? `${payloadToORDS.AV_URL.substring(0, 50)}...` : null
      }
    })

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payloadToORDS),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS al crear activo:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      })
      
      // Intentar parsear como JSON si es posible
      let errorData: any = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      
      return NextResponse.json(
        { error: errorData.error || errorData.message || "Error al crear el activo visual" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Verificar si el token es inválido
    const invalidTokenResponse = await checkAndHandleInvalidToken(data)
    if (invalidTokenResponse) {
      return invalidTokenResponse
    }
    
    console.log('Activo creado exitosamente:', {
      success: data.success,
      message: data.message,
      activo_id: data.activo_id
    })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating activo:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
