# Ciclo de publicación de cursos Lab Control

## Responsabilidades

- **Jekyll y `webpagesrepo`:** generan contenido público, manifests y catálogo desde `labs/labN/labN.md`.
- **Lab Control:** publica versiones inmutables y conserva revisiones congeladas por sesión. El generador **no controla** el número semántico de revisión.

## Alta de un curso

1. Crear y validar `course_id`, `lab_id: lNNN`, `tracking: true`, Tasks `tNNN` y Steps `sNNN`.
2. Ejecutar `node scripts/test_course_catalog.mjs`, `node scripts/generate_lab_manifest.mjs --all` y `node scripts/generate_course_catalog.mjs`.
3. Publicar GitHub Pages y comprobar que `labcontrol/<course_id>/course.json` y sus snapshots `content/lNNN.json` responden correctamente.
4. Registrar la URL **publicada en GitHub Pages** en Lab Control y usar **Sincronizar todo**.
5. Verificar la revisión del curso; crear/actualizar sesiones con una revisión congelada.

## Retiro y restauración reversible

1. Cambiar exclusivamente `tracking: true` a `tracking: false` en el frontmatter del Lab: desaparece del **catálogo activo**, pero no borra `labN.md`, datos históricos ni el repositorio.
2. Regenerar y publicar el catálogo. El generador de manifests debe **omitir** Labs deshabilitados sin error; validar cantidad y IDs antes del push.
3. Usar **Sincronizar todo** en Lab Control. Esto publica una revisión nueva, pero no debe migrar automáticamente sesiones existentes.
4. En sesión `PLANNED`, elegir revisión, **Revisar impacto**, confirmar manualmente y revisar el progreso preservado. Sesiones `ACTIVE`/`COMPLETED` no deben cambiar de revisión por este flujo.
5. Para restaurar, volver a `tracking: true`, regenerar/publicar/sincronizar. Aunque el contenido sea idéntico a una revisión histórica, la API debe generar una **revisión consecutiva nueva** cuando difiere de la versión más reciente (`lab-control#117`).
6. Verificar en Lab Control y perfil de participante solo tras migración explícita.

## Criterios de control

- Prueba A→B→A: 13 Labs →12→13, versiones consecutivas, sin reutilizar revisión histórica.
- Repetir **Sincronizar todo** sin cambiar el catálogo no crea una versión adicional.
- Un Lab retirado conserva snapshots anteriores y su progreso histórico; no borrar ni limpiar datos de base de datos.
- `course.json` utiliza `content/lNNN.json` relativo a la ubicación del catálogo, compatible con repositorios GitHub Pages bajo `/REPO/`.
- **No editar instrucciones académicas para probar versionado**. Usar metadatos y ambientes de piloto.

> Nota: cambios en el catálogo publicado pueden afectar las tablas de administración de curso; **no** deben cambiar los contadores oficiales de una sesión hasta que se confirme la migración de versión. Seguimiento en `lab-control#118`.
