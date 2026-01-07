"use client"

import { useState, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Upload, Calendar, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

interface FotoSeleccionada {
  file: File
  preview: string
  fechaCaptura: string
  horaCaptura?: string // Hora en formato HH:MM:SS del EXIF
  nombre?: string
  descripcion?: string
  exifExtraido: boolean
}

interface UploadPhotosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: number
  onUploadComplete: () => void
}

export function UploadPhotosModal({ open, onOpenChange, projectId, onUploadComplete }: UploadPhotosModalProps) {
  const [fotos, setFotos] = useState<FotoSeleccionada[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // Intentar usar exifr si está disponible
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
    }
  }

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setError(null)
    const nuevasFotos: FotoSeleccionada[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError(`El archivo ${file.name} no es una imagen válida`)
        continue
      }

      // Validar tamaño (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError(`El archivo ${file.name} es demasiado grande. Máximo 50MB`)
        continue
      }

      // Crear preview
      const preview = URL.createObjectURL(file)

      // Extraer fecha EXIF
      const { fecha, horaCaptura, exifExtraido } = await extraerFechaEXIF(file)

      nuevasFotos.push({
        file,
        preview,
        fechaCaptura: fecha,
        horaCaptura,
        nombre: file.name.replace(/\.[^/.]+$/, ""), // Nombre sin extensión
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
    handleFiles(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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

    // Validar que todas tengan fecha de captura
    const fotosSinFecha = fotos.filter((f) => !f.fechaCaptura)
    if (fotosSinFecha.length > 0) {
      setError("Todas las fotos deben tener una fecha de captura")
      return
    }

    try {
      setIsUploading(true)
      setError(null)

      // Importar función de upload
      const { uploadFileToStorage } = await import('@/lib/firebase-client')

      // Subir todas las fotos y crear activos visuales
      const activosPromises = fotos.map(async (foto) => {
        // Subir a Firebase
        const url = await uploadFileToStorage(foto.file, `proyectos/${projectId}/activos`)

        // Combinar fecha y hora si la hora está disponible
        const fechaCompleta = foto.horaCaptura 
          ? `${foto.fechaCaptura} ${foto.horaCaptura}`
          : foto.fechaCaptura

        // Crear activo visual en la BD
        const response = await fetch(`/api/projects/${projectId}/activos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            AV_NOMBRE: foto.nombre || foto.file.name,
            AV_DESCRIPCION: foto.descripcion || '',
            AV_URL: url,
            AV_FECHA_CAPTURA: fechaCompleta,
            AV_FILENAME: foto.file.name,
            AV_MIMETYPE: foto.file.type,
            AV_TAMANIO: foto.file.size,
          }),
        })

        if (!response.ok) {
          throw new Error(`Error al guardar ${foto.file.name}`)
        }

        return response.json()
      })

      await Promise.all(activosPromises)

      // Limpiar y cerrar
      fotos.forEach((foto) => URL.revokeObjectURL(foto.preview))
      setFotos([])
      onOpenChange(false)
      onUploadComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir las fotos")
      console.error('Error uploading photos:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      fotos.forEach((foto) => URL.revokeObjectURL(foto.preview))
      setFotos([])
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subir Fotos - Cronología</DialogTitle>
          <DialogDescription>
            Arrastra y suelta las fotos o haz clic para seleccionarlas. La fecha EXIF se extraerá automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Área de Drag & Drop - Ocupa todo el ancho superior */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-base text-gray-700 mb-2 font-medium">
              Arrastra y suelta las fotos aquí
            </p>
            <p className="text-sm text-gray-500">
              O haz clic para seleccionar archivos
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Lista de Fotos Seleccionadas */}
          {fotos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Fotos seleccionadas ({fotos.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fotos.map((foto, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    {/* Preview */}
                    <div className="relative w-full aspect-square rounded overflow-hidden bg-gray-100">
                      <Image
                        src={foto.preview}
                        alt={foto.nombre || `Foto ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFoto(index)}
                        disabled={isUploading}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Campos */}
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`nombre-${index}`} className="text-xs text-gray-600">Nombre</Label>
                        <Input
                          id={`nombre-${index}`}
                          value={foto.nombre || ''}
                          onChange={(e) => updateFoto(index, { nombre: e.target.value })}
                          placeholder="Nombre de la foto"
                          disabled={isUploading}
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`fecha-${index}`} className="text-xs text-gray-600 flex items-center gap-2">
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
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`descripcion-${index}`} className="text-xs text-gray-600">Descripción</Label>
                        <Input
                          id={`descripcion-${index}`}
                          value={foto.descripcion || ''}
                          onChange={(e) => updateFoto(index, { descripcion: e.target.value })}
                          placeholder="Descripción opcional"
                          disabled={isUploading}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isUploading || fotos.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              {isUploading ? "Guardando..." : `Guardar ${fotos.length} Foto${fotos.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

