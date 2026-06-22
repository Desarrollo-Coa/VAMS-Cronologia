"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Calendar, X } from "lucide-react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getCurrentUserClient } from "@/lib/auth"
import Image from "next/image"
import Link from "next/link"
import { DroneProtocolChecklist } from "@/components/drone-protocol-checklist"

interface FotoSeleccionada {
  file: File
  preview: string
  fechaCaptura: string
  horaCaptura?: string
  nombre?: string
  descripcion?: string
  exifExtraido: boolean
}

export default function UploadPhotosPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [fotos, setFotos] = useState<FotoSeleccionada[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proyecto, setProyecto] = useState<any>(null)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null)
  const [showProtocolChecklist, setShowProtocolChecklist] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const user = getCurrentUserClient()
    if (user?.RL_IDROL_FK === 3) {
      router.push(`/proyectos/${projectId}`)
      return
    }
    
    fetchProyecto()
    initializeCategory()
  }, [projectId])

  const fetchProyecto = async () => {
    try {
      const response = await fetch(`/api/projects`, { credentials: "include" })
      if (!response.ok) throw new Error("Error al cargar proyecto")
      const data = await response.json()
      const proyectoEncontrado = data.find((p: any) => p.PR_IDPROYECTO_PK === parseInt(projectId))
      setProyecto(proyectoEncontrado)
      
      if (proyectoEncontrado) {
        const user = getCurrentUserClient()
        if (user?.RL_IDROL_FK === 2) {
          const negResponse = await fetch(`/api/negocios`, { credentials: "include" })
          if (negResponse.ok) {
            const negData = await negResponse.json()
            const negocio = negData.find((n: any) => n.NG_IDNEGOCIO_PK === proyectoEncontrado.NG_IDNEGOCIO_FK)
            if (!negocio || (negocio.PERMISO_USUARIO !== 'ADMIN' && negocio.PERMISO_USUARIO !== 'ESCRITURA')) {
              router.push(`/proyectos/${projectId}`)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    }
  }

  const initializeCategory = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/categorias`, { credentials: "include" })
      if (!response.ok) throw new Error("Error al cargar categorías")
      
      const data = await response.json()
      let droneCategoria = data.find((c: any) => c.CT_NOMBRE.toLowerCase() === 'drones')
      
      if (!droneCategoria) {
        const createRes = await fetch(`/api/projects/${projectId}/categorias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            CT_NOMBRE: 'Drones',
            CT_DESCRIPCION: 'Categoría principal para drones',
            CT_ICONO: 'drone'
          })
        })
        if (createRes.ok) {
          const refreshRes = await fetch(`/api/projects/${projectId}/categorias`, { credentials: "include" })
          const refreshData = await refreshRes.json()
          droneCategoria = refreshData.find((c: any) => c.CT_NOMBRE.toLowerCase() === 'drones')
        }
      }
      
      if (droneCategoria) {
        setCategoriaSeleccionada(droneCategoria.CT_IDCATEGORIA_PK)
      } else if (data.length > 0) {
        setCategoriaSeleccionada(data[0].CT_IDCATEGORIA_PK)
      }
    } catch (err) {
      console.error('Error inicializando categoría:', err)
    }
  }

  const parsearFechaEXIF = (fechaEXIF: any): { fecha: string; hora?: string } | null => {
    if (!fechaEXIF) return null
    if (typeof fechaEXIF === 'string') {
      const match = fechaEXIF.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
      if (match) {
        const [, year, month, day, hour, minute, second] = match
        return { fecha: `${year}-${month}-${day}`, hora: `${hour}:${minute}:${second}` }
      }
      if (fechaEXIF.includes('-')) {
        const parts = fechaEXIF.split('T')
        const fecha = parts[0]
        const hora = parts[1] ? parts[1].split('.')[0].split('+')[0].split('Z')[0] : undefined
        return { fecha, hora }
      }
    }
    if (fechaEXIF instanceof Date) {
      const year = fechaEXIF.getFullYear()
      const month = String(fechaEXIF.getMonth() + 1).padStart(2, '0')
      const day = String(fechaEXIF.getDate()).padStart(2, '0')
      const hour = String(fechaEXIF.getHours()).padStart(2, '0')
      const minute = String(fechaEXIF.getMinutes()).padStart(2, '0')
      const second = String(fechaEXIF.getSeconds()).padStart(2, '0')
      return { fecha: `${year}-${month}-${day}`, hora: `${hour}:${minute}:${second}` }
    }
    return null
  }

  const extraerFechaEXIF = async (file: File): Promise<{ fecha: string; horaCaptura?: string; exifExtraido: boolean }> => {
    try {
      let exifr: any = null
      try { exifr = await import('exifr') } catch {}
      
      if (exifr?.default) {
        const exifData = await exifr.default.parse(file, { pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'SubSecTimeOriginal'] })
        
        if (exifData?.DateTimeOriginal) {
          const fechaHora = parsearFechaEXIF(exifData.DateTimeOriginal)
          if (fechaHora) return { fecha: fechaHora.fecha, horaCaptura: fechaHora.hora, exifExtraido: true }
        }
        if (exifData?.CreateDate) {
          const fechaHora = parsearFechaEXIF(exifData.CreateDate)
          if (fechaHora) return { fecha: fechaHora.fecha, horaCaptura: fechaHora.hora, exifExtraido: true }
        }
        if (exifData?.ModifyDate) {
          const fechaHora = parsearFechaEXIF(exifData.ModifyDate)
          if (fechaHora) return { fecha: fechaHora.fecha, horaCaptura: fechaHora.hora, exifExtraido: true }
        }
      }
    } catch (err) {
      console.warn('No se pudo extraer metadata EXIF para', file.name)
    }

    const today = new Date()
    return {
      fecha: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      exifExtraido: false
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const maxFiles = 100
    const currentCount = fotos.length
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      setError("Solo se permiten archivos de imagen")
      return
    }

    if (currentCount + imageFiles.length > maxFiles) {
      setError(`Solo puedes subir hasta ${maxFiles} fotos a la vez. Intenta subir ${maxFiles - currentCount} o menos.`)
      return
    }

    setError(null)
    const processedFotos: FotoSeleccionada[] = []

    for (const file of imageFiles) {
      const { fecha, horaCaptura, exifExtraido } = await extraerFechaEXIF(file)
      processedFotos.push({
        file,
        preview: URL.createObjectURL(file),
        fechaCaptura: fecha,
        horaCaptura,
        exifExtraido,
        nombre: file.name
      })
    }

    setFotos(prev => [...prev, ...processedFotos])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [fotos.length])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files)
    }
  }

  const removeFoto = (index: number) => {
    setFotos(prev => {
      const newFotos = [...prev]
      URL.revokeObjectURL(newFotos[index].preview)
      newFotos.splice(index, 1)
      return newFotos
    })
  }

  const updateFoto = (index: number, updates: Partial<FotoSeleccionada>) => {
    setFotos(prev => {
      const newFotos = [...prev]
      newFotos[index] = { ...newFotos[index], ...updates }
      return newFotos
    })
  }

  const handleSaveAll = async () => {
    if (fotos.length === 0) return

    if (!categoriaSeleccionada) {
      setError("Error interno: la categoría de proyecto no está inicializada.")
      return
    }

    try {
      setIsUploading(true)
      setError(null)
      const { uploadFileToStorage } = await import('@/lib/firebase-client')
      const { compressImage } = await import('@/lib/image-utils')

      const successIds = []
      let uploadErrors = 0

      for (const foto of fotos) {
        try {
          const compressedFile = await compressImage(foto.file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'image/jpeg'
          })
          
          const url = await uploadFileToStorage(compressedFile, `proyectos/${projectId}`)
          
          const response = await fetch(`/api/projects/${projectId}/activos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              AV_URL: url,
              AV_NOMBRE: foto.nombre || foto.file.name,
              AV_DESCRIPCION: foto.descripcion || '',
              AV_FECHA_CAPTURA: foto.fechaCaptura,
              AV_HORA_CAPTURA: foto.horaCaptura,
              CT_IDCATEGORIA_FK: categoriaSeleccionada,
            }),
          })

          if (response.ok) {
            successIds.push(foto.file.name)
          } else {
            uploadErrors++
          }
        } catch (err) {
          uploadErrors++
        }
      }

      if (uploadErrors > 0) {
        setError(`Se guardaron ${successIds.length} fotos, pero fallaron ${uploadErrors}.`)
      } else {
        router.push(`/proyectos/${projectId}`)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error durante la subida")
    } finally {
      setIsUploading(false)
    }
  }

  const handleProtocolCheck = (isChecked: boolean) => {
    if (isChecked) {
      setShowProtocolChecklist(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:mb-6 mb-4">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Volver</span>
                  </Button>
                  <div className="flex-1 sm:flex-none min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">Subir Fotos</h1>
                    {proyecto?.PR_NOMBRE && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{proyecto.PR_NOMBRE}</p>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {showProtocolChecklist && (
                <div className="mb-6">
                  <DroneProtocolChecklist onComplete={handleProtocolCheck} />
                </div>
              )}

              {!showProtocolChecklist && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    {fotos.length === 0 ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                        Selecciona archivos o arrástralos al panel de la derecha
                      </div>
                    ) : (
                      fotos.map((foto, index) => (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 z-10"
                            onClick={() => removeFoto(index)}
                            disabled={isUploading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative w-full sm:w-32 h-32 sm:h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={foto.preview} alt="Preview" fill className="object-cover" />
                            </div>
                            <div className="flex-1 space-y-3 min-w-0">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs text-gray-600 mb-1 block">Nombre</Label>
                                  <Input value={foto.nombre || ''} onChange={(e) => updateFoto(index, { nombre: e.target.value })} disabled={isUploading} className="text-sm h-9" />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600 mb-1 flex items-center justify-between">
                                    <span>Fecha Captura</span>
                                    {foto.exifExtraido && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1">Auto EXIF</span>}
                                  </Label>
                                  <Input type="date" value={foto.fechaCaptura} onChange={(e) => updateFoto(index, { fechaCaptura: e.target.value })} disabled={isUploading} className="text-sm h-9" />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Descripción</Label>
                                <Input value={foto.descripcion || ''} onChange={(e) => updateFoto(index, { descripcion: e.target.value })} disabled={isUploading} className="text-sm h-9" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:sticky lg:top-4">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer mb-4 ${
                          isDragging ? "border-slate-800 bg-slate-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-700 mb-1 font-medium">Arrastra y suelta fotos aquí</p>
                        <p className="text-xs text-gray-500 mb-3">O haz clic para seleccionar archivos</p>
                        <p className="text-xs text-gray-400">
                          {fotos.length > 0 ? `${fotos.length} foto${fotos.length !== 1 ? 's' : ''} seleccionada${fotos.length !== 1 ? 's' : ''}` : 'Sin fotos seleccionadas'}
                        </p>
                        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileInput} className="hidden" disabled={isUploading} />
                      </div>

                      <Button
                        onClick={handleSaveAll}
                        disabled={fotos.length === 0 || isUploading || !categoriaSeleccionada}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white"
                      >
                        {isUploading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Subiendo...</span>
                          </div>
                        ) : (
                          `Guardar ${fotos.length} foto${fotos.length !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AuthGuard>
  )
}
