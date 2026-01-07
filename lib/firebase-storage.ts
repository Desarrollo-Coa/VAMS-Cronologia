import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getStorage, Storage } from 'firebase-admin/storage'

let app: App | undefined
let storage: Storage | undefined

/**
 * Inicializa Firebase Admin SDK si no está ya inicializado
 */
function initializeFirebase(): App {
  if (!app) {
    const apps = getApps()
    
    if (apps.length === 0) {
      // Verificar que las variables de entorno estén configuradas
      if (!process.env.FIREBASE_PROJECT_ID) {
        throw new Error(
          'FIREBASE_PROJECT_ID no está configurado en las variables de entorno'
        )
      }

      const projectId = process.env.FIREBASE_PROJECT_ID
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`

      // Intentar usar Service Account si está disponible
      if (process.env.FIREBASE_PRIVATE_KEY && 
          process.env.FIREBASE_PRIVATE_KEY.trim() !== '' && 
          process.env.FIREBASE_PRIVATE_KEY !== '--') {
        
        let privateKey = process.env.FIREBASE_PRIVATE_KEY.trim()
        
        // Remover comillas al inicio y final si existen
        if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
            (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
          privateKey = privateKey.slice(1, -1).trim()
        }
        
        // Convertir \n a saltos de línea reales
        privateKey = privateKey.replace(/\\n/g, '\n')
        privateKey = privateKey.replace(/\\r/g, '\r')
        
        // Verificar que la clave privada tenga el formato correcto
        if (privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')) {
          app = initializeApp({
            credential: cert({
              projectId,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL || `firebase-adminsdk@${projectId}.iam.gserviceaccount.com`,
              privateKey,
            }),
            storageBucket,
          })
        } else {
          throw new Error('FIREBASE_PRIVATE_KEY no tiene el formato PEM correcto')
        }
      } else {
        // Si no hay Service Account, usar Application Default Credentials o credenciales del proyecto
        // Esto requiere que las credenciales estén en GOOGLE_APPLICATION_CREDENTIALS
        app = initializeApp({
          projectId,
          storageBucket,
        })
      }
    } else {
      app = apps[0]
    }
  }

  return app
}

/**
 * Obtiene la instancia de Firebase Storage
 */
export function getFirebaseStorage(): Storage {
  if (!storage) {
    initializeFirebase()
    storage = getStorage()
  }
  return storage
}

/**
 * Sube un archivo a Firebase Storage
 * @param buffer - Buffer del archivo
 * @param fileName - Nombre del archivo
 * @param contentType - Tipo MIME del archivo
 * @param directory - Directorio donde se guardará (ej: "activos-visuales", "proyectos")
 * @returns URL pública del archivo subido
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  directory: string = 'activos-visuales'
): Promise<string> {
  try {
    const storage = getFirebaseStorage()
    const bucket = storage.bucket()
    
    // Crear nombre único para evitar conflictos
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${directory}/${timestamp}_${sanitizedFileName}`
    
    const file = bucket.file(filePath)

    // Subir el archivo
    await file.save(buffer, {
      metadata: {
        contentType,
      },
      public: true, // Hacer el archivo público
    })

    // Obtener URL pública
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // URL permanente (muy lejano en el futuro)
    })

    // Alternativa: URL pública directa si el bucket es público
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
    
    return publicUrl
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error)
    throw new Error(`Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`)
  }
}

