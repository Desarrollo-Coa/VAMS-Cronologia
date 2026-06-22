"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getCurrentUserClient } from "@/lib/auth"
import { Users, Shield, Pencil } from "lucide-react"
import { Negocio } from "@/lib/types"

interface UsuarioData {
  US_IDUSUARIO_PK: number
  US_NOMBRE: string
  US_CORREO: string
  US_TELEFONO?: string
  US_USUARIO?: string
  RL_IDROL_FK: number
  NEGOCIOS_IDS: string // Comma separated IDs
}

export default function UsuariosPage() {
  const router = useRouter()
  const [userContext, setUserContext] = useState<any>(null)
  const [usuarios, setUsuarios] = useState<UsuarioData[]>([])
  const [negocios, setNegocios] = useState<Negocio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UsuarioData | null>(null)
  const [formNombre, setFormNombre] = useState("")
  const [formCorreo, setFormCorreo] = useState("")
  const [formTelefono, setFormTelefono] = useState("")
  const [formUsuario, setFormUsuario] = useState("")
  const [formContrasena, setFormContrasena] = useState("")
  const [formRol, setFormRol] = useState<number>(3)
  const [formNegocios, setFormNegocios] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const u = getCurrentUserClient()
    if (!u || u.RL_IDROL_FK !== 1) {
      router.push("/")
      return
    }
    setUserContext(u)
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [uRes, nRes] = await Promise.all([
        fetch("/api/usuarios", { credentials: "include" }),
        fetch("/api/negocios", { credentials: "include" })
      ])

      if (!uRes.ok || !nRes.ok) throw new Error("Error al cargar datos")

      const uData = await uRes.json()
      const nData = await nRes.json()

      const usersList = Array.isArray(uData) ? uData : []
      usersList.sort((a, b) => b.US_IDUSUARIO_PK - a.US_IDUSUARIO_PK)

      setUsuarios(usersList)
      setNegocios(Array.isArray(nData) ? nData : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando datos")
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (usuario: UsuarioData) => {
    setIsCreating(false)
    setSelectedUser(usuario)
    setFormNombre(usuario.US_NOMBRE || "")
    setFormCorreo(usuario.US_CORREO || "")
    setFormTelefono(usuario.US_TELEFONO || "")
    setFormUsuario(usuario.US_USUARIO || "")
    setFormContrasena("") // Ocultar contraseña al editar
    setFormRol(usuario.RL_IDROL_FK)
    
    // Parse negocios ids
    const assignedIds = new Set<number>()
    if (usuario.NEGOCIOS_IDS && usuario.NEGOCIOS_IDS.trim() !== "") {
      usuario.NEGOCIOS_IDS.split(",").forEach(id => {
        if (id) assignedIds.add(Number(id))
      })
    }
    setFormNegocios(assignedIds)
    setSheetOpen(true)
  }

  const handleCreateNew = () => {
    setIsCreating(true)
    setSelectedUser(null)
    setFormNombre("")
    setFormCorreo("")
    setFormTelefono("")
    setFormUsuario("")
    setFormContrasena("")
    setFormRol(3) // Por defecto solo lectura
    setFormNegocios(new Set())
    setSheetOpen(true)
  }

  const toggleNegocio = (id: number) => {
    const next = new Set(formNegocios)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setFormNegocios(next)
  }

  const handleSave = async () => {
    if (!isCreating && !selectedUser) return
    if (!isCreating && selectedUser?.US_IDUSUARIO_PK === userContext.US_IDUSUARIO_PK && formRol !== 1) {
      setError("No puedes quitarte el rol de administrador a ti mismo.")
      return
    }

    if (isCreating && (!formNombre || !formCorreo || !formUsuario || !formContrasena)) {
      setError("Faltan campos obligatorios para crear el usuario.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      let savedUserId = selectedUser?.US_IDUSUARIO_PK

      if (isCreating) {
        // CREAR USUARIO
        const createRes = await fetch(`/api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            US_NOMBRE: formNombre,
            US_CORREO: formCorreo,
            US_TELEFONO: formTelefono,
            US_USUARIO: formUsuario,
            US_CONTRASENA: formContrasena,
            RL_IDROL_FK: formRol
          })
        })

        if (!createRes.ok) {
          const err = await createRes.json()
          throw new Error(err.error || "Error al crear usuario")
        }

        // Para los negocios necesitamos el ID del nuevo usuario.
        // Dado que ORDS POST no nos devuelve el ID (podría modificarse para que lo haga),
        // recargaremos la lista y si es rol 2 o 3, tendríamos que buscar al nuevo usuario.
        // Por simplicidad, si es nuevo, le pedimos al admin que lo edite para asignarle negocios 
        // o asume que el backend los asigna. Para no complicarlo ahora, solo guardamos el usuario 
        // y avisamos.
        // Mejor: Si queremos que asigne negocios ya, la API de ORDS POST tendría que hacer la inserción de negocios.
      } else {
        // EDITAR USUARIO
        const rolRes = await fetch(`/api/usuarios/${selectedUser!.US_IDUSUARIO_PK}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ 
            RL_IDROL_FK: formRol,
            US_NOMBRE: formNombre,
            US_CORREO: formCorreo,
            US_TELEFONO: formTelefono,
            US_USUARIO: formUsuario,
            US_CONTRASENA: formContrasena || ""
          })
        })

        if (!rolRes.ok) {
          const err = await rolRes.json()
          throw new Error(err.error || "Error al actualizar usuario")
        }
      }

      // 2. Guardar negocios (Si es edicion. Si es creacion no tenemos el ID aún sin hacer un refetch o cambiar el SP)
      if (!isCreating && savedUserId) {
        const negociosIdsStr = Array.from(formNegocios).join(",")
        const negRes = await fetch(`/api/usuarios/${savedUserId}/negocios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ negocios_ids: negociosIdsStr })
        })

        if (!negRes.ok) {
          const err = await negRes.json()
          throw new Error(err.error || "Error al actualizar negocios")
        }
      }

      setSheetOpen(false)
      fetchData() // Refrescar tabla
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const getRolName = (id: number) => {
    switch(id) {
      case 1: return "Administrador"
      case 2: return "Gestor Proyecto"
      case 3: return "Solo Lectura"
      default: return "Desconocido"
    }
  }

  if (!userContext || userContext.RL_IDROL_FK !== 1) return null

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-slate-800" />
                <h1 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h1>
              </div>
              <Button onClick={handleCreateNew} className="bg-slate-800 hover:bg-slate-700">
                <Users className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Negocios Asignados</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map(u => {
                      const countNegocios = u.NEGOCIOS_IDS ? u.NEGOCIOS_IDS.split(",").filter(id => id).length : 0
                      return (
                        <TableRow key={u.US_IDUSUARIO_PK}>
                          <TableCell className="font-medium text-slate-500">#{u.US_IDUSUARIO_PK}</TableCell>
                          <TableCell className="font-medium text-slate-900">{u.US_NOMBRE}</TableCell>
                          <TableCell className="text-slate-500">{u.US_CORREO}</TableCell>
                          <TableCell>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              u.RL_IDROL_FK === 1 ? "bg-purple-100 text-purple-700" :
                              u.RL_IDROL_FK === 2 ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {getRolName(u.RL_IDROL_FK)}
                            </span>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {u.RL_IDROL_FK === 1 ? "Todos (Admin)" : `${countNegocios} negocio(s)`}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetContent className="w-[400px] sm:max-w-md overflow-y-auto sm:p-6">
                <SheetHeader className="mb-4">
                  <SheetTitle>{isCreating ? "Crear Nuevo Usuario" : "Editar Usuario"}</SheetTitle>
                  <SheetDescription>
                    {isCreating ? "Rellena los datos para crear un nuevo acceso." : (selectedUser?.US_USUARIO || selectedUser?.US_CORREO)}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-6 px-1">
                  {/* Campos de Texto */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-sm font-semibold">Nombre Completo <span className="text-red-500">*</span></Label>
                      <Input 
                        id="nombre"
                        value={formNombre} 
                        onChange={e => setFormNombre(e.target.value)} 
                        placeholder="Nombre completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="correo" className="text-sm font-semibold">Correo Electrónico <span className="text-red-500">*</span></Label>
                      <Input 
                        id="correo"
                        type="email"
                        value={formCorreo} 
                        onChange={e => setFormCorreo(e.target.value)} 
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="usuario" className="text-sm font-semibold">Nombre de Usuario (Login) <span className="text-red-500">*</span></Label>
                      <Input 
                        id="usuario"
                        value={formUsuario} 
                        onChange={e => setFormUsuario(e.target.value)} 
                        placeholder="Ej. jrodriguez"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contrasena" className="text-sm font-semibold">
                        {isCreating ? "Contraseña Inicial " : "Nueva Contraseña "}
                        {isCreating && <span className="text-red-500">*</span>}
                        {!isCreating && <span className="text-xs text-gray-500 font-normal">(Dejar en blanco para no cambiarla)</span>}
                      </Label>
                      <Input 
                        id="contrasena"
                        type="text"
                        value={formContrasena} 
                        onChange={e => setFormContrasena(e.target.value)} 
                        placeholder={isCreating ? "Contraseña" : "Nueva contraseña..."}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-sm font-semibold">Teléfono</Label>
                      <Input 
                        id="telefono"
                        value={formTelefono} 
                        onChange={e => setFormTelefono(e.target.value)} 
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  {/* Select Rol */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <Label className="text-base font-semibold text-slate-900">Nivel de Acceso (Rol)</Label>
                    <select
                      value={formRol}
                      onChange={(e) => setFormRol(Number(e.target.value))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                      disabled={selectedUser?.US_IDUSUARIO_PK === userContext?.US_IDUSUARIO_PK}
                    >
                      <option value={1}>Administrador (Acceso total)</option>
                      <option value={2}>Gestor Proyecto (Puede editar y subir)</option>
                      <option value={3}>Solo Lectura (Solo puede visualizar)</option>
                    </select>
                    {selectedUser?.US_IDUSUARIO_PK === userContext?.US_IDUSUARIO_PK && (
                      <p className="text-xs text-amber-600">No puedes modificar tu propio rol por seguridad.</p>
                    )}
                  </div>

                  {/* Negocios Asignados */}
                  {!isCreating && formRol !== 1 && (
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-slate-900">Negocios Asignados</Label>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 border rounded-md p-3 bg-slate-50">
                        {negocios.length === 0 ? (
                          <p className="text-sm text-gray-500">No hay negocios creados.</p>
                        ) : (
                          negocios.map(negocio => (
                            <div key={negocio.NG_IDNEGOCIO_PK} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`negocio-${negocio.NG_IDNEGOCIO_PK}`} 
                                checked={formNegocios.has(negocio.NG_IDNEGOCIO_PK)}
                                onCheckedChange={() => toggleNegocio(negocio.NG_IDNEGOCIO_PK)}
                              />
                              <Label 
                                htmlFor={`negocio-${negocio.NG_IDNEGOCIO_PK}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {negocio.NG_NOMBRE}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Selecciona los negocios a los que este usuario tendrá acceso para ver o gestionar sus proyectos.
                      </p>
                    </div>
                  )}

                  {formRol === 1 && (
                    <div className="p-4 bg-purple-50 rounded-md border border-purple-100">
                      <p className="text-sm text-purple-800">
                        Los administradores tienen acceso irrestricto a todos los negocios y proyectos del sistema. No es necesario asignar negocios individualmente.
                      </p>
                    </div>
                  )}
                </div>

                <SheetFooter className="mt-auto pt-6">
                  <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="bg-slate-800 hover:bg-slate-700">
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
