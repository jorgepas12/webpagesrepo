# Rollback y recuperación de cursos Jekyll integrados con LabControl

**Objetivo:** recuperación segura ante fallos de despliegue, runtime, IDs de Steps, catálogo o sincronización, preservando instrucciones académicas e historial de progreso.

## Regla inicial antes de intervenir

1. Identificar **qué falló**: build de Pages, manifest, runtime JS, endpoint de tracking o revisión de sesión.
2. Registrar URL del workflow, commit de curso, SHA de tooling central, curso/Tracking ID, sesión y revisión; **no** registrar tokens, contraseñas ni proofs.
3. Determinar si el curso tiene estudiantes activos, sesiones congeladas o progreso previo. En caso afirmativo, **no usar reparación automática de IDs ni aplicar migración de Labs a ciegas**.
4. Conservar una copia del diff y, cuando haya riesgo de pérdida de contenido, un respaldo del repositorio; evitar cambios directamente en `main` sin PR.
5. Ejecutar pruebas en rama o clon desechable antes de aplicar la solución.

## Escenario A — Falló el nuevo runtime central

**Síntoma:** la publicación pasa pero las funciones de progreso, demo o navegación dejan de responder después de actualizar un SHA.

**Acción:** restaurar en el caller del curso el SHA de tooling anterior comprobado; revisar `prepare_course_build.mjs` en un checkout efímero y volver a publicar. El rollback del runtime no cambia `CourseSession.revisionId` ni restaura retroactivamente los Steps enviados.

**Validación:** load order JS, acceso instructor/participante, ausencia de errores de consola, sincronización con API en entorno seguro y HTML de Pages publicado.

## Escenario B — Error de build Jekyll / Pages

**Síntoma:** GitHub Actions marca error en `bundle exec jekyll build --trace`, faltan includes, URLs base incorrectas o el sitio no publica.

**Acción:** revisar logs de la ejecución y el primer error real; verificar `_config.yml`, `Gemfile`, `_layouts`, `_includes` y rutas de imágenes. Reparar solamente el archivo causante en una rama. No sustituir el curso por una plantilla completa ni sobrescribir `labs/`.

**Validación:** build local o runner, `course.json` y HTML publicados correctamente, rutas de assets válidas.

## Escenario C — Falla de Step IDs o reparación automática

**Síntoma:** falla `repair_step_ids.mjs --check` o el workflow intenta normalizar IDs.

**Acción:** ejecutar dry-run y revisar el diff previsto antes de aplicar. Si hay progreso histórico, **no** ejecutar `--apply` ni aceptar un commit automático sin valorar impacto. La herramienta normaliza secuencias por posición; puede cambiar la identidad histórica de Steps válidos. Revertir únicamente un commit de reparación accidental tras comparar con los manifests usados por sesiones, en lugar de renumerar de nuevo.

**Validación:** conteos/IDs de `RevisionLab.manifest` y de Pages, sesión antigua, nuevos Steps y progreso previo. Referencia: [STEP-ID-REPAIR.md](../../STEP-ID-REPAIR.md).

## Escenario D — Catálogo o snapshot incompleto

**Síntoma:** `course.json` no existe, tiene `courseId` incorrecto, faltan `content/lNNN.json` o los hashes difieren.

**Acción:** revisar identidad, frontmatter, scripts generadores y pruebas; regenerar los artefactos desde el **mismo commit de curso** y verificar. No inventar hashes ni sincronizar un catálogo parcial. Si ya se importó en LabControl, comprobar la revisión almacenada antes de publicar otra.

**Validación:** `test_lab_manifest.mjs`, `test_course_catalog.mjs`, rutas publicadas y hash de los snapshots.

## Escenario E — Publicación nueva con sesión antigua

**Síntoma:** Pages muestra el contenido nuevo, pero una sesión congelada requiere instrucciones y Steps anteriores.

**Acción:** **no revertir GitHub Pages** para todas las sesiones ni modificar la lógica de versionado que funciona. Resolver la sesión por `CourseSession.revisionId` y snapshot histórico de LabControl. Este visor/aislamiento es un trabajo de LabControl (Issue #116); si todavía no está disponible, documentar la limitación y evitar afirmar que Pages reproduce versiones antiguas.

**Validación:** revisar por separado total oficial de Steps, desglose, contenido visual y progreso de cada revisión.

## Escenario F — Sincronización fallida o 401

**Síntoma:** errores de API, acceso expirado, estado de sesión completada o cola offline sin vaciar.

**Acción:** distinguir autenticación/estado de sesión frente a problemas de construcción de Pages. No regenerar una identidad ni borrar progreso local para resolver 401. Registrar sesión y error sin credenciales; revisar los permisos y reglas de la API de LabControl. El problema conocido de cola offline tiene seguimiento propio en Issue #21.

**Validación:** revisar cola local y progreso persistido sin duplicaciones; no cambiar estado de la sesión solo para ocultar un error.

## Escenario G — Doble publicación o cambio de workflow

**Síntoma:** dos workflows intentan desplegar el mismo repositorio Pages.

**Acción:** suspender adopción y elegir una ruta de publicación: `pages.yml` del curso **o** caller central aprobado, no ambas con deploy habilitado. Restaurar temporalmente el último workflow productivo probado y revisar permisos.

## Checklist final de restauración

- [ ] Repositorio de curso y `labs/` conservan contenido académico.
- [ ] `course.identity.json` y proof de vinculación pertenecen al curso y no se copiaron de otro.
- [ ] Todos los Step IDs existentes siguen asociados correctamente al histórico.
- [ ] Un único workflow publica Pages.
- [ ] Catálogo, manifests, snapshots, JS y HTML publicados son coherentes.
- [ ] Sesiones antiguas de LabControl conservan su revisión, acceso y progreso.
- [ ] Evento documentado con causa, commit reparador, validación y rollback probado.

**Fuera de alcance:** restaurar PostgreSQL/volúmenes EBS o intervenir credenciales productivas. Esas tareas corresponden al runbook de infraestructura de LabControl.
