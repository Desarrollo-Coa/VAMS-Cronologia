"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Save, X } from "lucide-react"
import Image from "next/image"

interface ActivoVisual {
  AV_IDACTIVO_PK: number
  AV_NOMBRE?: string
  AV_DESCRIPCION?: string
  AV_URL: string
  AV_FECHA_CAPTURA?: string
  AV_FECHA_CARGA?: string
  CT_IDCATEGORIA_FK?: number
}

interface EditPhotoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activo: ActivoVisual | null
  projectId: string
  onSave: () => void
}

export function EditPhotoModal({
  open,
  onOpenChange,
  activo,
  projectId,
  onSave,
}: EditPhotoModalProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fechaCaptura, setFechaCaptura] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (activo && open) {
      setNombre(activo.AV_NOMBRE || "")
      setDescripcion(activo.AV_DESCRIPCION || "")
      // Convertir fecha a formato YYYY-MM-DD para el input type="date"
      if (activo.AV_FECHA_CAPTURA) {
        const fecha = new Date(activo.AV_FECHA_CAPTURA)
        const year = fecha.getFullYear()
        const month = String(fecha.getMonth() + 1).padStart(2, '0')
        const day = String(fecha.getDate()).padStart(2, '0')
        setFechaCaptura(`${year}-${month}-${day}`)
      } else {
        setFechaCaptura("")
      }
      setError(null)
    }
  }, [activo, open])

  const handleSave = async () => {
    if (!activo) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/activos/${activo.AV_IDACTIVO_PK}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          AV_NOMBRE: nombre.trim() || null,
          AV_DESCRIPCION: descripcion.trim() || null,
          AV_FECHA_CAPTURA: fechaCaptura || null,
        }),
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

  if (!activo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Editar Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vista previa de la imagen */}
          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={activo.AV_URL}
              alt={activo.AV_NOMBRE || "Foto"}
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la foto"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción de la foto"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="fecha-captura" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Captura
              </Label>
              <Input
                id="fecha-captura"
                type="date"
                value={fechaCaptura}
                onChange={(e) => setFechaCaptura(e.target.value)}
                placeholder="Seleccionar fecha"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

