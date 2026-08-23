# 📖 Manual de Tecnologías: Tabs Extended

---

## 🎯 Propósito y Alcance de este Manual

El propósito fundamental de este documento es servir como la **enciclopedia técnica oficial** y guía de referencia exhaustiva sobre todas las tecnologías, motores, librerías, estándares y herramientas de desarrollo que dan vida al plugin **Tabs Extended**.

A través de este manual, cualquier desarrollador o mantenedor podrá comprender con profundidad:
1. **Qué es y para qué sirve** cada tecnología integrada en el proyecto.
2. **Por qué fue seleccionada** frente a otras alternativas del ecosistema de JavaScript y Obsidian.
3. **Cómo está configurada** dentro de la base de código, detallando sus opciones, comandos, directivas y mecanismos de integración.
4. **Cómo interactúa** cada herramienta con las demás piezas de la arquitectura modular.

---

## 📑 Índice de Tecnologías

- [1. `esbuild` — Motor de Compilación y Empaquetado](#1-esbuild--motor-de-compilación-y-empaquetado)
  - [1.1 ¿Qué es esbuild y cómo funciona?](#11-qué-es-esbuild-y-cómo-funciona)
  - [1.2 ¿Por qué esbuild frente a Webpack o Rollup?](#12-por-qué-esbuild-frente-a-webpack-o-rollup)
  - [1.3 Comandos Básicos de esbuild](#13-comandos-básicos-de-esbuild)
  - [1.4 La Minificación (`minify`): Concepto, Funcionamiento y Justificación](#14-la-minificación-minify-concepto-funcionamiento-y-justificación)
  - [1.5 Desglose Detallado de `esbuild.config.mjs`](#15-desglose-detallado-de-esbuildconfigmjs)
  - [1.6 Sistema de Separadores y Banners ASCII](#16-sistema-de-separadores-y-banners-ascii)
- [2. `Acorn` y `AST (Abstract Syntax Tree)` — Análisis Sintáctico de Código](#2-acorn-y-ast-abstract-syntax-tree--análisis-sintáctico-de-código)
  - [2.1 ¿Qué es un AST y qué es Acorn?](#21-qué-es-un-ast-y-qué-es-acorn)
  - [2.2 Rol de Acorn en la Modularización de Tabs Extended](#22-rol-de-acorn-en-la-modularización-de-tabs-extended)
- [3. `CodeMirror 6` — Motor del Editor Modal](#3-codemirror-6--motor-del-editor-modal)
  - [3.1 Arquitectura de CodeMirror 6 (`State` vs. `View`)](#31-arquitectura-de-codemirror-6-state-vs-view)
  - [3.2 Sistema de Decoraciones y Widgets (`DepthWidget`)](#32-sistema-de-decoraciones-y-widgets-depthwidget)
  - [3.3 Protección Inmutable con `transactionFilter` y `atomicRanges`](#33-protección-inmutable-con-transactionfilter-y-atomicranges)
  - [3.4 Control de Teclado con `keymap` de Alta Precedencia](#34-control-de-teclado-con-keymap-de-alta-precedencia)
- [4. `Obsidian API` — Arquitectura de Plugins y Ciclo de Vida](#4-obsidian-api--arquitectura-de-plugins-y-ciclo-de-vida)
  - [4.1 Clase `Plugin` y Ciclo de Vida](#41-clase-plugin-y-ciclo-de-vida)
  - [4.2 `MarkdownRenderChild` y Renderizado en el DOM](#42-markdownrenderchild-y-renderizado-en-el-dom)
  - [4.3 Paneles de Ajustes (`PluginSettingTab`) y Modales (`Modal`)](#43-paneles-de-ajustes-pluginsettingtab-y-modales-modal)
- [5. `SortableJS` — Reordenación por Arrastre (Drag & Drop)](#5-sortablejs--reordenación-por-arrastre-drag--drop)
- [6. `npm Scripts & Git Automation` — Flujo de Versiones](#6-npm-scripts--git-automation--flujo-de-versiones)

---

# 1. `esbuild` — Motor de Compilación y Empaquetado

## 1.1 ¿Qué es esbuild y cómo funciona?
**[esbuild](https://esbuild.github.io/)** es un empaquetador (*bundler*) y compilador de código JavaScript y TypeScript ultrarrápido escrito en el lenguaje de programación **Go**.

Su función principal es tomar múltiples archivos modulares organizados en carpetas (`src/main.js`, `src/core/model.js`, `src/settings/SettingTab.js`, etc.) y resolver todos los `import` y `export` para fusionarlos en un único archivo ejecutable (`dist/main.js`) listo para ser consumido por Obsidian.

## 1.2 ¿Por qué esbuild frente a Webpack o Rollup?
1. **Velocidad Extrema (10x a 100x más rápido)**: Compila todo el proyecto en **menos de 40 milisegundos**. Go compila directamente a código máquina nativo y paraleliza el análisis sintáctico en todos los núcleos de la CPU.
2. **Cero Configuración Compleja**: A diferencia de Webpack que requiere decenas de *loaders* pesados (`babel-loader`, `ts-loader`), esbuild incluye soporte nativo e integrado para ES Modules, JSX, TypeScript y CommonJS.
3. **Tree-Shaking Nativo**: Analiza el grafo de dependencias y descarta automáticamente cualquier código que no esté siendo utilizado.

## 1.3 Comandos Básicos de esbuild

```bash
# 1. Compilación básica de un archivo de entrada a un destino
npx esbuild src/main.js --outfile=dist/main.js

# 2. Empaquetar resolviendo todos los módulos internos (--bundle)
npx esbuild src/main.js --bundle --outfile=dist/main.js

# 3. Empaquetar excluyendo dependencias externas provistas por el entorno (--external)
npx esbuild src/main.js --bundle --external:obsidian --external:electron --outfile=dist/main.js

# 4. Compilar en formato CommonJS para compatibilidad con Obsidian (--format=cjs)
npx esbuild src/main.js --bundle --format=cjs --outfile=dist/main.js

# 5. Generar mapas de depuración (--sourcemap)
npx esbuild src/main.js --bundle --sourcemap=inline --outfile=dist/main.js
```

## 1.4 La Minificación (`minify`): Concepto, Funcionamiento y Justificación

### ¿Qué es la Minificación?
La **minificación** es una técnica de optimización que elimina caracteres innecesarios (espacios, saltos de línea, comentarios) y acorta nombres de variables para reducir el peso en bytes del archivo resultante.

```javascript
// CÓDIGO NORMAL (HUMAN-READABLE):
function renderTabBadge(tabTitle, depthLevel = 1) {
  let badgeText = `Nivel ${depthLevel}: ${tabTitle}`;
  return badgeText;
}

// CÓDIGO MINIFICADO:
function renderTabBadge(e,t=1){return`Nivel ${t}: ${e}`}
```

### ¿Cómo funciona internamente?
1. **Whitespace Removal**: Suprime espacios, tabulaciones y saltos de línea.
2. **Identifier Mangle**: Renombra variables locales (`depthLevel` pasa a llamarse `t`).
3. **Syntax Compression**: Reescribe estructuras `if/else` usando operadores ternarios o secuencias binarias.

### Ventajas vs. Desventajas

| Característica | Con Minificación (`minify: true`) | Sin Minificación (`minify: false`) |
| :--- | :--- | :--- |
| **Tamaño en disco** | Ligeramente inferior en KB. | Ligeramente superior en KB. |
| **Legibilidad** | Ilegible para humanos. | 100% estructurado e indentado (2 espacios). |
| **Depuración (*Debugging*)** | Consola de Obsidian muestra líneas incomprensibles. | Puntos de interrupción, nombres reales de variables e inspección nítida. |
| **Mantenibilidad** | Difícil de auditar. | Código claro y perfectamente trazable. |

### ¿Por qué usamos `minify: false` en Tabs Extended?
En plugins locales de Obsidian, los archivos residen en el disco duro del usuario. No existe un cuello de botella de transferencia por red. 

Tener **`minify: false`** permite:
- Depuración visual inmediata en la consola de Obsidian (`Ctrl + Shift + I`).
- Inspección directa de la arquitectura y flujo de ejecución en `dist/main.js`.
- Preservación de los nombres semánticos de todas las clases y métodos.

---

## 1.5 Desglose Detallado de `esbuild.config.mjs`

El archivo [`esbuild.config.mjs`](file:///D:/Scripts/obsidian-plugins/tabs-extended/esbuild.config.mjs) contiene la configuración del build system:

```javascript
import esbuild from "esbuild";
import process from "process";
import fs from "fs";

// 1. BANNER: Texto de cabecera inyectado al inicio del bundle
const banner = `/*
 * ═══════════════════════════════════════════════════════════════════════════════
 *  TABS EXTENDED - PLUGIN BUNDLE
 *  Generado automáticamente por esbuild
 *  Repositorio: https://github.com/Baalgarthem/obsidian-tabs-extended
 * ═══════════════════════════════════════════════════════════════════════════════
 */
`;

const isProd = process.argv[2] === "production";

const context = await esbuild.context({
  // Inyección de banner
  banner: { js: banner },
  
  // Archivo raíz de entrada
  entryPoints: ["src/main.js"],
  
  // Resuelve recursivamente todos los imports en un solo archivo
  bundle: true,
  
  // Excluye las APIs nativas que Obsidian inyecta en tiempo de ejecución
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr"
  ],
  
  // Formato CommonJS requerido por Obsidian
  format: "cjs",
  
  // Estándar de compatibilidad de JavaScript moderno
  target: "es2022",
  
  // Mapas de depuración inline en desarrollo
  sourcemap: isProd ? false : "inline",
  
  // Eliminación de código no utilizado
  treeShaking: true,
  
  // Archivo de salida compilado
  outfile: "dist/main.js",
  
  // Indentación limpia y legible
  minify: false,
  
  // Plugins personalizados de procesamiento
  plugins: [
    {
      name: "ascii-separator-and-assets-plugin",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0) {
            // Post-procesado: reemplaza marcas de módulos con banners ASCII
            injectAsciiSeparators("dist/main.js");
            // Copia manifest.json y styles.css a dist/
            copyStaticAssets();
            // Mantiene sincronizado el main.js de la raíz para desarrollo en vivo
            fs.copyFileSync("dist/main.js", "main.js");
          }
        });
      }
    }
  ]
});

if (isProd) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
  console.log("Watching for changes in src/...");
}
```

---

## 1.6 Sistema de Separadores y Banners ASCII
Para que el archivo `dist/main.js` sea inmediatamente comprensible, el plugin personalizado en `esbuild.config.mjs` escanea los comentarios de origen de esbuild (`// src/...`) y los convierte en elegantes **cajas ASCII**:

```javascript
/* ╔════════════════════════════════════════════════════════════════════════════╗
 * ║  📦 MÓDULO: src/core/model.js                                            ║
 * ╚════════════════════════════════════════════════════════════════════════════╝ */
```

Esto permite saltar rápidamente entre componentes al inspeccionar el código compilado.

---

# 2. `Acorn` y `AST (Abstract Syntax Tree)` — Análisis Sintáctico de Código

## 2.1 ¿Qué es un AST y qué es Acorn?
- **AST (*Abstract Syntax Tree*)**: Es una representación en forma de árbol jerárquico de la estructura gramatical del código fuente. Cada nodo del árbol representa un elemento del lenguaje (declaración de variable, clase, función, llamada a método, etc.).
- **[Acorn](https://github.com/acornjs/acorn)**: Es un analizador sintáctico (*parser*) de JavaScript ultrarrápido y estándar que transforma texto plano en un AST compatible con la especificación ESTree.

## 2.2 Rol de Acorn en la Modularización de Tabs Extended
Gracias a Acorn, el código original de 33,000 líneas fue descompuesto de forma **quirúrgica**:
1. Se analizó el AST para detectar los límites exactos de cada clase (`Tabs`, `TabsConfig`, `TabItem`, `TabsNav`, `TabsContent`, `SettingTab`, etc.).
2. Se extrajeron funciones de forma atómica sin perder referencias de variables o dependencias.
3. Se generaron los módulos independientes dentro de `src/` asegurando 100% de fidelidad funcional.

---

# 3. `CodeMirror 6` — Motor del Editor Modal

## 3.1 Arquitectura de CodeMirror 6 (`State` vs. `View`)
CodeMirror 6 está diseñado con una arquitectura funcional reactiva e inmutable:
- **`EditorState`**: Modelo inmutable que representa el documento actual, la selección del cursor y las extensiones activas.
- **`EditorView`**: Componente visual que sincroniza el estado con el DOM del navegador.

## 3.2 Sistema de Decoraciones y Widgets (`DepthWidget`)
El editor modal renderiza insignias visuales (*ghost text*) junto a las cercas y separadores:
- **`Decoration.widget`**: Inserta elementos DOM personalizados en posiciones específicas del texto.
- **`toDOM()`**: Crea el elemento `<span>` inicial con el texto fantasma y el botón de borrado (🗑️).
- **`updateDOM(dom, view)`**: Método clave implementado para actualizar las propiedades del elemento DOM directamente en su lugar (*in-place*). Evita que CodeMirror 6 duplique elementos visuales o corte caracteres como la última virgulilla (`~`) o la letra `s` de `tabs`.
- **Anclaje neutral (`side: 0`)**: Garantiza que el widget se dibuje exactamente en el límite de la línea sin cortar caracteres adyacentes.

## 3.3 Protección Inmutable con `transactionFilter` y `atomicRanges`
- **`transactionFilter`**: Intercepta todas las transacciones de edición antes de que alteren el documento. Bloquea cualquier intento de borrar o modificar las cercas de apertura (`~~~tabs`), cercas de cierre (`~~~`) o el prefijo separador (`tema:`).
- **`atomicRanges`**: Controla la selección del cursor, impidiendo que el cursor quede atrapado dentro de palabras clave protegidas.

## 3.4 Control de Teclado con `keymap` de Alta Precedencia
Gestiona la tecla `Enter` y flechas direccionales con prioridad máxima (`safeHighest`):
- Al pulsar `Enter` tras una cerca de cierre (`~~~`) o un separador (`tema:perritos`), crea exactamente **una sola línea en blanco** si no existe una vacía debajo, o traslada el foco limpiamente si ya existe, sin duplicar texto fantasma ni romper la estructura.

---

# 4. `Obsidian API` — Arquitectura de Plugins y Ciclo de Vida

## 4.1 Clase `Plugin` y Ciclo de Vida
La clase `TabsExtendedPlugin` (`src/main.js`) extiende `Plugin` de Obsidian y gestiona:
- **`onload()`**: Se ejecuta al activar el plugin. Registra los procesadores de bloques de código Markdown (`registerMarkdownCodeBlockProcessor`), comandos en la paleta, botones en la barra de cinta (*ribbon*) y pestañas de configuración.
- **`onunload()`**: Se ejecuta al desactivar el plugin. Limpia observadores, desvincula eventos y remueve estilos inyectados del DOM.

## 4.2 `MarkdownRenderChild` y Renderizado en el DOM
- La clase `TabsRenderer` (`src/core/renderer.js`) hereda de `MarkdownRenderChild`.
- Garantiza que cuando una nota de Obsidian se cierra o se cambia de vista, todos los componentes visuales de las pestañas se desmonten de forma limpia sin fugas de memoria (*memory leaks*).

## 4.3 Paneles de Ajustes (`PluginSettingTab`) y Modales (`Modal`)
- **`PluginSettingTab`** (`src/settings/SettingTab.js`): Construye la interfaz de ajustes de Obsidian con componentes nativos (`Setting.addText`, `addToggle`, `addDropdown`, `addColorPicker`).
- **`Modal`** (`src/editor/modal.js`, `src/modals/`): Ventanas emergentes nativas de Obsidian para el editor modal, confirmación de eliminación y renombramiento de pestañas.

---

# 5. `SortableJS` — Reordenación por Arrastre (Drag & Drop)

- **Propósito**: Permite a los usuarios arrastrar y soltar las pestañas para reordenarlas visualmente.
- **Integración**: `TabsNav` inicializa SortableJS sobre la barra de navegación. Al soltar una pestaña en una nueva posición, el modelo calcula los índices de origen y destino, reordena las secciones de texto en el código fuente de la nota y actualiza el archivo Markdown de forma atómica.

---

# 6. `npm Scripts & Git Automation` — Flujo de Versiones

En [`package.json`](file:///D:/Scripts/obsidian-plugins/tabs-extended/package.json) se articulan los comandos del ciclo de vida:

| Comando | Función | Flujo Interno |
| :--- | :--- | :--- |
| `npm run dev` | Desarrollo continuo | Inicia `esbuild` en modo *watch*, recompilando en tiempo real ante cualquier cambio en `src/`. |
| `npm run build` | Compilación de producción | Genera el bundle final con banners ASCII en `dist/main.js`, copia `manifest.json` y `styles.css` a `dist/` y sincroniza `./main.js`. |
| `npm version patch` | Incremento de parche (`1.10.0` -> `1.10.1`) | Actualiza `package.json`, ejecuta [`version-bump.mjs`](file:///D:/Scripts/obsidian-plugins/tabs-extended/version-bump.mjs), inyecta la versión en `manifest.json` y `dist/manifest.json`, y realiza `git add .` automáticamente. |
| `npm version minor` | Incremento menor (`1.10.0` -> `1.11.0`) | Igual que patch pero para nuevas funcionalidades compatibles. |
| `npm version major` | Incremento mayor (`1.10.0` -> `2.0.0`) | Igual que patch pero para cambios mayores en la arquitectura. |
