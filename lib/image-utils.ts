/**
 * Utilidades para la optimización de imágenes en el cliente
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'image/jpeg' | 'image/webp' | 'image/png'
}

/**
 * Comprime una imagen en el cliente usando Canvas
 * @param file Archivo original
 * @param options Opciones de compresión
 * @returns Promesa con el archivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.7,
    format = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Redimensionar si excede los límites manteniendo el aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('No se pudo obtener el contexto del canvas'))
        }

        // Dibujar imagen en el canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir canvas a Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Error al generar el blob de la imagen'))
            }
            
            // Generar nuevo archivo
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            })
            
            console.log(
              `Imagen optimizada: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(
                compressedFile.size / 1024 / 1024
              ).toFixed(2)}MB`
            )
            
            resolve(compressedFile)
          },
          format,
          quality
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

/**
 * Genera una miniatura (thumbnail) muy pequeña para usar como placeholder
 */
export async function generateBlurPlaceholder(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 10
        canvas.height = 10
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject('No ctx')
        ctx.drawImage(img, 0, 0, 10, 10)
        resolve(canvas.toDataURL('image/jpeg', 0.1))
      }
    }
  })
}
