import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAndHandleInvalidToken } from "@/lib/api-server-utils"

export async function GET(request: NextRequest) {
  try {
    // Obtener token de las cookies (servidor)
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Token requerido." },
        { status: 401 }
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
    const endpoint = `${cleanApiUrl}/proyectos`

    // Llamar al endpoint ORDS para obtener proyectos
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS response:', response.status, errorText)
      return NextResponse.json(
        { error: "Error al obtener proyectos" },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Raw ORDS response:', {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: data && typeof data === 'object' ? Object.keys(data) : 'N/A',
      dataPreview: Array.isArray(data) ? `Array[${data.length}]` : JSON.stringify(data).substring(0, 200)
    })
    
    // ORDS con json/query devuelve un objeto con estructura { items: [...], first: ... }
    // Si el token no es válido o no hay resultados, puede devolver { items: [] }
    let projects: any[] = []
    
    if (Array.isArray(data)) {
      // ORDS devolvió directamente el array (formato antiguo o caso especial)
      projects = data
      console.log('Projects received directly as array from ORDS:', projects.length, 'projects')
    } else if (data && typeof data === 'object') {
      // Verificar si tiene la estructura de json/query con items
      if ('items' in data && Array.isArray(data.items)) {
        // Formato json/query: { items: [...], first: ... }
        projects = data.items
        console.log('Projects received from ORDS json/query format:', projects.length, 'projects')
      } else if (data.success !== undefined && data.message !== undefined) {
        // Verificar si el token es inválido
        const invalidTokenResponse = await checkAndHandleInvalidToken(data)
        if (invalidTokenResponse) {
          return invalidTokenResponse
        }
        
        // Formato antiguo con { success, message, result_json }
        console.log('ORDS Response (old format):', {
          success: data.success,
          message: data.message,
          result_json_type: typeof data.result_json
        })
        
        if (!data.success) {
          return NextResponse.json(
            { error: data.message || "Error al obtener proyectos" },
            { status: 401 }
          )
        }

        if (data.result_json) {
          try {
            const parsed = typeof data.result_json === 'string' 
              ? JSON.parse(data.result_json) 
              : data.result_json
            projects = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            console.error('Error parsing result_json:', e)
            projects = []
          }
        }
      } else {
        // Objeto vacío o formato inesperado - tratar como array vacío
        const keys = Object.keys(data)
        console.log('ORDS returned unexpected object format:', 
          keys.length === 0 ? 'empty object {}' : 'object with keys: ' + keys.join(', '))
        projects = []
      }
    } else {
      console.warn('Unexpected response format from ORDS:', typeof data)
      projects = []
    }
    
    // ORDS devuelve los campos en minúsculas, transformarlos a mayúsculas para el frontend
    const transformedProjects = projects.map((project: any) => ({
      PR_IDPROYECTO_PK: project.pr_idproyecto_pk || project.PR_IDPROYECTO_PK,
      PR_NOMBRE: project.pr_nombre || project.PR_NOMBRE,
      PR_UBICACION: project.pr_ubicacion || project.PR_UBICACION,
      PR_FOTO_PORTADA_URL: project.pr_foto_portada_url || project.PR_FOTO_PORTADA_URL,
      PR_FECHA_INICIO: project.pr_fecha_inicio || project.PR_FECHA_INICIO,
      PR_FECHA_FIN: project.pr_fecha_fin || project.PR_FECHA_FIN,
      PR_ACTIVO: project.pr_activo || project.PR_ACTIVO,
      PR_DESCRIPCION: project.pr_descripcion || project.PR_DESCRIPCION,
      TOTAL_ACTIVOS: project.total_activos || project.TOTAL_ACTIVOS || 0,
      TOTAL_CATEGORIAS: project.total_categorias || project.TOTAL_CATEGORIAS || 0,
      ULTIMA_ACTUALIZACION: project.ultima_actualizacion || project.ULTIMA_ACTUALIZACION,
    }))
    
    if (transformedProjects.length > 0) {
      console.log('First project transformed:', {
        id: transformedProjects[0].PR_IDPROYECTO_PK,
        nombre: transformedProjects[0].PR_NOMBRE,
        foto_url: transformedProjects[0].PR_FOTO_PORTADA_URL,
      })
    }

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener token de las cookies (servidor)
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    // Obtener datos del body
    const body = await request.json()

    // Validar campos requeridos
    if (!body.PR_NOMBRE || !body.PR_NOMBRE.trim()) {
      return NextResponse.json(
        { error: "El nombre del proyecto es requerido" },
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
      ...(token && { "X-API-Token": token }),
    }

    // Construir URL del endpoint
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/proyectos`

    // Llamar al endpoint ORDS para crear el proyecto
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || "Error al crear el proyecto" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Verificar si el token es inválido
    const invalidTokenResponse = await checkAndHandleInvalidToken(data)
    if (invalidTokenResponse) {
      return invalidTokenResponse
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
