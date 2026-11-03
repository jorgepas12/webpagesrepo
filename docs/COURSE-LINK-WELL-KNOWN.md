# Vinculación segura de cursos Jekyll con Lab Control (.well-known)

## Para qué sirve
Lab Control utiliza `POST /courses/link/preview`, `/challenge` y `/confirm` para comprobar que quien vincula una URL publicada controla ese sitio. El archivo **público** `.well-known/labcontrol-course-link.txt` es un proof de un challenge, no una credencial para el API ni un identificador permanente.

**Nunca copiar el contenido del archivo de `Netec-Mx/TRFRM_GCP_INT` a otros cursos.** Contiene una prueba ligada al actor, tracking ID, URL y caducidad de *ese* enlace y no sirve como plantilla. `webpagesrepo` no incluye un proof reutilizable.

## Requisito Jekyll
En `_config.yml`:

```yaml
include:
  - .well-known
```

La plantilla lo trae habilitado. `migrate_existing_course.py` lo incorpora a un curso existente si falta, conservando una copia de `_config.yml`. Si el archivo utiliza un formato YAML de `include` distinto, revisarlo manualmente; no sobrescribirlo ciegamente.

## Procedimiento por curso
1. Publica el curso con `course.identity.json` (tracking ID, código y nombre propios), `_config.yml` y GitHub Pages válidos.
2. Desde la interfaz de Lab Control, usar **Vincular curso → Vista previa → Solicitar verificación**. Copiar el **proof de ese challenge** entregado por Lab Control.
3. Desde la raíz del repositorio **de ese curso**, en Git Bash, escribe el proof con el script, sin poner su valor en el historial de comandos:

```bash
read -r -s -p "Pega el proof de Lab Control: " COURSE_LINK_PROOF
printf '\n'
printf '%s' "$COURSE_LINK_PROOF" | node scripts/write_course_link_proof.mjs --stdin
printf '%s' "$COURSE_LINK_PROOF" | node scripts/write_course_link_proof.mjs --stdin --apply
unset COURSE_LINK_PROOF
```

Si ya existe un proof diferente y Lab Control emitió uno nuevo, repetir con `--replace` en simulación y aplicación. El script valida el formato básico y no evalúa la firma; la validación criptográfica definitiva corresponde a Lab Control.

4. Commit y push **sólo al repositorio del curso** (no a la plantilla); esperar a que GitHub Pages lo publique.
5. Comprobar con navegador o `curl` la ruta correspondiente a su `baseurl`:

```text
https://OWNER.github.io/REPO/.well-known/labcontrol-course-link.txt
```

Debe devolver **el proof recién emitido** sin HTML de error/redirect inesperado. El archivo se publica intencionalmente.
6. Volver a Lab Control y ejecutar **Confirmar vinculación** antes de que el challenge caduque. Si caduca, pedir uno nuevo y volver a publicarlo.

## Advertencias
- Un `HTTP 200` por sí solo no demuestra que la ruta contiene el proof correcto; verificar contenido publicado.
- No incluir tokens de sesión, de participante, de authoring ni secrets de sincronización en ese archivo, GitHub Actions ni Issues.
- Nunca generar un proof genérico en `webpagesrepo`. Tampoco crear un challenge por adelantado para cursos que aún no tienen dueño/URL estable.
- En cursos ya vinculados, no reemplazar el proof salvo que Lab Control solicite una nueva comprobación.
- El contenido académico, manifest y tracking se publican por sus procesos habituales; el proof sólo comprueba control de la URL.
