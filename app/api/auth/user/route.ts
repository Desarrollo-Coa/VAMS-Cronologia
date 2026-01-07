import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * API route para obtener el usuario actual desde cookies (servidor)
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userStr = cookieStore.get("vams_user")?.value

    if (!userStr) {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      )
    }

    try {
      const user = JSON.parse(userStr)
      return NextResponse.json({
        success: true,
        user,
      })
    } catch {
      return NextResponse.json(
        { success: false, user: null },
        { status: 401 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, user: null },
      { status: 500 }
    )
  }
}

