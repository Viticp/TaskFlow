-- TaskFlow - Adaptacion a aplicacion personal de un solo usuario (Fase 4)
--
-- TaskFlow ya no tiene registro ni login: no existe el concepto de "dueno" de
-- una tarea. Esta migracion elimina la relacion con la tabla usuarios.
--
-- V1 no se modifica: Flyway guarda su checksum y editarla romperia el arranque
-- en las bases donde ya esta aplicada.
--
-- Orden importante (verificado en MySQL 8.0.45 y en H2 2.3.232 en modo MySQL):
--   1. La clave foranea se elimina antes de la columna.
--   2. En H2 los indices deben eliminarse antes que la columna que los compone.
--   3. Los DROP de columnas van en sentencias separadas: H2 no admite varios
--      DROP COLUMN en un mismo ALTER TABLE.
--
-- No hay perdida de datos: la tabla tareas estaba vacia y la tabla usuarios
-- nunca llego a usarse (no habia autenticacion).

ALTER TABLE tareas DROP FOREIGN KEY fk_tareas_usuario;

DROP INDEX idx_tareas_usuario_estado ON tareas;
DROP INDEX idx_tareas_usuario_fecha ON tareas;
DROP INDEX idx_tareas_usuario_prioridad ON tareas;

ALTER TABLE tareas DROP COLUMN usuario_id;

DROP TABLE usuarios;

-- Nuevos indices: ahora las consultas no filtran por usuario, sino por estado,
-- fecha limite y prioridad.
CREATE INDEX idx_tareas_estado ON tareas (estado);
CREATE INDEX idx_tareas_fecha ON tareas (fecha_limite);
CREATE INDEX idx_tareas_prioridad ON tareas (prioridad);
