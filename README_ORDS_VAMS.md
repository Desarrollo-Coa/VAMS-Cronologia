# ORDS REST API para VAMS

## Instalación

1. Conectarse a la base de datos Oracle con un usuario que tenga permisos para crear módulos ORDS
2. Ejecutar el script: `ws_api/ORDS_REST_VAMS.sql`
3. Verificar que el módulo se creó correctamente

## Verificación

```sql
-- Ver módulos creados
SELECT * FROM USER_ORDS_MODULES WHERE MODULE_NAME = 'vams/';

-- Ver templates
SELECT * FROM USER_ORDS_TEMPLATES WHERE MODULE_NAME = 'vams/';

-- Ver handlers
SELECT * FROM USER_ORDS_HANDLERS WHERE MODULE_NAME = 'vams/';
```

## Endpoints Disponibles

### 1. Autenticación (POST) - Recomendado

**URL:** `http://tu-servidor:puerto/ords/ws_vams/vams/auth/login`

**Método:** POST

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "username": "usuario",
  "password": "contraseña"
}
```

**Response Success (200):**
```json
{
  "success": "true",
  "message": "Autenticación exitosa",
  "user_json": "{\"US_IDUSUARIO_PK\":1,\"US_NOMBRE\":\"Nombre Usuario\",\"US_CORREO\":\"usuario@email.com\",\"US_USUARIO\":\"usuario\",\"RL_IDROL_FK\":1,\"RL_NOMBRE\":\"ADMINISTRADOR\"}",
  "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Nota:** El `token` es un string de 32 caracteres (MD5 hash) que debe usarse en el header `X-API-Token` para todas las llamadas API subsiguientes.

**Response Error:**
```json
{
  "success": "false",
  "message": "Credenciales inválidas o usuario inactivo",
  "user_json": null,
  "token": null
}
```

### 2. Validar Token (GET)

**URL:** `http://tu-servidor:puerto/ords/ws_vams/vams/auth/validate`

**Método:** GET

**Headers:**
```
X-API-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Response Success (200):**
```json
{
  "success": "true",
  "message": "Token válido",
  "user_id": 1
}
```

**Response Error:**
```json
{
  "success": "false",
  "message": "Token inválido o expirado",
  "user_id": 0
}
```

### 3. Autenticación (GET) - Alternativo (solo para pruebas)

**URL:** `http://tu-servidor:puerto/ords/ws_vams/vams/auth/login/:username/:password`

**Método:** GET

**Ejemplo:**
```
GET /ords/ws_vams/vams/auth/login/admin/admin123
```

**Response:** Similar al POST

## Configuración en Next.js

En tu archivo `.env.local`:

```env
# URL base de ORDS REST API
DB_API_URL=http://tu-servidor:puerto/ords/ws_vams
```

La aplicación Next.js llamará a:
- `POST ${DB_API_URL}/vams/auth/login` - Para autenticar y obtener token
- `GET ${DB_API_URL}/vams/auth/validate` - Para validar token (con header `X-API-Token`)

## Estructura de Respuesta

### Login Endpoint
El endpoint de login retorna:
- `success`: "true" o "false" (string)
- `message`: Mensaje descriptivo
- `user_json`: JSON string con los datos del usuario (necesita parsearse)
- `token`: Token de acceso de 32 caracteres (MD5 hash)

El objeto `user` contiene:
- `US_IDUSUARIO_PK`: ID del usuario
- `US_NOMBRE`: Nombre completo
- `US_CORREO`: Correo electrónico
- `US_USUARIO`: Nombre de usuario
- `RL_IDROL_FK`: ID del rol
- `RL_NOMBRE`: Nombre del rol

## Sistema de Tokens (Opción 2: Simple y Corto)

El sistema utiliza tokens de **32 caracteres** generados con MD5 hash para autenticación de API.

### Características:
- **Token corto**: 32 caracteres (MD5 hash)
- **Validez**: 24 horas por defecto
- **Almacenamiento**: Tabla `VMS_TOKEN_API` en base de datos
- **Validación**: Endpoint `/vams/auth/validate` con header `X-API-Token`

### Uso en Next.js:

```typescript
import { apiCall, apiGet, apiPost } from '@/lib/api-client'

// El helper incluye automáticamente el token en el header
const response = await apiGet('/vams/projects')
const data = await response.json()
```

### Funciones PL/SQL Disponibles:

- `VMS_GENERAR_TOKEN(usuario_id, horas_validez)`: Genera un nuevo token
- `VMS_VALIDAR_TOKEN(token)`: Valida un token y retorna el ID de usuario (0 si inválido)
- `VMS_INVALIDAR_TOKEN(token)`: Invalida un token (logout)

## Notas Importantes

1. **Schema**: El script usa el schema `SATOR` (configurado en línea 20). Todas las funciones y tablas deben estar en este schema.

2. **URL Mapping**: El patrón base es `ws_vams`. La URL completa será:
   ```
   /ords/ws_vams/vams/auth/login
   /ords/ws_vams/vams/auth/validate
   ```

3. **Seguridad**: 
   - El endpoint POST es más seguro (no expone credenciales en la URL)
   - Las contraseñas se hashean con MD5 usando `STANDARD_HASH`
   - Solo usuarios activos (`US_ACTIVO = 'SI'`) pueden autenticarse
   - **Tokens**: Todos los endpoints protegidos requieren el header `X-API-Token` con un token válido
   - Los tokens expiran después de 24 horas (configurable)
   - Al generar un nuevo token, los tokens anteriores del mismo usuario se invalidan automáticamente

4. **Funciones de Base de Datos**: 
   - `VMS_AUTENTICAR_USUARIO(username, password)`: Autentica usuario y retorna ID
   - `VMS_GENERAR_TOKEN(usuario_id, horas_validez)`: Genera token de acceso
   - `VMS_VALIDAR_TOKEN(token)`: Valida token y retorna ID de usuario
   - `VMS_INVALIDAR_TOKEN(token)`: Invalida un token

5. **Tabla de Tokens**: La tabla `VMS_TOKEN_API` almacena los tokens con:
   - `TA_TOKEN`: Token de 32 caracteres (único)
   - `TA_FECHA_EXPIRACION`: Fecha de expiración
   - `TA_ACTIVO`: Estado del token ('SI' o 'NO')

## Próximos Endpoints a Crear

- `GET /vams/projects` - Listar proyectos
- `GET /vams/projects/:id` - Obtener proyecto por ID
- `GET /vams/categories` - Listar categorías
- `GET /vams/activos/:proyectoId` - Listar activos visuales por proyecto
- `POST /vams/activos` - Crear nuevo activo visual
- `GET /vams/stats/:proyectoId` - Estadísticas de proyecto

