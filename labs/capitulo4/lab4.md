---
layout: lab
title: "Práctica 4: Creación y Asignación de Variables en Terraform"
permalink: /capitulo4/lab4/
images_base: /labs/capitulo4/img4
duration: "15 minutos"
objective:
  - Refactorizar el archivo `main.tf` utilizando variables locales definidas en el mismo archivo, para hacer el código más organizado y reutilizable. Se declaran variables directamente en `main.tf` y se usan para crear un grupo de recursos, una red virtual y una instancia de contenedor en Azure.
prerequisites:
  - Haber completado la Práctica 3 con los recursos definidos. `azurerm_resource_group`,`azurerm_virtual_network` y `azurerm_container_group`.
  - Tener configurado el proveedor `azurerm` en el archivo `main.tf`.
  - Estar autenticado con Azure CLI `az login`.
  - Tener la carpeta `TERRALABS` con el archivo `main.tf`.
introduction:
  - En esta práctica aprenderás a **declarar variables** en Terraform dentro del archivo **`main.tf`**, usando bloques `variable` y `locals` para centralizar la configuración. Posteriormente, se **reescribirán los recursos existentes** (Grupo de Recursos, Red Virtual e Instancia de Contenedor) para que consuman dichas variables, logrando un código más **reutilizable, flexible y fácil de mantener**, donde solo basta cambiar las iniciales para generar ambientes distintos sin modificar manualmente cada recurso.
slug: lab4
lab_number: 4
final_result: |
  El archivo `main.tf` contiene:
    - Declaración de una variable `initials`.
    - Definición de valores con `locals`.
    - Todos los recursos (`RG`, `VNet`, `ACI`) usando estos valores.

  Esto facilita la reutilización del código y permite crear múltiples ambientes solo cambiando el valor de `initials`.
notes: |
  Esta solo es información de referencia, no se debe usar en la practica.
  - El siguiente comando ayudaria a pasar el valor así.

  ```bash
  terraform apply -var="initials=xxx"
  ```

  - Alternativamente, puedes establecer un valor por defecto en la variable `initials` si no usarás `-var` en la terminal.
  - Este enfoque simplifica el despliegue sin archivos externos como `variables.tf` o `tfvars`.
references:
prev: /capitulo3/lab3/        
next: /capitulo4/lab5/
---


---

### Tarea 1. Declarar las variables dentro de `main.tf`

En esta tarea se crearán las variables directamente al inicio del archivo `main.tf`, dentro de bloques `variable`, y se asignarán sus valores en el bloque `locals`.

#### Tarea 1.1. Abrir el archivo `main.tf`

- **Paso 1.** Abre **Visual Studio Code**.

- **Paso 2.** Navega a la carpeta `TERRALABS` y abre `main.tf`.

#### Tarea 1.2. Añadir bloques de variables y valores

- **Paso 3.** Añade la variable `initials` con el valor de forma local, copia el siguiente codigo antes de los recursos y despues del proveedor declarado. **`Sustituye el valor del parametro default por tus iniciales`**:

  ```hcl
  variable "initials" {
    description = "Iniciales del estudiante"
    type        = string
    default     = "xxx"
  }
  ```

- **Paso 4.** Copia este bloque al inicio del archivo, antes de los recursos y despues de la variable `initials` declarada:

  ```hcl
  locals {
    location             = "East US"
    resource_group_name  = "rg-vnet-${var.initials}"
    vnet_name            = "vnet-${var.initials}"
    aci_name             = "aci-${var.initials}"
    aci_dns_label        = "acilab-${lower(var.initials)}"
  }
  ```
  
  ![terraimg22]({{ page.images_base | relative_url }}/img1.png)

{% assign results = site.data.task_results[page.slug].results %}
{% capture r1 %}{{ results[0] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 2. Reescribir los recursos para usar las variables

En esta tarea se actualizarán los recursos ya existentes en `main.tf` para que usen las variables y valores del bloque `locals`.

#### Tarea 2.1. Sustituir los valores fijos en los recursos

- **Paso 5.** Asegúrate de tener estos recursos definidos, ahora con variables:

  - **Opcion 1:** Puedes copiar y pegar todo el siguiente bloque ya tiene los cambios de las variables.

  - **Opcion 2:** Puedes buscar solo las lineas que necesitan las variables y cambiarlas, puees apoyarte de la imagen.

  ```hcl
  resource "azurerm_resource_group" "rg_demo" {
    name     = local.resource_group_name
    location = local.location
  }

  resource "azurerm_virtual_network" "vnet_demo" {
    name                = local.vnet_name
    address_space       = ["10.0.0.0/16"]
    location            = local.location
    resource_group_name = local.resource_group_name
  }

  resource "azurerm_container_group" "aci_demo" {
    name                = local.aci_name
    location            = local.location
    resource_group_name = local.resource_group_name
    os_type             = "Linux"

    container {
      name   = "webapp"
      image  = "mcr.microsoft.com/azuredocs/aci-helloworld"
      cpu    = "0.5"
      memory = "1.5"

      ports {
        port     = 80
        protocol = "TCP"
      }
    }

    ip_address_type = "public"
    dns_name_label  = local.aci_dns_label

    tags = {
      environment = "dev"
    }
  }
  ```
  
  ![terraimg23]({{ page.images_base | relative_url }}/img2.png)

{% assign results = site.data.task_results[page.slug].results %}
{% capture r1 %}{{ results[1] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}