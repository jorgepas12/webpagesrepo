# Caso validado: incorporación de DBRICKS-DE_INT desde Git Bash

Repositorio de curso: **Netec-Mx/DBRICKS-DE_INT**. No ejecutar en webpagesrepo, CKA ni lab-control.

La simulación del 4 de noviembre de 2026 partió de main, commit 74506a2, árbol Git limpio. El curso ya contenía estructura Jekyll y un workflow Pages convencional, pero no estaba integrado en LabControl.

## 1. Preparar y revisar (Git Bash)

~~~bash
git switch main
git pull --ff-only origin main
git remote -v
git status --short
git log -1 --oneline
~~~

Verificar que el remoto sea https://github.com/Netec-Mx/DBRICKS-DE_INT.git y que no haya cambios locales. No ejecutar la migración con modificaciones sin confirmar.

## 2. Obtener el bootstrap desde webpagesrepo

~~~bash
curl -fsSL \
  https://raw.githubusercontent.com/jorgepas12/webpagesrepo/main/scripts/bootstrap_existing_course.sh \
  -o /tmp/labcontrol-bootstrap.sh
~~~

El script clona temporalmente herramientas centrales fuera del repositorio del curso y elimina esa copia al concluir. No deja generadores locales.

## 3. Simular: obligatorio y sin escrituras

~~~bash
bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id dbricksint \
  --code DBRICKS_DE_INT \
  --name "Ingeniería de datos con Databricks" \
  --description "Curso de ingeniería de datos con Databricks, PySpark, Delta Lake, Unity Catalog y Lakeflow."

git status --short
~~~

Resultado **observado** de la simulación:

- 13 laboratorios, 63 tareas y 474 marcadores de paso.
- Crear index.md y course.identity.json.
- Actualizar _layouts/default.html, _layouts/lab.html, _includes/step_label.html, .github/workflows/pages.yml.
- No modificó ningún archivo (git status --short vacío).

La simulación no demuestra que --apply o el build de GitHub Pages vayan a concluir correctamente.

## 4. Aplicar únicamente tras aprobar la simulación

~~~bash
bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id dbricksint \
  --code DBRICKS_DE_INT \
  --name "Ingeniería de datos con Databricks" \
  --description "Curso de ingeniería de datos con Databricks, PySpark, Delta Lake, Unity Catalog y Lakeflow." \
  --apply
~~~

No hacer commit ni push antes de inspeccionar la salida. El migrador inserta metadata de tracking y IDs en los 13 Markdown: no debe reescribir comandos ni instrucciones. Los respaldos de adopción quedan excluidos de Git.

## 5. Validación previa al push

~~~bash
git status --short
git diff --check
git diff --stat
git diff -- .github/workflows/pages.yml _config.yml _layouts/ _includes/ _data/courses.yml
git diff -- labs/lab1/lab1.md
git diff --numstat -- labs/
~~~

Revisar que los Markdown solo incorporan campos de metadata, asignaciones tracking_task_id e identificadores id="sNNN". El programa hace una validación automática de integridad académica contra HEAD, que debe terminar sin error. Inspeccionar especialmente la integración de los includes, y que pages.yml no active sincronización automática de la base de datos.

La URL prevista es https://netec-mx.github.io/DBRICKS-DE_INT/ y el identificador de seguimiento es dbricksint.

## 6. Publicación (solo cuando los pasos anteriores pasen)

~~~bash
git add -A
git diff --cached --check
git diff --cached --stat
git status --short
git commit -m "feat(labcontrol): incorporar seguimiento al curso Databricks"
git push origin main
git status
~~~

El uso de git add -A exige revisar previamente la lista de archivos. No agregar respaldos ni archivos personales. Si existen protecciones de rama, seguir el proceso de PR autorizado.

Comprobar GitHub Actions en https://github.com/Netec-Mx/DBRICKS-DE_INT/actions y que se publiquen los JSON de identidad y catálogo. Después registrar la URL en LabControl, completar prueba de propiedad y pulsar Sincronizar todo para crear la primera revisión.

**Gobierno de versiones**: las publicaciones posteriores de GitHub Pages no crean ni aprueban revisiones en LabControl. El historial, la detección de cambios y la adopción de revisiones corresponden a LabControl.

## 7. Limpieza temporal del comando

~~~bash
rm /tmp/labcontrol-bootstrap.sh
~~~

El curso no debe volver a pasar por migración inicial cuando ya tenga identidad registrada y sesiones. Para los cursos siguientes repetir el procedimiento con su identificador, código, nombre y descripción propios.
