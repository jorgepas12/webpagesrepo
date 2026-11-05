# Pruebas y liberación de cambios en webpagesrepo

## Objetivo

Evitar que una actualización de la plantilla, scripts, runtime central o workflows cambie accidentalmente el contenido académico, el contrato de catálogo o los identificadores de progreso.

## Matriz por tipo de cambio

| Cambio | Pruebas y revisión obligatorias |
| --- | --- |
| Solo Markdown de `docs/` | Enlaces relativos, terminología y alcance real, checks CI disponibles |
| JS compartido / layout | Tests de instructor/demo, tracker, orden de loaders, build Jekyll y diff académico |
| Manifest/catalog generators | Tests `test_lab_manifest.mjs`, `test_course_catalog.mjs`, snapshots y estabilidad de ID |
| Repair Step IDs | Tests de reparación/workflow, dry-run sobre cursos de prueba y evaluación del historial |
| Bootstrap/adopción | Tests de inicialización, migración, identidad por curso, diffs y rollback |
| Workflows Actions/Pages | Prueba de build + empaquetado sin deploy, permisos mínimos, no doble deploy, pinning de SHA |
| Integración con LabControl | Distinguir Pages publicado de `Sincronizar todo`; comprobar sesiones congeladas |

## Batería principal en la raíz de webpagesrepo

```bash
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
node --test scripts/test_repair_step_ids.mjs
node --test scripts/test_step_id_workflow.mjs
node scripts/test_instructor_demo.mjs
node scripts/test_lab_tracker.mjs
node scripts/test_init_course.mjs
node scripts/test_adopt_existing_course.mjs
node scripts/test_prepare_course_build.mjs
python scripts/test_migrate_existing_course.py
git diff --check
```

Los scripts deben existir en la rama que se ejecuta. El resultado de estas pruebas debe observarse realmente; no afirmar que están aprobadas solo porque se enumeran aquí. Para integración Jekyll:

```bash
bundle exec jekyll build --trace
```

## Aceptación de release

- [ ] El PR describe alcance, archivos y objetivo del cambio.
- [ ] Tests relevantes en CI terminan con resultado satisfactorio.
- [ ] Se revisó el diff de `labs/`, identidad y `_data/`, si afecta un curso existente.
- [ ] La actualización del tooling central usa SHA y conserva alternativa de rollback.
- [ ] No hay credenciales ni pruebas de vinculación copiadas de otros cursos.
- [ ] Catálogo y snapshots funcionan con el mismo `courseId`, manifests y hashes.
- [ ] No se renumeran Steps de un curso con progreso histórico sin evaluación específica.
- [ ] Un curso de prueba validó el nuevo flujo; si hay publicación real, solo un workflow despliega.
- [ ] No se desencadenó creación/migración inesperada de una sesión en LabControl.
- [ ] PR fusionado en `main` únicamente cuando está listo; no dejar drafts sin decisión.

## Flujos de publicación

**Cambio en `webpagesrepo`:** tests → PR → merge → actualizar referencia SHA en cursos que usan runtime central por PR individual → validar Pages y participante.

**Cambio académico en un curso:** edit → push → Pages genera catálogo actual → instructor ejecuta `Sincronizar todo` en LabControl → verifica revisión → migración de sesión solo si se confirma.

## Niveles de prueba

1. **Unitarias/contrato:** generadores, validaciones, loaders, hashes y serialización.
2. **Integración de repositorio:** fixture de curso nuevo, curso existente con Labs, adopción central sin mutar Markdown.
3. **Publicación:** build real, empaquetado y prueba de assets en Pages.
4. **Regresión de negocio:** 2 sesiones en revisiones distintas, IDs oficiales, demo separado, tracking y aprobación.
5. **Operación:** rollback al SHA anterior y reproducción de último build válido.

## Límites de la validación

La existencia de workflows `*-regression.yml` no prueba cobertura exhaustiva ni autoriza despliegues automáticos. La validación histórica de Jekyll en Pages puede necesitar pruebas específicas de assets y Liquid que no cubre un test de catálogo.

Referencias: [AUTOMATION-CONTRACT.md](../02-architecture/AUTOMATION-CONTRACT.md), [RUNTIME-LIFECYCLE.md](../02-architecture/RUNTIME-LIFECYCLE.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
