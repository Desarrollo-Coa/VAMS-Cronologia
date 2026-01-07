"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FolderOpen, ImageIcon, GitCompare, Upload, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: Home, label: "Inicio", href: "/" },
  { icon: FolderOpen, label: "Proyectos", href: "/proyectos" },
  { icon: ImageIcon, label: "Activos Visuales", href: "/activos-visuales" },
  { icon: GitCompare, label: "Comparaciones", href: "/comparaciones" },
  { icon: Upload, label: "Cargas", href: "/cargas" },
  { icon: Settings, label: "Configuración", href: "/configuracion" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-52 bg-gray-50 border-r border-gray-200 flex flex-col py-6">
      {menuItems.map((item) => {
        const Icon = item.icon
        // Para la ruta "/", también considerar cuando pathname es exactamente "/"
        const isActive = pathname === item.href || (item.href === "/" && pathname === "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm transition-colors relative",
              isActive 
                ? "text-slate-800 font-medium border-l-4 border-slate-800 bg-gray-100" 
                : "text-gray-600 hover:text-slate-800 hover:bg-gray-100",
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </aside>
  )
}
