---
layout: lab
title: "Práctica 6: Implementación del Ciclo de Vida con Terraform CLI"
permalink: /capitulo5/lab6/
images_base: /labs/capitulo5/img6
duration: "35 minutos"
objective:
  - Ejecutar el ciclo de vida completo de infraestructura usando Terraform CLI. inicialización, planificación, aplicación, consulta de salidas y destrucción. Se usará el archivo `main.tf` existente con recursos definidos y variables locales, tal como se organizó en prácticas anteriores.
prerequisites:
  - Tener la carpeta `TERRALABS` con el archivo `main.tf`
  - Tener configurada la variable `initials` con tus iniciales.
  - Tener instalada la CLI de Terraform y Azure CLI (`az login`).
introduction:
  - En esta práctica se recorrerá el **ciclo de vida completo de Terraform**, ejecutando los comandos `terraform init`, `plan`, `apply`, `output` y `destroy` para inicializar el proyecto, revisar el plan de ejecución, aplicar los cambios, consultar salidas y, opcionalmente, eliminar la infraestructura; con ello, se consolida el flujo de trabajo de **Terraform CLI en Azure**, pasando de la definición en código a la creación y gestión real de recursos en la nube.
slug: lab6
lab_number: 6
final_result: |
  - Se habrán recorrido todas las fases del ciclo de vida:
    - `init`: inicialización
    - `plan`: vista previa
    - `apply`: aplicación de infraestructura
    - `output`: consulta de resultados
    - `destroy`: eliminación (opcional)
  - Se experimento el flujo completo de trabajo de Terraform CLI con Azure.
notes:
  - Usa `terraform show` si deseas revisar el estado actual detallado.
  - Puedes usar `terraform state list` para ver todos los recursos administrados.
  - Ejecuta `terraform validate` para verificar errores de sintaxis en tus archivos antes de `plan`.
references:
prev: /capitulo4/lab5/        
next: /capitulo6/lab7/
---


---

### Tarea 1. Inicializar el proyecto

Este paso prepara Terraform para usar los proveedores declarados en el archivo `main.tf`.

#### Tarea 1.1. Ejecutar `terraform init`

- **Paso 1.** Aplica el siguiente comando en la terminal.

  ```bash
  terraform init
  ```
   
  ![terraimg25]({{ page.images_base | relative_url }}/img1.png)

- **Paso 2.** Analiza la salida del comando.

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[0] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 2. Revisar el plan de ejecución

Este paso permite revisar lo que Terraform va a crear sin aplicar cambios aún.

#### Tarea 2.1. Ejecutar `terraform plan`

- **Paso 3.** Aplica el siguiente comando en la terminal.

  ```bash
  terraform plan
  ```

  ![terraimg26]({{ page.images_base | relative_url }}/img2.png)
  ![terraimg27]({{ page.images_base | relative_url }}/img3.png)

- **Paso 4.** Analiza la salida del comando.

- **Paso 5.** Aplica el siguiente comando en la terminal forzando el cambio del valor de la variable `initials`.

  > **NOTA:** Reemplaza `xxx` por otras iniciales.
  {: .lab-note .info .compact}

  ```bash
  terraform plan -var="initials=xxx"
  ```
  
  ![terraimg28]({{ page.images_base | relative_url }}/img4.png)

- **Paso 6.** Analiza la salida del comando nota como todos los nombres cambiaron

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[1] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 3. Aplicar los cambios

Este paso crea los recursos en Azure según lo definido en el archivo `main.tf`.

#### Tarea 3.1. Ejecutar `terraform apply`.

- **Paso 7.** Aplica el siguiente comando en la terminal.

  ```bash
  terraform apply
  ```

- **Paso 8.** Analiza la salida del comando notaras que es similar al comando `terraform plan`.

- **Paso 9.** Cuanto hayas terminado de revisar el `apply`, confirma con **`yes`** cuando Terraform lo solicite.

  > **NOTA:** Tambien puedes usar el comando `terraform apply -auto-approve` es util cuando quieres omitir la confirmacio `yes`.
  {: .lab-note .info .compact}

  ![terraimg29]({{ page.images_base | relative_url }}/img5.png)

- **Paso 10.** Analiza los logs de la creacion de los recursos:

  ![terraimg30]({{ page.images_base | relative_url }}/img6.png)

- **Paso 11.** Revisa los `outputs` generados por el `apply`.

  ![terraimg31]({{ page.images_base | relative_url }}/img7.png)

- **Paso 12.** Ahora copia el valor del output llamado `aci_fqdn` y pegalo en una pestaña de tu navegador.

  ![terraimg32]({{ page.images_base | relative_url }}/img8.png)
  ![terraimg33]({{ page.images_base | relative_url }}/img9.png)


{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[2] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 4. Consultar los outputs

Puedes consultar las salidas después del despliegue sin volver a aplicar.

#### Tarea 4.1. Ejecutar `terraform output`

- **Paso 13.** Aplica el siguiente comando en la terminal.

  ```bash
  terraform output
  ```

  ![terraimg34]({{ page.images_base | relative_url }}/img10.png)


#### Tarea 4.2. Consultar una salida específica (opcional)

- **Paso 14.** Aplica el siguiente comando en la terminal.

  ```bash
  terraform output aci_fqdn
  ```

  ![terraimg35]({{ page.images_base | relative_url }}/img11.png)

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[3] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 5. Destruir los recursos (opcional)

Este paso elimina toda la infraestructura creada. Úsalo solo si deseas limpiar el entorno.

#### Tarea 5.1. Ejecutar `terraform destroy`

- **Paso 15.** Aplica el siguiente comando en la terminal.

  > **NOTA:** Las imagenes omiten los detalles de eliminación.
  {: .lab-note .info .compact}

  ```bash
  terraform destroy -auto-approve
  ```

  ![terraimg36]({{ page.images_base | relative_url }}/img12.png)
  ![terraimg37]({{ page.images_base | relative_url }}/img13.png)
  ![terraimg38]({{ page.images_base | relative_url }}/img14.png)
  ![terraimg30]({{ page.images_base | relative_url }}/img15.png)

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[4] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}
