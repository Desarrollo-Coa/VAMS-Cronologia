"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DroneIcon } from "@/components/drone-icon"
import { ArrowLeft, Plus, Folder, Camera, Building, MapPin, Package, Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { EditCategoriaModal } from "@/components/edit-categoria-modal"

interface Proyecto {
  PR_IDPROYECTO_PK: number
  PR_NOMBRE: string
  PR_UBICACION?: string
  PR_DESCRIPCION?: string
  PR_FOTO_PORTADA_URL?: string
}

interface Categoria {
  CT_IDCATEGORIA_PK: number
  PR_IDPROYECTO_FK: number
  CT_NOMBRE: string
  CT_DESCRIPCION?: string
  CT_ICONO?: string
  CT_COLOR?: string
  CT_ORDEN?: number
  CT_ACTIVO: string
}

const iconosDisponibles: { [key: string]: any } = {
  'folder': Folder,
  'camera': Camera,
  'building': Building,
  'map-pin': MapPin,
  'package': Package,
  'drone': DroneIcon,
}

export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreatingCategoria, setIsCreatingCategoria] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '', icono: 'folder' })
  const [editCategoriaModalOpen, setEditCategoriaModalOpen] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null)

  useEffect(() => {
    fetchProyecto()
    fetchCategorias()
  }, [projectId])

  const fetchProyecto = async () => {
    try {
      const response = await fetch(`/api/projects`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar proyecto")
      
      const data = await response.json()
      const proyectoEncontrado = data.find((p: Proyecto) => p.PR_IDPROYECTO_PK === parseInt(projectId))
      
      if (proyectoEncontrado) {
        setProyecto(proyectoEncontrado)
      } else {
        setError("Proyecto no encontrado")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const fetchCategorias = async () => {
    try {
      setLoadingCategorias(true)
      const response = await fetch(`/api/projects/${projectId}/categorias`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar categorías")
      
      const data = await response.json()
      setCategorias(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error cargando categorías:', err)
      setCategorias([])
    } finally {
      setLoadingCategorias(false)
    }
  }

  const handleCreateCategoria = async () => {
    if (!nuevaCategoria.nombre.trim()) {
      setError("El nombre de la categoría es requerido")
      return
    }

    try {
      setIsCreatingCategoria(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/categorias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          CT_NOMBRE: nuevaCategoria.nombre,
          CT_DESCRIPCION: nuevaCategoria.descripcion || '',
          CT_ICONO: nuevaCategoria.icono,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Error al crear categoría")
      }

      const result = await response.json()
      
      // Recargar categorías
      await fetchCategorias()
      
      // Limpiar formulario y cerrar diálogo
      setNuevaCategoria({ nombre: '', descripcion: '', icono: 'folder' })
      setIsCreatingCategoria(false)
      setDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear categoría")
      setIsCreatingCategoria(false)
    }
  }

  if (loadingCategorias && !proyecto) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !proyecto) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <Header />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error || "Proyecto no encontrado"}
                </div>
              </div>
            </main>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <Link href="/proyectos">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Volver</span>
                    </Button>
                  </Link>
                  <div className="flex-1 sm:flex-none min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                      {proyecto.PR_NOMBRE}
                    </h1>
                    {proyecto.PR_UBICACION && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{proyecto.PR_UBICACION}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-slate-800 hover:bg-slate-700 text-white gap-2"
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Crear Categoría</span>
                        <span className="sm:hidden">Crear</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Categoría</DialogTitle>
                        <DialogDescription>
                          Crea una nueva categoría para organizar las fotos del proyecto
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="cat-nombre" className="text-sm mb-1 block">
                            Nombre *
                          </Label>
                          <Input
                            id="cat-nombre"
                            value={nuevaCategoria.nombre}
                            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
                            placeholder="Ej: Drones, Interiores, Exteriores"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cat-descripcion" className="text-sm mb-1 block">
                            Descripción
                          </Label>
                          <Input
                            id="cat-descripcion"
                            value={nuevaCategoria.descripcion}
                            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, descripcion: e.target.value })}
                            placeholder="Descripción opcional"
                          />
                        </div>
                        <div>
                          <Label className="text-sm mb-2 block">
                            Icono
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(iconosDisponibles).map(([key, IconComponent]) => {
                              const iconLabels: { [key: string]: string } = {
                                'folder': 'Carpeta',
                                'camera': 'Cámara',
                                'building': 'Edificio',
                                'map-pin': 'Ubicación',
                                'package': 'Paquete',
                                'drone': 'Dron'
                              }
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setNuevaCategoria({ ...nuevaCategoria, icono: key })}
                                  className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                                    nuevaCategoria.icono === key
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {key === 'drone' ? (
                                    <DroneIcon className="w-5 h-5" />
                                  ) : (
                                    <IconComponent className="w-5 h-5" />
                                  )}
                                  <span className="text-xs">{iconLabels[key] || key}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false)
                            setNuevaCategoria({ nombre: '', descripcion: '', icono: 'folder' })
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCreateCategoria}
                          disabled={isCreatingCategoria || !nuevaCategoria.nombre.trim()}
                          className="bg-slate-800 hover:bg-slate-700"
                        >
                          {isCreatingCategoria ? 'Creando...' : 'Crear Categoría'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Mostrar categorías */}
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3 sm:mb-4">Categorías</h2>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                {loadingCategorias ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                    </div>
                ) : categorias.length === 0 ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-12 text-center">
                    <Folder className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm sm:text-base text-gray-600 mb-2">No hay categorías disponibles</p>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4">
                      Crea una categoría para organizar las fotos del proyecto
                      </p>
                    </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {categorias.map((categoria) => {
                      const iconoKey = categoria.CT_ICONO || 'folder'
                      const IconComponent = iconosDisponibles[iconoKey] || Folder
                      return (
                        <div key={categoria.CT_IDCATEGORIA_PK} className="relative group">
                          {/* Botón de edición */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setCategoriaEditando(categoria)
                              setEditCategoriaModalOpen(true)
                            }}
                          >
                            <Pencil className="w-4 h-4 text-slate-800" />
                      </Button>
                          <Link href={`/proyectos/${projectId}/categoria/${categoria.CT_IDCATEGORIA_PK}`}>
                            <Card
                              className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                            >
                              <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                                  {iconoKey === 'drone' ? (
                                    <DroneIcon className="w-8 h-8 text-blue-600" />
                                  ) : (
                                    <IconComponent className="w-8 h-8 text-blue-600" />
                                  )}
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">
                                  {categoria.CT_NOMBRE}
                                </h3>
                                {categoria.CT_DESCRIPCION && (
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {categoria.CT_DESCRIPCION}
                                  </p>
                                )}
                              </div>
                            </Card>
                    </Link>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        <Footer />
      </div>

      {/* Modal de edición de categoría */}
      <EditCategoriaModal
        open={editCategoriaModalOpen}
        onOpenChange={setEditCategoriaModalOpen}
        categoria={categoriaEditando}
        projectId={projectId}
        onSave={fetchCategorias}
      />
    </AuthGuard>
  )
}

