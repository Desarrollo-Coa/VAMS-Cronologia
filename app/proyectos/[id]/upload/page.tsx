"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Calendar, X, Folder, Camera, Building, MapPin, ImageIcon, Package } from "lucide-react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DroneIcon } from "@/components/drone-icon"
import { DroneProtocolChecklist } from "@/components/drone-protocol-checklist"

interface FotoSeleccionada {
  file: File
  preview: string
  fechaCaptura: string
  horaCaptura?: string // Hora en formato HH:MM:SS del EXIF
  nombre?: string
  descripcion?: string
  exifExtraido: boolean
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

const iconosDisponibles = [
  { value: 'folder', label: 'Carpeta', icon: Folder },
  { value: 'camera', label: 'Cámara', icon: Camera },
  { value: 'building', label: 'Edificio', icon: Building },
  { value: 'map-pin', label: 'Ubicación', icon: MapPin },
  { value: 'image', label: 'Imagen', icon: ImageIcon },
  { value: 'package', label: 'Paquete', icon: Package },
  { value: 'drone', label: 'Dron', icon: DroneIcon },
]

export default function UploadPhotosPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [fotos, setFotos] = useState<FotoSeleccionada[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proyecto, setProyecto] = useState<any>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null)
  const [showProtocolChecklist, setShowProtocolChecklist] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProyecto()
    fetchCategorias()
    
    // Cargar categoriaId desde query string si existe
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const categoriaIdParam = urlParams.get('categoriaId')
      if (categoriaIdParam) {
        const categoriaId = parseInt(categoriaIdParam)
        if (!isNaN(categoriaId)) {
          setCategoriaSeleccionada(categoriaId)
        }
      }
    }
  }, [projectId])

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

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/categorias`, {
        credentials: "include",
      })
      
      if (!response.ok) throw new Error("Error al cargar categorías")
      
      const data = await response.json()
      setCategorias(data)
      
      // Si hay categorías y no hay una seleccionada, seleccionar la primera por defecto
      // (a menos que ya se haya seleccionado una desde el query string)
      if (data.length > 0 && !categoriaSeleccionada) {
        // Verificar si hay categoriaId en el query string
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search)
          const categoriaIdParam = urlParams.get('categoriaId')
          if (categoriaIdParam) {
            const categoriaId = parseInt(categoriaIdParam)
            if (!isNaN(categoriaId)) {
              setCategoriaSeleccionada(categoriaId)
              return
            }
          }
        }
        // Si no hay categoriaId en query string, usar la primera categoría
        setCategoriaSeleccionada(data[0].CT_IDCATEGORIA_PK)
      }
    } catch (err) {
      console.error('Error cargando categorías:', err)
    }
  }

  // Función auxiliar para convertir fecha EXIF a formato YYYY-MM-DD y hora HH:MM:SS sin problemas de zona horaria
  const parsearFechaEXIF = (fechaEXIF: any): { fecha: string; hora?: string } | null => {
    if (!fechaEXIF) return null

    // Si es un string en formato EXIF "YYYY:MM:DD HH:MM:SS"
    if (typeof fechaEXIF === 'string') {
      // Formato EXIF típico: "2024:01:15 14:30:00"
      const match = fechaEXIF.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
      if (match) {
        const [, year, month, day, hour, minute, second] = match
        return {
          fecha: `${year}-${month}-${day}`,
          hora: `${hour}:${minute}:${second}`
        }
      }
      
      // Si ya está en formato ISO o similar
      if (fechaEXIF.includes('-')) {
        const parts = fechaEXIF.split('T')
        const fecha = parts[0]
        const hora = parts[1] ? parts[1].split('.')[0].split('+')[0].split('Z')[0] : undefined
        return { fecha, hora }
      }
    }

    // Si es un objeto Date, extraer componentes localmente (sin conversión UTC)
    if (fechaEXIF instanceof Date) {
      const year = fechaEXIF.getFullYear()
      const month = String(fechaEXIF.getMonth() + 1).padStart(2, '0')
      const day = String(fechaEXIF.getDate()).padStart(2, '0')
      const hour = String(fechaEXIF.getHours()).padStart(2, '0')
      const minute = String(fechaEXIF.getMinutes()).padStart(2, '0')
      const second = String(fechaEXIF.getSeconds()).padStart(2, '0')
      return {
        fecha: `${year}-${month}-${day}`,
        hora: `${hour}:${minute}:${second}`
      }
    }

    return null
  }

  // Extraer fecha EXIF de una imagen
  const extraerFechaEXIF = async (file: File): Promise<{ fecha: string; horaCaptura?: string; exifExtraido: boolean }> => {
    try {
      let exifr: any = null
      try {
        exifr = await import('exifr')
      } catch {
        // exifr no está instalado, usar fallback
      }
      
      if (exifr?.default) {
        // Extraer también la hora si está disponible
        const exifData = await exifr.default.parse(file, { 
          pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'SubSecTimeOriginal'] 
        })
        
        // Intentar DateTimeOriginal primero (más confiable)
        if (exifData?.DateTimeOriginal) {
          const fechaHora = parsearFechaEXIF(exifData.DateTimeOriginal)
          if (fechaHora) {
            return {
              fecha: fechaHora.fecha,
              horaCaptura: fechaHora.hora,
              exifExtraido: true
            }
          }
        }
        
        // Intentar CreateDate
        if (exifData?.CreateDate) {
          const fechaHora = parsearFechaEXIF(exifData.CreateDate)
          if (fechaHora) {
            return {
              fecha: fechaHora.fecha,
              horaCaptura: fechaHora.hora,
              exifExtraido: true
            }
          }
        }
        
        // Intentar ModifyDate como último recurso
        if (exifData?.ModifyDate) {
          const fechaHora = parsearFechaEXIF(exifData.ModifyDate)
          if (fechaHora) {
            return {
              fecha: fechaHora.fecha,
              horaCaptura: fechaHora.hora,
              exifExtraido: true
            }
          }
        }
      }
      
      // Fallback: usar la fecha de modificación del archivo
      const fechaArchivo = new Date(file.lastModified)
      const year = fechaArchivo.getFullYear()
      const month = String(fechaArchivo.getMonth() + 1).padStart(2, '0')
      const day = String(fechaArchivo.getDate()).padStart(2, '0')
      const hour = String(fechaArchivo.getHours()).padStart(2, '0')
      const minute = String(fechaArchivo.getMinutes()).padStart(2, '0')
      const second = String(fechaArchivo.getSeconds()).padStart(2, '0')
      return {
        fecha: `${year}-${month}-${day}`,
        horaCaptura: `${hour}:${minute}:${second}`,
        exifExtraido: false
      }
    } catch (err) {
      console.error('Error extrayendo EXIF:', err)
      const fechaArchivo = new Date(file.lastModified)
      const year = fechaArchivo.getFullYear()
      const month = String(fechaArchivo.getMonth() + 1).padStart(2, '0')
      const day = String(fechaArchivo.getDate()).padStart(2, '0')
      const hour = String(fechaArchivo.getHours()).padStart(2, '0')
      const minute = String(fechaArchivo.getMinutes()).padStart(2, '0')
      const second = String(fechaArchivo.getSeconds()).padStart(2, '0')
      return {
        fecha: `${year}-${month}-${day}`,
        horaCaptura: `${hour}:${minute}:${second}`,
        exifExtraido: false
      }
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return

    setError(null)
    const nuevasFotos: FotoSeleccionada[] = []

    // Convertir FileList a Array si es necesario
    const filesArray = Array.isArray(files) ? files : Array.from(files)

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i]

      if (!file.type.startsWith('image/')) {
        setError(`El archivo ${file.name} no es una imagen válida`)
        continue
      }

      if (file.size > 50 * 1024 * 1024) {
        setError(`El archivo ${file.name} es demasiado grande. Máximo 50MB`)
        continue
      }

      const preview = URL.createObjectURL(file)
      const { fecha, horaCaptura, exifExtraido } = await extraerFechaEXIF(file)

      nuevasFotos.push({
        file,
        preview,
        fechaCaptura: fecha,
        horaCaptura,
        nombre: file.name.replace(/\.[^/.]+$/, ""),
        exifExtraido,
      })
    }

    setFotos((prev) => [...prev, ...nuevasFotos])
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }
  

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Convertir FileList a Array ANTES de limpiar el input
      // Esto evita que el FileList se vuelva inválido cuando se limpia el input
      const filesArray = Array.from(files)
      
      // Limpiar el input primero para permitir seleccionar los mismos archivos de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Procesar los archivos después de limpiar (ya están en un array, no dependen del input)
      handleFiles(filesArray)
    }
  }

  const removeFoto = (index: number) => {
    setFotos((prev) => {
      const nueva = [...prev]
      URL.revokeObjectURL(nueva[index].preview)
      nueva.splice(index, 1)
      return nueva
    })
  }

  const updateFoto = (index: number, updates: Partial<FotoSeleccionada>) => {
    setFotos((prev) => {
      const nueva = [...prev]
      nueva[index] = { ...nueva[index], ...updates }
      return nueva
    })
  }

  const handleSave = async () => {
    if (fotos.length === 0) {
      setError("Debes seleccionar al menos una foto")
      return
    }

    const fotosSinFecha = fotos.filter((f) => !f.fechaCaptura)
    if (fotosSinFecha.length > 0) {
      setError("Todas las fotos deben tener una fecha de captura")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      const { uploadFileToStorage } = await import('@/lib/firebase-client')

      if (!categoriaSeleccionada) {
        setError("Debes seleccionar una categoría antes de subir las fotos")
        setIsUploading(false)
        return
      }

      const activosPromises = fotos.map(async (foto) => {
        const url = await uploadFileToStorage(foto.file, `proyectos/${projectId}/activos`)

        // Combinar fecha y hora si la hora está disponible
        const fechaCompleta = foto.horaCaptura 
          ? `${foto.fechaCaptura} ${foto.horaCaptura}`
          : foto.fechaCaptura

        const payload = {
          AV_NOMBRE: foto.nombre || foto.file.name,
          AV_DESCRIPCION: foto.descripcion || '',
          AV_URL: url,
          AV_FECHA_CAPTURA: fechaCompleta,
          AV_FILENAME: foto.file.name,
          AV_MIMETYPE: foto.file.type,
          AV_TAMANIO: foto.file.size,
          CT_IDCATEGORIA_FK: categoriaSeleccionada,
        }

        console.log(`Guardando foto ${foto.file.name}:`, {
          ...payload,
          AV_URL: payload.AV_URL ? `${payload.AV_URL.substring(0, 50)}...` : null,
          AV_FECHA_CAPTURA_length: payload.AV_FECHA_CAPTURA?.length,
          CT_IDCATEGORIA_FK: payload.CT_IDCATEGORIA_FK
        })

        const response = await fetch(`/api/projects/${projectId}/activos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Error al guardar ${foto.file.name}:`, {
            status: response.status,
            statusText: response.statusText,
            errorText: errorText.substring(0, 500)
          })
          
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          throw new Error(errorData.error || errorData.message || `Error al guardar ${foto.file.name}`)
        }

        const result = await response.json()
        console.log(`Foto ${foto.file.name} guardada exitosamente:`, {
          success: result.success,
          message: result.message,
          activo_id: result.activo_id
        })
        return result
      })

      await Promise.all(activosPromises)

      fotos.forEach((foto) => URL.revokeObjectURL(foto.preview))
      
      // Redirigir a la categoría donde se subieron las fotos
      if (categoriaSeleccionada) {
        router.push(`/proyectos/${projectId}/categoria/${categoriaSeleccionada}`)
      } else {
        router.push(`/proyectos/${projectId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir las fotos")
      console.error('Error uploading photos:', err)
    } finally {
      setIsUploading(false)
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
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">
                      <span className="hidden sm:inline">Subir Fotos - </span>
                      {proyecto?.PR_NOMBRE || 'Cronología'}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {/* Layout de dos columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 sm:gap-6">
                {/* Columna izquierda: Fotos con descripciones */}
                <div className="space-y-3 sm:space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-0 sm:pr-2">
                  {fotos.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                      <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 mb-2">No hay fotos seleccionadas</p>
                      <p className="text-sm text-gray-500">Usa el panel derecho para agregar fotos</p>
                    </div>
                  ) : (
                    fotos.map((foto, index) => (
                      <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] md:grid-cols-[200px_1fr] gap-3 sm:gap-4">
                          {/* Preview de la foto - Izquierda */}
                          <div className="relative">
                            <div className="relative aspect-square rounded overflow-hidden bg-gray-100 border-2 border-gray-200">
                              <Image
                                src={foto.preview}
                                alt={foto.nombre || `Foto ${index + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFoto(index)}
                              disabled={isUploading}
                              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Campos de información - Derecha */}
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`nombre-${index}`} className="text-xs text-gray-600 mb-1 block">
                                Nombre
                              </Label>
                              <Input
                                id={`nombre-${index}`}
                                value={foto.nombre || ''}
                                onChange={(e) => updateFoto(index, { nombre: e.target.value })}
                                placeholder="Nombre de la foto"
                                disabled={isUploading}
                                className="text-sm h-9"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`fecha-${index}`} className="text-xs text-gray-600 mb-1 block flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                Fecha de Captura
                                {foto.exifExtraido && (
                                  <span className="text-xs text-green-600">(EXIF)</span>
                                )}
                              </Label>
                              <Input
                                id={`fecha-${index}`}
                                type="date"
                                value={foto.fechaCaptura}
                                onChange={(e) => updateFoto(index, { fechaCaptura: e.target.value })}
                                disabled={isUploading}
                                className="text-sm h-9"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`descripcion-${index}`} className="text-xs text-gray-600 mb-1 block">
                                Descripción
                              </Label>
                              <Input
                                id={`descripcion-${index}`}
                                value={foto.descripcion || ''}
                                onChange={(e) => updateFoto(index, { descripcion: e.target.value })}
                                placeholder="Descripción de la foto"
                                disabled={isUploading}
                                className="text-sm h-9"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Columna derecha: Área de subida y botón guardar */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:sticky lg:top-4">
                    {/* Selector de Categoría */}
                    <div className="mb-4">
                      <Label className="text-xs text-gray-600 mb-2 block">
                        Categoría
                      </Label>
                      <Select
                        value={categoriaSeleccionada?.toString() || ''}
                        onValueChange={(value) => setCategoriaSeleccionada(parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          {categoriaSeleccionada ? (() => {
                            const categoria = categorias.find(c => c.CT_IDCATEGORIA_PK === categoriaSeleccionada)
                            if (!categoria) {
                              return <SelectValue placeholder="Selecciona una categoría" />
                            }
                            const iconoData = iconosDisponibles.find(i => i.value === categoria.CT_ICONO) || iconosDisponibles[0]
                            const IconComponent = iconoData.icon
                            return (
                              <>
                                {categoria.CT_ICONO === 'drone' ? (
                                  <DroneIcon className="w-4 h-4" />
                                ) : (
                                  <IconComponent className="w-4 h-4" />
                                )}
                                <SelectValue>{categoria.CT_NOMBRE}</SelectValue>
                              </>
                            )
                          })() : <SelectValue placeholder="Selecciona una categoría" />}
                        </SelectTrigger>
                        <SelectContent>
                          {categorias.map((cat) => {
                            const iconoData = iconosDisponibles.find(i => i.value === cat.CT_ICONO) || iconosDisponibles[0]
                            const IconComponent = iconoData.icon
                            return (
                              <SelectItem key={cat.CT_IDCATEGORIA_PK} value={cat.CT_IDCATEGORIA_PK.toString()}>
                                <div className="flex items-center gap-2">
                                  {cat.CT_ICONO === 'drone' ? (
                                    <DroneIcon className="w-4 h-4" />
                                  ) : (
                                    <IconComponent className="w-4 h-4" />
                                  )}
                                  <span>{cat.CT_NOMBRE}</span>
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Área de Drag & Drop */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-700 mb-1 font-medium">
                        Arrastra y suelta las fotos aquí
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        O haz clic para seleccionar archivos
                      </p>
                    
                      <p className="text-xs text-gray-400">
                        {fotos.length > 0 ? `${fotos.length} foto${fotos.length !== 1 ? 's' : ''} seleccionada${fotos.length !== 1 ? 's' : ''}` : 'Sin fotos seleccionadas'}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={true}
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </div>

                    {/* Botón de Guardar */}
                    <div className="mt-6">
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isUploading || fotos.length === 0}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Guardando fotos...
                          </span>
                        ) : (
                          `Guardar ${fotos.length} Foto${fotos.length !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        <Footer />
      </div>

      {/* Modal de Checklist de Protocolo de Vuelo */}
      <DroneProtocolChecklist
        open={showProtocolChecklist}
        onOpenChange={setShowProtocolChecklist}
        onContinue={() => {
          // El checklist es opcional, simplemente cerramos el modal
          setShowProtocolChecklist(false)
        }}
      />
    </AuthGuard>
  )
}

