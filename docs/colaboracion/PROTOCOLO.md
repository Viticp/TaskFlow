# Protocolo de colaboración Hermes ↔ OpenCode

## 1. Roles

| Agente | Rol | Escribe en |
|---|---|---|
| **Hermes** | Coordinación técnica: analiza, divide fases, revisa, detecta errores, explica decisiones | `docs/colaboracion/REVISION-HERMES.md` |
| **OpenCode** | Desarrollo: crea archivos, implementa, ejecuta pruebas, corrige | Código, configuración y `docs/colaboracion/INFORME-OPENCODE.md` |
| **Persona (tú)** | Aprueba cada fase y aporta credenciales/datos | — |

## 2. Cómo se comunican realmente

No hay un bus MCP ni ACP configurado entre ambos. La integración verificada es por
**CLI y sistema de archivos**:

- OpenCode → Hermes: `hermes -z "<instrucción>"` (verificado).
- Hermes → OpenCode: ejecuta `opencode run "<instrucción>"` desde su herramienta
  de shell (verificado con `opencode --version`).

Por eso el flujo es **por turnos**, no simultáneo.

## 3. Regla de un único escritor

1. Antes de empezar una fase, se escribe `docs/colaboracion/TAREA-ACTUAL.md` con:
   objetivo, archivos que se van a tocar, criterio de aceptación y responsable.
2. Solo el responsable de la fase escribe en esos archivos.
3. El otro agente **solo lee** y deja su opinión en su propio archivo.
4. No se lanzan dos agentes a la vez sobre el mismo repositorio.
5. Si hay que cambiar de responsable, se actualiza `TAREA-ACTUAL.md` primero.

## 4. Cierre de fase

Cada fase termina con:

1. Compilación y tests ejecutados de verdad (sin inventar resultados).
2. Informe de OpenCode con comandos y salida real.
3. Revisión de Hermes con riesgos concretos.
4. Aprobación de la persona.
5. Commit de Git (cuando exista identidad configurada).

## 5. Reglas técnicas

- Nada de instalaciones globales sin autorización.
- Nada de cambios en MySQL que no estén en un script aprobado.
- Nada de secretos en el repositorio.
- Si una comprobación no se puede ejecutar, se dice explícitamente.
- El código nuevo sigue la estructura y el estilo existentes.

## 6. Plantilla de handoff

Copia `PLANTILLA-HANDOFF.md` en `TAREA-ACTUAL.md` al empezar cada fase.
