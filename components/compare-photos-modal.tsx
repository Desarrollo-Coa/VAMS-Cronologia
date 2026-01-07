"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
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

interface ActivosPorDia {
  fecha: string
  dia: number
  mes: number
  mesNombre: string
  activos: ActivoVisual[]
}

interface ComparePhotosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activosPorDia: ActivosPorDia[]
  activoInicial: ActivoVisual | null
}

export function ComparePhotosModal({
  open,
  onOpenChange,
  activosPorDia,
  activoInicial,
}: ComparePhotosModalProps) {
  const [foto1, setFoto1] = useState<ActivoVisual | null>(activoInicial)
  const [foto2, setFoto2] = useState<ActivoVisual | null>(null)
  const [diaSeleccionado1, setDiaSeleccionado1] = useState<string>("")
  const [diaSeleccionado2, setDiaSeleccionado2] = useState<string>("")
  const [fotoSeleccionada1, setFotoSeleccionada1] = useState<string>("")
  const [fotoSeleccionada2, setFotoSeleccionada2] = useState<string>("")

  useEffect(() => {
    if (activoInicial && open) {
      // Encontrar el día del activo inicial
      const diaEncontrado = activosPorDia.find((dia) =>
        dia.activos.some((a) => a.AV_IDACTIVO_PK === activoInicial.AV_IDACTIVO_PK)
      )
      if (diaEncontrado) {
        setDiaSeleccionado1(diaEncontrado.fecha)
        setFotoSeleccionada1(activoInicial.AV_IDACTIVO_PK.toString())
        setFoto1(activoInicial)
      }
    }
  }, [activoInicial, open, activosPorDia])

  const activosDia1 = activosPorDia.find((d) => d.fecha === diaSeleccionado1)?.activos || []
  const activosDia2 = activosPorDia.find((d) => d.fecha === diaSeleccionado2)?.activos || []

  const handleFoto1Change = (activoId: string) => {
    const activo = activosDia1.find((a) => a.AV_IDACTIVO_PK.toString() === activoId)
    setFotoSeleccionada1(activoId)
    setFoto1(activo || null)
  }

  const handleFoto2Change = (activoId: string) => {
    const activo = activosDia2.find((a) => a.AV_IDACTIVO_PK.toString() === activoId)
    setFotoSeleccionada2(activoId)
    setFoto2(activo || null)
  }

  const handleDia2Change = (fecha: string) => {
    setDiaSeleccionado2(fecha)
    setFotoSeleccionada2("")
    setFoto2(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Comparar Fotos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selectores */}
          <div className="grid grid-cols-2 gap-4">
            {/* Foto 1 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto 1</label>
              {diaSeleccionado1 && (
                <Select value={fotoSeleccionada1} onValueChange={handleFoto1Change}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar foto" />
                  </SelectTrigger>
                  <SelectContent>
                    {activosDia1.map((activo) => (
                      <SelectItem
                        key={activo.AV_IDACTIVO_PK}
                        value={activo.AV_IDACTIVO_PK.toString()}
                      >
                        {activo.AV_NOMBRE || `Foto ${activo.AV_IDACTIVO_PK}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Foto 2 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Foto 2</label>
              <div className="space-y-2">
                <Select value={diaSeleccionado2} onValueChange={handleDia2Change}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar día" />
                  </SelectTrigger>
                  <SelectContent>
                    {activosPorDia
                      .filter((dia) => dia.fecha !== diaSeleccionado1)
                      .map((dia) => (
                        <SelectItem key={dia.fecha} value={dia.fecha}>
                          {dia.mesNombre} {dia.dia}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {diaSeleccionado2 && (
                  <Select value={fotoSeleccionada2} onValueChange={handleFoto2Change}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar foto" />
                    </SelectTrigger>
                    <SelectContent>
                      {activosDia2.map((activo) => (
                        <SelectItem
                          key={activo.AV_IDACTIVO_PK}
                          value={activo.AV_IDACTIVO_PK.toString()}
                        >
                          {activo.AV_NOMBRE || `Foto ${activo.AV_IDACTIVO_PK}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Comparación lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foto 1 */}
            <div className="space-y-2">
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {foto1 ? (
                  <Image
                    src={foto1.AV_URL}
                    alt={foto1.AV_NOMBRE || "Foto 1"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Selecciona una foto
                  </div>
                )}
              </div>
              {foto1 && (
                <div className="text-sm">
                  <p className="font-medium">{foto1.AV_NOMBRE || "Sin nombre"}</p>
                  {foto1.AV_DESCRIPCION && (
                    <p className="text-gray-600 text-xs">{foto1.AV_DESCRIPCION}</p>
                  )}
                  {foto1.AV_FECHA_CAPTURA && (
                    <p className="text-gray-500 text-xs">
                      {new Date(foto1.AV_FECHA_CAPTURA).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Foto 2 */}
            <div className="space-y-2">
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {foto2 ? (
                  <Image
                    src={foto2.AV_URL}
                    alt={foto2.AV_NOMBRE || "Foto 2"}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Selecciona una foto
                  </div>
                )}
              </div>
              {foto2 && (
                <div className="text-sm">
                  <p className="font-medium">{foto2.AV_NOMBRE || "Sin nombre"}</p>
                  {foto2.AV_DESCRIPCION && (
                    <p className="text-gray-600 text-xs">{foto2.AV_DESCRIPCION}</p>
                  )}
                  {foto2.AV_FECHA_CAPTURA && (
                    <p className="text-gray-500 text-xs">
                      {new Date(foto2.AV_FECHA_CAPTURA).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

