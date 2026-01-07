import { NextResponse } from "next/server"

// Mock data combining projects and visual assets
const chronologies = [
  {
    id: 1,
    projectId: 1,
    name: "Condominio Tami Alva",
    location: "Exterior Abajo",
    date: "Jun 15 2025",
    images: ["/green-bridge-river.jpg"],
    progress: {
      current: "Etapa Actual",
      phase: "Fase Inicial",
      date: "Jun 15 01:19:25 2025",
    },
    stats: {
      totalPhotos: 234,
      lastUpdate: "2 days ago",
      storage: "1.2 GB",
    },
  },
  {
    id: 2,
    projectId: 2,
    name: "Residencial Solana",
    location: "Fase 1 Interior Día",
    date: "Jun 15 2025",
    images: ["/apartment-buildings-exterior.jpg", "/construction-site-overhead.jpg"],
    progress: {
      current: "Etapa de Construcción",
      phase: "50% completado",
      date: "Jun 10 14:23:15 2025",
    },
    stats: {
      totalPhotos: 187,
      lastUpdate: "5 days ago",
      storage: "890 MB",
    },
  },
  {
    id: 3,
    projectId: 3,
    name: "Puente Nuevo",
    location: "Exterior Lateral",
    date: "Jun 08 2025",
    images: ["/dirt-road-construction.jpg", "/building-foundation.jpg"],
    progress: {
      current: "Fase Inicial",
      phase: "Excavación",
      date: "Jun 08 09:45:00 2025",
    },
    stats: {
      totalPhotos: 156,
      lastUpdate: "1 week ago",
      storage: "720 MB",
    },
  },
  {
    id: 4,
    projectId: 3,
    name: "Playita Huanta",
    location: "Exterior Abajo",
    date: "Jun 01 2025",
    images: ["/construction-materials-variety.png"],
    progress: {
      current: "Preparación",
      phase: "Limpieza terreno",
      date: "Jun 01 16:20:00 2025",
    },
    stats: {
      totalPhotos: 89,
      lastUpdate: "2 weeks ago",
      storage: "420 MB",
    },
  },
]

export async function GET() {
  return NextResponse.json(chronologies)
}
