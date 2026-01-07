import Image from "next/image"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Share2, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

async function getChronologyDetail(id: string) {
  // In production, this would be: await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chronologies/${id}`)
  // For now, return mock data
  const detail = {
    id: Number(id),
    name: "Puente Nuevo - Fase 1",
    description: "Captura cronológica del avance de construcción del proyecto",
    createdBy: "Ramiro Incacolina Daza",
    createdDate: "Jun 15 01:19:25 2025",
    phases: [
      { id: 1, name: "Inicio", date: "Jun 10", active: false, completed: true },
      { id: 2, name: "Fase 2", date: "Jun 15", active: true, completed: false },
      { id: 3, name: "Fase 3", date: "Jun 20", active: false, completed: false },
      { id: 4, name: "Fase 4", date: "Jun 25", active: false, completed: false },
      { id: 5, name: "Fase 5", date: "Jun 30", active: false, completed: false },
      { id: 6, name: "Fase 6", date: "Jul 05", active: false, completed: false },
      { id: 7, name: "Final", date: "Jul 10", active: false, completed: false },
    ],
    photos: [
      {
        id: 1,
        url: "/construction-site-entrance.jpg",
        date: "Jun 15 2025",
        time: "09:30 AM",
        location: "Exterior Entrada",
      },
      {
        id: 2,
        url: "/building-foundation-work.jpg",
        date: "Jun 15 2025",
        time: "11:45 AM",
        location: "Área Central",
      },
      {
        id: 3,
        url: "/construction-materials-storage.jpg",
        date: "Jun 16 2025",
        time: "08:15 AM",
        location: "Bodega",
      },
      {
        id: 4,
        url: "/apartment-building-progress.jpg",
        date: "Jun 16 2025",
        time: "02:30 PM",
        location: "Torre A",
      },
      {
        id: 5,
        url: "/construction-workers-site.jpg",
        date: "Jun 17 2025",
        time: "10:00 AM",
        location: "Área de Trabajo",
      },
      {
        id: 6,
        url: "/building-structure-concrete.jpg",
        date: "Jun 17 2025",
        time: "03:45 PM",
        location: "Estructura Principal",
      },
      {
        id: 7,
        url: "/construction-equipment-crane.jpg",
        date: "Jun 18 2025",
        time: "07:30 AM",
        location: "Grúa Norte",
      },
      {
        id: 8,
        url: "/placeholder.svg?height=200&width=300",
        date: "Jun 18 2025",
        time: "01:20 PM",
        location: "Piso 3",
      },
    ],
  }
  return detail
}

export default async function ChronologyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chronology = await getChronologyDetail(id)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900">My Chronologies</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Copy className="w-4 h-4" />
                  Cronologia
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-6 text-slate-900">{chronology.name}</h2>

            {/* Timeline */}
            <Card className="p-6 mb-6 bg-white">
              <h3 className="text-sm font-medium text-gray-600 mb-6">Ubicada En Intervalo Inicialización Infodias</h3>

              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-300 z-0" />

                {/* Timeline Phases */}
                <div className="relative flex justify-between items-start z-10">
                  {chronology.phases.map((phase, index) => (
                    <div key={phase.id} className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full border-4 bg-white flex items-center justify-center mb-2",
                          phase.completed
                            ? "border-teal-500 bg-teal-50"
                            : phase.active
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs font-bold",
                            phase.completed ? "text-teal-600" : phase.active ? "text-blue-600" : "text-gray-400",
                          )}
                        >
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 text-center">{phase.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {chronology.photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden bg-white">
                  <div className="relative h-40 bg-gray-100">
                    <Image src={photo.url || "/placeholder.svg"} alt={photo.location} fill className="object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-slate-900 mb-1">{photo.location}</p>
                    <p className="text-xs text-gray-600">{photo.date}</p>
                    <p className="text-xs text-gray-500">{photo.time}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
