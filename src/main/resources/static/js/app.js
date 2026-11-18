/* ==========================================================================
   VPlan · app.js
   --------------------------------------------------------------------------
   Fase 6: interfaz conectada a la API real.
   - Lee las tareas de /api/tareas y las pinta con plantillas y textContent.
   - Crea, edita y elimina contra MySQL a través de api.js.
   - Gestiona carga, errores, estados vacíos y avisos accesibles.
   - Filtra en memoria sobre la lista ya cargada (una sola petición GET).
   ========================================================================== */

import {
    ErrorApi,
    actualizarTarea,
    crearTarea,
    eliminarTarea,
    listarTareas
} from './api.js';

const NOMBRE = 'Victor';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

const ETIQUETAS_PRIORIDAD = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };
const CLASES_PRIORIDAD = {
    ALTA: 'pastilla--alta',
    MEDIA: 'pastilla--media',
    BAJA: 'pastilla--baja'
};

const ETIQUETAS_ESTADO = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En proceso',
    COMPLETADA: 'Completada'
};
const CLASES_ESTADO = {
    PENDIENTE: 'pastilla--pendiente',
    EN_PROCESO: 'pastilla--en-proceso',
    COMPLETADA: 'pastilla--completada'
};

/* ----------------------------------------------------------------------
   Referencias del documento
   ---------------------------------------------------------------------- */
const botonMenu = document.getElementById('boton-menu');
const menuLateral = document.getElementById('menu-lateral');
const fondoMenu = document.querySelector('.fondo-menu');
const fechaHoy = document.getElementById('fecha-hoy');
const saludo = document.getElementById('titulo-dashboard');

const vistas = {
    dashboard: {
        seccion: document.getElementById('vista-dashboard'),
        enlace: document.querySelector('.menu-enlace[data-vista="dashboard"]'),
        titulo: 'Dashboard'
    },
    tareas: {
        seccion: document.getElementById('vista-tareas'),
        enlace: document.querySelector('.menu-enlace[data-vista="tareas"]'),
        titulo: 'Mis tareas'
    }
};

const rejillaTareas = document.getElementById('rejilla-tareas');
const estadoVacio = document.getElementById('estado-vacio');
const tituloVacio = document.getElementById('titulo-vacio');
const textoVacio = document.getElementById('texto-vacio');
const botonQuitarFiltros = document.getElementById('boton-quitar-filtros');
const botonCrearVacio = document.getElementById('boton-crear-vacio');
const contadorTareas = document.getElementById('contador-tareas');
const cargaTareas = document.getElementById('carga-tareas');
const errorTareas = document.getElementById('error-tareas');
const textoErrorTareas = document.getElementById('texto-error-tareas');
const botonNuevaTarea = document.getElementById('boton-nueva-tarea');

const contadorPendientes = document.getElementById('contador-pendientes');
const contadorEnProceso = document.getElementById('contador-en-proceso');
const contadorCompletadas = document.getElementById('contador-completadas');
const notaPendientes = document.getElementById('nota-pendientes');
const notaEnProceso = document.getElementById('nota-en-proceso');
const notaCompletadas = document.getElementById('nota-completadas');
const cargaDashboard = document.getElementById('carga-dashboard');
const errorDashboard = document.getElementById('error-dashboard');
const textoErrorDashboard = document.getElementById('texto-error-dashboard');
const listaProximas = document.getElementById('lista-proximas');
const vacioDashboard = document.getElementById('vacio-dashboard');
const tituloVacioDashboard = document.getElementById('titulo-vacio-dashboard');
const textoVacioDashboard = document.getElementById('texto-vacio-dashboard');

const progresoPorcentaje = document.getElementById('progreso-porcentaje');
const progresoDetalle = document.getElementById('progreso-detalle');
const progresoNota = document.getElementById('progreso-nota');
const progresoAnillo = document.getElementById('progreso-anillo');
const metricaVencidas = document.getElementById('metrica-vencidas');
const metricaHoy = document.getElementById('metrica-hoy');
const metricaProximos = document.getElementById('metrica-proximos');
const metricaSinFecha = document.getElementById('metrica-sin-fecha');
const totalPrioridad = document.getElementById('total-prioridad');

const totalHoy = document.getElementById('total-hoy');
const cargaHoy = document.getElementById('carga-hoy');
const listaHoy = document.getElementById('lista-hoy');
const vacioHoy = document.getElementById('vacio-hoy');
const tituloVacioHoy = document.getElementById('titulo-vacio-hoy');
const textoVacioHoy = document.getElementById('texto-vacio-hoy');

const totalSemana = document.getElementById('total-semana');
const graficoSemana = document.getElementById('grafico-semana');
const semanaVacio = document.getElementById('semana-vacio');
const semanaNota = document.getElementById('semana-nota');

const plantillaTarea = document.getElementById('plantilla-tarea');
const plantillaProxima = document.getElementById('plantilla-proxima');
const plantillaHoy = document.getElementById('plantilla-hoy');
const zonaAvisos = document.getElementById('zona-avisos');

const dialogoTarea = document.getElementById('dialogo-tarea');
const tituloDialogo = document.getElementById('titulo-dialogo-tarea');
const formulario = document.getElementById('formulario-tarea');
const botonGuardar = document.getElementById('boton-guardar');
const avisoFormulario = document.getElementById('aviso-formulario');
const contadorDescripcion = document.getElementById('contador-descripcion');

const dialogoBorrar = document.getElementById('dialogo-borrar');
const textoBorrar = document.getElementById('texto-borrar');
const avisoBorrar = document.getElementById('aviso-borrar');
const botonConfirmarBorrar = document.getElementById('boton-confirmar-borrar');

/* ----------------------------------------------------------------------
   Estado de la aplicación
   ---------------------------------------------------------------------- */
let tareas = [];
let filtroEstado = '';
let filtroPrioridad = '';
let tareaEnEdicion = null;
let tareaAEliminar = null;
let guardandoFormulario = false;
let eliminandoTarea = false;
let completandoTarea = null;
let numeroCarga = 0;
let focoPendiente = null;

/* ----------------------------------------------------------------------
   Fecha y saludo
   ---------------------------------------------------------------------- */
function escribirFecha() {
    const formato = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const texto = formato.format(new Date());
    fechaHoy.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
}

function escribirSaludo() {
    const hora = new Date().getHours();
    let momento = 'Buenas noches';
    if (hora >= 6 && hora < 12) {
        momento = 'Buenos días';
    } else if (hora >= 12 && hora < 20) {
        momento = 'Buenas tardes';
    }
    saludo.textContent = `¡${momento}, ${NOMBRE}!`;
}

function formatearFecha(iso) {
    const [anio, mes, dia] = iso.split('-').map(Number);
    if (!anio || !mes || !dia) {
        return '';
    }
    return `${dia} ${MESES[mes - 1]} ${anio}`;
}

// Compara fechas sin pasar por UTC: evita el típico error de un día.
function fechaDesdeIso(iso) {
    const [anio, mes, dia] = iso.split('-').map(Number);
    if (!anio || !mes || !dia) {
        return null;
    }
    return new Date(anio, mes - 1, dia);
}

function inicioDelDia(fecha = new Date()) {
    const copia = new Date(fecha);
    copia.setHours(0, 0, 0, 0);
    return copia;
}

function sumarDias(fecha, dias) {
    const copia = new Date(fecha);
    copia.setDate(copia.getDate() + dias);
    return copia;
}

function claveFecha(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

function esVencida(iso) {
    const fecha = fechaDesdeIso(iso);
    if (!fecha) {
        return false;
    }
    return fecha < inicioDelDia();
}

/* ----------------------------------------------------------------------
   Navegación entre vistas con hash (#/dashboard, #/tareas)
   ---------------------------------------------------------------------- */
function vistaDesdeHash() {
    const destino = window.location.hash.replace(/^#\/?/, '');
    return destino === 'tareas' ? 'tareas' : 'dashboard';
}

function mostrarVista(nombre, moverFoco) {
    Object.entries(vistas).forEach(([clave, vista]) => {
        const activa = clave === nombre;
        vista.seccion.hidden = !activa;
        if (activa) {
            vista.enlace.setAttribute('aria-current', 'page');
        } else {
            vista.enlace.removeAttribute('aria-current');
        }
    });

    document.title = `${vistas[nombre].titulo} · VPlan`;
    window.scrollTo(0, 0);

    if (moverFoco) {
        vistas[nombre].seccion.querySelector('h1').focus({ preventScroll: true });
    }
}

function aplicarRuta(moverFoco) {
    mostrarVista(vistaDesdeHash(), moverFoco);
}

if (!window.location.hash || !/^#\/(dashboard|tareas)$/.test(window.location.hash)) {
    window.history.replaceState(null, '', '#/dashboard');
}

/* ----------------------------------------------------------------------
   Menú lateral en móvil
   ---------------------------------------------------------------------- */
let temporizadorFondo = null;

function menuEstaAbierto() {
    return document.body.classList.contains('menu-abierto');
}

function abrirMenu() {
    clearTimeout(temporizadorFondo);
    document.body.classList.add('menu-abierto');
    botonMenu.setAttribute('aria-expanded', 'true');
    fondoMenu.hidden = false;
    requestAnimationFrame(() => fondoMenu.classList.add('visible'));
    const primerEnlace = menuLateral.querySelector('.menu-enlace');
    if (primerEnlace) {
        primerEnlace.focus();
    }
}

function cerrarMenu() {
    if (!menuEstaAbierto()) {
        return;
    }
    document.body.classList.remove('menu-abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
    fondoMenu.classList.remove('visible');
    temporizadorFondo = setTimeout(() => {
        fondoMenu.hidden = true;
    }, 200);
}

botonMenu.addEventListener('click', () => {
    if (menuEstaAbierto()) {
        cerrarMenu();
    } else {
        abrirMenu();
    }
});

fondoMenu.addEventListener('click', cerrarMenu);

menuLateral.addEventListener('click', (evento) => {
    if (evento.target.closest('.menu-enlace')) {
        cerrarMenu();
    }
});

document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menuEstaAbierto()) {
        cerrarMenu();
        botonMenu.focus();
    }
});

const escritorio = window.matchMedia('(min-width: 900px)');
escritorio.addEventListener('change', (evento) => {
    if (evento.matches) {
        cerrarMenu();
    }
});

/* ----------------------------------------------------------------------
   Avisos accesibles (toasts)
   ---------------------------------------------------------------------- */
function mostrarToast(texto, tipo = 'exito') {
    // Como máximo tres avisos a la vez para no tapar la interfaz.
    while (zonaAvisos.children.length >= 3) {
        zonaAvisos.firstElementChild.remove();
    }

    const aviso = document.createElement('div');
    aviso.className = `toast toast--${tipo}`;
    aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');

    const contenido = document.createElement('p');
    contenido.className = 'toast-texto';
    contenido.textContent = texto;

    const cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'toast-cerrar';
    cerrar.setAttribute('aria-label', 'Cerrar aviso');
    cerrar.textContent = '×';

    let temporizador = setTimeout(quitar, tipo === 'error' ? 8000 : 6000);

    function quitar() {
        clearTimeout(temporizador);
        aviso.remove();
    }

    cerrar.addEventListener('click', quitar);

    aviso.append(contenido, cerrar);
    zonaAvisos.append(aviso);
}

/* ----------------------------------------------------------------------
   Estados de carga, error y estadísticas
   ---------------------------------------------------------------------- */
function ponerEstadisticasCargando() {
    [contadorPendientes, contadorEnProceso, contadorCompletadas].forEach((valor) => {
        valor.textContent = '–';
        valor.classList.add('estadistica-valor--vacio');
    });
    notaPendientes.textContent = 'Cargando…';
    notaEnProceso.textContent = 'Cargando…';
    notaCompletadas.textContent = 'Cargando…';
    ponerAnaliticaCargando();
}

function mostrarCargaInicial() {
    cargaTareas.hidden = false;
    errorTareas.hidden = true;
    rejillaTareas.hidden = true;
    estadoVacio.hidden = true;

    cargaDashboard.hidden = false;
    errorDashboard.hidden = true;
    listaProximas.hidden = true;
    vacioDashboard.hidden = true;

    contadorTareas.textContent = 'Cargando…';
    ponerEstadisticasCargando();
}

function mostrarErrorCarga(fallo) {
    const mensaje = textoDeError(fallo);

    cargaTareas.hidden = true;
    rejillaTareas.hidden = true;
    estadoVacio.hidden = true;
    errorTareas.hidden = false;
    textoErrorTareas.textContent = mensaje;

    cargaDashboard.hidden = true;
    listaProximas.hidden = true;
    vacioDashboard.hidden = true;
    errorDashboard.hidden = false;
    textoErrorDashboard.textContent = mensaje;

    contadorTareas.textContent = 'Sin datos';

    [contadorPendientes, contadorEnProceso, contadorCompletadas].forEach((valor) => {
        valor.textContent = '–';
        valor.classList.add('estadistica-valor--vacio');
    });
    notaPendientes.textContent = 'No disponible';
    notaEnProceso.textContent = 'No disponible';
    notaCompletadas.textContent = 'No disponible';
    ponerAnaliticaNoDisponible();
}

function textoDeError(fallo) {
    if (fallo instanceof ErrorApi) {
        if (fallo.campos) {
            return `${fallo.message}: ${Object.values(fallo.campos).join(' ')}`;
        }
        return fallo.message;
    }
    return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

function renderizarEstadisticas() {
    const cuenta = { PENDIENTE: 0, EN_PROCESO: 0, COMPLETADA: 0 };
    tareas.forEach((tarea) => {
        if (cuenta[tarea.estado] !== undefined) {
            cuenta[tarea.estado] += 1;
        }
    });

    const valores = [
        [contadorPendientes, cuenta.PENDIENTE],
        [contadorEnProceso, cuenta.EN_PROCESO],
        [contadorCompletadas, cuenta.COMPLETADA]
    ];

    valores.forEach(([elemento, cantidad]) => {
        elemento.textContent = String(cantidad);
        elemento.classList.remove('estadistica-valor--vacio');
    });
    notaPendientes.textContent = 'Sin empezar';
    notaEnProceso.textContent = 'En curso';
    notaCompletadas.textContent = 'Terminadas';
}

/* ----------------------------------------------------------------------
   Analíticas del dashboard (cálculo local sobre la única petición GET)
   ---------------------------------------------------------------------- */
function textoTotal(cantidad) {
    if (cantidad === 0) {
        return 'Sin tareas';
    }
    return cantidad === 1 ? '1 tarea' : `${cantidad} tareas`;
}

function actualizarDistribucion(selector, cuenta, total, cargando = false) {
    document.querySelectorAll(selector).forEach((fila) => {
        const cantidad = cuenta[fila.dataset.valor] || 0;
        const porcentaje = total ? Math.round((cantidad / total) * 100) : 0;
        const barra = fila.querySelector('[data-barra]');

        fila.querySelector('[data-cantidad]').textContent = cargando ? '–' : String(cantidad);
        fila.querySelector('[data-porcentaje]').textContent = cargando ? '–' : `${porcentaje} %`;
        barra.style.width = cargando || !total ? '0%' : `${(cantidad / total) * 100}%`;
    });
}

function ponerAnaliticaCargando() {
    progresoPorcentaje.textContent = '–';
    progresoDetalle.textContent = 'Cargando…';
    progresoNota.textContent = 'Calculando el avance…';
    progresoAnillo.style.setProperty('--valor', '0%');
    progresoAnillo.setAttribute('aria-valuenow', '0');
    progresoAnillo.setAttribute('aria-valuetext', 'Cargando');

    [metricaVencidas, metricaHoy, metricaProximos, metricaSinFecha].forEach((elemento) => {
        elemento.textContent = '–';
    });

    totalPrioridad.textContent = '–';
    actualizarDistribucion('[data-distribucion="prioridad"]', {}, 0, true);

    totalHoy.textContent = '–';
    cargaHoy.hidden = false;
    listaHoy.replaceChildren();
    listaHoy.hidden = true;
    vacioHoy.hidden = true;

    totalSemana.textContent = '–';
    graficoSemana.replaceChildren();
    graficoSemana.hidden = true;
    semanaVacio.hidden = false;
    semanaVacio.textContent = 'Cargando el resumen semanal…';
    semanaNota.textContent = 'Se cuenta el día en que completas cada tarea.';
}

function ponerAnaliticaNoDisponible() {
    progresoPorcentaje.textContent = '–';
    progresoDetalle.textContent = 'No disponible';
    progresoNota.textContent = 'No se pudieron calcular las analíticas.';
    progresoAnillo.style.setProperty('--valor', '0%');
    progresoAnillo.setAttribute('aria-valuenow', '0');
    progresoAnillo.setAttribute('aria-valuetext', 'No disponible');

    [metricaVencidas, metricaHoy, metricaProximos, metricaSinFecha].forEach((elemento) => {
        elemento.textContent = '–';
    });

    totalPrioridad.textContent = 'No disponible';
    actualizarDistribucion('[data-distribucion="prioridad"]', {}, 0, true);

    totalHoy.textContent = 'No disponible';
    cargaHoy.hidden = true;
    listaHoy.replaceChildren();
    listaHoy.hidden = true;
    vacioHoy.hidden = false;
    tituloVacioHoy.textContent = 'No disponible';
    textoVacioHoy.textContent = 'No se pudieron cargar las tareas de hoy.';

    totalSemana.textContent = 'No disponible';
    graficoSemana.replaceChildren();
    graficoSemana.hidden = true;
    semanaVacio.hidden = false;
    semanaVacio.textContent = 'No disponible';
    semanaNota.textContent = 'No se pudo calcular el resumen semanal.';
}

function renderizarSemana() {
    const hoy = inicioDelDia();
    const dias = [];

    // Los últimos siete días incluyen hoy: es la lectura natural de "esta semana".
    for (let indice = 6; indice >= 0; indice -= 1) {
        const fecha = sumarDias(hoy, -indice);
        dias.push({ fecha, clave: claveFecha(fecha), total: 0 });
    }
    const posicionPorFecha = new Map(dias.map((dia, indice) => [dia.clave, indice]));
    let sinFecha = 0;

    tareas.forEach((tarea) => {
        if (tarea.estado !== 'COMPLETADA') {
            return;
        }
        if (!tarea.completadoEn) {
            sinFecha += 1;
            return;
        }
        const fecha = new Date(tarea.completadoEn);
        if (Number.isNaN(fecha.getTime())) {
            sinFecha += 1;
            return;
        }
        const posicion = posicionPorFecha.get(claveFecha(fecha));
        if (posicion !== undefined) {
            dias[posicion].total += 1;
        }
    });

    const total = dias.reduce((suma, dia) => suma + dia.total, 0);
    totalSemana.textContent = textoTotal(total);
    semanaNota.textContent = sinFecha > 0
        ? 'Las tareas completadas antes de esta versión no tienen fecha registrada y no se incluyen.'
        : 'Se cuenta el día en que completas cada tarea.';
    graficoSemana.replaceChildren();

    if (total === 0) {
        graficoSemana.hidden = true;
        semanaVacio.hidden = false;
        semanaVacio.textContent = 'Aún no hay tareas completadas en los últimos 7 días.';
        return;
    }

    graficoSemana.hidden = false;
    semanaVacio.hidden = true;

    const maximo = Math.max(...dias.map((dia) => dia.total));
    const formatoDia = new Intl.DateTimeFormat('es-ES', { weekday: 'short' });
    const formatoCompleto = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    const claveHoy = claveFecha(hoy);

    dias.forEach(({ fecha, clave, total: cantidad }) => {
        const columna = document.createElement('div');
        columna.className = `grafico-dia${clave === claveHoy ? ' grafico-dia--hoy' : ''}`;
        columna.setAttribute('role', 'img');
        columna.setAttribute('aria-label',
            `${cantidad} ${cantidad === 1 ? 'tarea completada' : 'tareas completadas'} el ${formatoCompleto.format(fecha)}`);

        const valor = document.createElement('span');
        valor.className = 'grafico-cantidad';
        valor.textContent = String(cantidad);

        const pista = document.createElement('span');
        pista.className = 'grafico-pista';
        pista.setAttribute('aria-hidden', 'true');

        const relleno = document.createElement('span');
        relleno.className = `grafico-relleno${cantidad === 0 ? ' grafico-relleno--cero' : ''}`;
        relleno.style.height = cantidad
            ? `${Math.max(8, Math.round((cantidad / maximo) * 100))}%`
            : '2px';
        pista.append(relleno);

        const etiqueta = document.createElement('span');
        etiqueta.className = 'grafico-etiqueta';
        etiqueta.setAttribute('aria-hidden', 'true');

        const semana = document.createElement('span');
        semana.className = 'grafico-dia-semana';
        semana.textContent = formatoDia.format(fecha).replace('.', '');

        const numero = document.createElement('span');
        numero.className = 'grafico-dia-numero';
        numero.textContent = String(fecha.getDate());

        etiqueta.append(semana, numero);
        columna.append(valor, pista, etiqueta);
        graficoSemana.append(columna);
    });
}

function renderizarHoy() {
    const claveHoy = claveFecha(inicioDelDia());
    const ordenPrioridad = { ALTA: 0, MEDIA: 1, BAJA: 2 };
    const deHoy = tareas
        .filter((tarea) => tarea.estado !== 'COMPLETADA' && tarea.fechaLimite === claveHoy)
        .sort((a, b) => {
            const ordenA = ordenPrioridad[a.prioridad] ?? 3;
            const ordenB = ordenPrioridad[b.prioridad] ?? 3;
            return ordenA - ordenB || a.id - b.id;
        });

    cargaHoy.hidden = true;
    listaHoy.replaceChildren();
    totalHoy.textContent = textoTotal(deHoy.length);
    tituloVacioHoy.textContent = 'Nada para hoy';
    textoVacioHoy.textContent = 'No tienes tareas con fecha límite hoy.';

    if (deHoy.length === 0) {
        listaHoy.hidden = true;
        vacioHoy.hidden = false;
        return;
    }

    vacioHoy.hidden = true;
    listaHoy.hidden = false;

    deHoy.forEach((tarea) => {
        const fila = plantillaHoy.content.firstElementChild.cloneNode(true);
        fila.dataset.id = String(tarea.id);
        fila.querySelector('.fila-hoy-titulo').textContent = tarea.titulo;

        configurarPastilla(
            fila.querySelector('.pastilla-prioridad'),
            CLASES_PRIORIDAD[tarea.prioridad],
            ETIQUETAS_PRIORIDAD[tarea.prioridad] || tarea.prioridad
        );
        configurarPastilla(
            fila.querySelector('.pastilla-estado'),
            CLASES_ESTADO[tarea.estado],
            ETIQUETAS_ESTADO[tarea.estado] || tarea.estado
        );

        const boton = fila.querySelector('[data-completar]');
        boton.dataset.id = String(tarea.id);
        boton.setAttribute('aria-label', `Completar la tarea ${tarea.titulo}`);

        listaHoy.append(fila);
    });
}

function renderizarAnalitica() {
    const hoy = inicioDelDia();
    const limiteProximos = sumarDias(hoy, 7);
    const prioridad = { ALTA: 0, MEDIA: 0, BAJA: 0 };
    const estado = { PENDIENTE: 0, EN_PROCESO: 0, COMPLETADA: 0 };
    let vencidas = 0;
    let paraHoy = 0;
    let proximos = 0;
    let sinFecha = 0;

    tareas.forEach((tarea) => {
        if (prioridad[tarea.prioridad] !== undefined) {
            prioridad[tarea.prioridad] += 1;
        }
        if (estado[tarea.estado] !== undefined) {
            estado[tarea.estado] += 1;
        }

        if (tarea.estado === 'COMPLETADA') {
            return;
        }

        if (!tarea.fechaLimite) {
            sinFecha += 1;
            return;
        }

        const fecha = fechaDesdeIso(tarea.fechaLimite);
        if (!fecha) {
            sinFecha += 1;
            return;
        }

        if (fecha < hoy) {
            vencidas += 1;
            return;
        }
        if (fecha.getTime() === hoy.getTime()) {
            paraHoy += 1;
            return;
        }
        if (fecha <= limiteProximos) {
            proximos += 1;
        }
    });

    const total = tareas.length;
    const completadas = estado.COMPLETADA;
    const porcentaje = total ? Math.round((completadas / total) * 100) : 0;

    progresoPorcentaje.textContent = `${porcentaje} %`;
    progresoDetalle.textContent = total
        ? `${completadas} de ${total} ${total === 1 ? 'tarea completada' : 'tareas completadas'}`
        : 'Sin tareas todavía';
    progresoNota.textContent = total === 0
        ? 'Crea una tarea para empezar a medir tu avance.'
        : (completadas === total
            ? 'Todo completado. ¡Buen trabajo!'
            : `${total - completadas} ${total - completadas === 1 ? 'tarea pendiente' : 'tareas pendientes'} por terminar`);
    progresoAnillo.style.setProperty('--valor', `${porcentaje}%`);
    progresoAnillo.setAttribute('aria-valuenow', String(porcentaje));
    progresoAnillo.setAttribute('aria-valuetext', `${porcentaje} % completado`);

    metricaVencidas.textContent = String(vencidas);
    metricaHoy.textContent = String(paraHoy);
    metricaProximos.textContent = String(proximos);
    metricaSinFecha.textContent = String(sinFecha);

    totalPrioridad.textContent = textoTotal(total);
    actualizarDistribucion('[data-distribucion="prioridad"]', prioridad, total);

    renderizarSemana();
    renderizarHoy();
}

/* ----------------------------------------------------------------------
   Render del dashboard
   ---------------------------------------------------------------------- */
function renderizarProximas() {
    const claveHoy = claveFecha(inicioDelDia());
    const proximas = tareas
        .filter((tarea) => tarea.estado !== 'COMPLETADA' && tarea.fechaLimite !== claveHoy)
        .sort((a, b) => {
            if (a.fechaLimite && b.fechaLimite) {
                return a.fechaLimite.localeCompare(b.fechaLimite);
            }
            if (a.fechaLimite) {
                return -1;
            }
            if (b.fechaLimite) {
                return 1;
            }
            return a.id - b.id;
        })
        .slice(0, 5);

    listaProximas.replaceChildren();

    if (proximas.length === 0) {
        listaProximas.hidden = true;
        vacioDashboard.hidden = false;
        const hayPendientes = tareas.some((tarea) => tarea.estado !== 'COMPLETADA');
        if (tareas.length === 0) {
            tituloVacioDashboard.textContent = 'Todavía no hay tareas';
            textoVacioDashboard.textContent = 'Crea tu primera tarea y aparecerá aquí ordenada por fecha límite.';
        } else if (!hayPendientes) {
            tituloVacioDashboard.textContent = 'Todo al día';
            textoVacioDashboard.textContent = 'No tienes tareas pendientes. Puedes revisar las completadas o crear una nueva.';
        } else {
            tituloVacioDashboard.textContent = 'Nada más pendiente';
            textoVacioDashboard.textContent = 'Las tareas de hoy están en «Para hoy». Crea una nueva o revisa las completadas.';
        }
        return;
    }

    vacioDashboard.hidden = true;
    listaProximas.hidden = false;

    proximas.forEach((tarea) => {
        const fila = plantillaProxima.content.firstElementChild.cloneNode(true);

        fila.querySelector('.fila-compacta-titulo').textContent = tarea.titulo;

        const meta = fila.querySelector('.fila-compacta-meta');
        if (tarea.descripcion) {
            meta.textContent = tarea.descripcion;
        } else {
            meta.remove();
        }

        const fecha = fila.querySelector('.fila-compacta-fecha');
        const fechaTexto = fila.querySelector('.fila-compacta-fecha-texto');
        if (tarea.fechaLimite) {
            fechaTexto.textContent = formatearFecha(tarea.fechaLimite);
            if (esVencida(tarea.fechaLimite)) {
                fecha.classList.add('fila-compacta-fecha--vencida');
                fecha.title = 'Fecha límite superada';
            }
        } else {
            fechaTexto.textContent = 'Sin fecha';
            fecha.classList.add('fila-compacta-fecha--sin-fecha');
        }

        configurarPastilla(
            fila.querySelector('.pastilla-prioridad'),
            CLASES_PRIORIDAD[tarea.prioridad],
            ETIQUETAS_PRIORIDAD[tarea.prioridad] || tarea.prioridad
        );

        listaProximas.append(fila);
    });
}

/* ----------------------------------------------------------------------
   Render de la lista de tareas
   ---------------------------------------------------------------------- */
function configurarPastilla(elemento, clase, texto) {
    if (clase) {
        elemento.classList.add(clase);
    }
    elemento.textContent = texto;
}

function crearTarjeta(tarea) {
    const tarjeta = plantillaTarea.content.firstElementChild.cloneNode(true);
    tarjeta.dataset.id = String(tarea.id);
    tarjeta.dataset.estado = tarea.estado;
    tarjeta.dataset.prioridad = tarea.prioridad;

    tarjeta.querySelector('.tarea-titulo').textContent = tarea.titulo;

    const descripcion = tarjeta.querySelector('.tarea-descripcion');
    if (tarea.descripcion) {
        descripcion.textContent = tarea.descripcion;
    } else {
        descripcion.remove();
    }

    configurarPastilla(
        tarjeta.querySelector('.pastilla-prioridad'),
        CLASES_PRIORIDAD[tarea.prioridad],
        ETIQUETAS_PRIORIDAD[tarea.prioridad] || tarea.prioridad
    );
    configurarPastilla(
        tarjeta.querySelector('.pastilla-estado'),
        CLASES_ESTADO[tarea.estado],
        ETIQUETAS_ESTADO[tarea.estado] || tarea.estado
    );

    const fecha = tarjeta.querySelector('.tarea-fecha');
    if (tarea.fechaLimite) {
        const tiempo = fecha.querySelector('time');
        tiempo.dateTime = tarea.fechaLimite;
        tiempo.textContent = formatearFecha(tarea.fechaLimite);
        if (tarea.estado !== 'COMPLETADA' && esVencida(tarea.fechaLimite)) {
            fecha.classList.add('tarea-fecha--vencida');
            fecha.title = 'Fecha límite superada';
        }
    } else {
        fecha.remove();
    }

    const botonEditar = tarjeta.querySelector('[data-accion="editar"]');
    botonEditar.setAttribute('aria-label', `Editar la tarea ${tarea.titulo}`);

    const botonBorrar = tarjeta.querySelector('[data-accion="borrar"]');
    botonBorrar.setAttribute('aria-label', `Eliminar la tarea ${tarea.titulo}`);

    return tarjeta;
}

function tareasFiltradas() {
    return tareas.filter((tarea) => {
        const coincideEstado = !filtroEstado || tarea.estado === filtroEstado;
        const coincidePrioridad = !filtroPrioridad || tarea.prioridad === filtroPrioridad;
        return coincideEstado && coincidePrioridad;
    });
}

function renderizarTareas() {
    const visibles = tareasFiltradas();
    rejillaTareas.replaceChildren();

    if (tareas.length === 0) {
        rejillaTareas.hidden = true;
        estadoVacio.hidden = false;
        tituloVacio.textContent = 'Aún no tienes tareas';
        textoVacio.textContent = 'Crea tu primera tarea para empezar a organizar tu trabajo.';
        botonQuitarFiltros.hidden = true;
        botonCrearVacio.hidden = false;
    } else if (visibles.length === 0) {
        rejillaTareas.hidden = true;
        estadoVacio.hidden = false;
        tituloVacio.textContent = 'No hay tareas con estos filtros';
        textoVacio.textContent = 'Prueba otro estado o prioridad, o quita los filtros para ver todas tus tareas.';
        botonQuitarFiltros.hidden = false;
        botonCrearVacio.hidden = true;
    } else {
        estadoVacio.hidden = true;
        rejillaTareas.hidden = false;
        visibles.forEach((tarea) => rejillaTareas.append(crearTarjeta(tarea)));
    }

    const hayFiltros = Boolean(filtroEstado || filtroPrioridad);
    if (hayFiltros) {
        contadorTareas.textContent = `${visibles.length} de ${tareas.length} tareas`;
    } else {
        contadorTareas.textContent = tareas.length === 1 ? '1 tarea' : `${tareas.length} tareas`;
    }
}

function renderizarTodo() {
    cargaTareas.hidden = true;
    errorTareas.hidden = true;
    cargaDashboard.hidden = true;
    errorDashboard.hidden = true;

    renderizarEstadisticas();
    renderizarAnalitica();
    renderizarProximas();
    renderizarTareas();
    aplicarFocoPendiente();
}

function aplicarFocoPendiente() {
    if (!focoPendiente) {
        return;
    }
    const pendiente = focoPendiente;
    focoPendiente = null;

    // Si la persona está en el dashboard no movemos el foco a una tarjeta oculta.
    if (vistaDesdeHash() !== 'tareas') {
        return;
    }

    if (pendiente.tipo === 'tarjeta') {
        const tarjeta = rejillaTareas.querySelector(`.tarjeta-tarea[data-id="${pendiente.id}"]`);
        if (tarjeta) {
            tarjeta.focus({ preventScroll: true });
            tarjeta.scrollIntoView({ block: 'nearest' });
            return;
        }
    }

    const primera = rejillaTareas.querySelector('.tarjeta-tarea');
    if (primera) {
        primera.focus({ preventScroll: true });
        primera.scrollIntoView({ block: 'nearest' });
    } else {
        botonNuevaTarea.focus();
    }
}

/* ----------------------------------------------------------------------
   Carga de datos
   ---------------------------------------------------------------------- */
async function cargarTareas({ silenciosa = false } = {}) {
    const numero = ++numeroCarga;

    if (!silenciosa) {
        mostrarCargaInicial();
    }

    try {
        const datos = await listarTareas();
        if (numero !== numeroCarga) {
            return; // Una carga más reciente manda.
        }
        tareas = Array.isArray(datos) ? datos : [];
        renderizarTodo();
    } catch (fallo) {
        if (numero !== numeroCarga) {
            return;
        }
        mostrarErrorCarga(fallo);
        if (silenciosa) {
            mostrarToast(`No se pudo actualizar la lista. ${textoDeError(fallo)}`, 'error');
        }
    }
}

/* ----------------------------------------------------------------------
   Filtros (en memoria sobre la lista ya cargada)
   ---------------------------------------------------------------------- */
function marcarGrupo(selector, activo) {
    document.querySelectorAll(selector).forEach((boton) => {
        boton.setAttribute('aria-pressed', String(boton === activo));
    });
}

function reiniciarFiltros() {
    filtroEstado = '';
    filtroPrioridad = '';
    marcarGrupo('[data-filtro-estado]', document.querySelector('[data-filtro-estado=""]'));
    marcarGrupo('[data-filtro-prioridad]', document.querySelector('[data-filtro-prioridad=""]'));
}

document.querySelectorAll('[data-filtro-estado]').forEach((boton) => {
    boton.addEventListener('click', () => {
        filtroEstado = boton.dataset.filtroEstado;
        marcarGrupo('[data-filtro-estado]', boton);
        renderizarTareas();
    });
});

document.querySelectorAll('[data-filtro-prioridad]').forEach((boton) => {
    boton.addEventListener('click', () => {
        filtroPrioridad = boton.dataset.filtroPrioridad;
        marcarGrupo('[data-filtro-prioridad]', boton);
        renderizarTareas();
    });
});

botonQuitarFiltros.addEventListener('click', () => {
    reiniciarFiltros();
    renderizarTareas();
    const primera = rejillaTareas.querySelector('.tarjeta-tarea');
    if (primera) {
        primera.focus({ preventScroll: true });
    }
});

/* ----------------------------------------------------------------------
   Diálogos
   ---------------------------------------------------------------------- */
function dialogoOcupado(dialogo) {
    return dialogo.dataset.ocupado === 'true';
}

function abrirDialogo(dialogo) {
    avisoFormulario.hidden = true;
    avisoBorrar.hidden = true;
    dialogo.showModal();
}

function actualizarContadorDescripcion() {
    contadorDescripcion.textContent = `${formulario.elements.descripcion.value.length}/2000`;
}

function abrirCrear() {
    tareaEnEdicion = null;
    formulario.reset();
    formulario.removeAttribute('aria-busy');
    botonGuardar.disabled = false;
    botonGuardar.textContent = 'Guardar tarea';
    tituloDialogo.textContent = 'Nueva tarea';
    actualizarContadorDescripcion();
    abrirDialogo(dialogoTarea);
    requestAnimationFrame(() => formulario.elements.titulo.focus());
}

function abrirEditar(tarea) {
    tareaEnEdicion = tarea.id;
    tituloDialogo.textContent = 'Editar tarea';
    botonGuardar.disabled = false;
    botonGuardar.textContent = 'Guardar cambios';

    formulario.elements.titulo.value = tarea.titulo || '';
    formulario.elements.descripcion.value = tarea.descripcion || '';
    formulario.elements.prioridad.value = tarea.prioridad || '';
    formulario.elements.estado.value = tarea.estado || '';
    formulario.elements.fechaLimite.value = tarea.fechaLimite || '';
    actualizarContadorDescripcion();

    abrirDialogo(dialogoTarea);
    requestAnimationFrame(() => formulario.elements.titulo.focus());
}

function abrirBorrar(tarea) {
    tareaAEliminar = tarea;
    textoBorrar.textContent =
        `¿Seguro que quieres eliminar "${tarea.titulo}"? Esta acción no se puede deshacer.`;
    botonConfirmarBorrar.disabled = false;
    botonConfirmarBorrar.textContent = 'Eliminar';
    abrirDialogo(dialogoBorrar);
    requestAnimationFrame(() => botonConfirmarBorrar.focus());
}

document.querySelectorAll('[data-abrir-crear]').forEach((boton) => {
    boton.addEventListener('click', abrirCrear);
});

document.querySelectorAll('[data-cerrar-dialogo]').forEach((boton) => {
    boton.addEventListener('click', () => {
        const dialogo = boton.closest('dialog');
        if (dialogo && !dialogoOcupado(dialogo)) {
            dialogo.close();
        }
    });
});

[dialogoTarea, dialogoBorrar].forEach((dialogo) => {
    dialogo.addEventListener('click', (evento) => {
        if (evento.target === dialogo && !dialogoOcupado(dialogo)) {
            dialogo.close();
        }
    });
    dialogo.addEventListener('cancel', (evento) => {
        if (dialogoOcupado(dialogo)) {
            evento.preventDefault();
        }
    });
});

rejillaTareas.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) {
        return;
    }
    const tarjeta = boton.closest('.tarjeta-tarea');
    const tarea = tarjeta ? tareas.find((item) => item.id === Number(tarjeta.dataset.id)) : null;
    if (!tarea) {
        return;
    }

    if (boton.dataset.accion === 'editar') {
        abrirEditar(tarea);
    } else if (boton.dataset.accion === 'borrar') {
        abrirBorrar(tarea);
    }
});

/* ----------------------------------------------------------------------
   Completar una tarea desde el dashboard
   ---------------------------------------------------------------------- */
function datosParaCompletar(tarea) {
    // Se reenvía la tarea completa: el PUT es una actualización completa y no
    // debe perder descripción, prioridad ni fecha límite.
    return {
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        estado: 'COMPLETADA',
        fechaLimite: tarea.fechaLimite
    };
}

async function completarDesdeHoy(tarea, boton) {
    if (completandoTarea !== null) {
        return;
    }

    completandoTarea = tarea.id;
    boton.disabled = true;
    boton.setAttribute('aria-busy', 'true');
    const textoBoton = boton.querySelector('.boton-completar-texto');
    if (textoBoton) {
        textoBoton.textContent = 'Completando…';
    }

    try {
        const actualizada = await actualizarTarea(tarea.id, datosParaCompletar(tarea));
        tareas = tareas.map((item) => (item.id === actualizada.id ? actualizada : item));
        renderizarTodo();
        mostrarToast(`«${tarea.titulo}» completada.`, 'exito');

        if (vistaDesdeHash() === 'dashboard') {
            requestAnimationFrame(() => {
                const siguiente = listaHoy.querySelector('[data-completar]');
                if (siguiente) {
                    siguiente.focus({ preventScroll: true });
                } else {
                    document.getElementById('titulo-hoy').focus({ preventScroll: true });
                }
            });
        }
    } catch (fallo) {
        if (fallo instanceof ErrorApi && fallo.estado === 404) {
            mostrarToast('La tarea ya no existe. Se ha actualizado la lista.', 'error');
            await cargarTareas({ silenciosa: true });
        } else {
            mostrarToast(`No se pudo completar la tarea. ${textoDeError(fallo)}`, 'error');
            boton.disabled = false;
            boton.removeAttribute('aria-busy');
            if (textoBoton) {
                textoBoton.textContent = 'Completar';
            }
        }
    } finally {
        completandoTarea = null;
    }
}

listaHoy.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-completar]');
    if (!boton) {
        return;
    }
    const tarea = tareas.find((item) => item.id === Number(boton.dataset.id));
    if (tarea) {
        completarDesdeHoy(tarea, boton);
    }
});

formulario.elements.descripcion.addEventListener('input', actualizarContadorDescripcion);

/* ----------------------------------------------------------------------
   Crear y editar
   ---------------------------------------------------------------------- */
function enfocarPrimerCampoInvalido(campos) {
    const orden = ['titulo', 'descripcion', 'prioridad', 'estado', 'fechaLimite'];
    const nombre = orden.find((campo) => campos[campo]);
    if (!nombre) {
        return;
    }
    const elemento = formulario.elements[nombre];
    if (elemento) {
        elemento.focus();
    }
}

formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (guardandoFormulario) {
        return;
    }

    const datos = {
        titulo: formulario.elements.titulo.value.trim(),
        descripcion: formulario.elements.descripcion.value.trim() || null,
        prioridad: formulario.elements.prioridad.value,
        estado: formulario.elements.estado.value || null,
        fechaLimite: formulario.elements.fechaLimite.value || null
    };

    const esNueva = tareaEnEdicion === null;

    guardandoFormulario = true;
    dialogoTarea.dataset.ocupado = 'true';
    formulario.setAttribute('aria-busy', 'true');
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando…';
    avisoFormulario.hidden = true;

    try {
        const guardada = esNueva
            ? await crearTarea(datos)
            : await actualizarTarea(tareaEnEdicion, datos);

        dialogoTarea.close();
        mostrarToast(esNueva ? 'Tarea creada.' : 'Tarea actualizada.', 'exito');
        focoPendiente = { tipo: 'tarjeta', id: guardada.id };

        // Al crear, se quitan los filtros para que la tarea nueva sea visible.
        if (esNueva) {
            reiniciarFiltros();
        }

        await cargarTareas({ silenciosa: true });
    } catch (fallo) {
        if (fallo instanceof ErrorApi && fallo.estado === 404) {
            dialogoTarea.close();
            mostrarToast('La tarea ya no existe. Se ha actualizado la lista.', 'error');
            focoPendiente = null;
            await cargarTareas({ silenciosa: true });
        } else {
            mostrarAviso(avisoFormulario, textoDeError(fallo), 'error');
            if (fallo instanceof ErrorApi && fallo.campos) {
                enfocarPrimerCampoInvalido(fallo.campos);
            }
        }
    } finally {
        guardandoFormulario = false;
        delete dialogoTarea.dataset.ocupado;
        formulario.removeAttribute('aria-busy');
        botonGuardar.disabled = false;
        botonGuardar.textContent = esNueva ? 'Guardar tarea' : 'Guardar cambios';
    }
});

/* ----------------------------------------------------------------------
   Eliminar
   ---------------------------------------------------------------------- */
botonConfirmarBorrar.addEventListener('click', async () => {
    if (!tareaAEliminar || eliminandoTarea) {
        return;
    }

    eliminandoTarea = true;
    dialogoBorrar.dataset.ocupado = 'true';
    botonConfirmarBorrar.disabled = true;
    botonConfirmarBorrar.textContent = 'Eliminando…';
    avisoBorrar.hidden = true;

    try {
        await eliminarTarea(tareaAEliminar.id);
        dialogoBorrar.close();
        tareaAEliminar = null;
        mostrarToast('Tarea eliminada.', 'exito');
        focoPendiente = { tipo: 'lista' };
        await cargarTareas({ silenciosa: true });
    } catch (fallo) {
        if (fallo instanceof ErrorApi && fallo.estado === 404) {
            dialogoBorrar.close();
            tareaAEliminar = null;
            mostrarToast('La tarea ya no existía. Se ha actualizado la lista.', 'error');
            focoPendiente = null;
            await cargarTareas({ silenciosa: true });
        } else {
            mostrarAviso(avisoBorrar, textoDeError(fallo), 'error');
        }
    } finally {
        eliminandoTarea = false;
        delete dialogoBorrar.dataset.ocupado;
        botonConfirmarBorrar.disabled = false;
        botonConfirmarBorrar.textContent = 'Eliminar';
    }
});

/* ----------------------------------------------------------------------
   Avisos dentro de los diálogos
   ---------------------------------------------------------------------- */
function mostrarAviso(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.classList.toggle('aviso--error', tipo === 'error');
    elemento.classList.toggle('aviso--exito', tipo === 'exito');
    elemento.hidden = false;
}

/* ----------------------------------------------------------------------
   Reintentos
   ---------------------------------------------------------------------- */
document.getElementById('reintentar-tareas').addEventListener('click', () => cargarTareas());
document.getElementById('reintentar-dashboard').addEventListener('click', () => cargarTareas());

/* ----------------------------------------------------------------------
   Arranque
   ---------------------------------------------------------------------- */
escribirFecha();
escribirSaludo();
aplicarRuta(false);
cargarTareas();

window.addEventListener('hashchange', () => aplicarRuta(true));
