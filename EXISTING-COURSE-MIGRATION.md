# Migrar un curso Jekyll existente a Lab Control

## Objetivo
Convertir un curso que ya contiene `labs/lab1/lab1.md` ... `labs/labN/labN.md` al esquema de seguimiento estable, sin reescribir instrucciones. El script solo incorpora frontmatter, asignaciones de tareas e IDs de pasos. No sustituye el trabajo de revisión visual del contenido.

## Requisitos
- Python 3 (sin paquetes externos), Node 24 y herramientas de Lab Control en el template.
- Ejecutar desde el clon **más reciente** de `webpagesrepo` o indicar su directorio con `--template`.
- Los labs existentes deben tener frontmatter YAML, encabezados `## Tarea N` y `{% include step_label.html %}` en cada paso.
- El curso debe utilizar directorios continuos `lab1...labN`; contenido que ya tenga tracking debe revisarse manualmente.
- Trabajar en una rama Git o mantener un respaldo externo.

## 1. Vista previa, sin modificar nada

```bash
python scripts/migrate_existing_course.py \
  --template . \
  --target "/ruta/al/repositorio/curso-existente" \
  --course-id mi-curso
```

Muestra el número de labs, tareas y pasos identificados.

## 2. Aplicar

```bash
python scripts/migrate_existing_course.py \
  --template . \
  --target "/ruta/al/repositorio/curso-existente" \
  --course-id mi-curso \
  --apply
```

Crea `.migration-backup-labcontrol/labs/...` con las prácticas originales; registra IDs en `_data/labcontrol-identities.yml`; copia herramientas, includes, layouts, JS y workflow **solo si faltan**, sin sobrescribir otros archivos. Revisa los archivos existentes porque pueden necesitar integración manual.

## 3. Verificar en el repositorio destino

```bash
node scripts/generate_lab_manifest.mjs --all
node scripts/generate_course_catalog.mjs
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
bundle exec jekyll build --trace
git diff --check
git diff -- labs/
```

Confirma que `labcontrol/mi-curso/course.json` contenga `content/l001.json`, que todos los IDs sean estables y que el sitio use el `baseurl` correcto. Ajusta `_config.yml`, `_data/courses.yml` y la publicación de Pages según el curso, sin sustituir sus datos por los de la plantilla.

**No subir el backup a Git.** Añade `.migration-backup-labcontrol/` y `labcontrol/` al `.gitignore` si no están excluidos.

## Limitaciones y seguridad
- No migra automáticamente títulos de tareas atípicos ni pasos sin `step_label.html`. En esos casos falla antes de escribir.
- No modifica cursos con IDs de Lab Control ya declarados: esos casos requieren una migración basada en el registro histórico.
- No crea sesiones ni altera progreso de participantes.
- Siempre validar manualmente la equivalencia entre las instrucciones originales y el contenido tras la transformación.
- Una segunda ejecución con `--apply` sobre un curso ya migrado se rechaza.

## Ejemplo validado
El curso Terraform GCP se integró en producción con 13 prácticas y revisión `v1.0.0`, después de resolver correctamente las rutas de snapshots y sincronización.
