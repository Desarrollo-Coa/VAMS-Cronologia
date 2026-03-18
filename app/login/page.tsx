"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Loader2, Lock, User, Eye, EyeOff } from "lucide-react"
import { isAuthenticatedClient } from "@/lib/auth"
import { motion, AnimatePresence } from "motion/react"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticatedClient()) {
      router.push("/")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        router.push("/")
        router.refresh()
      } else {
        setError(data.message || "Credenciales inválidas")
      }
    } catch (err) {
      setError("Error al conectar con el servidor. Por favor, intenta nuevamente.")
      console.error("Error en login:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden font-sans">
      <div className="flex-1 flex flex-col md:flex-row max-h-screen">
        {/* Left Side: Internal Visual Branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative hidden md:flex md:flex-[6] lg:flex-[7] flex-col overflow-hidden"
        >
          {/* Main Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/BANNER1.jpeg)',
            }}
          />

          {/* Gradient Overlay for stability and text contrast */}
          <div className="absolute inset-0 bg-slate-900/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

          {/* Minimal branding content */}
          <div className="relative z-10 flex flex-col h-full p-12 lg:p-20 justify-end text-white">
            <div className="space-y-6 max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Camera className="w-16 h-16 text-white mb-8" />

                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                  Sistema de <br />
                  <span className="text-white/80 font-light">almacenamiento de fotos aéreas</span>
                </h1>

                <div className="h-1.5 w-24 bg-white/30 rounded-full mt-8"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Authentication Panel */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 md:flex-[4] lg:flex-[3] flex flex-col justify-center px-8 sm:px-12 lg:px-20 bg-white"
        >
          <div className="w-full max-w-sm mx-auto space-y-12">
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="md:hidden flex items-center justify-center mb-8"
              >
                <Camera className="w-12 h-12 text-slate-900" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-slate-900 tracking-tight"
              >
                Acceso al Sistema
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-500 text-sm font-medium"
              >
                Ingresa tus credenciales internas para continuar.
              </motion.p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-700 rounded-xl">
                    <AlertDescription className="text-xs font-bold uppercase tracking-wide px-1">
                      {error}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Usuario del Sistema
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-slate-900 text-slate-300 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 pl-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-slate-900/5 focus:border-slate-900 transition-all text-base border"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="Contraseña" className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Contraseña
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-slate-900 text-slate-300 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-14 pl-12 pr-12 bg-slate-50 border-slate-200 text-slate-900 rounded-xl focus:ring-slate-900/5 focus:border-slate-900 transition-all text-base border"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-xl text-base font-bold shadow-lg shadow-slate-900/10 active:scale-[0.99] transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Validando credenciales...</span>
                    </div>
                  ) : (
                    "Iniciar Sesión"
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="pt-12 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.3em]">
                Uso Exclusivo Autorizado
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
