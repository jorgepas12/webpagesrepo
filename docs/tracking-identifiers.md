# Tracking identifiers

Este documento define el contrato estable de identificación utilizado para
integrar los laboratorios Jekyll con LabControl.

## Objetivo

Los identificadores permiten relacionar de forma estable:

- cursos;
- laboratorios;
- tareas;
- pasos;

con los registros almacenados en LabControl.

Los identificadores representan identidad, no posición visual.

Una vez publicado un identificador no debe cambiarse aunque el elemento sea
renombrado, reordenado, retirado o reactivado.

## Jerarquía

La identidad lógica es:

```text
course_id
└── lab_id
    └── task_id
        └── step_id
```

Ejemplo:

```text
terraform-aws-essentials
└── l001
    ├── t001
    │   ├── s001
    │   └── s002
    └── t002
        ├── s003
        └── s004
```

## Formatos oficiales

### Course ID

Formato:

```text
kebab-case
```

Ejemplo:

```text
terraform-aws-essentials
```

Regla:

```regex
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

### Lab ID

Formato:

```text
lNNN
```

Ejemplos:

```text
l001
l002
l015
l120
```

Regla:

```regex
^l\d{3}$
```

### Task ID

Formato:

```text
tNNN
```

Ejemplos:

```text
t001
t002
t010
```

Regla:

```regex
^t\d{3}$
```

### Step ID

Formato:

```text
sNNN
```

Ejemplos:

```text
s001
s002
s015
```

Regla:

```regex
^s\d{3}$
```

## Identidad vs número y posición

`lab_id` no representa el número visible del Lab.

Un Lab puede conservar su identidad aunque cambie de posición.

Ejemplo inicial:

```text
posición 1 → l001
posición 2 → l002
posición 3 → l003
posición 4 → l004
```

Si posteriormente se inserta un nuevo Lab entre los dos primeros:

```text
posición 1 → l001
posición 2 → l005
posición 3 → l002
posición 4 → l003
posición 5 → l004
```

`l002`, `l003` y `l004` conservan su identidad.

El nuevo Lab recibe el siguiente identificador nunca utilizado: `l005`.

## No reutilización de IDs

Un identificador retirado no debe utilizarse para representar otro elemento.

Si:

```text
l003 → retirado
```

un Lab completamente nuevo debe recibir el siguiente ID nunca utilizado, por
ejemplo:

```text
l005
```

No debe reutilizar:

```text
l003
```

Si `l003` vuelve a publicarse posteriormente, representa el mismo Lab histórico
y LabControl puede reactivarlo conservando su identidad.

## Metadata del Lab

Un laboratorio integrado con LabControl utiliza:

```yaml
course_id: terraform-aws-essentials
lab_id: l001
tracking: true

lab_number: 1
position: 1
```

Las responsabilidades son diferentes:

```text
course_id   identidad estable del curso
lab_id      identidad estable del Lab
lab_number  número visible actual
position    orden actual dentro del curso
```

`lab_number` y `position` pueden cambiar.

`course_id` y `lab_id` no deben cambiar después de publicarse.

## Catálogo activo

La versión actual del catálogo público requiere que los Labs activos tengan:

```text
lab_number == position
```

y que sus posiciones formen una secuencia consecutiva:

```text
1, 2, 3, ... N
```

Los Labs retirados no forman parte del catálogo público activo, pero LabControl
conserva su historial.

## Task ID

Cada tarea rastreable establece explícitamente su identificador:

```liquid
{% assign tracking_task_id = "t001" %}
```

Ejemplo:

```text
t001
├── s001
└── s002

t002
├── s003
└── s004
```

Los `task_id` son únicos dentro del Lab.

Cambiar el título o la posición visual de una Task no debe cambiar su ID.

## Step ID

Cada paso rastreable establece un identificador explícito:

```liquid
{% include step_label.html id="s001" %}
```

El número visual mostrado al participante puede cambiar independientemente del
`step_id`.

Cada `step_id` debe ser único dentro del Lab completo.

## Asignación de nuevos Task y Step IDs

Cuando se agrega una Task nueva debe utilizarse el siguiente `tNNN` nunca
utilizado dentro del Lab.

Cuando se agrega un Step nuevo debe utilizarse el siguiente `sNNN` nunca
utilizado dentro del Lab.

Ejemplo:

```text
t001
├── s001
└── s002

t002
├── s003
└── s004
```

Si posteriormente se elimina `s002` y se agrega un Step completamente nuevo,
no se reutiliza `s002`.

El nuevo Step recibe, por ejemplo:

```text
s005
```

La misma regla aplica para Tasks.

## Compatibilidad legacy

Los laboratorios anteriores pueden utilizar:

```liquid
{% include step_label.html %}
```

sin ID explícito.

En esos Labs puede existir progreso local con identificadores históricos como:

```text
a:1
a:2
a:3
```

Estos identificadores se mantienen únicamente por compatibilidad local.

Un Lab con:

```yaml
tracking: true
```

debe utilizar IDs oficiales explícitos:

```text
lNNN
tNNN
sNNN
```

## Manifiesto oficial

Los Labs con tracking generan un manifiesto oficial mediante:

```bash
node scripts/generate_lab_manifest.mjs labs/lab1/lab1.md
```

Para procesar todos los Labs compatibles:

```bash
node scripts/generate_lab_manifest.mjs --all
```

Los manifests locales se generan en:

```text
.labcontrol/manifests/<course_id>/<lab_id>.json
```

Ejemplo:

```text
.labcontrol/
└── manifests/
    └── terraform-aws-essentials/
        ├── l001.json
        └── l002.json
```

`.labcontrol/` es un directorio generado y no se versiona en Git.

## Estructura del manifest

Ejemplo:

```json
{
  "version": 1,
  "hash": "sha256:...",
  "tasks": [
    {
      "taskId": "t001",
      "title": "Configurar el entorno",
      "position": 1,
      "steps": [
        {
          "stepId": "s001",
          "position": 1
        },
        {
          "stepId": "s002",
          "position": 2
        }
      ]
    }
  ]
}
```

El `hash` se calcula de forma determinista a partir de la estructura oficial.

Si Tasks, Steps, títulos y posiciones rastreadas no cambian, volver a ejecutar
el generador produce el mismo hash.

## Catálogo público del curso

Después de generar los manifests se ejecuta:

```bash
node scripts/generate_course_catalog.mjs
```

y se genera:

```text
labcontrol/<course_id>/course.json
```

El catálogo contiene los Labs publicados con tracking y es la fuente que
LabControl consulta mediante:

```text
Sincronizar todo
Sincronizar lab
```

## Validaciones

Los generadores rechazan, entre otros casos:

- `course_id` inválido;
- `lab_id` distinto de `lNNN`;
- `task_id` distinto de `tNNN`;
- `step_id` distinto de `sNNN`;
- Task ID duplicado;
- Step ID duplicado dentro del Lab;
- Step sin Task asociada;
- Step sin ID explícito;
- Task rastreable sin Steps;
- `lab_number` duplicado;
- `position` duplicada;
- huecos en la numeración activa;
- `lab_number` y `position` desalineados;
- falta del manifest oficial.

## Reglas de estabilidad

Después de publicar un elemento:

1. No cambiar su identificador porque cambie el título.
2. No cambiar su identificador porque cambie su posición.
3. No reutilizar un ID retirado para representar otro elemento.
4. No derivar identidad de texto visible.
5. Los nuevos elementos reciben IDs nuevos.
6. Cada `task_id` es único dentro del Lab.
7. Cada `step_id` es único dentro del Lab.
8. Un Lab retirado que vuelve conserva su `lab_id`.
9. Los IDs legacy quedan únicamente para compatibilidad local.

## Responsabilidades de Jekyll

Jekyll es la fuente de verdad del contenido y proporciona:

```text
course_id
lab_id
task_id
step_id
lab_number
position
manifest
course.json
```

También determina qué Labs están actualmente publicados.

## Responsabilidades de LabControl

LabControl:

- conserva la identidad histórica de cada Lab;
- descarga el catálogo Jekyll;
- crea Labs nuevos;
- actualiza metadata;
- reordena Labs;
- retira Labs ausentes del catálogo;
- reactiva Labs que vuelven a aparecer;
- conserva progreso histórico;
- almacena manifests;
- valida Tasks y Steps;
- registra `LabProgress` y `StepProgress`.

## Flujo de integración

```text
labN.md
   ↓
generate_lab_manifest.mjs
   ↓
.labcontrol/manifests/
   ↓
generate_course_catalog.mjs
   ↓
labcontrol/<course_id>/course.json
   ↓
GitHub Pages
   ↓
LabControl
   ↓
Sincronizar todo / Sincronizar lab
```
