import { NextResponse } from "next/server"

const chronologyDetails = {
  1: {
    id: 1,
    name: "Condominio Tami Alva",
    description: "Captura cronológica del avance de construcción del proyecto",
    createdBy: "Ramiro Incacolina Daza",
    createdDate: "Jun 15 01:19:25 2025",
    permissions: [
      { user: "Proyecto Inkalinda Inicial", role: "1 hour Ago", access: "Admin" },
      { user: "Ramiro Incacolina Daza", role: "5 hour Ago", access: "Editor" },
      { user: "Ramiro Incacolina Curuena", role: "5 Proyect", access: "Viewer" },
    ],
    phases: [
      { id: 1, name: "Inicio", date: "Jun 10", active: true, completed: true },
      { id: 2, name: "Fase 2", date: "Jun 15", active: false, completed: false },
      { id: 3, name: "Fase 3", date: "Jun 20", active: false, completed: false },
      { id: 4, name: "Fase 4", date: "Jun 25", active: false, completed: false },
      { id: 5, name: "Fase 5", date: "Jun 30", active: false, completed: false },
      { id: 6, name: "Fase 6", date: "Jul 05", active: false, completed: false },
      { id: 7, name: "Final", date: "Jul 10", active: false, completed: false },
    ],
    photos: [
      {
        id: 1,
        url: "/construction-site-entrance.jpg",
        date: "Jun 15 2025",
        time: "09:30 AM",
        location: "Exterior Entrada",
      },
      {
        id: 2,
        url: "/building-foundation-work.jpg",
        date: "Jun 15 2025",
        time: "11:45 AM",
        location: "Área Central",
      },
      {
        id: 3,
        url: "/construction-materials-storage.jpg",
        date: "Jun 16 2025",
        time: "08:15 AM",
        location: "Bodega",
      },
      {
        id: 4,
        url: "/apartment-building-progress.jpg",
        date: "Jun 16 2025",
        time: "02:30 PM",
        location: "Torre A",
      },
      {
        id: 5,
        url: "/construction-workers-site.jpg",
        date: "Jun 17 2025",
        time: "10:00 AM",
        location: "Área de Trabajo",
      },
      {
        id: 6,
        url: "/building-structure-concrete.jpg",
        date: "Jun 17 2025",
        time: "03:45 PM",
        location: "Estructura Principal",
      },
      {
        id: 7,
        url: "/construction-equipment-crane.jpg",
        date: "Jun 18 2025",
        time: "07:30 AM",
        location: "Grúa Norte",
      },
      {
        id: 8,
        url: "/placeholder.svg?height=200&width=300",
        date: "Jun 18 2025",
        time: "01:20 PM",
        location: "Piso 3",
      },
    ],
  },
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const detail = chronologyDetails[Number(id) as keyof typeof chronologyDetails]

  if (!detail) {
    return NextResponse.json({ error: "Chronology not found" }, { status: 404 })
  }

  return NextResponse.json(detail)
}
