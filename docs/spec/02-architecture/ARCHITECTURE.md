# Arquitectura vigente de webpagesrepo

**Ámbito:** la plantilla central `jorgepas12/webpagesrepo`; descripción basada en sus scripts, layouts y workflows, no en una auditoría de todos los repositorios de cursos adoptados.

## Diagrama de responsabilidades

```text
Instructor / administrador de curso
  └─ edita labs/labN/labN.md en el repositorio del curso
       └─ git push
            ├─ GitHub Actions: valida identidad, IDs y build
            ├─ scripts: genera manifest + course.json + content/lNNN.json
            └─ Jekyll / GitHub Pages: publica sitio y catálogo actual
                                    |
                                    | Sincronizar todo (acción explícita)
                                    v
                              LabControl API + PostgreSQL
                                 ├─ revisiones del curso
                                 ├─ snapshots de Labs
                                 └─ sesiones con revisionId congelado
```

### Responsabilidad de cada capa

| Capa | Propietaria de | No debe hacer |
| --- | --- | --- |
| Repositorio de curso | Markdown, imágenes y configuración académica | Almacenar sesiones/progreso oficial de LabControl |
| `webpagesrepo` | Herramientas, estilos, tracking runtime, validadores y generadores reutilizables | Introducir identidades de un curso real como valores por defecto |
| GitHub Actions / Pages | Construcción y publicación del **estado más reciente** del sitio y catálogo | Cambiar por sí mismo `CourseSession.revisionId` |
| LabControl | Sincronización explícita del catálogo, revisión SemVer, snapshots, matrículas, StepProgress y aprobación | Interpretar la URL viva de Pages como fuente histórica de una sesión congelada |

## Componentes observados

- `_layouts/lab.html`, `_includes/step_label.html`, `_includes/step_image.html` y estilos: presentación de la práctica.
- `assets/js/lab-progress.js`: progreso local y modo demostración.
- `assets/js/lab-tracker.js`: intercambio de tracking con LabControl.
- `assets/js/lab-demo-context.js`: contexto de prueba del instructor sin progreso oficial.
- `scripts/generate_lab_manifest.mjs`: valida IDs y produce estructura rastreable por Lab.
- `scripts/generate_course_catalog.mjs`: produce catálogo público y snapshot de contenido.
- `scripts/repair_step_ids.mjs`: valida y, con `--apply`, reescribe **identificadores**, no texto académico.
- `scripts/prepare_course_build.mjs`: en checkout efímero, copia exclusivamente tres archivos JS centrales; no reescribe Labs ni layouts.
- `.github/workflows/pages.yml`: pipeline de plantilla que incluye validación, corrección condicional de Step IDs, generación y publicación.
- `.github/workflows/labcontrol-reusable.yml`: variante de validación central de cursos con `workflow_call`, no equivalente sin más a `pages.yml`.

## Variantes de incorporación

1. **Curso nuevo:** inicializador de identidad y scaffold, luego contenido y publicación.
2. **Curso existente sin tracking:** bootstrap/migración supervisada y verificación de `git diff`; preservar instrucciones.
3. **Curso existente con tracking:** actualizar herramientas/loader sin volver a migrar contenido ni cambiar IDs publicados.
4. **Runtime compartido central:** un caller workflow del curso consulta un SHA inmóvil del repositorio central y aplica tooling solo durante el build. No asumir que todos los cursos usan ya esta variante.

**Importante:** en `docs/CENTRAL-COURSE-ONBOARDING.md` se registran pruebas de CKA y trabajo todavía pendiente. No interpretar una prueba de empaquetado sin deploy como despliegue en todos los cursos.

## Consistencia por revisión

La publicación de una versión nueva de Pages no debe cambiar una sesión congelada. El catálogo y la página publicada son mutables; los manifests y snapshots retenidos por LabControl son la referencia académica histórica. La reproducción exacta de contenido Jekyll antiguo puede requerir incluir assets y comportamiento de Liquid; se gestiona en LabControl (Issue #116), **no se afirma resuelto aquí**.

## Límites y puntos abiertos

- El paso legacy de sincronización de manifests configurado con `LABCONTROL_API_URL` + `LABCONTROL_SYNC_TOKEN` existe en `pages.yml`; confirmar por curso su habilitación y efecto antes de considerarlo compatible con el procedimiento basado en `Sincronizar todo`.
- El workflow central y el workflow completo de Pages tienen permisos y capacidades diferentes. No instalar dos workflows de despliegue simultáneos para un mismo curso.
- Cualquier garantía de recuperación de imágenes históricas requiere comprobación adicional.
