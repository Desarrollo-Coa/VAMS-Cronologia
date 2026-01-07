import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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
    
    // La nueva estructura devuelve { success, message, result_json }
    if (!data.success) {
      return NextResponse.json(
        { error: data.message || "Error al obtener proyectos" },
        { status: 401 }
      )
    }

    // Parsear el JSON string que viene en result_json
    let projects: any[] = []
    if (data.result_json) {
      try {
        projects = typeof data.result_json === 'string' 
          ? JSON.parse(data.result_json) 
          : data.result_json
      } catch (e) {
        console.error('Error parsing result_json:', e)
        projects = []
      }
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
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
