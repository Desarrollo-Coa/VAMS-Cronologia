import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { uploadFileToStorage } from "@/lib/firebase-storage"

/**
 * API Route para subir archivos a Firebase Storage desde el servidor
 * POST /api/upload
 * 
 * Body (FormData):
 * - file: Archivo a subir
 * - directorio: (opcional) Directorio donde guardar. Default: "activos-visuales"
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies()
    const token = cookieStore.get("vams_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado. Debes iniciar sesión." },
        { status: 401 }
      )
    }

    // Obtener datos del formulario
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const directorio = (formData.get("directorio") as string) || "activos-visuales"

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      )
    }

    // Validar tamaño del archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 10MB" },
        { status: 400 }
      )
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir a Firebase Storage desde el servidor
    const url = await uploadFileToStorage(
      buffer,
      file.name,
      file.type || "application/octet-stream",
      directorio
    )

    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
      size: file.size,
      contentType: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir el archivo" },
      { status: 500 }
    )
  }
}
