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

interface SidebarProps {
  onItemClick?: () => void
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-52 bg-gray-50 border-r border-gray-200 flex-col py-6">
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href === "/" && pathname === "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
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
    </aside>
  )
}

// Exportar menuItems para usar en el header
export { menuItems }
