# Comportamiento esperado

Este documento define las invariantes únicas del plugin. Cada comportamiento debe tener una sola autoridad lógica; ninguna capa secundaria puede contradecirlo, duplicarlo o corregirlo de forma tardía.

## 1. Bloque de pestañas anidado activo

- El bloque activo es exclusivamente el bloque de pestañas anidado más profundo que contiene la posición principal del cursor.
- La regla es idéntica para bloques horizontales (`tabs`) y verticales (`tabs-v`).
- Mientras el cursor esté dentro del bloque activo, incluido cualquiera de sus dos delimitadores, el texto fantasma de su cerca de apertura y el de su cerca de cierre se muestran en negrita.
- Solo las dos cercas del bloque activo reciben el estado visual activo.
- Si el cursor está dentro de un bloque hijo, las cercas del padre no se muestran en negrita.
- Si el cursor sale del hijo pero permanece dentro del padre, el hijo pierde inmediatamente la negrita y la reciben únicamente las cercas del padre.
- Si el cursor sale de todos los bloques anidados, ningún texto fantasma de cerca permanece en negrita.
- Un cambio exclusivo de cursor o selección solo puede cambiar cuál par de cercas está activo; nunca puede eliminar colores, widgets, texto fantasma, protecciones ni controles.

## 2. Cursor lógico y cursor visual

- CodeMirror es la única autoridad de la posición del cursor; el caret nativo del `contenteditable` no debe mostrarse ni competir con él.
- Todo cursor o rango entregado al editor modal debe proceder de la misma instancia de `EditorSelection` que su `EditorState` y su `EditorView`; nunca se mezclan objetos de runtimes duplicados del bundle.
- Cada edición de un título actualiza el documento y la selección visual en la misma transacción.
- El cursor lógico y el cursor visual permanecen sincronizados al escribir, borrar, reemplazar texto, navegar con el teclado o posicionarse con el mouse.
- El cursor puede colocarse con clic izquierdo en cualquier posición editable válida del editor modal.
- Todos los títulos de separador son completamente clicables, sin importar si pertenecen al bloque principal o a cualquier nivel de anidamiento horizontal o vertical.
- El widget situado al final de un título y su espacio visual no pueden bloquear ni reemplazar la selección por mouse; únicamente el botón de borrado consume su propio evento.

## 3. Identificador de separador

- El identificador configurado, por ejemplo `tema:`, permanece oculto dentro del editor modal.
- Su rango oculto es atómico y no admite el cursor en su interior.
- El primer punto editable del título se encuentra inmediatamente después del identificador.
- La protección termina exactamente al finalizar el identificador; nunca se extiende sobre uno o más caracteres visibles del título.
- Ocultar o proteger el identificador nunca debe alterar el orden de escritura ni la medición visual del cursor.

## 4. Saltos de línea

- `Enter` y `Shift+Enter` nunca se bloquean dentro del editor modal.
- Cada pulsación inserta exactamente un carácter de salto de línea (`\n`).
- Insertar una línea nunca elimina ni modifica cercas, identificadores ocultos, colores, widgets o controles.
- Las flechas de navegación nunca modifican el documento ni insertan líneas.

## 5. Borrado estructural

- La única tecla con bloqueo estructural especial es `Backspace`, incluidas sus variantes `Shift+Backspace` y `Mod+Backspace`.
- El bloqueo ocurre únicamente cuando el borrado dañaría una cerca de apertura, una cerca de cierre, su salto adyacente protegido o un identificador oculto.
- Fuera de esos límites, `Backspace` conserva el comportamiento nativo de CodeMirror.
- `Delete` no posee una política estructural paralela.

## 6. Decoraciones y controles del editor modal

- Un cambio exclusivo de cursor o selección nunca elimina globalmente el formato.
- Los colores por profundidad, el texto fantasma, los iconos de borrado, las protecciones y los controles permanecen montados mientras su estructura exista.
- Las decoraciones estructurales solo se reconstruyen cuando cambia una cerca, un identificador o la topología de líneas; las ediciones ordinarias se mapean incrementalmente.

## 7. Inserción desde la caja de herramientas

- Los botones de pestañas anidadas horizontales y verticales insertan el bloque correspondiente en una única operación.
- El bloque, sus cercas, colores, textos fantasma y controles aparecen inmediatamente sin cerrar y volver a abrir el editor modal.
- Después de insertar, el editor recupera el foco y permite escribir inmediatamente en el primer título.

## 8. Renderizado del bloque de pestañas

- Todo bloque válido `tabs` o `tabs-v` muestra su navegación y contenido en lugar del código fuente sin formato.
- El renderizado no depende de salir y volver a entrar al editor ni de una segunda carga accidental.
- La ausencia o carga tardía de estilos no debe dejar una estructura procesada pero visualmente inutilizable.

## 9. Reordenamiento estructural por arrastre

- Una pestaña se mueve siempre como una unidad formada por su separador, contenido completo y todos sus bloques descendientes.
- El destino solo puede ser otro separador hermano del mismo bloque y nivel de anidación; el arrastre nunca cambia de padre, profundidad u orientación estructural.
- Los límites se calculan sobre el texto fuente mediante una pila de cercas, no mediante posiciones visuales del DOM.
- Reordenar no modifica la palabra clave del bloque, orientación `tabs-v`, configuración, cercas, saltos de línea ni espaciado interno de las secciones.
- Después de cualquier reordenamiento, cada identificador de separador comienza en una línea física propia; dos títulos nunca pueden concatenarse aunque la pestaña movida fuera originalmente la última y no tuviera salto terminal.
- La pestaña arrastrada permanece visible y activa en su nueva posición; el refresco no puede seleccionar una pestaña hermana ni cambiar la pestaña activa de ningún bloque padre.
- En una pestaña anidada, el cambio se propaga por sus padres y produce una sola escritura en el bloque raíz de la nota.
- Si la fuente cambió después de renderizarse o no puede resolverse un rango de forma inequívoca, la operación se cancela sin modificar el documento.

## 10. Menú contextual estructural

- El menú contextual está disponible en pestañas principales y anidadas de cualquier profundidad dentro de una vista editable.
- Insertar y pegar crean exclusivamente pestañas hermanas dentro del bloque donde se abrió el menú; nunca escriben en un padre, hijo o bloque vecino.
- Eliminar quita únicamente la sección seleccionada con todo su contenido y descendientes. La única pestaña de un bloque no puede eliminarse porque dejaría una estructura inválida.
- Copiar obtiene la sección fuente completa sin normalizarla. Pegar una sección copiada conserva su contenido, espaciado, cercas y bloques descendientes, adoptando el nivel y orientación del bloque receptor.
- Toda operación anidada se propaga hasta la fuente raíz mediante una sola escritura verificada y conserva la selección activa de los bloques padres.
- Las estructuras heredadas donde una cerca más larga cierra simultáneamente un bloque y descendientes pendientes deben poder leerse sin confundir el nivel de los separadores. Antes de crear un nuevo hermano se materializan solo las cercas de pestañas faltantes necesarias para que el resultado quede inequívoco.
- Añadir o pegar al final usa el texto fuente como autoridad y no depende del número de elementos DOM, porque no necesita resolver un índice visual existente.
- Copiar, reemplazar, eliminar y reordenar mantienen una validación adicional entre fuente y DOM; si los índices visuales están temporalmente obsoletos, esas operaciones se cancelan sin modificar la nota.

## 11. Persistencia del editor modal

- Abrir y cerrar el editor modal sin modificar su documento es una operación nula: no escribe, normaliza ni reconstruye ninguna parte de la nota.
- Si una edición se deshace y el texto vuelve exactamente al estado inicial del modal, el cierre tampoco modifica la fuente.
- Una edición real reemplaza únicamente la sección fuente de la pestaña activa. Las pestañas hermanas, la configuración del bloque y sus cercas exteriores se conservan literalmente.
- La cerca exterior permanece fuera del rango editable. Normalmente se conserva de forma literal; solo puede aumentar si el contenido nuevo contiene una cerca del mismo carácter cuya longitud colisionaría con ella.
- Ante una colisión, la apertura y el cierre exteriores se actualizan juntos, en una sola escritura, a una longitud estrictamente mayor que cualquier cerca interna del mismo carácter. Nunca puede quedar una cerca anterior como residuo debajo del bloque.
- La longitud exterior no disminuye y no vuelve a crecer en guardados posteriores mientras no aparezca una cerca interna más larga.
- Toda edición de una pestaña anidada se propaga por la misma ruta estructural hijo-padre-raíz y produce una sola escritura verificada en el cuerpo del bloque raíz.
- Si la sección activa o su ruta hasta la raíz no pueden resolverse de forma inequívoca, el guardado se cancela sin modificar la nota.

## 12. Ciclo de vida, cachés y trabajo diferido

- Todo listener, observador, cuadro de animación o temporizador creado para un bloque renderizado termina como máximo al descargarse su `MarkdownRenderChild`.
- Una interacción nueva puede reemplazar trabajo visual pendiente equivalente; no puede acumular cadenas independientes de restauración de scroll o medición de títulos.
- Un resultado estructural cacheado solo es reutilizable cuando coinciden exactamente el texto fuente y todos los parámetros que afectan al análisis.
- La misma operación que cambia `rawText` o el contenido de una pestaña invalida sus cachés antes de que otra operación pueda consultarlos.
- Las cachés estructurales conservan como máximo una versión anterior por instancia; nunca crecen con el historial de ediciones.
- Una optimización no puede sustituir validación estructural por confianza ciega: las fronteras rápidas se verifican y, si quedaron obsoletas, se ejecuta la recuperación completa o se cancela la escritura.
- El trabajo que depende del DOM generado por Markdown se ejecuta después de terminar el renderizado correspondiente.

## 13. Renombrado contextual de pestañas

- «Renombrar pestaña» está disponible mediante clic derecho sobre cualquier pestaña raíz o anidada de una vista editable.
- El modal compacto obtiene el nombre desde la fuente, lo muestra seleccionado y permite confirmar con `Enter` o cancelar con `Escape`.
- Un nombre vacío o con saltos de línea nunca se persiste. Confirmar el mismo nombre es una operación nula.
- El renombrado reemplaza únicamente el título posterior al identificador configurado; conserva literalmente contenido, descendientes, cercas, configuración y saltos de línea.
- Renombrar una pestaña no activa otra pestaña ni cambia la selección de sus bloques padres.
- La operación se cancela sin modificar la nota si el índice seleccionado no puede relacionarse inequívocamente con su sección fuente.
- La fuente completa observada al abrir el modal forma parte de la precondición: si cambia antes de confirmar, el usuario debe reabrir el renombrado sobre la versión nueva.
- El editor modal completo y el modal de renombrado nunca pueden escribir concurrentemente sobre el mismo árbol de pestañas.
- Si el nuevo título cambia las identidades derivadas de bloques descendientes, todos sus estados activos se migran antes de escribir y se revierten íntegramente si la escritura falla.
- Las postcondiciones verifican que todo byte situado fuera del rango del título permanezca idéntico.
