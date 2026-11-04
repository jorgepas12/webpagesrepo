# Adopción automática de cursos existentes — estándar Netec

## Objetivo
Un instructor solo clona su repositorio de curso. **No clona webpagesrepo ni copia scripts manualmente.**
El administrador ejecuta una vez el bootstrap, que descarga temporalmente webpagesrepo,
reutiliza los scripts comprobados en TRFRM_GCP_INT y adapta los archivos técnicos.
Los cambios académicos están limitados a añadir frontmatter, tracking Task/Step IDs;
no se alteran explicaciones, comandos, recursos, ni resultados esperados.

## Uso en Git Bash desde la raíz del curso
Ejemplo CKA-Priv- (rama de prueba con árbol Git limpio):

```bash
curl -fsSL https://raw.githubusercontent.com/jorgepas12/webpagesrepo/main/scripts/bootstrap_existing_course.sh -o /tmp/labcontrol-bootstrap.sh
bash /tmp/labcontrol-bootstrap.sh \
  --tracking-id ckapriv --code CKA_PRIV \
  --name "Administración, despliegue y preparación para CKA" \
  --description "Curso de administración y preparación CKA con 8 prácticas de Kubernetes."
# Tras revisar la simulación, repetir los mismos argumentos con --apply al final.
```

## Operaciones del bootstrap
1. Rechaza destinos que no sean repositorios Git limpios o tengan identidad contradictoria.
2. Ejecuta migrate_existing_course.py si los Labs no tienen tracking: respaldo académico e IDs estables.
3. Actualiza el runtime (JS), step_label.html, scripts compartidos y los atributos de tracking del layout.
4. Crea course.identity.json con código, trackingId, nombre y descripción exclusivos del curso.
5. Actualiza exactamente el workflow existente pages.yml, tomando el patrón ya funcional de TRFRM_GCP_INT.
6. Fija el checkout central del workflow a un commit inmutable de webpagesrepo.
7. Verifica integridad de las instrucciones cuando la adopción es inicial, Step IDs, runtime, manifests, catálogo y diff.
8. Deja el commit/push para la revisión normal del repositorio del curso.

Las copias de seguridad locales se mantienen en .migration-backup-labcontrol y .labcontrol-template-backup, ignoradas por Git.
No modificar esos respaldos hasta validar el proceso. Si una validación falla, no hacer commit:
restaurar la copia del repositorio o comparar/restaurar los archivos respaldados.

## Requisitos para registro desde LabControl
Tras fusionar el PR del curso a main y publicar GitHub Pages, comprobar:
```text
https://netec-mx.github.io/CKA-Priv-/course.identity.json
https://netec-mx.github.io/CKA-Priv-/labcontrol/ckapriv/course.json
https://netec-mx.github.io/CKA-Priv-/labcontrol/ckapriv/content/l001.json
```

LabControl → Cursos → Registrar desde URL:
`https://netec-mx.github.io/CKA-Priv-/`.

La pantalla solicita publicar una prueba única en
`.well-known/labcontrol-course-link.txt`; **nunca inventar ni copiar pruebas de otro curso**.
Publicar el valor entregado por LabControl y confirmar antes de vencer.
La vinculación registra el curso, no necesariamente sus Labs.
Después, en el detalle del curso, usar **Sincronizar todo** para cargar los ocho Labs y crear la revisión de catálogo.

## Verificación y precauciones
- GitHub Pages debe tener una única ruta de deploy (pages.yml).
- No fusionar la rama de prueba hasta validar workflow, metadata y requerimientos de revisión.
- El token de sincronización (si se usa) se guarda como Secret en GitHub, jamás en scripts o archivos del curso.
- La regeneración de manifests no debe renumerar Steps ya registrados.
- Las sesiones con revisión congelada no se migran automáticamente.
- Para actualizar una versión de runtime en un curso ya adoptado, ejecutar nuevamente el bootstrap desde un árbol Git limpio; conserva IDs.
