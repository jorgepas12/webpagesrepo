# Ciclo de vida del runtime central de cursos

**Alcance:** procedimiento de operación y despliegue del runtime compartido. Refleja el comportamiento de `scripts/prepare_course_build.mjs`, `.github/workflows/labcontrol-reusable.yml` y las guías de adopción a 05-11-2026.

## Objetivo

Permitir que un instructor continúe editando **solo el repositorio de su curso**. El equipo de plataforma gestiona las herramientas compartidas sin copiar manualmente cada actualización ni modificar instrucciones académicas.

## Componentes y límites

- Código fuente compartido: `jorgepas12/webpagesrepo`.
- Runtime que `prepare_course_build.mjs` copia al checkout efímero: `assets/js/lab-demo-context.js`, `assets/js/lab-progress.js`, `assets/js/lab-tracker.js`.
- Archivos **que no modifica** el preparador: `labs/`, `course.identity.json`, `_config.yml`, `_data/`, layouts e includes.
- Entrada autorizada de cursos centralizados: caller workflow en el repositorio del curso, invocando el workflow reutilizable con una **referencia inmutable**.
- Publicación: solo cuando la configuración del curso habilita el despliegue de Pages; no mantener dos workflows que desplieguen el mismo sitio.

**Advertencia:** `pages.yml` de la plantilla completa y `labcontrol-reusable.yml` no son intercambiables sin verificar sus permisos, tests y condiciones. El primero puede hacer commit de Step IDs bajo ciertas condiciones. Ver [contrato de automatización](AUTOMATION-CONTRACT.md).

## Procedimiento de actualización controlada

1. Partir de un cambio central en `webpagesrepo` aprobado por PR; registrar el SHA completo del commit revisado.
2. Verificar en la rama central al menos tests de runtime, manifests, catálogo, Step IDs y build Jekyll. Ejecutar el workflow relevante de GitHub Actions; una prueba local no reemplaza la comprobación CI.
3. Identificar qué cursos adoptaron runtime central por SHA y cuáles tienen copias locales de JS. No asumir adopción universal.
4. En rama nueva del **repositorio del curso**, actualizar solo el SHA de `webpagesrepo` que usa el caller, sin tocar `labs/`, `_data/`, identidad ni proofs.
5. Comprobar el diff, integridad de contenido académico, identidad `course_id`/`trackingId`, orden de loaders y estabilidad de los IDs oficiales.
6. Ejecutar validación y empaquetado de Pages **sin desplegar**, cuando exista ese modo; abrir PR en el repositorio del curso.
7. Al aprobar, activar un **único** workflow de Pages y validar publicación de `course.json`, `content/lNNN.json`, assets JS y HTML.
8. Verificar pantalla de participante, demo instructor y tracking real en entorno seguro; comprobar que ninguna sesión cambió de revisión automáticamente.
9. Documentar el SHA previo y nuevo, PRs, tests y plan de reversión.

## Prechecks mínimos

| Revisión | Resultado esperado |
| --- | --- |
| `git diff -- labs/` | Sin cambios en instrucciones durante actualización de runtime |
| `course.identity.json` | Misma identidad de curso |
| `repair_step_ids.mjs --check` | Sin IDs nuevos/renumerados inesperados |
| Pruebas de manifiesto/catálogo | Pasa sin reordenar identidades de Steps |
| Build Jekyll | Pasa y produce HTML, JS y catálogo |
| Autorización de Pages | Solo un workflow de deploy |
| Sesiones de LabControl | Revisión congelada y progreso intactos |

## Recuperación

Si la versión central nueva provoca regresión, revertir el cambio de SHA en el caller del curso mediante un nuevo commit/PR y volver a publicar la versión conocida como buena. No restaurar instrucciones académicas desde otro repositorio ni copiar tokens. Para procedimientos detallados consultar [ROLLBACK-AND-RECOVERY.md](../04-operations/ROLLBACK-AND-RECOVERY.md).

## Política de versiones

- **SHA Git de `webpagesrepo`**: versión de tooling de compilación.
- **SHA de repositorio de curso**: contenido Git de la práctica.
- **`course.json.version`**: versión de esquema del artefacto.
- **SemVer de LabControl**: revisión académica registrada tras sincronización.
- **`CourseSession.revisionId`**: revisión congelada de una impartición.

No convertir automáticamente una actualización del runtime en una migración de sesión.

## Riesgos conocidos / trabajo posterior

El adopción central en CKA registra ensayos de empaquetado, pero se debe comprobar por separado qué caller está productivo en cada curso. La mera existencia del workflow reutilizable en `webpagesrepo` no prueba que un curso lo use. Nunca publicar simultáneamente con el pipeline legado sin una prueba controlada.
