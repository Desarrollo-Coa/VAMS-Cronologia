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
    
    // Debug: agregar logs para diagnosticar
    console.log('Raw ORDS categorias response:', {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
      dataPreview: Array.isArray(data) ? `Array[${data.length}]` : JSON.stringify(data).substring(0, 300),
      hasItems: data && typeof data === 'object' && 'items' in data,
      itemsLength: data && typeof data === 'object' && 'items' in data ? data.items?.length : 'N/A'
    })
    
    // ORDS con json/query devuelve un objeto con estructura { items: [...], first: ... }
    let categorias: any[] = []
    
    if (Array.isArray(data)) {
      // ORDS devolvió directamente el array (formato antiguo o caso especial)
      categorias = data
    } else if (data && typeof data === 'object') {
      // Verificar si tiene la estructura de json/query con items
      if ('items' in data && Array.isArray(data.items)) {
        // Formato json/query: { items: [...], first: ... }
        categorias = data.items
        console.log('Categorias received from ORDS json/query format:', categorias.length, 'categorias')
      } else if (data.success !== undefined && data.message !== undefined) {
        // Formato antiguo con { success, message, result_json }
        if (!data.success) {
          return NextResponse.json(
            { error: data.message || "Error al obtener categorías" },
            { status: 401 }
          )
        }

        if (data.result_json) {
          try {
            const parsed = typeof data.result_json === 'string' 
              ? JSON.parse(data.result_json) 
              : data.result_json
            categorias = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            console.error('Error parsing result_json:', e)
            categorias = []
          }
        }
      } else {
        // Objeto vacío o formato inesperado
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

    console.log('Categorias finales transformadas:', {
      count: transformedCategorias.length,
      first: transformedCategorias[0] || null,
      all: transformedCategorias.map(c => ({ id: c.CT_IDCATEGORIA_PK, nombre: c.CT_NOMBRE }))
    })

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

