/* ==========================================================================
   VPlan · api.js
   --------------------------------------------------------------------------
   Fase 6: única capa que habla con la API REST.
   - Construye las peticiones a /api/tareas.
   - Convierte cualquier fallo en un ErrorApi con un mensaje ya listo para
     mostrar en la interfaz.
   - No toca el DOM: app.js decide qué hacer con los datos y los errores.
   ========================================================================== */

const BASE = '/api/tareas';
const TIEMPO_MAXIMO_MS = 10000;

/**
 * Error de la API con los datos que la interfaz necesita para reaccionar:
 * estado HTTP, campos inválidos y si el fallo fue de red o de tiempo.
 */
export class ErrorApi extends Error {
    constructor(mensaje, { estado = 0, campos = null, esRed = false, esTiempo = false } = {}) {
        super(mensaje);
        this.name = 'ErrorApi';
        this.estado = estado;
        this.campos = campos;
        this.esRed = esRed;
        this.esTiempo = esTiempo;
    }
}

async function peticion(ruta, opciones = {}) {
    const cabeceras = {
        Accept: 'application/json',
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
        ...opciones.headers
    };

    let respuesta;
    try {
        respuesta = await fetch(ruta, {
            ...opciones,
            headers: cabeceras,
            cache: 'no-store',
            signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS)
        });
    } catch (fallo) {
        if (fallo.name === 'TimeoutError' || fallo.name === 'AbortError') {
            throw new ErrorApi(
                'El servidor ha tardado demasiado en responder. Comprueba que VPlan sigue abierto.',
                { esTiempo: true });
        }
        throw new ErrorApi(
            'No se pudo conectar con el servidor. Comprueba que VPlan está en marcha.',
            { esRed: true });
    }

    // DELETE correcto: 204 sin cuerpo.
    if (respuesta.status === 204) {
        return null;
    }

    let cuerpo = null;
    const tipoContenido = respuesta.headers.get('content-type') || '';
    if (tipoContenido.includes('application/json')) {
        try {
            cuerpo = await respuesta.json();
        } catch {
            cuerpo = null;
        }
    }

    if (!respuesta.ok) {
        const mensaje = cuerpo && typeof cuerpo.mensaje === 'string'
            ? cuerpo.mensaje
            : `La operación ha fallado (código ${respuesta.status}).`;
        throw new ErrorApi(mensaje, {
            estado: respuesta.status,
            campos: cuerpo && cuerpo.campos ? cuerpo.campos : null
        });
    }

    return cuerpo;
}

export function listarTareas() {
    return peticion(BASE);
}

export function crearTarea(datos) {
    return peticion(BASE, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

export function actualizarTarea(id, datos) {
    return peticion(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

export function eliminarTarea(id) {
    return peticion(`${BASE}/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}
