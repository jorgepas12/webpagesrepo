# Contrato de automatización de publicación y reparación

**Fuente comprobada:** `.github/workflows/pages.yml`, `labcontrol-reusable.yml`, `scripts/repair_step_ids.mjs`, `scripts/generate_lab_manifest.mjs`, `scripts/generate_course_catalog.mjs` y `scripts/prepare_course_build.mjs`.

## Eventos y efectos observados

| Automatización | Evento / condición | Escritura posible | Límite |
| --- | --- | --- | --- |
| `pages.yml` | `push` en `main` o `workflow_dispatch` | Genera artefactos y despliega Pages | No migra revisiones de sesiones |
| Reparación en `pages.yml` | Falla `repair_step_ids.mjs --check` **y** faltan variables de conexión LabControl | Ejecuta `--apply`, hace commit/push de IDs a `main` como bot | Sí puede cambiar `sNNN`; no modifica instrucciones académicas intencionalmente |
| Reparación protegida | Existe `LABCONTROL_API_URL` **o** `LABCONTROL_SYNC_TOKEN` | **No corrige:** falla pipeline y requiere revisión | La presencia/ausencia de variables es un proxy de integración, **no prueba** de historial |
| Generación de catálogo | Tras validación en workflow | `course.json`, manifests y snapshots en artefacto/site | No decide SemVer ni conserva por sí misma versiones antiguas en Pages |
| Sync legacy de manifests | Ambas variables configuradas | Invoca `scripts/sync_lab_manifests.mjs --all` | Confirmar semántica de API y autorización; distinguir de importar revisión/sesión |
| `labcontrol-reusable.yml` | Llamada desde curso | Valida y empaqueta según parámetros | No equiparar sus permisos `contents: read` con `pages.yml` |
| `prepare_course_build.mjs` | Ejecución explícita en checkout efímero | Solo tres JS del runtime central | Nunca ejecutarlo con `--apply` sobre carpeta de trabajo del instructor |

## Regla editorial de Step IDs

1. Antes de publicar, ejecutar `node scripts/repair_step_ids.mjs --check`.
2. Si el curso **ya tiene progreso oficial, revisiones o sesiones**, **no renumerar IDs a ciegas**, aunque falten las variables de conexión en GitHub. Escalar y revisar el impacto en StepProgress.
3. El comportamiento implementado en la plantilla es **autorreparar en `pages.yml` si falta configuración de conexión**, pero eso no equivale a una política segura para cualquier repositorio adoptado. Esta brecha debe tratarse como riesgo conocido.
4. El workflow usa comprobación del HEAD remoto antes del push del bot para reducir conflictos; no sustituye un PR de revisión.
5. Cuando hay conexión configurada, el workflow falla en vez de reparar automáticamente. No forzar sincronización de catálogo ni migración por ese error.

## Contrato del instructor

- El instructor modifica únicamente sus Labs y hace `commit/push`.
- Si CI detecta un problema de IDs en un curso ya operativo, debe abrirse un flujo de corrección controlada; **no** se debe pedir al instructor que renumere todos los Steps sin comparar históricos.
- GitHub Pages publica el último contenido construido. El instructor decide **Sincronizar todo** en LabControl y posteriormente migrar una sesión si lo requiere.

## Validación previa a merge o publicación

- `node scripts/test_lab_manifest.mjs` y `node scripts/test_course_catalog.mjs`.
- `node --test scripts/test_repair_step_ids.mjs` y `node --test scripts/test_step_id_workflow.mjs`.
- `node scripts/repair_step_ids.mjs --check` en un curso representativo.
- Construcción `bundle exec jekyll build --trace`.
- Para cursos existentes, comparar `git diff -- labs/` y comprobar que ninguna instrucción pedagógica se reescribió.
- Verificar `course.json` + snapshots de Pages; comprobar manualmente que LabControl **no** creó una revisión/sesión inesperada.

## No objetivos de esta fase documental

No cambiar permisos del workflow, eliminar sincronización legacy, mutar la política de auto-commit ni modificar scripts. Estos ajustes requieren diagnóstico, Issue/PR independiente y pruebas de regresión.
