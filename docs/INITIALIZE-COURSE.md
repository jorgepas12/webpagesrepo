# Inicialización de un curso nuevo para Lab Control

Desde un repositorio creado con la plantilla `webpagesrepo`, **antes** de crear Labs:

```bash
node scripts/init_course.mjs
```

El comando propone un código y Tracking ID compactos según el nombre, permite ajustarlos y crea `course.identity.json` y una entrada en `_data/courses.yml`. No sobrescribe una identidad existente. Si el curso ya existe, no ejecutar el inicializador: usar [adopción/migración](COURSE-TEMPLATE-WORKFLOWS.md).

Crear prácticas:

```bash
bash scripts/create_labs.sh 5
node scripts/generate_lab_manifest.mjs --all
node scripts/generate_course_catalog.mjs
node scripts/test_lab_manifest.mjs
node scripts/test_course_catalog.mjs
bundle exec jekyll build --trace
```

`create_labs.sh` reutiliza el `trackingId` de `course.identity.json`, rechaza uno distinto y no debe sobrescribir Labs existentes. Revisa que el YAML de ejemplo de la plantilla no se publique como curso real y que el `url`, `baseurl`, `repository` y `labcontrol_api_url` de `_config.yml` correspondan al destino.

## Registro de identidad en Lab Control

Si el API y el token de authoring ya están configurados para el ambiente, el script `sync_course_identity.mjs` consume el endpoint `POST /authoring-sync/courses/identity`; no crea Labs. La disponibilidad efectiva y permisos deben verificarse antes de invocarlo contra producción.

```bash
export LABCONTROL_API_URL=https://labcontrol.superwebapp.com
# Obtener LABCONTROL_AUTHORING_SYNC_TOKEN por canal seguro; no imprimirlo.
node scripts/sync_course_identity.mjs
```

Este script exige que la variable `LABCONTROL_AUTHORING_SYNC_TOKEN` ya esté definida (prefijo `lcat_`). El endpoint reconoce una identidad existente con el mismo tracking ID y código; no debe producir duplicados. Una prueba de conectividad no autoriza por sí sola modificar el catálogo de un curso.

## Publicación y vínculo de URL

Publica GitHub Pages, comprueba el catálogo `labcontrol/<trackingId>/course.json` y sus snapshots, y después vincula el curso mediante [challenge/proof en `.well-known`](COURSE-LINK-WELL-KNOWN.md). **No copiar el proof de Terraform ni de ninguna otra URL**.

El modo práctica del instructor y el protocolo de actualización de cursos existentes se documentan en [workflows de plantilla](COURSE-TEMPLATE-WORKFLOWS.md).
