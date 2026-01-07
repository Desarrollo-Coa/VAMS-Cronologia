import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Share2, ExternalLink } from "lucide-react"

async function getChronologies() {
  // In a real app, this would fetch from the API
  const chronologies = [
    {
      id: 1,
      projectId: 1,
      name: "Condominio Tami Alva",
      location: "Exterior Abajo",
      date: "Jun 15 2025",
      images: ["/green-bridge-river.jpg"],
      progress: {
        current: "CRONOLOGI INICIADO",
        phase: "DQMH 10 2016/06/01",
        description: "Pueblo Union",
        location: "Miraflores",
        status: "Pueblo Union Jun 6 01:19:25 2025",
      },
      stats: {
        status: "Iniciada Intersección Expsaución",
        updates: "Entrada Actualizadas",
      },
    },
  ]
  return chronologies
}

export default async function ChronologiesPage() {
  const chronologies = await getChronologies()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-gray-600" />
                <h1 className="text-2xl font-bold text-slate-900">My Chronologies</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <ExternalLink className="w-4 h-4" />
                  Cronologia
                </Button>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-6 text-slate-900">My Chronologies</h2>

            {chronologies.map((chronology) => (
              <Card key={chronology.id} className="p-6 mb-6 bg-white">
                <div className="grid md:grid-cols-[1fr,320px] gap-6">
                  {/* Main Image */}
                  <div className="relative h-64 md:h-80 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={chronology.images[0] || "/placeholder.svg"}
                      alt={chronology.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info Panel */}
                  <div className="flex flex-col">
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-bold mb-3 text-slate-900">{chronology.progress.current}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">DQMH 10 2016/06/01</span>
                        </div>
                        <div>
                          <p className="text-gray-700 font-medium">{chronology.progress.description}</p>
                          <p className="text-gray-600">{chronology.progress.location}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-600">{chronology.progress.status}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">{chronology.stats.status}</p>
                      <p className="text-gray-600">{chronology.stats.updates}</p>
                    </div>

                    <div className="mt-auto pt-4">
                      <Link href={`/chronologies/${chronology.id}`}>
                        <Button className="w-full bg-slate-800 hover:bg-slate-700">EXPLORAR</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
