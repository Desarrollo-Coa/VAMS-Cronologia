import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

async function getChronologies() {
  const response = await fetch("http://localhost:3000/api/chronologies", { cache: "no-store" })
  if (!response.ok) {
    return []
  }
  return response.json()
}

export default async function ChronologiesGridPage() {
  const chronologies = await getChronologies()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-slate-900">My Chronologies</h1>

            <div className="grid md:grid-cols-2 gap-6">
              {chronologies.map((chronology: any) => (
                <Card key={chronology.id} className="overflow-hidden bg-white">
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={chronology.images[0] || "/placeholder.svg"}
                      alt={chronology.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-1 text-slate-900">{chronology.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{chronology.location}</p>
                    <p className="text-sm text-gray-500 mb-4">{chronology.date}</p>

                    {/* Progress Bars */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Etapa Actual</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Fase Inicial</span>
                          <span className="text-gray-500">{chronology.progress.date}</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">Etapa Actual</p>
                        <p className="text-gray-600">{chronology.progress.phase}</p>
                      </div>
                      <Link href={`/chronologies/${chronology.id}`}>
                        <Button size="sm" className="bg-slate-800 hover:bg-slate-700">
                          Ver más
                        </Button>
                      </Link>
                    </div>
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
