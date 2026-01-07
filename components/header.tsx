"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUserClient, logout, isAuthenticatedClient } from "@/lib/auth"
import { useEffect, useState } from "react"
import { User as UserType } from "@/lib/types"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { menuItems } from "@/components/sidebar"
import { cn } from "@/lib/utils"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserType | null>(null)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Botón de menú móvil */}
            {isAuthenticatedClient() && !isLoginPage && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-slate-700 -ml-2"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <div className="flex flex-col py-6">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || (item.href === "/" && pathname === "/")
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm transition-colors relative",
                            isActive 
                              ? "text-slate-800 font-medium border-l-4 border-slate-800 bg-gray-100" 
                              : "text-gray-600 hover:text-slate-800 hover:bg-gray-100",
                          )}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <span className="text-sm font-bold text-green-500">v0.0.0.1</span>
            </div>
            <Link href="/" className="text-base md:text-lg font-semibold">
              <span className="hidden sm:inline">Sistema de Gestión de Activos Visuales</span>
              <span className="sm:hidden">VAMS</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {isAuthenticatedClient() && user && !isLoginPage && (
              <>
                <div className="hidden sm:flex items-center gap-2 md:gap-3">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <User className="h-4 w-4" />
                    <span className="text-slate-300 hidden md:inline">{user.US_NOMBRE}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-white hover:bg-slate-700"
                  >
                    <LogOut className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Salir</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="sm:hidden text-white"
                >
                  <LogOut className="h-4 w-4" />
          </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
