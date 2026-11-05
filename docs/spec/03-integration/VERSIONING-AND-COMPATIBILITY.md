# Versionado y compatibilidad entre repositorio, catálogo y sesión

## Versiones distintas: no confundir

| Identificador | Quién lo genera / usa | Qué representa |
| --- | --- | --- |
| SHA de commit Git | Repositorio de curso | Estado exacto del árbol Git en origen |
| SHA fijado de `webpagesrepo` | Caller workflow / runtime central | Versión técnica del tooling utilizado en el build |
| `course.json.version = 1` | Generador de catálogo | Versión del esquema JSON |
| `content/lNNN.json.version = 1` | Generador | Versión del esquema del snapshot |
| `CourseRevision.semanticVersion` | LabControl | Revisión académica calculada por cambios aceptados |
| `CourseSession.revisionId` | LabControl | Revisión académica oficialmente seleccionada/congelada para esa sesión |

## Ciclo esperado

1. Instructor edita Markdown en el repositorio de su curso.
2. `git push` inicia un workflow de construcción/publicación según la variante instalada.
3. Se publica el catálogo más reciente con manifiestos, contenido y commit fuente.
4. **Sincronizar todo** en LabControl importa/compara el catálogo y puede crear revisión nueva si existen cambios relevantes. La presencia de un nuevo commit no exige una revisión nueva.
5. Las sesiones en revisiones anteriores **permanecen** en sus `revisionId`, incluso si Pages ya cambió.
6. Solamente una migración explícita en LabControl cambia la revisión de una sesión.

## Ejemplo A/B

- Sesión A en v1.0.0, Lab 5 con 35 Steps.
- Se publica nueva revisión académica v1.3.0, Lab 5 con 42 Steps.
- Sesión A **debe** seguir mostrando 35 Steps y su contenido original hasta migrar; otra sesión nueva puede usar v1.3.0.
- El catálogo público de Pages se verá actualizado sin importar la revisión de la sesión. No usar Pages vigente como substituto del snapshot histórico.
- La implementación del **visor histórico** es una responsabilidad pendiente de LabControl (Issue #116), no de este documento.

## Cambios de contenido y futuras evaluaciones

- Guardar `contentHash` por Lab facilita reconocer labs iguales entre revisiones.
- Si el hash cambia, examinar si hubo cambio educativo o solo formato: el hash **no** determina por sí solo equivalencia de conocimiento.
- En la futura evaluación generada con IA (LabControl Issue #173), regenerar preguntas únicamente para Labs afectados y revisarlas/aprobarlas; no mutar resultados históricos.

## Runtime central: fijación y rollback

Para cursos que adoptan runtime central:
- Fijar workflow/tooling a **SHA revisado**, nunca a una rama mutable en producción.
- Probar una actualización en rama/PR del curso y revisar IDs, Markdown, catálogo, build y comportamiento de participante.
- Si hay regresión, restaurar el SHA previo y volver a publicar.
- No ejecutar `prepare_course_build.mjs --apply` sobre el working copy real del instructor; ese modo es para checkout efímero.

## Restricciones de seguridad

Nunca migrar sesiones, reescribir Markdown ni renumerar pasos publicados por una actualización de runtime sin flujo autorizado. Los secretos y proofs de vinculación son específicos de cada curso y entorno.

## Dependencias pendientes

- LabControl #116: lectura consistente del snapshot histórico.
- LabControl #173: definiciones y aprobaciones de evaluaciones por revisión.
- Revisar la sincronización legacy de manifests cuando existan variables `LABCONTROL_API_URL`/`LABCONTROL_SYNC_TOKEN`; no asumir que equivale a `Sincronizar todo`.
