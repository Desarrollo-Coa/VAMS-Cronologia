"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Save, Folder, Camera, Building, MapPin, Package } from "lucide-react"
import { DroneIcon } from "@/components/drone-icon"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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

interface EditCategoriaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoria: Categoria | null
  projectId: string
  onSave: () => void
}

const iconosDisponibles: { [key: string]: any } = {
  'folder': Folder,
  'camera': Camera,
  'building': Building,
  'map-pin': MapPin,
  'package': Package,
  'drone': DroneIcon,
}

export function EditCategoriaModal({
  open,
  onOpenChange,
  categoria,
  projectId,
  onSave,
}: EditCategoriaModalProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [icono, setIcono] = useState("folder")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (categoria && open) {
      setNombre(categoria.CT_NOMBRE || "")
      setDescripcion(categoria.CT_DESCRIPCION || "")
      setIcono(categoria.CT_ICONO || "folder")
      setError(null)
    }
  }, [categoria, open])

  const handleSave = async () => {
    if (!categoria) return

    if (!nombre.trim()) {
      setError("El nombre de la categoría es requerido")
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/categorias/${categoria.CT_IDCATEGORIA_PK}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          CT_NOMBRE: nombre.trim(),
          CT_DESCRIPCION: descripcion.trim() || null,
          CT_ICONO: icono,
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

  const handleDelete = async () => {
    if (!categoria) return

    try {
      setDeleting(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/categorias/${categoria.CT_IDCATEGORIA_PK}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || "Error al eliminar")
      }

      onSave()
      onOpenChange(false)
      setShowDeleteDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar")
    } finally {
      setDeleting(false)
    }
  }

  if (!categoria) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica los datos de la categoría o elimínala permanentemente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cat-nombre">Nombre *</Label>
              <Input
                id="cat-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre de la categoría"
              />
            </div>

            <div>
              <Label htmlFor="cat-descripcion">Descripción</Label>
              <Input
                id="cat-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Icono</Label>
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
                      onClick={() => setIcono(key)}
                      className={`p-3 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                        icono === key
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
              disabled={saving || deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting || !nombre.trim()}>
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
              Esta acción no se puede deshacer. Se eliminará permanentemente la categoría "{categoria.CT_NOMBRE}" y todos sus datos asociados.
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

