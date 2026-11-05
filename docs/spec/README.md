# Especificaciones técnicas — webpagesrepo

**Estado:** documentación del comportamiento observado en `main` al 05-11-2026. Estas especificaciones **no cambian código**, ni constituyen por sí mismas pruebas de producción.

## Propósito y límites

`webpagesrepo` provee la plantilla Jekyll, los scripts de incorporación, tracking y generación del catálogo de cursos. **LabControl** mantiene las revisiones académicas oficiales, la revisión congelada de cada sesión y el progreso. La publicación pública más reciente de GitHub Pages no implica migración de una sesión.

## Índice de especificaciones

1. [ARCHITECTURE.md](02-architecture/ARCHITECTURE.md): componentes, responsabilidades, flujos y variantes de adopción.
2. [AUTOMATION-CONTRACT.md](02-architecture/AUTOMATION-CONTRACT.md): efectos y límites de GitHub Actions, reparación de Steps y sincronización legacy.
3. [CATALOG-CONTRACT.md](03-integration/CATALOG-CONTRACT.md): contenido y semántica del catálogo, manifests, snapshots y hashes.
4. [VERSIONING-AND-COMPATIBILITY.md](03-integration/VERSIONING-AND-COMPATIBILITY.md): publicación, revisiones congeladas, pinning y compatibilidad.

## Guías operativas vigentes

- [README principal](../../README.md).
- [Incorporación de cursos existentes](../ONBOARDING-COURSE-INSTRUCTOR.md).
- [Workflows de plantilla](../COURSE-TEMPLATE-WORKFLOWS.md).
- [Reparación de Step IDs](../STEP-ID-REPAIR.md).
- [Ciclo de publicación y revisiones](../labcontrol-course-revision-lifecycle.md).
- [Runtime central](../CENTRAL-COURSE-RUNTIME.md).

## Principios no negociables

- No modificar instrucciones académicas como efecto colateral de actualizar runtime.
- No copiar identidades, proofs ni credenciales de un curso a otro.
- No generar revisiones semánticas por cada commit de Git: LabControl decide si corresponde crear una revisión tras comparar el catálogo.
- No sincronizar ni migrar sesiones automáticamente como resultado de un push a Pages.
- No renumerar IDs ya publicados sin evaluar el impacto en progreso histórico.
- Cualquier automatización que escriba en el repositorio debe tener permisos, condiciones y límites explícitos.

## Deuda documental para siguientes fases

Agregar guía de incidentes y rollback, seguridad de secretos y autorización, matriz de pruebas/releases, y quickstart de instructor. Contrastar estas especificaciones contra despliegues de cursos reales antes de elevarlas a una política operativa general.
