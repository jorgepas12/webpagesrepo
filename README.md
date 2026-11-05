# webpagesrepo — plantilla maestra de cursos Jekyll / Lab Control

Este repositorio es el **origen de las herramientas compartidas** de creación, adopción y actualización de cursos Netec compatibles con Lab Control. No contiene la identidad ni el proof de publicación de ningún curso particular.

## Selecciona tu flujo

- **Guía rápida del instructor:** [publicar y actualizar sin administrar la plantilla](docs/INSTRUCTOR-QUICKSTART.md).
- **Curso nuevo:** [crear identidad y Labs](docs/INITIALIZE-COURSE.md).
- **Curso existente sin tracking:** [migrar sin modificar instrucciones académicas](EXISTING-COURSE-MIGRATION.md).
- **Curso ya adaptado:** [actualizar runtime de seguimiento/instructor con respaldo](docs/COURSE-TEMPLATE-WORKFLOWS.md).
- **Vincular la URL a Lab Control:** [challenge y proof propio en `.well-known`](docs/COURSE-LINK-WELL-KNOWN.md).
- **Versionado, snapshots y sesiones:** [ciclo de revisiones congeladas](docs/labcontrol-course-revision-lifecycle.md).

## Arquitectura y contratos SPEC

La [documentación técnica SPEC](docs/spec/README.md) describe responsabilidades, automatizaciones, contratos de catálogo y límites del versionado por sesión. Complementa las guías operativas y registra diferencias entre comportamiento implementado y políticas todavía pendientes.

## Componentes compartidos

- `assets/js/lab-demo-context.js`: práctica del instructor, local y aislada del progreso oficial.
- `assets/js/lab-progress.js`: panel y estado local del participante/demostración.
- `assets/js/lab-tracker.js`: sincronización autorizada de participantes, sin enviar progreso del instructor.
- `scripts/create_labs.sh`, `scripts/init_course.mjs`, `scripts/adopt_existing_course.mjs`, `scripts/migrate_existing_course.py` y `scripts/update_existing_course_runtime.mjs`.
- `scripts/write_course_link_proof.mjs`: escribe únicamente el proof público de un challenge específico.
- `scripts/generate_lab_manifest.mjs`, `scripts/generate_course_catalog.mjs`, `scripts/sync_course_catalog.mjs`.

## Regla de mantenimiento

Los cambios reutilizables probados primero en cursos como `Netec-Mx/TRFRM_GCP_INT` deben consolidarse y probarse **aquí** para próximos cursos. Nunca copiar `course.identity.json`, `_data/courses.yml`, secretos o `.well-known/labcontrol-course-link.txt` de un curso real a otro.

No se editan las instrucciones pedagógicas de cursos existentes como parte de una actualización del runtime. Todos los cambios se revisan mediante PR y pruebas de Jekyll.

## Validación y corrección de Step IDs

Antes de generar manifests, utiliza `node scripts/repair_step_ids.mjs --check`. Para detectar y corregir duplicados/saltos con revisión humana, consulta [guía de Step IDs](docs/STEP-ID-REPAIR.md). El modo `--apply` es explícito, crea respaldos y debe evaluarse frente al progreso histórico de Lab Control.

**Automatización al publicar:** en `push main`, si no hay conexión de sincronización Lab Control configurada, GitHub Actions detecta e inserta/corrige los Step IDs y guarda los cambios con `github-actions[bot]` antes de generar manifests y Pages. Si GitHub Actions detecta variables de sincronización Lab Control, se bloquea la renumeración automática para proteger progreso existente. **Advertencia:** que esas variables estén ausentes no garantiza que el curso carezca de progreso histórico; los cursos ya utilizados con LabControl requieren revisión de IDs antes de habilitar ese mecanismo. Consultar [guía de reparación](docs/STEP-ID-REPAIR.md).
