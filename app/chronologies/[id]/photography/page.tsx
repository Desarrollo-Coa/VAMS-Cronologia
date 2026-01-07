import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, ExternalLink } from "lucide-react"

async function getChronologyPermissions(id: string) {
  const detail = {
    id: Number(id),
    name: "Snanlogía - Fotografica 1",
    description: "Captura cronológica del avance de construcción del proyecto",
    createdBy: "Ramiro Incacolina Daza",
    createdDate: "Jun 15 01:19:25 2025",
    link: "COPY LINK",
    permissions: [
      { user: "Proyecto Inkalinda Inicial", detail: "Ramiro Accuso", time: "1 hour Ago" },
      { user: "Ramiro Incacolina Daza", detail: "Ramiro Accuso", time: "5 hour Ago" },
      { user: "Ramiro Incacolina Curuena", detail: "Ramiro Accuso", time: "5 Proyect" },
    ],
  }
  return detail
}

export default async function ChronologyPhotographyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const chronology = await getChronologyPermissions(id)

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
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-6 text-slate-900">{chronology.name}</h2>

            <Card className="p-6 bg-white">
              <p className="text-sm text-gray-600 mb-6">
                Captura cronológica del avance de construcción del proyecto (Ubicación) Jun 15 01:19:25 2025
              </p>

              {/* Link Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-slate-900">Parametro Enlaza Web</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-600">
                    Snanlogía de la Cronoweb
                  </div>
                  <Button variant="outline" className="whitespace-nowrap bg-transparent">
                    {chronology.link}
                  </Button>
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-900">Permesiones</h3>

                <div className="space-y-3">
                  {chronology.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{permission.user}</p>
                        <p className="text-xs text-gray-600">{permission.detail}</p>
                      </div>
                      <p className="text-xs text-gray-500">{permission.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
