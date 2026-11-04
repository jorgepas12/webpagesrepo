# Procedimiento estándar: incorporar un curso existente a LabControl

**Aplica a cursos nuevos y existentes, aunque no hayan sido creados con una plantilla Jekyll.** El instructor edita sus laboratorios y hace push a su propio repositorio. No necesita clonar ni conservar `webpagesrepo`.

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

Primero terminar y confirmar los cambios académicos propios del curso con el procedimiento Git habitual. El bootstrap **exige un estado Git limpio** antes de la migración; si ya está limpio, no hay que crear un commit adicional.

## Opción A: Git Bash en Windows o Linux (genérica)

**Repositorio:** ejecutar desde la raíz del repositorio del curso que se quiere incorporar, **no desde webpagesrepo ni lab-control**. No editar el script de bootstrap ni escribir datos de otro curso. El siguiente bloque solicita la identidad del curso y la conserva en variables de la sesión actual de Git Bash:

~~~bash
git remote -v
git status --short

read -r -p "Tracking ID (minúsculas, 2 a 20 caracteres, p. ej. nombrecorto): " TRACKING_ID
read -r -p "Código (mayúsculas, números y _, p. ej. CURSO_INT): " COURSE_CODE
read -r -p "Nombre oficial del curso: " COURSE_NAME
read -r -p "Descripción breve del curso: " COURSE_DESCRIPTION
~~~

Los valores se eligen para **ese curso**, no se copian del ejemplo. El tracking ID debe ser el mismo que la clave existente de \`_data/courses.yml\`, si ya hay catálogo; una vez registrado en LabControl no debe cambiarse. No incluir contraseñas ni tokens. Asegurar \`git status --short\` vacío antes de continuar.

Descargar una sola vez el iniciador y ejecutar la **simulación obligatoria**, sin modificar archivos:

~~~bash
curl -fsSL \
  https://raw.githubusercontent.com/jorgepas12/webpagesrepo/main/scripts/bootstrap_existing_course.sh \
  -o /tmp/labcontrol-bootstrap.sh

bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id "$TRACKING_ID" \
  --code "$COURSE_CODE" \
  --name "$COURSE_NAME" \
  --description "$COURSE_DESCRIPTION"

git status --short
~~~

Revisar el número de labs/tareas/pasos y los archivos por crear o actualizar. Si aparece un error de estructura, resolverlo antes de continuar. Cuando el dry-run sea correcto, aplicar **en la misma sesión de terminal**, reutilizando las variables:

~~~bash
bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id "$TRACKING_ID" \
  --code "$COURSE_CODE" \
  --name "$COURSE_NAME" \
  --description "$COURSE_DESCRIPTION" \
  --apply
~~~

No hacer commit ni push antes de revisar el diff. Para terminar, después de validar y publicar:

~~~bash
rm /tmp/labcontrol-bootstrap.sh
~~~

Si se cierra la terminal entre simulación y aplicación, se pierden las variables: repetir el primer bloque para el mismo curso con **exactamente los mismos valores**.

## Opción B: Windows PowerShell (genérica)

**Repositorio:** ejecutar desde la raíz del curso, no desde webpagesrepo. El siguiente bloque solicita los datos una sola vez y permite reutilizarlos durante la sesión actual de PowerShell:

~~~powershell
git remote -v
git status --short

$TrackingId = Read-Host "Tracking ID (minúsculas, 2 a 20 caracteres)"
$CourseCode = Read-Host "Código (mayúsculas, números y guion bajo)"
$CourseName = Read-Host "Nombre oficial del curso"
$CourseDescription = Read-Host "Descripción breve del curso"
~~~

Si ya existe \`_data/courses.yml\`, utilizar su clave como \`$TrackingId\`. Asegurar que \`git status --short\` esté vacío. Descargar y ejecutar en **simulación**:

~~~powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/jorgepas12/webpagesrepo/main/scripts/bootstrap_existing_course.ps1" -OutFile "$env:TEMP\labcontrol-bootstrap.ps1"

& "$env:TEMP\labcontrol-bootstrap.ps1" -TrackingId $TrackingId -Code $CourseCode -Name $CourseName -Description $CourseDescription

git status --short
~~~

Una vez revisado el resultado, ejecutar en la **misma sesión de PowerShell**:

~~~powershell
& "$env:TEMP\labcontrol-bootstrap.ps1" -TrackingId $TrackingId -Code $CourseCode -Name $CourseName -Description $CourseDescription -Apply
~~~

No hacer commit/push hasta revisar. Al finalizar:

~~~powershell
Remove-Item "$env:TEMP\labcontrol-bootstrap.ps1"
~~~

El instalador clona \`webpagesrepo\` **temporalmente**, crea identidad y metadatos de seguimiento estables, integra lo mínimo de Jekyll y reemplaza el workflow Pages con el central. **No copia generadores ni JavaScript comunes**: GitHub Actions los obtiene en cada build. Si el curso ya tiene una identidad de LabControl, no repetir la migración inicial. Los respaldos de cambios técnicos permanecen locales y no deben incorporarse al commit.

## Revisar y publicar la primera integración

**Repositorio: el curso, no `webpagesrepo`.**

```bash
git diff --check
git diff --stat
git status --short
# Revisar cuidadosamente labs/, course.identity.json y .github/workflows/pages.yml.
# Confirmar que el diff de labs solo inserta metadata course_id/lab_id/tNNN/sNNN.
git add -A
git status --short
# No incluir respaldos ni archivos ajenos al curso.
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
