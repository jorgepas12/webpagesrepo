---
layout: lab
title: "Práctica 1: Instalación y Verificación de Terraform en Windows para Azure"
permalink: /capitulo2/lab1/
images_base: /labs/capitulo2/img
duration: "25 minutos"
objective:
  - Instalar Terraform en Windows y validar su instalación correctamente. Además, preparar el entorno para trabajar con Azure usando Azure CLI.
prerequisites:
  - Sistema operativo Windows 10/11 (64 bits).
  - Acceso a una cuenta con privilegios de administrador.
  - Acceso a Internet.
  - Cuenta activa en Azure.
introduction:
  - En esta práctica configurarás **Terraform** en **Windows** descargarás el binario oficial, lo descomprimirás en `C:\Terraform`, agregarás esa ruta al **PATH** del sistema para poder usarlo desde cualquier terminal, ajustarás **Git Bash** como terminal por defecto en **Visual Studio Code** y verificarás la instalación ejecutando `terraform -version`.
lab_number: 1
final_result: >
  Terraform quedó instalado y operativo en Windows, accesible desde cualquier
  terminal. El entorno está listo para continuar con IaC en Azure.
notes:
  - Verifica que `terraform -version` muestre la versión correcta.
  - Si el `PATH` falla, revisa las variables de entorno de Windows.
references:
  - text: Documentación oficial de Terraform
    url: https://developer.hashicorp.com/terraform
  - text: Documentación de Azure CLI
    url: https://learn.microsoft.com/es-es/cli/azure/
prev: /          
next: /capitulo3/lab2/
---


---

## Tarea 1. Descargar e Instalar Terraform

En esta sección se descargará Terraform desde la fuente oficial, se instalará y se configurará la variable de entorno `PATH` para poder utilizarlo desde cualquier terminal.

### Tarea 1.1. Descargar Terraform desde el sitio oficial

- **Paso 1.** Abre tu navegador web y visita: [**Descarga Terraform Aquí**](https://developer.hashicorp.com/terraform/install#windows)

- **Paso 2.** Selecciona el sistema operativo **Windows** y descarga la versión de 64-bit (**AMD64**) en formato `.zip`.

  ![terraimg1]({{ page.path
  | replace: page.name, ''   
  | append: 'img/img1.png'   
  | prepend: '/'            
  | relative_url }})

### Tarea 1.2. Extraer el archivo ZIP

- **Paso 3.** Una vez descargado el archivo, haz clic derecho sobre el archivo `.zip` y selecciona **"Extraer todo..."**.

- **Paso 4.** Extrae el contenido en una carpeta de fácil acceso, por ejemplo:  

  **NOTA:** Si la carpeta `Terraform` no existe, creala en el directorio `C:\`

  ```
  C:\Terraform
  ```

  ![terraimg2]({{ page.images_base | relative_url }}/img2.png)

### Tarea 1.3. Agregar Terraform al PATH del sistema

- **Paso 5.** Presiona `Win + R`, escribe `sysdm.cpl` y presiona Enter para abrir las **Propiedades del sistema.**

- **Paso 6.** Ve a la pestaña **"Opciones avanzadas"** o **"Avanzadas"** y haz clic en **"Variables de entorno..."**.

  ![terraimg3]({{ page.images_base | relative_url }}/img3.png)

- **Paso 7.** En la sección **"Variables del sistema"**, busca la variable llamada `Path` y haz clic en **Editar**.

  ![terraimg4]({{ page.images_base | relative_url }}/img4.png)

- **Paso 8.** En la ventana que aparece, haz clic en **"Nuevo"** y agrega la ruta donde descomprimiste Terraform, por ejemplo:

  ```
  C:\Terraform
  ```
  
  ![terraimg5]({{ page.images_base | relative_url }}/img5.png)

- **Paso 9.** Haz clic en **OK** o **Aceptar** en todas las ventanas para guardar los cambios.

<div class="task-result">
  <h3>Tarea finalizada</h3>
  <p><strong>Resultado esperado:</strong> Terraform estará disponible desde cualquier terminal o PowerShell. 
  No será necesario navegar manualmente al directorio para usarlo.</p>
</div>

---

## Tarea 2. Verificar la Instalación de Terraform

Se comprobará que Terraform esté disponible en la terminal de Git Bash integrada en VS Code.

### 2.1. Abrir Visual Studio Code

- **Paso 1.** Abre **Visual Studio Code**, puede estar como acceso directo en el escritorio o desde las **aplicaciones** del sistema operativo de **Windows**.

- **Paso 2.** Abrir la terminal integrada de Visual Studio Code **(menú `Terminal > New Terminal`)** o la combinacion de teclas **`CTRL + ñ`**, tambien puedes dar clic en el botón como lo muestra la imagen.

  ![terraimg6]({{ page.images_base | relative_url }}/img6.png)

- **Paso 3.** En la terminal abierta da clic en la pestaña y luego en **Select Default Profile**

  ![terraimg7]({{ page.images_base | relative_url }}/img7.png)

- **Paso 4.** En la ventana superior selecciona la opción **Git Bash**.

  ![terraimg8]({{ page.images_base | relative_url }}/img8.png)

- **Paso 5.** Ahora cierra el software de **Visual Studio Code** y vuelvelo abrir para que tomen efectos los cambios y **repite el paso 2**.

### 2.2. Verificar versión instalada

- **Paso 6.** Con la Terminal abierta ejecuta el siguiente comando:

  ```bash
  terraform -version
  ```
    
  ![terraimg9]({{ page.images_base | relative_url }}/img9.png)

<div class="task-result">
  <h3>Tarea finalizada</h3>
  <p><strong>Resultado esperado:</strong> Se mostrará en consola la versión actual de Terraform instalada.</p>
</div> 