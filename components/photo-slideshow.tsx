"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Edit2, GitCompare, Download } from "lucide-react"
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

interface PhotoSlideshowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activos: ActivoVisual[]
  initialIndex: number
  onEdit?: (activo: ActivoVisual) => void
  onCompare?: (activo: ActivoVisual) => void
}

export function PhotoSlideshow({
  open,
  onOpenChange,
  activos,
  initialIndex,
  onEdit,
  onCompare,
}: PhotoSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
    }
  }, [open, initialIndex])

  const currentActivo = activos[currentIndex]

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activos.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < activos.length - 1 ? prev + 1 : 0))
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return
    if (e.key === "ArrowLeft") handlePrevious()
    if (e.key === "ArrowRight") handleNext()
    if (e.key === "Escape") onOpenChange(false)
  }

  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown as any)
      return () => window.removeEventListener("keydown", handleKeyDown as any)
    }
  }, [open, currentIndex])

  if (!currentActivo) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Visualizador de Fotos</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-full flex flex-col">
          {/* Header con controles */}
          <div className="absolute top-0 left-0 right-0 z-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2 sm:p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-white text-xs sm:text-sm whitespace-nowrap">
                {currentIndex + 1} / {activos.length}
              </span>
              {currentActivo.AV_NOMBRE && (
                <span className="text-white/80 text-xs sm:text-sm truncate hidden sm:inline">• {currentActivo.AV_NOMBRE}</span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(currentActivo)}
                  className="text-white hover:bg-white/20 text-xs sm:text-sm"
                >
                  <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              )}
              {onCompare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCompare(currentActivo)}
                  className="text-white hover:bg-white/20 text-xs sm:text-sm"
                >
                  <GitCompare className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Comparar</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a")
                  link.href = currentActivo.AV_URL
                  link.download = currentActivo.AV_NOMBRE || "foto.jpg"
                  link.click()
                }}
                className="text-white hover:bg-white/20"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Imagen principal */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {!failedImages.has(currentActivo.AV_URL) ? (
              <Image
                src={currentActivo.AV_URL}
                alt={currentActivo.AV_NOMBRE || "Foto"}
                width={1920}
                height={1080}
                className="max-w-full max-h-full object-contain"
                unoptimized
                priority
                onError={() => {
                  setFailedImages((prev) => new Set(prev).add(currentActivo.AV_URL))
                }}
              />
            ) : (
              <div className="text-white text-center">
                <p>Error al cargar la imagen</p>
                <p className="text-sm text-white/60">{currentActivo.AV_URL}</p>
              </div>
            )}

            {/* Botones de navegación */}
            {activos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>

          {/* Footer con información */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {currentActivo.AV_DESCRIPCION && (
              <p className="text-white text-sm mb-2">{currentActivo.AV_DESCRIPCION}</p>
            )}
            {currentActivo.AV_FECHA_CAPTURA && (
              <p className="text-white/60 text-xs">
                Fecha de captura: {new Date(currentActivo.AV_FECHA_CAPTURA).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

