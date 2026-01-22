"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Save, Upload, X } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Image from "next/image"

interface Proyecto {
  PR_IDPROYECTO_PK: number
  PR_NOMBRE: string
  PR_UBICACION?: string
  PR_DESCRIPCION?: string
  PR_FOTO_PORTADA_URL?: string
  PR_FECHA_INICIO?: string
  PR_FECHA_FIN?: string
}

interface EditProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proyecto: Proyecto | null
  onSave: () => void
}

export function EditProjectModal({
  open,
  onOpenChange,
  proyecto,
  onSave,
}: EditProjectModalProps) {
  const [nombre, setNombre] = useState("")
  const [ubicacion, setUbicacion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fotoPortadaUrl, setFotoPortadaUrl] = useState<string>("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (proyecto && open) {
      console.log('EditProjectModal - Proyecto recibido:', {
        PR_IDPROYECTO_PK: proyecto.PR_IDPROYECTO_PK,
        PR_NOMBRE: proyecto.PR_NOMBRE,
        PR_FOTO_PORTADA_URL: proyecto.PR_FOTO_PORTADA_URL,
        PR_FECHA_INICIO: proyecto.PR_FECHA_INICIO,
        PR_FECHA_FIN: proyecto.PR_FECHA_FIN,
        PR_UBICACION: proyecto.PR_UBICACION,
        PR_DESCRIPCION: proyecto.PR_DESCRIPCION,
        allKeys: Object.keys(proyecto)
      })
      setNombre(proyecto.PR_NOMBRE || "")
      setUbicacion(proyecto.PR_UBICACION || "")
      setDescripcion(proyecto.PR_DESCRIPCION || "")
      setFotoPortadaUrl(proyecto.PR_FOTO_PORTADA_URL || "")
      // Convertir fechas de formato DATE a formato YYYY-MM-DD para input type="date"
      // Las fechas pueden venir como string "YYYY-MM-DD" o como Date object
      if (proyecto.PR_FECHA_INICIO) {
        try {
          // Si ya está en formato YYYY-MM-DD, usarlo directamente
          if (typeof proyecto.PR_FECHA_INICIO === 'string' && proyecto.PR_FECHA_INICIO.match(/^\d{4}-\d{2}-\d{2}/)) {
            setFechaInicio(proyecto.PR_FECHA_INICIO.substring(0, 10))
          } else {
            // Intentar parsear como Date
            const fechaInicioDate = new Date(proyecto.PR_FECHA_INICIO)
            if (!isNaN(fechaInicioDate.getTime())) {
              setFechaInicio(fechaInicioDate.toISOString().split('T')[0])
            } else {
              setFechaInicio("")
            }
          }
        } catch {
          setFechaInicio("")
        }
      } else {
        setFechaInicio("")
      }
      if (proyecto.PR_FECHA_FIN) {
        try {
          // Si ya está en formato YYYY-MM-DD, usarlo directamente
          if (typeof proyecto.PR_FECHA_FIN === 'string' && proyecto.PR_FECHA_FIN.match(/^\d{4}-\d{2}-\d{2}/)) {
            setFechaFin(proyecto.PR_FECHA_FIN.substring(0, 10))
          } else {
            // Intentar parsear como Date
            const fechaFinDate = new Date(proyecto.PR_FECHA_FIN)
            if (!isNaN(fechaFinDate.getTime())) {
              setFechaFin(fechaFinDate.toISOString().split('T')[0])
            } else {
              setFechaFin("")
            }
          }
        } catch {
          setFechaFin("")
        }
      } else {
        setFechaFin("")
      }
      setImagePreview(null)
      setSelectedFile(null)
      setError(null)
    }
  }, [proyecto, open])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen")
      return
    }

    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 50MB")
      return
    }

    setSelectedFile(file)
    setError(null)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir archivo usando Firebase Client SDK
    try {
      setUploadingImage(true)
      
      const { uploadFileToStorage } = await import('@/lib/firebase-client')
      
      // Subir archivo
      const url = await uploadFileToStorage(file, "proyectos")
      
      setFotoPortadaUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen")
      setSelectedFile(null)
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setFotoPortadaUrl("")
  }

  const handleSave = async () => {
    if (!proyecto) return

    if (!nombre.trim()) {
      setError("El nombre del proyecto es requerido")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const payload = {
        PR_NOMBRE: nombre.trim(),
        PR_UBICACION: ubicacion.trim() || null,
        PR_DESCRIPCION: descripcion.trim() || null,
        PR_FOTO_PORTADA_URL: fotoPortadaUrl.trim() || null,
        PR_FECHA_INICIO: fechaInicio || null,
        PR_FECHA_FIN: fechaFin || null,
      }
      
      console.log('EditProjectModal - Enviando datos:', payload)

      const response = await fetch(`/api/projects/${proyecto.PR_IDPROYECTO_PK}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Error al guardar")
      }

      onSave()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!proyecto) return

    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`/api/projects/${proyecto.PR_IDPROYECTO_PK}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = data.error || data.message || "Error al eliminar el proyecto"
        console.error('Error al eliminar proyecto:', errorMessage)
        throw new Error(errorMessage)
      }

      // Verificar si la respuesta indica éxito
      if (data.success === 'false') {
        const errorMessage = data.message || data.error || "Error al eliminar el proyecto"
        console.error('Error al eliminar proyecto:', errorMessage)
        throw new Error(errorMessage)
      }

      onSave()
      onOpenChange(false)
      setShowDeleteDialog(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar el proyecto"
      setError(errorMessage)
      console.error("Error deleting project:", err)
    } finally {
      setDeleting(false)
    }
  }

  if (!proyecto) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Proyecto</DialogTitle>
            <DialogDescription>
              Modifica los datos del proyecto o elimínalo permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del proyecto"
              />
            </div>

            <div>
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                placeholder="Ubicación del proyecto"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción del proyecto"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="fechaFin">Fecha de Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fotoPortada">Foto de Portada</Label>
              
              {imagePreview ? (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-300">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage || saving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-sm">Subiendo...</div>
                    </div>
                  )}
                </div>
              ) : fotoPortadaUrl ? (
                <div className="relative">
                  <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-300">
                    <Image
                      src={fotoPortadaUrl}
                      alt="Foto actual"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage || saving}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                  <label
                    htmlFor="fotoPortada"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      {uploadingImage ? "Subiendo..." : "Haz clic para subir una imagen"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF hasta 50MB
                    </span>
                    <input
                      id="fotoPortada"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploadingImage || saving}
                    />
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={saving || deleting || uploadingImage}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting || uploadingImage}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting || uploadingImage || !nombre.trim()}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el proyecto "{proyecto.PR_NOMBRE}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

