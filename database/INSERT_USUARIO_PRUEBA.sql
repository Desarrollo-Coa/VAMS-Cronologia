-- ===================================================
-- INSERT DE USUARIO DE PRUEBA PARA VAMS
-- ===================================================
-- Usuario: admin
-- Contraseña: admin123
-- Rol: ADMINISTRADOR
-- ===================================================

-- Insertar usuario de prueba
INSERT INTO VMS_USUARIO (
    US_IDUSUARIO_PK,
    RL_IDROL_FK,
    US_NOMBRE,
    US_CORREO,
    US_USUARIO,
    US_CONTRASENA,
    US_ACTIVO
) VALUES (
    1,  -- ID del usuario
    1,  -- ID del rol ADMINISTRADOR
    'Administrador del Sistema',
    'admin@vams.com',
    'admin',
    STANDARD_HASH('admin123', 'MD5'),  -- Contraseña hasheada
    'SI'
);

COMMIT;

-- Verificar que se creó correctamente
SELECT 
    US_IDUSUARIO_PK,
    US_USUARIO,
    US_NOMBRE,
    US_CORREO,
    RL_NOMBRE AS ROL
FROM VMS_USUARIO u
LEFT JOIN VMS_ROL r ON u.RL_IDROL_FK = r.RL_IDROL_PK
WHERE US_USUARIO = 'admin';

