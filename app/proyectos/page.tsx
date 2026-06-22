"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FolderOpen, ImageIcon, Calendar, MapPin, Upload, X, Pencil, Briefcase } from "lucide-react"
import { useEffect, useState } from "react"
import { Project, Negocio, User } from "@/lib/types"
import { getCurrentUserClient } from "@/lib/auth"
import Image from "next/image"
import Link from "next/link"
import { EditProjectModal } from "@/components/edit-project-modal"
import { compressImage } from "@/lib/image-utils"

interface ProjectResumen extends Project {
  TOTAL_ACTIVOS?: number
  TOTAL_CATEGORIAS?: number
  ULTIMA_ACTUALIZACION?: string
}

export default function ProyectosPage() {
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [projects, setProjects] = useState<ProjectResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  const [selectedNegocioId, setSelectedNegocioId] = useState<number | null>(null)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [proyectoEditando, setProyectoEditando] = useState<ProjectResumen | null>(null)
  const [formData, setFormData] = useState({
    NG_IDNEGOCIO_FK: 0,
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
  
  const [isCreateNegocioOpen, setIsCreateNegocioOpen] = useState(false)
  const [nuevoNegocioNombre, setNuevoNegocioNombre] = useState("")
  const [isCreatingNegocio, setIsCreatingNegocio] = useState(false)

  const [isEditNegocioOpen, setIsEditNegocioOpen] = useState(false)
  const [editNegocioNombre, setEditNegocioNombre] = useState("")
  const [isEditingNegocio, setIsEditingNegocio] = useState(false)

  useEffect(() => {
    setUser(getCurrentUserClient())
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [negociosRes, projectsRes] = await Promise.all([
        fetch("/api/negocios", { credentials: "include" }),
        fetch("/api/projects", { credentials: "include" })
      ])

      if (!negociosRes.ok || !projectsRes.ok) {
        throw new Error("Error al cargar datos")
      }

      const negociosData = await negociosRes.json()
      const projectsData = await projectsRes.json()

      const negociosList = Array.isArray(negociosData) ? negociosData : []
      const projectsList = Array.isArray(projectsData) ? projectsData : []

      setNegocios(negociosList)
      setProjects(projectsList)

      if (negociosList.length > 0) {
        setSelectedNegocioId(negociosList[0].NG_IDNEGOCIO_PK)
        setFormData(prev => ({ ...prev, NG_IDNEGOCIO_FK: negociosList[0].NG_IDNEGOCIO_PK }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setProjects(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error("Error fetching projects:", err)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen")
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("El archivo es demasiado grande. Máximo 50MB")
      return
    }

    setSelectedFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setUploadingImage(true)
      const { uploadFileToStorage } = await import('@/lib/firebase-client')
      const compressedFile = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.8,
        format: 'image/jpeg'
      })
      const url = await uploadFileToStorage(compressedFile, "proyectos")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.PR_NOMBRE.trim()) {
      setError("El nombre del proyecto es requerido")
      return
    }

    if (!formData.NG_IDNEGOCIO_FK) {
      setError("Debe seleccionar un negocio")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al crear el proyecto")
      }

      setIsDialogOpen(false)
      setFormData({
        NG_IDNEGOCIO_FK: negocios.length > 0 ? negocios[0].NG_IDNEGOCIO_PK : 0,
        PR_NOMBRE: "",
        PR_DESCRIPCION: "",
        PR_UBICACION: "",
        PR_FECHA_INICIO: "",
        PR_FECHA_FIN: "",
        PR_FOTO_PORTADA_URL: "",
      })
      setSelectedFile(null)
      setImagePreview(null)

      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear el proyecto")
      console.error("Error creating project:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateNegocio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNegocioNombre.trim()) {
      setError("El nombre del negocio es requerido")
      return
    }

    try {
      setIsCreatingNegocio(true)
      setError(null)
      const response = await fetch("/api/negocios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ NG_NOMBRE: nuevoNegocioNombre }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Error al crear el negocio")
      }

      const resData = await response.json()
      
      const refreshRes = await fetch("/api/negocios", { credentials: "include" })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setNegocios(Array.isArray(data) ? data : [])
        setSelectedNegocioId(resData.negocio_id)
        setFormData(prev => ({ ...prev, NG_IDNEGOCIO_FK: resData.negocio_id }))
      }
      
      setIsCreateNegocioOpen(false)
      setNuevoNegocioNombre("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando negocio")
    } finally {
      setIsCreatingNegocio(false)
    }
  }

  const handleEditNegocio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editNegocioNombre.trim() || !selectedNegocioId) {
      setError("El nombre del negocio es requerido")
      return
    }

    try {
      setIsEditingNegocio(true)
      setError(null)
      const response = await fetch(`/api/negocios/${selectedNegocioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nombre: editNegocioNombre }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Error al actualizar el negocio")
      }

      const refreshRes = await fetch("/api/negocios", { credentials: "include" })
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setNegocios(Array.isArray(data) ? data : [])
      }
      
      setIsEditNegocioOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error editando negocio")
    } finally {
      setIsEditingNegocio(false)
    }
  }

  const filteredProjects = projects.filter(p => p.NG_IDNEGOCIO_FK === selectedNegocioId)
  const selectedNegocio = negocios.find(n => n.NG_IDNEGOCIO_PK === selectedNegocioId)
  const canEdit = selectedNegocio?.PERMISO_USUARIO === 'ADMIN' || selectedNegocio?.PERMISO_USUARIO === 'ESCRITURA'

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />

        <div className="flex flex-1">
          <Sidebar />

          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {/* Select de Negocios y Crear Negocio */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex items-center">
                    <Select
                      value={selectedNegocioId ? selectedNegocioId.toString() : ""}
                      onValueChange={(value) => setSelectedNegocioId(Number(value))}
                    >
                      <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent h-10 px-3 gap-2 text-sm font-semibold text-slate-700 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-500" />
                          <SelectValue placeholder="Seleccionar negocio" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {negocios.length === 0 ? (
                          <div className="p-2 text-sm text-slate-500">Sin negocios asignados</div>
                        ) : (
                          negocios.map((negocio) => (
                            <SelectItem key={negocio.NG_IDNEGOCIO_PK} value={negocio.NG_IDNEGOCIO_PK.toString()}>
                              {negocio.NG_NOMBRE}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {user?.RL_IDROL_FK === 1 && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsCreateNegocioOpen(true)}
                        className="text-slate-600 border-slate-200 hover:bg-slate-50"
                      >
                        Crear Negocio
                      </Button>
                      
                      {selectedNegocioId !== null && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const current = negocios.find(n => n.NG_IDNEGOCIO_PK === selectedNegocioId)
                            setEditNegocioNombre(current?.NG_NOMBRE || "")
                            setIsEditNegocioOpen(true)
                          }}
                          className="text-slate-600 border-slate-200 hover:bg-slate-50"
                        >
                          Editar Negocio
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {canEdit && (
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-white w-full sm:w-auto"
                  >
                    Nuevo Proyecto
                  </Button>
                )}
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
                  {negocios.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No hay negocios disponibles. Por favor, crea un negocio primero.
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No hay proyectos en este negocio.
                    </div>
                  ) : (
                    filteredProjects.map((project, index) => (
                      <Card
                        key={project.PR_IDPROYECTO_PK || `project-${index}`}
                        className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col relative group"
                      >
                        <Link href={`/proyectos/${project.PR_IDPROYECTO_PK}`} className="flex flex-col h-full">
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

                          <div className="p-3 flex-1 flex flex-col">
                            <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">{project.PR_NOMBRE}</h3>

                            {project.PR_UBICACION && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2 line-clamp-1">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{project.PR_UBICACION}</span>
                              </div>
                            )}

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

                            <div className="flex items-center gap-1.5 text-xs text-gray-500 border-t pt-2 mt-auto">
                              <Calendar className="w-3 h-3" />
                              <span className="truncate">
                                {formatDate(project.PR_FECHA_INICIO)} - {formatDate(project.PR_FECHA_FIN)}
                              </span>
                            </div>
                          </div>
                        </Link>
                        {canEdit && (
                          <div className="p-2 border-t border-gray-100 flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setProyectoEditando(project)
                                setEditModalOpen(true)
                              }}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        <Footer />

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
                <Label htmlFor="NG_IDNEGOCIO_FK">
                  Negocio <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.NG_IDNEGOCIO_FK ? formData.NG_IDNEGOCIO_FK.toString() : ""}
                  onValueChange={(value) => setFormData({ ...formData, NG_IDNEGOCIO_FK: Number(value) })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione un negocio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {negocios.map(n => (
                      <SelectItem key={n.NG_IDNEGOCIO_PK} value={n.NG_IDNEGOCIO_PK.toString()}>
                        {n.NG_NOMBRE}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

        {/* Modal de Editar Negocio */}
        <Dialog open={isEditNegocioOpen} onOpenChange={setIsEditNegocioOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Negocio</DialogTitle>
              <DialogDescription>Modifica el nombre del grupo de negocio actual.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditNegocio}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-negocio-name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="edit-negocio-name"
                    value={editNegocioNombre}
                    onChange={(e) => setEditNegocioNombre(e.target.value)}
                    placeholder="Ej: Grupo Argos"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditNegocioOpen(false)}
                  disabled={isEditingNegocio}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isEditingNegocio} className="bg-slate-800 hover:bg-slate-700 text-white">
                  {isEditingNegocio ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <EditProjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        proyecto={proyectoEditando}
        onSave={fetchProjects}
      />

      {/* Dialog para Crear Negocio */}
      <Dialog open={isCreateNegocioOpen} onOpenChange={setIsCreateNegocioOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Negocio</DialogTitle>
            <DialogDescription>Crea un nuevo grupo de negocio al que luego podrás asignarle proyectos y usuarios.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNegocio}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="negocio-name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="negocio-name"
                  value={nuevoNegocioNombre}
                  onChange={(e) => setNuevoNegocioNombre(e.target.value)}
                  className="col-span-3"
                  placeholder="Ej: GRUPO ARGOS"
                  disabled={isCreatingNegocio}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateNegocioOpen(false)} disabled={isCreatingNegocio}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingNegocio || !nuevoNegocioNombre.trim()} className="bg-slate-800 hover:bg-slate-700 text-white">
                {isCreatingNegocio ? "Guardando..." : "Crear Negocio"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
