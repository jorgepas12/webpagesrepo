# Tracking identifiers

Este documento define el contrato de identificación utilizado para integrar
los laboratorios Jekyll con LabControl.

## Objetivo

Los identificadores de tracking permiten relacionar de forma estable:

- cursos;
- laboratorios;
- tareas;
- pasos;

con los registros almacenados en LabControl.

Los identificadores no representan posiciones visuales.

Una vez publicado un identificador, no debe cambiarse aunque el elemento sea
renombrado o reordenado.

## Jerarquía

La identidad lógica completa es:

```text
course_id
└── lab_id
    └── task_id
        └── step_id
```

Ejemplo:

```text
terraform-aws-essentials
└── lab-01
    ├── task-01
    │   ├── task-01-step-01
    │   └── task-01-step-02
    └── task-02
        ├── task-02-step-01
        └── task-02-step-02
```

## Formato

Los identificadores deben:

- utilizar minúsculas;
- utilizar kebab-case;
- contener letras, números y guiones;
- no contener espacios;
- no depender del título visible;
- permanecer estables después de ser publicados.

Ejemplos válidos:

```text
terraform-aws-essentials
lab-01
task-01
task-01-step-01
configure-provider
verify-deployment
```

## Course ID

Cada curso debe tener un `course_id` estable.

Ejemplo:

```yaml
course_id: terraform-aws-essentials
```

El nombre visible del curso puede cambiar sin modificar este identificador.

## Lab ID

Cada laboratorio debe tener un `lab_id` estable dentro de su curso.

Ejemplo:

```yaml
lab_id: lab-01
```

`lab_id` no debe modificarse si el laboratorio cambia de posición.

Por ejemplo, un laboratorio identificado como:

```text
lab-01
```

puede convertirse visualmente en la Práctica 2 y conservar el mismo
identificador.

## Task ID

Cada tarea que contenga pasos rastreables debe establecer un `task_id`.

Ejemplo:

```liquid
{% assign tracking_task_id = "task-01" %}
```

El identificador se mantiene aunque cambie:

```text
Tarea 1
```

por:

```text
Tarea 2
```

en la presentación del laboratorio.

Los `task_id` deben ser únicos dentro de cada Lab.

## Step ID

Cada paso rastreable debe establecer un identificador explícito:

```liquid
{% include step_label.html id="task-01-step-01" %}
```

El HTML generado incluye:

```html
data-task-id="task-01"
data-step-id="task-01-step-01"
```

El número visual mostrado al participante continúa siendo generado por
`step_label.html`.

Por lo tanto:

```text
Paso 1.
```

no tiene que coincidir permanentemente con:

```text
task-01-step-01
```

## Unicidad de Step ID

Para Labs integrados con LabControl, cada `step_id` debe ser único dentro del
Lab completo, no solamente dentro de su Task.

Ejemplo válido:

```text
task-01
├── task-01-step-01
└── task-01-step-02

task-02
├── task-02-step-01
└── task-02-step-02
```

No debe utilizarse esta estructura:

```text
task-01
├── step-01
└── step-02

task-02
├── step-01
└── step-02
```

porque `step-01` y `step-02` quedarían duplicados dentro del mismo Lab.

Esta regla es necesaria porque:

- `lab-progress.js` almacena progreso local utilizando `step_id`;
- `lab-tracker.js` identifica Steps mediante `data-step-id`;
- el manifiesto oficial valida que cada `step_id` sea único;
- evita colisiones al sincronizar progreso local y remoto.

Un Lab que tenga una sola Task puede utilizar IDs sencillos como:

```text
step-01
step-02
step-03
```

siempre que permanezcan únicos dentro de ese Lab.

Sin embargo, para Labs con múltiples Tasks se recomienda utilizar el prefijo
de la Task:

```text
task-01-step-01
task-01-step-02
task-02-step-01
task-02-step-02
```

## Compatibilidad legacy

Los laboratorios anteriores que utilicen:

```liquid
{% include step_label.html %}
```

sin un `id` explícito continúan funcionando localmente.

En ese caso `step_label.html` utiliza como fallback el identificador histórico:

```text
a:1
a:2
a:3
```

Estos identificadores legacy son válidos para progreso local, pero un Lab con:

```yaml
tracking: true
```

debe utilizar IDs explícitos y estables.

## Metadata del laboratorio

Un laboratorio preparado para tracking utiliza:

```yaml
course_id: terraform-aws-essentials
lab_id: lab-01
tracking: true
```

El layout publica esta información como atributos HTML:

```html
<article
  class="lab"
  data-course-id="terraform-aws-essentials"
  data-lab-id="lab-01"
  data-tracking="true">
```

## Manifiesto oficial

Los Labs con tracking generan un manifiesto oficial que LabControl utiliza
para conocer la estructura válida de Tasks y Steps.

El generador es:

```bash
node scripts/generate_lab_manifest.mjs labs/lab1/lab1.md
```

Para procesar todos los Labs compatibles:

```bash
node scripts/generate_lab_manifest.mjs --all
```

Los manifiestos se generan localmente en:

```text
.labcontrol/manifests/<course_id>/<lab_id>.json
```

Ejemplo:

```text
.labcontrol/
└── manifests/
    └── terraform-aws-essentials/
        └── lab-01.json
```

`.labcontrol/` es un directorio generado y no se versiona en Git.

## Estructura del manifiesto

Ejemplo:

```json
{
  "version": 1,
  "hash": "sha256:...",
  "tasks": [
    {
      "taskId": "task-01",
      "title": "Configurar el entorno",
      "position": 1,
      "steps": [
        {
          "stepId": "task-01-step-01",
          "position": 1
        },
        {
          "stepId": "task-01-step-02",
          "position": 2
        }
      ]
    }
  ]
}
```

El `hash` se calcula de manera determinista utilizando la estructura oficial
del manifiesto.

Si Tasks, Steps, posiciones o títulos rastreados no cambian, ejecutar el
generador nuevamente produce el mismo hash.

## Validaciones del generador

El generador rechaza un Lab cuando detecta, entre otros casos:

- ausencia de `tracking: true`;
- `course_id` inválido;
- `lab_id` inválido;
- `task_id` inválido;
- `task_id` duplicado;
- `step_label.html` sin `id` explícito;
- Step sin una Task asociada;
- `step_id` inválido;
- `step_id` duplicado dentro del Lab;
- Task rastreable sin ningún Step.

Los identificadores utilizan kebab-case.

## Reglas de estabilidad

Después de publicar un Lab:

1. No reutilizar un ID eliminado para representar otro elemento.
2. No renumerar IDs porque cambie la posición visual.
3. No cambiar un ID solamente porque cambió el título.
4. No utilizar texto visible como identificador persistente.
5. Los nuevos elementos reciben IDs nuevos.
6. Cada `task_id` debe ser único dentro del Lab.
7. Cada `step_id` debe ser único dentro del Lab.
8. Los IDs legacy `a:N`, `b:N`, `c:N` y `d:N` se mantienen únicamente por compatibilidad local.

## Responsabilidades de Jekyll

Jekyll proporciona:

```text
course_id
lab_id
task_id
step_id
```

También genera el manifiesto oficial de cada Lab rastreable.

## Responsabilidades de LabControl

LabControl relaciona los identificadores Jekyll con:

```text
Course
Lab
CourseSession
Enrollment
LabProgress
StepProgress
```

LabControl también:

- almacena el manifiesto oficial;
- valida `task_id` y `step_id`;
- calcula el progreso con el total oficial de Steps;
- determina cuándo un Lab está `READY_FOR_REVIEW`;
- registra la aprobación del instructor.

## Flujo de integración

```text
Jekyll labN.md
    ↓
generate_lab_manifest.mjs
    ↓
manifest JSON
    ↓
LabControl
    ↓
validación de Task/Step
    ↓
StepProgress
    ↓
READY_FOR_REVIEW
    ↓
APPROVED
```
