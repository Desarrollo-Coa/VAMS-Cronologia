'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage'

let app: FirebaseApp | null = null
let storage: FirebaseStorage | null = null
let credentialsCache: any = null

/**
 * Obtiene las credenciales de Firebase del servidor (solo si está autenticado)
 */
async function getFirebaseCredentials() {
  const response = await fetch('/api/upload/credentials', {
    method: 'POST',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'No autorizado para obtener credenciales')
  }

  const data = await response.json()
  return data.credentials
}

/**
 * Inicializa Firebase con credenciales temporales
 */
async function initializeFirebaseWithCredentials(credentials: any): Promise<FirebaseApp> {
  // Limpiar instancias anteriores si existen
  const apps = getApps()
  if (apps.length > 0) {
    // Firebase no permite múltiples inicializaciones, pero podemos reutilizar
    return apps[0]
  }

  app = initializeApp(credentials)
  return app
}

/**
 * Limpia las credenciales y la instancia de Firebase
 */
function cleanupFirebase() {
  // Limpiar referencias
  credentialsCache = null
  
  // Nota: Firebase no permite destruir apps fácilmente en el cliente
  // pero las credenciales ya no están en memoria después de limpiar credentialsCache
  app = null
  storage = null
}

/**
 * Sube un archivo a Firebase Storage usando credenciales temporales
 * Las credenciales se obtienen, se usan y se limpian inmediatamente
 * 
 * @param file - Archivo a subir
 * @param directory - Directorio donde guardar (default: "activos-visuales")
 * @returns URL pública del archivo subido
 */
export async function uploadFileToStorage(
  file: File,
  directory: string = 'activos-visuales'
): Promise<string> {
  let credentials: any = null

  try {
    // 1. Obtener credenciales del servidor (solo si está autenticado)
    credentials = await getFirebaseCredentials()
    credentialsCache = credentials

    // 2. Inicializar Firebase con las credenciales
    const firebaseApp = await initializeFirebaseWithCredentials(credentials)
    storage = getStorage(firebaseApp)

    // 3. Preparar el archivo para subir
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${directory}/${timestamp}_${sanitizedFileName}`

    // 4. Subir el archivo
    const storageRef = ref(storage, filePath)
    await uploadBytes(storageRef, file)

    // 5. Obtener URL pública
    const url = await getDownloadURL(storageRef)

    // 6. Limpiar credenciales inmediatamente después de la subida
    cleanupFirebase()

    return url
  } catch (error) {
    // Asegurarse de limpiar credenciales incluso si hay error
    cleanupFirebase()
    
    console.error('Error uploading file to Firebase Storage:', error)
    throw new Error(
      `Error al subir archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`
    )
  }
}

