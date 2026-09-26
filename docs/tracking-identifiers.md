# Tracking identifiers

Este documento define el contrato de identificación utilizado para integrar
los laboratorios Jekyll con LabControl.

## Objetivo

Los identificadores de tracking permiten relacionar de forma estable:

- cursos;
- laboratorios;
- tareas;
- pasos;

con los registros almacenados posteriormente en LabControl.

Los identificadores no representan posiciones visuales.

Una vez publicado un identificador, no debe cambiarse aunque el elemento sea
renombrado o reordenado.

## Jerarquía

La identidad lógica completa es:

course_id
└── lab_id
    └── task_id
        └── step_id

Ejemplo:

terraform-aws-essentials
└── lab-01
    └── task-01
        ├── step-01
        └── step-02

## Formato

Los identificadores deben:

- utilizar minúsculas;
- utilizar kebab-case;
- contener letras, números y guiones;
- no contener espacios;
- no depender del título visible;
- permanecer estables después de ser publicados.

Ejemplos válidos:

terraform-aws-essentials
lab-01
task-01
step-01
configure-provider
verify-deployment

## Course ID

Cada curso debe tener un `course_id` estable.

Ejemplo:

course_id: terraform-aws-essentials

El nombre visible del curso puede cambiar sin modificar este identificador.

## Lab ID

Cada laboratorio debe tener un `lab_id` estable dentro de su curso.

Ejemplo:

lab_id: lab-01

`lab_id` no debe modificarse si el laboratorio cambia de posición.

Por ejemplo, un laboratorio identificado como:

lab-01

puede convertirse visualmente en la Práctica 2 y conservar el mismo
identificador.

## Task ID

Cada tarea que contenga pasos rastreables debe establecer un `task_id`.

Ejemplo:

{% assign tracking_task_id = "task-01" %}

El identificador se mantiene aunque cambie:

Tarea 1

por:

Tarea 2

en la presentación del laboratorio.

## Step ID

Cada paso puede establecer un identificador explícito:

{% include step_label.html id="step-01" %}

El HTML generado incluye:

data-task-id="task-01"
data-step-id="step-01"

El número visual mostrado al participante continúa siendo generado por
`step_label.html`.

Por lo tanto:

Paso 1.

no tiene que coincidir permanentemente con:

step-01

## Compatibilidad

Los laboratorios anteriores que utilicen:

{% include step_label.html %}

sin un `id` explícito continúan funcionando.

En ese caso `step_label.html` utiliza como fallback el identificador histórico:

a:1
a:2
a:3

Estos identificadores legacy son válidos para progreso local, pero los labs
integrados con LabControl deberán utilizar IDs explícitos y estables.

## Metadata del laboratorio

Un laboratorio preparado para tracking utiliza:

course_id: terraform-aws-essentials
lab_id: lab-01
tracking: true

El layout publica esta información como atributos HTML:

<article
  class="lab"
  data-course-id="terraform-aws-essentials"
  data-lab-id="lab-01"
  data-tracking="true">

## Reglas de estabilidad

Después de publicar un lab:

1. No reutilizar un ID eliminado para representar otro elemento.
2. No renumerar IDs porque cambie la posición visual.
3. No cambiar un ID solamente porque cambió el título.
4. No utilizar texto visible como identificador persistente.
5. Los nuevos elementos reciben IDs nuevos.
6. Los IDs legacy `a:N`, `b:N`, `c:N` y `d:N` se mantienen únicamente por compatibilidad.

## Responsabilidades

Jekyll proporciona:

course_id
lab_id
task_id
step_id

LabControl será responsable posteriormente de relacionar esos IDs con:

Course
Lab
CourseSession
Enrollment
LabProgress
StepProgress

La autenticación de participantes y la sincronización con la API se
implementarán en fases posteriores.
