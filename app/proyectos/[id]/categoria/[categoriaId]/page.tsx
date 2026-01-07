"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhotoSlideshow } from "@/components/photo-slideshow"
import { EditPhotoModal } from "@/components/edit-photo-modal"
import { ComparePhotosModal } from "@/components/compare-photos-modal"
import { ArrowLeft, Calendar, Plus, ImageIcon, Edit } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

interface ActivoVisual {
  AV_IDACTIVO_PK: number
  AV_NOMBRE?: string
  AV_DESCRIPCION?: string
  AV_URL: string
  AV_FECHA_CAPTURA?: string
  AV_FECHA_CARGA?: string
  CT_IDCATEGORIA_FK?: number
}

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

interface ActivosPorDia {
  fecha: string
  dia: number
  mes: number
  mesNombre: string
  activos: ActivoVisual[]
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default function CategoriaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const categoriaId = params.categoriaId as string

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [activos, setActivos] = useState<ActivoVisual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [añoSeleccionado, setAñoSeleccionado] = useState(new Date().getFullYear())
  const [mesSeleccionado, setMesSeleccionado] = useState<number | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [slideshowOpen, setSlideshowOpen] = useState(false)
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const [slideshowActivos, setSlideshowActivos] = useState<ActivoVisual[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [activoEditando, setActivoEditando] = useState<ActivoVisual | null>(null)
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [activoComparando, setActivoComparando] = useState<ActivoVisual | null>(null)

  useEffect(() => {
    fetchProyecto()
    fetchCategoria()
    fetchActivos()
  }, [projectId, categoriaId, añoSeleccionado, mesSeleccionado])

  const fetchProyecto = async () => {
    try {
      const response = await fetch(`/api/projects`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar proyecto")
      
      const data = await response.json()
      const proyectoEncontrado = data.find((p: any) => p.PR_IDPROYECTO_PK === parseInt(projectId))
      setProyecto(proyectoEncontrado)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const fetchCategoria = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/categorias`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar categoría")
      
      const data = await response.json()
      const categoriaEncontrada = data.find((c: Categoria) => c.CT_IDCATEGORIA_PK === parseInt(categoriaId))
      setCategoria(categoriaEncontrada)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const fetchActivos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/activos?year=${añoSeleccionado}&categoriaId=${categoriaId}`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar activos")
      
      const data = await response.json()
      // Filtrar activos por categoría seleccionada
      const activosFiltrados = (Array.isArray(data) ? data : []).filter(
        (activo: ActivoVisual) => activo.CT_IDCATEGORIA_FK === parseInt(categoriaId)
      )
      setActivos(activosFiltrados)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar activos")
    } finally {
      setLoading(false)
    }
  }

  // Agrupar activos por día
  const activosPorDia: ActivosPorDia[] = activos
    .filter((activo) => {
      if (!activo.AV_FECHA_CAPTURA) return false
      // Si hay un mes seleccionado, filtrar por ese mes
      if (mesSeleccionado !== null) {
        const fecha = new Date(activo.AV_FECHA_CAPTURA!)
        return fecha.getMonth() + 1 === mesSeleccionado
      }
      return true
    })
    .reduce((acc: ActivosPorDia[], activo) => {
      const fecha = new Date(activo.AV_FECHA_CAPTURA!)
      const dia = fecha.getDate()
      const mes = fecha.getMonth() + 1
      const mesNombre = meses[mes - 1]
      const fechaKey = `${fecha.getFullYear()}-${mes}-${dia}`

      const grupoExistente = acc.find((g) => g.fecha === fechaKey)
      if (grupoExistente) {
        grupoExistente.activos.push(activo)
      } else {
        acc.push({
          fecha: fechaKey,
          dia,
          mes,
          mesNombre,
          activos: [activo],
        })
      }
      return acc
    }, [])
    .sort((a, b) => {
      if (a.mes !== b.mes) return a.mes - b.mes
      return a.dia - b.dia
    })

  // Obtener meses con fotos para el timeline
  const mesesConFotos = Array.from(
    new Set(
      activos
        .filter((activo) => activo.AV_FECHA_CAPTURA)
        .map((activo) => {
          const fecha = new Date(activo.AV_FECHA_CAPTURA!)
          return fecha.getMonth() + 1
        })
    )
  )

  const handleOpenSlideshow = (activo: ActivoVisual, grupo: ActivosPorDia) => {
    setSlideshowActivos(grupo.activos)
    const index = grupo.activos.findIndex((a) => a.AV_IDACTIVO_PK === activo.AV_IDACTIVO_PK)
    setSlideshowIndex(index >= 0 ? index : 0)
    setSlideshowOpen(true)
  }

  const handleEditPhoto = (activo: ActivoVisual) => {
    setActivoEditando(activo)
    setEditModalOpen(true)
    setSlideshowOpen(false)
  }

  const handleComparePhoto = (activo: ActivoVisual) => {
    setActivoComparando(activo)
    setCompareModalOpen(true)
    setSlideshowOpen(false)
  }

  const handleSaveEdit = () => {
    fetchActivos()
    setEditModalOpen(false)
    setActivoEditando(null)
  }

  const handleEditDay = (grupo: ActivosPorDia) => {
    // Abrir slideshow con todas las fotos del día para editar
    if (grupo.activos.length > 0) {
      setSlideshowActivos(grupo.activos)
      setSlideshowIndex(0)
      setSlideshowOpen(true)
    }
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
                  <Link href={`/proyectos/${projectId}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Volver</span>
                    </Button>
                  </Link>
                  <div className="flex-1 sm:flex-none min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                      {categoria?.CT_NOMBRE || 'Categoría'}
                    </h1>
                    {proyecto?.PR_NOMBRE && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{proyecto.PR_NOMBRE}</p>
                    )}
                  </div>
                </div>
                <Link href={`/proyectos/${projectId}/upload?categoriaId=${categoriaId}`} className="w-full sm:w-auto">
                  <Button
                    className="bg-slate-800 hover:bg-slate-700 text-white gap-2 w-full sm:w-auto"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Subir Fotos</span>
                    <span className="sm:hidden">Subir</span>
                  </Button>
                </Link>
              </div>

              {/* Timeline de Meses */}
              <Card className="p-4 sm:p-6 mb-6 bg-transparent border-0 shadow-none">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <h3 className="text-sm font-medium text-gray-600">
                    Cronología
                  </h3>
                  <select
                    value={añoSeleccionado}
                    onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                    className="text-sm font-medium text-gray-600 bg-transparent border-0 cursor-pointer hover:text-slate-900 focus:outline-none focus:ring-0 appearance-none underline decoration-dotted underline-offset-2"
                    style={{ 
                      backgroundImage: 'none',
                      padding: '0',
                      margin: '0',
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const año = new Date().getFullYear() - i
                      return (
                        <option key={año} value={año}>
                          {año}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div className="relative">
                  {/* Contenedor con scroll horizontal en móvil */}
                  <div className="overflow-x-auto overflow-y-visible -mx-4 sm:mx-0 px-4 sm:px-0">
                    <div className="relative min-w-max sm:min-w-0">
                      {/* Línea del timeline - solo visible en desktop */}
                      <div className="hidden sm:block absolute top-6 left-0 right-0 h-0.5 bg-gray-300 z-0" />

                      {/* Círculos de meses con scroll horizontal */}
                      <div className="relative flex sm:justify-between items-start z-10 gap-3 sm:gap-0 min-w-[600px] sm:min-w-0">
                        {Array.from({ length: 12 }, (_, index) => {
                          const mesNumero = index + 1
                          const tieneFotos = mesesConFotos.includes(mesNumero)
                          const estaSeleccionado = mesSeleccionado === mesNumero
                          
                          return (
                            <div 
                              key={mesNumero} 
                              className="flex flex-col items-center flex-shrink-0"
                              style={{ minWidth: '48px' }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (tieneFotos) {
                                    // Si el mes ya está seleccionado, deseleccionarlo
                                    setMesSeleccionado(estaSeleccionado ? null : mesNumero)
                                  }
                                }}
                                disabled={!tieneFotos}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 bg-white flex items-center justify-center mb-2 transition-all ${
                                  tieneFotos
                                    ? estaSeleccionado
                                      ? "border-blue-600 bg-blue-100 shadow-lg cursor-pointer hover:scale-110"
                                      : "border-blue-500 bg-blue-50 cursor-pointer hover:border-blue-600 hover:bg-blue-100 hover:scale-105"
                                    : "border-gray-300 cursor-not-allowed opacity-50"
                                }`}
                              >
                                <span
                                  className={`text-xs font-bold ${
                                    tieneFotos 
                                      ? estaSeleccionado 
                                        ? "text-blue-700" 
                                        : "text-blue-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {mesNumero}
                                </span>
                              </button>
                              <span className={`text-xs text-center whitespace-nowrap ${
                                estaSeleccionado ? "text-blue-600 font-semibold" : "text-gray-600"
                              }`}>
                                {meses[index].substring(0, 3)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Fotos agrupadas por día */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                </div>
              ) : activosPorDia.length === 0 ? (
                <div className="p-6">
                  <p className="text-center text-gray-500">
                    {mesSeleccionado 
                      ? `No hay fotos disponibles para ${meses[mesSeleccionado - 1]} ${añoSeleccionado} en esta categoría.`
                      : `No hay fotos disponibles para el año ${añoSeleccionado} en esta categoría.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {activosPorDia.map((grupo) => (
                    <div key={grupo.fecha}>
                      {/* Título del día con icono de editar */}
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {grupo.mesNombre} {grupo.dia}
                        </h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditDay(grupo)}
                          className="h-6 w-6 sm:h-7 sm:w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Grid de fotos */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                        {grupo.activos.map((activo) => (
                          <Card 
                            key={activo.AV_IDACTIVO_PK} 
                            className="overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-none cursor-pointer"
                            onClick={() => handleOpenSlideshow(activo, grupo)}
                          >
                            {/* Imagen superior */}
                            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                              {!failedImages.has(activo.AV_URL) ? (
                                <Image
                                  src={activo.AV_URL}
                                  alt={activo.AV_NOMBRE || "Activo visual"}
                                  fill
                                  className="object-cover w-full h-full"
                                  loading="lazy"
                                  unoptimized
                                  onError={() => {
                                    console.error('Error cargando imagen:', activo.AV_URL)
                                    setFailedImages(prev => new Set(prev).add(activo.AV_URL))
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            {/* Texto inferior con fondo blanco */}
                            <div className="bg-white p-2 min-h-[48px] flex flex-col justify-center">
                              {activo.AV_NOMBRE && (
                                <p className="text-xs font-medium text-slate-900 line-clamp-1 text-center">
                                  {activo.AV_NOMBRE}
                                </p>
                              )}
                              {!activo.AV_NOMBRE && activo.AV_DESCRIPCION && (
                                <p className="text-xs text-gray-600 line-clamp-1 text-center">
                                  {activo.AV_DESCRIPCION}
                                </p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        <Footer />
      </div>

      {/* Slideshow de fotos */}
      <PhotoSlideshow
        open={slideshowOpen}
        onOpenChange={setSlideshowOpen}
        activos={slideshowActivos}
        initialIndex={slideshowIndex}
        onEdit={handleEditPhoto}
        onCompare={handleComparePhoto}
      />

      {/* Modal de edición */}
      <EditPhotoModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        activo={activoEditando}
        projectId={projectId}
        onSave={handleSaveEdit}
      />

      {/* Modal de comparación */}
      <ComparePhotosModal
        open={compareModalOpen}
        onOpenChange={setCompareModalOpen}
        activosPorDia={activosPorDia}
        activoInicial={activoComparando}
      />
    </AuthGuard>
  )
}

