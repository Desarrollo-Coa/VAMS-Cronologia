-- MIGRACIÓN PARA ACTUALIZAR ROLES DEL SISTEMA
-- Ejecutar en Oracle SQL Developer / SQL*Plus

-- 1. Eliminar rol obsoleto
DELETE FROM VMS_ROL WHERE RL_IDROL_PK = 4;

-- 2. Actualizar nombres de roles existentes
UPDATE VMS_ROL 
SET RL_NOMBRE = 'ADMINISTRADOR',
    RL_DESCRIPCION = 'Acceso completo al sistema, gestión de proyectos y usuarios'
WHERE RL_IDROL_PK = 1;

UPDATE VMS_ROL 
SET RL_NOMBRE = 'GESTOR PROYECTO',
    RL_DESCRIPCION = 'Gestión completa de proyectos asignados, carga de archivos y comparaciones'
WHERE RL_IDROL_PK = 2;

UPDATE VMS_ROL 
SET RL_NOMBRE = 'SOLO LECTURA',
    RL_DESCRIPCION = 'Solo lectura, visualización de proyectos y activos visuales'
WHERE RL_IDROL_PK = 3;

COMMIT;
