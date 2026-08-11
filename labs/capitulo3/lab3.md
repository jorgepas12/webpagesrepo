---
layout: lab
title: "Práctica 3: Definición de recursos en Terraform"
permalink: /capitulo3/lab3/
images_base: /labs/capitulo3/img3
duration: "15 minutos"
objective:
  - Definir tres recursos básicos en Azure con Terraform, un grupo de recursos, una red virtual y una instancia de contenedor. Todo se declarará en un solo archivo `main.tf`, personalizando los nombres de recursos con iniciales para evitar conflictos.
prerequisites:
  - Tener la carpeta `TERRALABS` y el archivo `main.tf` ya creado.
  - El proveedor `azurerm` debe estar declarado correctamente en `main.tf`.
  - Azure CLI debe estar autenticado (`az login`).
introduction:
  - En esta práctica se construye un archivo **`main.tf`** en **Terraform** para definir la **infraestructura básica en Azure**, declarando un **Grupo de Recursos**, una **Red Virtual** y una **Instancia de Contenedor**; cada recurso debe **personalizarse con las iniciales del estudiante** para evitar conflictos, y aunque no se ejecutará el **despliegue** todavía, el objetivo es preparar una base sólida de **Infraestructura como Código (IaC)** que será aplicada en la **siguiente práctica**.
slug: lab3
lab_number: 3
final_result: |
  - El archivo `main.tf` en la carpeta `TERRALABS` tiene definidos:
    - Un grupo de recursos personalizado.
    - Una red virtual básica dentro del grupo.
    - Una instancia de contenedor básica conectada a la red pública.
  - Todos los recursos están definidos pero **no se han desplegado aún**. La ejecución se hará en la próxima práctica.
notes:
  - Esta práctica no ejecuta `terraform init`, `plan` ni `apply`.
  - No olvides personalizar todas las apariciones de `xxx` con tus iniciales.
  - El valor `dns_name_label` en el contenedor debe ser **único globalmente** (puede causar error si se repite).
references:
prev: /capitulo3/lab2/        
next: /capitulo4/lab4/
---


---

### Tarea 1. Declarar el Grupo de Recursos

En esta tarea se agregará un bloque que define el grupo de recursos de Azure en el archivo `main.tf`. Cada estudiante debe usar sus **iniciales** para evitar conflictos en los nombres.

#### Tarea 1.1. Abrir el archivo `main.tf`

- **Paso 1.** Abre **Visual Studio Code**.

- **Paso 2.** Navega a la carpeta `TERRALABS`.

- **Paso 3.** Abre el archivo `main.tf`.

> **NOTA:** Si ya completaste los pasos en laboratorios anteriores puedes avanzar a la siguiente tarea. 
{: .lab-note .info .compact}

#### Tarea 1.2. Agregar el recurso `azurerm_resource_group`

- **Paso 4.** Al final del archivo `main.tf`, agrega este bloque. **Reemplaza `xxx` por tus iniciales**:

  > **NOTA:** Si tus iniciales son `lmr`, el nombre será `rg-vnet-lmr`.
  {: .lab-note .info .compact}
  
  ```hcl
  resource "azurerm_resource_group" "rg_demo" {
    name     = "rg-vnet-xxx"
    location = "East US"
  }
  ```
  
  ![terraimg19]({{ page.images_base | relative_url }}/img1.png)  

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[0] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 2. Declarar la Red Virtual

En esta tarea se agregará la red virtual (`azurerm_virtual_network`) haciendo referencia al grupo de recursos definido anteriormente. El nombre de la red virtual también deberá incluir tus iniciales.

#### Tarea 2.1. Agregar el recurso `azurerm_virtual_network`

- **Paso 5.** Justo después del bloque anterior, agrega este fragmento de código:

  > **NOTA:** Cambia el valor del segundo octeto de la propiedad **`address_space`** usa un valor entre **1 y 254**. Pregunta al equipo si ese valor ya fue usado para evitar conflictos de redes.
  {: .lab-note .info .compact}
  > **IMPORTANTE:** Asegúrate de usar las mismas iniciales que en el grupo de recursos.
  {: .lab-note .important .compact}

  ```hcl
  resource "azurerm_virtual_network" "vnet_demo" {
    name                = "vnet-xxx"
    address_space       = ["10.x.0.0/16"]
    location            = azurerm_resource_group.rg_demo.location
    resource_group_name = azurerm_resource_group.rg_demo.name
  }
  ```
  
  ![terraimg20]({{ page.images_base | relative_url }}/img2.png) 

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[1] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}

---

### Tarea 3. Declarar una Instancia de Contenedor en Azure

En esta tarea se agregará una definición de recurso para desplegar una instancia de contenedor sencilla (basada en la imagen pública `mcr.microsoft.com/azuredocs/aci-helloworld`). El nombre del contenedor también deberá llevar tus iniciales.

#### Tarea 3.1. Agregar el recurso `azurerm_container_group`

- **Paso 6.** Al final del archivo `main.tf`, agrega el siguiente bloque. **Reemplaza `xxx` por tus iniciales**:

  > **NOTA:** Cambia también `acilab-abc` por algo como `acilab-jpg` si tus iniciales son `jpg`.
  {: .lab-note .info .compact}

  ```hcl
  resource "azurerm_container_group" "aci_demo" {
    name                = "aci-xxx"
    location            = azurerm_resource_group.rg_demo.location
    resource_group_name = azurerm_resource_group.rg_demo.name
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

    ip_address_type = "Public"
    dns_name_label  = "acilab-xxx"
    tags = {
      environment = "dev"
    }
  }
  ```
  
  ![terraimg21]({{ page.images_base | relative_url }}/img3.png)

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[2] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}