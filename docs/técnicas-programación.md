# Guía de Técnicas de Programación, Compilación y Automatización

Este documento detalla los estándares de arquitectura, empaquetado, formateo de código y automatización de versiones implementados en el proyecto **Tabs Extended**.

---

## 🛠️ 1. Sistema de Compilación con `esbuild` y Formateo con Indentación Limpia

### Arquitectura del Build System
El proyecto utiliza [esbuild](https://esbuild.github.io/) debido a su velocidad instantánea, soporte para ES Modules y generación de código legible.

El archivo de configuración principal es [`esbuild.config.mjs`](file:///D:/Scripts/obsidian-plugins/tabs-extended/esbuild.config.mjs).

### Flujo de Compilación e Indentación
1. **Punto de Entrada**: `src/main.js`.
2. **Empaquetado (*Bundle*)**: Resuelve recursivamente todas las dependencias internas en `src/` (componentes, parser, internacionalización, ajustes, estilos y vendor).
3. **Módulos Externos**: Las APIs de Obsidian y Electron (`obsidian`, `electron`, etc.) se marcan como externas (`external: ["obsidian", "electron"]`) para que la aplicación las suministre en tiempo de ejecución.
4. **Formateo e Indentación Limpia (`minify: false`)**:
   - `esbuild` está configurado con **`minify: false`**, lo que garantiza que el archivo generado en **`dist/main.js`** y **`./main.js`** se genere con **indentación estándar de 2 espacios**, preservando nombres de variables, saltos de línea y una estructura 100% legible para depuración e inspección humana.
5. **Salida Dual**:
   - **`dist/main.js`**: Artefacto final empaquetado e indentado.
   - **`dist/manifest.json` y `dist/styles.css`**: Copiados automáticamente por el plugin de assets en cada build.
   - **`./main.js`**: Mantenido sincronizado en la raíz para desarrollo en caliente directo dentro del directorio de plugins de Obsidian.

---

## 🚀 2. Comandos de Compilación (`npm scripts`)

Todos los comandos están configurados en [`package.json`](file:///D:/Scripts/obsidian-plugins/tabs-extended/package.json):

| Comando | Acción | Descripción |
| :--- | :--- | :--- |
| `npm run dev` | Modo Observador (*Watch*) | Compila con *source maps* en línea y escucha cambios en `src/` en tiempo real con indentación limpia. |
| `npm run build` | Modo Producción | Compila, resuelve módulos, preserva la indentación legible y genera la versión final en `dist/` y `./main.js`. |
| `npm version patch` | Incremento Patch (`x.y.Z+1`) | Incrementa la versión de corrección de errores, actualiza `manifest.json` y ejecuta `git add .`. |
| `npm version minor` | Incremento Minor (`x.Y+1.0`) | Incrementa la versión de nuevas características, actualiza `manifest.json` y ejecuta `git add .`. |
| `npm version major` | Incremento Major (`X+1.0.0`) | Incrementa la versión mayor con cambios mayores, actualiza `manifest.json` y ejecuta `git add .`. |

---

## 🔄 3. Automatización de Versiones con `version-bump.mjs`

### ¿Cómo funciona?
Cuando ejecutas cualquier comando de versión de npm (`npm version patch`, `npm version minor`, o `npm version major`):

1. **npm** actualiza primero el campo `"version"` en `package.json`.
2. **Hook de ciclo de vida `"version"`**: `package.json` ejecuta automáticamente:
   ```json
   "version": "node version-bump.mjs && git add ."
   ```
3. **[`version-bump.mjs`](file:///D:/Scripts/obsidian-plugins/tabs-extended/version-bump.mjs)** realiza lo siguiente:
   - Lee la nueva versión de `package.json`.
   - Inyecta la nueva versión en `manifest.json`.
   - Si existe `versions.json`, registra la compatibilidad con `minAppVersion`.
   - Si existe `dist/manifest.json`, sincroniza también el manifest de la carpeta de distribución.
   - Ejecuta `git add .` para incluir todos los archivos actualizados en el commit y tag que npm genera automáticamente.

---

## 📐 4. Buenas Prácticas para Desarrollar Nuevos Módulos

1. **Modularidad Estricta**: Cada clase o componente nuevo debe colocarse en su subcarpeta correspondiente dentro de `src/` (`core/`, `components/`, `editor/`, `modals/`, `settings/`, etc.).
2. **Uso del Helper de Internacionalización**: Nunca colocar cadenas de texto fijas en la interfaz. Utilizar siempre `$("mi.clave.traduccion")` importando de `src/i18n/index.js` y agregando la traducción en `src/i18n/locales/es.js` y `src/i18n/locales/en.js`.
3. **Protección Visual y Física**: Cualquier modificación al motor del editor en `src/editor/engine.js` debe mantener el anclaje neutral `side: 0` y la implementación de `updateDOM` en `DepthWidget`.
