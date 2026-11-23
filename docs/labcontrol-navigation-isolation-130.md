# #130 — Navegación y progreso independientes: Jekyll público / LabControl / instructor demo

Estado: **implementación experimental en PR Draft #59**. La rama incluye el runtime de separación, pero **ningún curso existente ni producción se ha modificado o desplegado**. No fusionar hasta resolver la adopción automática y QA en un curso aislado.

## Invariantes

1. **Jekyll público**: abrir un Lab directamente desde GitHub Pages (sin contexto activo de LabControl) conserva los enlaces originales de `_includes/nav.html` y `_includes/nav-footer.html` — Atrás, Siguiente, Lista General. También conserva sin cambios sus claves `netec:stepProgress:<courseId>:<labId>` y el fallback legacy. No envía Steps al backend ni muestra falsos avisos de sesión expirada.
2. **LabControl participante**: solo un acceso explícito con `lab-access` procedente del botón azul inicia el modo oficial. El backend autentica la matrícula y sesión para determinar qué Labs permiten registrar progreso. El progreso oficial **es el del backend**, y la caché/cola local se identifica por la matrícula y la sesión autenticadas, nunca por `courseId:labId` únicamente.
3. **Instructor demo**: `lab-demo` sigue siendo un contexto distinto; su almacenamiento `netec:instructorDemoProgress:<session>:<course>:<lab>` y navegación entre Labs permanecen independientes. No se genera un Enrollment real ni se envían Steps a LabControl.
4. **Transición segura**: datos del espacio público no se importan automáticamente a la matrícula oficial; la caché oficial nunca se muestra ni actualiza en Jekyll público. Si un token expira o se revoca, no se reclasifica progreso oficial como público, ni se redirige silenciosamente a otra matrícula.
5. **Contenido público**: GitHub Pages seguirá siendo públicamente legible. Los controles de LabControl protegen la disponibilidad administrada y el API de escritura, no el acceso HTTP a las instrucciones estáticas.
6. **No alterar contenido académico**: scripts, layouts y pruebas, sin editar Labs. Cualquier implementación debe incorporarse a `scripts/prepare_course_build.mjs` / automatización de adopción de cursos existentes y verificarse con Jekyll build.

## Diagnóstico en main (2026-11-21)

- `assets/js/lab-progress.js` se carga antes de `assets/js/lab-tracker.js` desde `_layouts/default.html`. La selección de almacenamiento debe ocurrir **antes** de que `initLabProgress()` restaure marcas.
- `lab-progress.js` usa claves públicas `netec:stepProgress:<courseId>:<labId>` en todos los casos no-demo. No diferenciar oficial/público mezcla datos.
- `lab-tracker.js` guarda token en `sessionStorage` (`netec:participantAccessToken`) y retorno (`netec:labControlReturnUrl`), reescribe **todos** los enlaces `.lab-nav a.btn` hacia `/participant` sin distinguir Atrás/Siguiente y Lista General. El contexto residual puede afectar una visita directa posterior.
- `netec:trackingQueue:<courseId>:<labId>` no está aislada por matrícula, lo que permite riesgo de reenvío entre sesiones si se mantiene una misma pestaña/navegador.
- `lab-tracker.js` muestra aviso `Sesión sin acceso` al marcar Steps desde un acceso público con tracking configurado. El uso público no debe mostrarlo.
- `lab-demo-context.js` ya aísla marcas demo y propaga `lab-demo` solamente sobre enlaces propios; sus pruebas actuales deben conservarse.

## Arquitectura por fases y avances en PR #59

### Fase 1 — Contexto explícito y estado oficial separado (implementada en rama)
- Nuevo módulo precargado antes de `lab-progress.js` que clasifique `public | pending-participant | participant | demo` y lea `lab-access` / `lab-demo` de los fragmentos de inicio. **Un token en storage o solo `lab-return` no constituye prueba de sesión válida.**
- Validar el token mediante API de participante y obtener identificadores confiables `courseSessionId` y `enrollmentId` **antes** de inicializar `lab-progress.js` en modo oficial, evitando parpadeos y contaminación de marcas públicas.
- Mantener el token solo en `sessionStorage` y jamás registrarlo, copiarlo a localStorage ni introducirlo como parte de un nombre de clave; un token rotado no debe causar recuperación cruzada.
- Clave local oficial propuesta: `netec:labcontrol:stepProgress:v1:<sessionId>:<enrollmentId>:<courseId>:<labId>`; cola `netec:labcontrol:trackingQueue:v1:<sessionId>:<enrollmentId>:<courseId>:<labId>`. `participantSessionId` es opcional para distinguir reingresos, pero el histórico oficial pertenece a Enrollment.
- En una visita pública **no migrar ni borrar** claves públicas existentes; mantener compatibilidad con el fallback legacy solo para modo público.
- Si no se consigue validar sesión, **no inicializar espacio oficial con identidad incierta**. Mostrar aviso/fallback seguro, sin pasar a modo público automáticamente.

### Fase 2 — Navegación restringida por sesión (implementada en rama, requiere QA E2E)
- Jekyll público: los `href` estáticos de Atrás/Siguiente/Lista General quedan sin intervención.
- LabControl oficial: Lista General dirige a `/participant` *únicamente* con contexto oficial confirmado; Atrás/Siguiente conservan la ruta original únicamente después de consultar disponibilidad del destino en la revisión congelada y **validar en API al abrir el Lab**. No propagar token a enlaces sin revisar exposición en historial y `Referer`; preferir handoff de acceso validado que no permita saltar permisos.
- Los Labs bloqueados global o individualmente no reciben escritura oficial; un acceso directo público no se confunde con un acceso oficial. Evitar enlaces rotos en los extremos de secuencia.
- Demo instructor: preservar `lab-demo` y enlace explícito de regreso sin añadir acceso participante.

### Fase 3 — QA y adopción (parcial: CI + automatizador legacy; pendiente cursos publicados)
- Tests de matrices: acceso directo (incluyendo luego de sesión oficial en la misma pestaña), nuevo participante, otro usuario en mismo navegador, expiración/401, bloqueo/403, retiro de matrícula, reconexión offline, vuelta a la sesión, demo instructor, recarga y botones en ambos extremos.
- Verificar 0 escrituras oficiales en modo público y demo; ninguna transferencia entre claves públicas y oficiales. Progreso original permaneció byte a byte.
- Preparar cursos existentes mediante scripts automatizados de `webpagesrepo`, sin tocar Markdown académico, y probar primero con fixture publicado aislado. EC2: evitar despliegue de API/BD salvo cambios justificados.

## Alcance de Issue

La Issue #130 también menciona navegación contextual **interna de Next.js** (Cursos/Sesiones/Participantes). No darla por cerrada únicamente con el arreglo de navegación Jekyll; evaluar la parte interna por separado, conservando el estado de filtros, Lab abierto y retorno.

## Estado de integración y condición de despliegue

- En la rama, `_layouts/default.html` carga `lab-control-context-policy.js` y `lab-control-context.js` antes de progreso/tracker. El modo público conserva el almacenamiento de Jekyll; la entrada autorizada espera validación del backend. El marcador `#lab-lc=1` permite recarga/navegación explícita sin colocar el token en enlaces Atrás/Siguiente.
- `scripts/update_existing_course_runtime.mjs` actualiza los loaders y scripts técnicos y crea respaldo de archivos reemplazados; no toca `labs/`. Sus pruebas deben aprobar en GitHub Actions y se debe validar el resultado con Jekyll antes de publicar.
- **Limitación de adopción:** `scripts/prepare_course_build.mjs` continúa con compatibilidad para checkouts de cursos existentes que todavía cargan únicamente demo/progress/tracker. No se debe sincronizar un `lab-tracker.js` nuevo sin instalar a la vez `lab-control-context-policy.js`, `lab-control-context.js` y sus loaders. Coordinar migración de cursos y automatización central antes de fusionar el PR.
- `#130` seguirá abierto para completar QA en curso controlado y navegación contextual dentro de Next.js.
