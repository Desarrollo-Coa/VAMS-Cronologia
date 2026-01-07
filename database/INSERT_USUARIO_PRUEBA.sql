-- ===================================================
-- INSERT DE USUARIOS DE PRUEBA PARA VAMS
-- ===================================================
-- Usuario: admin
-- Contraseña: admin123
-- Rol: ADMINISTRADOR
-- ===================================================

-- Insertar usuario de prueba: admin
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

-- Usuario: carlos
-- Contraseña: 123456
-- Correo: pendiente@gmail.com
-- Rol: ADMINISTRADOR
INSERT INTO VMS_USUARIO (
    US_IDUSUARIO_PK,
    RL_IDROL_FK,
    US_NOMBRE,
    US_CORREO,
    US_USUARIO,
    US_CONTRASENA,
    US_ACTIVO
) VALUES (
    2,  -- ID del usuario
    1,  -- ID del rol ADMINISTRADOR
    'Carlos Rocha',
    'pendiente@gmail.com',
    'carlos',
    STANDARD_HASH('123456', 'MD5'),  -- Contraseña hasheada
    'SI'
);

COMMIT;

-- Verificar que se crearon correctamente
SELECT 
    US_IDUSUARIO_PK,
    US_USUARIO,
    US_NOMBRE,
    US_CORREO,
    RL_NOMBRE AS ROL
FROM VMS_USUARIO u
LEFT JOIN VMS_ROL r ON u.RL_IDROL_FK = r.RL_IDROL_PK
WHERE US_USUARIO IN ('admin', 'carlos');

