# Inicializador de identidad de curso

En un repositorio nuevo creado a partir de la plantilla:

```bash
node scripts/init_course.mjs
```

Introduce nombre y descripción. El script propone un código compacto (opción B) y un Tracking ID en minúsculas; permite editarlos antes de confirmar. Ejemplo: Terraform en Google Cloud Intermedio → `TFGCPINT` / `tfgcpint`.

Genera `course.identity.json` como fuente canónica y agrega una entrada sin Labs a `_data/courses.yml`. No sobrescribe la identidad existente; no ejecutes el inicializador en cursos ya publicados.

**Limitación de esta primera fase:** comprueba formato y duplicados en el YAML local, no unicidad contra los cursos de Lab Control. La sincronización y comprobación global corresponden a `jorgepas12/lab-control#126`. `scripts/create_labs.sh` utiliza automáticamente el Tracking ID de `course.identity.json` cuando existe; el segundo argumento es opcional, y se rechaza si contradice la identidad canónica. Los repositorios antiguos sin `course.identity.json` conservan su funcionamiento anterior.

El archivo de ejemplo original de la plantilla en `_data/courses.yml` no se borra automáticamente. Antes de publicar un curso nuevo, revisa las entradas de ejemplo.
\n## Registro automático en Lab Control (fase #126)\n\nUna vez disponible el endpoint en la API, desde Git Bash:\n\n```bash\nexport LABCONTROL_API_URL=https://labcontrol.superwebapp.com\nexport LABCONTROL_AUTHORING_SYNC_TOKEN='TOKEN_LCAT_DEL_ENTORNO'\nnode scripts/sync_course_identity.mjs\n```\n\nEl comando lee `course.identity.json`, no crea Labs, y no imprime el token. Un segundo registro con el mismo par de identificadores debe reutilizar el curso existente. El endpoint aún no está desplegado; **no ejecutar contra producción hasta aprobar y desplegar Lab Control #134**.\n