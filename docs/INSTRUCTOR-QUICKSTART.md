# Guía rápida para instructores — cursos con LabControl

**Objetivo:** que el instructor edite, valide y publique su material sin tener que administrar la plantilla central ni modificar el historial de LabControl.

## 1. Ya tengo un curso integrado

Este es el flujo diario recomendado:

1. Clonar o actualizar **solo el repositorio de tu curso**; no es necesario clonar `webpagesrepo`.
2. Editar las instrucciones de `labs/labN/labN.md`, imágenes y recursos propios del curso.
3. Revisar los cambios antes de publicar:
   ```bash
   git status
   git diff --check
   git diff -- labs/
   ```
4. Crear un commit y enviar los cambios mediante el proceso normal del curso:
   ```bash
   git add labs/
   git commit -m "docs: actualizar instrucciones de laboratorio"
   git push
   ```
   Usar el branch/PR exigido por el equipo si `main` está protegida.
5. Consultar GitHub Actions y la publicación de GitHub Pages del **mismo curso**. Si el pipeline falla, compartir la ejecución y error técnico con el administrador, **sin tokens**.
6. Entrar en LabControl → Curso → **Sincronizar todo**. Revisar si existe revisión académica nueva; no toda modificación Git crea una revisión.
7. Para una sesión existente, comprobar su revisión congelada. Si aparece versión nueva, decidir si corresponde usar **Confirmar cambio y migrar**; nunca asumir actualización automática.

**Regla:** no alterar IDs `sNNN`/`tNNN` publicados solo para que se vean consecutivos: podrían existir participantes con progreso histórico.

## 2. Mi curso es nuevo

Pedir la creación del repositorio de curso desde plantilla y ejecutar inicialmente, bajo el procedimiento del administrador:

```bash
node scripts/init_course.mjs
bash scripts/create_labs.sh 5
```

El inicializador crea identidad por repositorio. El número 5 es un ejemplo: utilizar la cantidad de Labs necesaria. Después completar prácticas, validar y publicar según [INITIALIZE-COURSE.md](INITIALIZE-COURSE.md). No reutilizar `course.identity.json` de otro curso.

## 3. Mi curso ya existe pero aún no tiene tracking

**No ejecutes automáticamente el migrador sobre `main`.** El responsable de incorporación revisa un dry-run y ejecuta la adopción en rama/clon seguro, con respaldo y diff, siguiendo [ONBOARDING-COURSE-INSTRUCTOR.md](ONBOARDING-COURSE-INSTRUCTOR.md).

La migración incorpora metadatos de seguimiento e IDs, pero debe conservar los comandos y explicaciones académicas.

## 4. El curso ya tiene tracking, pero requiere actualizar herramientas

No volver a migrar Labs. Solicitar al responsable de plataforma que actualice el runtime mediante PR y revisión; si el curso usa runtime central, el cambio debe fijar la referencia SHA probada. Consultar [RUNTIME-LIFECYCLE.md](spec/02-architecture/RUNTIME-LIFECYCLE.md).

## 5. Si ocurre un error

- **Jekyll o Pages falla:** compartir URL del workflow y primer mensaje de error.
- **Step ID duplicado:** no aplicar reparación sin evaluar si ya hay historial de participantes.
- **La última versión aparece en Pages pero tu sesión es antigua:** conservar la sesión y consultar al responsable de LabControl; no cambiar GitHub Pages para todos.
- **Tracking 401 o progreso no sincroniza:** comunicar sesión afectada, sin copiar tokens ni contraseñas.

Guías: [TROUBLESHOOTING.md](spec/04-operations/TROUBLESHOOTING.md) y [ROLLBACK-AND-RECOVERY.md](spec/04-operations/ROLLBACK-AND-RECOVERY.md).

## Responsabilidades rápidas

| Instructor | Administrador / plataforma | LabControl |
| --- | --- | --- |
| Edita y confirma Labs propios | Incorpora cursos, mantiene tooling y CI | Registra revisiones y progreso |
| Revisa Pages y avisa errores | Audita IDs, permisos y rollback | Conserva revisión congelada por sesión |
| Decide si migrar su sesión | No toca instrucciones académicas sin aprobación | Valida migración y aprobaciones |
