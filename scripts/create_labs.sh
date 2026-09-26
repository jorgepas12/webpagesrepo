#!/usr/bin/env bash
# ------------------------------------------------------------
# Script: create_labs.sh
# Descripción:
#   - Crea la estructura base de prácticas Jekyll en labs/labN/.
#   - Crea automáticamente la carpeta img de cada práctica.
#   - Genera el archivo labN.md con la plantilla actualizada.
#   - Configura prev/next de forma automática.
#   - No sobrescribe prácticas existentes.
#   - Mantiene compatibilidad con el modo legacy.
#   - Permite generar labs preparados para tracking con LabControl.
#
# Uso:
#   1) Dar permisos de ejecución (solo la primera vez):
#        chmod +x scripts/create_labs.sh
#
#   2) Crear prácticas en modo legacy:
#        ./scripts/create_labs.sh 5
#
#   3) Crear prácticas con tracking:
#        ./scripts/create_labs.sh 5 terraform-aws-essentials
#
# El segundo argumento es el course_id estable utilizado por LabControl.
#
# Para pruebas puede sobrescribirse ROOT_DIR:
#   ROOT_DIR=labs-test ./scripts/create_labs.sh 2 terraform-aws-essentials
# ------------------------------------------------------------

set -euo pipefail

ROOT_DIR="${ROOT_DIR:-labs}"
TOTAL_LABS="${1:-}"
COURSE_ID="${2:-}"
TRACKING_ENABLED="false"

if [[ -z "${TOTAL_LABS}" ]]; then
  echo "Uso:"
  echo "  $0 <numero_de_labs>"
  echo "  $0 <numero_de_labs> <course_id>"
  echo
  echo "Ejemplos:"
  echo "  $0 5"
  echo "  $0 5 terraform-aws-essentials"
  exit 1
fi

if ! [[ "${TOTAL_LABS}" =~ ^[1-9][0-9]*$ ]]; then
  echo "Error: <numero_de_labs> debe ser un entero mayor que 0."
  exit 1
fi

if [[ -n "${COURSE_ID}" ]]; then
  if ! [[ "${COURSE_ID}" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
    echo "Error: <course_id> debe usar kebab-case."
    echo "Ejemplo válido: terraform-aws-essentials"
    exit 1
  fi

  TRACKING_ENABLED="true"
fi

mkdir -p "${ROOT_DIR}"

echo
echo "Configuración:"
echo "  Directorio: ${ROOT_DIR}"
echo "  Labs: ${TOTAL_LABS}"

if [[ "${TRACKING_ENABLED}" == "true" ]]; then
  echo "  Tracking: habilitado"
  echo "  Course ID: ${COURSE_ID}"
else
  echo "  Tracking: legacy"
fi

echo

for i in $(seq 1 "${TOTAL_LABS}"); do
  LAB_DIR="${ROOT_DIR}/lab${i}"
  IMG_DIR="${LAB_DIR}/img"
  MD_FILE="${LAB_DIR}/lab${i}.md"

  if [[ "${i}" -eq 1 ]]; then
    PREV_PATH="/"
  else
    PREV_NUM=$((i - 1))
    PREV_PATH="/lab${PREV_NUM}/lab${PREV_NUM}/"
  fi

  if [[ "${i}" -eq "${TOTAL_LABS}" ]]; then
    NEXT_PATH="/"
  else
    NEXT_NUM=$((i + 1))
    NEXT_PATH="/lab${NEXT_NUM}/lab${NEXT_NUM}/"
  fi

  LAB_TRACKING_ID=$(printf "lab-%02d" "${i}")

  if [[ "${TRACKING_ENABLED}" == "true" ]]; then
    printf -v TRACKING_FRONT_MATTER \
      'course_id: %s\nlab_id: %s\ntracking: true\n\n' \
      "${COURSE_ID}" \
      "${LAB_TRACKING_ID}"

    TASK1_TRACKING='{% assign tracking_task_id = "task-01" %}'
    TASK2_TRACKING='{% assign tracking_task_id = "task-02" %}'
    TASK3_TRACKING='{% assign tracking_task_id = "task-03" %}'

    TASK1_STEP1='{% include step_label.html id="task-01-step-01" %}'
    TASK1_STEP2='{% include step_label.html id="task-01-step-02" %}'
    TASK1_STEP3='{% include step_label.html id="task-01-step-03" %}'

    TASK2_STEP1='{% include step_label.html id="task-02-step-01" %}'
    TASK2_STEP2='{% include step_label.html id="task-02-step-02" %}'
    TASK2_STEP3='{% include step_label.html id="task-02-step-03" %}'

    TASK3_STEP1='{% include step_label.html id="task-03-step-01" %}'
    TASK3_STEP2='{% include step_label.html id="task-03-step-02" %}'
    TASK3_STEP3='{% include step_label.html id="task-03-step-03" %}'
  else
    TRACKING_FRONT_MATTER=""

    TASK1_TRACKING=""
    TASK2_TRACKING=""
    TASK3_TRACKING=""

    TASK1_STEP1='{% include step_label.html %}'
    TASK1_STEP2='{% include step_label.html %}'
    TASK1_STEP3='{% include step_label.html %}'

    TASK2_STEP1='{% include step_label.html %}'
    TASK2_STEP2='{% include step_label.html %}'
    TASK2_STEP3='{% include step_label.html %}'

    TASK3_STEP1='{% include step_label.html %}'
    TASK3_STEP2='{% include step_label.html %}'
    TASK3_STEP3='{% include step_label.html %}'
  fi

  echo "Creando estructura para ${LAB_DIR}..."
  mkdir -p "${IMG_DIR}"

  if [[ -f "${MD_FILE}" ]]; then
    echo "  -> ${MD_FILE} ya existe, se deja sin cambios."
    continue
  fi

  cat > "${MD_FILE}" <<EOF
---
layout: lab
${TRACKING_FRONT_MATTER}title: "Práctica ${i}: CAMBIAR_AQUI_NOMBRE_DE_LA_PRACTICA"
permalink: /lab${i}/lab${i}/
images_base: /labs/lab${i}/img
duration: "## minutos"
objective:
  - OBJETIVO_DE_LA_PRACTICA
prerequisites:
  - PREREQUISITO_1
  - PREREQUISITO_2
  - PREREQUISITO_3
  - PREREQUISITO_4
  - PREREQUISITO_X
introduction:
  - INTRODUCCION_DE_LA_PRACTICA_BREVE_RESUMEN_EN_UN_SOLO_PARRAFO_RECOMENDADO
slug: lab${i}
lab_number: ${i}
final_result: >
  RESULTADO_FINAL_ESPERADO_DE_LA_PRACTICA_EN_UN_SOLO_PARRAFO_RECOMENDADO
notes:
  - NOTAS_CONSIDERACIONES_ADICIONALES
  - NOTAS_CONSIDERACIONES_ADICIONALES
references:
  - text: DESCRIPCION_DEL_LINK_DE_REFERENCIA
    url: https://developer.hashicorp.com/terraform
  - text: DESCRIPCION_DEL_LINK_DE_REFERENCIA
    url: https://learn.microsoft.com/es-es/cli/azure/
prev: ${PREV_PATH}
next: ${NEXT_PATH}
---

---

<!-- Aquí comienzan las instrucciones paso a paso de la práctica -->

## 🔎 Tarea 1. NOMBRE DE LA TAREA — ## min

<!-- DESCRIPCION DE LA TAREA: RECOMENDADO 200-250 CARACTERES -->
DESCRIPCION_DE_LA_TAREA.

${TASK1_TRACKING}

### Tarea 1.1. NOMBRE_DE_LA_SUBTAREA

<!-- DESCRIPCION DE LA SUBTAREA: RECOMENDADO 120-150 CARACTERES -->
DESCRIPCION_DE_LA_SUBTAREA.

- ${TASK1_STEP1} DESCRIPCION_DEL_PASO_1. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Nota:** NOTA_GENERAL_DEL_PASO.
  {: .lab-note .info .compact}

  {% include step_image.html %}

  \`\`\`bash
  CODIGO_DEL_PASO_1
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_1.
  {: .lab-note .output .compact}

- ${TASK1_STEP2} DESCRIPCION_DEL_PASO_2. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Importante:** CONSIDERACION_IMPORTANTE_DEL_PASO.
  {: .lab-note .important .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_2
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_2.
  {: .lab-note .output .compact}

### Tarea 1.2. NOMBRE_DE_LA_SUBTAREA

<!-- DESCRIPCION DE LA SUBTAREA: RECOMENDADO 120-150 CARACTERES -->
DESCRIPCION_DE_LA_SUBTAREA.

- ${TASK1_STEP3} DESCRIPCION_DEL_PASO_3. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Advertencia:** ADVERTENCIA_DEL_PASO.
  {: .lab-note .warning .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_3
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_3.
  {: .lab-note .output .compact}

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[0] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

{% include support-prompt.html task="tarea1" %}

---

## ☁️ Tarea 2. NOMBRE DE LA TAREA — ## min

<!-- DESCRIPCION DE LA TAREA: RECOMENDADO 200-250 CARACTERES -->
DESCRIPCION_DE_LA_TAREA.

${TASK2_TRACKING}

### Tarea 2.1. NOMBRE_DE_LA_SUBTAREA

<!-- DESCRIPCION DE LA SUBTAREA: RECOMENDADO 120-150 CARACTERES -->
DESCRIPCION_DE_LA_SUBTAREA.

- ${TASK2_STEP1} DESCRIPCION_DEL_PASO_1. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Nota:** NOTA_GENERAL_DEL_PASO.
  {: .lab-note .info .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_1
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_1.
  {: .lab-note .output .compact}

- ${TASK2_STEP2} DESCRIPCION_DEL_PASO_2. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Importante:** CONSIDERACION_IMPORTANTE_DEL_PASO.
  {: .lab-note .important .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_2
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_2.
  {: .lab-note .output .compact}

### Tarea 2.2. NOMBRE_DE_LA_SUBTAREA

<!-- DESCRIPCION DE LA SUBTAREA: RECOMENDADO 120-150 CARACTERES -->
DESCRIPCION_DE_LA_SUBTAREA.

- ${TASK2_STEP3} DESCRIPCION_DEL_PASO_3. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Advertencia:** ADVERTENCIA_DEL_PASO.
  {: .lab-note .warning .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_3
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_3.
  {: .lab-note .output .compact}

{% capture r2 %}{{ results[1] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r2 %}

{% include support-prompt.html task="tarea2" %}

---

## 🚀 Tarea 3. NOMBRE DE LA TAREA — ## min

<!-- DESCRIPCION DE LA TAREA: RECOMENDADO 200-250 CARACTERES -->
DESCRIPCION_DE_LA_TAREA.

${TASK3_TRACKING}

### Tarea 3.1. NOMBRE_DE_LA_SUBTAREA

<!-- DESCRIPCION DE LA SUBTAREA: RECOMENDADO 120-150 CARACTERES -->
DESCRIPCION_DE_LA_SUBTAREA.

- ${TASK3_STEP1} DESCRIPCION_DEL_PASO_1. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Nota:** NOTA_GENERAL_DEL_PASO.
  {: .lab-note .info .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_1
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_1.
  {: .lab-note .output .compact}

- ${TASK3_STEP2} DESCRIPCION_DEL_PASO_2. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Importante:** CONSIDERACION_IMPORTANTE_DEL_PASO.
  {: .lab-note .important .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_2
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_2.
  {: .lab-note .output .compact}

### Tarea 3.2. NOMBRE_DE_LA_SUBTAREA

<!-- DESCRIPCION DE LA SUBTAREA: RECOMENDADO 120-150 CARACTERES -->
DESCRIPCION_DE_LA_SUBTAREA.

- ${TASK3_STEP3} DESCRIPCION_DEL_PASO_3. <!-- DESCRIPCION DEL PASO: RECOMENDADO 120 CARACTERES -->

  > **Advertencia:** ADVERTENCIA_DEL_PASO.
  {: .lab-note .warning .compact}

  \`\`\`bash
  CODIGO_DEL_PASO_3
  \`\`\`

  > **Salida esperada:** DESCRIPCION_DE_LA_SALIDA_ESPERADA_DEL_PASO_3.
  {: .lab-note .output .compact}

{% capture r3 %}{{ results[2] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r3 %}

{% include support-prompt.html task="tarea3" %}

---

<!--
======================================================================
GUÍA DE USO DE LA PLANTILLA DEL LABORATORIO
======================================================================

Este archivo es una plantilla base. Las 3 tareas incluidas sirven únicamente
como referencia de estructura. La práctica final puede tener más o menos
tareas, subtareas y pasos según lo requiera el contenido.

---------------------------------------------------------------------
1. FRONT MATTER
---------------------------------------------------------------------

Completa los campos de la cabecera YAML sin cambiar sus nombres.

Cuando el script se ejecuta con course_id:

  ./scripts/create_labs.sh 5 terraform-aws-essentials

también genera:

  course_id: terraform-aws-essentials
  lab_id: lab-01
  tracking: true

Estos campos forman parte del contrato con LabControl.

IMPORTANTE:

- course_id es estable.
- lab_id es estable.
- No cambies estos IDs solamente porque cambie el título o posición del lab.
- Los IDs publicados no deben reutilizarse para representar otro elemento.

Campos generales:

- title:
    Nombre completo de la práctica.

- duration:
    Duración total estimada de la práctica en minutos.

- objective:
    Objetivo principal de aprendizaje de la práctica.

- prerequisites:
    Requisitos previos necesarios para realizarla.
    Agrega o elimina elementos según corresponda.

- introduction:
    Introducción breve de la práctica. Se recomienda un solo párrafo.

- final_result:
    Resultado final esperado al terminar toda la práctica.
    Se recomienda describirlo en un solo párrafo.

- notes:
    Consideraciones generales que apliquen a toda la práctica.

- references:
    Documentación oficial o referencias técnicas relevantes.

- permalink, images_base, slug y lab_number:
    Son generados automáticamente.

- prev y next:
    Son generados automáticamente por este script.

---------------------------------------------------------------------
2. ESTRUCTURA GENERAL DE UNA TAREA
---------------------------------------------------------------------

Cada tarea debe seguir esta estructura:

  ## ICONO Tarea N. NOMBRE DE LA TAREA — ## min

  DESCRIPCION_DE_LA_TAREA.

Cuando tracking está habilitado, cada tarea debe declarar:

  {% assign tracking_task_id = "task-01" %}

Después:

  ### Tarea N.1. NOMBRE_DE_LA_SUBTAREA

  DESCRIPCION_DE_LA_SUBTAREA.

  - {% include step_label.html id="task-01-step-01" %} DESCRIPCION_DEL_PASO.

La descripción de la tarea debe explicar qué se realizará y para qué.
Como referencia, se recomiendan aproximadamente 200-250 caracteres.

---------------------------------------------------------------------
3. TAREAS E IDENTIFICADORES
---------------------------------------------------------------------

Las tareas principales se numeran visualmente:

  Tarea 1
  Tarea 2
  Tarea 3
  Tarea 4
  ...

Cuando tracking está habilitado, utilizan IDs persistentes:

  task-01
  task-02
  task-03
  task-04

El número visible y el ID persistente son conceptos distintos.

Si una tarea cambia de posición después de ser publicada, conserva su ID.

Para agregar una Tarea 4 con tracking:

  {% assign tracking_task_id = "task-04" %}

Los pasos pueden utilizar:

  {% include step_label.html id="task-04-step-01" %}

IMPORTANTE:

No reutilices un task_id eliminado para una tarea diferente.

---------------------------------------------------------------------
4. SUBTAREAS
---------------------------------------------------------------------

Cada tarea puede contener tantas subtareas como sea necesario.

La numeración visual debe conservar la relación con la tarea principal:

  ### Tarea 4.1. PRIMERA_SUBTAREA
  ### Tarea 4.2. SEGUNDA_SUBTAREA

Las subtareas no requieren actualmente un ID de tracking independiente.

---------------------------------------------------------------------
5. PASOS
---------------------------------------------------------------------

Cada acción que debe realizar el participante debe escribirse como un paso
independiente.

Modo legacy:

  - {% include step_label.html %} DESCRIPCION_DEL_PASO.

Modo tracking:

  - {% include step_label.html id="task-01-step-01" %} DESCRIPCION_DEL_PASO.

Los step_id deben ser únicos dentro de cada laboratorio.

Ejemplo:

  task-01-step-01
  task-01-step-02
  task-01-step-03
  task-02-step-01
  task-02-step-02

IMPORTANTE:

- No renumeres IDs ya publicados.
- No cambies un ID solamente porque cambió el texto visible.
- Los nuevos pasos reciben IDs nuevos.
- No reutilices IDs eliminados para representar pasos diferentes.

El número visible "Paso N." continúa siendo generado automáticamente por
step_label.html.

---------------------------------------------------------------------
6. NOTAS, IMPORTANTES Y ADVERTENCIAS
---------------------------------------------------------------------

Utiliza solamente los bloques que aporten información útil.

Nota informativa:

  > **Nota:** TEXTO.
  {: .lab-note .info .compact}

Consideración importante:

  > **Importante:** TEXTO.
  {: .lab-note .important .compact}

Advertencia:

  > **Advertencia:** TEXTO.
  {: .lab-note .warning .compact}

Salida esperada:

  > **Salida esperada:** TEXTO.
  {: .lab-note .output .compact}

---------------------------------------------------------------------
7. BLOQUES DE CÓDIGO
---------------------------------------------------------------------

Cada comando o fragmento que el participante deba ejecutar debe tener su
propio bloque de código.

Ejemplo:

  \`\`\`bash
  COMANDO
  \`\`\`

Cambia el lenguaje cuando corresponda:

  yaml
  json
  sql
  powershell
  python

---------------------------------------------------------------------
8. SALIDA ESPERADA
---------------------------------------------------------------------

Después de un comando o acción importante debe existir una forma clara de
validar que el paso fue realizado correctamente.

Utiliza:

  > **Salida esperada:** DESCRIPCION_DE_LA_VALIDACION.
  {: .lab-note .output .compact}

---------------------------------------------------------------------
9. IMÁGENES
---------------------------------------------------------------------

La carpeta de imágenes de esta práctica se encuentra en:

  labs/labN/img/

Para insertar una imagen:

  {% include step_image.html %}

No es necesario agregar una imagen a cada paso.

---------------------------------------------------------------------
10. RESULTADO DE CADA TAREA
---------------------------------------------------------------------

Cada tarea debe terminar con un resultado esperado asociado a
_data/task-results.yml.

La asignación debe realizarse una sola vez:

  {% assign results = site.data.task-results[page.slug].results %}

Después utiliza:

  {% capture r1 %}{{ results[0] }}{% endcapture %}
  {% include task-result.html title="Tarea finalizada" content=r1 %}

El arreglo results utiliza índice base 0:

  Tarea 1 -> results[0]
  Tarea 2 -> results[1]
  Tarea 3 -> results[2]
  Tarea N -> results[N-1]

---------------------------------------------------------------------
11. PROMPT DE SOPORTE
---------------------------------------------------------------------

Después del resultado de cada tarea utiliza:

  {% include support-prompt.html task="tarea1" %}

La numeración debe coincidir con la tarea visible.

---------------------------------------------------------------------
12. SEPARACIÓN ENTRE TAREAS
---------------------------------------------------------------------

Separa cada tarea principal utilizando:

  ---

---------------------------------------------------------------------
13. ICONOS DE LAS TAREAS
---------------------------------------------------------------------

El icono del encabezado es visual.

Ejemplos:

  🔎  ☁️  🚀

No forma parte del contrato de tracking.

---------------------------------------------------------------------
14. COMPATIBILIDAD LEGACY
---------------------------------------------------------------------

Si ejecutas:

  ./scripts/create_labs.sh 5

sin course_id, la plantilla conserva el comportamiento histórico:

  {% include step_label.html %}

y no agrega:

  course_id
  lab_id
  tracking
  tracking_task_id
  step_id explícito

Esto permite seguir utilizando repositorios antiguos sin migrarlos
inmediatamente a LabControl.

---------------------------------------------------------------------
15. VALIDACIÓN FINAL DEL ARCHIVO
---------------------------------------------------------------------

Antes de considerar terminado el laboratorio verifica:

- El título y duración son correctos.
- El objetivo describe claramente el aprendizaje esperado.
- La introducción está completa.
- Todas las tareas están numeradas consecutivamente.
- Cada acción está separada como paso cuando corresponde.
- Los comandos tienen bloques de código adecuados.
- Los pasos importantes tienen una salida esperada.
- Los índices results[N] corresponden a cada tarea.
- Cada tarea utiliza support-prompt.html correctamente.
- Las imágenes utilizadas existen.
- El resultado final es correcto.
- Si tracking está habilitado, existen course_id y lab_id.
- Cada tarea rastreable tiene tracking_task_id.
- Cada paso rastreable tiene un step_id explícito y único.
- No se modificaron IDs ya publicados.
- No permanecen textos de marcador como CAMBIAR_AQUI, DESCRIPCION_, NOMBRE_DE_,
  CODIGO_, PREREQUISITO_, RESULTADO_ o ## min.

======================================================================
FIN DE LA GUÍA DE USO DE LA PLANTILLA
======================================================================
-->
EOF

  echo "  -> Creado ${MD_FILE}"
done

echo
echo "Listo. Se generaron las prácticas en ${ROOT_DIR}/"