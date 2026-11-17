# Frontend

Esta guía explica cómo está construida la interfaz de TaskFlow. El diseño y la
estructura nacieron en la Fase 5; desde la Fase 6 la interfaz **lee y escribe
datos reales** en MySQL a través de `/api/tareas`. La Fase 7 amplía el dashboard
con analíticas calculadas en el navegador y añade el **tema claro/oscuro**.

## 1. Archivos

```text
src/main/resources/static/
├─ index.html          Estructura, plantillas y estados iniciales
├─ css/estilos.css     Sistema de diseño, componentes y responsive
├─ js/
│  ├─ api.js           Peticiones HTTP y errores de la API
│  ├─ app.js           Estado, render, analíticas, filtros, diálogos y foco
│  └─ tema.js          Interruptor y persistencia del tema claro/oscuro
└─ img/favicon.svg     Icono de la pestaña
```

No hay frameworks, ni fuentes descargadas, ni peticiones a servicios externos.
Spring Boot sirve estos archivos en la raíz: `http://localhost:8080/`.

El HTML carga el CSS en el `<head>`, un pequeño script inline para aplicar el tema
antes del primer pintado y dos módulos:

```html
<script>
    // Lee localStorage y prefers-color-scheme antes de pintar.
</script>
<script type="module" src="/js/tema.js"></script>
<script type="module" src="/js/app.js"></script>
```

El script inline evita el destello blanco al abrir en modo oscuro. Los módulos se
ejecutan cuando el documento ya está parseado, sin bloquear el render. `app.js`
importa `api.js`; `tema.js` es independiente. No hay variables globales.

## 2. Estructura de la página

```text
body
├─ a.saltar-contenido           Enlace para saltar al contenido (solo con teclado)
├─ svg.sprite                   Iconos SVG reutilizables (<symbol>)
├─ div.fondo-menu               Fondo oscuro del menú móvil
├─ aside.menu-lateral           Marca + Dashboard + Mis tareas
├─ main.principal
│  ├─ header.barra-superior     Fecha, botón de menú, tema y usuario
│  └─ div.contenido
│     ├─ section#vista-dashboard
│     └─ section#vista-tareas
├─ div#zona-avisos              Avisos (toasts) accesibles
├─ dialog#dialogo-tarea         Formulario de crear/editar
├─ dialog#dialogo-borrar        Confirmación de borrado
└─ template#plantilla-tarea     Modelo de tarjeta
└─ template#plantilla-proxima   Modelo de fila del dashboard
```

Solo hay **una página HTML**. Las dos vistas son secciones que se muestran u
ocultan. Ventajas para un proyecto así: no se recarga la página al navegar y no
hay que duplicar cabecera, menú ni estilos.

Las plantillas permiten crear tarjetas repetidas sin escribir HTML dentro de
JavaScript. El contenido se rellena con `textContent`, nunca con `innerHTML`.

## 3. Sistema de diseño

### Colores

Todos los colores están en variables CSS dentro de `:root`:

```css
:root {
    --fondo: #f5f6fa;
    --superficie: #ffffff;
    --texto: #171b26;
    --primario: #4f6ef7;
    --primario-fuerte: #3f5ce0;
    --alta: #c9353b;
    ...
}
```

Se usan dos azules por un motivo de accesibilidad: `#4f6ef7` es el color de marca
(iconos, focos, detalles) y `#3f5ce0` es el que se usa como fondo de botones y
chips con texto blanco. El primero no llega a 4.5:1 de contraste con blanco; el
segundo sí. Así el diseño mantiene el azul elegido sin sacrificar legibilidad.

### Tema claro y oscuro

Los componentes no escriben colores literales: usan variables. El tema oscuro se
consigue redefiniendo el mismo conjunto en `:root[data-theme="oscuro"]`, sin
duplicar reglas de componentes. También cambian las sombras, el fondo translúcido
de la barra superior y `color-scheme`, para que los controles nativos del navegador
(por ejemplo, el selector de fecha) se pinten en oscuro.

- **Dos estados:** claro y oscuro. El interruptor de la cabecera es un
  `button role="switch"` con `aria-checked`, iconos de sol y luna y el texto
  `Claro` / `Oscuro`.
- **Primera visita:** se usa `prefers-color-scheme`. Si el sistema cambia mientras
  no hay preferencia guardada, la página lo sigue en vivo.
- **Preferencia guardada:** la última elección se guarda en `localStorage` con la
  clave `taskflow-tema` y gana al sistema en las siguientes visitas.
- **Sin destello:** un script inline en el `<head>` aplica `data-theme="oscuro"`
  antes del primer pintado.
- **Sincronización:** el evento `storage` mantiene varias pestañas con el mismo
  tema.
- **Transición:** al cambiar se añade la clase temporal `tema-cambiando` (unos
  260 ms) que anima colores, bordes y sombras. Con
  `prefers-reduced-motion: reduce` no se añade y el cambio es instantáneo.
- **Color de la barra del navegador:** se actualiza `meta[name="theme-color"]`.

Los contrastes de texto y controles se comprobaron en ambos temas con un mínimo
de 4.5:1 (WCAG AA).

### Tipografía y espaciado

- Pila de fuentes del sistema (`system-ui`, `Segoe UI`…): carga instantánea y
  aspecto nativo en Windows, macOS y Android.
- El saludo usa `clamp(1.75rem, 3.6vw, 2.55rem)`: crece con la pantalla hasta un
  máximo, sin necesidad de media queries.
- Los espacios siguen una escala de 4 px (8, 12, 16, 20, 24…).
- Los números de fechas y estadísticas usan `font-variant-numeric: tabular-nums`
  para que no "bailen" al cambiar.

### Superficies

- Fondo general gris muy claro; tarjetas blancas con borde suave y sombra mínima.
- Radio grande en las tarjetas (18 px) y pequeño en los controles (10 px).
- El azul se reserva para lo accionable y lo seleccionado: si todo destaca, nada
  destaca.

## 4. Layout responsive

| Ancho | Menú | Estadísticas | Analíticas | Tareas |
|---|---|---|---|---|
| ≥ 1200 px | Fijo a la izquierda | 3 columnas | 2 columnas | 2 columnas |
| 900–1199 px | Fijo a la izquierda | 3 columnas | 2 columnas | 1 columna |
| 781–899 px | Cajón con fondo oscuro | 3 columnas | 2 columnas | 1 columna |
| 641–780 px | Cajón con fondo oscuro | 3 columnas | 1 columna | 1 columna |
| ≤ 640 px | Cajón con fondo oscuro | 1 columna | 1 columna | 1 columna |

El contenido tiene un ancho máximo de 1240 px y se centra en pantallas grandes.
La barra superior usa `position: sticky`: al hacer scroll se queda arriba con un
fondo semitransparente y desenfoque.

En móvil, el menú lateral se saca de la pantalla con
`transform: translateX(-100%)`. Al abrirlo se añade la clase `menu-abierto` al
`body`, que devuelve el menú a su sitio y bloquea el scroll de la página. Se
cierra al pulsar el fondo, al elegir una vista o con `Escape`.

## 5. Navegación con hash

Las vistas se identifican con la URL:

- `#/dashboard`
- `#/tareas`

`app.js` lee `location.hash`, muestra la sección correspondiente, marca el enlace
con `aria-current="page"` y actualiza el título del documento. Al cambiar de
vista, el foco se mueve al `h1` de la sección (`tabindex="-1"`), para que un
usuario de lector de pantalla sepa dónde está.

Se usa el hash —y no la History API— porque no requiere configurar el servidor:
cualquier URL con hash sirve el mismo `index.html`. Es la opción más simple para
una aplicación de una sola página sin router.

Si la URL no tiene un hash válido, se normaliza a `#/dashboard` con
`history.replaceState`, sin recargar.

## 6. JavaScript

Hay tres módulos con responsabilidades separadas:

| Archivo | Responsabilidad | No hace |
|---|---|---|
| `api.js` | `fetch`, timeout, parseo JSON y `ErrorApi` | No toca el DOM |
| `app.js` | Estado, render, analíticas, filtros, diálogos, foco y avisos | No construye peticiones HTTP |
| `tema.js` | Interruptor, persistencia y sincronización del tema | No conoce tareas ni la API |

`app.js` se organiza en bloques comentados:

1. Referencias del documento.
2. Estado de la aplicación.
3. Fecha y saludo.
4. Navegación y menú móvil.
5. Avisos.
6. Carga, error y estadísticas.
7. Analíticas del dashboard.
8. Render del dashboard y de la lista.
9. Carga de datos y filtros.
10. Diálogos y CRUD.
11. Reintentos y arranque.

**El saludo** no está fijo: el HTML trae "¡Buenos días, Victor!" para que se vea
algo incluso sin JavaScript, y el script lo ajusta a "Buenas tardes" o "Buenas
noches" según la hora. El nombre está en una constante (`NOMBRE`).

## 7. Datos reales y render

Al arrancar, `app.js` llama a `listarTareas()` y guarda el array en `tareas`.
Después:

- Calcula los contadores de pendientes, en proceso y completadas.
- Calcula las analíticas del dashboard sobre esa misma lista.
- Pinta hasta 5 tareas no completadas ordenadas por fecha límite (las que no
  tienen fecha van al final).
- Pinta la rejilla completa de "Mis tareas".

### Analíticas del dashboard

No hay endpoint de estadísticas: todo se calcula en el cliente con la lista ya
cargada, así que sigue habiendo **una sola petición `GET /api/tareas`** por carga.

| Bloque | Qué muestra | Qué tareas cuenta |
|---|---|---|
| Progreso general | Porcentaje, completadas de total y pendientes | Todas |
| Vencidas | Fecha límite anterior a hoy | Sin completar |
| Para hoy | Fecha límite igual a hoy | Sin completar |
| Próximos 7 días | De mañana a hoy + 7 | Sin completar |
| Sin fecha | Sin fecha límite | Sin completar |
| Prioridad | Cantidad y porcentaje por prioridad | Todas |
| Estado | Cantidad, porcentaje y barra apilada por estado | Todas |
| Carga semanal | 7 columnas, de mañana a hoy + 7 | Sin completar con fecha |
| Próximas tareas | Hasta 5 tareas ordenadas por fecha | Sin completar |

Las fechas se comparan como locales a medianoche, sin pasar por UTC. Los cálculos
se repiten después de cada alta, edición o borrado porque la lista se vuelve a leer
del servidor. Mientras carga se muestran guiones y, si falla la petición, "No
disponible"; nunca cifras inventadas.

Cada tarjeta se clona desde `#plantilla-tarea` y se rellena con `textContent`.
Las clases de prioridad y estado salen de mapas controlados, no del texto que
llega de la API. Si una tarea contiene algo parecido a HTML, se muestra como
texto: no se ejecuta.

Las fechas se parsean como locales (`new Date(anio, mes - 1, dia)`) para evitar
el clásico error de un día por UTC. Las fechas vencidas se marcan en rojo y con
`title="Fecha límite superada"`.

## 8. Diálogos y operaciones reales

Los formularios usan `<dialog>` y `showModal()`:

- El navegador **atrapa el foco** dentro del diálogo mientras está abierto.
- `Escape` lo cierra sin escribir código.
- `::backdrop` permite oscurecer el fondo.
- Un clic en el fondo (fuera del contenido) también lo cierra.

El mismo formulario sirve para crear y editar. Al abrirlo desde "Nueva tarea" se
limpia; al abrirlo desde el lápiz de una tarjeta se rellenan los campos con los
datos reales de esa tarea y el título cambia a "Editar tarea".

La validación usa la del navegador (`required`, `maxlength`) más `:user-invalid`
para pintar en rojo solo cuando el usuario ya ha interactuado. Los límites (`120`
y `2000`) coinciden con los del backend. Si el backend rechaza algo, se muestra
su mensaje y, si indica campos concretos, el foco va al primero.

Al guardar:

- El botón se deshabilita y muestra "Guardando…".
- No se puede cerrar el diálogo mientras la petición está en curso.
- Si todo va bien, se cierra, se muestra un aviso y se recarga la lista.
- Si falla, el diálogo sigue abierto con el error real.
- Un `404` cierra el diálogo, avisa y recarga porque la tarea ya no existe.

Al eliminar se pide confirmación con el título de la tarea. El botón cambia a
"Eliminando…" y se aplica el mismo tratamiento de errores.

**No se modifica el array local a mano**: después de cada operación se vuelve a
leer del servidor. Así la pantalla y MySQL no se desincronizan.

## 9. Filtros

Los filtros son dos grupos de botones con `aria-pressed`:

```html
<button class="chip" data-filtro-estado="PENDIENTE" aria-pressed="false">
    Pendiente
</button>
```

`app.js` guarda el estado y la prioridad en dos variables y filtra el array ya
cargado. No se hace una petición por cada clic:

- Cambiar de filtro es instantáneo.
- El contador puede mostrar `1 de 3 tareas`.
- Al crear una tarea se reinician los filtros para que la nueva se vea.

El contador tiene `aria-live="polite"`, así que los lectores de pantalla anuncian
el cambio. Si no queda ninguna tarea visible, aparece un estado vacío distinto
del de "no hay tareas": explica que los filtros no coinciden y ofrece "Quitar
filtros".

La API también permite filtrar (`GET /api/tareas?estado=...&prioridad=...`), pero
para el volumen de una aplicación personal es más simple cargar una vez y
filtrar en memoria. Los filtros del backend se verificaron por separado.

## 10. Carga, errores y avisos

- **Cargando:** panel con spinner y "Cargando tus tareas…".
- **Error:** panel con el mensaje real y botón Reintentar. Las estadísticas
  muestran "–" y "No disponible", nunca cifras inventadas.
- **Sin datos:** estado vacío con una acción para crear la primera tarea.
- **Avisos:** toasts con `role="status"` o `role="alert"`, cierre manual y
  desaparición automática.

Los fallos de red y los timeouts (10 s) tienen mensajes específicos. Un error
interno del servidor se muestra con un texto genérico, sin trazas.

## 11. Accesibilidad

- **HTML semántico**: `header`, `nav`, `main`, `section`, `article`, `footer`.
- **Un solo `h1` por vista** y jerarquía de encabezados correcta.
- **Enlace "Saltar al contenido"** como primera parada del tabulador.
- **Foco visible** con `:focus-visible` y un anillo propio.
- **Foco gestionado** al abrir diálogos, al crear, al eliminar y al cambiar de
  vista.
- **Botones reales** para las acciones (nunca un `div` con `onclick`).
- **Etiquetas `label`** asociadas a todos los campos.
- **El color no es el único indicador**: prioridad y estado llevan texto; las
  fechas vencidas cambian de color y llevan `title`.
- **Avisos accesibles** con `role="status"` / `role="alert"`.
- **Interruptor de tema** con `role="switch"`, `aria-checked` y nombre accesible;
  los iconos no son el único indicador porque también hay texto.
- **Contraste** ≥ 4.5:1 en textos y controles principales, comprobado en tema
  claro y oscuro.
- **`prefers-reduced-motion`**: desactiva animaciones y transiciones, incluido el
  cambio de tema.
- **`aria-expanded`** en el botón del menú y `aria-controls` apuntando al panel.
- **Gráficos** con texto alternativo: cada columna de carga semanal lleva su
  cantidad y una etiqueta para lectores de pantalla.

## 12. Rendimiento

- Sin frameworks: HTML, CSS, JS y el icono suman unos 114 KB sin comprimir.
- Sin fuentes ni imágenes externas: cero peticiones a terceros.
- Iconos en un sprite SVG embebido: se reutilizan sin descargas adicionales.
- Animaciones de `opacity`, `transform` y colores; los gráficos solo animan
  `width`/`height` al pintar los datos.
- Una sola petición `GET` por carga; filtros y analíticas no generan tráfico.
- El tema se aplica antes del primer pintado y no requiere otra petición.

## 13. Qué queda para las siguientes fases

| Fase | Qué añade al frontend |
|---|---|
| 7. Dashboard y modo oscuro | Analíticas de progreso, vencimientos, distribuciones y carga semanal; tema claro/oscuro persistido |
| 8. Pruebas | Repaso de flujos, responsive, accesibilidad y rendimiento |
| 9. Documentación | Capturas definitivas y README de portfolio |

## 14. Limitaciones conocidas

- No hay paginación ni buscador.
- No hay deshacer tras eliminar (sí confirmación).
- Contadores y analíticas se calculan en el navegador con la lista completa; con
  miles de tareas convendría un endpoint agregado en el servidor.
- La preferencia de tema es local al navegador: no viaja entre equipos.
- Si JavaScript está desactivado, no se cargan datos ni funcionan menú y
  diálogos. Es aceptable en una aplicación local que depende de JS para hablar
  con la API.
- Sigue sin haber login ni registro: es una aplicación de un solo usuario.
