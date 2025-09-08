---
layout: home
title: "Práctica 1: Instalación y Verificación de Terraform en Windows para Azure"
permalink: /labs/lab1.html
---

# Práctica 1: Instalación y Verificación de Terraform en Windows para Azure

## Objetivo

Instalar Terraform en Windows y validar su instalación correctamente. Además, preparar el entorno para trabajar con Azure usando Azure CLI.

## Requisitos Previos

- Sistema operativo Windows 10/11 (64 bits).
- Acceso a una cuenta con privilegios de administrador.
- Acceso a Internet.
- Cuenta activa en Azure.

## Duración aproximada

- 25 minutos

---

**[⬅️ Atrás](https://netec-mx.github.io/TRFRM-AZ/Capítulo8/lab9.html)** | **[Lista General](https://netec-mx.github.io/TRFRM-AZ/)** | **[Siguiente ➡️](https://netec-mx.github.io/TRFRM-AZ/Capítulo3/lab2.html)**

---

## Instrucciones

### Tarea 1. Descargar e Instalar Terraform

En esta sección se descargará Terraform desde la fuente oficial, se instalará y se configurará la variable de entorno `PATH` para poder utilizarlo desde cualquier terminal.

#### Tarea 1.1. Descargar Terraform desde el sitio oficial

- **Paso 1.** Abre tu navegador web y visita: [**Descarga Terraform Aquí**](https://developer.hashicorp.com/terraform/install#windows)

- **Paso 2.** Selecciona el sistema operativo **Windows** y descarga la versión de 64-bit (**AMD64**) en formato `.zip`.

  ![terraimg1](../images/lab1/img1.png)

#### Tarea 1.2. Extraer el archivo ZIP

- **Paso 3.** Una vez descargado el archivo, haz clic derecho sobre el archivo `.zip` y selecciona **"Extraer todo..."**.

- **Paso 4.** Extrae el contenido en una carpeta de fácil acceso, por ejemplo:  

  **NOTA:** Si la carpeta `Terraform` no existe, creala en el directorio `C:\`

  ```
  C:\Terraform
  ```
  
  ---

  ![terraimg2](../images/lab1/img2.png)

#### Tarea 1.3. Agregar Terraform al PATH del sistema

- **Paso 5.** Presiona `Win + R`, escribe `sysdm.cpl` y presiona Enter para abrir las **Propiedades del sistema.**

- **Paso 6.** Ve a la pestaña **"Opciones avanzadas"** o **"Avanzadas"** y haz clic en **"Variables de entorno..."**.

  ![terraimg3](../images/lab1/img3.png)

- **Paso 7.** En la sección **"Variables del sistema"**, busca la variable llamada `Path` y haz clic en **Editar**.

  ![terraimg4](../images/lab1/img4.png)

- **Paso 8.** En la ventana que aparece, haz clic en **"Nuevo"** y agrega la ruta donde descomprimiste Terraform, por ejemplo:

  ```
  C:\Terraform
  ```
  
  ---
  
  ![terraimg5](../images/lab1/img5.png)

- **Paso 9.** Haz clic en **OK** o **Aceptar** en todas las ventanas para guardar los cambios.

> **TAREA FINALIZADA**

**Resultado esperado:** Terraform estará disponible desde cualquier terminal o PowerShell. No se necesitará navegar manualmente al directorio para usarlo.

---

### Tarea 2. Verificar la Instalación de Terraform

Se comprobará que Terraform esté disponible en la terminal de Git Bash integrada en VS Code.

#### 2.1. Abrir Visual Studio Code

- **Paso 1.** Abre **Visual Studio Code**, puede estar como acceso directo en el escritorio o desde las **aplicaciones** del sistema operativo de **Windows**.

- **Paso 2.** Abrir la terminal integrada de Visual Studio Code **(menú `Terminal > New Terminal`)** o la combinacion de teclas **`CTRL + ñ`**, tambien puedes dar clic en el botón como lo muestra la imagen.

  ![terraimg6](../images/lab1/img6.png)

- **Paso 3.** En la terminal abierta da clic en la pestaña y luego en **Select Default Profile**

  ![terraimg7](../images/lab1/img7.png)

- **Paso 4.** En la ventana superior selecciona la opción **Git Bash**.

  ![terraimg8](../images/lab1/img8.png)

- **Paso 5.** Ahora cierra el software de **Visual Studio Code** y vuelvelo abrir para que tomen efectos los cambios y **repite el paso 2**.

#### 2.2. Verificar versión instalada

- **Paso 6.** Con la Terminal abierta ejecuta el siguiente comando:

  ```bash
  terraform -version
  ```
  
  ---
  
  ![terraimg9](../images/lab1/img9.png)

> **TAREA FINALIZADA**   

**Resultado esperado:** Se mostrará en consola la versión actual de Terraform instalada.

---

> **¡FELICIDADES HAZ COMPLETADO EL LABORATORIO 1!**

## Resultado Final

Terraform quedará instalado y operativo en Windows, accesible desde cualquier terminal. El entorno estará completamente listo para comenzar las siguientes prácticas de Infraestructura como Código en Azure.

---

**[⬅️ Atrás](https://netec-mx.github.io/TRFRM-AZ/Capítulo8/lab9.html)** | **[Lista General](https://netec-mx.github.io/TRFRM-AZ/)** | **[Siguiente ➡️](https://netec-mx.github.io/TRFRM-AZ/Capítulo3/lab2.html)**