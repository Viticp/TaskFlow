# Fase 6 — Integración con la API

**Fecha:** 2026-11-17
**Responsable:** OpenCode (sin Hermes)
**Estado:** implementada y verificada contra MySQL, pendiente de aprobación

---

## 1. Objetivo

Sustituir los datos de ejemplo de la Fase 5 por datos reales de MySQL y conectar
toda la interfaz con la API REST existente:

- Crear, leer, actualizar y eliminar tareas desde la interfaz.
- Dashboard y estadísticas con datos reales.
- Estados de carga, error y vacío correctos.
- Mantener el diseño visual aprobado y la aplicación sin login ni registro.
- Sin cambios de backend, esquema, dependencias ni `V1__init.sql`.

## 2. Archivos

| Archivo | Cambio | Tamaño |
|---|---|---|
| `src/main/resources/static/index.html` | Datos de ejemplo eliminados; plantillas, estados y avisos añadidos | 18.168 B |
| `src/main/resources/static/css/estilos.css` | Carga, error, avisos, vacío compacto y foco de tarjeta | 28.676 B |
| `src/main/resources/static/js/api.js` | **Nuevo**: capa HTTP | 3.208 B |
| `src/main/resources/static/js/app.js` | **Reescrito**: estado, render, CRUD, filtros y accesibilidad | 31.192 B |
| `src/main/resources/static/img/favicon.svg` | Sin cambios | 305 B |

Documentación:

- `docs/aprendizaje/07-integracion-api.md` (nueva).
- `docs/aprendizaje/06-frontend.md` (actualizada a la realidad).
- `docs/aprendizaje/01-arquitectura.md` (frontend actualizado).
- `README.md` (estado, capturas, estructura y fases).
- `docs/colaboracion/FASE-06.md` (este informe).

**No se ha tocado** ningún archivo Java, `pom.xml`, `V1__init.sql`, `V2`, la base
de datos ni la configuración de seguridad. No hay dependencias nuevas.

## 3. Decisiones aplicadas

Las cuatro decisiones aprobadas:

1. **Filtros en memoria** sobre una única carga de `GET /api/tareas`. Los filtros
   de la API se verificaron aparte con peticiones reales.
2. **Tres contadores reales** en el dashboard (pequeño avance de la Fase 7); los
   gráficos y el tema oscuro quedan para la Fase 7.
3. **Avisos accesibles** (`role="status"` / `role="alert"`) al crear, actualizar
   y eliminar.
4. **Separación `api.js` / `app.js`** con módulos ES.

Otras decisiones de implementación:

| Decisión | Motivo |
|---|---|
| Clonar `<template>` y rellenar con `textContent` | Evita XSS y mantiene el HTML lejos del código |
| Recargar la lista tras cada mutación | El servidor es la fuente de verdad; evita datos locales obsoletos |
| Reiniciar filtros al crear | La tarea nueva siempre queda visible |
| Parsear fechas como locales (`new Date(a, m-1, d)`) | Evita el error de un día por UTC |
| Deshabilitar botones y mostrar "Guardando…"/"Eliminando…" | Evita dobles envíos y da feedback |
| Bloquear el cierre del diálogo mientras se guarda | No se pierde el contexto si la petición tarda |
| `AbortSignal.timeout(10000)` y `cache: 'no-store'` | Evita esperas infinitas y respuestas cacheadas |
| Tratar `404` cerrando el diálogo y recargando | La tarea ya no existe; la lista debe reflejarlo |

## 4. Flujo implementado

- **Carga inicial:** panel de carga → `GET /api/tareas` → render del dashboard y
  de la lista.
- **Crear:** `POST` → cierre del diálogo → aviso → GET de recarga → foco en la
  tarjeta nueva.
- **Editar:** `PUT` → cierre → aviso → GET → foco en la tarjeta actualizada.
- **Eliminar:** confirmación → `DELETE` → cierre → aviso → GET → foco en la
  primera tarjeta restante.
- **Error de red/timeout:** panel de error con mensaje y Reintentar; las
  estadísticas muestran "–" y "No disponible", nunca cifras inventadas.
- **404:** cierre del diálogo, aviso de error y recarga de la lista real.
- **Filtros:** estado y prioridad en memoria; contador `visibles de total` y
  estado vacío específico con "Quitar filtros".

## 5. Verificación real

### 5.1 Backend

```text
Tests run: 34, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

No se modificó ninguna clase Java ni ninguna prueba.

### 5.2 API contra MySQL

Peticiones reales a `http://localhost:8080/api/tareas`. Todas las comprobaciones
pasaron:

| Comprobación | Resultado |
|---|---|
| `GET` inicial | `200`, 0 filas |
| Tres `POST` (PENDIENTE, EN_PROCESO, COMPLETADA) | `201` cada uno |
| `GET` general | `200`, 3 filas |
| `GET ?estado=PENDIENTE` | 1 fila correcta |
| `GET ?prioridad=MEDIA` | 1 fila correcta |
| `GET ?estado=EN_PROCESO&prioridad=ALTA` | 0 filas |
| `PUT` (título, estado y fecha nula) | `200`; cambios persistidos |
| `GET` por id | `200`; devuelve la versión actualizada |
| `POST` sin título | `400` + `campos.titulo` |
| `POST` con estado inválido | `400` |
| `GET` de id inexistente | `404` |
| `DELETE` | `204` |
| Lista tras borrar | 2 filas |
| Borrar las restantes | `204`, `204` |
| Estado final | 0 filas |

### 5.3 MySQL directo (JDBC)

Comprobado con un verificador JDBC temporal que lee la contraseña del entorno y
**no la imprime**:

```text
FILAS_TAREAS=0
MIGRACIONES:
  v1 init success=true
  v2 single user success=true
TAREAS:
```

Flyway sigue en la versión 2. No se recreó la base de datos ni se aplicó ninguna
migración nueva.

### 5.4 Navegador real (Chrome + CDP)

Verificación E2E con Chrome headless, viewport emulado de verdad y MySQL real.
Todas las comprobaciones pasaron:

| Comprobación | Resultado |
|---|---|
| Estado inicial sin tareas | Contador `0 tareas`; vacío "Aún no tienes tareas"; dashboard "Todavía no hay tareas" |
| Datos de ejemplo en el DOM | 0 |
| Texto `TEMPORAL` | 0 |
| Crear 3 tareas desde la interfaz | 3 tarjetas y 3 filas reales en MySQL |
| Aviso tras crear | "Tarea creada." con `role="status"` |
| Foco tras crear | En la tarjeta nueva |
| Fecha vencida | Marcada en rojo (`10 nov 2026`) |
| Estadísticas reales | `1 / 1 / 1` |
| Próximas tareas | 2 filas, ordenadas por fecha, sin la completada |
| Filtro `PENDIENTE` | 1 tarjeta; `1 de 3 tareas` |
| Filtro `PENDIENTE` + `ALTA` | 1 tarjeta |
| Filtro sin coincidencias | 0 tarjetas; "No hay tareas con estos filtros"; "Quitar filtros" |
| Quitar filtros | Vuelven las 3 tarjetas y los chips a "Todas" |
| Editar | Campos precargados; cambio persistido en MySQL (`COMPLETADA` / `ALTA`) |
| Estadísticas tras editar | `1 / 0 / 2` |
| Recarga completa | Mantiene 3 tareas y el título editado |
| Eliminar | Aviso "Tarea eliminada."; 2 filas en MySQL; foco correcto |
| 404 al editar | Diálogo cerrado, aviso de error y lista recargada a 1 tarea |
| 404 al eliminar | Diálogo cerrado, aviso `role="alert"` y lista vacía |
| Red bloqueada | Panel de error real, estadísticas "–" y "No disponible" |
| Reintentar | Recupera los datos al desbloquear la red |
| Carga lenta (2,2 s) | Panel "Cargando tus tareas…" visible antes de los datos |
| Desbordamiento horizontal a 1440 / 1024 / 768 / 390 | 0 px en todas |
| Columnas de tareas a 1440 / 1024 / 768 / 390 | 2 / 1 / 1 / 1 |
| Columnas de estadísticas a 1024 | 3 |
| Menú móvil | Abre, foco dentro, `aria-expanded=true`, cierra con `Escape` |
| Diálogo a 390 px | Dentro del ancho |
| Etiquetas del formulario | 5 `label[for]` |
| Botones de acción | `aria-label` con el título de la tarea |
| Chips | 8 con `aria-pressed` |
| Contador | `aria-live="polite"` |
| Avisos | `role="status"` o `role="alert"` |
| Errores de consola no esperados | 0 |
| Peticiones a `/api/tareas` | 30 |
| Peticiones externas | 0 |

Los únicos errores de consola fueron los `404` provocados a propósito en las
pruebas y el bloqueo de red simulado; ninguno procede de un fallo de la
aplicación.

### 5.5 Recursos servidos

| Recurso | Código | `Content-Type` | Tamaño |
|---|---|---|---|
| `/` | `200` | `text/html` | 18.168 B |
| `/css/estilos.css` | `200` | `text/css` | 28.676 B |
| `/js/app.js` | `200` | `text/javascript` | 31.192 B |
| `/js/api.js` | `200` | `text/javascript` | 3.208 B |
| `/img/favicon.svg` | `200` | `image/svg+xml` | 305 B |
| `/api/health` | `200` | `application/json` | DB `UP` |

Los archivos de `target/classes/static` son idénticos (SHA-256) a los de
`src/main/resources/static`.

### 5.6 Capturas revisadas

En `docs/capturas/`:

- `fase6-dashboard-1440.png`
- `fase6-tareas-1440.png`
- `fase6-dashboard-1024.png`
- `fase6-tareas-768.png`
- `fase6-dashboard-390.png`
- `fase6-tareas-390.png`
- `fase6-menu-390.png`
- `fase6-dialogo-crear-1440.png`
- `fase6-dialogo-borrar-1440.png`
- `fase6-dialogo-crear-390.png`
- `fase6-toast-1440.png`
- `fase6-filtros-vacio-1440.png`
- `fase6-vacio-1440.png`
- `fase6-error-1440.png`
- `fase6-carga-1440.png`

Se revisaron una a una. Las que mostraban diálogos se repitieron después de la
animación de apertura: la primera versión los capturaba semitransparentes.

## 6. Limpieza

- Las tareas de prueba se eliminaron con `DELETE` real.
- Comprobación final en MySQL: `FILAS_TAREAS=0`.
- La interfaz se recargó y mostró su estado vacío real.
- No quedan datos ficticios, temporales ni de ejemplo.
- Flyway: `v1 init` y `v2 single user`, ambas correctas.

## 7. Seguridad y alcance

- `scripts/check-no-secrets.ps1` → sin coincidencias.
- Ninguna contraseña en archivos, capturas, logs ni en este informe.
- Sin dependencias nuevas; sin CDN, fuentes ni peticiones externas.
- Sin `innerHTML` con datos de la API.
- La aplicación sigue sin login, sin registro y sin autenticación.
- Sigue siendo local: no debe exponerse a internet.

## 8. Limitaciones conocidas

- Sin paginación ni buscador: se cargan todas las tareas.
- Sin deshacer tras eliminar (hay confirmación).
- Los contadores se calculan en el navegador a partir de la lista completa.
- El tema oscuro, los gráficos y el resto del dashboard llegan en la Fase 7.
- Si JavaScript está desactivado, no hay datos ni diálogos.

## 9. Checklist

- [x] CRUD real contra MySQL desde la interfaz
- [x] Sin datos de ejemplo ni temporales
- [x] Dashboard y estadísticas con datos reales
- [x] Carga, error, vacío y reintento
- [x] Filtros en memoria y vacío específico
- [x] Recarga persistente y 404 controlados
- [x] Diseño de la Fase 5 conservado
- [x] Responsive 1440 / 1024 / 768 / 390 sin desbordamiento
- [x] Accesibilidad: foco, avisos, etiquetas y `aria-*`
- [x] 34 tests del backend
- [x] MySQL limpio (`FILAS_TAREAS=0`) y Flyway v2
- [x] Sin secretos ni dependencias nuevas
- [ ] Aprobación de la persona

**No se ha iniciado la Fase 7.**
