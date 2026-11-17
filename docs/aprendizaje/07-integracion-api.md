# Integración con la API

Esta guía explica cómo la interfaz de la Fase 6 dejó de usar datos de ejemplo y
pasó a leer y escribir en MySQL a través de `/api/tareas`. Está pensada para
repasar el flujo completo: navegador → `fetch` → Spring Boot → MySQL.

## 1. Qué cambió respecto a la Fase 5

La Fase 5 construyó el diseño y el comportamiento visual con tarjetas de ejemplo.
La Fase 6 elimina esos datos y conecta la interfaz con la API real:

- No queda ningún `data-demo` ni texto de ejemplo en el HTML.
- Las tarjetas se crean desde datos que devuelve el servidor.
- Crear, editar y eliminar hacen peticiones reales y recargan la lista.
- El dashboard calcula sus tres contadores con las tareas reales.
- Hay estados de carga, error y vacío; ya no se finge nada.

## 2. Archivos y responsabilidades

```text
static/
├─ index.html        Estructura, plantillas y estados iniciales
├─ css/estilos.css   Diseño aprobado + estilos de carga, error y avisos
└─ js/
   ├─ api.js         Solo HTTP: fetch, timeout y errores de la API
   └─ app.js         Solo interfaz: estado, render, filtros, diálogos y foco
```

El HTML carga `app.js` como módulo:

```html
<script type="module" src="/js/app.js"></script>
```

`app.js` importa las funciones de `api.js`:

```js
import {
    ErrorApi,
    actualizarTarea,
    crearTarea,
    eliminarTarea,
    listarTareas
} from './api.js';
```

**Por qué separar**: `api.js` se puede probar o cambiar sin tocar el DOM, y
`app.js` no necesita saber cómo se construye una petición HTTP ni cómo se
parsea un error. Es la división que aporta valor de verdad en este tamaño de
proyecto.

## 3. Flujo de una operación

### Leer

1. `app.js` llama a `listarTareas()`.
2. `api.js` hace `GET /api/tareas` con `cache: 'no-store'` y un timeout de 10 s.
3. Spring Boot devuelve un array JSON; MySQL es la fuente de datos.
4. `app.js` guarda el array en `tareas` y pinta dashboard y lista.

Solo se hace **un GET** por carga. Los filtros se aplican en memoria sobre ese
array (ver sección 5).

### Crear o editar

1. El formulario del `<dialog>` recoge los valores.
2. `crearTarea(datos)` hace `POST`; `actualizarTarea(id, datos)` hace `PUT`.
3. Si la respuesta es correcta, se cierra el diálogo, se muestra un aviso y se
   **recarga la lista desde el servidor**.
4. Si falla, el diálogo sigue abierto y se muestra el mensaje real del backend.

### Eliminar

1. El diálogo de confirmación guarda la tarea elegida.
2. `eliminarTarea(id)` hace `DELETE`.
3. Si responde `204`, se cierra el diálogo, se avisa y se recarga la lista.

**Por qué recargar en vez de modificar el array local**: el servidor es la
verdad. Al recargar se comprueban de paso el estado, las fechas y los datos
normalizados (`trim`, descripción vacía a `null`). Para una app personal y unas
pocas tareas, el coste es mínimo y evita que la pantalla y MySQL se desincronicen.

## 4. Errores: un único contrato

`api.js` convierte cualquier fallo en un `ErrorApi` con:

- `message`: texto listo para mostrar.
- `estado`: código HTTP (por ejemplo `404`).
- `campos`: mapa campo → mensaje si falló la validación.
- `esRed` / `esTiempo`: para distinguir una caída de conexión de un timeout.

El backend siempre responde con el mismo formato (`ErrorResponse`):

```json
{
  "status": 400,
  "mensaje": "La peticion no es valida",
  "campos": { "titulo": "El titulo es obligatorio" }
}
```

La interfaz muestra `mensaje` y, si existe, añade los mensajes de `campos`.
Nunca se interpreta HTML de la respuesta: todo se inserta con `textContent`.

Casos tratados:

| Caso | Comportamiento |
|---|---|
| Red caída | Panel de error con "No se pudo conectar…" y botón Reintentar |
| Timeout (> 10 s) | Mensaje específico; el servidor puede seguir ocupado |
| `400` de validación | Aviso dentro del diálogo y foco en el primer campo con error |
| `404` al editar/borrar | Se cierra el diálogo, aviso de error y recarga de la lista |
| Error inesperado | Mensaje genérico; no se muestran trazas internas |

## 5. Filtros en memoria

Al cargar se guardan **todas** las tareas en `tareas`. Los chips de estado y
prioridad solo cambian dos variables:

```js
let filtroEstado = '';
let filtroPrioridad = '';
```

`renderizarTareas()` filtra ese array y vuelve a pintar la rejilla. Ventajas:

- Cambiar de filtro es instantáneo y no genera peticiones.
- El contador puede decir `1 de 3 tareas` porque conoce el total.
- Al crear una tarea se reinician los filtros para que la nueva sea visible.

La API también admite filtros (`GET /api/tareas?estado=...&prioridad=...`). Se
verificaron aparte con peticiones reales; la interfaz no los usa porque, con el
volumen de una app personal, cargar todo una vez es más simple y coherente.

## 6. Render seguro con plantillas

El HTML incluye dos `<template>`:

- `#plantilla-tarea`: tarjeta completa de "Mis tareas".
- `#plantilla-proxima`: fila compacta del dashboard.

Por cada tarea se clona la plantilla y se rellenan los huecos con `textContent`:

```js
const tarjeta = plantillaTarea.content.firstElementChild.cloneNode(true);
tarjeta.querySelector('.tarea-titulo').textContent = tarea.titulo;
```

**No se usa `innerHTML` con datos de la API.** Si una tarea se llamara
`<img src=x onerror=...>`, se vería como texto y no se ejecutaría. Es la defensa
más simple y efectiva contra XSS en una interfaz que muestra texto del usuario.

Las clases de prioridad y estado se eligen desde mapas controlados
(`CLASES_PRIORIDAD`, `CLASES_ESTADO`), no concatenando el valor recibido.

## 7. Fechas sin errores de zona horaria

`fechaLimite` llega como `"2026-11-20"` (un día, no una hora). Si se hace
`new Date("2026-11-20")`, JavaScript lo interpreta como UTC y en husos horarios
al oeste de UTC puede mostrar el día anterior. Por eso se parsea a mano:

```js
const [anio, mes, dia] = iso.split('-').map(Number);
const fecha = new Date(anio, mes - 1, dia); // hora local
```

Para ordenar el dashboard basta comparar las cadenas ISO, que ya están en orden
`año-mes-día`. Las tareas sin fecha van al final.

## 8. Estados de la interfaz

| Estado | Qué se ve |
|---|---|
| Cargando | Panel con spinner y "Cargando tus tareas…"; contador "Cargando…" |
| Error | Panel con el mensaje real y botón Reintentar; estadísticas "–" / "No disponible" |
| Sin tareas | "Aún no tienes tareas" y botón para crear la primera |
| Sin resultados | "No hay tareas con estos filtros" y botón "Quitar filtros" |
| Dashboard vacío | "Todavía no hay tareas" o "Todo al día" si solo quedan completadas |

El estado vacío distingue entre **no hay nada** y **los filtros no coinciden**.
Son situaciones distintas y merecen acciones distintas.

## 9. Avisos y foco

Después de crear, editar o eliminar aparece un aviso (toast):

- `role="status"` para los éxitos y `role="alert"` para los errores.
- Se puede cerrar con un botón y desaparece solo a los pocos segundos.
- Nunca contiene HTML: el texto se asigna con `textContent`.

El foco también se mueve:

- Al abrir el diálogo, al campo título.
- Al crear, a la tarjeta nueva.
- Al eliminar, a la primera tarjeta que queda o al botón "Nueva tarea".
- Al cambiar de vista, al `h1` correspondiente.

Así una persona que use teclado o lector de pantalla no se queda perdida tras
una operación.

## 10. Cómo comprobarlo a mano

Con la aplicación arrancada:

1. Abre `http://localhost:8080` y comprueba el estado vacío.
2. Crea tres tareas con estados y prioridades distintos.
3. Mira el dashboard: contadores y "Próximas tareas" deben coincidir.
4. Filtra, edita y elimina; recarga con `F5` para confirmar la persistencia.
5. Para probar un error, detén MySQL o bloquea `/api/tareas` en DevTools y pulsa
   Reintentar cuando vuelva la conexión.

La verificación automatizada de la fase está descrita en
[FASE-06](../colaboracion/FASE-06.md).

## 11. Limitaciones y siguientes pasos

- Sin paginación ni buscador: se cargan todas las tareas.
- Sin deshacer: el borrado pide confirmación, pero es definitivo.
- Contadores y analíticas se calculan en el navegador con la lista completa. Con
  miles de tareas convendría un endpoint de estadísticas en el servidor.
- El dashboard y el tema claro/oscuro ya están implementados en la Fase 7; el
  detalle está en [Frontend](06-frontend.md).
- Sigue sin haber login: es una aplicación local de un solo usuario.
