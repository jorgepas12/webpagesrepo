# Procedimiento estándar: incorporar un curso existente a LabControl

**Aplica a un repositorio de curso creado desde otra plantilla Jekyll.** El instructor edita sus laboratorios y hace push a su propio repositorio. No necesita clonar ni conservar `webpagesrepo`.

## Responsabilidades y gobierno de versiones

- **Instructor:** clona el curso, edita y valida instrucciones, confirma cambios académicos mediante Git.
- **Responsable de incorporación (una vez):** ejecuta bootstrap desde el repositorio del curso, revisa el diff y hace commit/push de la integración técnica.
- **GitHub Actions:** valida IDs existentes, prepara runtime compartido en el runner, genera manifests y catálogo, construye y publica Pages. **No sincroniza automáticamente la base de datos.**
- **LabControl:** verifica propiedad de la URL, importa catálogo al elegir **Sincronizar todo**, crea primera revisión y controla versiones posteriores. Los cambios publicados por GitHub no deben migrar automáticamente sesiones existentes.

## Antes de empezar

Prerequisitos en el equipo: `git`, `node` 24, `python` 3 y acceso a Internet; en Git Bash/Linux, `bash`, `curl` y `git`; en PowerShell, PowerShell 5.1+ y `git`. Para probar localmente Jekyll se necesitan Ruby/Bundler; en el build CI los prepara Actions.

**Estructura mínima requerida:** repositorio Git con `origin` apuntando a GitHub y prácticas académicas identificables como `labs/lab1/lab1.md`, `labs/lab2/lab2.md`, etc. Las prácticas deben identificar pasos mediante `{% include step_label.html %}`; no es obligatorio que exista el archivo real `_includes/step_label.html`: lo aporta la incorporación. Los labs pueden carecer de frontmatter y el migrador agregará el mínimo necesario, conservando el texto de las instrucciones.

**El curso NO necesita previamente** `_config.yml`, `_data/courses.yml`, `_layouts/`, `_includes/`, `Gemfile`, `index.md` ni `pages.yml`. El scaffold `scripts/scaffold_missing_jekyll.mjs` crea solamente los faltantes durante la incorporación, infiere `url`, `repository` y `baseurl` desde `git remote origin`; preserva archivos existentes. Si la plantilla tiene layouts o catálogos incompatibles, detiene el proceso para revisión en vez de sobrescribirlos o alterar contenidos. No descarga ni copia scripts o JS técnicos dentro del repo.

**Límite académico:** si las prácticas no tienen marcadores de paso reconocibles, hay que identificar sus pasos antes de asignar IDs. Esto no debe resolverse inventando límites de tareas. El mismo procedimiento aplica a un curso nuevo con solo `labs/` y a uno antiguo con su propia estructura. `trackingId` y `code` deben definirse antes del primer registro en LabControl y no renumerarse posteriormente.

Primero terminar y confirmar cambios académicos:

```bash
git status
git add labs/
git commit -m "docs(labs): validar contenido inicial"
git status --short
```

El bootstrap **exige estado Git limpio** antes de la migración técnica.

## Opción A: Git Bash de Windows o Linux

Desde **la raíz del repositorio del curso**, reemplazar los valores de ejemplo con los datos de ese curso:

```bash
curl -fsSL https://raw.githubusercontent.com/jorgepas12/webpagesrepo/main/scripts/bootstrap_existing_course.sh -o /tmp/labcontrol-bootstrap.sh

# 1. Simulación; no modifica ningún archivo
bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id ckapriv \
  --code CKA_PRIV \
  --name "Administración, despliegue y preparación para CKA" \
  --description "Curso de administración y preparación CKA con 8 prácticas de Kubernetes."

# 2. Aplicación, solo después de revisar la simulación
bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id ckapriv \
  --code CKA_PRIV \
  --name "Administración, despliegue y preparación para CKA" \
  --description "Curso de administración y preparación CKA con 8 prácticas de Kubernetes." \
  --apply

rm /tmp/labcontrol-bootstrap.sh
```

**Nota:** el wrapper se descarga en `/tmp` para mantener limpio el repositorio; elimínalo después de aplicar. No se crea una dependencia Git persistente con `webpagesrepo`.

## Opción B: Windows PowerShell

Desde **la raíz del repositorio del curso**, con PowerShell:

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/jorgepas12/webpagesrepo/main/scripts/bootstrap_existing_course.ps1" -OutFile "$env:TEMP\labcontrol-bootstrap.ps1"

# Simulación
& "$env:TEMP\labcontrol-bootstrap.ps1" -TrackingId "ckapriv" -Code "CKA_PRIV" -Name "Administración, despliegue y preparación para CKA" -Description "Curso de administración y preparación CKA con 8 prácticas de Kubernetes."

# Aplicación al terminar la revisión
& "$env:TEMP\labcontrol-bootstrap.ps1" -TrackingId "ckapriv" -Code "CKA_PRIV" -Name "Administración, despliegue y preparación para CKA" -Description "Curso de administración y preparación CKA con 8 prácticas de Kubernetes." -Apply
```

El instalador descarga herramientas a un clon **temporal** y deja en el curso únicamente identidad, metadatos estables de tracking, include necesario, integración mínima de layouts y el workflow Pages. **No copia scripts generadores ni JavaScript compartidos**: GitHub Actions los obtiene de `webpagesrepo` durante el build. No ejecutar limpieza indiscriminada de otros archivos del curso.

**Caso real de referencia:** [DBRICKS-DE_INT — simulación aprobada, aplicación, revisión y publicación](cases/DBRICKS-DE_INT-ONBOARDING.md). Incluye los comandos completos ejecutados en Git Bash y la verificación de 13 laboratorios, 63 tareas y 474 pasos. Esta guía no supone que la aplicación o el build ya se hayan completado.

## Revisar y publicar la primera integración

**Repositorio: el curso, no `webpagesrepo`.**

```bash
git diff --check
git diff --stat
git status --short
# Revisar cuidadosamente labs/, course.identity.json y .github/workflows/pages.yml.
# Confirmar que el diff de labs solo inserta metadata course_id/lab_id/tNNN/sNNN.
git add -A
git diff --cached --check
git diff --cached --stat
git commit -m "feat(labcontrol): incorporar seguimiento y workflow central"
git push origin main
```

Si el repositorio tiene protección que requiere PR, enviar esos cambios por PR en vez de hacer push directo. **No eludir controles de ramas.**

El workflow debe usar una sola ruta de publicación Pages y referirse a un commit SHA probado de `webpagesrepo`. Para actualizar el runtime central más adelante se cambia ese SHA bajo revisión, no se renumeran IDs académicos.

## Registrar curso y crear primera versión en LabControl

1. Verificar que GitHub Actions finalizó en **Success**, y que se publicaron `<base>/course.identity.json` y `<base>/labcontrol/<trackingId>/course.json`.
2. En LabControl elegir **Cursos → Registrar desde URL** con la **URL pública GitHub Pages**, no la del repositorio Git.
3. Publicar el proof del challenge en `.well-known/labcontrol-course-link.txt` y confirmar antes de su vencimiento; nunca reutilizar proofs.
4. Abrir detalle del curso y pulsar **Sincronizar todo**; se genera la revisión inicial `v1.0.0` al importar el primer catálogo.

## Cambios posteriores: LabControl es quien gobierna la versión

```text
Instructor: editar labs → git add/commit/push → Pages publica catálogo
LabControl: usuario autorizado elige Sincronizar todo → compara cambios
LabControl: crea/identifica revisión y mantiene historial independiente
Sesiones: revisiones congeladas; cualquier adopción/migración de sesión
         requiere su flujo explícito de revisión previa y confirmación
```

**No activar tokens de sincronización de manifests en GitHub Actions como sustituto de la revisión del catálogo.** Publicar y sincronizar son responsabilidades diferentes. Una segunda sincronización sin cambios no debe crear una revisión adicional.

## Protección, respaldo y límites

No hace falta crear un curso con la plantilla de `webpagesrepo`: se admiten repositorios Jekyll previamente existentes que tengan la estructura documentada; no se promete adoptar sin ajuste cualquier organización Markdown, layouts o catálogo.

El migrador inicial genera IDs estables, por lo que su aplicación necesita revisión de metadatos y respaldo (carpetas `.migration-backup-labcontrol/` y `.labcontrol-template-backup/` excluidas de Git). Un curso ya vinculado **no debe volver a migrarse** ni renumerarse automáticamente. El bootstrap inicial no garantiza compatibilidad con cualquier variante de Jekyll: si no reconoce estructura, falla sin inventar cambios. El origen GitHub Pages debe estar autorizado en la allowlist de la API. No copiar secretos ni pruebas de propiedad en repositorios de terceros.

**Para próximos cursos, usar un proceso de incorporación única.** CKA-Priv- ya está integrado: no volver a ejecutar `--apply` para reproducir este procedimiento.
