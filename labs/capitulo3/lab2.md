---
layout: lab
title: "Práctica 2: Autenticación del Proveedor Azure en Terraform"
permalink: /capitulo3/lab2/
images_base: /labs/capitulo3/img2
duration: "15 minutos"
objective:
  - Configurar la autenticación con el proveedor de Azure en Terraform utilizando Azure CLI y un archivo de configuración **`main.tf`**, para permitir el despliegue de recursos en la nube desde un entorno local en Windows con Visual Studio Code.
prerequisites:
  - Terraform instalado y funcional en Windows.
  - Visual Studio Code instalado.
  - Git Bash instalado y configurado como terminal por defecto en VS Code.
  - Azure CLI instalado.
  - Tener una suscripción activa en Azure.
introduction:
  - En esta práctica configurarás el entorno para trabajar con **Terraform en Azure**. Iniciarás sesión en **Azure CLI**, definirás el archivo **`main.tf`** con el proveedor **`azurerm`** y habilitarás la extensión de **Terraform** en **Visual Studio Code**. Con ello tendrás todo listo para comenzar a desplegar recursos en Azure mediante **Infraestructura como Código (IaC)**.  
lab_number: 2
final_result: |
  - Azure CLI autenticado correctamente en tu cuenta de Azure.
  - Archivo `main.tf` configurado con el proveedor `azurerm`.
  - Proyecto creado en una carpeta organizada.
  - Visual Studio Code configurado como entorno de desarrollo para Terraform.
notes:
  - "Esta práctica utiliza autenticación de sesión basada en `az login`, ideal para entornos de desarrollo."
  - "Para entornos automatizados (CI/CD), se recomienda usar una autenticación mediante Service Principal: <a href='https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs/guides/service_principal_client_secret' target='_blank'>Guía oficial aquí</a>."
references:
prev: /capitulo2/lab1/        
next: /capitulo3/lab3/
---


---

### Tarea 1. Autenticarse en Azure CLI

Se usará el comando `az login` desde Git Bash para iniciar sesión en la cuenta de Azure, y se configurará la suscripción activa si hay más de una.

#### Tarea 1.1. Iniciar sesión en Azure

- **Paso 1.** Abre **Visual Studio Code** y abre una terminal integrada con Git Bash: `Terminal > New Terminal` o `CTRL + ñ`.

- **Paso 2.** Ejecuta el siguiente comando para iniciar sesión en Azure:

  ```bash
  az login
  ```

- **Paso 3.** Se abrirá una ventana del navegador para iniciar sesión. Una vez completado, la terminal mostrará información de la cuenta autenticada.

  > **NOTA:** La autenticación debe ser con el **usuario y contraseña** del curso. La **suscripción puede ser diferente**.
  {: .lab-note .info .compact}

  > **IMPORTANTE:** Puede aparecer un error al autenticarse. Verifica en la terminal que el login fue exitoso (segunda imagen).
  {: .lab-note .important .compact}

  ![terraimg10]({{ page.images_base | relative_url }}/img1.png)
  ![terraimg11]({{ page.images_base | relative_url }}/img2.png)

#### Tarea 1.2. Seleccionar la suscripción deseada

- **Paso 4.** Si tienes más de una suscripción, puedes verlas con:

  ```bash
  az account list --output table
  ```

  ![terraimg12]({{ page.images_base | relative_url }}/img3.png)

- **Paso 5.** Luego, selecciona la suscripción activa ejecutando:

  **NOTA:** Sustituye el nombre de la suscipción por la del comando anterior, ejecutalo sin las comillas dobles.

  ```bash
  az account set --subscription "NOMBRE-DE-LA-SUSCRIPCIÓN"
  ```
  
  ![terraimg13]({{ page.images_base | relative_url }}/img4.png)

- **Paso 6.** Verifica la suscripción activa:

  ```bash
  az account show
  ```
  
  ![terraimg14]({{ page.images_base | relative_url }}/img5.png)

<div class="task-result">
  <h3>Tarea finalizada</h3>
  <p><strong>Resultado esperado:</strong> Azure CLI autenticado correctamente y configurado con la suscripción correcta.</p>
</div>

---

### Tarea 2. Crear archivo de configuración de proveedor `main.tf`

En esta tarea se creará un directorio de proyecto y se escribirá un archivo `main.tf` que contiene la configuración mínima del proveedor `azurerm`.

#### Tarea 2.1. Crear estructura de proyecto

- **Paso 1.** En la terminal de Git Bash, usa la carpeta previamente creada para el proyecto llamada **TERRALABS**:

  > **NOTA:** Si la carpeta **TERRALABS** no existe creala en el Escritorio.
  {: .lab-note .info .compact}

  ```bash
  cd Desktop/TERRALABS
  ```
  
  > **NOTA:** Si es necesario ajusta el nombre de la carpeta.
  {: .lab-note .info .compact}

  ![terraimg15]({{ page.images_base | relative_url }}/img6.png)

- **Paso 2.** Abre esta carpeta desde VS Code: **`File > Open Folder... > Selecciona Desktop y luego TERRALABS`** y confirma la ventana emergente.

  ![terraimg16]({{ page.images_base | relative_url }}/img7.png)

#### Tarea 2.2. Crear y editar `main.tf`

- **Paso 3.** En el explorador de VS Code, crea un nuevo archivo llamado `main.tf`.

  ![terraimg17]({{ page.images_base | relative_url }}/img8.png)   

- **Paso 4.** Copia y pega el siguiente contenido:

  ```hcl
  terraform {
  required_providers {
     azurerm = {
        source  = "hashicorp/azurerm"
        version = "~> 3.0"
     }
  }

  required_version = ">= 1.5.0"
  }

  provider "azurerm" {
  features {}
  }
  ```

<div class="task-result">
  <h3>Tarea finalizada</h3>
  <p><strong>Resultado esperado:</strong> Se habrá creado el archivo base de configuración de Terraform para trabajar con Azure.</p>
</div>

---

### Tarea 3. Extensión de Terraform en VSC

En esta tarea se instalará la extensión oficial de Terraform en Visual Studio Code para facilitar el desarrollo con soporte de sintaxis, autocompletado y validación en archivos `.tf`.

#### Tarea 3.1. Abrir el Marketplace de extensiones

- **Paso 1.** Da clic en el ícono de **Extensiones** del menú lateral izquierdo (o presiona `CTRL + SHIFT + X`).

#### Tarea 3.2. Buscar la extensión oficial

- **Paso 2.** En la barra de búsqueda escribe:

  ```
  Terraform
  ```

- **Paso 3.** Localiza la extensión llamada **“Terraform”** publicada por **HashiCorp**.

#### Tarea 3.3. Instalar la extensión

- **Paso 4.** Da clic en el botón **"Install"**.

  ![terraimg18]({{ page.images_base | relative_url }}/img9.png)   

- **Paso 5.** Confirma la ventana emergente clic en **Trust Publisher & Install**

- **Paso 6.** Espera a que finalice la instalación.

#### Tarea 3.4. Validar que funcione

- **Paso 7.** Abre tu archivo `main.tf`.

- **Paso 8.** Verifica que aparezca resaltado de sintaxis (colores) y que se activen sugerencias automáticas (`CTRL + SPACE`).

- **Paso 9.** Por el momento no ejecutamos nada mas.

<div class="task-result">
  <h3>Tarea finalizada</h3>
  <p><strong>Resultado esperado:</strong> Visual Studio Code estará listo para trabajar con archivos Terraform de forma eficiente, con ayuda de resaltado de sintaxis, validación en tiempo real y autocompletado.</p>
</div>