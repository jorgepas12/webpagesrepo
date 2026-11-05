# Contrato de catálogo, manifests y snapshots

**Estado:** descripción del formato emitido actualmente por `scripts/generate_course_catalog.mjs` (constante `CATALOG_VERSION = 1`) y `scripts/generate_lab_manifest.mjs` (`MANIFEST_VERSION = 1`). No interpretar `version: 1` como SemVer del curso.

## Identidades estables

- `course_id`: slug usado por el contenido Jekyll/manifests, por ejemplo `terraform-aws-essentials`.
- `course.identity.json`: identidad compacta y `trackingId` por repositorio, generada individualmente; no copiar entre cursos.
- `lab_id`: `lNNN`; `task_id`: `tNNN`; `step_id`: `sNNN`. Son **identificadores**, no números de posición; conservarlos entre revisiones siempre que representen el mismo elemento.
- Un Lab retirado de tracking no equivale a eliminar su historial académico en LabControl.

Véase [tracking-identifiers.md](../../tracking-identifiers.md) para el contrato detallado.

## Artefactos del generador

La salida se publica bajo `labcontrol/<course_id>/` del sitio:

```text
labcontrol/<course_id>/
  course.json
  content/
    l001.json
    l002.json
    ...
```

`course.json` incluye:

- `version: 1` — versión de **esquema del catálogo**.
- `courseId` — identificador del curso.
- `sourceCommitSha` — commit fuente detectado por entorno CI o Git cuando está disponible.
- `labs[]` — entradas con `labId`, `number`, `position`, `name`, `durationMinutes`, `contentPath`, `content: { path, hash }` y `manifest`.

Por Lab se escribe `content/lNNN.json`:

```json
{
  "version": 1,
  "labId": "l001",
  "format": "markdown",
  "sourcePath": "labs/lab1/lab1.md",
  "hash": "sha256:<digest>",
  "markdown": "..."
}
```

El JSON anterior es **ilustrativo**: no reutilizar una huella de prueba como hash real ni asumir que el Markdown puede reproducirse sin Liquid/includes/assets.

## Hashes y detección de cambios

- `content.hash` referencia el hash SHA-256 del **Markdown fuente normalizado**; no prueba equivalencia pedagógica de cambios cosméticos.
- El manifest contiene estructura de tareas/pasos que LabControl puede comparar para determinar diferencias de tracking.
- `sourceCommitSha` da procedencia del artefacto, **no** significa que todo commit origine una revisión SemVer nueva.
- La revisión semántica definitiva y el vínculo con `CourseSession.revisionId` pertenecen a LabControl, no a `webpagesrepo`.

## Invariantes para consumidores

1. Interpretar los campos `version` como versiones de **formato**, no de curso.
2. Validar identificadores, referencias relativas y hashes antes de importar snapshots.
3. El `content.path` es relativo a `course.json`, no una URL inmutable de todas las versiones históricas.
4. Publicar una nueva salida sobre GitHub Pages sustituye la **representación actual**. Conservar el contenido histórico por sesión corresponde a la persistencia de LabControl.
5. No utilizar directamente el `course.json` actual para calcular denominadores de una sesión congelada; resolver su revisión oficial y manifest histórico.
6. Mantener compatibilidad/validaciones cuando evolucione el esquema del catálogo; no cambiar silenciosamente formatos sin actualizar tests y contrato.

## Diagnósticos básicos

- Ejecutar `node scripts/generate_lab_manifest.mjs --all`, luego `node scripts/generate_course_catalog.mjs`, y `node scripts/test_course_catalog.mjs`.
- Verificar que el `courseId`, `sourceCommitSha` y entradas de `labs` correspondan al curso publicado.
- Inspeccionar los archivos `content/lNNN.json` y comparar `hash` con lo referenciado desde `course.json`.
- Para retiro/restauración, revisar [labcontrol-course-revision-lifecycle.md](../../labcontrol-course-revision-lifecycle.md).

## Fuera de alcance

Este contrato no define endpoints privados de tracking/approval de LabControl ni garantiza el renderizado histórico fiel de Jekyll. Ambos requieren documentos/validaciones específicos en `lab-control`.
