"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CheckCircle2, X } from "lucide-react"
import { DroneIcon } from "@/components/drone-icon"

interface DroneProtocolChecklistProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinue: () => void
}

interface ChecklistItem {
  id: string
  label: string
  category: string
}

const checklistItems: ChecklistItem[] = [
  // Condiciones del vuelo
  { id: "condiciones-clima", label: "Condiciones climáticas adecuadas (sin lluvia, viento < 25 km/h)", category: "Condiciones" },
  { id: "condiciones-visibilidad", label: "Buena visibilidad (sin niebla o lluvia)", category: "Condiciones" },
  { id: "condiciones-temperatura", label: "Temperatura dentro del rango operativo del dron", category: "Condiciones" },
  
  // Inspección pre-vuelo
  { id: "inspeccion-bateria", label: "Batería del dron completamente cargada", category: "Inspección Pre-vuelo" },
  { id: "inspeccion-propulsores", label: "Propulsores en buen estado y sin daños", category: "Inspección Pre-vuelo" },
  { id: "inspeccion-camara", label: "Cámara funcionando correctamente y lente limpia", category: "Inspección Pre-vuelo" },
  { id: "inspeccion-gps", label: "Señal GPS estable y suficiente", category: "Inspección Pre-vuelo" },
  { id: "inspeccion-sd", label: "Tarjeta SD con espacio suficiente", category: "Inspección Pre-vuelo" },
  
  // Protocolos de seguridad
  { id: "seguridad-zona", label: "Zona de vuelo libre de obstáculos y personas", category: "Seguridad" },
  { id: "seguridad-permisos", label: "Permisos y autorizaciones necesarias obtenidas", category: "Seguridad" },
  { id: "seguridad-altura", label: "Altura máxima de vuelo verificada y respetada", category: "Seguridad" },
  { id: "seguridad-retorno", label: "Punto de retorno automático (RTH) configurado correctamente", category: "Seguridad" },
  
  // Configuración del vuelo
  { id: "configuracion-modo", label: "Modo de vuelo adecuado seleccionado", category: "Configuración" },
  { id: "configuracion-calibracion", label: "Calibración de brújula y IMU realizada", category: "Configuración" },
  { id: "configuracion-settings", label: "Configuración de cámara verificada (resolución, formato)", category: "Configuración" },
]

export function DroneProtocolChecklist({ open, onOpenChange, onContinue }: DroneProtocolChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const handleContinue = () => {
    // Por ahora no guardamos nada, solo cerramos el modal
    // En el futuro aquí se podría guardar el checklist en la BD
    onContinue()
    onOpenChange(false)
  }

  // Agrupar items por categoría
  const itemsByCategory = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const totalItems = checklistItems.length
  const checkedCount = checkedItems.size
  const progressPercentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DroneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">
                Protocolo de Vuelo de Dron
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 mt-1">
                Verifica las condiciones y protocolos antes del vuelo
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Barra de progreso */}
        <div className="mt-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progreso: {checkedCount} de {totalItems} verificaciones
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Checklist por categorías */}
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-3">
                {items.map((item) => {
                  const isChecked = checkedItems.has(item.id)
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="mt-0.5">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
                        )}
                      </div>
                      <Label
                        htmlFor={item.id}
                        className={`text-sm cursor-pointer flex-1 ${
                          isChecked ? "text-gray-700 line-through" : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </Label>
                      <Checkbox
                        id={item.id}
                        checked={isChecked}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="flex-shrink-0"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
          <Button
            onClick={handleContinue}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white"
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

