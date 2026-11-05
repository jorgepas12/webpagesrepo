# Guía maestra — Crear, adoptar y actualizar cursos para Lab Control

**Fuente:** `jorgepas12/webpagesrepo`. La plantilla proporciona runtime Jekyll (Steps/Labs), manifests, snapshots, sincronización y soporte de práctica del instructor. El curso `Netec-Mx/TRFRM_GCP_INT` es un ejemplo de implementación, **no una fuente desde la que se deban copiar datos particulares de un curso**.

## ¿Qué tipo de curso tienes?

| Tipo | Situación | Ruta recomendada |
|---|---|---|
| **Nuevo desde cero** | No existen Labs ni identidad | `init_course.mjs` → `create_labs.sh` → contenido → manifests → Pages → Lab Control |
| **Existente sin tracking** | Ya existen Labs con instrucciones y `step_label.html` | `migrate_existing_course.py` dry-run → apply → configurar identidad con `adopt_existing_course.mjs` cuando aplique → manifests y validación |
| **Existente con tracking** | Ya tiene `course_id`, `lab_id`, Tasks/Steps y scripts | **No volver a migrar Labs.** `update_existing_course_runtime.mjs` en dry-run → apply para actualizar sólo JS y loader de layout |
| **Vinculación de URL** | Curso publicado y quien administra acredita la URL | Challenge → proof individual en `.well-known` → Pages → confirmación desde Lab Control |

## A. Curso nuevo
En el repositorio creado **desde esta plantilla**:

```bash
node scripts/init_course.mjs
# Verifica course.identity.json y _data/courses.yml
bash scripts/create_labs.sh 5
node scripts/generate_lab_manifest.mjs --all
node scripts/generate_course_catalog.mjs
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
bundle exec jekyll build --trace
```

`init_course.mjs` no sobreescribe una identidad existente. `create_labs.sh` toma automáticamente el Tracking ID de `course.identity.json` y rechaza un ID contradictorio. Revisa `_config.yml` (URL, baseurl, repository, `labcontrol_api_url`) y elimina ejemplos de Labs antes de publicar. El nombre, código y tracking ID son únicos de este curso.

## B. Curso existente **sin tracking**
Desde un clon actualizado de la plantilla, usando rutas reales de ambos repositorios:

```bash
python scripts/migrate_existing_course.py \
  --template . \
  --target "/ruta/al/curso-existente" \
  --course-id cursoexistente
```

Revisar el reporte; después `--apply` ejecuta la migración con copia de instrucciones previas en `.migration-backup-labcontrol/`. Conserva el texto de las prácticas, añade frontmatter e IDs donde el formato sea reconocido, copia herramientas **solo si no existían** y añade `.well-known` a Jekyll cuando falta. Falla si detecta Labs previamente migrados o una estructura ambigua: no forzar.

Para crear `course.identity.json` en el curso ya existente, cuando aún no lo tenga y `_data/courses.yml` ya incluya el Tracking ID:

```bash
node scripts/adopt_existing_course.mjs \
  --code CURSO_EXISTENTE \
  --tracking-id cursoexistente \
  --name "Nombre real del curso"
```

**El código administrativo (`code`) puede diferir del Tracking ID**; usa valores existentes sin inventar ni reemplazar identidades. El validador de `adopt_existing_course.mjs` admite guiones bajos en código legado; `init_course.mjs` de nuevos cursos usa un formato compacto distinto.

## C. Curso existente **ya adaptado**: actualizar la plantilla sin tocar Labs

En la carpeta de `webpagesrepo` (fuente actualizada):

```bash
node scripts/update_existing_course_runtime.mjs \
  --target "/ruta/al/repositorio-del-curso"
```

El dry-run enumera únicamente archivos técnicos a modificar. Tras revisión del diff y backup del repositorio destino:

```bash
node scripts/update_existing_course_runtime.mjs \
  --target "/ruta/al/repositorio-del-curso" --apply
```

Actualiza los tres archivos `assets/js/lab-demo-context.js`, `assets/js/lab-progress.js` y `assets/js/lab-tracker.js`; incorpora el loader de demo **antes** de `lab-progress.js` en `_layouts/default.html`. Si el layout no contiene el punto de integración esperado, falla y solicita ajuste manual. Crea backup de los originales en `.labcontrol-template-backup/<timestamp>/` antes de escribir, lo ignora en Git, y puede repetirse sin cambios. **No modifica archivos `labs/labN/labN.md`**, IDs, contenido, datos del curso ni configuración de Lab Control.

Después ejecutar la suite del curso y `bundle exec jekyll build --trace`. Para cursos cuyos layouts fueron muy personalizados, revisar manualmente antes de publicar.

## D. Modo práctica del instructor

Lab Control puede abrir una práctica con fragmento `#lab-demo=<sessionId>` y un `lab-return` de regreso al perfil de práctica. El nuevo `lab-demo-context.js`:

- valida que el regreso sea HTTPS, al origen configurado en `site.labcontrol_api_url`, a `/participant` y a la misma sesión;
- separa `localStorage` mediante la clave `netec:instructorDemoProgress:<sessionId>:<courseId>:<labId>`;
- conserva la navegación entre Labs con contexto explícito `lab-demo`;
- muestra un enlace para volver a Lab Control cuando su URL está validada;
- **no** usa el token oficial de participante para enviar progreso ni crea una cola de sincronización remota en modo demo.

Al abrir sin `lab-demo` o con `lab-access` se utiliza el flujo normal del participante. El demo es intencionalmente **local/no oficial** y no debe aparecer como Enrollment en reportes.

## E. Publicación, sincronización y pruebas

```bash
node scripts/test_instructor_demo.mjs
node scripts/test_instructor_demo_links.mjs
node scripts/test_instructor_demo_navigation.mjs
node scripts/test_instructor_demo_return.mjs
node scripts/test_instructor_demo_tracker.mjs
node scripts/test_instructor_demo_ui.mjs
node scripts/test_lab_progress_storage.mjs
node scripts/test_lab_tracker.mjs
node --test scripts/test_update_existing_course_runtime.mjs
python scripts/test_migrate_existing_course.py
node scripts/test_authoring_flow.mjs
node scripts/test_course_catalog.mjs
bundle exec jekyll build --trace
git diff --check
```

Para registrar/sincronizar con Lab Control se necesita el endpoint **desplegado** y el token adecuado; el script no debe publicar secretos. La generación de catálogos/snapshots y Pages no actualiza automáticamente la revisión congelada de sesiones: la selección/migración de revisión se controla desde Lab Control.

Para vincular la URL ver [`.well-known` y challenge](COURSE-LINK-WELL-KNOWN.md). Para migración inicial ver [guía original](../EXISTING-COURSE-MIGRATION.md). Para lifecycle ver [revisiones](labcontrol-course-revision-lifecycle.md).

## Checklist de reutilización

- [ ] Cada curso posee su propia identidad (no copiar `course.identity.json` de otro).
- [ ] Cada URL tiene su challenge/proof individual y `.well-known` incluido en Pages.
- [ ] Frontmatter, Task IDs, Step IDs y Course ID conservan identidad histórica.
- [ ] `lab-demo-context.js` carga antes de progreso y tracking.
- [ ] Instructor demo se mantiene local y aislado de participante real.
- [ ] Se ejecutan tests de nuevo/existente según corresponda.
- [ ] Las instrucciones académicas del curso son idénticas.
- [ ] El commit y PR son del repositorio correcto; publicar Pages es decisión separada.

## F. Validación de IDs antes de generar catálogo

Ejecutar `node scripts/repair_step_ids.mjs --check` antes de publicar. Si falla por IDs duplicados, saltos o desorden, ejecutar el dry-run `node scripts/repair_step_ids.mjs`, revisar el impacto en revisiones congeladas/progreso, y sólo entonces considerar `--apply`. Ver [procedimiento de reparación de Steps](STEP-ID-REPAIR.md). En la variante **`pages.yml` de esta plantilla sí existe reparación automática condicional en GitHub Actions**: se aplica únicamente cuando no hay variables de sincronización LabControl configuradas. No debe interpretarse como una operación segura para un curso con progreso histórico; véase la sección G y el [contrato de automatización](spec/02-architecture/AUTOMATION-CONTRACT.md).

## G. Autocorrección al hacer push

En `main`, `pages.yml` inserta/corrige automáticamente IDs faltantes, duplicados o saltos **sólo si no hay conexión de sincronización Lab Control configurada**. El bot confirma los cambios en GitHub y después el mismo workflow publica el catálogo. Si se detectan variables de sincronización, el workflow falla y exige revisión manual para evitar daño a progreso histórico. **La ausencia de variables no garantiza que no existan sesiones o revisiones en LabControl.** No habilitar autocorrección sin evaluar ese caso. Ver [automatización de Step IDs](STEP-ID-REPAIR.md).
