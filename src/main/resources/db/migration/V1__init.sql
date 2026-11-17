-- TaskFlow - Esquema inicial (Fase 2)
-- Compatible con MySQL 8 y con H2 2.x en modo MySQL (solo tests).
-- Reglas: sin ENGINE, sin COLLATE por tabla y sin ON UPDATE, para que el
-- mismo script funcione en ambos motores.

CREATE TABLE usuarios (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    nombre        VARCHAR(80)  NOT NULL,
    email         VARCHAR(180) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uk_usuarios_email UNIQUE (email)
);

CREATE TABLE tareas (
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    usuario_id     BIGINT        NOT NULL,
    titulo         VARCHAR(120)  NOT NULL,
    descripcion    VARCHAR(2000) NULL,
    prioridad      VARCHAR(10)   NOT NULL,
    estado         VARCHAR(20)   NOT NULL,
    fecha_limite   DATE          NULL,
    creado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tareas PRIMARY KEY (id),
    CONSTRAINT fk_tareas_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT ck_tareas_prioridad CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA')),
    CONSTRAINT ck_tareas_estado CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA'))
);

CREATE INDEX idx_tareas_usuario_estado ON tareas (usuario_id, estado);
CREATE INDEX idx_tareas_usuario_fecha ON tareas (usuario_id, fecha_limite);
CREATE INDEX idx_tareas_usuario_prioridad ON tareas (usuario_id, prioridad);
