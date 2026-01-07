import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Usuario y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Obtener la URL de la API externa desde variables de entorno
    const apiUrl = process.env.NEXT_PUBLIC_DB_API_URL || process.env.DB_API_URL

    if (!apiUrl) {
      console.error("DB_API_URL no está configurada en las variables de entorno")
      return NextResponse.json(
        { success: false, message: "Error de configuración del servidor" },
        { status: 500 }
      )
    }

    try {
      // Llamar a la API ORDS REST para autenticar
      // URL esperada: https://apps.fortoxsecurity.com:8888/apex/ws_sator/vams/auth/login
      // La apiUrl ya incluye el path base del módulo vams/, solo agregamos el endpoint
      const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl
      const response = await fetch(`${cleanApiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return NextResponse.json(
          {
            success: false,
            message: errorData.message || "Error al autenticar. Verifica tus credenciales.",
          },
          { status: response.status }
        )
      }

      const data = await response.json()

      // La API ORDS retorna: { success: "true"/"false", message: "...", user_json: "...", token: "..." }
      // Necesitamos parsear user_json si existe
      if (data.success === "true" || data.success === true) {
        let userData = null
        if (data.user_json) {
          try {
            userData = typeof data.user_json === "string" 
              ? JSON.parse(data.user_json) 
              : data.user_json
          } catch (e) {
            // Si user_json viene como objeto ya parseado
            userData = data.user_json
          }
        }

        // Crear respuesta con cookies
        const response = NextResponse.json({
          success: true,
          user: userData,
          token: data.token, // Token de acceso (32 caracteres)
          message: data.message || "Autenticación exitosa",
        })

        // Establecer cookies (HttpOnly para seguridad, SameSite para protección CSRF)
        const maxAge = 24 * 60 * 60 // 24 horas en segundos
        
        response.cookies.set("vams_token", data.token, {
          httpOnly: false, // Necesario para acceso desde cliente para llamadas a ORDS
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: maxAge,
          path: "/",
        })

        response.cookies.set("vams_user", JSON.stringify(userData), {
          httpOnly: false, // Necesario para acceso desde cliente
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: maxAge,
          path: "/",
        })

        response.cookies.set("vams_authenticated", "true", {
          httpOnly: false, // Necesario para acceso desde cliente
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: maxAge,
          path: "/",
        })

        return response
      } else {
        return NextResponse.json(
          { success: false, message: data.message || "Credenciales inválidas" },
          { status: 401 }
        )
      }
    } catch (fetchError) {
      console.error("Error al conectar con la API externa:", fetchError)
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo conectar con el servidor de autenticación",
        },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

