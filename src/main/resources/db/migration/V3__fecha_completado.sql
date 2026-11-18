-- VPlan - Fecha real de finalizacion de una tarea
--
-- Hasta ahora una tarea solo guardaba creado_en y actualizado_en. Para el
-- grafico de tareas completadas de los ultimos siete dias hace falta saber
-- cuando se completo, no cuando se edito por ultima vez.
--
-- La columna es NULL a proposito:
--   - las tareas antiguas ya completadas no tienen una fecha fiable y no se
--     inventa ninguna;
--   - una tarea pendiente o en proceso tampoco tiene fecha de finalizacion.
--
-- La aplicacion la rellena al pasar a COMPLETADA y la limpia si la tarea se
-- reabre. No se toca V1 ni V2: Flyway guarda su checksum.

ALTER TABLE tareas ADD COLUMN completado_en TIMESTAMP NULL;
