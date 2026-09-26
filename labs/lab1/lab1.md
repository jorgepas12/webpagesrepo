---
layout: lab

course_id: terraform-aws-essentials
lab_id: lab-01
tracking: true

title: "Práctica 1: CAMBIAR_AQUI_NOMBRE_DE_LA_PRACTICA"
permalink: /lab1/lab1/
images_base: /labs/lab1/img
duration: "## minutos"

objective:
  - OBJECTIVO_DE_LA_PRACTICA

prerequisites:
  - PREREQUISITO_1
  - PREREQUISITO_2
  - PREREQUISITO_3
  - PREREQUISITO_4
  - PREREQUISITO_X

introduction:
  - INTRODUCCIÓN_DE_LA_PRACTICA_BREVE_RESUMEN_EN_UN_SOLO_PARRAFO_RECOMENDADO

slug: lab1
lab_number: 1

final_result: >
  RESULTADO_FINAL_ESPERADO_DE_LA_PRACTICA_EN_UN_SOLO_PARRAFO_RECOMENDADO

notes:
  - NOTAS_CONSIDERACIONES_ADICIONALES
  - NOTAS_CONSIDERACIONES_ADICIONALES

references:
  - text: DESCRIPCION DEL LINK DE REFERENCIA
    url: https://developer.hashicorp.com/terraform

  - text: DESCRIPCION DEL LINK DE REFERENCIA
    url: https://learn.microsoft.com/es-es/cli/azure/

prev: /
next: /lab2/lab2/
---

---

<!-- Aquí comienzan las instrucciones paso a paso de la práctica -->

## Tarea 1. NOMBRE DE LA TAREA

DESCRIPCION DE LA TAREA

{% assign tracking_task_id = "task-01" %}

### Tarea 1.1. NOMBRE DE LA SUBTAREA

DESCRIPCION DE LA SUBTAREA

- {% include step_label.html id="step-01" %} Una vez descargado el archivo, haz clic derecho sobre él.

- {% include step_label.html id="step-02" %} Haz clic en **Abrir con Visual Studio Code**.

  {% include step_image.html %}

  > **Importante:** Si la carpeta TERRALABS no existe, créala en el Escritorio.
  {: .lab-note .important .compact}

  > **Nota:** Si la carpeta Terraform no existe, créala en el directorio `C:\`.
  {: .lab-note .info .compact}

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[0] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}
