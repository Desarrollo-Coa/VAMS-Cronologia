"use client"

import { useState, useEffect, useMemo } from "react"
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
  año: number
  mesNombre: string
  activos: ActivoVisual[]
}

interface ComparePhotosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activosPorDia: ActivosPorDia[]
  activoInicial: ActivoVisual | null
  todosLosActivos?: ActivoVisual[] // Todos los activos sin filtrar por mes
}

const meses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function ComparePhotosModal({
  open,
  onOpenChange,
  activosPorDia,
  activoInicial,
  todosLosActivos = [],
}: ComparePhotosModalProps) {
  const [foto1, setFoto1] = useState<ActivoVisual | null>(activoInicial)
  const [foto2, setFoto2] = useState<ActivoVisual | null>(null)
  
  // Selectores para Foto 1
  const [año1, setAño1] = useState<number | null>(null)
  const [mes1, setMes1] = useState<number | null>(null)
  const [dia1, setDia1] = useState<number | null>(null)
  const [fotoSeleccionada1, setFotoSeleccionada1] = useState<string>("")
  
  // Selectores para Foto 2
  const [año2, setAño2] = useState<number | null>(null)
  const [mes2, setMes2] = useState<number | null>(null)
  const [dia2, setDia2] = useState<number | null>(null)
  const [fotoSeleccionada2, setFotoSeleccionada2] = useState<string>("")

  // Generar lista completa de activos por día desde todos los activos
  const todosLosActivosPorDia = useMemo(() => {
    const activosFuente = todosLosActivos.length > 0 ? todosLosActivos : activosPorDia.flatMap(d => d.activos)
    console.log('Procesando activos para modal de comparación:', {
      totalActivos: activosFuente.length,
      activosConFecha: activosFuente.filter(a => a.AV_FECHA_CAPTURA).length,
      primerosActivos: activosFuente.slice(0, 3).map(a => ({
        id: a.AV_IDACTIVO_PK,
        fecha: a.AV_FECHA_CAPTURA
      }))
    })

    return activosFuente
      .filter((activo) => activo.AV_FECHA_CAPTURA)
      .reduce((acc: ActivosPorDia[], activo) => {
        try {
          const fecha = new Date(activo.AV_FECHA_CAPTURA!)
          // Verificar que la fecha sea válida
          if (isNaN(fecha.getTime())) {
            console.warn(`Fecha inválida para activo ${activo.AV_IDACTIVO_PK}:`, activo.AV_FECHA_CAPTURA)
            return acc
          }

          const dia = fecha.getDate()
          const mes = fecha.getMonth() + 1
          const año = fecha.getFullYear()
          const mesNombre = meses[mes - 1]
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
        } catch (error) {
          console.warn(`Error procesando fecha para activo ${activo.AV_IDACTIVO_PK}:`, activo.AV_FECHA_CAPTURA, error)
        }
        return acc
      }, [])
      .sort((a, b) => {
        // Ordenar por año, luego mes, luego día
        if (a.año !== b.año) return b.año - a.año // Más reciente primero
        if (a.mes !== b.mes) return b.mes - a.mes
        return b.dia - a.dia
      })
  }, [todosLosActivos, activosPorDia])

  // Obtener años únicos disponibles
  const añosDisponibles = useMemo(() => {
    const años = new Set(todosLosActivosPorDia.map(d => d.año).filter(año => !isNaN(año) && año > 0))
    const añosArray = Array.from(años).sort((a, b) => b - a) // Más reciente primero
    console.log('Años disponibles:', añosArray)
    return añosArray
  }, [todosLosActivosPorDia])

  // Obtener meses disponibles para un año específico
  const obtenerMesesDisponibles = (año: number | null) => {
    if (!año) return []
    const mesesSet = new Set(
      todosLosActivosPorDia
        .filter(d => d.año === año)
        .map(d => d.mes)
    )
    return Array.from(mesesSet).sort((a, b) => a - b)
  }

  // Obtener días disponibles para un año y mes específicos
  const obtenerDiasDisponibles = (año: number | null, mes: number | null) => {
    if (!año || !mes) return []
    const diasSet = new Set(
      todosLosActivosPorDia
        .filter(d => d.año === año && d.mes === mes)
        .map(d => d.dia)
    )
    return Array.from(diasSet).sort((a, b) => a - b)
  }

  // Obtener activos para una fecha específica
  const obtenerActivosPorFecha = (año: number | null, mes: number | null, dia: number | null) => {
    if (!año || !mes || !dia) return []
    const fechaKey = `${año}-${mes}-${dia}`
    return todosLosActivosPorDia.find(d => d.fecha === fechaKey)?.activos || []
  }

  useEffect(() => {
    if (activoInicial && open) {
      // Encontrar el día del activo inicial en la lista completa
      const diaEncontrado = todosLosActivosPorDia.find((dia) =>
        dia.activos.some((a) => a.AV_IDACTIVO_PK === activoInicial.AV_IDACTIVO_PK)
      )
      if (diaEncontrado) {
        setAño1(diaEncontrado.año)
        setMes1(diaEncontrado.mes)
        setDia1(diaEncontrado.dia)
        setFotoSeleccionada1(activoInicial.AV_IDACTIVO_PK.toString())
        setFoto1(activoInicial)
      }
    }
  }, [activoInicial, open, todosLosActivosPorDia])

  const activosDia1 = obtenerActivosPorFecha(año1, mes1, dia1)
  const activosDia2 = obtenerActivosPorFecha(año2, mes2, dia2)
  const mesesDisponibles1 = obtenerMesesDisponibles(año1)
  const mesesDisponibles2 = obtenerMesesDisponibles(año2)
  const diasDisponibles1 = obtenerDiasDisponibles(año1, mes1)
  const diasDisponibles2 = obtenerDiasDisponibles(año2, mes2)

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

  // Handlers para Foto 1
  const handleAño1Change = (año: string) => {
    setAño1(parseInt(año))
    setMes1(null)
    setDia1(null)
    setFotoSeleccionada1("")
    setFoto1(null)
  }

  const handleMes1Change = (mes: string) => {
    setMes1(parseInt(mes))
    setDia1(null)
    setFotoSeleccionada1("")
    setFoto1(null)
  }

  const handleDia1Change = (dia: string) => {
    setDia1(parseInt(dia))
    setFotoSeleccionada1("")
    setFoto1(null)
  }

  // Handlers para Foto 2
  const handleAño2Change = (año: string) => {
    setAño2(parseInt(año))
    setMes2(null)
    setDia2(null)
    setFotoSeleccionada2("")
    setFoto2(null)
  }

  const handleMes2Change = (mes: string) => {
    setMes2(parseInt(mes))
    setDia2(null)
    setFotoSeleccionada2("")
    setFoto2(null)
  }

  const handleDia2Change = (dia: string) => {
    setDia2(parseInt(dia))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Foto 1 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Foto 1</label>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Select 
                    value={año1?.toString() || ""} 
                    onValueChange={handleAño1Change}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {añosDisponibles.map((año) => (
                        <SelectItem key={año} value={año.toString()}>
                          {año}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={mes1?.toString() || ""} 
                    onValueChange={handleMes1Change}
                    disabled={!año1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesDisponibles1.map((mes) => (
                        <SelectItem key={mes} value={mes.toString()}>
                          {meses[mes - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={dia1?.toString() || ""} 
                    onValueChange={handleDia1Change}
                    disabled={!año1 || !mes1}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {diasDisponibles1.map((dia) => (
                        <SelectItem key={dia} value={dia.toString()}>
                          {dia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {año1 && mes1 && dia1 && activosDia1.length > 0 && (
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
            </div>

            {/* Foto 2 */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Foto 2</label>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Select 
                    value={año2?.toString() || ""} 
                    onValueChange={handleAño2Change}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {añosDisponibles.map((año) => (
                        <SelectItem key={año} value={año.toString()}>
                          {año}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={mes2?.toString() || ""} 
                    onValueChange={handleMes2Change}
                    disabled={!año2}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesDisponibles2.map((mes) => (
                        <SelectItem key={mes} value={mes.toString()}>
                          {meses[mes - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={dia2?.toString() || ""} 
                    onValueChange={handleDia2Change}
                    disabled={!año2 || !mes2}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Día" />
                    </SelectTrigger>
                    <SelectContent>
                      {diasDisponibles2.map((dia) => (
                        <SelectItem key={dia} value={dia.toString()}>
                          {dia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {año2 && mes2 && dia2 && activosDia2.length > 0 && (
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

