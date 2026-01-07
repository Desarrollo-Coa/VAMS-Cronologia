"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FolderOpen, ImageIcon, Calendar, MapPin, Upload, X, Pencil } from "lucide-react"
import { useEffect, useState } from "react"
import { Project } from "@/lib/types"
import Image from "next/image"
import Link from "next/link"
import { EditProjectModal } from "@/components/edit-project-modal"

interface ProjectResumen extends Project {
  TOTAL_ACTIVOS?: number
  TOTAL_CATEGORIAS?: number
  ULTIMA_ACTUALIZACION?: string
}

export default function ProyectosPage() {
  const [projects, setProjects] = useState<ProjectResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [proyectoEditando, setProyectoEditando] = useState<ProjectResumen | null>(null)
  const [formData, setFormData] = useState({
    PR_NOMBRE: "",
    PR_DESCRIPCION: "",
    PR_UBICACION: "",
    PR_FECHA_INICIO: "",
    PR_FECHA_FIN: "",
    PR_FOTO_PORTADA_URL: "",
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen")
      return
    }

    // Validar tamaño (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 50MB")
      return
    }

    setSelectedFile(file)
    setError(null)

    // Crear preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Subir archivo usando Firebase Client SDK con credenciales temporales
    try {
      setUploadingImage(true)
      
      // Importar dinámicamente para evitar problemas de SSR
      const { uploadFileToStorage } = await import('@/lib/firebase-client')
      
      // Subir archivo (las credenciales se obtienen, usan y limpian automáticamente)
      const url = await uploadFileToStorage(file, "proyectos")
      
      setFormData({ ...formData, PR_FOTO_PORTADA_URL: url })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen")
      setSelectedFile(null)
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setFormData({ ...formData, PR_FOTO_PORTADA_URL: "" })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "En curso"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" })
    } catch {
      return dateString
    }
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/projects", {
        credentials: "include",
      })
      
      if (!response.ok) {
        throw new Error("Error al cargar proyectos")
      }

      const data = await response.json()
      const projectsList = Array.isArray(data) ? data : []
      
      // Debug: verificar URLs de imágenes
      console.log('Proyectos recibidos:', projectsList.map(p => ({
        nombre: p.PR_NOMBRE,
        foto_url: p.PR_FOTO_PORTADA_URL
      })))
      
      setProjects(projectsList)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      console.error("Error fetching projects:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.PR_NOMBRE.trim()) {
      setError("El nombre del proyecto es requerido")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al crear el proyecto")
      }

      // Cerrar el modal y limpiar el formulario
      setIsDialogOpen(false)
      setFormData({
        PR_NOMBRE: "",
        PR_DESCRIPCION: "",
        PR_UBICACION: "",
        PR_FECHA_INICIO: "",
        PR_FECHA_FIN: "",
        PR_FOTO_PORTADA_URL: "",
      })
      setSelectedFile(null)
      setImagePreview(null)

      // Refrescar la lista de proyectos
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el proyecto")
      console.error("Error creating project:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Proyectos</h1>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button 
                    className="bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto text-sm sm:text-base"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    Nuevo Proyecto
                  </Button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {/* Projects Grid */}
              {!loading && !error && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {projects.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No hay proyectos disponibles
                    </div>
                  ) : (
                    projects.map((project, index) => (
                      <Card 
                        key={project.PR_IDPROYECTO_PK || `project-${index}`} 
                        className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col relative group"
                      >
                        {/* Botón de edición */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setProyectoEditando(project)
                            setEditModalOpen(true)
                          }}
                        >
                          <Pencil className="w-4 h-4 text-slate-800" />
                        </Button>
                        <Link href={`/proyectos/${project.PR_IDPROYECTO_PK}`} className="flex flex-col h-full">
                          {/* Project Image - Ocupa todo el ancho superior */}
                          {project.PR_FOTO_PORTADA_URL && !failedImages.has(project.PR_FOTO_PORTADA_URL) ? (
                            <div className="relative w-full aspect-[4/3]">
                              <Image
                                src={project.PR_FOTO_PORTADA_URL}
                                alt={project.PR_NOMBRE || 'Proyecto'}
                                fill
                                className="object-cover"
                                loading="eager"
                                priority={index < 6}
                                unoptimized
                                onError={() => {
                                  setFailedImages(prev => new Set(prev).add(project.PR_FOTO_PORTADA_URL!))
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center">
                              <FolderOpen className="w-12 h-12 text-gray-400" />
                            </div>
                          )}

                          {/* Project Info - Compacto */}
                          <div className="p-3 flex-1 flex flex-col">
                            <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{project.PR_NOMBRE}</h3>
                            
                            {project.PR_UBICACION && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2 line-clamp-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{project.PR_UBICACION}</span>
                              </div>
                            )}

                            {/* Stats - Compacto */}
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{project.TOTAL_ACTIVOS || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FolderOpen className="w-3.5 h-3.5" />
                                <span>{project.TOTAL_CATEGORIAS || 0}</span>
                              </div>
                            </div>

                            {/* Dates - Compacto */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 border-t pt-2 mt-auto">
                              <Calendar className="w-3 h-3" />
                              <span className="truncate">
                                {formatDate(project.PR_FECHA_INICIO)} - {formatDate(project.PR_FECHA_FIN)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        <Footer />

        {/* Dialog para Nuevo Proyecto */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Proyecto</DialogTitle>
              <DialogDescription>
                Complete la información del nuevo proyecto. Los campos marcados con * son obligatorios.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="PR_NOMBRE">
                  Nombre del Proyecto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="PR_NOMBRE"
                  value={formData.PR_NOMBRE}
                  onChange={(e) => setFormData({ ...formData, PR_NOMBRE: e.target.value })}
                  placeholder="Ej: Condominio Tami Alva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="PR_DESCRIPCION">Descripción</Label>
                <Textarea
                  id="PR_DESCRIPCION"
                  value={formData.PR_DESCRIPCION}
                  onChange={(e) => setFormData({ ...formData, PR_DESCRIPCION: e.target.value })}
                  placeholder="Descripción del proyecto..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="PR_UBICACION">Ubicación</Label>
                <Input
                  id="PR_UBICACION"
                  value={formData.PR_UBICACION}
                  onChange={(e) => setFormData({ ...formData, PR_UBICACION: e.target.value })}
                  placeholder="Ej: Exterior Abajo, Fase 1 Interior Día"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="PR_FECHA_INICIO">Fecha de Inicio</Label>
                  <Input
                    id="PR_FECHA_INICIO"
                    type="date"
                    value={formData.PR_FECHA_INICIO}
                    onChange={(e) => setFormData({ ...formData, PR_FECHA_INICIO: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="PR_FECHA_FIN">Fecha de Fin</Label>
                  <Input
                    id="PR_FECHA_FIN"
                    type="date"
                    value={formData.PR_FECHA_FIN}
                    onChange={(e) => setFormData({ ...formData, PR_FECHA_FIN: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="PR_FOTO_PORTADA">Foto de Portada</Label>
                
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-md overflow-hidden border border-gray-300">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-sm">Subiendo...</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6">
                    <label
                      htmlFor="PR_FOTO_PORTADA"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? "Subiendo..." : "Haz clic para subir una imagen"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF hasta 10MB
                      </span>
                      <input
                        id="PR_FOTO_PORTADA"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}

                {formData.PR_FOTO_PORTADA_URL && !imagePreview && (
                  <div className="mt-2">
                    <Label className="text-xs text-gray-500">URL guardada:</Label>
                    <Input
                      value={formData.PR_FOTO_PORTADA_URL}
                      readOnly
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creando..." : "Crear Proyecto"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de edición de proyecto */}
      <EditProjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        proyecto={proyectoEditando}
        onSave={fetchProjects}
      />
    </AuthGuard>
  )
}

