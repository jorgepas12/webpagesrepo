# Adopción centralizada de cursos Jekyll existentes (en desarrollo)

**Estado:** PR borrador. No utilizar `--apply` sobre el repositorio oficial ni habilitar Pages hasta aprobar pruebas.

## Modelo operativo
- Los instructores sólo necesitan el repositorio del curso; `webpagesrepo` permanece centralizado.
- El administrador ejecuta un bootstrap inicial de una sola vez sobre una copia Git limpia.
- Tras registrar el curso, un caller workflow mínimo del curso invoca `.github/workflows/labcontrol-reusable.yml` del repositorio central.
- El pipeline central valida IDs y catálogo, genera manifests/snapshots y construye Jekyll; el despliegue es opt-in.
- **No** se renumeran IDs publicados, no se sustituyen instrucciones, no se realiza push desde validación.
- No se deben desplegar simultáneamente el antiguo `pages.yml` y un workflow central con `deploy: true`.

## Identidad probada para CKA-Priv-
`code=CKA_PRIV`, `trackingId=ckapriv`, 8 Labs, 55 Tasks, 448 Steps. Esta identidad se crea en `course.identity.json` sólo una vez; no reutilizar identidad ni proofs de otro curso.

## Pruebas realizadas manualmente en clon temporal
- Migrador reconoció 8 Labs, 55 Tasks, 448 Steps.
- Generó 8 manifests y catálogo público.
- Tests de manifests y catálogo: correctos.
- Integridad de instrucciones principales: 8/8, sin cambios académicos.
- IDs secuenciales y únicos: 448/448.
- Jekyll build: correcto.
- **GitHub Actions validado:** run #41748872872 en Netec-Mx/CKA-Priv-, rama test/labcontrol-onboarding, commit eef0d11: success, 44 segundos, sin despliegue.
- **Artifacts validado:** run #41749738592, commit 0d5a038, `labcontrol-validated-site` subido correctamente (53 archivos, aproximadamente 275 KB). No desplegado.
- **Aún no probado:** paquete final de GitHub Pages, vinculación a LabControl, runtime participante e instructor y sincronización contra API.

## Pendientes bloqueantes
1. COMPLETADO: caller reusable workflow de solo validación con permisos `contents: read`, probado en rama segura.
2. Reemplazar `ref` de rama de desarrollo por release SHA/tag inmutable.
3. Implementar bootstrap mínimo y distribución de archivos técnicos sin copiar toda la plantilla.
4. Automatizar identidad y rollback/restore de un fallo parcial.
5. Validar cambios de contenido, historial de revisiones y control de snapshots; verificar pasos no tradicionales.
6. Definir política de secrets para sincronización y challenge de vinculación.
7. Mantener despliegue actual hasta que un solo workflow quede aprobado para Pages.

## Próxima prueba: empaquetado Pages sin despliegue

El ejemplo `docs/examples/cka-labcontrol-validation.yml` ahora genera el sitio central y ejecuta un segundo job `package-pages` que comprueba la presencia del catálogo y de un HTML, y empaqueta como `github-pages` con `actions/upload-pages-artifact@v4`. No despliega. Requiere probarse en rama de curso antes de habilitar un deploy.

La propuesta `docs/examples/cka-pages-central-proposed.yml` es una **alternativa completa** al workflow Pages existente y no debe instalarse junto con otro workflow de publicación. Para producción: aprobar los tests de empaquetado, fijar el workflow central mediante SHA/tag protegido y cambiar en un único commit el workflow existente. Solo el job final de despliegue solicita `pages: write` e `id-token: write`.

No activar sincronización autenticada desde workflows hasta verificar endpoint, privilegios y política de revisiones congeladas. No reutilizar pruebas `.well-known` de otros cursos.
