# 📑 Tabs Extended for Obsidian

<p align="center">
  <b>El sistema definitivo para organizar tus notas con pestañas horizontales, verticales y anidadas en Obsidian.</b><br>
  <i>The definitive system to organize your Obsidian notes with horizontal, vertical, and nested tabs.</i>
</p>

---

## 📑 Tabla de Contenidos / Table of Contents

- [Español 🇪🇸](#español-)
  - [¿Por qué Tabs Extended? (Ventajas Únicas)](#-por-qué-tabs-extended-ventajas-únicas)
  - [Características Principales](#características-principales)
  - [Guía de Sintaxis y Ejemplos](#guía-de-sintaxis-y-ejemplos)
    - [1. Pestañas Horizontales Básicas](#1-pestañas-horizontales-básicas)
    - [2. Pestañas Verticales (`-v`)](#2-pestañas-verticales--v)
    - [3. Pestañas Anidadas (Nested Tabs)](#3-pestañas-anidadas-nested-tabs)
  - [Editor Modal Interactivo](#editor-modal-interactivo)
  - [Compatibilidad con la Comunidad (Execute Code & Callouts)](#compatibilidad-con-la-comunidad-execute-code--callouts)
  - [Configuración de Palabra Clave (`tabsKeyword`)](#configuración-de-palabra-clave-tabskeyword)
- [English 🇬🇧](#english-)
  - [Why Tabs Extended? (Key Advantages)](#why-tabs-extended-key-advantages)
  - [Key Features](#key-features)
  - [Syntax Guide & Examples](#syntax-guide--examples)
    - [1. Basic Horizontal Tabs](#1-basic-horizontal-tabs)
    - [2. Vertical Tabs (`-v`)](#2-vertical-tabs--v)
    - [3. Nested Tabs](#3-nested-tabs)
  - [Interactive Modal Editor](#interactive-modal-editor)
  - [Ecosystem Compatibility (Execute Code & Callouts)](#ecosystem-compatibility-execute-code--callouts)
  - [Custom Keyword Configuration (`tabsKeyword`)](#custom-keyword-configuration-tabskeyword)
- [Licencia / License](#licencia--license)

---

## Español 🇪🇸

### 🚀 ¿Por qué Tabs Extended? (Ventajas Únicas)

A diferencia de otras extensiones de pestañas convencionales en Obsidian, **Tabs Extended** fue diseñado para ofrecer una experiencia limpia, fluida y robusta sin romper la estructura sintáctica de Markdown:

1. **Anidamiento Infinito Atómico**: Puedes insertar bloques de pestañas dentro de otras pestañas sin riesgo de que la cerca exterior se rompa o colapse.
2. **Editor Modal WYSIWYG Integrado**: Edita el contenido de tus pestañas en tiempo real con una interfaz visual intuitiva, botones dedicados para pestañas anidadas (horizontales y verticales) y controles de eliminación por pestaña.
3. **Compatibilidad Total con Ejecución de Código (`execute-code`)**: Renderiza botones "Run" independientes para todas las celdas de código consecutivas (Python, JS, Bash, etc.) dentro de cualquier pestaña.
4. **Armonía Visual con Callouts**: Respeta al 100% los temas nativos y la personalización de *Callout Manager* sin interferencias de CSS ni pérdida de colores.
5. **Palabra Clave Personalizable**: Permite cambiar la palabra desencadenante (`tabs`) por cualquier término de tu preferencia (`pestanas`, `tab`, `secciones`).

---

### ✨ Características Principales

* ↔️ **Pestañas Horizontales**: Diseño elegante estilo navegador para alternar información rápidamente.
* ↕️ **Pestañas Verticales (`-v`)**: Distribución de panel lateral ideal para notas extensas, documentación o wikis.
* 🪆 **Anidamiento Jerárquico Seguro**: Sistema dinámico de virgulillas (`~~~`) para delimitar bloques internos sin conflictos sintácticos.
* 🛠️ **Caja de Herramientas Modal**: Formato rápido (negrita, cursiva, resaltado, listas, tablas, callouts y bloques de pestañas anidadas).
* 🛡️ **Protección de Estructura**: Inmunidad de cercas de código contra borrados accidentales del cursor durante la edición.
* 🎨 **Diseño Moderno & Glassmorphism**: Estilos limpios adaptados al modo claro y oscuro de Obsidian.

---

### 📖 Guía de Sintaxis y Ejemplos

#### 1. Pestañas Horizontales Básicas
Utiliza el bloque de código `tabs` y separa los encabezados de cada pestaña con `==` (o el delimitador configurado):

```markdown
```tabs
== 📌 Descripción
Esta es la primera pestaña con información general de la nota.

== ⚙️ Requisitos
- Obsidian v1.0.0+
- Plugin Tabs Extended activo.
```
```

#### 2. Pestañas Verticales (`-v`)
Añade `-v` a la palabra clave para cambiar a orientación vertical:

```markdown
```tabs-v
== 📁 Módulo 1
Contenido del primer módulo explicativo.

== 📁 Módulo 2
Contenido del segundo módulo explicativo.
```
```

#### 3. Pestañas Anidadas (Nested Tabs)
Para crear pestañas dentro de pestañas, el bloque hijo utiliza virgulillas (`~~~`):

```markdown
```tabs
== 🌐 Pestaña Principal

~~~tabs
== 🔹 Sub-Pestaña A
Contenido interno A.

== 🔹 Sub-Pestaña B
Contenido interno B.
~~~

== 📊 Estadísticas
Información adicional fuera del bloque hijo.
```
```

---

### 🎨 Editor Modal Interactivo

Al pasar el cursor sobre un bloque de pestañas en la vista de lectura o edición de Obsidian, verás el icono de edición (✏️). Al hacer clic se abrirá el **Editor Modal de Tabs Extended**:

- **Barra de Herramientas**: Inserta rápidamente pestañas anidadas horizontales (📌) y verticales (↕️).
- **Control por Pestaña**: Reordena, cambia títulos o elimina pestañas individuales con el botón 🗑️.
- **Historial Integrado**: Soporte para Deshacer (`Ctrl+Z`) y Rehacer (`Ctrl+Shift+Z`) directo en el editor.

---

### 🔌 Compatibilidad con la Comunidad (Execute Code & Callouts)

* **Execute Code Plugin**: Todos los bloques de código consecutivos dentro de celdas de pestañas cuentan con envoltorios aislados (`.tabs-codeblock-wrapper`), garantizando que los botones de ejecución ("Run") aparezcan y funcionen de forma independiente.
* **Callout Manager**: Soporte completo para callouts nativos y personalizados. Los colores, íconos y bordes configurados en Callout Manager se mantienen 100% idénticos dentro de las pestañas.

---

### ⚙️ Configuración de Palabra Clave (`tabsKeyword`)

1. Abre **Ajustes** -> **Tabs Extended**.
2. Dirígete a la sección **Pestañas Estándar**.
3. En **Palabra Clave del Bloque de Pestañas**, ingresa tu palabra deseada (ejemplo: `pestanas`).
4. ¡Listo! Ahora podrás usar ```` ```pestanas ```` para pestañas horizontales y ```` ```pestanas-v ```` para pestañas verticales.

---

## English 🇬🇧

### 🚀 Why Tabs Extended? (Key Advantages)

Unlike conventional tab plugins in Obsidian, **Tabs Extended** was architected to deliver a smooth, powerful, and robust experience without breaking Markdown syntax:

1. **Atomic Infinite Nesting**: Embed tab blocks inside other tabs seamlessly without premature closure or fence syntax breakdown.
2. **Integrated WYSIWYG Modal Editor**: Edit your tab content in real-time with an intuitive visual interface, dedicated nested tab buttons (horizontal and vertical), and per-tab deletion controls.
3. **Full Multi-Execution Compatibility (`execute-code`)**: Renders independent "Run" buttons for all consecutive code blocks (Python, JS, Bash, etc.) inside any tab body.
4. **Seamless Callout Integration**: 100% visual harmony with Obsidian native callouts and *Callout Manager* without CSS interference or color wiping.
5. **Customizable Trigger Keyword**: Customize the triggering keyword (`tabs`) to any term you prefer (`pestanas`, `tab`, `sections`).

---

### ✨ Key Features

* ↔️ **Horizontal Tabs**: Sleek browser-style tabs for quick context switching.
* ↕️ **Vertical Tabs (`-v`)**: Sidebar layout ideal for extensive notes, documentation, or wikis.
* 🪆 **Safe Hierarchical Nesting**: Dynamic tilde fence (`~~~`) system to isolate inner tab blocks safely.
* 🛠️ **Modal Toolbox**: Rich formatting toolbar (bold, italic, highlight, lists, tables, callouts, and nested tabs).
* 🛡️ **Fence Shielding**: Structural immunity for code fences against accidental cursor deletion during edits.
* 🎨 **Modern & Responsive Design**: Tailored glassmorphism aesthetics supporting both light and dark Obsidian themes.

---

### 📖 Syntax Guide & Examples

#### 1. Basic Horizontal Tabs
Use the `tabs` code block and separate tab headers with `==` (or your configured delimiter):

```markdown
```tabs
== 📌 Overview
This is the first tab containing general note information.

== ⚙️ Requirements
- Obsidian v1.0.0+
- Tabs Extended plugin enabled.
```
```

#### 2. Vertical Tabs (`-v`)
Append `-v` to the keyword for vertical layout:

```markdown
```tabs-v
== 📁 Module 1
Content of the first module.

== 📁 Module 2
Content of the second module.
```
```

#### 3. Nested Tabs
To embed tabs inside another tab, the nested block uses tildes (`~~~`):

```markdown
```tabs
== 🌐 Main Tab

~~~tabs
== 🔹 Sub-Tab A
Inner content A.

== 🔹 Sub-Tab B
Inner content B.
~~~

== 📊 Metrics
Additional content outside the nested block.
```
```

---

### 🎨 Interactive Modal Editor

Hover over any tab block in Obsidian and click the edit icon (✏️) to launch the **Tabs Extended Modal Editor**:

- **Toolbar Controls**: Instantly insert Horizontal (📌) and Vertical (↕️) nested tabs.
- **Tab Management**: Rename, reorganize, or delete individual tabs using the 🗑️ button.
- **History Undo/Redo**: Full Undo (`Ctrl+Z`) and Redo (`Ctrl+Shift+Z`) support directly inside the modal.

---

### 🔌 Ecosystem Compatibility (Execute Code & Callouts)

* **Execute Code Plugin**: All consecutive code blocks inside tab containers receive isolated wrapper elements (`.tabs-codeblock-wrapper`), ensuring "Run" buttons attach cleanly to every code block.
* **Callout Manager**: Native & custom callouts render flawlessly with intact colors, icons, and theme borders.

---

### ⚙️ Custom Keyword Configuration (`tabsKeyword`)

1. Go to **Settings** -> **Tabs Extended**.
2. Locate the **Standard Tabs** section.
3. In **Tab Block Keyword**, enter your preferred keyword (e.g., `sections`).
4. Done! You can now use ```` ```sections ```` for horizontal tabs and ```` ```sections-v ```` for vertical tabs.

---

## Licencia / License

Distributed under the [MIT License](LICENSE).
