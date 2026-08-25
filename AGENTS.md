# Guía y Protocolos Maestros de Control, Lógica y Desarrollo (AGENTS.md)

> [!IMPORTANT]
> **AUTORIDAD PRINCIPAL DE CONTROL**: Este archivo es el **documento maestro de lógica, directrices y reglas obligatorias de comportamiento** para todos los agentes, asistentes de inteligencia artificial y desarrolladores que interactúen con el repositorio de **Tabs Extended**. Debe ser consultado y respetado estrictamente en cada iteración.

---

## 🧭 0. Regla de Oro: Obediencia Absoluta a las Solicitudes del Usuario
- **Obediencia Estricta y Exclusiva**: El asistente/agente **DEBERÁ TRABAJAR ÚNICA Y EXCLUSIVAMENTE EN LO QUE EL USUARIO PIDA EN CADA SOLICITUD**.
- **Prohibición de Tareas Autónomas / No Solicitadas**: Queda estrictamente prohibido tomar decisiones autónomas, asumir tareas no solicitadas por iniciativa propia, desviar tiempo o recursos hacia problemas no mencionados, o realizar improvisaciones y cambios que el usuario no haya solicitado de manera directa y explícita.

---

## 🎯 1. Protocolo Obligatorio de Investigación y Diagnóstico de Bugs

> [!IMPORTANT]
> **ORDEN ESCALONADO OBLIGATORIO ANTE BUGS:**
> 1. **Primera Instancia Obligatoria — Consulta del Bug-Trace (`docs/bug_log.md`):**
>    - Ante cualquier reporte de error, anomalía, fallo de renderizado o regresión, **la primera acción que el agente DEBE realizar es revisar exhaustivamente el historial de bugs en `docs/bug_log.md`**.
>    - Se deben identificar antecedentes directos o indirectos, soluciones históricas aplicadas a subsistemas similares, contratos de arquitectura ya establecidos y posibles causas raíz previas.
> 2. **Segunda Instancia — Investigación Profunda de Raíz en los Módulos del Proyecto:**
>    - Una vez recopilados los antecedentes del bug-trace, se procede a **analizar de raíz y a profundidad los módulos correspondientes en `src/`** (`src/core/`, `src/editor/`, `src/components/`, `src/settings/`, etc.).
>    - Queda estrictamente prohibido aplicar parches superficiales, silenciar excepciones o asumir supuestos sin trazar el flujo de datos completo desde el origen hasta el DOM.

---

## 📋 2. Formato Obligatorio de Documentación de Bugs (Tablas Markdown)
- **Estructura Estricta de Tabla Markdown**: Todos los bugs, registros de incidencias y trazas de errores (*bug-trace*) **SIEMPRE DEBEN PRESENTARSE Y DOCUMENTARSE EN FORMATO TABLA MARKDOWN** en `docs/bug_log.md`.
- **Campos Obligatorios por Registro**:
  `| Atributo | Detalle |`
  - **ID / Título**: Número secuencial y título descriptivo.
  - **Estado**: `⏳ [Pendiente de validación del usuario]` o `✅ [Solucionado]` (solo tras confirmación explícita).
  - **Descripción / Síntomas**: Comportamiento observado por el usuario y pasos de reproducción.
  - **Antecedentes en el Bug-Trace**: Referencias cruzadas a bugs previos vinculados.
  - **Causa Raíz Identificada**: Explicación técnica detallada de por qué fallaba el código.
  - **Ruta y Lógica de Solución**: Flujo de ejecución completo y lógica implementada.
  - **Módulos / Archivos**: Enlaces en formato Markdown a los archivos modificados.
  - **Pruebas / Verificación**: Comandos, aserciones y tests de estrés ejecutados.

---

## 🔒 3. Regla Estricta para Cierre, Confirmación y Reapertura de Bugs
- **Prohibición de Cierre Automático / Manual por el Asistente**: El asistente **NUNCA DEBE MARCAR UN BUG O TAREA COMO RESUELTO/SOLUCIONADO/COMPLETADO POR INICIATIVA PROPIA**.
- **Confirmación Obligatoria del Usuario**: Un bug o tarea **SÓLO SE MARCARÁ COMO RESUELTO (`[Solucionado]`, `[x]`) CUANDO EL USUARIO LO CONFIRME O INDIQUE EXPLÍCITAMENTE**.
- **Recordatorio Activo**: Mientras un bug esté en proceso o no haya sido confirmado explícitamente por el usuario como cerrado, el asistente deberá recordar al usuario en cada respuesta que el bug continúa en estado pendiente (`⏳ [Pendiente de validación del usuario]`).
- **Reapertura de Bugs**: Cualquier bug o tarea previamente marcada como solucionada/cerrada **PUEDE SER REABIERTA POR EL USUARIO EN CUALQUIER MOMENTO** si reaparece el problema o se detectan nuevas inconsistencias o regresiones.

---

## 📂 4. Regla de Sincronización a la Bóveda PKM (SÓLO BAJO SOLICITUD EXPLÍCITA)
- **Desactivación de Copia Automática**: Queda desactivada la copia automática de archivos hacia la bóveda PKM (`D:\\PKM\\.obsidian\\plugins\\tabs-extended\\`).
- **Autorización Explícita del Usuario**: La sincronización o copia de archivos (`main.js`, `manifest.json`, `styles.css`) hacia la bóveda PKM **ÚNICAMENTE SE EJECUTARÁ CUANDO EL USUARIO LO INDIQUE EXPLÍCITAMENTE**.

---

## 🌿 5. Regla Estricta de Control de Git (Commits y Pushes)
- **Prohibición de Commits/Pushes Automáticos**: Queda estrictamente prohibido ejecutar `git commit` o `git push` por iniciativa propia o de manera automática tras realizar cambios.
- **Autorización Explícita del Usuario**: Los comandos `git commit` y `git push` **ÚNICAMENTE SE EJECUTARÁN CUANDO EL USUARIO LO INDIQUE DE FORMA EXPLÍCITA**.
- **Idioma Obligatorio de los Commits**: Todos los mensajes de commit deben ser **SIEMPRE EN ESPAÑOL** (por ejemplo: `característica(ajustes & ui): mejorar traducciones, texto fantasma...`).

---

## 🏷️ 6. Reglas de Versionado (`manifest.json`), Commits Distintivos y Tagging
- **Incremento Estricto del Último Número de Versión**: Al corregir cualquier bug o lanzar una mejora, se incrementará **exclusivamente el último número de versión en `manifest.json` y `package.json`** (el dígito de parches/bugs, por ejemplo: `1.10.2` $\to$ `1.10.3`).
- **Prohibición Absoluta del Prefijo 'v'**: Las versiones, tags y referencias de liberación **NUNCA DEBEN USAR LA LETRA `v` como prefijo**. Se utilizará únicamente el número semántico puro (por ejemplo: `1.10.2`, nunca `v1.10.2`).
- **Alineación Obligatoria entre Manifest y Tags de Git**: La versión registrada en `manifest.json`, `package.json` y el tag generado en Git **DEBEN ESTAR 100% ALINEADOS E IDÉNTICOS** (ejemplo: versión `1.10.2` $\leftrightarrow$ tag `1.10.2`).
- **Commit Distintivo de Solución**: Al realizar el commit de solución de bugs (previo permiso del usuario), se usará el formato:
  `solución(bug-X): [Solución del bug X] - [Descripción y mejoras probadas]`
- **Liberación y Tagging tras Confirmación del Usuario**: Cuando el usuario confirme un bug como solucionado (`[Solucionado]`):
  1. Se actualiza la versión en `manifest.json` y `package.json` incrementando el último número.
  2. Se realiza el commit de liberación representativo (`liberación(1.10.3): solución de bugs X e Y`).
  3. Se crea el **tag de git perfectamente alineado a la versión del manifest** (`git tag 1.10.3`).

---

## 🧹 7. Gestión de Ignorados y Limpieza de Historial Git

**Protocolo de Ignorado de Carpetas y Archivos:**
Cada vez que el usuario indique que una carpeta, archivo o patrón de archivos debe ser ignorado (incluyendo archivos de configuración o logs):

1. **Actualización de `.gitignore`**: Agregar inmediatamente la carpeta o archivo al archivo `.gitignore` en la raíz del proyecto.
2. **Desvinculación del Índice de Git (`git rm --cached`)**:
   ```bash
   git rm -r --cached --ignore-unmatch <carpeta_o_archivo>
   ```
3. **Purga Absoluta del Historial de Git**:
   ```bash
   git filter-branch --force --index-filter "git rm -rf --cached --ignore-unmatch <carpeta_o_archivo>" --prune-empty --tag-name-filter cat -- --all
   ```
   Eliminar referencias de respaldo y purgar la base de datos de Git:
   ```powershell
   git update-ref -d refs/original/refs/heads/principal
   git reflog expire --expire=now --all
   git gc --prune=now
   ```

---

## 🛡️ 8. Principios de Programación, Calidad de Código e Integridad

- **Diagnóstico Basado en Causa Raíz**: Investigar la causa origen leyendo logs completos y trazando el flujo de datos. Queda prohibido enmascarar síntomas, silenciar excepciones o retornar fallbacks vacíos.
- **Preservación de Contratos de API y Compatibilidad**: Garantizar compatibilidad con Obsidian nativo y plugins de terceros (`Callout Manager`, `execute-code`).
- **Verificaciones Obligatorias antes de Concluir**:
  1. **Compilación Limpia**: `npm run build` ejecutado sin advertencias ni errores.
  2. **Auditoría AST Acorn**: `node scratch/full_source_audit.js` con 0 variables sin declarar.
  3. **Test de Estrés de Bóveda**: `node scratch/dom_stress_test.js` ejecutado sobre las 554 notas de la bóveda con 0 errores.
- **Mantenimiento Continuo de Documentación**: Mantener sincronizados `docs/bug_log.md`, `docs/modules.md`, `docs/reports.md` y `docs/tasklist.md`.

---

## 📌 9. Reporte Obligatorio del Estado Actual del Proyecto y Versión
- **Formato Simple y sin Encabezados**: Al final de cada respuesta, el asistente/agente **DEBERÁ INCLUIR SIEMPRE** un recordatorio del estado actual en una lista sencilla sin encabezados (`###`):
  - **Bugs abiertos**: Contador total y mención breve de los bugs pendientes.
  - **Versión actual**: Versión tomada de `manifest.json` (sin prefijo `v`).
  - **Comandos útiles**: Breve lista de los comandos principales (`build`, `dev`, `version`).

---

## 🏗️ 10. Arquitectura de Build (`dist/`), Root Limpio y Separadores ASCII

- **Generación Exclusiva de Artefactos en `dist/`**:
  - Los 3 archivos finales del plugin (`main.js`, `manifest.json`, `styles.css`) se generan **única y exclusivamente en la carpeta `dist/`** tras compilar con `esbuild` (`npm run build`).
- **Prohibición Estricta de `main.js` y `styles.css` en la Raíz (*root*)**:
  - En la raíz del repositorio solo deben residir los archivos de configuración estrictamente necesarios (`package.json`, `manifest.json`, `esbuild.config.mjs`, `AGENTS.md`, `README.md`, `LICENSE`, `data.json`, `.gitignore`) y las carpetas modulares (`src/`, `dist/`, `docs/`, `scripts/`).
  - El código fuente de los estilos vive en `src/styles.css` y se empaqueta hacia `dist/styles.css`.
  - Queda terminantemente prohibido que `esbuild` o cualquier script copie `main.js` o `styles.css` a la raíz.
- **Alineación Total de Versiones (`npm version`)**:
  - Al ejecutar `npm version` (sea `patch`, `minor` o `major`), el script `scripts/version-bump.mjs` actualiza e inyecta sincrónicamente la versión en `manifest.json`, `dist/manifest.json` y `versions.json`, asegurando que `package.json` y `manifest.json` estén 100% alineados.
- **Separadores Modulares ASCII Elegantes**:
  - El empaquetador `esbuild.config.mjs` post-procesa `dist/main.js` inyectando cajas ASCII de alta estética para delimitar visualmente cada módulo empaquetado (`/* ╔═══════════════════════╗ ... ╚═══════════════════════╝ */`).

