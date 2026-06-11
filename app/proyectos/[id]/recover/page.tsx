"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function RecoverPage() {
  const params = useParams()
  const projectId = params.id as string
  const [activos, setActivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivosHuerfanos()
  }, [projectId])

  const fetchActivosHuerfanos = async () => {
    try {
      setLoading(true)
      // Fetch all assets for the project
      const response = await fetch(`/api/projects/${projectId}/activos`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Error")
      const data = await response.json()
      // Filter the ones without category (or category null)
      const huerfanos = (Array.isArray(data) ? data : []).filter(
        (a) => !a.CT_IDCATEGORIA_FK
      )
      setActivos(huerfanos)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const restaurar = async (activo: any) => {
    try {
      // Send PUT with the missing category (we assume it was 15 based on the user's report, or we can prompt)
      const catId = prompt("Ingresa el ID de la categoría a la que deseas restaurarlo (ej. 15):", "15")
      if (!catId) return

      const response = await fetch(`/api/projects/${projectId}/activos/${activo.AV_IDACTIVO_PK}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...activo,
          CT_IDCATEGORIA_FK: parseInt(catId)
        }),
      })
      if (response.ok) {
        fetchActivosHuerfanos()
      } else {
        alert("Error al restaurar")
      }
    } catch (e) {
      alert("Error de red")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Recuperar Imágenes Huérfanas</h1>
          <p className="mb-4 text-gray-600">Estas son las imágenes que perdieron su categoría y "desaparecieron".</p>
          
          {loading ? (
            <p>Cargando...</p>
          ) : activos.length === 0 ? (
            <p>No hay imágenes huérfanas encontradas en este proyecto.</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {activos.map(a => (
                <Card key={a.AV_IDACTIVO_PK} className="p-2">
                  <div className="relative aspect-video bg-gray-200 mb-2">
                    <Image src={a.AV_URL} alt="img" fill className="object-cover" unoptimized />
                  </div>
                  <p className="text-sm font-bold truncate">{a.AV_NOMBRE || 'Sin nombre'}</p>
                  <p className="text-xs text-gray-500 mb-2">ID: {a.AV_IDACTIVO_PK}</p>
                  <Button onClick={() => restaurar(a)} size="sm" className="w-full">Restaurar a Categoría</Button>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
