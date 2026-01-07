// Types based on the database schema

export interface Project {
  PR_IDPROYECTO_PK: number
  PR_NOMBRE: string
  PR_DESCRIPCION: string
  PR_UBICACION: string
  PR_LATITUD: number
  PR_LONGITUD: number
  PR_FOTO_PORTADA_URL: string
  PR_FECHA_INICIO: string
  PR_FECHA_FIN: string | null
  PR_ACTIVO: string
}

export interface Category {
  CT_IDCATEGORIA_PK: number
  PR_IDPROYECTO_FK: number
  CT_NOMBRE: string
  CT_DESCRIPCION: string
  CT_ICONO: string
  CT_COLOR: string
  CT_ORDEN: number
  CT_ACTIVO: string
}

export interface Chronology {
  id: number
  projectId: number
  name: string
  location: string
  date: string
  images: string[]
  progress: {
    current: string
    phase: string
    date: string
  }
  stats: {
    totalPhotos: number
    lastUpdate: string
    storage: string
  }
}

export interface ChronologyDetail {
  id: number
  name: string
  description: string
  createdBy: string
  createdDate: string
  permissions: Permission[]
  phases: Phase[]
  photos: Photo[]
}

export interface Permission {
  user: string
  role: string
  access: string
}

export interface Phase {
  id: number
  name: string
  date: string
  active: boolean
  completed: boolean
}

export interface Photo {
  id: number
  url: string
  date: string
  time: string
  location: string
}

export interface User {
  US_IDUSUARIO_PK: number
  US_NOMBRE: string
  US_CORREO: string
  US_USUARIO: string
  RL_IDROL_FK: number
  RL_NOMBRE?: string
}

export interface LoginResponse {
  success: boolean
  user?: User
  message: string
}
