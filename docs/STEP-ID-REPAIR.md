# Auditoría y corrección controlada de Step IDs en cursos existentes

## Por qué se valida

Cada `step_id` debe ser único **dentro de un Lab**; puede repetirse entre Labs porque el contexto también incorpora `course_id` y `lab_id`. En el flujo editorial actual conviene usar una secuencia consecutiva `s001`, `s002`, etc., en orden de aparición. `generate_lab_manifest.mjs` ya **rechaza duplicados** y no debe modificar contenido de forma silenciosa.

La herramienta `scripts/repair_step_ids.mjs` audita la secuencia, muestra líneas afectadas y, **únicamente con `--apply`**, cambia los atributos `id="sNNN"` de los includes `step_label.html`. No reescribe las instrucciones, comandos, tareas ni encabezados. Omite Labs declarados `tracking: false`, no cuenta ejemplos dentro de comentarios HTML y rechaza IDs ausentes o mal formados.

## Auditoría de curso (sin escribir)

Desde la raíz de un curso Jekyll al que ya se copió la herramienta:

```bash
node scripts/repair_step_ids.mjs
node scripts/repair_step_ids.mjs --check
```

- Sin argumentos: **DRY-RUN**, imprime `s045 -> s021`, línea y causa; exit 0 aunque detecte problemas.
- `--check`: igual auditoría, pero exit **1** si hay IDs fuera de secuencia; se usa antes de generar manifests en GitHub Actions.
- `--lab lab1`: inspecciona solamente ese Lab.
- `--root /ruta/del/curso`: inspecciona un destino diferente sin copiar scripts.

## Aplicación explícita, con control de histórico

Antes de cambiar `step_id` en un curso ya conectado a Lab Control:
1. Confirmar que no existe progreso real o identificar la revisión y las sesiones afectadas. Cambiar un ID existente crea una identidad nueva para el seguimiento y puede dejar progreso anterior asociado a un ID que ya no existe en el manifest.
2. Mantener las revisiones congeladas anteriores; no migrar ni resetear inscripciones automáticamente.
3. Trabajar sobre rama Git limpia, revisar salida del dry-run y guardar respaldo del curso.
4. Sólo cuando se apruebe la modificación de IDs:

```bash
node scripts/repair_step_ids.mjs --apply
node scripts/repair_step_ids.mjs --check
node scripts/generate_lab_manifest.mjs --all
node scripts/generate_course_catalog.mjs
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
bundle exec jekyll build --trace
git diff --check
git diff -- labs/
```

El `--apply` realiza backup de todos los Markdown modificados **antes de escribir** bajo `.step-id-backup/<timestamp>/labs... ` (no versionar). Un segundo `--apply` sin problemas no realiza cambios ni genera otro respaldo.

**Importante:** la herramienta renumera todos los Steps dentro de cada Lab según su posición actual. Si un ID histórico correcto aparece después de un salto, puede cambiar también su valor. Revisa cuidadosamente el diff y el impacto en `StepProgress`; esta es una herramienta de reparación editorial, no una migración de historial de la base de datos.

## Integración con plantilla y CI

El template `webpagesrepo` ejecuta `--check` en el workflow de PR y antes de generar manifests para Pages. **Nunca** ejecuta `--apply` en CI, de modo que los errores no quedan ocultos ni alteran el contenido publicado.

Para propagar a un curso ya adaptado se copia exclusivamente `scripts/repair_step_ids.mjs`, o se realiza una integración técnica revisada; no copiar `course.identity.json`, pruebas `.well-known`, ni datos académicos de otros cursos.

## Hallazgos CKA del 2026-11-03

Comparación de `Netec-Mx/CKA/main`:
- Lab 1: 49 Steps, `s045` duplicado en líneas 660 y 736.
- Lab 8: 54 Steps, `s045` duplicado en líneas 829 y 1021.
- Labs 2, 3, 4, 5, 6, 9, 11 y 12: saltos por un último `s045` fuera de secuencia.
- Labs 7, 10, 13, 14 y 15: secuencias consecutivas.

A diferencia de un error genérico de script, estos problemas están en los identificadores Markdown de CKA. Los 15 Labs deben auditarse; los cambios se proponen de forma precisa por línea. Revisar historial antes de modificar IDs. El repositorio CKA no está autorizado para escritura desde la conexión de ChatGPT actual; los cambios de su curso se aplican desde Git Bash con permisos propios, en una rama separada.

## Tests

```bash
node --test scripts/test_repair_step_ids.mjs
node scripts/repair_step_ids.mjs --check
```
