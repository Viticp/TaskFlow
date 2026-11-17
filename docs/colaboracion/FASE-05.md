# Fase 5 — Frontend

**Fecha:** 2026-11-17
**Responsable:** OpenCode (sin revisión de Hermes; no tiene cuota disponible)
**Estado:** implementada y verificada, pendiente de aprobación de la persona

---

## 1. Objetivo

Construir la interfaz de TaskFlow con HTML, CSS y JavaScript vanilla: menú
lateral, dashboard con saludo personalizado, listado de tareas, filtros,
formularios y diseño responsive. Sin conexión a la API todavía (Fase 6).

## 2. Archivos

Creados:

| Archivo | Contenido | Tamaño |
|---|---|---|
| `src/main/resources/static/index.html` | Estructura completa (menú, vistas, diálogos, sprite SVG) | 23.782 B |
| `src/main/resources/static/css/estilos.css` | Tokens, layout, componentes, responsive | 24.614 B |
| `src/main/resources/static/js/app.js` | Navegación, menú, diálogos, filtros | 13.969 B |
| `src/main/resources/static/img/favicon.svg` | Icono de la pestaña | 305 B |

Modificados:

- `README.md`: estado, interfaz, capturas, estructura y tabla de fases.
- `docs/aprendizaje/01-arquitectura.md`: sección de frontend ajustada a la realidad.
- `docs/aprendizaje/06-frontend.md`: guía nueva.
- `docs/colaboracion/FASE-05.md`: este informe.

Eliminados: `css/.gitkeep`, `js/.gitkeep`, `img/.gitkeep` (ya hay archivos reales).

**No se ha tocado** el backend, el esquema, `pom.xml`, Flyway ni `/api/health`.

## 3. Decisiones técnicas

| Decisión | Motivo |
|---|---|
| Una sola página con vistas por hash (`#/dashboard`, `#/tareas`) | No hay que configurar rutas en el servidor y el botón "atrás" funciona |
| CSS con variables en `:root` | El modo oscuro de la Fase 7 solo redefine variables |
| Dos azules: `#4f6ef7` (marca) y `#3f5ce0` (fondo de botones) | El azul elegido no llega a 4.5:1 con texto blanco; el segundo sí, sin cambiar la identidad |
| `<dialog>` nativo + `showModal()` | Foco atrapado, `Escape` y fondo oscuro gratis, sin librerías |
| Filtros con `aria-pressed` | El estado seleccionado es visible y accesible |
| Un solo `app.js` en IIFE | Todo el código es de interfaz; se separará `api.js` en la Fase 6 |
| Iconos en sprite SVG embebido | Cero peticiones externas y cero dependencias |
| Tarjetas de ejemplo marcadas `TEMPORAL` | Permiten revisar el diseño sin simular datos reales |
| Guardar muestra un aviso honesto | No se finge persistencia antes de la Fase 6 |

## 4. Diseño aplicado

- Color principal `#4f6ef7`, fondos claros, tarjetas blancas y sombras mínimas.
- Menú lateral fijo de 264 px en escritorio; cajón deslizante en móvil.
- Saludo protagonista con `clamp()`; nombre "Victor".
- Tarjetas de tarea en 2 columnas a partir de 1200 px y 1 columna por debajo.
- Formularios en diálogo nativo, con el mismo formulario para crear y editar.
- Prioridad y estado con color **y texto**; las fechas vencidas se marcan en rojo.

## 5. Verificación real

### 5.1 Recursos servidos

| Recurso | Código | `Content-Type` | Tamaño |
|---|---|---|---|
| `/` | `200` | `text/html` | 23.782 B |
| `/index.html` | `200` | `text/html` | 23.782 B |
| `/css/estilos.css` | `200` | `text/css` | 24.614 B |
| `/js/app.js` | `200` | `text/javascript` | 13.969 B |
| `/img/favicon.svg` | `200` | `image/svg+xml` | 305 B |
| `/api/health` | `200` | `application/json` | 101 B |

### 5.2 Tests del backend

```text
Tests run: 34, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS
```

La Fase 5 no ha modificado ninguna clase Java ni ninguna prueba.

### 5.3 Comprobaciones en navegador real

Hechas con Chrome en modo headless mediante el protocolo DevTools (CDP). La
emulación de viewport permite un ancho real de 390 px; con `--window-size` el
navegador impone un mínimo de ventana y recorta la captura.

| Comprobación | Resultado |
|---|---|
| Desbordamiento horizontal a 1440 / 1024 / 768 / 390 px | 0 px en las cuatro |
| Columnas de tareas a 1440 px | 2 |
| Columnas de tareas a 1024 / 768 / 390 px | 1 |
| Columnas de estadísticas a 1024 px | 3 |
| Botón de menú visible a 390 px | Sí |
| Menú lateral oculto fuera de pantalla a 768 px | Sí |
| Diálogo de crear dentro del ancho a 390 px | Sí |
| Peticiones a `/api` desde el frontend | 0 |
| Errores en consola | Ninguno |

### 5.4 Comportamiento comprobado

| Prueba | Resultado real |
|---|---|
| Saludo | `¡Buenos días, Victor!` (según la hora del equipo) |
| Fecha | `Martes, 17 de noviembre de 2026` |
| Título del documento al cambiar de vista | `Mis tareas · TaskFlow` / `Dashboard · TaskFlow` |
| `aria-current="page"` | Solo en el enlace de la vista activa |
| Filtro `EN_PROCESO` | 1 tarjeta visible, contador `1 de 4 tareas` |
| Filtro `EN_PROCESO` + `ALTA` | 0 tarjetas y estado vacío visible |
| Reinicio de filtros | 4 tarjetas |
| Abrir "Nueva tarea" | Diálogo abierto y foco en el campo título |
| Enviar sin título | El navegador bloquea el envío; el diálogo sigue abierto |
| Enviar válido | Aviso: "…todavía no guarda: la conexión con la API se añade en la Fase 6" |
| Abrir editar | Título "Editar tarea" y campos precargados (título, prioridad, estado y fecha) |
| Abrir borrar | Texto con el nombre de la tarea y confirmación explícita |
| Confirmar borrado | Aviso de Fase 6; la tarjeta no desaparece (no se simula) |
| Menú móvil | Abre, `aria-expanded=true`, foco dentro y fondo visible |
| Cerrar con `Escape` | Menú cerrado y `aria-expanded=false` |
| Fechas vencidas | 1 tarjeta demo marcada en rojo (10 nov 2026) |

### 5.5 Capturas

Guardadas en `docs/capturas/`:

- `fase5-dashboard-1440.png`
- `fase5-tareas-1440.png`
- `fase5-dashboard-1024.png`
- `fase5-tareas-768.png`
- `fase5-dashboard-390.png`
- `fase5-tareas-390.png`
- `fase5-menu-movil-390.png`
- `fase5-dialogo-crear-1440.png`
- `fase5-dialogo-borrar-1440.png`
- `fase5-dialogo-crear-390.png`

Todas se revisaron una a una después de generarlas. A raíz de esa revisión se
corrigieron cuatro detalles: el marcador "—" de las estadísticas parecía una
barra de carga, las tarjetas de una misma fila tenían alturas distintas, el
indicador del menú activo quedaba pegado al borde de la pantalla y las
estadísticas ocupaban demasiado alto en móvil (ahora son tarjetas compactas en
horizontal).

### 5.6 Accesibilidad comprobada en el código y en el DOM

- Enlace "Saltar al contenido" como primer elemento del `body`.
- Un `h1` por vista; el foco se mueve al `h1` al navegar.
- `label` en los cinco campos del formulario.
- Botones reales con `aria-label` en las acciones de icono.
- `aria-pressed` en los chips y `aria-live="polite"` en el contador.
- `aria-expanded` + `aria-controls` en el botón del menú móvil.
- `:focus-visible` con anillo propio.
- Contraste ≥ 4.5:1 en textos y controles principales (el azul de fondo se
  oscureció a `#3f5ce0` para cumplirlo con texto blanco).
- `prefers-reduced-motion` desactiva animaciones.

## 6. Limitaciones conocidas

- Las tareas y las cifras son de ejemplo, marcadas `TEMPORAL` en el HTML.
- El formulario y el borrado no guardan: avisan de que se activan en la Fase 6.
- No hay buscador, paginación ni ordenación manual.
- Si JavaScript está desactivado, las vistas y los diálogos no funcionan.
- La vista de dashboard se ve por defecto; solo hay dos vistas.

## 7. Comprobaciones de seguridad

- `scripts/check-no-secrets.ps1` → sin coincidencias.
- Sin dependencias nuevas en `pom.xml`.
- Sin URLs externas en HTML/CSS, sin fuentes descargadas.
- Sin `fetch` ni `XMLHttpRequest` en `app.js`.
- El proyecto sigue siendo local: la interfaz no debe exponerse en internet.

## 8. Estado

- [x] Estructura HTML
- [x] Diseño y sistema de variables
- [x] Menú lateral y cajón móvil
- [x] Dashboard con saludo personalizado
- [x] Vista Mis tareas
- [x] Formularios de crear y editar en diálogos
- [x] Filtros por estado y prioridad
- [x] Responsive comprobado a 1440, 1024, 768 y 390 px
- [x] Capturas reales revisadas
- [x] Backend intacto (34 tests)
- [ ] Aprobación de la persona

**No se ha iniciado la Fase 6.**
