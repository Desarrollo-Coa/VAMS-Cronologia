"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUserClient, logout, isAuthenticatedClient } from "@/lib/auth"
import { useEffect, useState } from "react"
import { User as UserType } from "@/lib/types"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setUser(getCurrentUserClient())
  }, [pathname])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const isLoginPage = pathname === "/login"

  if (!mounted) {
    return null
  }

  return (
    <header className="bg-slate-800 text-white border-b border-slate-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <span className="text-sm font-bold text-green-500">v0.0.0.1</span>
            </div>
            <Link href="/" className="text-lg">
              Sistema de Gestión de Activos Visuales
            </Link>
          </div>


          <div className="flex items-center gap-4">
            {isAuthenticatedClient() && user && !isLoginPage && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="text-slate-300">{user.US_NOMBRE}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:bg-slate-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Salir
                </Button>
              </div>
            )}
          <Button variant="ghost" size="icon" className="md:hidden text-white">
            <Menu className="h-5 w-5" />
          </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
