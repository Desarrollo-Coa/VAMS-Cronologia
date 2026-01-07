# Configuración de Autenticación - VAMS

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# URL base de la aplicación Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000

# URL de la API externa de base de datos
# Esta es la API que se conecta a Oracle y expone los endpoints
DB_API_URL=http://localhost:8080/api
```

## API Externa Requerida

La aplicación espera que exista una API externa que maneje la conexión a Oracle Database.

### Endpoint de Autenticación

**POST** `/auth/login`

**Request Body:**
```json
{
  "username": "usuario",
  "password": "contraseña"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "user": {
    "US_IDUSUARIO_PK": 1,
    "US_NOMBRE": "Nombre Usuario",
    "US_CORREO": "usuario@email.com",
    "US_USUARIO": "usuario",
    "RL_IDROL_FK": 1,
    "RL_NOMBRE": "ADMINISTRADOR"
  },
  "message": "Autenticación exitosa"
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

### Implementación en la API Externa

La API externa debe llamar a la función de Oracle:

```sql
SELECT VMS_AUTENTICAR_USUARIO(:username, :password) as USER_ID FROM DUAL
```

Si `USER_ID > 0`, entonces obtener los datos del usuario:

```sql
SELECT 
  u.US_IDUSUARIO_PK,
  u.US_NOMBRE,
  u.US_CORREO,
  u.US_USUARIO,
  u.RL_IDROL_FK,
  r.RL_NOMBRE
FROM VMS_USUARIO u
LEFT JOIN VMS_ROL r ON u.RL_IDROL_FK = r.RL_IDROL_PK
WHERE u.US_IDUSUARIO_PK = :user_id
  AND u.US_ACTIVO = 'SI'
```

## Flujo de Autenticación

1. Usuario hace clic en "EMPEZAR AHORA" en la página principal
2. Se redirige a `/login`
3. Usuario ingresa credenciales
4. Frontend llama a `/api/auth/login` (Next.js API Route)
5. Next.js API Route llama a la API externa (`DB_API_URL/auth/login`)
6. API externa autentica con Oracle usando `VMS_AUTENTICAR_USUARIO`
7. Si es exitoso, se guarda el usuario en `sessionStorage`
8. Usuario es redirigido a `/chronologies`

## Funciones Helper

El archivo `lib/auth.ts` proporciona funciones útiles:

- `getCurrentUser()`: Obtiene el usuario actual
- `isAuthenticated()`: Verifica si hay sesión activa
- `logout()`: Cierra sesión y redirige al login
- `hasRole(roleId)`: Verifica si el usuario tiene un rol específico
- `isAdmin()`: Verifica si el usuario es administrador

## Roles del Sistema

Según el esquema de base de datos:

- `1` = ADMINISTRADOR
- `2` = GESTOR PROYECTO
- `3` = VISUALIZADOR
- `4` = CARGA ARCHIVOS

