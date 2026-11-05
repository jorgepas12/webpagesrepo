# Seguridad de integración — webpagesrepo y LabControl

**Ámbito:** plantilla y herramientas de publicación de cursos; no sustituye el modelo de autenticación y autorización de LabControl.

## Identidades y confianza

- Cada repositorio de curso mantiene su propio `course.identity.json`, `_data/courses.yml` y prueba de vinculación (challenge) de URL. **Nunca reutilizar estos datos desde otro curso.**
- `.well-known/labcontrol-course-link.txt` es una prueba pública de control del sitio, limitada al challenge, **no** un token de acceso permanente. Se genera para cada curso siguiendo [COURSE-LINK-WELL-KNOWN.md](../../COURSE-LINK-WELL-KNOWN.md).
- Los participantes obtienen autorización y contexto de la sesión desde LabControl; los scripts del repositorio público no deben contener credenciales, contraseñas o tokens de participantes.
- `lab-demo-context.js` aísla el modo de prueba instructor del progreso oficial; no usarlo como autorización para escribir tracking real.

## Secretos y variables de CI

| Nombre | Ubicación prevista | Uso documentado |
| --- | --- | --- |
| `LABCONTROL_SYNC_TOKEN` | GitHub Actions Secret por repositorio / entorno autorizado | Sincronización legacy de manifests si está configurada |
| `LABCONTROL_API_URL` | GitHub Actions Variable, config del sitio o entorno según flujo | Endpoint del servicio; no es secreto por sí mismo |
| `LABCONTROL_AUTHORING_SYNC_TOKEN` | Secreto de entorno controlado para autoría/sincronización explícita | No imprimir ni registrar en historial de comandos |
| Challenge/proof `.well-known` | Archivo público del sitio de ese curso | Demostrar control de URL durante vinculación |

Los nombres anteriores provienen de workflows y guías existentes. **No se verificó la configuración real de secretos en cada repositorio de cursos.** No mover secretos desde el backend a JavaScript público ni escribirlos en archivos del repositorio.

## Permisos mínimos de GitHub Actions

- El reusable workflow central `labcontrol-reusable.yml` declara `contents: read` para validación; evitar elevar permisos sin necesitar acciones concretas.
- `pages.yml` de la plantilla usa `contents: write`, `pages: write` e `id-token: write`, porque puede hacer commit/push de reparación de Step IDs y desplegar Pages. **No copiar este nivel de permisos automáticamente a cursos que solo necesiten leer y validar.**
- Mantener la publicación desde **un solo** workflow activo para evitar carreras.
- Fijar dependencias y el tooling central de cursos productivos a commit SHA revisado, y renovar SHA mediante PR con pruebas.
- Revisar permisos de bots, protecciones de rama y contexto de ejecución antes de habilitar pushes automáticos.

## Riesgo conocido de la autocorrección

La plantilla ejecuta `repair_step_ids.mjs --apply` si detecta errores y **no** hay variables de conexión de LabControl presentes. Esta condición no garantiza ausencia de datos académicos históricos. **Un curso previamente registrado puede tener progreso incluso sin esas variables.** La política segura es auditar los IDs y el histórico antes de habilitar renumeración automática sobre cursos operativos.

## Protección de datos y logs

- Nunca incluir tokens de sincronización, contraseñas, nombres/correos de estudiantes, cookies o URLs de sesión privadas en artefactos de Pages, logs, PRs o Issues.
- El contenido de Pages y el catálogo `course.json` son públicos; publicar únicamente instrucciones y metadata académica destinada a ese medio.
- No enviar secretos a servicios de IA ni incorporarlos a snapshots; la futura generación de cuestionarios es responsabilidad del backend autorizado de LabControl.
- Los mensajes de error y reportes de pruebas deben mostrar IDs técnicos, SHA y rutas, no datos de participantes.

## Incidentes y rotación

Ante exposición de secreto: revocar/rotar el token por el mecanismo autorizado, revisar Actions logs y artefactos, invalidar credenciales afectadas, y registrar incidente sin volver a imprimir el secreto. **No se ejecuta rotación desde esta documentación.** Consultar [ROLLBACK-AND-RECOVERY.md](../04-operations/ROLLBACK-AND-RECOVERY.md).

## Fuera de alcance

Definición de permisos en la base de datos PostgreSQL, políticas de retención de StepProgress, cifrado de credenciales de máquinas virtuales o diseño completo de sesiones de usuario: pertenecen al repositorio `lab-control`.
