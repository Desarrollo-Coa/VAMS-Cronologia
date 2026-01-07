# Configuración de Firebase Storage para VAMS

## 🔑 Diferencia entre credenciales Cliente vs Servidor

### Credenciales del Cliente (`firebase_options.dart`)
- **Uso**: Frontend/Móvil (Flutter, Web)
- **Visibilidad**: Público (puede estar en el código)
- **Ejemplo**: `apiKey: 'AIzaSyAFu07SmmureCMfruWYcEBHz0G0p24-waE'`
- **Para qué**: Autenticación desde el cliente (app móvil fortoxQR)

### Credenciales del Servidor (Service Account)
- **Uso**: Backend/Servidor (Next.js)
- **Visibilidad**: **PRIVADO** (solo en servidor, NUNCA en cliente)
- **Componentes**: `client_email` + `private_key` + `project_id`
- **Para qué**: Permisos administrativos desde el servidor (VAMS)

### ¿Por qué necesitamos Service Account en VAMS?
En VAMS usamos el **servidor** para subir archivos porque:
- ✅ Validamos autenticación antes de subir
- ✅ Controlamos permisos de usuario
- ✅ No exponemos credenciales en el cliente
- ✅ Centralizamos la lógica de subida

## 📍 Dónde encontrar las credenciales de Firebase

### Paso 1: Acceder a Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Inicia sesión con tu cuenta de Google
3. Selecciona el proyecto: **dollarcity-a3eda**

### Paso 2: Obtener credenciales del Service Account (para el servidor)
**⚠️ IMPORTANTE**: Estas credenciales son DIFERENTES a las de `firebase_options.dart`

1. Haz clic en el **ícono de engranaje** (⚙️) junto a "Project Overview"
2. Selecciona **"Project settings"** (Configuración del proyecto)
3. Ve a la pestaña **"Service accounts"** (Cuentas de servicio)
4. Haz clic en **"Generate new private key"** (Generar nueva clave privada)
5. Se descargará un archivo JSON (ej: `dollarcity-a3eda-firebase-adminsdk-xxxxx.json`)

**Nota**: El `client_email` en este JSON es diferente al `apiKey` de `firebase_options.dart`. Son para propósitos diferentes:
- `apiKey` → Cliente (público)
- `client_email` → Servidor (privado)

### Paso 3: Extraer valores del JSON
Abre el archivo JSON descargado y encontrarás:

```json
{
  "type": "service_account",
  "project_id": "dollarcity-a3eda",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@dollarcity-a3eda.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Paso 4: Configurar variables de entorno
Crea o edita el archivo `.env.local` en la raíz del proyecto VAMS:

```env
# Firebase Storage Configuration
FIREBASE_PROJECT_ID=dollarcity-a3eda
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@dollarcity-a3eda.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=dollarcity-a3eda.appspot.com
```

**⚠️ IMPORTANTE:**
- Copia el valor completo de `private_key` del JSON (incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
- Mantén los `\n` en el string o reemplázalos con saltos de línea reales
- El valor debe estar entre comillas dobles en el `.env.local`

### Paso 5: Instalar dependencias
Ejecuta en la terminal:

```bash
pnpm add firebase-admin
```

## 🔧 Verificación

Una vez configurado, puedes probar la subida de archivos:
1. Ve a la página de Proyectos (`/proyectos`)
2. Haz clic en "Nuevo Proyecto"
3. Intenta subir una imagen de portada
4. Si todo está bien configurado, la imagen se subirá automáticamente a Firebase Storage

## 📝 Notas

- El `storageBucket` generalmente es: `{project-id}.appspot.com`
- Las credenciales del Service Account son diferentes a las del cliente (que están en `firebase_options.dart`)
- El archivo `.env.local` NO debe subirse a Git (ya está en `.gitignore`)
- Los archivos se suben al directorio `proyectos/` en Firebase Storage

## 🚨 Solución de problemas

### Error: "Firebase Admin SDK no está configurado"
- Verifica que todas las variables de entorno estén en `.env.local`
- Reinicia el servidor de desarrollo (`pnpm dev`)

### Error: "Invalid credentials"
- Verifica que el `private_key` tenga los saltos de línea correctos (`\n`)
- Asegúrate de que el `client_email` sea correcto

### Error: "Permission denied"
- Verifica que el Service Account tenga permisos de Storage Admin en Firebase Console
- Ve a Firebase Console → Storage → Rules y verifica los permisos

