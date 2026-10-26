# Inicializador de identidad de curso

En un repositorio nuevo creado a partir de la plantilla:

```bash
node scripts/init_course.mjs
```

Introduce nombre y descripción. El script propone un código compacto (opción B) y un Tracking ID en minúsculas; permite editarlos antes de confirmar. Ejemplo: Terraform en Google Cloud Intermedio → `TFGCPINT` / `tfgcpint`.

Genera `course.identity.json` como fuente canónica y agrega una entrada sin Labs a `_data/courses.yml`. No sobrescribe la identidad existente; no ejecutes el inicializador en cursos ya publicados.

**Limitación de esta primera fase:** comprueba formato y duplicados en el YAML local, no unicidad contra los cursos de Lab Control. La sincronización y comprobación global corresponden a `jorgepas12/lab-control#126`. Los comandos actuales de creación de Labs aún requieren usar explícitamente el Tracking ID.

El archivo de ejemplo original de la plantilla en `_data/courses.yml` no se borra automáticamente. Antes de publicar un curso nuevo, revisa las entradas de ejemplo.
