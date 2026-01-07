-- ===================================================
-- VERIFICAR Y CREAR FUNCIONES EN SCHEMA SATOR
-- ===================================================

-- 1. Verificar si las funciones existen en SATOR
SELECT OBJECT_NAME, OBJECT_TYPE, STATUS
FROM ALL_OBJECTS
WHERE OWNER = 'SATOR'
  AND OBJECT_TYPE = 'FUNCTION'
  AND OBJECT_NAME LIKE 'VMS_%'
ORDER BY OBJECT_NAME;

-- 2. Verificar si las tablas existen en SATOR
SELECT TABLE_NAME
FROM ALL_TABLES
WHERE OWNER = 'SATOR'
  AND TABLE_NAME LIKE 'VMS_%'
ORDER BY TABLE_NAME;

-- 3. Si las funciones NO existen, ejecutar este bloque para crearlas en SATOR
-- (Asegúrate de estar conectado como usuario con permisos en SATOR)

-- ===================================================
-- CREAR FUNCIONES EN SCHEMA SATOR
-- ===================================================

CREATE OR REPLACE FUNCTION SATOR.VMS_AUTENTICAR_USUARIO (
    p_username IN VARCHAR2,
    p_password IN VARCHAR2
) RETURN NUMBER
IS
    v_usuario_id NUMBER;
BEGIN
    SELECT US_IDUSUARIO_PK
    INTO   v_usuario_id
    FROM   SATOR.VMS_USUARIO
    WHERE  UPPER(US_USUARIO) = UPPER(TRIM(p_username))
      AND  US_CONTRASENA = STANDARD_HASH(TRIM(p_password), 'MD5')
      AND  US_ACTIVO = 'SI';
    
    RETURN v_usuario_id;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN TOO_MANY_ROWS THEN
        RETURN 0;
    WHEN OTHERS THEN
        RETURN 0;
END;
/

CREATE OR REPLACE FUNCTION SATOR.VMS_GENERAR_TOKEN (
    p_usuario_id IN NUMBER,
    p_horas_validez IN NUMBER DEFAULT 24
) RETURN VARCHAR2
IS
    v_token VARCHAR2(32);
    v_token_id NUMBER;
    v_string VARCHAR2(200);
BEGIN
    v_string := p_usuario_id || '_' || 
                TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS') || '_' || 
                DBMS_RANDOM.STRING('X', 16);
    
    SELECT SUBSTR(STANDARD_HASH(v_string, 'MD5'), 1, 32)
    INTO v_token
    FROM DUAL;
    
    SELECT SEQ_VMS_TOKEN_API.NEXTVAL INTO v_token_id FROM DUAL;
    
    UPDATE SATOR.VMS_TOKEN_API
    SET TA_ACTIVO = 'NO'
    WHERE US_IDUSUARIO_FK = p_usuario_id
      AND TA_ACTIVO = 'SI';
    
    INSERT INTO SATOR.VMS_TOKEN_API (
        TA_IDTOKEN_PK,
        US_IDUSUARIO_FK,
        TA_TOKEN,
        TA_FECHA_CREACION,
        TA_FECHA_EXPIRACION,
        TA_ACTIVO
    ) VALUES (
        v_token_id,
        p_usuario_id,
        v_token,
        SYSDATE,
        SYSDATE + (p_horas_validez / 24),
        'SI'
    );
    
    COMMIT;
    RETURN v_token;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RETURN NULL;
END;
/

CREATE OR REPLACE FUNCTION SATOR.VMS_VALIDAR_TOKEN (
    p_token IN VARCHAR2
) RETURN NUMBER
IS
    v_usuario_id NUMBER;
BEGIN
    SELECT US_IDUSUARIO_FK
    INTO v_usuario_id
    FROM SATOR.VMS_TOKEN_API
    WHERE TA_TOKEN = p_token
      AND TA_ACTIVO = 'SI'
      AND TA_FECHA_EXPIRACION > SYSDATE
      AND ROWNUM = 1;
    
    RETURN v_usuario_id;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        RETURN 0;
END;
/

CREATE OR REPLACE FUNCTION SATOR.VMS_INVALIDAR_TOKEN (
    p_token IN VARCHAR2
) RETURN VARCHAR2
IS
BEGIN
    UPDATE SATOR.VMS_TOKEN_API
    SET TA_ACTIVO = 'NO'
    WHERE TA_TOKEN = p_token;
    
    COMMIT;
    RETURN 'SI';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'NO';
END;
/

-- 4. Otorgar permisos de ejecución (si es necesario)
-- GRANT EXECUTE ON SATOR.VMS_AUTENTICAR_USUARIO TO PUBLIC;
-- GRANT EXECUTE ON SATOR.VMS_GENERAR_TOKEN TO PUBLIC;
-- GRANT EXECUTE ON SATOR.VMS_VALIDAR_TOKEN TO PUBLIC;
-- GRANT EXECUTE ON SATOR.VMS_INVALIDAR_TOKEN TO PUBLIC;

COMMIT;

-- 5. Verificar que se crearon correctamente
SELECT OBJECT_NAME, STATUS
FROM ALL_OBJECTS
WHERE OWNER = 'SATOR'
  AND OBJECT_TYPE = 'FUNCTION'
  AND OBJECT_NAME LIKE 'VMS_%'
ORDER BY OBJECT_NAME;

