# Arquitectura Modular de Tabs Extended

Este documento describe la arquitectura modular del código fuente de **Tabs Extended**, organizada coherentemente tras el análisis de Árbol de Sintaxis Abstracta (AST) con Acorn y refactorizada en módulos ES6 independientes dentro de la carpeta `src/`.

---

## 🌳 Árbol Estructural de Módulos (ASCII Tree)

```text
tabs-extended/
├── src/
│   ├── main.js                              # Punto de entrada principal y ciclo de vida del Plugin (TabsExtendedPlugin)
│   │
│   ├── i18n/                                # Sistema de internacionalización y traducciones
│   │   ├── index.js                         # Motor de traducción ($ / _ / t) y selector dinámico de idioma
│   │   └── locales/
│   │       ├── es.js                        # Diccionario de traducción en Español (Idioma primario)
│   │       └── en.js                        # Diccionario de traducción en Inglés (Idioma secundario / Fallback)
│   │
│   ├── settings/                            # Gestión de configuración de Obsidian y panel de opciones
│   │   ├── defaultSettings.js               # Objeto DEFAULT_SETTINGS con todos los valores y claves por defecto
│   │   ├── SampleTabsPreview.js             # Componente SettingsSampleTabs para previsualización interactiva
│   │   └── SettingTab.js                    # Panel UI TabsExtendedSettingTab dividido en categorías semánticas
│   │
│   ├── core/                                # Núcleo del modelo de datos y renderizado
│   │   ├── parser.js                        # Análisis AST de cercas (~ / `), delimitadores, secciones y hashes
│   │   ├── config.js                        # Parser de configuración YAML/inline en cabeceras de bloque (TabsConfig)
│   │   └── model.js                         # Modelo de pestañas reactivo y MarkdownRenderChild (Tabs)
│   │
│   ├── components/                          # Componentes de interfaz de usuario de las pestañas
│   │   ├── TabItem.js                       # Elemento individual de navegación de pestaña
│   │   ├── TabContextMenu.js                # Menú contextual de clic derecho en pestañas
│   │   ├── TabsNav.js                       # Barra contenedora de navegación y reordenación con SortableJS
│   │   └── TabsContent.js                   # Contenedor y gestor de contenido Markdown activo
│   │
│   ├── editor/                              # Motor del Editor Modal y resaltador CodeMirror 6
│   │   ├── modal.js                         # Diálogo flotante del editor modal (TabsEditorModal)
│   │   └── engine.js                        # Motor CM6 (TabsModalEditorEngine, DepthWidget, Highlighter, Keymaps)
│   │
│   ├── modals/                              # Diálogos y ventanas emergentes auxiliares
│   │   ├── ChangelogModal.js                # Modal con historial de cambios y mejoras
│   │   ├── ConfirmDeleteModal.js            # Modal de confirmación de eliminación de pestañas/bloques
│   │   └── RenameTabModal.js                # Modal para renombrar títulos de pestañas
│   │
│   ├── styles/                              # Inyección dinámica de estilos CSS
│   │   └── previewStyles.js                 # Reglas CSS dinámicas para niveles de anidación (1 a 5+)
│   │
│   └── vendor/                              # Librerías y dependencias empaquetadas
│       └── codemirror-bundle.js             # Runtime de CodeMirror 6, Lezer Markdown y SortableJS
│
├── dist/                                    # Distribución lista para producción generada por esbuild
│   ├── main.js                              # Bundle final minificado y optimizado
│   ├── manifest.json                        # Metadatos del plugin
│   └── styles.css                           # Hoja de estilos del plugin
│
├── .legacy/                                 # Código monolítico original de referencia inmutable
│   ├── main.js                              # Snapshot estático del main original
│   ├── manifest.json                        # Snapshot estático del manifest original
│   └── styles.css                           # Snapshot estático de la hoja de estilos original
│
├── esbuild.config.mjs                       # Configuración de compilación y empaquetado esbuild
├── version-bump.mjs                         # Script automático de inyección de versiones y git staging
└── package.json                             # Configuración del paquete y scripts npm
```

---

## 📦 Descripción Detallada de Módulos

### 1. Punto de Entrada (`src/main.js`)
- **Qué es**: Clase principal `TabsExtendedPlugin` que extiende `Plugin` de Obsidian.
- **Qué hace**:
  - Gestiona el ciclo de vida del plugin (`onload`, `onunload`).
  - Carga y persiste la configuración del usuario (`loadSettings`, `saveSettings`).
  - Registra el procesador de bloques de código Markdown (`registerMarkdownCodeBlockProcessor`) para palabras clave horizontales (`tabs`) y verticales (`tabs-v`).
  - Registra comandos en la paleta de Obsidian y botones en la barra de cinta (*ribbon*).
  - Inyecta los estilos dinámicos de previsualización en el DOM.
- **Interacción**: Coordina `Tabs` (`src/core/model.js`), `TabsRenderer` (`src/core/renderer.js`), `TabsExtendedSettingTab` (`src/settings/SettingTab.js`) y `ChangelogModal` (`src/modals/ChangelogModal.js`).

---

### 2. Internacionalización (`src/i18n/`)
- **`src/i18n/index.js`**:
  - Función central de traducción `t(key, ...params)` (alias `$` y `_`).
  - `getCurrentLanguage()`: Detecta el idioma configurado en los ajustes del plugin (Español `es` o Inglés `en`).
- **`src/i18n/locales/`**:
  - `es.js`: Diccionario integral en Español para todas las opciones, títulos, descripciones, botones y modales.
  - `en.js`: Diccionario completo en Inglés como idioma alternativo y fallback.
- **Interacción**: Utilizado por prácticamente todos los módulos de interfaz gráfica (`settings`, `modals`, `components`, `editor`).

---

### 3. Configuración de Obsidian (`src/settings/`)
- **`src/settings/defaultSettings.js`**:
  - Exporta la constante `DEFAULT_SETTINGS` que contiene todas las opciones iniciales del plugin (separador `tema:`, alineaciones, colores por nivel de anidación, estilos de borde, idioma, etc.).
- **`src/settings/SampleTabsPreview.js` (`SettingsSampleTabs`)**:
  - Componente de previsualización en vivo interactivo dentro del panel de ajustes que refleja los cambios de estilo y configuración en tiempo real.
- **`src/settings/SettingTab.js` (`TabsExtendedSettingTab`)**:
  - Renderiza la interfaz de ajustes en Obsidian, dividida en categorías legibles (General, Delimitadores, Títulos, Bordes, Animaciones, Niveles de color, etc.).
- **Interacción**: Conecta con `src/i18n/` para los textos y actualiza las propiedades del plugin en `src/main.js`.

---

### 4. Núcleo Estructural (`src/core/`)
- **`src/core/parser.js`**:
  - Conjunto de funciones puras de análisis sintáctico:
    - `tabsExtendedAnalyzeTabSections`: Segmenta el código fuente Markdown en secciones de pestañas respetando bloques de código y anidaciones.
    - `tabsExtendedFenceInfo` / `tabsExtendedUpdateFenceStack`: Rastreo y emparejamiento de cercas externas e internas (`~~~` o ```` ``` ````).
    - `tabsExtendedStableTextHash`: Generación de identificadores de hash estables para la memoria caché de pestañas anidadas.
- **`src/core/config.js` (`TabsConfig`)**:
  - Procesa opciones de configuración locales escritas en la cabecera de cada bloque de pestañas (e.g. `align: center`, `border: always`, etc.).
- **`src/core/model.js` (`Tabs`)**:
  - Modelo de datos principal de cada bloque de pestañas renderizado. Gestiona la pestaña activa, la sincronización de escrituras hacia el editor de Obsidian, la reconciliación tras ediciones modales y la persistencia de scroll.
- **`src/core/renderer.js` (`TabsRenderer`)**:
  - Hereda de `MarkdownRenderChild` y garantiza la limpieza y desmontaje seguro de eventos en el DOM de Obsidian.

---

### 5. Componentes de UI (`src/components/`)
- **`src/components/TabItem.js` (`TabItem`)**:
  - Representa el botón de cada pestaña en la barra de navegación. Gestiona eventos de clic, estado activo/inactivo, renderizado de títulos y disparadores de arrastre (*drag & drop*).
- **`src/components/TabContextMenu.js` (`TabContextMenu`)**:
  - Menú contextual desplegable con clic derecho sobre una pestaña (Renombrar, Eliminar, Duplicar, Copiar, etc.).
- **`src/components/TabsNav.js` (`TabsNav`)**:
  - Contenedor de la barra de navegación horizontal o vertical. Integra la biblioteca Sortable para reordenar pestañas y el botón de añadir nueva pestaña (`+`).
- **`src/components/TabsContent.js` (`TabContentItem`)**:
  - Gestiona el panel de visualización del contenido Markdown activo, delegando en Obsidian el renderizado de enlaces, imágenes, tablas y bloques anidados.

---

### 6. Editor Modal y Resaltador (`src/editor/`)
- **`src/editor/modal.js` (`TabsEditorModal`)**:
  - Diálogo modal flotante de pantalla completa para editar el contenido completo del bloque de pestañas.
- **`src/editor/engine.js` (`TabsModalEditorEngine`)**:
  - Instancia avanzada de CodeMirror 6 que gestiona la edición de pestañas con:
    - Barra de herramientas de formateo (negrita, cursiva, listas, tablas, añadir pestaña principal).
    - Auto-guardado con *debounce*.
    - **`DepthWidget`**: Widget DOM que dibuja los textos fantasma (*ghost text*) de cercas de apertura (`~~~tabs`), cierre (`~~~`) y títulos, con soporte para `updateDOM` *in-place*.
    - **`nestedTabsHighlighter`**: Resaltador visual multinivel que colorea cada nivel de anidación según la paleta configurada.
    - **`transactionFilter` y `atomicRanges`**: Protección estricta e inmutable para evitar el borrado accidental de las virgulillas o palabras clave de las cercas.
    - **Keymap autoritativo**: Manejo fluido de `Enter`, `ArrowUp`, `ArrowDown`, `Backspace` y `Delete`.

---

### 7. Modales Auxiliares (`src/modals/`)
- **`ChangelogModal.js`**: Despliega las novedades y mejoras de cada versión.
- **`ConfirmDeleteModal.js`**: Cuadro de diálogo modal de confirmación antes de eliminar una pestaña o un bloque de pestañas anidado completo.
- **`RenameTabModal.js`**: Ventana emergente interactiva para renombrar el título de una pestaña validando entradas vacías.

---

### 8. Estilos Dinámicos (`src/styles/`)
- **`previewStyles.js`**:
  - Genera y actualiza las reglas CSS en tiempo real (`<style id="tabs-extended-preview-styles">`) asociadas a los colores temáticos de profundidad de anidación (niveles 1 a 5+), tanto para modo claro como para modo oscuro.

---

### 9. Dependencias de Terceros (`src/vendor/`)
- **`codemirror-bundle.js`**:
  - Contiene el runtime empaquetado de CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/language`, `@codemirror/commands`), el parser de Markdown de Lezer (`@lezer/markdown`) y el motor de arrastre SortableJS, exportando limpiamente todas las clases y funciones requeridas por el editor modal.

---

### 10. Archivos de Referencia Inmutables (`.legacy/`)
- **`.legacy/main.js`**, **`.legacy/manifest.json`**, **`.legacy/styles.css`**:
  - Snapshot de respaldo del código monolítico original.
  - Sirve exclusivamente como fuente inmutable de consulta y extracción histórica para continuar poblando y perfeccionando los módulos de `src/`. No se modifica ni se compila.
