-- =========================================================================
-- MIGRACIÓN: AGREGAR NEGOCIOS Y RELACIÓN USUARIO-NEGOCIO
-- Fecha: 2026-06-22
-- =========================================================================

-- 1) Crear tabla de Negocios
CREATE TABLE VMS_NEGOCIO (
    NG_IDNEGOCIO_PK     NUMBER          PRIMARY KEY,
    NG_NOMBRE           VARCHAR2(200)   NOT NULL,
    NG_DESCRIPCION      VARCHAR2(500),
    NG_LOGO_URL         VARCHAR2(500),
    NG_ACTIVO           VARCHAR2(2)     DEFAULT 'SI' NOT NULL,
    NG_CREADOPOR        VARCHAR2(100)   DEFAULT USER,
    NG_CREADOEN         DATE            DEFAULT SYSDATE,
    NG_MODIFICPOR       VARCHAR2(100),
    NG_MODIFICEN        DATE
);

-- 2) Crear tabla de relación Usuario-Negocio
CREATE TABLE VMS_USUARIO_NEGOCIO (
    UN_ID_PK            NUMBER          PRIMARY KEY,
    US_IDUSUARIO_FK     NUMBER          NOT NULL,
    NG_IDNEGOCIO_FK     NUMBER          NOT NULL,
    UN_PERMISO          VARCHAR2(20)    DEFAULT 'LECTURA' NOT NULL,
    UN_ACTIVO           VARCHAR2(2)     DEFAULT 'SI' NOT NULL,
    UN_CREADOPOR        VARCHAR2(100)   DEFAULT USER,
    UN_CREADOEN         DATE            DEFAULT SYSDATE,
    UN_MODIFICPOR       VARCHAR2(100),
    UN_MODIFICEN        DATE
);

-- 3) Modificar la tabla de Proyectos para soportar la relación con Negocio
-- Agregamos la columna permitiendo NULL para no romper los registros existentes.
ALTER TABLE VMS_PROYECTO 
ADD NG_IDNEGOCIO_FK NUMBER;

-- 4) Agregar llaves foráneas para mantener integridad referencial
-- Llave foránea en VMS_PROYECTO hacia VMS_NEGOCIO
ALTER TABLE VMS_PROYECTO
ADD CONSTRAINT FK_PROY_NEGOCIO FOREIGN KEY (NG_IDNEGOCIO_FK)
REFERENCES VMS_NEGOCIO (NG_IDNEGOCIO_PK);

-- Llaves foráneas en VMS_USUARIO_NEGOCIO
ALTER TABLE VMS_USUARIO_NEGOCIO
ADD CONSTRAINT FK_UN_USUARIO FOREIGN KEY (US_IDUSUARIO_FK)
REFERENCES VMS_USUARIO (US_IDUSUARIO_PK);

ALTER TABLE VMS_USUARIO_NEGOCIO
ADD CONSTRAINT FK_UN_NEGOCIO FOREIGN KEY (NG_IDNEGOCIO_FK)
REFERENCES VMS_NEGOCIO (NG_IDNEGOCIO_PK);

-- Opcional: Crear un negocio "Por defecto" y asignar todos los proyectos a este negocio para que no queden huérfanos.
INSERT INTO VMS_NEGOCIO (NG_IDNEGOCIO_PK, NG_NOMBRE, NG_DESCRIPCION) 
VALUES (1, 'GRUPO ARGOS', 'Negocio principal creado durante la migración');

-- Actualizar todos los proyectos existentes
UPDATE VMS_PROYECTO SET NG_IDNEGOCIO_FK = 1 WHERE NG_IDNEGOCIO_FK IS NULL;

-- Ahora que no hay registros nulos, hacemos la columna obligatoria
ALTER TABLE VMS_PROYECTO MODIFY NG_IDNEGOCIO_FK NOT NULL;

COMMIT;
