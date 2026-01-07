"use client"

import type React from "react"

import { use, useState } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileImage } from "lucide-react"

export default function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload logic here
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-900">My Chronologies</h1>
            </div>

            <h2 className="text-xl font-semibold mb-6 text-slate-900">Upload Photos - Cronología {id}</h2>

            <Card className="p-8 bg-white">
              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center mb-6 transition-colors ${
                  isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-900 mb-1">Drag & Drop files</p>
                    <p className="text-sm text-gray-600">Drop archivos (fotosdeslizables) agregando</p>
                  </div>
                </div>
              </div>

              {/* File Info */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-slate-900">Restreción Geastion URL</h3>
                <p className="text-sm text-gray-600 mb-2">Tolera archivos definidodefoto.doc e agrupiano</p>
              </div>

              {/* Permissions Info */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 text-slate-900">Permesciasdes</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <FileImage className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">
                        Plang & Ddtinence(inbledataes) DZ COLOS TFS (Prnesto)
                      </p>
                      <p className="text-gray-600">Español Oblivions Contraquits</p>
                      <p className="text-gray-600">Controvestano</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent">
                  SEG venta
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  Heat Compos
                </Button>
                <Button className="flex-1 bg-slate-800 hover:bg-slate-700">Idia PHONS</Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  Cotr SUMING
                </Button>
              </div>
            </Card>

            {/* Additional Info Section */}
            <Card className="p-6 mt-6 bg-white">
              <h3 className="text-sm font-semibold mb-3 text-slate-900">Restreción Geastion URL</h3>
              <p className="text-sm text-gray-600">Folgs e contributehallofotodslow con quigrantes</p>
            </Card>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  )
}
