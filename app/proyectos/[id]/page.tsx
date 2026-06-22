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
import { ArrowLeft, Plus, ImageIcon, Edit } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCurrentUserClient } from "@/lib/auth"
import { User } from "@/lib/types"
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
  año: number
  mesNombre: string
  activos: ActivoVisual[]
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [categoria, setCategoria] = useState<Categoria | null>(null)
  const [activos, setActivos] = useState<ActivoVisual[]>([])
  const [todosLosActivos, setTodosLosActivos] = useState<ActivoVisual[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCategorias, setLoadingCategorias] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [negocioPermiso, setNegocioPermiso] = useState<string | null>(null)
  
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
    setUser(getCurrentUserClient())
    fetchProyecto()
    initializeCategory()
  }, [projectId])

  useEffect(() => {
    if (categoria) {
      fetchActivos()
      fetchTodosLosActivos()
    }
  }, [categoria, añoSeleccionado, mesSeleccionado])

  const fetchProyecto = async () => {
    try {
      const response = await fetch(`/api/projects`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar proyecto")
      
      const data = await response.json()
      const proyectoEncontrado = data.find((p: any) => p.PR_IDPROYECTO_PK === parseInt(projectId))
      setProyecto(proyectoEncontrado)
      
      if (proyectoEncontrado) {
        // Cargar permisos del negocio
        const negResponse = await fetch(`/api/negocios`, { credentials: "include" })
        if (negResponse.ok) {
          const negData = await negResponse.json()
          const negocio = negData.find((n: any) => n.NG_IDNEGOCIO_PK === proyectoEncontrado.NG_IDNEGOCIO_FK)
          setNegocioPermiso(negocio?.PERMISO_USUARIO || null)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const initializeCategory = async () => {
    try {
      setLoadingCategorias(true)
      const response = await fetch(`/api/projects/${projectId}/categorias`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar categorías")
      
      const data = await response.json()
      let droneCategoria = data.find((c: Categoria) => c.CT_NOMBRE.toLowerCase() === 'drones')
      
      if (!droneCategoria) {
        const createRes = await fetch(`/api/projects/${projectId}/categorias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            CT_NOMBRE: 'Drones',
            CT_DESCRIPCION: 'Categoría principal',
            CT_ICONO: 'drone'
          })
        })
        
        if (createRes.ok) {
          const refreshRes = await fetch(`/api/projects/${projectId}/categorias`, { credentials: "include" })
          const refreshData = await refreshRes.json()
          droneCategoria = refreshData.find((c: Categoria) => c.CT_NOMBRE.toLowerCase() === 'drones')
        }
      }
      
      if (droneCategoria) {
        setCategoria(droneCategoria)
      } else if (data.length > 0) {
        // Fallback to first category if creation fails
        setCategoria(data[0])
      }
    } catch (err) {
      console.error('Error inicializando categoría oculta:', err)
    } finally {
      setLoadingCategorias(false)
    }
  }

  const fetchActivos = async () => {
    if (!categoria) return
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}/activos?year=${añoSeleccionado}&categoriaId=${categoria.CT_IDCATEGORIA_PK}`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar activos")
      
      const data = await response.json()
      const activosFiltrados = (Array.isArray(data) ? data : []).filter(
        (activo: ActivoVisual) => activo.CT_IDCATEGORIA_FK === categoria.CT_IDCATEGORIA_PK
      )
      setActivos(activosFiltrados)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar activos")
    } finally {
      setLoading(false)
    }
  }

  const fetchTodosLosActivos = async () => {
    if (!categoria) return
    try {
      const response = await fetch(`/api/projects/${projectId}/activos?categoriaId=${categoria.CT_IDCATEGORIA_PK}`, {
        credentials: "include",
      })
      
      if (!response.ok) return
      
      const data = await response.json()
      const activosFiltrados = (Array.isArray(data) ? data : []).filter(
        (activo: ActivoVisual) => activo.CT_IDCATEGORIA_FK === categoria.CT_IDCATEGORIA_PK
      )
      setTodosLosActivos(activosFiltrados)
    } catch (err) {
      console.error('Error cargando todos los activos:', err)
    }
  }

  const getFechaParts = (fechaStr: string) => {
    const str = fechaStr.toString();
    if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
      return {
        año: parseInt(str.substring(0, 4)),
        mes: parseInt(str.substring(5, 7)),
        dia: parseInt(str.substring(8, 10))
      };
    }
    const fecha = new Date(str);
    return {
      año: isNaN(fecha.getFullYear()) ? new Date().getFullYear() : fecha.getFullYear(),
      mes: isNaN(fecha.getMonth()) ? new Date().getMonth() + 1 : fecha.getMonth() + 1,
      dia: isNaN(fecha.getDate()) ? new Date().getDate() : fecha.getDate()
    };
  };

  const activosPorDia: ActivosPorDia[] = activos
    .filter((activo) => {
      if (!activo.AV_FECHA_CAPTURA) return false
      if (mesSeleccionado !== null) {
        const { mes } = getFechaParts(activo.AV_FECHA_CAPTURA)
        return mes === mesSeleccionado
      }
      return true
    })
    .reduce((acc: ActivosPorDia[], activo) => {
      const { año, mes, dia } = getFechaParts(activo.AV_FECHA_CAPTURA!)
      const mesNombre = meses[mes - 1] || ""
      const fechaKey = `${año}-${mes}-${dia}`

      const grupoExistente = acc.find((g) => g.fecha === fechaKey)
      if (grupoExistente) {
        grupoExistente.activos.push(activo)
      } else {
        acc.push({
          fecha: fechaKey,
          dia,
          mes,
          año,
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

  const mesesConFotos = Array.from(
    new Set(
      activos
        .filter((activo) => activo.AV_FECHA_CAPTURA)
        .map((activo) => {
          const { mes } = getFechaParts(activo.AV_FECHA_CAPTURA!)
          return mes
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
    if (grupo.activos.length > 0) {
      setSlideshowActivos(grupo.activos)
      setSlideshowIndex(0)
      setSlideshowOpen(true)
    }
  }

  const canEdit = user?.RL_IDROL_FK === 1 || 
                  (user?.RL_IDROL_FK === 2 && (negocioPermiso === ''ADMIN'' || negocioPermiso === ''ESCRITURA''));

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

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:mb-6 mb-4">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <Link href="/proyectos">
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Volver</span>
                    </Button>
                  </Link>
                  <div className="flex-1 sm:flex-none min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                      {proyecto?.PR_NOMBRE || 'Proyecto'}
                    </h1>
                    {proyecto?.PR_UBICACION && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{proyecto.PR_UBICACION}</p>
                    )}
                  </div>
                </div>
                
                {categoria && canEdit && (
                  <Link href={`/proyectos/${projectId}/upload`} className="w-full sm:w-auto">
                    <Button
                      className="bg-slate-800 hover:bg-slate-700 text-white gap-2 w-full sm:w-auto"
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Subir Fotos</span>
                      <span className="sm:hidden">Subir</span>
                    </Button>
                  </Link>
                )}
              </div>

              {/* Timeline de Meses */}
              {categoria && (
                <Card className="p-4 sm:p-6 mb-6 bg-transparent border-0 shadow-none">
                  <div className="flex items-center gap-2 mb-4 sm:mb-6">
                    <h3 className="text-sm font-medium text-gray-600">
                      Cronología
                    </h3>
                    <select
                      value={añoSeleccionado}
                      onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
                      className="text-sm font-medium text-gray-600 bg-transparent border-0 cursor-pointer hover:text-slate-900 focus:outline-none focus:ring-0 appearance-none underline decoration-dotted underline-offset-2"
                      style={{ backgroundImage: 'none', padding: '0', margin: '0' }}
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const año = new Date().getFullYear() - i
                        return <option key={año} value={año}>{año}</option>
                      })}
                    </select>
                  </div>

                  <div className="relative">
                    <div className="overflow-x-auto overflow-y-visible -mx-4 sm:mx-0 px-4 sm:px-0">
                      <div className="relative min-w-max sm:min-w-0">
                        <div className="hidden sm:block absolute top-6 left-0 right-0 h-0.5 bg-gray-300 z-0" />

                        <div className="relative flex sm:justify-between items-start z-10 gap-3 sm:gap-0 min-w-[600px] sm:min-w-0">
                          {Array.from({ length: 12 }, (_, index) => {
                            const mesNumero = index + 1
                            const tieneFotos = mesesConFotos.includes(mesNumero)
                            const estaSeleccionado = mesSeleccionado === mesNumero
                            
                            return (
                              <div key={mesNumero} className="flex flex-col items-center flex-shrink-0" style={{ minWidth: '48px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (tieneFotos) setMesSeleccionado(estaSeleccionado ? null : mesNumero)
                                  }}
                                  disabled={!tieneFotos}
                                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 bg-white flex items-center justify-center mb-2 transition-all ${
                                    tieneFotos
                                      ? estaSeleccionado
                                        ? "border-slate-800 bg-slate-100 shadow-lg cursor-pointer scale-110"
                                        : "border-slate-400 bg-slate-50 cursor-pointer hover:border-slate-600 hover:bg-slate-100 hover:scale-105"
                                      : "border-gray-300 cursor-not-allowed opacity-50"
                                  }`}
                                >
                                  <span className={`text-xs font-bold ${tieneFotos ? (estaSeleccionado ? "text-slate-900" : "text-slate-600") : "text-gray-400"}`}>
                                    {mesNumero}
                                  </span>
                                </button>
                                <span className={`text-xs text-center whitespace-nowrap ${estaSeleccionado ? "text-slate-900 font-semibold" : "text-gray-600"}`}>
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
              )}

              {/* Fotos agrupadas por día */}
              {loadingCategorias || loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                </div>
              ) : activosPorDia.length === 0 ? (
                <div className="p-6">
                  <p className="text-center text-gray-500">
                    {mesSeleccionado 
                      ? `No hay fotos disponibles para ${meses[mesSeleccionado - 1]} ${añoSeleccionado}.`
                      : `No hay fotos disponibles para el año ${añoSeleccionado}.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {activosPorDia.map((grupo) => (
                    <div key={grupo.fecha}>
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {grupo.mesNombre} {grupo.dia}
                        </h2>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDay(grupo)}
                            className="h-6 w-6 sm:h-7 sm:w-7 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                        {grupo.activos.map((activo) => (
                          <Card 
                            key={activo.AV_IDACTIVO_PK} 
                            className="overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow rounded-none cursor-pointer"
                            onClick={() => handleOpenSlideshow(activo, grupo)}
                          >
                            <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                              {!failedImages.has(activo.AV_URL) ? (
                                <Image
                                  src={activo.AV_URL}
                                  alt={activo.AV_NOMBRE || "Activo visual"}
                                  fill
                                  className="object-cover w-full h-full"
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
                                  onError={() => setFailedImages(prev => new Set(prev).add(activo.AV_URL))}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
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

      <PhotoSlideshow
        open={slideshowOpen}
        onOpenChange={setSlideshowOpen}
        activos={slideshowActivos}
        initialIndex={slideshowIndex}
        onEdit={handleEditPhoto}
        onCompare={handleComparePhoto}
      />

      <EditPhotoModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        activo={activoEditando}
        projectId={projectId}
        onSave={handleSaveEdit}
      />

      <ComparePhotosModal
        open={compareModalOpen}
        onOpenChange={setCompareModalOpen}
        activosPorDia={activosPorDia}
        activoInicial={activoComparando}
        todosLosActivos={todosLosActivos}
      />
    </AuthGuard>
  )
}
