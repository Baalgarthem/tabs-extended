# Tabs Extended for Obsidian

<p align="center">
  <b>La forma más fácil y elegante de organizar tu información en pestañas dentro de Obsidian.</b><br>
  <i>The easiest and most elegant way to organize your information in tabs inside Obsidian.</i>
</p>

---

## Tabla de Contenidos / Table of Contents

- [Español](#español)
  - [¿Qué hace especial a Tabs Extended?](#qué-hace-especial-a-tabs-extended)
  - [¿Qué puedes hacer con este plugin?](#qué-puedes-hacer-con-este-plugin)
  - [Cómo usarlo (Ejemplos sencillos)](#cómo-usarlo-ejemplos-sencillos)
    - [1. Pestañas Horizontales](#1-pestañas-horizontales)
    - [2. Pestañas Verticales](#2-pestañas-verticales)
    - [3. Pestañas dentro de Pestañas (Anidadas)](#3-pestañas-dentro-de-pestañas-anidadas)
  - [Editor Visual de Pestañas](#editor-visual-de-pestañas)
  - [Funciona de maravilla con tus otros plugins](#funciona-de-maravilla-con-tus-otros-plugins)
  - [Cambia la palabra clave a tu gusto](#cambia-la-palabra-clave-a-tu-gusto)
- [English](#english)
  - [What makes Tabs Extended special?](#what-makes-tabs-extended-special)
  - [What can you do with this plugin?](#what-can-you-do-with-this-plugin)
  - [How to use it (Simple examples)](#how-to-use-it-simple-examples)
    - [1. Horizontal Tabs](#1-horizontal-tabs)
    - [2. Vertical Tabs](#2-vertical-tabs)
    - [3. Tabs inside Tabs (Nested)](#3-tabs-inside-tabs-nested)
  - [Visual Tab Editor](#visual-tab-editor)
  - [Works seamlessly with your other plugins](#works-seamlessly-with-your-other-plugins)
  - [Customize your tab trigger word](#customize-your-tab-trigger-word)
- [Licencia / License](#licencia--license)

---

## Español

### ¿Qué hace especial a Tabs Extended?

Si tus notas en Obsidian son muy largas o contienen mucha información, **Tabs Extended** te ayuda a ordenarlas en pestañas limpias e interactivas.

A diferencia de otras opciones, este plugin te ofrece:

1. **Pestañas dentro de otras Pestañas**: Puedes crear sub-niveles de información sin que tus notas se rompan o pierdan el formato.
2. **Editor Visual Intuitivo**: No necesitas recordar comandos difíciles. Haz clic en el botón de editar y modifica tus pestañas cómodamente en una ventana dedicada.
3. **Compatibilidad Total**: Tus notas con bloques de código ejecutable y cajas destacadas (callouts) mantendrán siempre sus colores y funciones intactos.
4. **Personalizable**: Tú eliges cómo llamar a tus bloques de pestañas en la configuración.

---

### ¿Qué puedes hacer con este plugin?

* **Pestañas Horizontales**: Como las pestañas de tu navegador de internet. Ideales para resumir temas en una sola mirada.
* **Pestañas Verticales**: Un menú lateral perfecto para guías, documentación, cursos o manuales paso a paso.
* **Organización por Niveles**: Agrupa pestañas dentro de otras pestañas para proyectos complejos.
* **Herramientas de Formato Fáciles**: Agrega negritas, listas, tablas o nuevas pestañas con un solo clic.

---

### Cómo usarlo (Ejemplos sencillos)

#### 1. Pestañas Horizontales
Escribe un bloque `tabs` y usa `==` antes del nombre de cada pestaña:

```markdown
```tabs
== Resumen
Aquí va la presentación general de tu tema.

== Requisitos
- Tener Obsidian instalado.
- Activar el plugin Tabs Extended.
```
```

#### 2. Pestañas Verticales
Añade `-v` al nombre para ver las pestañas en forma de menú vertical a la izquierda:

```markdown
```tabs-v
== Tema 1
Explicación de la primera lección.

== Tema 2
Explicación de la segunda lección.
```
```

#### 3. Pestañas dentro de Pestañas (Anidadas)
Para poner pestañas dentro de otra pestaña, usa tres virgulillas (`~~~`):

```markdown
```tabs
== Tema Principal

~~~tabs
== Subtema A
Información detallada A.

== Subtema B
Información detallada B.
~~~

== Conclusión
Texto final del tema principal.
```
```

---

### Editor Visual de Pestañas

Cuando pases el cursor sobre cualquier conjunto de pestañas, verás un icono de lápiz. Al tocarlo se abrirá una ventana interactiva donde podrás:

- Agregar nuevas pestañas horizontales o verticales con botones dedicados.
- Cambiar títulos de pestañas fácilmente.
- Eliminar o reordenar pestañas con el icono del bote de basura.
- Deshacer cambios rápidamente con `Ctrl+Z`.

---

### Funciona de maravilla con tus otros plugins

- **Bloques de código interactivo (Execute Code)**: Si ejecutas código directamente en tus notas, cada bloque dentro de una pestaña conservará su botón para correr el código independientemente.
- **Cajas destacadas (Callouts y Callout Manager)**: Tus notas de aviso, consejos o advertencias conservarán todos sus colores, iconos y bordes originales dentro de las pestañas.

---

### Cambia la palabra clave a tu gusto

Si prefieres usar una palabra en español como `pestanas` o `secciones` en lugar de `tabs`:

1. Ve a **Ajustes de Obsidian** -> **Tabs Extended**.
2. En la opción **Palabra Clave del Bloque de Pestañas**, escribe tu palabra favorita (por ejemplo: `pestanas`).
3. ¡Listo! Ahora podrás crear pestañas escribiendo ```` ```pestanas ```` o ```` ```pestanas-v ````.

---

## English

### What makes Tabs Extended special?

If your Obsidian notes are long or detailed, **Tabs Extended** helps you organize them into clean, interactive tabs.

Unlike other options, this plugin provides:

1. **Tabs inside Tabs**: Create sub-levels of information without breaking your note layout.
2. **Intuitive Visual Editor**: No need to memorize complex markup. Simply click the edit button and manage your tabs in a dedicated window.
3. **Full Compatibility**: Your code blocks and callout boxes will keep their colors, icons, and features fully working inside tabs.
4. **Customizable**: Choose your own trigger keyword in the settings menu.

---

### What can you do with this plugin?

* **Horizontal Tabs**: Browser-style tabs to switch between topics seamlessly.
* **Vertical Tabs**: Sidebar navigation menu tailored for guides, documentation, or study units.
* **Multi-Level Structure**: Group tabs inside other tabs for complex projects.
* **Easy Formatting Tools**: Add bold text, lists, tables, or new tabs with a single click.

---

### How to use it (Simple examples)

#### 1. Horizontal Tabs
Write a `tabs` code block and use `==` before each tab title:

```markdown
```tabs
== Overview
General summary of your note.

== Requirements
- Obsidian installed.
- Tabs Extended plugin enabled.
```
```

#### 2. Vertical Tabs
Add `-v` to the keyword to switch to a vertical sidebar layout:

```markdown
```tabs-v
== Topic 1
Explanation of the first lesson.

== Topic 2
Explanation of the second lesson.
```
```

#### 3. Tabs inside Tabs (Nested)
To place tabs inside an existing tab, use three tildes (`~~~`):

```markdown
```tabs
== Main Topic

~~~tabs
== Sub-topic A
Detailed sub-topic A info.

== Sub-topic B
Detailed sub-topic B info.
~~~

== Summary
Closing summary of the main topic.
```
```

---

### Visual Tab Editor

Hover over any tab block in your note and click the edit icon to open a visual editor window where you can:

- Add new horizontal or vertical tabs with dedicated toolbar buttons.
- Rename tabs effortlessly.
- Delete or organize tabs using the trash button.
- Undo edits anytime with `Ctrl+Z`.

---

### Works seamlessly with your other plugins

- **Executable Code Blocks (Execute Code)**: If you run code inside your notes, each code block inside a tab maintains its independent "Run" button.
- **Callouts & Callout Manager**: Warning boxes, tips, and custom callouts preserve their original colors, icons, and theme borders inside tabs.

---

### Customize your tab trigger word

If you prefer using a custom word like `sections` or `table` instead of `tabs`:

1. Go to **Obsidian Settings** -> **Tabs Extended**.
2. Under **Tab Block Keyword**, type your preferred word (e.g., `sections`).
3. Done! You can now create tabs using ```` ```sections ```` or ```` ```sections-v ````.

---

## Licencia / License

Distributed under the [MIT License](LICENSE).
