import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { checkAndHandleInvalidToken } from "@/lib/api-server-utils"

export async function GET(request: NextRequest) {
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

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/usuarios`

    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error ORDS response:', response.status, errorText)
      return NextResponse.json(
        { error: "Error al obtener usuarios" },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    let usuarios: any[] = []
    
    if (Array.isArray(data)) {
      usuarios = data
    } else if (data && typeof data === 'object') {
      if ('items' in data && Array.isArray(data.items)) {
        usuarios = data.items
      } else {
        usuarios = []
      }
    }
    
    const transformed = usuarios.map((u: any) => ({
      US_IDUSUARIO_PK: u.us_idusuario_pk || u.US_IDUSUARIO_PK,
      US_NOMBRE: u.us_nombre || u.US_NOMBRE,
      US_CORREO: u.us_correo || u.US_CORREO,
      US_TELEFONO: u.us_telefono || u.US_TELEFONO || "",
      US_USUARIO: u.us_usuario || u.US_USUARIO || "",
      RL_IDROL_FK: u.rl_idrol_fk || u.RL_IDROL_FK,
      NEGOCIOS_IDS: u.negocios_ids || u.NEGOCIOS_IDS || "",
    }))

    return NextResponse.json(transformed)
  } catch (error) {
    console.error("Error fetching usuarios:", error)
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

    if (!body.US_NOMBRE || !body.US_CORREO || !body.US_USUARIO || !body.US_CONTRASENA || !body.RL_IDROL_FK) {
      return NextResponse.json({ error: "Faltan datos obligatorios para crear el usuario" }, { status: 400 })
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Token": token,
    }

    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
    const endpoint = `${cleanApiUrl}/usuarios`

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        nombre: body.US_NOMBRE,
        correo: body.US_CORREO,
        telefono: body.US_TELEFONO || "",
        usuario_login: body.US_USUARIO,
        contrasena: body.US_CONTRASENA,
        rol_id: body.RL_IDROL_FK
      }),
    })

    const data = await response.json()

    const invalidTokenResponse = await checkAndHandleInvalidToken(data)
    if (invalidTokenResponse) return invalidTokenResponse

    if (!response.ok || data.success === 'false') {
      return NextResponse.json(
        { error: data.message || "Error al crear el usuario" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: data.message
    })

  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor" },
      { status: 500 }
    )
  }
}
