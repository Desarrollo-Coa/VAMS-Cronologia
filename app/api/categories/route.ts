import { NextResponse } from "next/server"

// Mock data based on RN_CATEGORIA table
const categories = [
  {
    CT_IDCATEGORIA_PK: 1,
    PR_IDPROYECTO_FK: 1,
    CT_NOMBRE: "Drones",
    CT_DESCRIPCION: "Fotografías aéreas capturadas con drones",
    CT_ICONO: "drone",
    CT_COLOR: "#3B82F6",
    CT_ORDEN: 1,
    CT_ACTIVO: "SI",
  },
  {
    CT_IDCATEGORIA_PK: 2,
    PR_IDPROYECTO_FK: 1,
    CT_NOMBRE: "Sedes",
    CT_DESCRIPCION: "Fotografías de edificaciones y sedes",
    CT_ICONO: "building",
    CT_COLOR: "#10B981",
    CT_ORDEN: 2,
    CT_ACTIVO: "SI",
  },
  {
    CT_IDCATEGORIA_PK: 3,
    PR_IDPROYECTO_FK: 1,
    CT_NOMBRE: "Interiores",
    CT_DESCRIPCION: "Fotografías de espacios interiores",
    CT_ICONO: "interior",
    CT_COLOR: "#F59E0B",
    CT_ORDEN: 3,
    CT_ACTIVO: "SI",
  },
  {
    CT_IDCATEGORIA_PK: 4,
    PR_IDPROYECTO_FK: 1,
    CT_NOMBRE: "Puntos de Control",
    CT_DESCRIPCION: "Puntos de referencia y control del proyecto",
    CT_ICONO: "map-pin",
    CT_COLOR: "#EF4444",
    CT_ORDEN: 4,
    CT_ACTIVO: "SI",
  },
]

export async function GET() {
  return NextResponse.json(categories)
}
