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
    const endpoint = `${cleanApiUrl}/negocios`

    // Llamar al endpoint ORDS para obtener negocios
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS response:', response.status, errorText)
      return NextResponse.json(
        { error: "Error al obtener negocios" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    let negocios: any[] = []
    
    if (Array.isArray(data)) {
      negocios = data
    } else if (data && typeof data === 'object') {
      if ('items' in data && Array.isArray(data.items)) {
        negocios = data.items
      } else if (data.success !== undefined && data.message !== undefined) {
        const invalidTokenResponse = await checkAndHandleInvalidToken(data)
        if (invalidTokenResponse) {
          return invalidTokenResponse
        }
        
        if (!data.success) {
          return NextResponse.json(
            { error: data.message || "Error al obtener negocios" },
            { status: 401 }
          )
        }

        if (data.result_json) {
          try {
            const parsed = typeof data.result_json === 'string' 
              ? JSON.parse(data.result_json) 
              : data.result_json
            negocios = Array.isArray(parsed) ? parsed : []
          } catch (e) {
            console.error('Error parsing result_json:', e)
            negocios = []
          }
        }
      } else {
        negocios = []
      }
    } else {
      negocios = []
    }
    
    // ORDS devuelve los campos en minúsculas, transformarlos a mayúsculas
    const transformedNegocios = negocios.map((negocio: any) => ({
      NG_IDNEGOCIO_PK: negocio.ng_idnegocio_pk || negocio.NG_IDNEGOCIO_PK,
      NG_NOMBRE: negocio.ng_nombre || negocio.NG_NOMBRE,
      NG_ACTIVO: negocio.ng_activo || negocio.NG_ACTIVO,
      PERMISO_USUARIO: negocio.permiso_usuario || negocio.PERMISO_USUARIO,
    }))

    return NextResponse.json(transformedNegocios)
  } catch (error) {
    console.error("Error fetching negocios:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autorizado. Token requerido." }, { status: 401 })
    }

    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL
    if (!apiUrl) {
      return NextResponse.json({ error: "DB_API_URL no está configurada" }, { status: 500 })
    }

    const body = await request.json()

    if (!body.NG_NOMBRE) {
      return NextResponse.json({ error: "El nombre del negocio es requerido" }, { status: 400 })
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/negocios`

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ ng_nombre: body.NG_NOMBRE }),
    })

    const data = await response.json()

    const invalidTokenResponse = await checkAndHandleInvalidToken(data)
    if (invalidTokenResponse) return invalidTokenResponse

    if (!response.ok || data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al crear el negocio" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      negocio_id: data.negocio_id
    })

  } catch (error) {
    console.error("Error creating negocio:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
