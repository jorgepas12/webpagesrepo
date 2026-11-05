# Diagnóstico operativo de webpagesrepo

Usar esta guía antes de editar cursos reales. No pegar tokens, contraseñas ni enlaces privados de sesión en Issues o logs compartidos.

## Árbol rápido de decisión

```text
¿No publica Pages?
 ├─ Falla Github Actions / Jekyll → revisar workflow, frontmatter, includes y assets
 └─ Build correcto, sitio incompleto → revisar artefactos, baseurl y deploy

¿Publica Pages pero LabControl no detecta cambios?
 ├─ ¿course.json y snapshots nuevos están publicados?
 ├─ ¿se pulsó "Sincronizar todo" en LabControl?
 └─ ¿hay diferencias reales de catálogo/hashes? Un commit no garantiza revisión

¿Progreso incorrecto?
 ├─ ¿IDs de Steps cambiaron?
 ├─ ¿modo instructor demo vs participante real?
 ├─ ¿sessionId/revisionId correctos?
 └─ ¿sesión completada o token expirado (401)?

¿Sesión antigua ve contenido nuevo?
 └─ Comprobar visor de revisión congelada en LabControl; Pages siempre publica lo último.
```

## Tabla de síntomas

| Síntoma | Diagnóstico inicial | Acción segura |
| --- | --- | --- |
| `step_id` ausente/duplicado | `node scripts/repair_step_ids.mjs --check` y revisión del Markdown | Dry-run y diff; `--apply` solo tras revisar historial |
| Identidad de curso contradictoria | Comparar `course.identity.json`, `_data/courses.yml` y frontmatter | No reutilizar identidad de otro curso |
| `generate_lab_manifest.mjs` falla | Revisar asociación Task–Step e IDs estables | Corregir metadata mínima, no instrucciones |
| `course.json` ausente | Verificar job de generación y ruta `labcontrol/<course_id>/` | Regenerar en clon seguro y repetir tests |
| Snapshot hash mismatch | Comparar `content.hash` y JSON de `content/lNNN.json` | Repetir build desde misma fuente; no alterar hashes manualmente |
| Error Jekyll `include` | Comprobar `_includes`, frontmatter y escape Liquid | Corregir referencia concreta, no reemplazar todo el layout |
| Assets/imágenes 404 | Comprobar mayúsculas, ruta relativa, `baseurl` | Ajustar rutas versionadas sin tocar tracking IDs |
| JS de progreso no carga | Orden de `lab-demo-context.js`, `lab-progress.js`, `lab-tracker.js` | Usar tests y actualizar runtime de forma controlada |
| Instructor aparece en reportes | Revisar enlace `#lab-demo`, token y contexto demo | Verificar aislamiento local, no crear matrícula ficticia |
| `401` tracking | Revisar vigencia de acceso y estado de CourseSession | No borrar cola offline ni forzar progreso en API |
| Catálogo nuevo, sesión antigua | `CourseSession.revisionId` y snapshot en LabControl | No migrar sin decisión de instructor |
| Dos deployments compiten | Enumerar workflows con permiso `pages: write` | Dejar un único despliegue habilitado |

## Comandos de validación (raíz del curso adaptado)

```bash
node scripts/repair_step_ids.mjs --check
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
node scripts/generate_lab_manifest.mjs --all
node scripts/generate_course_catalog.mjs
bundle exec jekyll build --trace
git diff --check
```

**Precaución:** los generadores escriben artefactos y se deben ejecutar en copia de trabajo/checkout donde esa escritura sea esperada. Verificar `git status` antes de preparar un commit.

## Recolección mínima de evidencia

Para registrar un incidente incluir:
- repositorio del curso y commit, sin credenciales;
- ID de Lab afectado y de revisión de sesión cuando sea necesario;
- workflow y job fallido, primera línea de error;
- rutas y hashes de catálogo/snapshot involucrados;
- diff mínimo y alcance sobre participantes;
- paso de reproducción, resultados esperado/observado.

## Escalamientos

- **Publicación / runtime compartido:** `webpagesrepo`, Issues #40 / #42 según alcance.
- **IDs y catálogo:** `webpagesrepo` Issue #26 o incidencia nueva.
- **Acceso, sincronización y progreso por sesión:** repositorio `lab-control` y sus Issues.
- **401 / cola offline:** `webpagesrepo` Issue #21.
- **Visor de versiones históricas:** LabControl Issue #116.

Complementos: [contrato de automatización](../02-architecture/AUTOMATION-CONTRACT.md), [compatibilidad](../03-integration/VERSIONING-AND-COMPATIBILITY.md), [rollback](ROLLBACK-AND-RECOVERY.md).
