---
layout: lab
title: "Práctica 5: Creación de Outputs en Terraform"
permalink: /capitulo4/lab5/
images_base: /labs/capitulo4/img5
duration: "10 minutos"
objective:
  - Aprender a declarar y utilizar salidas (`output`) en Terraform para mostrar valores importantes al finalizar una ejecución, como el nombre del grupo de recursos, la dirección DNS del contenedor y el nombre de la red virtual. Las salidas se definirán directamente dentro del archivo `main.tf`.
prerequisites:
  - Haber completado la Práctica 4, donde ya se usan variables y `locals`.
  - El archivo `main.tf` debe tener definidos los siguientes recursos. `azurerm_resource_group`, `azurerm_virtual_network`, `azurerm_container_group`
  - Tener autenticación activa con Azure CLI `az login`.
introduction:
  - En esta práctica se aprenderá a declarar **salidas (`outputs`)** en el archivo **`main.tf`**, permitiendo que **Terraform** muestre información clave después del despliegue, como el **nombre del Grupo de Recursos**, el **nombre de la Red Virtual** y la **dirección DNS pública del contenedor**; de esta forma, los valores quedan disponibles para su consulta y para integrarse fácilmente con otros módulos o procesos automatizados.
slug: lab5
lab_number: 5
final_result: |
  - El archivo `main.tf` contiene bloques `output` correctamente definidos.
  - Al aplicar la infraestructura, Terraform mostrará automáticamente:
    - El nombre del grupo de recursos creado.
    - El nombre de la red virtual.
    - El FQDN público del contenedor desplegado.
notes: |
  Esta solo es información de referencia, no se debe usar en la practica.
  - Puedes ver los outputs sin aplicar cambios con.
  ```bash
  terraform output
  ```
  ```bash
  terraform plan
  ```
  - También puedes consultar un output específico así (siempre y cuando ya este aplicada la infraestructura).
  ```bash
  terraform output aci_fqdn
  ```
  - Estos valores son útiles para integrarlos con otros módulos o scripts automatizados.
references:
prev: /capitulo4/lab4/        
next: /capitulo5/lab6/
---


---

### Tarea 1. Declarar salidas (`outputs`) en el archivo `main.tf`

En esta tarea se añadirán bloques `output` al final del archivo `main.tf` para mostrar información clave al usuario.

#### Tarea 1.1. Abrir el archivo `main.tf`

- **Paso 1.** Abre Visual Studio Code.

- **Paso 2.** Abre la carpeta `TERRALABS`.

- **Paso 3.** Abre el archivo `main.tf`.

#### Tarea 1.2. Añadir los bloques `output` al final del archivo

- **Paso 4.** Desplázate al final del archivo `main.tf` y agrega los siguientes bloques:

  ```hcl
  output "resource_group_name" {
    description = "Nombre del grupo de recursos creado"
    value       = azurerm_resource_group.rg_demo.name
  }

  output "vnet_name" {
    description = "Nombre de la red virtual creada"
    value       = azurerm_virtual_network.vnet_demo.name
  }

  output "aci_fqdn" {
    description = "Dirección DNS pública del contenedor"
    value       = azurerm_container_group.aci_demo.fqdn
  }
  ```

  ![terraimg24]({{ page.images_base | relative_url }}/img1.png)

{% assign results = site.data.task-results[page.slug].results %}
{% capture r1 %}{{ results[0] }}{% endcapture %}
{% include task-result.html title="Tarea finalizada" content=r1 %}