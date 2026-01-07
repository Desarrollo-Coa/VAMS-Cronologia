 "use client"

import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth-guard"
import { Camera, BarChart3, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isAuthenticatedClient } from "@/lib/auth"

function HomePageContent() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleEmpezarAhora = () => {
    if (isAuthenticatedClient()) {
      router.push("/proyectos")
    } else {
      router.push("/login")
    }
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-auto">
        {/* Hero Section */}
          <section className="pt-4 pb-0">
            <div className="px-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Contenedor izquierdo: Texto con imagen de fondo y gradiente */}
                <div 
                  className="relative overflow-hidden p-6 h-[300px] flex flex-col justify-center flex-[6] rounded-l-sm md:rounded-r-none rounded-r-sm md:rounded-r-sm"
                  style={{
                    backgroundImage: 'url(/green-bridge-river.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderTopLeftRadius: '0.125rem',
                    borderBottomLeftRadius: '0.125rem',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    backgroundColor: '#1e293b' // slate-800 como fallback
                  }}
                >
                  {/* Gradiente de izquierda a derecha (oscuro a menos oscuro) */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to right, rgba(30, 41, 59, 1) 5%, rgba(30, 41, 59, 0.7) 65%, rgba(30, 41, 59, 0.3) 90%, transparent 100%)'
                    }}
                  />
                  {/* Contenido del texto sobre el gradiente */}
                  <div className="relative z-10 text-white pl-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">Sistema de Gestión de Activos Visuales</h1>
                    <h1 className="text-3xl md:text-4xl font-normal mb-2 text-slate-200">Captura la Evolución.</h1>
                    <h1 className="text-3xl md:text-4xl font-normal mb-6 text-slate-200">Organiza el Cambio.</h1>

                    {mounted && (
                      <Button
                        size="lg"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={handleEmpezarAhora}
                      >
                    EMPEZAR AHORA
                  </Button>
                    )}
              </div>
                </div>

                {/* Contenedor derecho: Imagen de fondo individual */}
                <div 
                  className="relative overflow-hidden h-[300px] flex-[3] rounded-r-sm md:rounded-l-none rounded-l-sm md:rounded-l-sm"
                  style={{
                    backgroundImage: 'url(/apartment-buildings-exterior.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderTopLeftRadius: '0',
                    borderBottomLeftRadius: '0',
                    borderTopRightRadius: '0.125rem',
                    borderBottomRightRadius: '0.125rem'
                  }}
                />
            </div>
          </div>
        </section>

        {/* Features Section */}
          <section className="py-16 bg-white pl-[35px]">
            <div className="px-2 pl-3">
              <h2 className="text-2xl font-normal text-left mb-4 text-slate-900" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.02em' }}>PROCESOS REALIZADOS</h2>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-sm">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6 text-slate-800" />
                  </div>
                  <h3 className="text-base font-bold mb-1 text-slate-900 text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>REGISTRO EN PROGRESO</h3>
                  <p className="text-gray-600 text-xs text-center">Captura y documenta cada fase del proyecto en tiempo real</p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-sm">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" aria-hidden="true" viewBox="0 0 100 100" className="text-slate-800">
                      <path fill="currentColor" d="M19.53 28.49a3.85 3.85 0 0 0-3.533 2.343C6.706 31.364-.029 32.257 0 32.955c.027.693 6.712.997 15.928.724.32.862.936 1.58 1.738 2.027H16.17v2.742h-1.83a.874.874 0 0 0-.875.874v1.954c0 .483.391.874.874.874h12.316c3.103.73 3.45 1.843 5.774 3.88-.38 2.113-.94 4.42-1.378 6.414v16.973a2.092 2.092 0 1 0 4.185 0V61.21c-.048-6.9 1.066-9.69 4.905-15.031l.965-.448c0 4.146 2.866 4.395 6.908 5.32h-3.036c-.924 0-1.674.75-1.674 1.675v10c0 .924.75 1.674 1.674 1.674h10.044c.924 0 1.674-.75 1.674-1.674v-10c0-.925-.75-1.674-1.674-1.674h-3.033c4.041-.928 6.905-1.176 6.905-5.321l.965.448c4.857 5.026 4.905 8.447 4.905 15.03v8.207a2.092 2.092 0 0 0 4.185 0V52.444c-.513-2.191-1.062-4.487-1.58-6.762 2.199-2.155 3.101-2.64 5.956-3.532h12.336a.874.874 0 0 0 .874-.874v-1.954a.874.874 0 0 0-.874-.874H83.83v-2.742h-1.496a3.85 3.85 0 0 0 1.738-2.027c9.216.273 15.901-.031 15.928-.724.029-.698-6.706-1.59-15.997-2.122a3.852 3.852 0 0 0-6.943-.302c-9.307-.283-16.103.018-16.142.716-.029.693 6.615 1.58 15.827 2.112a3.85 3.85 0 0 0 1.839 2.347h-1.496v2.742C67.654 38.426 60.352 33.685 50 33.49c-10.003.212-18.38 4.958-27.088 4.958v-2.742h-1.496a3.85 3.85 0 0 0 1.839-2.347c9.212-.532 15.856-1.42 15.827-2.112-.039-.698-6.835-1-16.142-.716a3.85 3.85 0 0 0-3.41-2.04zM50 53.503c2.347 0 4.276 1.929 4.276 4.276S52.347 62.056 50 62.056s-4.278-1.93-4.278-4.277 1.93-4.276 4.278-4.276m0 2.51c-.99 0-1.767.776-1.767 1.766s.777 1.766 1.767 1.766 1.765-.776 1.765-1.766-.775-1.766-1.765-1.766"/>
                    </svg>
              </div>
                  <h3 className="text-base font-bold mb-1 text-slate-900 text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>FOTOS AÉREAS</h3>
                  <p className="text-gray-600 text-xs text-center">Captura imágenes desde el aire con tecnología de dron</p>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-sm">
                  <div className="w-12 h-12 flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-slate-800" />
              </div>
                  <h3 className="text-base font-bold mb-1 text-slate-900 text-center" style={{ fontFamily: 'system-ui, sans-serif' }}>ANÁLISIS Y PROGRESO</h3>
                  <p className="text-gray-600 text-xs text-center">Analiza y visualiza el avance del proyecto con gráficos</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      </div>

      <Footer />
    </div>
  )
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  )
}
