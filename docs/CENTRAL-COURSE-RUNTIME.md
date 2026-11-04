# Runtime técnico central para cursos Jekyll — Issue #40

## Objetivo

El instructor solo edita contenido propio del curso y hace **commit/push a main**. El workflow descarga una versión **fijada por SHA** de `jorgepas12/webpagesrepo`, prepara los recursos compartidos en el **checkout efímero** de GitHub Actions, valida y publica GitHub Pages. No se instalan paquetes ni se ejecutan migraciones en el equipo del instructor; los cambios del runner no se suben automáticamente al Git remoto.

## Contrato del preparador

```bash
node .central-webpagesrepo/scripts/prepare_course_build.mjs --target . --check
node .central-webpagesrepo/scripts/prepare_course_build.mjs --target . --apply
```

- Fuente central: `assets/js/lab-demo-context.js`, `lab-progress.js` y `lab-tracker.js`.
- Solo se copian esos tres recursos, si sus bytes difieren; `--apply` es idempotente.
- Valida `course.identity.json`, existencia de Jekyll layouts y orden de loaders antes de mutar.
- **No reescribe** `labs/`, `_data/`, `course.identity.json`, `_config.yml`, layouts, includes ni catálogos existentes; no arregla IDs automáticamente en cursos ya sincronizados.
- Los generadores centrales de manifests/catálogo se ejecutan a continuación sobre el checkout del curso; el workflow publica el sitio con Jekyll.
- Los JS versionados en cada curso pueden mantenerse inicialmente como fallback, hasta validar el build efímero y no necesitar su actualización manual. Si se retiran, el preparador los crea en el runner antes de Jekyll.
- Una ejecución en local con `--apply` modifica archivos: **no ejecutarlo en el working copy del instructor**; solo en CI o un clon desechable.

## Fijación de versiones, actualización y rollback

**No** hacer checkout de `main` central en el workflow de cursos productivos; fijar el `ref:` a un SHA validado. La modificación de scripts centrales no actualiza por sí sola CKA. Se necesita PR en cada curso para actualizar únicamente la referencia a una versión validada de `webpagesrepo`; comparar GitHub Actions y catálogo antes de merge. Si hay regresión, restaurar el SHA anterior en el workflow y volver a publicar.

El workflow de ejemplo `docs/examples/standard-course-pages.yml` incluye el nuevo paso `prepare_course_build.mjs` **antes** de validar el runtime y generar catálogos. Para cursos existentes, actualizar su workflow con un PR específico después de pasar pruebas contra su propio catálogo.

## Sincronización de LabControl: explícita

Publicar JSON actualizado en Pages no implica que la base de datos de LabControl haya creado revisión nueva. La sincronización puede hacerse mediante el botón **Sincronizar todo** del curso, o mediante un flujo machine-to-machine autorizado y configurado con los secretos correctos. No guardar tokens en archivos ni logs. Las sesiones activas o congeladas mantienen sus revisiones; no migrarlas automáticamente.

## Pruebas antes de publicar

```bash
node --test scripts/test_prepare_course_build.mjs
```

`.github/workflows/central-runtime-regression.yml` usa CKA como fixture externo de **solo lectura**: crea checkout temporal, ejecuta el preparador dos veces (idempotencia), verifica identidad y secuencia de Step IDs, regenera 8 manifests y catálogo (8 labs, 55 tareas, 448 pasos), comprueba que Markdown/layouts no cambiaron y construye el sitio Jekyll. **Nunca hace push a CKA ni sincroniza su base de datos.**

## Pendiente en próximos PR de adopción

1. Activar el paso y actualizar SHA fijado en `Netec-Mx/CKA-Priv-` con PR y build; medir comportamiento antes de retirar copias de scripts.
2. Eliminar **solo scripts centrales duplicados** del curso tras un despliegue probado (no los scripts propios del instructor). Evitar eliminar metadata/runtimes sin validar.
3. Repetir con `Netec-Mx/TRFRM_GCP_INT` y otros cursos. 
