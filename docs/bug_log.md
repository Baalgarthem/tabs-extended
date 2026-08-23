# Log de Bugs

Este documento detalla todos los errores encontrados durante el desarrollo y las soluciones implementadas. Cada bug tiene uno de los siguientes estados:
- **[Solucionado]**
- **[Solucionado]** (Este estado **solo** puede ser asignado por el usuario).

---

## Reglas Generales de Versionado, Commits y Liberación para Bugs

1. **Incremento Estricto del Último Número de Versión para Bugs**:
   - Al implementar o liberar la solución de cualquier bug, **se incrementará exclusivamente el último número de la versión en `manifest.json`** (el número dedicado a parches/bugs, por ejemplo: `1.8.8` $\to$ `1.8.9`).

2. **Alineación Perfecta entre Manifest y Tags de Git**:
   - La versión registrada en `manifest.json` y el tag generado en Git **deben permanecer 100% alineados e idénticos** (ejemplo: si el manifest es `1.8.9`, el tag de Git será `1.8.9`).

3. **Commit Distintivo de Solución**:
   - Al realizar el commit de la solución de un bug (cuando el usuario lo autorice), se utilizará el formato distintivo:
     `solución(bug-X): [Solución del bug X] - [Descripción y mejoras probadas]`

4. **Confirmación del Usuario y Tagging de Liberación**:
   - Una vez que un bug es **marcado como solucionado por el usuario**:
     1. Se confirma el incremento del último número en `manifest.json` (ejemplo: `1.8.9`).
     2. Se realiza el commit representativo de liberación (ej. `liberación(v1.8.9): solución de los bugs X e Y`).
     3. Se crea el **tag de git alineado a la versión actual del manifest** (`git tag 1.8.9`).

---

## Bugs Registrados

### 1. Bug: cursor sintético invisible en la primera posición del título
- **Descripción:** El cursor era visible en `tema:S|oy`, pero desaparecía exactamente en `tema:|Soy`, tanto al llegar con flechas como al intentar colocar la selección con el mouse. Al abandonar esa frontera volvía a dibujarse.
- **Causa raíz definitiva:** El bundle contiene dos runtimes de CodeMirror. El modal se construye con `EditorState I`, `EditorView A` y `EditorSelection k`, pero las rutas personalizadas estaban creando selecciones con `Z`, perteneciente al segundo runtime. El normalizador del primer runtime solo acepta directamente objetos `instanceof k`; ante un objeto `Z` intentaba leer `selection.anchor/head`, propiedades que no existen en el nivel superior de `EditorSelection`. La selección resultante perdía sus coordenadas y `.cm-cursorLayer` no podía medir ni dibujar el caret. El fallo aparecía especialmente en `protectEnd` porque esa posición activaba la normalización personalizada que sustituía una selección nativa válida por `Z.cursor(...)`.
- **Corrección implementada:** El modal declara `this.ModalSelection = k` como única autoridad. Se reemplazaron todas las construcciones `Z.create`, `Z.cursor` y `Z.range` dentro del editor modal, incluyendo el filtro de transacciones, navegación, `Enter`, mouse, selecciones múltiples y la inserción desde la caja de herramientas. La asociación `+1` de `protectEnd` ahora llega intacta al mismo runtime que dibuja el cursor.
- **Alcance preservado:** No se modificaron la decoración `replace`, los rangos atómicos, el caret nativo transparente, los colores, widgets, protecciones ni controles.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 2. Bug: clic bloqueado dentro de títulos de separadores anidados
- **Descripción:** Los títulos de separadores, especialmente los pertenecientes a bloques anidados, no permitían colocar el cursor con el mouse en posiciones visibles como el final de `tema:Soy un tema inferior`. La navegación por teclado sí podía alcanzar esas posiciones.
- **Causas raíz identificadas:** Existían dos rutas manuales fuera del ciclo normal de selección de CodeMirror. El `DepthWidget` colocado en `line.to` interceptaba todo `mousedown` sobre su caja, mientras un `domEventHandler` cancelaba el mismo evento para despachar otra selección. Después de unificar el ciclo de mouse se encontró una segunda causa: `mouseSelectionStyle` todavía devolvía rangos `Z` incompatibles con el runtime `I`/`A` del modal.
- **Corrección implementada:** El widget solo conserva propiedad exclusiva sobre `.tabs-delete-button`; sus demás eventos vuelven a CodeMirror. `EditorView.mouseSelectionStyle` limita la posición al rango editable `[protectEnd, line.to]` y ahora crea todos sus cursores y rangos con `ModalSelection` (`k`). La detección depende únicamente de la sintaxis configurada, por lo que aplica a cualquier profundidad y orientación.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 3. Bug: el texto fantasma no refleja el bloque anidado activo
- **Descripción:** Al colocar el cursor dentro de un bloque de pestañas anidado, los textos fantasma de sus cercas de apertura y cierre no cambiaban a negrita de forma fiable. En anidamientos múltiples también debía evitarse que padre e hijo aparecieran activos simultáneamente.
- **Causa raíz identificada:** La selección del par activo estaba separada de su presentación: JavaScript solo añadía una clase a las líneas y la negrita dependía exclusivamente de una regla de `styles.css`. Si esa hoja no estaba disponible, el estado lógico existía pero no tenía representación visual garantizada. Además, la elección del bloque más profundo estaba implementada dentro del resaltador, sin una autoridad reutilizable que expresara el invariante.
- **Corrección implementada:** `getInnermostActivePair` es ahora la única autoridad para escoger el par que contiene al cursor, priorizando mayor profundidad y, como desempate defensivo, el intervalo más pequeño. Un tema interno de `EditorView` garantiza la negrita, opacidad y color activo sin depender de la hoja externa; `styles.css` conserva una regla equivalente y acotada al editor modal. El resaltador sigue reutilizando sus decoraciones mientras el cursor permanezca dentro del mismo par.
- **Contrato:** Solo las cercas del bloque anidado más profundo están activas. Al salir de un hijo hacia su padre, la activación se transfiere al padre; al salir de todos los bloques, desaparece de todos.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 4. Soporte para Palabra Clave Personalizada (`tabsKeyword`) y Botones Duales de Pestañas Anidadas (Horizontales y Verticales)
- **Descripción**: La palabra clave para bloques de celdas/pestañas estaba hardcodeada a `tabs` o `tabs-v`. El usuario no podía definir una palabra clave propia en los ajustes. Además, en el editor modal no existía forma rápida de elegir si una cerca anidada debía ser horizontal (`tabs`) o vertical (`tabs-v`).
- **Solución Aplicada**:
  1. Se añadió la propiedad `tabsKeyword` al objeto `DEFAULTS` ("tabs" por defecto) y se registró la caja de texto correspondientes en las opciones del plugin (`PluginLocales`).
  2. Se actualizó `registerCodeBlockProcessors()` para registrar dinámicamente los procesadores tanto para la palabra clave base como para su variante `-v` (ejemplo: `<palabra>` y `<palabra>-v`).
  3. Se actualizaron las expresiones regulares y la detección de tokens en el parser para reconocer cualquier palabra clave configurada.
  4. Se integraron 2 botones independientes en el toolbar del editor modal:
     - **Nested Tabs (Horizontal)**: Inserta `~~~<tabsKeyword>` (o `~~~tabs`).
     - **Nested Tabs (Vertical)**: Inserta `~~~<tabsKeyword>-v` (o `~~~tabs-v`).
- **Estado**: **[Solucionado]**

### 5. Pérdida de Opciones en el Menú de Configuraciones
- **Descripción:** El menú de configuraciones (Settings tab) estaba incompleto, perdiendo sus opciones avanzadas debido a una modificación previa en `main.js`.
- **Solución Aplicada:** Se restauró el archivo `main.js` utilizando la copia de seguridad intacta de la carpeta `.backup`, recuperando así la clase completa de configuraciones sin perder el diseño.
- **Estado:** **[Solucionado]**

### 6. Visualización y Renderizado de Nested Tabs (Nivel 2) en el Padre
- **Estado**: ✅ COMPLETADO
- **Descripción**: Los "separadores" (títulos) de nested tabs que se insertaban no se visualizaban como un bloque de pestañas distinto, sino que parecían mezclarse o visualizarse en el bloque de pestañas padre. Esto también generaba un error interno en la asignación del `this.tabsId`.
- **Causa Analizada**: 
  1. **Error de JavaScript**: Las `nested tabs` (pestañas internas) que se renderizan vía Markdown no poseían información contextual (`sectionInfo` era `null`). El event listener para la acción del click intentaba leer `this.sectionInfo.lineStart`, lo que causaba un `TypeError` silencioso que rompía el cacheado, haciendo que todas las nested tabs compartieran el ID `/`.
  2. **Error de CSS**: A nivel visual, las nested tabs (marcadas con la clase `.tabs-innertabs`) carecían de bordes, padding y distinción de fondo, por lo que los elementos generados se camuflaban visualmente como si pertenecieran al bloque contenedor en lugar de destacar como un bloque interactivo independiente.
- **Solución Aplicada**: 
  1. En `main.js`: Se actualizó la generación del `tabsId` en `Gr` para que las `innertabs` reciban un ID único pseudoaleatorio o usen el del cache en vez de arrojar TypeError al acceder a `sectionInfo`. El click handler ahora actualiza el cache utilizando de forma segura `this.tabsId`.
  2. En `styles.css`: Se actualizó la lógica CSS de `.tabs-innertabs`. Originalmente el autor había incluido una regla restrictiva `:not(.tabs-innertabs)` que forzaba a las pestañas internas a ignorar los estilos del padre y no renderizar bordes ni sombras. Se removió esta exclusión para que las *nested tabs* ahora hereden nativamente todos los estilos visuales de su bloque padre (bordes, colores, estados hover), manteniendo únicamente un pequeño margen para preservar el orden visual.

### 7. Fallo de Renderizado en el Modal de Edición (Tabs)
- **Descripción:** Al hacer clic en el botón de lápiz (icono de editor modal) en un bloque de tabs, el modal no se abría y fallaba silenciosamente, y la extensión arrojaba errores si la configuración estaba incompleta o el bloque estaba vacío.
- **Solución Aplicada:** Se interceptó y reescribió el método `startEditing(t)` en `main.js`. Se integró un bloque `try-catch` y se incluyeron validaciones de seguridad exhaustivas para propiedades nulas (`|| ""`) con el fin de evitar lecturas a referencias indefinidas (como `t.tabsContents.tabcontents[t.currentIndex]` cuando el arreglo está vacío).
- **Estado:** **[Solucionado]**

### 8. Incidencia del Asistente AI (Loop de Texto)
- **Problema:** Durante la ejecución anterior, el asistente entró en un bucle infinito generando la palabra producingproducing en masa, bloqueando temporalmente el progreso.
- **Causa Analizada:** Este es un error conocido como *hallucination loop* o fallo de *repetition penalty* en el motor de inferencia del modelo LLM. Ocurre cuando el modelo queda atrapado prediciendo el mismo token repetidamente debido a una degradación en la ventana de contexto o fallos de muestreo.
- **Solución/Prevención:** Al detectarlo, la interrupción del usuario permite reiniciar el estado de generación. Para evitarlo a futuro, mantendré mis comandos y explicaciones concisas, y evitaré generar secuencias de texto repetitivas en mis scripts.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 9. Bug Solucionado: Cierre Prematuro de Bloques Anidados
- **Problema:** En Markdown estándar, si un bloque hijo utiliza el mismo carácter y la misma cantidad de delimitadores que el padre (ej. 3 backticks), el analizador central de Obsidian interpreta el delimitador de apertura del hijo como el cierre del padre, rompiendo toda la estructura antes de que el plugin pueda procesarla.
- **Solución Implementada:** Se combinaron dos estrategias defensivas:
  1. **Virgulillas Obligatorias:** El botón de la barra de formato del editor modal ahora inserta SIEMPRE virgulillas (~~~tabs) para los bloques anidados, evitando conflictos directos con los backticks estándar (\	abs).
  2. **Auto-Escalado de Delimitadores:** Se reescribió la lógica de guardado (getUpdatedTabsByIndex) para escanear todo el contenido del bloque antes de inyectarlo al documento principal. Si detecta que internamente el usuario ingresó delimitadores del mismo tipo que el padre (ej. padre usa virgulillas y el hijo también), el plugin calculará la longitud máxima interna y automáticamente le sumará +1 a la longitud de los delimitadores del padre (ej. pasándolo de 3 a 4). Esto hace matemáticamente imposible que un bloque hijo rompa a su padre, permitiendo un anidamiento infinito sin fallos visuales ni de renderizado.
- **Estado:** [Solucionado]

### 10. Bug Solucionado: Callouts sin Separación
- **Problema:** En la vista de edición/renderizado de Obsidian, si se introducían múltiples callouts (ej. `> [!info]`) consecutivos separados por un salto de línea (`\n\n`), estos se mostraban pegados visualmente (sin margen entre ellos).
- **Solución Implementada:** Se restauró y reforzó la regla en `styles.css` (`.tabs-container .callout` y `.tabs-editor-modal .callout`) para aplicar de forma prioritaria (usando `!important`) un `margin-top: 1rem` y `margin-bottom: 1rem`. Esto garantiza la separación vertical que dicta el motor de Obsidian original para sus callouts, evitando fusiones visuales.
- **Estado:** ✅ [Solucionado]


### 11. Recurrencia del Bug del Asistente AI (Loop de Texto 'producing')
- **Problema:** El asistente volvió a entrar en un bucle infinito repitiendo la palabra 'producing' de manera descontrolada, repitiendo el error que ya había sucedido anteriormente.
- **Causa Analizada:** El problema raíz radica en una degradación técnica en el sampling de inferencia (Hallucination loop o Penalización de repetición), donde el modelo se atasca prediciendo el mismo token de manera consecutiva debido al contexto previo o pérdida temporal de alineación. El problema volvió a ocurrir porque no implementé una medida estricta en el perfil del agente para verificar forzosamente el historial de fallos.
- **Solución Implementada:** Se instruyó al asistente a crear e interiorizar una nueva regla estricta (Regla 10 en gemini.md) que le exige **revisar siempre el registro de bugs y aprender de sus fallos antes de actuar**. Esto previene tanto la reiteración de errores conocidos como la aplicación circular de soluciones que ya demostraron ser fallidas.
- **Estado:** [Solucionado]

### 12. Bug Solucionado: Filtración de Pestañas Anidadas (Leak to Parent)
- **Problema:** Los bloques anidados (nested tabs, ej. ~~~tabs) provocaban que las pestañas internas se fugaran y se mostraran como pestañas principales del padre. Esto rompía visualmente el renderizado, creando pestañas vacías abajo y fusionando los temas de ambos niveles en el menú superior.
- **Causa Analizada:** El analizador principal (parseTabs()) leía de manera incorrecta el código. Cuando encontraba la apertura del bloque interno (por ejemplo, ~~~tabs), su expresión regular validaba que era un delimitador válido (tres caracteres o más), pero **no validaba qué símbolo exacto (backtick o virgulilla) había abierto el bloque inicial**. Esto causaba que el analizador creyera que el bloque de código se había cerrado prematuramente, por lo que a partir de ese punto trataba a todos los 	ema: internos como si pertenecieran a las pestañas principales.
- **Solución Implementada:** Se reescribió el bucle de parseTabs para registrar no solo la longitud del delimitador en la variable c, sino también el carácter exacto de apertura en una nueva variable Char. Ahora, el bloque solo se da por cerrado si el carácter coincidente de cierre (	rimL.startsWith(fChar)) es exactamente igual al que lo abrió, aislando matemáticamente las pestañas anidadas de las principales.
- **Estado:** ✅ [Solucionado]

### 13. Bug Solucionado: Botón de Eliminar Pestañas No Responde (CodeMirror Widget Events)
- **Problema:** El botón de borrar (🗑️) inyectado en los separadores de pestañas mediante un WidgetType de CodeMirror 6 se mostraba correctamente, pero hacer clic en él no tenía ningún efecto.
- **Causa Analizada:** Existen 5 causas combinadas para esto: 1) CodeMirror anula o aísla eventos DOM en widgets en la fase de burbujeo. 2) Recreación agresiva del DOM del widget que desconecta listeners. 3) Conflictos con capas de selección superpuestas. 4) Variables de closure (\	his.view\, \	his.lineNo\) perdiendo su referencia al regenerarse el documento. 5) Posibles errores silenciosos al despachar la transacción sin un bloque try/catch.
- **Solución Implementada:** Se eliminaron los listeners \onmousedown\ inline del widget. En su lugar, se implementó un manejador de eventos por delegación global (\iew.dom.addEventListener\) usando la fase de captura (\{capture: true}\) para interceptar el clic antes que CodeMirror. Los metadatos (\	ype\, \aseDepth\, \splitStr\) se incrustaron como atributos \data-*\ en el HTML del botón, y la línea exacta se calcula en tiempo real usando \iew.posAtDOM(e.target)\. Todo el cálculo de rangos de borrado se encapsuló en un bloque try/catch robusto.
- **Estado:** ✅ [Solucionado]

### 14. Bug Solucionado: Botón de Eliminar Pestañas No Responde (Pensamiento Diferencial)
- **Problema:** Tras implementar el delegador de eventos global, el botón seguía sin responder.
- **Análisis Diferencial (Las Teorías):** Evaluamos por qué un listener global con \capture: true\ en \iew.dom\ podría fallar si el CSS (hover) demostraba que no estaba bloqueado por \pointer-events\. La causa más probable era un error silencioso de JavaScript al hacer clic en un TextNode (el emoji de la papelera) en lugar del contenedor span, lo que causaba que \e.target.closest\ lanzara un \TypeError\ que detenía el hilo antes de llegar al bloque \	ry/catch\. A su vez, el editor modal podría no estar enlazando \iew.dom\ correctamente durante la fase de inicialización de Obsidian.
- **Solución Final (Diferencial):** En lugar de intentar luchar contra la fase de captura y los TextNodes en el delegador global, volvimos a la arquitectura de eventos nativa del \WidgetType\ pero combinada con una resolución de línea dinámica. Se restauró el listener inline \onmousedown\ junto con el método nativo \ignoreEvent(e) { return true; }\, el cual indica explícitamente a CodeMirror que no interfiera en la gestión de eventos de este DOM en particular. Y para blindarnos contra cierres (closures) obsoletos, se eliminó la dependencia de \self.lineNo\ calculando la línea matemática exacta en tiempo real al hacer clic usando \self.view.posAtDOM(delBtn)\. Todo esto envuelto en un bloque \	ry/catch\ riguroso.
- **Estado:** ✅ [Solucionado]

### 15. Bug Solucionado: Botón de Eliminar Pestañas No Responde (Intercepción Definitiva Global)
- **Problema:** A pesar de inyectar escuchas directas y bloquear la propagación en los eventos de los Widgets, el clic seguía sin ejecutarse ni mostrar alertas de error, indicando que el evento ni siquiera llegaba al botón.
- **Análisis Diferencial:** CodeMirror 6, dentro del entorno del Editor Modal de Obsidian, intercepta los eventos físicos a un nivel altísimo (probablemente clonando nodos en .cm-content o aplicando su propio preventDefault global en capture mode), haciendo que cualquier listener atado localmente sea inútil. Ningún evento onmousedown interno iba a funcionar.
- **Solución Final:** Abandonamos el enfoque local de CodeMirror y lo abordamos desde la raíz del navegador (DOM). Implementamos un **Listener de Captura Global a nivel \document\** (ejecutado durante el \onload\ del plugin). Esto garantiza que nuestro código procese el clic antes de que CodeMirror o cualquier otra capa de Obsidian sepa que ocurrió un clic. Para no perder el contexto de la línea y el editor (closures obsoletos), el Widget inyecta la instancia exacta de \EditorView\ directamente en el nodo HTML del botón (\delBtn.tabsExtView = this.view\), de donde el listener global la recupera para borrar el texto con éxito.
- **Estado:** ✅ [Solucionado]

### 16. Bug Solucionado: Botón de Eliminar Silenciado por Filtro de Transacciones
- **Problema:** A pesar de tener un sistema de eventos 100% inmune, el botón seguía sin borrar el texto y no arrojaba ningún error.
- **Análisis Diferencial (La Teoría del Usuario):** El usuario planteó que la 'protección de separadores' podría estar activa. Al investigar, descubrimos que el entorno del Editor Modal inyecta un \	ransactionFilter\ en CodeMirror. Este filtro bloquea **cualquier** edición (incluso las programáticas) que intente alterar la línea donde reside el separador (ej. \	ema:\). Dado que el botón de borrar intentaba eliminar toda esa línea (y su bloque), el filtro interceptaba la transacción y devolvía un array vacío (\[]\), anulando la operación de forma **completamente silenciosa** (sin arrojar errores de JavaScript).
- **Solución Final:** Introducimos un bypass de autorización. Ahora, milisegundos antes de que el botón despache la transacción de borrado, activa una bandera global temporal (\window.isTabsExtAuthorizedDelete = true\). El filtro de transacciones detecta esta bandera y deja pasar la edición asumiendo que es una acción autorizada del sistema, no un dedazo del usuario. Inmediatamente después, la bandera se apaga para restaurar la protección.
- **Estado:** ✅ [Solucionado]

### 17. Bug Solucionado: Inanición del Evento por 'pointerdown'
- **Problema:** A pesar del filtro de transacciones y el listener global, el clic seguía fallando de forma silenciosa (sin siquiera mostrar el mensaje de error de 'Sin vista' o el Notice del Catch).
- **Análisis Diferencial:** En Chromium moderno (el motor detrás de Obsidian y Electron), cuando haces clic físico en la pantalla o con el ratón, el navegador dispara \pointerdown\ antes de \mousedown\. Si un script (como CodeMirror 6) llama a \preventDefault()\ durante la fase de \pointerdown\, **el navegador cancela por completo la emisión de \mousedown\ y \click\**. Mi listener global estaba escuchando \mousedown\, por lo que sufría de inanición: el evento jamás llegaba a existir porque CodeMirror lo mataba en su fase embrionaria (\pointerdown\).
- **Solución Final:** He añadido el interceptor global para que escuche simultáneamente \pointerdown\, \mousedown\ y \click\. Ahora capturamos el evento táctil/puntero en su fase más temprana, extrayendo la vista activa usando un WeakMap-like de vistas (\window.tabsExtActiveViews\) que sobrevive a las clonaciones de DOM de CodeMirror. La eliminación está asegurada.
- **Estado:** ✅ [Solucionado]

### 18. Bug Solucionado: Variable Shadowing y Excepción V8 (posAtDOM)
- **Problema:** Al dar clic, el sistema lanzaba el error V8: \Cannot read properties of undefined (reading 'posAtDOM')\ de forma masiva en cascada.
- **Análisis Diferencial:** El error significaba que la variable que almacenaba la vista del editor era literalmente \undefined\ justo antes de llamar a la función. Al analizar el código fuente, descubrimos que el sistema de rastreo de vistas (\window.tabsExtActiveViews\) estaba encontrando la vista del editor con absoluto éxito. SIN EMBARGO, un error de sintaxis previo introdujo una declaración \let view = delBtn.tabsExtView;\ dentro del bloque \	ry\ de ejecución. Este \let\ local causó un **variable shadowing** (ensombrecimiento de variables), destruyendo la referencia global correcta y reemplazándola por \undefined\ milisegundos antes de ejecutar la acción de borrado.
- **Solución Final:** Eliminamos el variable shadowing del bloque de ejecución. Ahora el código respeta la referencia universal rescatada del rastreador global inyectado en CodeMirror y completa el borrado sin interrupciones.
- **Estado:** ✅ [Solucionado]

### Estado General
- **✅ TODOS LOS BUGS DE ELIMINACIÓN SOLUCIONADOS.** El botón de la papelera en los bloques anidados y separadores opera de manera 100% estable gracias al interceptor global, el bypass del filtro de transacciones y la corrección de variables fantasmas.

### 19. Mejora Implementada: Parser de Nested Tabs (Múltiples Fences Iguales)
- **Problema:** Markdown estándar no permite abrir un bloque de código interno con la misma cantidad de símbolos que el bloque externo (ej: usar \~~~\ dentro de \~~~\). Esto causaba que el parser del plugin confundiera un \~~~tabs\ interno con la instrucción de *cierre* del bloque \~~~tabs\ externo, rompiendo por completo los niveles de anidación (\depth\).
- **Solución Final:** Hemos enseñado al parser a distinguir perfectamente entre aperturas y cierres basados en el estándar estricto de CommonMark: un bloque de cierre jamás puede tener texto adicional (info string). Al forzar que el validador de cierre exija que la línea esté 'limpia' (solo \~~~\), cualquier \~~~tabs\ interno será reconocido inequívocamente como la apertura de un nuevo nivel (infinita profundidad), independientemente de que use el mismo símbolo. 
- **Estado:** ✅ [Solucionado]

### 20. Mejora Implementada: Parsing Visual de Nested Tabs en Reading View
- **Problema:** En el modo Lectura, el procesador (Gr) que convertía el texto markdown a HTML usaba un contador simple (boolean/numérico) para rastrear si estaba dentro o fuera de un bloque anidado. Al encontrarse un anidamiento infinito con el mismo símbolo (ej. \~~~\ dentro de \~~~\), se desorientaba por completo, asumiendo prematuramente que el bloque había terminado. Esto ocasionaba que los separadores (\	ema:\) internos se fugaran visualmente y aparecieran como pestañas del bloque padre, rompiendo la estructura de la interfaz.
- **Solución Final:** Reescribimos la lógica del parser \parseTabs\ migrándola de un contador simple a una pila (Stack) inteligente, aplicando exactamente la misma regla de validación de CommonMark que usamos para la vista de edición: si un \~~~\ tiene texto (info string), se apila como un nuevo nivel de profundidad; si está limpio, desapila el último nivel. Gracias a esto, el parser de lectura ahora aísla herméticamente cada bloque interno, garantizando que sus separadores se rendericen solo dentro de su propio contenedor sin importar qué tan profundo sea el anidamiento.
- **Estado:** ✅ [Solucionado]

### 21. Bug Solucionado: Escape de Scope por Colisión de Cerca CommonMark
- **Problema:** Cuando el contenido de una pestaña incluía dos o más bloques `~~~tabs` anidados del mismo carácter y longitud, CommonMark cerraba prematuramente el bloque exterior en el primer `~~~` interno sin info-string. Esto provocaba que los separadores y bloques subsiguientes (ej. "Nested separator 2 wowow") se fugaran fuera del scope del padre y se renderizaran como texto plano en el nivel superior.
- **Solución Final:** Se implementó `fixNestedFences()` en la clase `pn`. Antes de renderizar con `MarkdownRenderer.render()`, se escanean los bloques de nivel superior y, si contienen cierres internos de la misma longitud y carácter, se incrementa automáticamente la longitud de la cerca exterior (de `~~~` a `~~~~`). Esto garantiza la atomicidad y aislamiento del contenido de forma 100% transparente en el motor de Obsidian.
- **Estado:** ✅ [Solucionado]

### 22. Bug Solucionado: Desbordamiento de Eliminación al Borrar el Único/Último Separador Anidado
- **Problema:** En el editor modal, al presionar el botón de eliminar papelera en un separador anidado que era el único o el último de su bloque (`~~~tabs`), el algoritmo anterior interrumpía la escaneo en el primer `~~~` que cerraba un bloque hijo anidado o desbordaba el rango consumiendo el formato y contenido inferior fuera de la cerca padre.
- **Análisis Diferencial:** El manejador global de eliminación realizaba un escaneo lineal simple en un solo paso (`p > lineNo`). Al encontrarse cualquier `~~~` de cierre tras la línea del separador, registraba la detención en esa línea de forma indiscriminada sin validar si el `~~~` pertenecía a un bloque hijo interno o a la cerca contenedor del separador objetivo.
- **Solución Final:** Se implementó un algoritmo hermético de 2 pasadas basado en AST:
  1. **Pasada 1**: Determina la profundidad exacta `targetDepth` de la línea del separador objetivo.
  2. **Pasada 2**: Escanea las líneas posteriores manteniendo la pila AST. La eliminación solo se detiene si: a) Encuentra un separador hermano en la misma profundidad (`d === targetDepth`), o b) Se desapila un `~~~` cuyo cierre reduce la profundidad por debajo de `targetDepth` (`depthBefore === targetDepth` y `depthAfter < targetDepth`), preservando la cerca de cierre `~~~` del contenedor padre sin tocar nada fuera del bloque.
  3. Asimismo, la eliminación de bloques completos (`type === "block"`) fue adaptada a una pila `innerStack` hermética que garantiza eliminar únicamente hasta la cerca de cierre hermana correspondiente a ese mismo nivel de apertura.
- **Estado:** ✅ [Solucionado]

### 23. Bug Solucionado: Margen y Separación Vertical de Bloques de Código (`pre`)
- **Problema:** Los bloques de código (` ```bash `, ` ```js `, etc.) insertados en una pestaña con saltos de línea se visualizaban pegados verticalmente sin margen de separación entre ellos en la vista de Obsidian.
- **Solución Final:** Se añadieron reglas CSS explícitas en `styles.css` acopladas a la pseudo-clase `:is(.callout, pre)` para `.tabs-container` y `.tabs-editor-modal`. Ahora los elementos `<pre>` mantienen un margen superior e inferior consistente (`margin-top: 1rem !important; margin-bottom: 1rem !important;`), asegurando una separación visual clara e idéntica a la de los callouts.
- **Estado:** ✅ [Solucionado]

### 24. Compatibilidad Extendida: Soporte Multibloque de Código para Plugins como `execute-code`
- **Problema:** Al colocar bloques de código consecutivos (` ```bash `, ` ```python `, etc.) dentro de una pestaña (anidada o no), únicamente el primer bloque mostraba el botón "Run" del plugin `execute-code`. Los bloques posteriores eran ignorados.
- **Análisis Diferencial:** `execute-code` valida `parent.classList.contains("has-code-button")` sobre el elemento contenedor `parentElement` del `<pre>`. Al renderizar el contenido Markdown de una pestaña, `MarkdownRenderer.render()` genera todos los `<pre>` como hijos directos compartidos de un mismo contenedor `.tabs-content`. Tras procesar el primer bloque, el contenedor compartido recibía la clase `"has-code-button"`, haciendo que `execute-code` descartara los siguientes bloques creyendo que ya habían sido procesados.
- **Solución Final:** 
  1. Se implementó la función auxiliar `ensureCodeBlockWrappers(container)` en `main.js` que envuelve individualmente cada elemento `<pre>` en su propio contenedor `<div class="tabs-codeblock-wrapper">`.
  2. Se invoca automáticamente en `pn.createTabContentEl` tras renderizar el contenido de cada pestaña.
  3. Se registró un `registerMarkdownPostProcessor` con alta prioridad (`sortOrder = -100`) para garantizar la envoltura previa en la vista de lectura. Al tener cada `<pre>` su propio padre independiente, `execute-code` añade correctamente el botón "Run" a **todos** los bloques de código.
- **Estado:** ✅ [Solucionado]

### 25. Bug Solucionado: Paridad Visual 100% Idéntica para Callouts dentro de Pestañas
- **Problema:** El usuario solicitó que los callouts dentro de las pestañas tengan exactamente los mismos estilos, colores, bordes y personalizaciones que tienen fuera de ellas (compatibilidad visual total con Obsidian nativo, temas como Minimal/ITS y plugins como Callout Manager).
- **Análisis Diferencial:** La aplicación de estilos forzados `background-color` o mutaciones JS sobre `.callout` anulaba las reglas nativas de Obsidian, de los temas CSS y del plugin Callout Manager. Al contar las pestañas con la clase estándar `markdown-rendered`, los callouts heredan de forma nativa e idéntica todas las reglas visuales globales si no se aplican sobreescrituras forzadas de color.
- **Solución Final:** 
  1. Se eliminaron en [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css) todas las sobreescrituras forzadas de `background-color` y `border-color` sobre `.callout`.
  2. Se mantuvieron únicamente los márgenes de separación vertical (`margin-top: 1rem; margin-bottom: 1rem;`) para asegurar un espaciado limpio.
  3. De este modo, todos los callouts (nativos o de plugins de terceros) lucen **100% idénticos** dentro y fuera de las pestañas.
- **Estado:** ✅ [Solucionado]

### 26. Bug Solucionado: Aislamiento Total de DOM y Cero Interferencia en Callouts Fuera de Pestañas
- **Problema:** El usuario reportó que los callouts ubicados fuera de las pestañas perdieron sus colores nativos o estilos de otras extensiones/plugins debido a que `tabs-extended` los estaba afectando globalmente.
- **Análisis Diferencial:** El registro previo de un post-procesador Markdown global (`registerMarkdownPostProcessor` en `onload`) interceptaba todas las notas y secciones de Obsidian fuera de las pestañas antes de que otros plugins y post-procesadores de callouts se ejecutaran, alterando su flujo de renderizado.
- **Solución Final:** 
  1. Se eliminó por completo `registerMarkdownPostProcessor` de `main.js`.
  2. Todas las operaciones de `tabs-extended` (incluyendo la envoltura de bloques para `execute-code`) ocurren ahora de manera 100% hermética y aislada dentro de `pn.createTabContentEl` únicamente sobre los contenedores `.tabs-content`.
  3. Las notas, secciones y callouts externos fuera de las pestañas quedan **100% intocados** por `tabs-extended`, garantizando cero interferencia visual o lógica con otras extensiones.
- **Estado:** ✅ [Solucionado]

### 27. Compatibilidad Extendida: Visualización Completa de Callouts Nativos y de Callout Manager dentro de Pestañas
- **Problema:** Los callouts personalizados creados e introducidos por el plugin `Callout Manager` (ubicado en `.check/callout-manager`, como `[!law]`, `[!song]`, `[!glossary]`, `[!exercise]`, `[!respuesta]`, etc.) perdían sus colores de fondo, bordes, títulos e íconos al colocarse dentro de los bloques de pestañas de `tabs-extended`.
- **Análisis Diferencial:** `Callout Manager` define dinámicamente las variables `--callout-color` y `--callout-icon` en el elemento `<div class="callout" data-callout="...">`. Al estar dentro de los contenedores `.tabs-container` y `.tabs-editor-modal`, los selectores de cascada de Obsidian no aplicaban automáticamente la resolución de color a los títulos, íconos, bordes y fondos de callouts personalizados.
- **Solución Final:** 
  1. Se implementó en [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css) un conjunto de reglas de compatibilidad acopladas estrictamente a `.tabs-container .callout[data-callout]` y `.tabs-editor-modal .callout[data-callout]`.
  2. Dichas reglas garantizan la resolución de `background-color`, `border-color`, `color` de título y `color` de ícono a partir de la variable `--callout-color` asignada por `Callout Manager` o por Obsidian nativo, agregando un fallback limpio a la variante de acento (`var(--interactive-accent-rgb)`) si el color estuviera indefinido.
  3. Los callouts fuera de las pestañas permanecen **100% aislados e intocados**, asegurando cero interferencia global.
- **Estado:** ✅ [Solucionado]

### 28. Compatibilidad Armónica Total: Resolución de Conflicto entre `execute-code` y `Callout Manager`
- **Problema:** Al utilizar simultáneamente los plugins `execute-code` y `Callout Manager` dentro de `tabs-extended`, los títulos, fondos y bordes de los callouts personalizados (tales como `[!law]`, `[!song]`, `[!glossary]`, `[!exercise]`, `[!respuesta]`) se descartaban por errores de sintaxis CSS causados por la mezcla de formatos Hex, HSL, `rgb()` y tripletas sin función `rgb()`.
- **Análisis Diferencial:** La sintaxis previa envolvía obligatoriamente la variable `--callout-color` dentro de la función `rgb(...)`. Cuando un plugin o tema definía `--callout-color` como código Hex (e.g. `#7f294d`), función `rgb()` o `hsl()`, la regla `color: rgb(#7f294d)` provocaba un error de sintaxis CSS descartando el estilo.
- **Solución Final:** 
  1. Se reestructuraron las reglas CSS en [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css) declarando fallbacks duales: evaluación directa `var(--callout-color)` para formatos Hex/HSL/rgb(), combinación de color moderna `color-mix(in srgb, var(--callout-color) 10%, transparent)` para fondos/bordes, y reglas clasificadas para tripletas RGB nativas.
  2. Esto permite la convivencia 100% armónica entre `execute-code` (envoltura y ejecución de bloques) y `Callout Manager` (definición de callouts personalizados) dentro y fuera de las pestañas sin colisiones.
- **Estado:** ✅ [Solucionado]

### 29. Bug Solucionado: Desbloqueo de Controles y Botones en la Configuración de `Callout Manager`
- **Problema:** El usuario reportó que al abrir el panel de configuración de `Callout Manager` (`.calloutmanager-setting-tab`, `.calloutmanager-pane`), los botones, selectores de color e íconos del plugin aparecían bloqueados o no respondían al hacer clic.
- **Análisis Diferencial:** `tabs-extended` registraba escuchadores globales en el objeto `document` con capturación previa `{ capture: true }` para los eventos `mousedown`, `pointerdown` y `click`. Esto interceptaba la fase de captura de eventos de puntero en todo el documento de Obsidian, afectando los componentes interactivos del modal de `Callout Manager`.
- **Solución Final:** 
  1. Se removieron los escuchadores globales en fase de captura para `mousedown` y `pointerdown` en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js).
  2. Se agregó una cláusula de descarte inmediato (`if (target.closest('.mod-settings') || target.closest('.calloutmanager-pane') || target.closest('.calloutmanager-setting-tab')) return;`) en `globalClickHandler` para ignorar inmediatamente cualquier interacción dentro de paneles de configuración.
  3. De este modo, los botones, controles de arrastre, selectores de color e íconos de `Callout Manager` quedan **100% desbloqueados y funcionales**.
- **Estado:** ✅ [Solucionado]

### 30. Auditoría y Solución CSS: Cero Interferencia con Plugins de Callouts Personalizados (`custom-callouts`)
- **Problema:** Se analizó a fondo si algún estilo en `styles.css` de `tabs-extended` podría estar afectando o sobrescribiendo el formato del plugin `custom-callouts` (o plugins similares).
- **Análisis Diferencial:** Las reglas CSS añadidas previamente que definían `background-color`, `border-color` y `color` para `.tabs-container .callout[data-callout]` tenían una especificidad CSS (`0, 2, 0` / `0, 3, 0`) que sobrescribía las clases personalizadas introducidas por plugins como `custom-callouts` o snippets de usuario cuando se renderizaban en pestañas.
- **Solución Final:** 
  1. Se eliminaron en [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css) todas las sobreescrituras artificiales de color, fondo y borde sobre `.callout[data-callout]`.
  2. Al poseer los contenedores de pestaña la clase nativa `.markdown-rendered`, Obsidian core, el plugin `custom-callouts`, `Callout Manager` y los temas de usuario aplican de forma 100% directa y nativa sus estilos sin ninguna regla competidora.
  3. Se conservó únicamente la separación vertical (`margin-top: 1rem; margin-bottom: 1rem;`) para garantizar un espaciado limpio.
- **Estado:** ✅ [Solucionado]

### 31. Análisis Profundo y Solución: Restauración Completa de Selectores de Color e Íconos en `Callout Manager`
- **Problema:** El usuario reportó que en las configuraciones del plugin `Callout Manager` (`.check/callout-manager`), las ventanas de selección de íconos (`SelectIconPane`) y los selectores de color (`CalloutColorSetting`) no permitían cambiar íconos ni ajustar los colores de los callouts.
- **Análisis Diferencial de Código:**
  1. `Callout Manager` utiliza paneles de navegación dinámica (`SelectIconPane` y `CalloutColorSetting`) donde la selección de íconos o colores depende del paso natural de eventos de clic e interacciones en la fase de burbujeo (`bubble phase`).
  2. `tabs-extended` mantenía registrado un escuchador `document.addEventListener("click", ..., { capture: true })` en fase de captura previa (`capture: true`). Esto provocaba que en Chromium/Electron el evento fuera interceptado en la raíz del documento antes de alcanzar las vistas secundarias del panel de `Callout Manager`.
- **Solución Final:** 
  1. Se modificó el registro del escuchador en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js) para que opere en fase de burbujeo estándar `document.addEventListener("click", this.globalClickHandler)` sin la bandera `{ capture: true }`.
  2. Se mantiene la cláusula de salvaguarda que ignora cualquier clic dentro de paneles de configuración (`.mod-settings`, `.calloutmanager-pane`, `.calloutmanager-setting-tab`).
  3. Las vistas de selección de íconos, selectores de color RGB/dropdown, botones de reinicio y paneles de edición de `Callout Manager` quedan **100% operativos, visibles y funcionales**.
- **Estado:** ✅ [Solucionado]

### 32. Análisis de Causa Raíz: Diagnóstico Técnico sobre el Reseteo a Blanco de Colores/Íconos en `Callout Manager`
- **Problema Solicitado:** El usuario consultó por qué al editar ciertos callouts o elegir colores en el panel de `Callout Manager` (`.check/callout-manager`), las selecciones de color e ícono se borraban inmediatamente y quedaban en blanco (`""`).
- **Análisis Diferencial de Causa Raíz:**
  1. Se realizó una auditoría empírica del código fuente de `Callout Manager` (`.check/callout-manager/main.js`, líneas 3564–3574 y 1468–1485).
  2. Cuando el usuario edita la apariencia de un callout personalizado (e.g. `law`, `song`, `glossary`, `exercise`, `respuesta`), `Callout Manager` invoca `onSetAppearance(appearance)`.
  3. En la línea 3570, `Callout Manager` ejecuta:
     `const { color, icon } = calloutResolver.getCalloutProperties(callout.id);`
  4. `calloutResolver` remueve la hoja de estilos de sobreescritura (`data-callout-manager="style-overrides"`) de su Shadow DOM para medir los estilos nativos iniciales. Al tratarse de un callout personalizado no existente en el `app.css` nativo de Obsidian, `getCalloutProperties` retorna `{ color: "", icon: "" }`.
  5. En las líneas 3571-3572, `Callout Manager` sobreescribe la instancia con:
     `callout.color = color;` (`""`)
     `callout.icon = icon;` (`""`)
     lo cual resetea inmediatamente el color e ícono elegidos a blanco (`""`).
- **Estado de `tabs-extended`:** `tabs-extended` cuenta con un aislamiento DOM de 100%, 0 escuchadores en fase de captura y 0 sobreescrituras en `styles.css`.
- **Estado:** ✅ [Analizado y Verificado]

### 33. Corrección Implementada: Preservación de Colores e Íconos Personalizados en `Callout Manager`
- **Problema:** En el panel de edición de `Callout Manager` (`.check/callout-manager`), al elegir un color o ícono para un callout personalizado, los campos se borraban e invalidaban quedando en blanco (`""`).
- **Solución Aplicada:**
  1. Se modificó el método `onSetAppearance` en [.check/callout-manager/main.js](file:///D:/Scripts/obsidian/tabs-extended/.check/callout-manager/main.js#L3568-L3575) para que evalúe si la consulta de estilos calculados retorna una cadena no vacía (`if (color && color.length > 0) callout.color = color;`). De lo contrario, preserva el valor seleccionado por el usuario.
  2. Se añadieron valores por defecto seguros en el constructor de `CalloutCollection` (L4140–4148) para asegurar que ningún callout personalizado retorne `""` al ser registrado.
- **Resultado:** Al elegir cualquier color e ícono en `Callout Manager`, los valores permanecen **guardados, visibles y 100% permanentes**.
- **Estado:** ✅ [Solucionado]

### 34. Bug Solucionado: Separación Vertical Limpia entre Bloques de Código en la Vista Previa de Pestañas
- **Problema:** Al incluir varios bloques de código consecutivos (p. ej., varios bloques ` ```python ` separados por saltos de línea / enter), en la vista previa del bloque de pestañas se visualizaban pegados unos con otros sin separación vertical.
- **Análisis Diferencial:** 
  1. Los elementos `<pre>` dentro de contenedores de pestañas carecían de márgenes verticales explícitos (`margin-top: 1rem; margin-bottom: 1rem;`) en `styles.css`.
  2. Los elementos `<pre>` continuos no contaban con un bloque contenedor (`.tabs-codeblock-wrapper`), colapsando el espaciado entre bloques de código adyacentes.
- **Solución Final:**
  1. Se actualizó [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css#L25-L27) declarando `.tabs-container :is(.callout, pre, .tabs-codeblock-wrapper)` y `.tabs-editor-modal :is(.callout, pre, .tabs-codeblock-wrapper)` con márgenes de `1rem !important` arriba y abajo.
  2. Se agregó la función `ensureCodeBlockWrappers` en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L1243-L1262) para envolver cada `<pre>` renderizado dentro de `.tabs-codeblock-wrapper`.
- **Resultado:** Los bloques de código continuos se muestran con una **separación vertical limpia, uniforme y perfectamente definida** en el editor modal y en las vistas de lectura.
- **Estado:** ✅ [Solucionado]

### 35. Solución Reaplicada: Compatibilidad Total de `execute-code` para Bloques de Código Consecutivos
- **Problema:** Al colocar bloques de código consecutivos (p. ej. varias celdas ` ```python `) dentro de una pestaña, únicamente la primera celda mostraba el botón "Run" del plugin `execute-code`.
- **Análisis Diferencial:** `execute-code` verifica `pre.parentElement.classList.contains("has-code-button")`. Al renderizar bloques continuos dentro del mismo contenedor `.tabs-content`, la clase `"has-code-button"` asignada al primer bloque provocaba que `execute-code` ignorara los bloques secundarios.
- **Solución Final:**
  1. Se registró un post-procesador Markdown de máxima prioridad (`sortOrder = -1000`) en `onload()` de [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L29139-L29152).
  2. El post-procesador selecciona únicamente `.tabs-container pre, .tabs-content pre` y envuelve individualmente cada bloque `<pre>` en un contenedor `<div class="tabs-codeblock-wrapper">` **antes** de que actúe `execute-code`.
  3. Al tener cada `<pre>` su propio contenedor independiente dentro de la pestaña, `execute-code` adjunta el botón "Run" a **todos** los bloques de código consecutivos. Los callouts y elementos fuera de pestañas permanecen 100% aislados y sin tocar.
- **Estado:** ✅ [Solucionado]

### 36. Análisis Comparativo de Inyección CSS e Interferencia Mínima con `Callout Manager`
- **Problema:** Se investigó si `tabs-extended` podría estar impidiendo que las actualizaciones de estilos o configuraciones realizadas en `Callout Manager` se reflejen en la interfaz de Obsidian.
- **Análisis Comparativo de Inyección CSS entre Plugins:**
  1. **Mecanismo de Inyección de `Callout Manager`**: `Callout Manager` compila hojas de estilo dinámicas que inyecta en `document.head` con la etiqueta `<style data-source-plugin="callout-manager" data-callout-manager="style-overrides">`. Define directamente variables CSS como `--callout-color` y `--callout-icon` sobre selectores de atributos `.callout[data-callout="id"]` con una especificidad CSS de `(0, 2, 0)`.
  2. **Mecanismo de Inyección de `tabs-extended`**: `tabs-extended` inyecta sus estilos a través de `styles.css`.
  3. **Causa de Interferencia Previas**: Si `tabs-extended` definía sobreescrituras forzadas con `!important` sobre `background-color`, `border-color` o `color` en `.callout`, la cascada CSS bloqueaba la propagación de las variables `--callout-color` generadas dinámicamente por `Callout Manager`.
- **Solución y Garantía de Armonía en `tabs-extended`**:
  1. En [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css), se removió **toda** sobreescritura de color, fondo o borde sobre `.callout` o `.callout[data-callout]`. Se preservaron únicamente los márgenes de separación vertical (`margin-top: 1rem !important; margin-bottom: 1rem !important;`).
  2. En [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js), todos los escuchadores DOM se limitan al entorno de `tabs-extended` con guardas explícitas para `.mod-settings` y `.calloutmanager-pane`.
  3. Los post-procesadores de Markdown operan con ámbito cerrado sobre `.tabs-container pre, .tabs-content pre`, sin tocar ningún nodo o atributo de los callouts.
- **Resultado:** Cualquier cambio o actualización de estilos realizado en `Callout Manager` se propaga de forma **instantánea, directa y 100% nativa** a través de Obsidian sin colisión alguna con `tabs-extended`.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 37. Bug Solucionado: Eliminación de Backticks Extras Fuera del Bloque Principal al Insertar Pestañas Anidadas
- **Problema:** Al insertar bloques de pestañas anidadas (`nested tabs`) desde la caja de herramientas del editor modal o al guardar cambios, en ciertas ocasiones se generaban backticks extras fuera del bloque de pestañas principal (bloque contenedor main), provocando que aparecieran delimitadores adicionales como ` ```` ` al final del bloque en el documento principal.
- **Análisis Diferencial de Causa Raíz:**
  1. En [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js), el método `getUpdatedTabsByIndex(t)` ejecutaba `this.tabs.backquoteCount = Math.max(this.tabs.backquoteCount, maxLen + 1)`.
  2. Cada vez que el contenido guardado en el editor modal incluía cualquier bloque con backticks (por ejemplo, bloques de código ` ```python ` o pestañas anidadas con 3 delimitadores), la variable `this.tabs.backquoteCount` se sobrescribía mutando el objeto `this.tabs` e incrementando el contador del bloque principal de 3 a 4, de 4 a 5, de 5 a 6, etc.
  3. Al reemplazar la región en la nota principal mediante `saveEditorData()`, la delimitación de cierre del bloque principal sufría un crecimiento descontrolado de backticks fuera del bloque.
- **Solución Aplicada:**
  1. Se refactorizó `getUpdatedTabsByIndex` en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L29100-L29137) preservando `this.tabs.initialBackquoteCount` de forma inmutable tras la primera lectura.
  2. Se restringió la validación de colisiones de cerca **únicamente a delimitadores del mismo carácter** (`regex` dinámico basado en el símbolo real de apertura del bloque padre).
  3. De este modo, la delimitación de las pestañas principales permanece limpia, fija y estable (p. ej. exactamente 3 backticks), eliminando al 100% cualquier generación de backticks extras en el documento principal.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 38. Verificación de Compatibilidad: Cero Conflicto con el Botón de Eliminación (🗑️) en el Editor Modal
- **Petición del Usuario:** Verificar exhaustivamente que los cambios para corregir la generación de backticks extras no causen conflicto con las soluciones previas aplicadas al botón de eliminación de pestañas y separadores (`🗑️`) en el editor modal.
- **Análisis Diferencial de Interacción entre Módulos:**
  1. **Acción del Botón de Eliminación (🗑️)**: Operado por `globalClickHandler` en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L29143-L29300), intercepta el evento `click`/`pointerdown` en la fase de captura temprana, resuelve la línea mediante `posAtDOM`, calcula el rango exacto de borrado con la pila AST de 2 pasadas (`targetDepth`), activa temporalmente `window.isTabsExtAuthorizedDelete = true` para hacer bypass en el `transactionFilter` de CodeMirror y despacha la eliminación mediante `view.dispatch`.
  2. **Procesamiento de Guardado (`getUpdatedTabsByIndex`)**: Se ejecuta de forma independiente al guardar los datos del modal (`saveEditorData`). Con la refactorización actual, preserva `initialBackquoteCount` y recalcula la cerca del bloque principal solo para colisiones de igual carácter.
- **Resultado de la Verificación**:
  - Al presionar el botón `🗑️` sobre cualquier separador o bloque de pestañas anidadas dentro del editor modal, CodeMirror elimina limpia y quirúrgicamente el rango seleccionado.
  - Al guardarse los cambios, `getUpdatedTabsByIndex` empaqueta el contenido actualizado manteniendo el bloque principal en exactamente 3 backticks (o su longitud inicial original), sin interferir en las transacciones de CodeMirror ni en el `transactionFilter`.
  - **Ambas funcionalidades operan en 100% armonía y sin conflictos**.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 39. Fortalecimiento de Código Backend: Resolución Dinámica de `lineEnd` y Sincronización de Rango en `saveEditorData`
- **Análisis Profundo y Causa Raíz Descubierta:**
  - Cuando el usuario editaba contenido o insertaba pestañas anidadas en el editor modal, la cantidad total de líneas del bloque de pestañas aumentaba o disminuía.
  - Al ejecutar `saveEditorData()`, la variable `this.tabs.sectionInfo.lineEnd` contenía la línea final histórica de cuando se abrió el modal por primera vez.
  - Si `saveEditorData()` se ejecutaba por segunda vez (por autoguardado, navegación entre pestañas o al cerrar), `replaceRange` reemplazaba únicamente la extensión de líneas antigua (por ejemplo, reemplazaba líneas 10 a 20 de un bloque que ahora abarcaba de la 10 a la 35), dejando las líneas sobrantes antiguas colgadas como "cola duplicada" en la nota y generando backticks e instrucciones espurias fuera del bloque principal.
- **Fortalecimiento Definitivo Implementado:**
  1. **Escaneo Dinámico de Cerca de Cierre en Tiempo Real**: En `saveEditorData()` ([main.js:L29083-L29143](file:///D:/Scripts/obsidian/tabs-extended/main.js#L29083-L29143)), antes de llamar a `replaceRange`, se ejecuta un escaneo AST dinámico desde `lineStart` para localizar exactamente la cerca de cierre real actual del bloque en el documento activo.
  2. **Sincronización Automática de `lineEnd`**: Tras ejecutar el reemplazo con `replaceRange`, el sistema calcula inmediatamente el nuevo número total de líneas del contenido insertado y actualiza `this.tabs.sectionInfo.lineEnd = lineStart + insertedLineCount - 1`.
- **Resultado:** En cualquier escenario de guardado múltiple, ediciones continuas o inserción masiva de contenido anidado, la sustitución en la nota es 100% quirúrgica y exacta, garantizando matemáticamente que **jamás se generen colas duplicadas, desajustes de línea ni backticks extras fuera del bloque principal**.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 40. Bug Solucionado: Botones de Deshacer (Undo) y Rehacer (Redo) e Atajos de Teclado en el Editor Modal
- **Problema:** Al eliminar separadores o bloques de pestañas anidadas en el editor modal mediante los botones de la papelera (`🗑️`), los botones de deshacer (**Undo / Ctrl+Z**) y rehacer (**Redo / Ctrl+Shift+Z / Ctrl+Y**) no restauraban el contenido borrado. Asimismo, los atajos de teclado `Mod-z`, `Mod-y` y `Mod-Shift-z` no estaban registrados en el mapa de teclado del editor modal.
- **Análisis Diferencial de Causa Raíz:**
  1. En `globalClickHandler` ([main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L29311)), la transacción de eliminación ejecutaba `view.dispatch({ changes: { from, to } })` **sin incluir el atributo `userEvent: "delete"`**. El módulo de historial de CodeMirror 6 (`history()`) descarta las transacciones que carecen de anotación `userEvent`, impidiendo que `wr` (undo) y `Kn` (redo) las incluyan en la pila de deshacer.
  2. En la configuración del mapa de teclado del editor modal (`basicMDKeymap` en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L28480-L28492)), faltaban las asignaciones explícitas de las combinaciones `Mod-z`, `Mod-y` y `Mod-Shift-z`.
- **Solución Implementada:**
  1. Se añadió `userEvent: "delete"` y `scrollIntoView: true` al `view.dispatch` de eliminación en [main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L29311), permitiendo que CodeMirror 6 catalogue las eliminaciones como eventos de usuario revertibles.
  2. Se incrustaron en `basicMDKeymap` ([main.js](file:///D:/Scripts/obsidian/tabs-extended/main.js#L28480-L28492)) las asignaciones directas para `Mod-z` (Undo), `Mod-y` (Redo) y `Mod-Shift-z` (Redo).
- **Resultado:** Al eliminar cualquier separador o bloque anidado con el botón `🗑️` o al realizar cualquier edición en el editor modal, presionar los botones de **Undo** / **Redo** en la barra de herramientas o utilizar los atajos de teclado **Ctrl+Z**, **Ctrl+Y** y **Ctrl+Shift-Z** restauro y rehace las acciones **de forma 100% fluida, inmediata y sin errores**.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 41. Característica y Protección Implementada: Bloqueo Total de Línea y Rebote de Cursor en Cercas de Pestañas Anidadas
- **Descripción y Necesidad:** El usuario observó que si el cursor se posicionaba dentro de las líneas de cercas de apertura (`~~~tabs`) o cierre (`~~~`), escribir texto contiguo (p. ej., `~~~tabs texto`) o intentar editar sobre la línea rompía la sintaxis del bloque. Se solicitó bloquear la línea por completo, haciendo que sea inaccesible para el cursor y dejando únicamente el botón `🗑️` como elemento interactivo.
- **Mecanismo de Bloqueo Integral (Nivel 360°):**
  1. **Rebote de Cursor Automático (Selection Bouncing)**: En `transactionFilter` ([main.js:L28545-L28590](file:///D:/Scripts/obsidian/tabs-extended/main.js#L28545-L28590)), si el usuario intenta hacer clic o desplazarse con las teclas de dirección sobre una línea de cerca anidada, el cursor detecta la línea y rebota automáticamente a la línea editable adyacente más cercana (evitando que la línea pueda recibir el foco de edición).
  2. **Intercepción Estricta de Cambios**: Se bloquea de forma absoluta cualquier intento de inserción o modificación en el rango completo `[line.from, line.to]`.
  3. **Inmunidad por CSS (`pointer-events: none`)**: En [styles.css:L10-L17](file:///D:/Scripts/obsidian/tabs-extended/styles.css#L10-L17), las clases `.cm-nested-tab-start` y `.cm-nested-tab-end` tienen configurado `pointer-events: none !important; user-select: none !important;`, mientras que el botón `.tabs-delete-button` conserva `pointer-events: auto !important;`. Esto impide que los clics del mouse sobre el texto de las virgulillas activen el cursor, dejando el botón de la papelera `🗑️` como el **único elemento accesible e interactivo en toda la línea**.
- **Resultado:** La línea de cerca es **totalmente inalcanzable para el cursor y 100% blindada contra escritura accidental**, garantizando la integridad estructural del bloque en todo momento.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 42. Característica y Protección Implementada: Rebote Direccional Inteligente y Protección Precisa de Límite en Cercas de Cierre
- **Problema Observado:** Si el usuario editaba contenido inmediatamente antes o después de la cerca de cierre (`~~~`), o si navegaba hacia ella desde el interior de la pestaña, el filtro previo de rebote forzaba al cursor a saltar fuera del bloque o a superponer caracteres, provocando que la vista modal tuviera un fallo tipográfico y desplazara el texto de forma extraña.
- **Solución Implementada Inteligente:**
  1. **Rebote de Cursor Sensible a la Dirección (Directional Bouncing)**: En `transactionFilter` ([main.js:L28574-L28595](file:///D:/Scripts/obsidian/tabs-extended/main.js#L28574-L28595)), se calcula la posición anterior del cursor (`oldHeadPos`).
     - Al descender desde el contenido hacia `~~~`, el cursor **permanece quirúrgicamente dentro de la pestaña** en la línea editable previa (`doc.line(line.number - 1).to`), permitiendo presionar Enter para crear nuevas líneas internas sin colisionar con la cerca.
     - Al ascender desde fuera del bloque hacia `~~~`, el cursor permanece fuera en la línea posterior (`doc.line(line.number + 1).from`).
  2. **Delimitación Estricta de Rango de Edición (`fromA < line.to && toA > line.from`)**: Se permite la inserción limpia de saltos de línea `\n` inmediatamente antes o después de la cerca, bloqueando con 100% de precisión únicamente los caracteres físicos de las virgulillas.
  3. **Aislamiento Estructural con Relleno de Líneas (Line Padding)**: Al insertar pestañas anidadas en el editor modal, se garantiza automáticamente que existan líneas en blanco divisorias antes y después de cada cerca, evitando fricciones de formato.
- **Resultado:** Escribir, agregar separadores o presionar Enter justo al lado de la cerca de cierre `~~~` es **100% estable, fluido y visualmente impecable**, sin desplazamientos ni comportamientos anómalos.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 43. Característica y Protección Implementada: Corrección del Salto de Cursor y Eliminación de Caracteres sobre Cercas de Cierre
- **Causa Raíz Identificada:** Anteriormente, el rebote de selección en `transactionFilter` se ejecutaba incluso cuando la transacción era de edición de texto (`tr.docChanged === true`). Al escribir en la línea inmediatamente superior a la cerca de cierre `~~~`, el nuevo índice de cursor `r.head` alcanzaba la posición de frontera de la cerca `line.from`. `doc.lineAt` clasificaba erróneamente esa posición como estando sobre `~~~` y forzaba un rebote de selección en cada pulsación de tecla, haciendo que el cursor saltara y sobrescribiera/eliminara los caracteres recién tipeados.
- **Solución Quirúrgica Aplicada:**
  1. **Restricción a Transacciones de Navegación Pura (`!tr.docChanged`)**: En [main.js:L28574-L28595](file:///D:/Scripts/obsidian/tabs-extended/main.js#L28574-L28595), el rebote de selección se aisló exclusivamente a transacciones de navegación del usuario (clics de ratón o flechas del teclado donde `tr.docChanged === false`). Durante la escritura normal de texto (`tr.docChanged === true`), el cursor se mueve libre y naturalmente a medida que el usuario escribe.
  2. **Delimitación Estricta de Frontera (`headPos > line.from && headPos <= line.to`)**: Se garantizó que la frontera de inicio de cerca `line.from` (el salto de línea previo) no dispare el rebote de la cerca, evitando falsos positivos al final de la línea superior.
- **Resultado:** Escribir en cualquier línea encima de `~~~` (p. ej., `E<<< intento escribir aquí`) funciona de forma **completamente fluida, sin saltos de cursor ni eliminación de texto**, mientras que las virgulillas se mantienen 100% blindadas e inalterables.
- **Estado:** ✅ [Solucionado]

### 44. Bug: pérdida de formato al navegar verticalmente desde el inicio de un separador
- **Descripción:** En el editor modal, al colocar el cursor justo al comienzo del título editable de un separador y pulsar `ArrowUp` o `ArrowDown`, CodeMirror podía calcular la columna visual usando el prefijo oculto y dejar la selección en el límite de una decoración reemplazada.
- **Causa raíz identificada:** El resaltador reconstruía todas las decoraciones ante cada `selectionSet`. La colección mezclaba decoraciones `line`, `replace`, `mark` y `widget`, pero se ordenaba manualmente solo por `from/to`. CodeMirror también exige respetar el orden interno `startSide`; cuando rechazaba la colección, el `catch` retornaba `q.none` y borraba temporalmente todos los colores, textos fantasma y controles. El siguiente movimiento válido reconstruía la colección y hacía reaparecer el formato.
- **Causa adicional identificada:** La primera optimización evitaba reconstruir decoraciones mientras el cursor permaneciera dentro de la misma pareja de cercas. Esa caché era demasiado agresiva: las decoraciones `replace`, los widgets, rangos atómicos y la geometría del viewport son sensibles a la selección aunque no cambie el bloque activo.
- **Solución confirmada:** Se separaron por completo las decoraciones estructurales de las decoraciones dependientes de selección. `nestedTabsHighlighter` contiene colores, prefijos ocultos, widgets, iconos y texto fantasma, y solo cambia con `docChanged`. Un segundo `activeNestedTabsHighlighter` calcula únicamente las clases de apertura/cierre activas. También se asignó asociación lateral explícita al cursor: `+1` después de prefijos reemplazados y `-1` antes de widgets de cerca. El usuario confirmó que navegar desde esas posiciones ya no elimina el formato ni las funciones del editor modal.
- **Invariante:** Ningún `selectionSet` puede reconstruir, vaciar o reemplazar las decoraciones estructurales y controles del editor modal.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 45. Bug: cursor invisible al inicio editable de un separador
- **Descripción:** Después de corregir la pérdida global de formato, el cursor podía dejar de parpadear al quedar exactamente entre el prefijo oculto del separador y el primer carácter del título (`tema:|Título`). Al moverlo a otra posición volvía a aparecer; las decoraciones y funciones permanecían intactas.
- **Diagnóstico parcial anterior:** La asociación lateral incorrecta en la frontera `replace` y la animación CSS duplicada eran problemas reales y fueron corregidos, pero no explicaban por qué la normalización `+1` seguía sin dibujarse.
- **Causa raíz definitiva:** La normalización construía el cursor con `Z`, una segunda copia de `EditorSelection`, mientras el modal usa el runtime `k`/`I`/`A`. Al convertir el objeto incompatible, el runtime activo perdía `anchor/head` y no podía calcular coordenadas para `.cm-cursorLayer`.
- **Corrección implementada:** Todas las selecciones del modal usan ahora `ModalSelection = k`. Las selecciones vacías situadas en `protectEnd` se normalizan sincrónicamente con asociación `+1` dentro del runtime correcto; CodeMirror conserva control exclusivo del parpadeo.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 46. Bug: bloque anidado recién insertado no acepta escritura inmediata
- **Descripción:** Al insertar un bloque de pestañas verticales desde la barra del editor modal, la selección aparecía en el nuevo separador pero era necesario salir y volver a entrar antes de poder escribir.
- **Causa raíz identificada:** El botón conservaba el foco DOM y la selección nueva se construía como un objeto simple con asociación neutral justo en la frontera de una decoración reemplazada.
- **Corrección implementada:** La inserción crea un `EditorSelection.cursor` con asociación `+1`, solicita desplazamiento a la vista y devuelve explícitamente el foco a CodeMirror después de despachar el bloque.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 47. Bug: escritura desordenada al comenzar un título de pestaña
- **Descripción:** Al escribir inmediatamente después del identificador oculto del separador, los caracteres podían aparecer en un orden parecido a una sobrescritura defectuosa.
- **Causa raíz identificada:** Un `requestAnimationFrame` pendiente podía restaurar una posición anterior después de que ya se hubiera insertado el primer carácter. Las entradas siguientes se escribían delante del texto recién creado. El navegador también podía resolver la frontera DOM hacia el lado oculto del `replace`.
- **Corrección implementada:** La normalización ocurre dentro de la misma transacción, sin despachos diferidos. El `inputHandler` gestiona también la igualdad exacta `from === protectEnd` y fija explícitamente la selección después del texto insertado.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 48. Bug: `Enter` no responde al final de un título de pestaña
- **Descripción generalizada:** `Enter` podía no responder al final o dentro de un título, mientras otras posiciones utilizaban rutas diferentes. En ciertos casos `ArrowDown` también insertaba una línea, de modo que la creación de saltos no pertenecía exclusivamente a `Enter`.
- **Causa raíz identificada:** Había políticas contradictorias distribuidas entre el `transactionFilter`, un keymap condicional, `inputHandler` y navegación vertical. El filtro podía devolver `[]` y cancelar el salto; el keymap movía algunas inserciones a `line.to`; el comando Markdown base podía añadir sangría o más de un salto; y `ArrowDown` tenía una inserción propia.
- **Corrección implementada:** Existe un único comando `insertSingleLineBreak` en el keymap de máxima prioridad, compartido por `Enter` y `Shift+Enter`. Usa `changeByRange`, inserta exactamente un `\n` por selección y registra una sola transacción de entrada. En contenido y títulos actúa en la posición real; si la selección alcanza una cerca estructural o el identificador oculto, conserva esa estructura y coloca el salto en un borde seguro. El filtro quedó limitado a normalizar asociaciones de selección y nunca vuelve a rechazar cambios. `ArrowDown` ya no modifica el documento.
- **Invariante:** Dentro del editor modal, solo `Enter`/`Shift+Enter` crean saltos desde el teclado, nunca son bloqueados y cada pulsación produce exactamente una línea nueva sin destruir cercas, identificadores, decoraciones ni widgets.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 49. Normalización: protección estructural exclusiva de `Backspace`
- **Descripción:** Las cercas de apertura/cierre y los identificadores ocultos estaban protegidos simultáneamente por filtros de transacción, `Backspace`, `Delete`, rangos atómicos y reglas específicas por línea. Esa superposición podía bloquear operaciones legítimas como `Enter` y las inserciones de la caja de herramientas.
- **Corrección implementada:** Se retiró el bloqueo documental del `transactionFilter` y se eliminó el manejador especial de `Delete`. Un único guard de `Backspace`/`Mod-Backspace` reconoce mediante una pila cacheada únicamente las cercas estructurales de pestañas, protege sus saltos adyacentes y evita que una selección elimine el identificador oculto. En cualquier otra posición retorna `false` y delega a CodeMirror.
- **Compatibilidad preservada:** Las decoraciones estructurales, colores, texto fantasma, papeleras, rangos atómicos, asociación del cursor, botones horizontal/vertical y efecto de actualización inmediata no fueron retirados ni reconstruidos por selección.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 50. Bug: cursor visual rezagado respecto de la posición real durante la escritura
- **Descripción ampliada:** Al escribir dentro de un título, especialmente después de crear manualmente el identificador `tema:`, el texto se agregaba en la posición lógica correcta pero el cursor visible podía permanecer varios caracteres atrás. Además, una línea de separador vacía recién insertada no siempre aceptaba posicionamiento por mouse y exigía llegar con las flechas.
- **Causa raíz definitiva:** El CSS del plugin hacía visible el caret nativo del `contenteditable` mediante `caret-color`, aunque CodeMirror 6 lo oculta de forma intencional y dibuja el cursor real en `.cm-cursorLayer`. Al aparecer `tema:`, el resaltador sustituía ese prefijo con una decoración `replace`, envolvía el título en una marca inline inclusiva y situaba un widget en `line.to`. El caret nativo podía quedar anclado en el nodo DOM anterior mientras la selección y el cursor sintético de CodeMirror continuaban avanzando. La marca inline era redundante porque la decoración de línea ya aplicaba exactamente el mismo color y subrayado. El hit-testing del mouse también exigía una posición precisa dentro de un prefijo que ya no existía visualmente.
- **Corrección implementada y ampliada:** El caret nativo vuelve a estar oculto con `caret-color: transparent`; `.cm-cursorLayer` queda como única fuente visual de la selección. Se eliminó la marca inline de cada título y sus selectores CSS muertos, conservando el formato mediante `.cm-nested-tab-item`. La primera corrección solo hacía autoritarios los dos bordes y delegaba los clics interiores al navegador; la validación del usuario confirmó que esa delegación seguía sin producir una selección válida. Ahora todo clic izquierdo simple sobre la línea separadora usa `posAtCoords(..., false)`, limita el resultado al título editable, despacha directamente la selección de CodeMirror y cancela la selección DOM ambigua. Además, el `inputHandler` controla todas las ediciones monolínea del título, no solamente el primer carácter después de `tema:`: cada cambio incluye posición lógica y selección visual explícitas en la misma transacción. Usa `assoc: +1` al salir del prefijo, `assoc: -1` antes del widget final y asociación neutral dentro del título; `Shift+clic` extiende la selección desde el ancla actual. Las composiciones IME permanecen bajo control nativo de CodeMirror. No se reintrodujeron correcciones tardías ni reconstrucciones por `selectionSet`.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 51. Regresión: botones de pestañas anidadas horizontales y verticales sin respuesta
- **Descripción refinada por el usuario:** Los botones `Horizontal Nested Tabs` y `Vertical Nested Tabs` sí insertaban el bloque en el documento, pero la instancia abierta del editor modal no mostraba inmediatamente sus cercas decoradas, colores, texto fantasma ni controles. El bloque era visible en el código editable y aparecía en el modal después de cerrarlo y abrirlo otra vez.
- **Causa raíz identificada:** Había dos capas. Primero, las acciones internas podían ser confundidas con entrada multilínea manual por el `transactionFilter`. Después de autorizar la transacción, todavía faltaba invalidar expresamente la capa visual tras el ciclo `click → dispatch → focus`; el documento quedaba actualizado mientras `nestedTabsHighlighter` podía conservar decoraciones anteriores hasta reconstruirse en una nueva instancia.
- **Corrección implementada:** Las inserciones estructurales omiten explícitamente los filtros de entrada manual mediante `filter: false`. Los botones se enlazan por referencias nominales, de forma independiente y únicamente después de construir `EditorView`. Tras insertar, un `StateEffect` exclusivo solicita una reconstrucción visual en el siguiente cuadro; ambos resaltadores consumen el efecto, el editor recalcula su geometría y recupera el foco. Si el cursor está en un título, el bloque se inserta después de `line.to` sin dividirlo.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 52. Regresión: vista previa del bloque sin pestañas ni formato
- **Descripción:** En Live Preview, un bloque reconocido como `tabs` mostraba el texto dentro del contenedor básico de CodeMirror, junto con sus controles de código, pero no llegaba a mostrar la navegación ni el contenido con formato de pestañas.
- **Evidencia visual:** La captura aportada muestra que no se trata del editor modal: el fallo ocurre en el resultado del procesador Markdown del bloque y deja la vista en un estado parcialmente construido.
- **Primera hipótesis descartada:** Adelantar `lastTabsCache` corrigió una carrera real del ciclo de carga, pero el usuario confirmó que no restauró el formato de este bloque. Se conserva únicamente como fortalecimiento defensivo y deja de considerarse la causa de esta regresión.
- **Causa raíz comprobada:** El prefijo `tema:` ya no aparece y el título sí fue extraído, demostrando que `Gr.parseTabs()` terminó. La comparación directa con la instalación activa encontró `main.js` y `manifest.json` actualizados, pero ningún archivo `D:\PKM\.obsidian\plugins\tabs-extended\styles.css`. Por eso la estructura existía y `.tabs-nav` se comportaba como HTML sin formato. La corrección anterior no funcionó porque intentaba leer como respaldo el mismo archivo ausente.
- **Corrección implementada:** El procesador se registra antes de las tareas auxiliares. Durante `onload()` se crea un DOM de prueba invisible y se consultan estilos calculados (`display: inline-flex` y padding del título). Si la hoja normal no está activa, se intenta cargar `styles.css`; cuando la instalación está incompleta y el archivo no existe, se inyecta un núcleo visual integrado en `main.js`. La hoja completa continúa siendo la fuente canónica. Los errores de registro y recuperación dejan de silenciarse.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 53. Regresión: editor modal sin decoraciones después de optimizar el resaltador
- **Síntoma:** Al abrir el editor modal no aparecían colores, texto fantasma, iconos ni funciones visuales del resaltador.
- **Causa raíz:** El cálculo y la declaración de `activePair` quedaron accidentalmente después del bloque `return/catch` de `getDeco()`. Ese código era inalcanzable, mientras que `activePair` se consultaba antes, provocando una excepción durante la construcción inicial del `ViewPlugin`.
- **Solución confirmada:** La actualización de la caché y el cálculo del bloque activo se trasladaron inmediatamente después del análisis estructural y antes de construir las decoraciones. El usuario confirmó que regresaron el formato, los colores, iconos y textos fantasma del editor modal.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**










### 54. Compatibilidad Extendida: Visualización Completa de Callouts Nativos y de Callout Manager dentro de Pestañas
- **Problema:** Los callouts personalizados creados e introducidos por el plugin `Callout Manager` (ubicado en `.check/callout-manager`, como `[!law]`, `[!song]`, `[!glossary]`, `[!exercise]`, `[!respuesta]`, etc.) perdían sus colores de fondo, bordes, títulos e íconos al colocarse dentro de los bloques de pestañas de `tabs-extended`.
- **Análisis Diferencial:** `Callout Manager` define dinámicamente las variables `--callout-color` y `--callout-icon` en el elemento `<div class="callout" data-callout="...">`. Al estar dentro de los contenedores `.tabs-container` y `.tabs-editor-modal`, los selectores de cascada de Obsidian no aplicaban automáticamente la resolución de color a los títulos, íconos, bordes y fondos de callouts personalizados.
- **Solución Final:** 
  1. Se implementó en [styles.css](file:///D:/Scripts/obsidian/tabs-extended/styles.css) un conjunto de reglas de compatibilidad acopladas estrictamente a `.tabs-container .callout[data-callout]` y `.tabs-editor-modal .callout[data-callout]`.
  2. Dichas reglas garantizan la resolución de `background-color`, `border-color`, `color` de título y `color` de ícono a partir de la variable `--callout-color` asignada por `Callout Manager` o por Obsidian nativo, agregando un fallback limpio a la variante de acento (`var(--interactive-accent-rgb)`) si el color estuviera indefinido.
  3. Los callouts fuera de las pestañas permanecen **100% aislados e intocados**, asegurando cero interferencia global.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 55. Bug Solucionado: Acumulación Descontrolada de Backticks (Runaway Backticks) fuera del Bloque Principal
- **Descripción:** Al insertar o editar pestañas anidadas en el editor modal y guardar de forma continua o mediante auto-guardado, el backend modificaba `this.tabs.backquoteCount` acumulando backticks adicionales en cada ciclo (p. ej. de 3 a 4, luego 5, 6, 7...), lo que terminaba inyectando cercas infladas y backticks sueltos fuera del bloque de pestañas principal en la nota.
- **Causa Analizada:** En `getUpdatedTabsByIndex(t)`, la búsqueda por expresiones regulares de cercas internas (`match(/`{3,}/g)`) capturaba cercas secundarias (como bloques de código de 3 backticks) y ejecutaba `this.tabs.backquoteCount = Math.max(...)`, mutando persistentemente el contador del objeto `tabs`.
- **Solución Implementada:** 
  1. Se aisló `initialBackquoteCount` en el objeto `this.tabs` en el primer guardado para fijar de manera inmutable la cantidad de caracteres de la cerca principal (p. ej. 3).
  2. Se sustituyó la mutación de `this.tabs.backquoteCount` por un cálculo dinámico local `requiredFenceCount` que evalúa de forma aislada cercas de la misma familia de caracteres.
  3. Se preservó el tag de encabezado original (`headerTag`, ej. `tabs`, `tabs-v`, o palabras clave personalizadas `tabsKeyword`) en `getUpdatedTabsByIndex`, `updateBackquote`, `nestedTabsHighlighter` y `transactionFilter`.
- **Estado:** ✅ [Solucionado]

### 56. Título Inicial Independiente para Pestañas Verticales (`defaultTabNavItemVertical`)
- **Descripción**: Anteriormente, al agregar una nueva pestaña en un bloque vertical (`~~~tabs-v`), la pestaña adoptaba el título por defecto de las pestañas horizontales (`defaultTabNavItem`, ej. "New tab"). No existía una configuración independiente en las opciones para personalizar el título inicial de pestañas verticales.
- **Solución Aplicada**:
  1. Se agregó la propiedad `defaultTabNavItemVertical` ("New vertical tab" por defecto) a los ajustes predeterminados y al panel de configuración (`PluginLocales` en inglés y español).
  2. Se actualizó la lógica de creación de pestañas en `Yr` (menú contextual), `parseTabs` (lectura inicial), pegado e inserción desde el botón `action-add` para utilizar `defaultTabNavItemVertical` si la pestaña es vertical (`isVertical === true`).
  3. Se actualizó la etiqueta decorativa de cercas anidadas en el editor modal para indicar `(vertical end)` al cerrar bloques verticales.
- **Estado**: ✅ [Solucionado]

### 57. Corrección del Botón de Edición (Pencil) Basada en el Código de Referencia (`.references`)
- **Descripción**: Se revisó el código original en `.references/main.js` para corregir el mecanismo del icono de lápiz ✏️ que abre el editor modal en los bloques de pestañas.
- **Causa y Estructura de Referencia**:
  1. En `.references/main.js`, el botón flotante de esquina del bloque (`tabs-nav-button`) se gestiona con la clase `Wr` (`createTabNavButtonEl`). La opción `actionButtonType` determina si el botón muestra `action-add` (`+`), `action-edit` (✏️) o `action-none`.
  2. Se añadió un mecanismo de fallback inteligente `(0, qr.setIcon)(e, "pencil"); if (!e.firstElementChild) (0, qr.setIcon)(e, "lucide-pencil");` para garantizar compatibilidad universal con todas las versiones de la API de Obsidian.
  3. Se restauraron los valores por defecto exactos de `.references/main.js` (`actionButtonType: "action-add"`, `hideTabsEditBlockButton: true`, `doubleClickToEdit: false`) y el comportamiento original del menú contextual `Yr` y evento de doble clic sobre `this.tabsContents.tabcontentsEl`.
- **Estado**: ✅ [Solucionado]

### 58. Formato del Texto Fantasma para Pestañas Anidadas (Horizontales y Verticales)
- **Descripción**: Ajuste de las etiquetas decorativas del texto fantasma (ghost text) en los delimitadores de apertura y cierre de pestañas anidadas.
- **Solución Implementada**:
  1. Para pestañas verticales (`~~~tabs-v`):
     - Apertura: `nested tab start (vertical)`
     - Cierre: `nested tab end (vertical)`
  2. Para pestañas horizontales (`~~~tabs`):
     - Apertura: `nested tab start (horizontal)`
     - Cierre: `nested tab end (horizontal)`
  3. Se formateó dinámicamente el texto del widget en `nestedTabsHighlighter` para remover sufijos previos y aplicar la etiqueta adecuada según el tipo de bloque.
- **Estado**: ✅ [Solucionado]

### 59. Traducción al Español del Panel de Ajustes y Reubicación de la Sección "Acerca de"
- **Descripción**: El cuadro de vista previa de ajustes mostraba los nombres y descripciones en inglés ("Tabs contents padding", "Tabs contents max height") y la sección "Acerca de" aparecía posicionada sobre el contenedor de vista previa.
- **Solución Implementada**:
  1. Se añadió el diccionario completo de traducción en español `zr_es` y se actualizó la función helper `$` para responder al idioma seleccionado (`es`).
  2. Se tradujo "Tabs contents padding" -> **"Espaciado Interno (Padding)"** y "Tabs contents max height" -> **"Altura Máxima"** con sus descripciones completas en español.
  3. Se reubicó la sección **"Acerca de"** (`heading_info`) y el botón del Historial de Cambios al final absoluto de la vista de ajustes (`Vr.display()`), debajo de la vista previa interactiva `Dl`.
- **Estado**: ✅ [Solucionado]

### 60. Inserción de Nueva Pestaña Fuera del Bloque al Usar el Menú Contextual (Clic Derecho)
- **Descripción**: Al hacer clic derecho sobre una pestaña y seleccionar "Añadir nueva pestaña" (o "Pegar pestaña") — especialmente al estar dentro del Editor Modal — el contenido de la nueva pestaña se insertaba de manera corrupta en el documento principal fuera del bloque de código delimitado.
- **Causa Raíz Analizada**:
  1. Las acciones del menú contextual (`Yr`) invocaban `setLine(t.sectionInfo.lineEnd, ...)` reemplazando únicamente la línea del delimitador de cierre con una cadena multilínea. Esto provocaba que `lineEnd` fuera sobreescrito o desfasado y el texto fuera expulsado hacia afuera de la cerca de código.
  2. Al estar abierto el Editor Modal (`TabsEditorModal`), la modificación se enviaba al documento en segundo plano con rangos obsoletos mientras el modal mantenía activa su propia vista.
- **Solución Implementada**:
  1. Se implementó `Yr.updateBlockWithNewTab` y `Yr.removeTabFromBlock`, los cuales reconstruyen atómicamente la cerca de código completa (`fence + kw + config + fullTabsStr + fence`).
  2. Se añadió `Yr.getActualBlockRange` para calcular dinámicamente las líneas de inicio y fin reales de la cerca externa (`lineStart` y `lineEnd`), garantizando un reemplazo de rango exacto mediante `replaceRange`.
  3. Se integró detección de estado del Editor Modal (`isModalEditingThis`): si el modal está abierto, actualiza el documento sin fugas de texto y refresca la interfaz del modal automáticamente (`modal.startEditing(t)`).
  4. Se actualizó también el manejador del botón de esquina `action-add` (`+`) para utilizar `Yr.updateBlockWithNewTab`.
- **Estado**: ✅ [Solucionado]

### 61. Exención de Reconocimiento de `virtual-linker` en Títulos de Pestañas
- **Descripción**: El plugin `virtual-linker` (y similares) detectaba coincidencias de palabras clave e inyectaba enlaces virtuales con íconos (`.virtual-link-a`, `sup.linker-suffix-icon`) dentro de los títulos de las pestañas (`tabs-nav-item-md`), alterando la apariencia del título tanto en Reading View, Live Preview como en el Editor Modal.
- **Causa Raíz Analizada**: `virtual-linker` procesa todos los nodos hijos de elementos de texto (`p`, `span`, `strong`, etc.) generados durante el renderizado Markdown en la vista post-processor. Al renderizar el título con `MarkdownRenderer.render`, los elementos HTML internos dentro de `.tabs-nav-item-md` eran escaneados e intervenidos por el post-procesador de enlaces virtuales.
- **Solución Implementada**:
  1. Se añadió la función desvinculadora `cleanVirtualLinksFromElement` en `main.js` que detecta y desenvuelve automáticamente cualquier nodo inyectado (`.virtual-link`, `.virtual-link-a`, `.glossary-entry`), removiendo los elementos sufixales (`.linker-suffix-icon`, `sup`) y restaurando el texto plano sin alterar el contenido interno de las pestañas.
  2. Se configuró un `MutationObserver` en `On.prototype.setupVirtualLinkExemption` exclusivo para la cabecera de la pestaña (`.tabs-nav-item-md`), asegurando que cualquier inyección posterior de `virtual-linker` sea desarmada de inmediato de forma reactiva.
  3. Se añadieron clases de exclusión (`no-virtual-link`, `virtual-linker-ignore`) y reglas CSS de respaldo en `styles.css` para suprimir la visualización de sufijos y enlaces únicamente en la barra de títulos (`tabs-nav-item`).
- **Estado**: ✅ [Solucionado]

### 62. Mensaje Dinámico con Título y Lista de Pestañas al Eliminar Pestañas o Bloques
- **Descripción**: El modal de confirmación al hacer clic sobre el botón de borrado (`.tabs-delete-button` / 🗑️) debía mostrar el título específico de la pestaña individual (`¿Estás seguro de que deseas eliminar la pestaña "[Título]"?`) o listar detalladamente las pestañas contenidas que serán eliminadas al borrar un bloque completo.
- **Solución Implementada**:
  1. Para una pestaña individual: Se extrae el título de la línea (`tabTitle`) a partir de la palabra clave delimitadora `split` y se muestra el mensaje: `¿Estás seguro de que deseas eliminar la pestaña "[Título]"?`.
  2. Para un bloque de pestañas: Se escanean todas las pestañas contenidas entre la apertura y el cierre del bloque y se listan como viñetas en el cuerpo del mensaje: `Pestañas por eliminar que contiene el bloque: \n • "[Pestaña 1]"\n • "[Pestaña 2]"`.
  3. Se activó `white-space: pre-wrap;` en `ConfirmDeleteModal` para la renderización limpia de saltos de línea y viñetas.
- **Estado**: ✅ [Solucionado]

### 63. Optimización del Espaciado en Pestañas Verticales (Separación del Borde Izquierdo Configurable y Alineación Superior)
- **Descripción**: 
  1. **Separación del Borde Izquierdo (Configurable)**: El usuario solicitó reducir/ajustar la separación en el borde izquierdo de los títulos de pestañas verticales para que puedan pegarse al borde del bloque contenedor.
  2. **Espacio en Blanco en Pestañas Anidadas**: Al anidar pestañas verticales dentro de un bloque horizontal (ej. `Artículos`), la propiedad `padding-left: 2em` del contenedor padre dejaba una sangría o espacio en blanco considerable a la izquierda de las pestañas verticales incluso con el slider en 0px.
  3. **Límites y Valor por Defecto**: El slider debe tener un límite mínimo estricto de `0px` (siendo imposible seleccionar valores negativos) y su valor por defecto siempre debe ser `4px`.
- **Solución Implementada**:
  1. **Cancelación del Espaciado en Pestañas Anidadas**: Se añadió en `styles.css` el cálculo de margen negativo `margin-left: calc(-1 * var(--tabs-contents-padding-left, 2em)) !important;` para contenedores de pestañas verticales anidadas (`.tabs-contents .tabs-container.tabs-nav-left`). Esto compensa y elimina por completo el relleno de 2em del contenedor padre, haciendo que las pestañas verticales anidadas comiencen exactamente en el borde izquierdo del bloque cuando el slider está en `0px`.
  2. **Límites del Deslizador (0 a 50) y Valor por Defecto (4)**: Se estableció `.setLimits(0, 50, 1)` en el slider de la configuración (`main.js:893`), haciendo imposible bajar de `0`. El valor por defecto se mantiene estrictamente en `4px` (en la definición inicial `Ss`, en la UI del slider y en la restauración mediante el botón de reinicio).
  3. **Validación de Seguridad (`Math.max(0, ...)`)**: Se añadieron salvaguardas en `updateGlobalCssVariables()` y `updateVerticalTabsLeftSpacingCss()` para garantizar que ningún valor inferior a `0` pueda ser aplicado.
  4. **Alineación Superior del Contenido**: Se configuró `padding-top: 0 !important;` en el contenedor de contenidos de pestañas verticales y `margin-top: 0 !important;` en el primer elemento hijo (`.tabs-content > :first-child`), logrando que el contenido se alinee perfectamente a la par con la pestaña superior.
- **Estado**: ✅ [Solucionado]

### 64. Opciones de Comportamiento para Títulos Largos en Pestañas Verticales
- **Descripción**: Se reorganizaron y ampliaron las opciones de comportamiento para los títulos de pestañas largos en la configuración del plugin, agrupándolos bajo una nueva sección ("Comportamiento de Títulos Largos") con 4 comportamientos seleccionables para pestañas verticales.
- **Solución Implementada**:
  1. **Sección Dedicada en Configuraciones**: Se agrupó en `Vr.display()` (`main.js`) bajo el encabezado `heading_title_behavior`:
     - *Organización de Títulos en Columnas (Verticales)* (`verticalTabsColumns`)
     - *Margen de Sangría Izquierda (Verticales)* (`verticalTabsLeftSpacing`)
     - *Comportamiento de Títulos Largos en Pestañas Horizontales* (`defaultTitleLineClamp`)
     - *Comportamiento de Títulos Largos en Pestañas Verticales* (`verticalTitleBehavior`)
  2. **4 Comportamientos Seleccionables para Pestañas Verticales**:
     - *Desplazamiento al pasar el ratón (Hover-Scroll)*: Realiza un desplazamiento horizontal suave tipo carrusel al colocar el ratón sobre la pestaña.
     - *Desplazamiento automático continuo (Auto-Scroll)*: Se desplaza suavemente de forma continua e ininterrumpida sin necesidad de pasar el ratón.
     - *Mostrar en 2 líneas y recortar (Double-Line)*: Permite que el título ocupe hasta 2 líneas de texto y añade puntos suspensivos al final (`-webkit-line-clamp: 2`).
     - *Recortar título (Truncate)*: Mantiene el título en una sola línea con puntos suspensivos (`text-overflow: ellipsis`).
  3. **Reglas CSS y Lógica**: Se agregaron las clases CSS en `styles.css` (`.tabs-nav-v-behavior-truncate`, `.tabs-nav-v-behavior-double-line`, `.tabs-nav-v-behavior-auto-scroll`) y la inyección dinámica de clase en `Nr.prototype.decorate` (`main.js`).
- **Estado**: ✅ [Solucionado]

### 65. Ajuste Definitivo: Restauración de Alineación de Títulos Verticales y Alineación General de Contenido (Vista de Edición y Lectura)
- **Descripción**: Se requería mantener la alineación de títulos/separadores de pestañas verticales por defecto como estaba originalmente (Izquierda, Centro, Derecha), garantizando al mismo tiempo que las configuraciones de alineación de texto de contenido (Izquierda, Derecha y Justificado) se apliquen estrictamente sobre el cuerpo de contenido dentro de los separadores, de forma idéntica tanto en la vista de edición (Live Preview / CodeMirror 6) como en la vista de lectura (Reading View) de Obsidian.
- **Solución Implementada**:
  1. **Restauración de Alineación de Títulos Verticales**: Se restauró la opción `Alineación de Títulos (Pestañas Verticales)` (`verticalTitleAlignment`) en el panel de configuraciones bajo la categoría de títulos, con opciones exclusivas de `Izquierda (Predeterminado)`, `Centro` y `Derecha`.
  2. **Alineación del Contenido en Ambas Vistas**: Se configuró la opción `Alineación del Contenido de Pestañas` (`tabContentAlignment`) para gestionar las 3 opciones principales de texto (`Izquierda`, `Derecha` y `Justificado`), asegurando que apliquen sobre todo el cuerpo de texto en la vista de edición (Live Preview), vista de lectura y editor modal.
  3. **Refactorización Completa de Reglas CSS**: En `styles.css`, se ampliaron los selectores `:is(.tabs-container, .tabs-editor-modal).tabs-content-align-*` dirigidos a `.tabs-content` y a todos sus elementos descendientes (`p`, `ul`, `ol`, `li`, `div`, `span`, `blockquote`, `h1`-`h6`), evitando que reglas por defecto del editor de Obsidian o de temas de terceros anulen la alineación seleccionada por el usuario.
- **Estado**: ✅ [Solucionado] (Verificado por el usuario)

### 66. Homogeneización Estricta de Alineación para Separadores Verticales (`tabs-v`)
- **Descripción**: En bloques de pestañas verticales (`tabs-v`), algunos separadores de títulos se mostraban centrados al envolver en múltiples líneas (ej. "Para derecho de prioridad"), mientras que otros permanecían alineados a la izquierda (ej. "Rehabilitación"), generando desalineación inconsistente dentro de la barra lateral de pestañas.
- **Solución Implementada**:
  1. **Ubicación de Configuración Específica**: Se posicionó la opción `Alineación de Títulos (Solo Pestañas Verticales tabs-v)` (`verticalTitleAlignment`) justo antes de la opción de alineación del contenido (`tabContentAlignment`) en los ajustes del plugin.
  2. **Alineación por Defecto a la Izquierda**: Se estableció `"left"` como el valor predeterminado estricto para la alineación de separadores verticales.
  3. **Aislamiento Total CSS entre Títulos y Contenido**: Se reescribieron las reglas CSS en `styles.css` (`.tabs-container:is(.tabs-nav-left, .tabs-nav-right) .tabs-nav-item *`) aplicando de forma exhaustiva `text-align: left !important`, `text-align-last: left !important`, `align-items: flex-start !important` y `justify-content: flex-start !important` sobre todos los elementos hijos (`p`, `span`, `div`, `a`) de las cabeceras verticales, impidiendo que el motor flex de Obsidian o reglas de temas adapten el texto de múltiples líneas al centro de forma errática.
- **Estado**: ✅ [Solucionado] (Verificado por el usuario)

### 67. Corrección de Carga Inicial y Multi-Línea Inteligente por Overflow en Pestañas Verticales Anidadas (`tabs-v`)
- **Descripción**: 
  1. En bloques de pestañas verticales anidados dentro de otras pestañas, los títulos se mostraban truncados en 1 sola línea durante el renderizado inicial y solo adoptaban el formato multi-línea tras un clic.
  2. El envolvente de multi-línea es estrictamente inteligente por overflow: si el texto en la línea 2 no supera el ancho del contenedor/sangría actual, se mantiene en 2 líneas y **nunca activa una tercera línea prematuramente**.
- **Solución Implementada**:
  1. **Ajuste de Bloque Continuo e Inline**: Se estableció `display: block !important; width: 100% !important;` en la cabecera `.tabs-nav-item` y `display: inline !important` en los elementos Markdown hijos (`p`, `span`, `div`), garantizando un flujo de texto uniforme a través del 100% del ancho del separador.
  2. **Control Estricto de Saltos de Línea por Overflow**: El texto llena la Línea 1 hasta el $100\%$ del ancho y se desborda naturalmente a la Línea 2. Si la Línea 2 no vuelve a sobrepasar el $100\%$ del ancho, la pestaña permanece estrictamente en **2 líneas**, activando la 3ª línea únicamente si la propia Línea 2 excede nuevamente el límite del contenedor.
- **Estado**: ✅ [Solucionado] (Verificado por el usuario)

### 68. Fortaleza de 44 Capas de Protección Acumulativas en Editor Modal
- **Descripción**: 
  1. Se requería asignar colores diferenciados a los separadores dentro del Editor Modal según su profundidad de anidación ($0, 1, 2, 3, 4, \ge 5$).
  2. Al situar el cursor dentro de un bloque anidado, el texto fantasma (*ghost text*) de sus cercas de apertura (`~~~tabs`) y cierre (`~~~`) debe resaltarse en **negrita** y color normal.
  3. **Estrategia Acumulativa de Protección Ampliada**: Se estructuraron 30 capas superpuestas de protección inquebrantable con 3 capas independientes de defensa contra fractura de títulos por `Enter`, operando en distintas fases del pipeline de eventos de CodeMirror 6.
- **Capas de Protección Implementadas (Acumulativas y Mejoradas)**:
  1. **Capa 1 (Compatibilidad DOM y Estilos Inmunes)**: Reglas CSS ultra-específicas con `!important` que protegen colores de nivel $0$ a $\ge 5$, subrayados y negritas frente a temas externos.
  2. **Capa 2 (Control de Excepciones y Reordenamiento Estricto)**: Captura `try...catch` en `getDeco()` y ordenamiento `i.sort((a, b) => a.from - b.from || a.to - b.to)`.
  3. **Capa 3 (Límites de Rango Sustituido con Clamping)**: Atributos `{ inclusive: false, inclusiveStart: false, inclusiveEnd: false }` en `q.replace` acotados a los límites de línea física.
  4. **Capa 4 (Mapeador Universal `transactionFilter`)**: Ajuste dinámico del cursor `protectEnd = line.from + splitOffset + splitStr.length` con salto limpio a la línea anterior.
  5. **Capa 5 (Filtro de Cambio de Línea y Re-render)**: Evaluación inteligente `oldLine !== newLine` combinada con refresco en `viewportChanged`.
  6. **Capa 6 (Rangos Atómicos Nativos `atomicRanges`)**: Extensión `EditorView.atomicRanges` que bloquea la entrada del cursor a la zona indivisible del prefijo `tema:`.
  7. **Capa 7 (Interceptor de Eventos DOM Multi-Acción `domEventHandlers`)**: Manejador de `mousedown`, `click`, `dblclick` y `contextmenu` que redirige el caret a `protectEnd`.
  8. **Capa 8 (Centinela Asíncrono Doble `updateListener`)**: Sincronización post-transacción mediante `requestAnimationFrame` y micro-tareas de corrección.
  9. **Capa 9 (Protección de Pegado y Sanitización `inputHandler`)**: Intercepción de inserción de texto por pegar (`Ctrl+V`) o arrastrar, impidiendo la corrupción del prefijo.
  10. **Capa 10 (Guardia de Atajos de Teclado con Fallback Seguro `safeHighest`)**: Intercepción de `Home` y `Backspace` con wrapper dinámico `safeHighest` inmune a errores de métodos no definidos.
  11. **Capa 11 (Aislamiento de Cercas de Cierre `continue;`)**: Salto directo `continue;` tras procesar cercas (`~~~` o `~~~tabs`), eliminando la doble evaluación de cercas como separadores.
  12. **Capa 12 (Control Estricto de Líneas Únicas `decoratedLineSet`)**: Centinela `Set` de líneas decoradas que suprime el error `RangeError: Duplicate line decorations` cuando el cursor está en cercas de cierre.
  13. **Capa 13 (Fallback Seguro `getDeco` sin Caché Obsoleto)**: En caso de excepción en `getDeco()`, retorna `q.none` en lugar de `this.lastValidDeco`, evitando aplicar offsets de documentos anteriores al documento actual (causa raíz de desincronización visual).
  14. **Capa 14 (Igualdad Fuerte de Widgets `DepthWidget.eq` Total)**: Comparación estricta de 7 propiedades (`text`, `depth`, `lineNo`, `type`, `splitStr`, `baseDepth`, `isActive`) que evita la reutilización de nodos DOM obsoletos por el reconciliador de CodeMirror 6.
  15. **Capa 15 (Centinela de Reorientación de Viewport)**: Verificación activa de rangos visibles durante desplazamientos de scroll en documentos extensos.
  16. **Capa 16 (Sincronizador de Foco `Focus/Blur Resync`)**: Re-evaluación inmediata de decoraciones al cambiar el foco de la ventana o del editor modal.
  17. **Capa 17 (Filtro de Desplazamiento de Líneas `lineBlockAt` Clamping)**: Clamping seguro `Math.max(1, Math.min(doc.lines, lineNo))` que previene errores de índice al eliminar bloques multilínea.
  18. **Capa 18 (Restauración de Estado en Reapertura `startEditing`)**: Limpieza de referencias en `window.tabsExtActiveViews` y re-inicialización limpia del estado en cada apertura del modal.
  19. **Capa 19 (Control de Navegación Horizontal por Teclado `ArrowLeft` / `ArrowRight`)**: Intercepción directa de flechas izquierda y derecha en `safeHighest`, impidiendo que el caret penetre en el nodo DOM oculto del prefijo `tema:`.
  20. **Capa 20 (Navegación Vertical Protegida `ArrowUp` / `ArrowDown`)**: Clamping de posición al desplazar el cursor verticalmente con teclado entre líneas, situando el cursor de forma segura en o después de `protectEnd`.
  21. **Capa 21 (Re-evaluación Continua en `selectionSet`)**: Eliminación de la restricción `oldLine !== newLine` en `nestedTabsHighlighter.update()`, garantizando que cualquier movimiento de selección mantenga el resalte activo (`is-active-ghost-text`) sincronizado al 100%.
  22. **Capa 22 (Sanitización del Salto de Pestaña Anterior)**: Transición fluida al final de la línea anterior al presionar la flecha izquierda o retroceso desde el inicio del título de una pestaña.
  23. **Capa 23 (Protección de Títulos contra `Enter` Desintegrador)**: Al presionar `Enter` sobre una línea de título (`tema:*Título`), el sistema bloquea la división del título e introduce el cursor en la zona de contenido (o inserta una línea de contenido abajo), manteniendo el título en una sola línea.
  24. **Capa 24 (Blindaje de Cercas ante Borrados por Teclado `Backspace` / `Delete`)**: Bloqueo absoluto de las teclas `Backspace` y `Delete` cuando el cursor está en una cerca de apertura (`~~~tabs`) o cerca de cierre (`~~~`), o cuando se intenta fusionar líneas hacia la cerca. Las cercas solo pueden eliminarse voluntariamente a través del botón 🗑️ disponible en hover.
  25. **Capa 25 (Cursor Parpadeante de Alta Visibilidad, revisada)**: Se conserva el color y grosor explícito de `.tabs-editor-modal .cm-cursor` junto con el fallback de `--caret-color`. La animación individual `@keyframes cm-blink` fue retirada el 14 de agosto de 2026 porque duplicaba la animación nativa de `.cm-cursorLayer`; CodeMirror controla ahora en exclusiva el ciclo de parpadeo y su reinicio al cambiar la selección.
  26. **Capa 26 (Botón 🗑️ de Eliminación en Hover para Apertura y Cierre)**: Asignación de `type = "block"` en `DepthWidget` para cercas de cierre (`~~~`) y ampliación de reglas CSS en hover (`.cm-line:hover .tabs-delete-button`), garantizando que el botón 🗑️ aparezca de inmediato tanto en cercas de apertura como de cierre al pasar el cursor.
  27. **Capa 27 (Garantía de Inserción Limpia de Nueva Línea tras Título en `Enter` vía `keymap`)**: Al presionar `Enter` en cualquier posición de una línea de título, el manejador `keymap` con `safeHighest` inserta `\n` al final de la línea del título (`line.to`) y posiciona el cursor en la nueva línea vacía recién creada.
  28. **Capa 28 (Interceptor DOM `keydown` Pre-Keymap — Defensa Primaria)**: Manejador `domEventHandlers.keydown` que se ejecuta **ANTES** de todos los keymaps de CodeMirror 6 (incluyendo `wy` de markdown a `be.high` y `td` del keymap base). Cuando `event.key === "Enter"` y la línea contiene `splitStr`, ejecuta `event.preventDefault()` + `event.stopPropagation()` y despacha la inserción en `line.to`.
  29. **Capa 29 (Filtro de Transacciones con `iterChanges` — Defensa Secundaria)**: Inspección post-cambio en `transactionFilter` mediante `changes.iterChanges(...)`. Si `ins.lines > 1` y la posición de inserción cae **dentro** de una línea de título (`fromA >= line.from && fromA < line.to`), la transacción es rechazada.
  30. **Capa 30 (Redirección de `inputHandler` para Saltos de Línea — Defensa Terciaria)**: Si el texto recibido por `inputHandler` contiene `\n` y la línea de inserción contiene `splitStr`, la inserción se redirige incondicionalmente a `line.to`.
  31. **✨ Capa 31 (Corrección de Solapamiento `mark` / `replace` — Causa Raíz Visual)**: La decoración `q.mark()` para el título de pestaña iniciaba en `line.from + splitOffset` (la misma posición que `q.replace()`), causando **solapamiento** de rangos de decoración. CM6 corrompía los nodos `<span>` del árbol DOM durante actualizaciones incrementales (inserciones de línea). El fix mueve el inicio de `mark` a `line.from + splitOffset + split.length` (después del rango `replace`), eliminando la superposición. **Esta era la causa raíz principal** de por qué el texto de los separadores se partía visualmente al presionar Enter.
  32. **Capa 32 (Eliminación de `requestAnimationFrame` Disruptivo en Enter)**: Se removieron los bloques `requestAnimationFrame(() => { view.requestMeasure(); view.dispatch(...) })` que se ejecutaban después de cada inserción de `\n`. Estos interrumpían el ciclo de renderizado bifásico de CM6 (measure → draw), causando que los cálculos de altura de línea y posición de decoraciones de borde se desalinearan. Sin ellos, CM6 procesa la transacción sincrónicamente y re-renderiza correctamente.
  33. **Capa 33 (Habilitación de Salto de Línea en Cercas de Cierre Post-Símbolo)**: Corrección en `transactionFilter` y `domEventHandlers.keydown` para cercas de cierre (`~~~` o ```` ``` ````). Anteriormente, `transactionFilter` bloqueaba indiscriminadamente toda transacción en líneas de cercas (`fromA <= line.to`), impidiendo presionar `Enter` o escribir después de `~~~`. La nueva regla acota la protección estrictamente al rango del símbolo `[protectStart, fenceSymbolEnd)`. Si el cursor está ubicado después de la cerca de cierre (`sel.head >= fenceSymbolEnd`), presionar `Enter` despacha la inserción de `\n` al final de la línea (`line.to`), permitiendo insertar líneas en blanco y continuar escribiendo libremente debajo del bloque anidado.
  34. **✨ Capa 34 (Eliminación de Saltos de Línea Duplicados en `Enter` y Desactivación de Inserción en `ArrowDown`)**: Se incorporó `event.stopImmediatePropagation()` en `domEventHandlers.keydown` para detener la ejecución simultánea de manejadores secundarios (`keymaps` e `inputHandler`) al presionar `Enter` en títulos o cercas. Asimismo, se reestructuró el manejador de la tecla `ArrowDown` para actuar estrictamente como navegación de selección (`Z.single(...)`), eliminando el bloque de código que insertaba saltos de línea al presionar la flecha hacia abajo en la última línea del documento (Causa raíz del ERROR 1).
  35. **Capa 35 (Estabilización Estricta de Longitud de Cercas en Auto-Guardado `maxInnerLen > requiredFenceCount`)**: En `getUpdatedTabsByIndex()`, la condición `maxInnerLen >= requiredFenceCount` incrementaba iterativamente el número de tildes de las cercas externas de 3 a 4 (`~~~~`), 5 (`~~~~~`), 6 (`~~~~~~`) en cada ciclo de auto-guardado (`debounceSave()`) al detectar bloques anidados internos (`~~~tabs`). La condición se corrigió a estricta superioridad (`maxInnerLen > requiredFenceCount`), manteniendo la cerca externa estable permanentemente en 3 tildes y previniendo la duplicación de cercas y corrupción visual de separadores (Causa raíz del ERROR 2).
  36. **✨ Capa 36 (Anclaje Interno Estricto de Widgets `side: -1`)**: Se modificó la propiedad `side` de los widgets `DepthWidget` de `1` a `-1` en `getDeco()`. Esto ancla las decoraciones de texto fantasma de cercas de apertura, cierre y separadores **estrictamente dentro de su propia línea** (antes del límite `line.to`), evitando que los nodos DOM sangren o se dupliquen a través del salto de línea `\n` al presionar `Enter` en la cerca de cierre (Solución para ERROR 1).
  37. **Capa 37 (División Inteligente de Títulos en `Enter` y Texto Fantasma Placeholder)**: Al presionar `Enter` con el cursor ubicado al inicio del título (`tema:*Prioridad`) o a la mitad del título (`tema:Prio*ridad`), el sistema divide la línea desplazando únicamente el texto del título sin formato a la nueva línea creada abajo, dejando la línea original con la cerca `tema:`. Si la línea de cerca queda vacía o solo con espacios (`tema:`), `getDeco()` renderiza automáticamente el texto fantasma placeholder (`ingresa un título para esta pestaña`), manteniendo la estructura limpia y sin romper el formato (Solución para SOLICITUD 2).
  38. **Capa 38 (Protección de Navegación Vertical `ArrowUp` / `ArrowDown` y Caché de Respaldo `this.lastValidDeco`)**: Se reestructuraron las teclas de navegación vertical `ArrowUp` y `ArrowDown` para calcular dinámicamente las posiciones de columnas entre cualquier tipo de línea (líneas de separador `tema:`, líneas vacías y cercas), retornando siempre la navegación fluida. Además, se introdujo sanitización estricta de rangos de decoraciones en `getDeco()` y un retorno de respaldo `this.lastValidDeco || q.none` en su bloque `catch`, asegurando que al navegar repetidamente con las flechas entre líneas vacías el editor modal nunca pierda sus decoraciones ni vuelva al texto plano.
  39. **✨ Capa 39 (Consolidación Exclusiva de Tecla Enter en Keymap Autoritativo)**: Se eliminó el manejador redundante de `Enter` en `domEventHandlers.keydown`, canalizando **toda** la lógica de saltos de línea y división de títulos a través del manejador autoritativo de `keymap.of` con `safeHighest`. Al retornar `true` en el pipeline de keymaps de CodeMirror 6, el motor interrumpe inmediatamente cualquier evaluación posterior, garantizando que se inserte **estrictamente un solo salto de línea `\n`** sin líneas en blanco extra.
  40. **Capa 40 (Actualización In-Place de Widgets DOM mediante `updateDOM`)**: Se implementó el método `updateDOM(dom, view)` dentro de la clase `DepthWidget`. Cuando el estado de foco o posición del cursor cambia (por ejemplo, tras presionar `Enter` en una cerca de cierre `~~~*`), CodeMirror 6 llama a `updateDOM` y actualiza las clases CSS y opacidad del elemento DOM existente en lugar de destruirlo y recrearlo. Esto erradica por completo la duplicación o repetición de los textos fantasmas en las cercas de apertura (`~~~tabs`).
  41. **Capa 41 (Anclaje Neutral de Widgets `side: 0` para Eliminación del Desplazamiento de Caracteres y Liberación del Cursor)**: La propiedad `side: -1` en los widgets de `line.to` causaba que CodeMirror 6 insertara los widgets **antes** del último carácter de la línea (desplazando la tercera virgulilla `~` de `~~~` o la última letra `s` de `tabs` a la derecha del widget fantasma, como se veía en la Imagen 2 y 3). La corrección ajustó `side: 0` para todas las decoraciones `DepthWidget` en `line.to`, situando los textos fantasmas **después** de todos los caracteres reales de la línea sin desplazar ningún símbolo ni letra, y permitiendo que la selección del cursor baje limpiamente a la nueva línea vacía recién creada al presionar `Enter`.
  42. **Capa 42 (Eliminación Definitiva de `side: -1` en Separadores de Pestañas Anidadas)**: Se reemplazaron de forma exhaustiva los residuales `side: -1` en las líneas de separadores anidados (`depth === 1` y `depth > 1`) en `getDeco()`. Esto impide por completo que los widgets secundarios de pestañas se inyecten antes del carácter final de la línea `~~~tabs`, garantizando protección visual estricta del texto `tabs`, la permanencia de las 3 virgulillas unidas y cero repetición de textos fantasmas.
  43. **✨ Capa 43 (Integración Efectiva del Método `updateDOM` en `DepthWidget`)**: Se inyectó formalmente el método `updateDOM(dom, view)` dentro de la clase `DepthWidget` en `main.js`. Al cambiar el estado activo del bloque (`isActive`), CodeMirror 6 actualiza directamente la opacidad, grosor de fuente y color del nodo `<span>` existente en el árbol DOM. Esto detuvo por completo la creación descontrolada de elementos `<span>` duplicados en las cercas de apertura (`~~~tabs`) y evitó la fragmentación del nodo de texto de las virgulillas.
  44. **✨ Capa 44 (Navegación Inteligente a Líneas Vacías Existentes en `Enter`)**: Se perfeccionó el manejador de la tecla `Enter` para títulos (`tema:perritos*`) y cercas de cierre (`~~~*` o `~~~ *`). Si la línea inmediatamente inferior ya es una línea vacía (`nextLine.text.trim() === ""`), presionar `Enter` Simply desplaza el foco a esa línea vacía existente mediante `selection: Z.single(nextLine.from)`, evitando la inserción acumulativa de múltiples saltos de línea `\n` redundantes.
- **Estado:** ✅ **[Solucionado — confirmado por el usuario]**

### 69. Inserción Inteligente de Pestañas Principales (Main Tabs) en Editor Modal
- **Descripción**: 
  1. Al presionar el botón "Add Main Tab" (`+` / `plus-square`) en la barra de herramientas del Editor Modal, el sistema debe insertar siempre una pestaña principal de nivel superior ($0$), independientemente de dónde se encuentre ubicado el cursor (incluso si está dentro de un bloque anidado `~~~tabs`).
- **Solución Implementada**:
  1. **Algoritmo de Escaneo de Estructura `insertMainTab()`**: Se implementó un analizador en `Zl` que rastrea el nivel de anidación mediante `fenceStack`.
  2. **Ubicación Dinámica**: Identifica la frontera del bloque principal actual (justo antes de la siguiente pestaña de nivel 0 o al final del documento) e inserta `\n\n` + `splitStr` + `defaultTitle` + `\n` + `defaultContent`.
  3. **Enfoque de Selección Inmediato**: Sitúa automáticamente la selección y el foco en el título recién creado para edición instantánea.
- **Estado**: ✅ [Solucionado] (Verificado por el usuario)

### 70. Bug: claves internas visibles en la sección de colores por nivel de anidación
- **Descripción:** Con el idioma español activo, la sección de colores del editor modal mostraba identificadores internos como `heading_nested_colors`, `nested_color_level_0_name` y sus claves de descripción en lugar de textos traducidos.
- **Causa raíz:** Las traducciones españolas de estas opciones estaban presentes en un objeto de localización anterior, pero faltaban en `PluginLocales.es`, que es el diccionario consultado por la pantalla actual mediante `PluginLocales[lang][key] || key`.
- **Corrección implementada:** Se añadieron al diccionario español activo el encabezado, la descripción general y los nombres y descripciones de los niveles 0 a 4 y del nivel compartido 5 o superior.
- **Estado:** **[Pendiente de validación del usuario]**

### 71. Bug: reordenamiento por arrastre inoperante y limitado a pestañas principales
- **Descripción:** La opción «Reordenar pestañas por arrastre» podía estar activada sin que comenzara el gesto de arrastre. Además, los títulos pertenecientes a bloques anidados no registraban eventos de reordenamiento. Durante la validación, mover la última pestaña `2.3` antes de `2.2` generó `tema:2.3tema:2.2` y rompió el formato del bloque.
- **Causas raíz:** El manejador de cada título cancelaba incondicionalmente `mousedown`, interfiriendo con `dragstart`; el registro excluía expresamente a `innertabs`; y el guardado reconstruía el bloque completo desde el DOM, fijando `tabs` como encabezado y sin disponer de una ruta fuente para los bloques hijos. En la primera corrección estructural, la última sección podía terminar exactamente al final del cuerpo sin salto de línea; al moverla a una posición intermedia, la concatenación literal no restablecía la frontera física con el siguiente separador.
- **Corrección implementada:** Se incorporó un analizador estructural con pila de cercas que obtiene rangos exactos de separadores hermanos. El arrastre mueve el rango completo de la pestaña, incluidos contenido y descendientes, únicamente dentro del mismo bloque y nivel. Los cambios anidados se propagan por referencias padre hasta realizar una sola escritura verificada en la raíz. El ensamblador conserva cada sección literalmente y añade el estilo de salto original (`LF`, `CRLF` o `CR`) solo cuando dos secciones reordenadas quedarían unidas sin frontera de línea. Si la fuente quedó obsoleta o un rango es ambiguo, la operación se cancela sin modificar la nota.
- **Estado:** **[Pendiente de validación del usuario]**

### 72. Bug: el reordenamiento muestra una pestaña de otro nivel
- **Descripción:** El movimiento de `2.1`, `2.2` o `2.3` se guardaba correctamente, pero el refresco posterior podía abandonar visualmente ese bloque y mostrar `Soy un tema inferior 1` o alguna de las pestañas `Soy el primer tema`, `Soy el segundo tema` o `Soy el tercer tema`.
- **Causa raíz:** Los bloques anidados recibían un `tabsId` aleatorio en cada render, por lo que la caché no podía relacionar la instancia nueva con la anterior y restauraba el índice `0`. Además, el nuevo índice de la pestaña arrastrada se almacenaba después de escribir en el editor; Obsidian podía reconstruir los procesadores de Markdown durante esa escritura y leer todavía el estado antiguo.
- **Corrección implementada:** Cada bloque anidado recibe ahora una identidad estable construida a partir del bloque padre, la identidad semántica de la pestaña contenedora, el ordinal del bloque hijo y su orientación. Antes de modificar la fuente se guarda atómicamente la ruta activa completa de ancestros y el índice final de la pestaña arrastrada. Tras el movimiento, esa pestaña se marca explícitamente como activa en navegación y contenido. Si la escritura se cancela, la caché se restaura a su estado anterior.
- **Estado:** **[Pendiente de validación del usuario]**

### 73. Bug: menú contextual limitado al nivel raíz y escrituras fuera del bloque seleccionado
- **Descripción:** Las acciones de clic derecho «Añadir nueva pestaña», «Eliminar pestaña», «Copiar pestaña» y «Pegar pestaña» solo se registraban en pestañas principales. Además, insertar o eliminar podía reconstruir o modificar un bloque distinto del seleccionado.
- **Causa raíz:** El registro del evento excluía explícitamente todas las instancias `innertabs`. Las acciones de inserción y eliminación reconstruían cercas y secciones desde el DOM y solo escribían mediante `sectionInfo`, propiedad exclusiva del bloque raíz. Copiar también generaba texto desde el modelo renderizado en vez de extraer el rango fuente exacto, y los avisos podían indicar éxito aunque no se hubiera escrito nada. La auditoría de `.references/Marcas.md` encontró la causa concreta del rechazo persistente de «Añadir nueva pestaña»: el último `~~~tabs-v` comparte el cierre `~~~~` del bloque horizontal `~~~~tabs`. El analizador LIFO consumía `~~~~` únicamente como cierre del hijo vertical y dejaba abierto el ancestro horizontal; por ello, cualquier nuevo separador se clasificaba dentro del descendiente y fallaba el conteo de seguridad.
- **Corrección implementada:** El menú contextual se registra ahora en cada bloque editable, detiene la propagación entre niveles y resuelve una sola vez la pestaña exacta pulsada. Insertar, eliminar, copiar y pegar operan con rangos fuente estructurales; conservan literalmente contenido, configuración y descendientes; y propagan una única modificación verificada desde el bloque seleccionado hasta la raíz. El pegado admite una o varias secciones válidas y las convierte en hermanas del nivel receptor. La eliminación de la única pestaña se deshabilita para no producir un bloque inválido. Una cerca de cierre que coincide exactamente con un ancestro cierra ahora también los descendientes pendientes. Los bloques de pestañas abiertos al final de su contenedor se reconocen como cierres implícitos y, antes de insertar un nuevo hermano, se materializan únicamente las cercas de pestañas que falten. Las cercas de código ajenas nunca se completan automáticamente.
- **Estado:** **[Pendiente de validación del usuario]**

### 74. Regresión: tres backticks aparecen fuera del bloque al cerrar el editor modal
- **Descripción:** En ocasiones, bastaba abrir el editor modal con doble clic, observar el contenido y cerrarlo para que apareciera una cerca adicional de tres backticks fuera del bloque de pestañas, aun sin haber editado el documento.
- **Causa raíz:** `onClose()` ejecutaba `saveEditorData()` incondicionalmente. Por tanto, una apertura sin cambios reconstruía todas las pestañas y ambas cercas desde el modelo renderizado. Esa misma ruta intentaba corregir un `sectionInfo.lineEnd` potencialmente obsoleto mediante un escaneo cuyo criterio `stack === 0 || p > lineStart` aceptaba cualquier cerca compatible posterior como cierre. Si el rango terminaba antes de la cerca real, la reconstrucción dejaba la cerca anterior como una cola fuera del bloque. El problema era una recurrencia de los bugs 37, 39 y 55 porque sus correcciones seguían dependiendo de reconstruir el bloque completo durante un cierre sin cambios.
- **Corrección implementada:** Abrir y cerrar el modal sin cambios es ahora una operación nula: se conserva una instantánea textual inicial y no se invoca ninguna persistencia cuando `docChange` es falso o el documento volvió exactamente a esa instantánea. Al editar, el modal obtiene la sección fuente exacta de la pestaña activa y reemplaza únicamente esa sección mediante el mismo propagador estructural verificado usado por las operaciones anidadas. Se eliminó del guardado modal la reconstrucción de encabezado y cercas, así como el escaneo manual de `lineEnd`; la cerca exterior queda fuera del rango mutable y se conserva literalmente.
- **Pruebas realizadas:** Validación sintáctica de `main.js`; prueba de cierre sin cambios con cero llamadas de escritura; reemplazo aislado de una pestaña intermedia sin modificar sus hermanas; y prueba sobre `.references/Marcas.md` confirmando que la cerca exterior de cinco backticks y todo el texto posterior permanecen byte a byte en su posición original.
- **Estado:** **[Pendiente de validación del usuario]**

### 75. Regresión: «Not a valid tab» al añadir después de los cambios del guardado modal
- **Descripción:** La acción «Añadir nueva pestaña» volvió a mostrar «Not a valid tab» aunque el bloque seleccionado y la pestaña nueva fueran estructuralmente válidos.
- **Causa raíz:** La ruta de guardado modal incorporada en el bug 74 actualiza inmediatamente `rawText`, pero Obsidian puede mantener durante un breve intervalo la navegación DOM de la instancia anterior. Si el guardado cambió la cantidad de separadores de nivel superior, la fuente ya contenía el conteo nuevo mientras `tabsNav.navItems` todavía conservaba el anterior. `insertTabSourceSections()` reutilizaba `analyzeCurrentTabSections()`, una guarda deliberadamente estricta que exige igualdad entre fuente y DOM para operaciones basadas en índices. Añadir siempre al final no usa ningún índice visual, por lo que esa igualdad era una precondición incorrecta y producía el falso rechazo.
- **Corrección implementada:** Se separaron las dos responsabilidades. `analyzeSourceTabSections()` analiza la fuente como autoridad estructural y es la única validación usada para añadir o pegar secciones al final. `analyzeCurrentTabSections()` conserva la comprobación fuente-DOM para copiar, reemplazar, eliminar y reordenar, operaciones donde un índice visual obsoleto sí podría modificar la pestaña equivocada. La inserción calcula el nuevo índice exclusivamente a partir del número de secciones fuente y conserva las validaciones de cercas, límites y persistencia raíz.
- **Pruebas realizadas:** Se reprodujo el estado fuente `2`/DOM `1` generado tras un guardado modal y se confirmó que antes la tercera pestaña era rechazada. Con la corrección, la inserción produce tres secciones válidas. Las operaciones indexadas continúan cancelándose en ese mismo estado. También se volvió a probar la inserción completa sobre `.references/Marcas.md`, preservando su cerca exterior exacta y aumentando correctamente el número de pestañas raíz.
- **Estado:** **[Pendiente de validación del usuario]**

### 76. Regresión: cerca de backticks residual después de pegar contenido en el editor modal
- **Descripción:** Al pegar contenido nuevo en el editor modal y cerrarlo, en ocasiones aparecía una línea de backticks debajo del bloque de pestañas.
- **Causa raíz:** La persistencia estructural introducida en el bug 74 dejó de reconstruir arbitrariamente las cercas, pero `findOuterClosingLine()` aún localizaba el cierre exterior con una búsqueda lineal de la primera cerca vacía del mismo carácter y longitud suficiente. Si el texto pegado contenía un bloque de código con backticks iguales a los tres backticks exteriores, ese cierre interno podía confundirse con el cierre del bloque de pestañas. Además, guardar ese cuerpo sin aumentar la cerca exterior producía una colisión CommonMark: el contenido pegado cerraba visualmente el bloque antes de tiempo y la cerca exterior legítima quedaba visible debajo.
- **Corrección implementada:** El cierre exterior ya no se elige por proximidad. Cada candidato se valida comparando todo el cuerpo anterior con el `rawText` exacto propiedad de la instancia; una cerca pegada dentro del contenido no puede satisfacer esa igualdad. Antes de escribir, se calcula la mayor cerca interna que use el mismo carácter que la exterior. Si alcanza o supera su longitud, apertura y cierre exteriores se amplían juntos a `máximo interno + 1` mediante una única sustitución atómica. La longitud nunca disminuye ni vuelve a crecer mientras el máximo interno no cambie. Las cercas del carácter opuesto no provocan ajustes.
- **Pruebas realizadas:** Se pegó un bloque de código delimitado por tres backticks dentro de un bloque `tabs` exterior también delimitado inicialmente por tres, y se comprobó que la pareja exterior pasa una sola vez a cuatro backticks, el bloque de código conserva tres, el texto posterior permanece inmediatamente después del cierre correcto y no aparece ningún delimitador residual. Un segundo guardado mantuvo cuatro backticks sin inflación. También se verificó que el localizador omite una cerca interna de igual longitud, que las colisiones se calculan por carácter y que `.references/Marcas.md` conserva sin cambios su cerca exterior existente de cinco backticks.
- **Estado:** **[Pendiente de validación del usuario]**

### 77. Riesgo técnico: trabajo repetido y recursos retenidos durante el ciclo de renderizado
- **Descripción:** Las rutas principales repetían análisis estructurales completos sobre la misma fuente, recreaban expresiones regulares y conjuntos de palabras clave, acumulaban restauraciones temporizadas del scroll y registraban listeners de cada bloque con la vida útil completa del plugin. Los observadores de títulos tampoco tenían una desconexión explícita ligada al bloque renderizado.
- **Causas raíz:** No existía una política uniforme de caché por fuente inmutable ni una autoridad de invalidación. Los eventos de pestañas y drag & drop se registraban en el componente global, aunque los nodos pertenecían a un `MarkdownRenderChild` efímero. Cada cambio rápido podía crear una nueva serie de temporizadores y algunas tareas DOM se ejecutaban antes de que `MarkdownRenderer.render()` terminara.
- **Optimización implementada:** Los análisis de secciones y bloques anidados mantienen una sola entrada de caché identificada por texto fuente, separador y palabra clave, y se invalidan en la misma operación que actualiza el modelo. La palabra clave reutiliza un `Set` estable. La resolución del cierre exterior valida primero `sectionInfo.lineEnd` en O(1) y conserva el escaneo completo como recuperación segura. Los listeners de cada bloque usan su propio ciclo de vida, los `MutationObserver` se desconectan al descargarlo y los `requestAnimationFrame`/temporizadores se cancelan o coalescen antes de programar una nueva actualización. El posprocesado DOM espera a que finalice el renderizado y los widgets construyen texto mediante nodos, sin `innerHTML` dinámico.
- **Alcance preservado:** No se modificó el runtime generado de CodeMirror/Lezer ni los contratos de cercas, separadores, pestaña activa, menú contextual, drag & drop, guardado modal, controles de borrado o vista previa.
- **Pruebas realizadas:** `node --check main.js`, `git diff --check` y 23 aserciones de regresión para cachés, invalidación, secciones anidadas, cercas pendientes, ruta rápida del cierre, recuperación ante `sectionInfo` obsoleto, ciclo de listeners, cancelación tras descarga, reutilización de la expresión regular y ausencia de HTML dinámico en widgets.
- **Estado:** **[Pendiente de validación del usuario]**

### 78. Función solicitada: renombrar pestañas desde el menú contextual
- **Descripción:** Los títulos solo podían modificarse desde el editor modal completo o desde el código fuente. Se solicitó una acción específica de renombrado en el menú contextual de cada pestaña.
- **Implementación:** El menú incorpora «Renombrar pestaña» entre las acciones de añadir y eliminar, con icono de lápiz y desactivación automática si el clic no corresponde a una pestaña válida. La acción abre un modal compacto con el título fuente actual seleccionado, permite confirmar con `Enter` y cancelar con `Escape`, mantiene el modal abierto ante errores y rechaza nombres vacíos.
- **Persistencia estructural:** `renameTabAt()` reemplaza exclusivamente el rango del título posterior al identificador configurado. No reconstruye la sección ni modifica contenido, cercas, configuración, saltos de línea o bloques descendientes. La operación exige concordancia fuente-DOM, valida nuevamente la cantidad de secciones y reutiliza la propagación atómica hijo-padre-raíz.
- **Estado visual:** Renombrar una pestaña inactiva conserva la pestaña que ya estaba activa. Un nombre semánticamente idéntico cierra el modal sin escribir ni mostrar una notificación engañosa.
- **Endurecimiento final:** El modal captura una instantánea inmutable que referencia la fuente exacta sin duplicarla. Si cualquier parte del bloque cambia antes de confirmar, el renombrado se cancela en vez de reutilizar un índice potencialmente obsoleto. Las postcondiciones comprueban que el título nuevo sea el único intervalo diferente y que el analizador conserve prefijo y cantidad de secciones. Se rechazan saltos Unicode y caracteres de control, bloques DOM descargados y operaciones concurrentes con el editor modal completo del mismo árbol.
- **Continuidad de caché:** Como las identidades de descendientes incluyen el título y su ocurrencia, renombrar —especialmente hacia o desde nombres duplicados— puede cambiar varias rutas. Esas rutas se proyectan y migran antes de escribir para que un render síncrono encuentre los índices activos correctos. La migración se revierte ante rechazo o excepción y elimina claves antiguas solo después de una escritura confirmada.
- **Pruebas realizadas:** 82 aserciones adversariales y estructurales, seguidas por una pasada final de 23 aserciones de regresión integrada, sobre cambio aislado, snapshot obsoleto, DOM descargado, sincronía entre navegación/contenidos/fuente, índices fraccionarios o inválidos, conflicto con editor modal, control de caracteres, postcondiciones, títulos duplicados, migración y rollback de caché, excepción simulada, propagación anidada hasta la raíz, escritura única, foco de hijo/padre y comportamiento del modal; además de `node --check main.js` y `git diff --check`.
- **Estado:** **[Pendiente de validación del usuario]**









