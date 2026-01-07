import { NextResponse } from "next/server"

// Mock statistics data based on RN_ESTADISTICA_ALMACENAMIENTO table
const stats = {
  totalProjects: 3,
  totalFiles: 666,
  totalStorage: 3230000000, // bytes (3.23 GB)
  monthlyUploads: 156,
  monthlyStorage: 720000000, // bytes (720 MB)
  storageByProject: [
    {
      projectName: "Condominio Tami Alva",
      files: 234,
      storage: 1200000000, // 1.2 GB
    },
    {
      projectName: "Residencial Solana",
      files: 187,
      storage: 890000000, // 890 MB
    },
    {
      projectName: "Puente Nuevo - Fase 1",
      files: 245,
      storage: 1140000000, // 1.14 GB
    },
  ],
}

export async function GET() {
  return NextResponse.json(stats)
}
