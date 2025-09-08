---
layout: lab
title: "Práctica 1: Instalación y verificación de Terraform en Windows para Azure"
permalink: /labs/lab1.html
duration: "25 minutos"
difficulty: "Básico"
tags: ["Terraform","Windows","Azure CLI"]
summary: "Deja listo el entorno en Windows para trabajar con Terraform y Azure."
objective: "Instalar Terraform, Azure CLI y comprobar inicio de sesión."
requirements:
  - "Windows 10/11 con permisos de administrador"
  - "Navegador para descargar binarios"
validation:
  - "`terraform -version` muestra versión"
  - "`az account show` devuelve la suscripción"
---

### Pasos

1. **Instalar Terraform**  
   Descarga desde <https://developer.hashicorp.com/terraform/install/windows> y agrega el binario a tu `PATH`.

2. **Instalar Azure CLI**  
   Guía oficial: <https://learn.microsoft.com/cli/azure/install-azure-cli-windows>

3. **Verificar instalación**
   ```powershell
   terraform -version
   az version
   ```