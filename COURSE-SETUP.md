# Crear un curso nuevo desde webpagesrepo

Esta plantilla conserva Jekyll, navegación, estilos, seguimiento local y contratos públicos de Lab Control.

## Crear repositorio

1. En GitHub, configura **webpagesrepo** como *Template repository* en Settings → General.
2. Pulsa **Use this template → Create a new repository**.
3. Clona el repositorio nuevo y abre Git Bash en su raíz.
4. Ejecuta, por ejemplo:

```bash
node scripts/init_course.mjs \
  --repo Netec-Mx/NUEVO_CURSO \
  --id nuevo-curso \
  --title "Nombre oficial del curso" \
  --labs 5 \
  --intro "Descripción breve del curso"
```

El inicializador **solo admite una copia sin contenido real**. Rechaza los repositorios con laboratorios ya elaborados y nunca debe ejecutarse para migrar un curso publicado.

## Qué genera

- `_config.yml`: dominio y baseurl del repositorio.
- `_data/courses.yml`: entradas iniciales, que el instructor debe completar.
- `_data/labcontrol-identities.yml`: registro nuevo y exclusivo del curso.
- `labs/labN/labN.md`: frontmatter con `course_id`, `lab_id`, `tracking: true`, tareas y pasos rastreables.
- `labcontrol/<course_id>/course.json`: catálogo público y artefactos de contenido al generar los manifests.

## Trabajo del instructor

Completa títulos, duraciones, introducciones, imágenes, instrucciones, tareas, resultados y referencias. No renumeres `lab_id`, `tracking_task_id` ni los `id` de `step_label.html` publicados.

El contenido base sigue teniendo marcadores intencionales: **no lo publiques hasta sustituirlos y validar todos los labs**.

## Verificar antes de publicar

```bash
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
node scripts/test_lab_id_registry.mjs
node scripts/test_authoring_flow.mjs
node scripts/generate_lab_manifest.mjs --all
node scripts/generate_course_catalog.mjs
bundle exec jekyll build
```

En GitHub Pages, configura la publicación mediante GitHub Actions. Una vez publicado, comprueba que responde:

```text
https://OWNER.github.io/REPO/labcontrol/<course_id>/course.json
```

En Lab Control, registra exactamente el mismo `Tracking ID`, guarda la URL base del contenido y ejecuta **Sincronizar todo**. No coloques tokens de instructor ni de sincronización en `_config.yml` ni en archivos publicados.

## Migraciones de cursos existentes

**No ejecutes `init_course.mjs` sobre un repositorio con contenido real.** Para adaptar cursos existentes (como TRFRM_GCP_INT), usa una rama y PR de migración selectiva conservando los `labN.md` y sus imágenes. Añade el tracking de manera explícita y valida cada manifest antes de sincronizar con producción.
