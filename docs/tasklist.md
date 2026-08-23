# Lista de Tareas (Tasklist)

Este documento rastrea el progreso de las peticiones y las solicitudes de nuevas características.

> **Nota importante:** Según las reglas de desarrollo, el agente solo marcará una tarea como completada ([x]) cuando el usuario lo indique explícitamente.

## Tareas Solicitadas

- [ ] Validar «Renombrar pestaña» mediante clic derecho en pestañas raíz y anidadas horizontales/verticales: título preseleccionado, `Enter`, `Escape`, rechazo de vacío, Markdown y nombres duplicados, conservación del contenido, permanencia de pestañas activas descendientes y cancelación segura si la nota cambia mientras el modal está abierto.
- [ ] Validar que «Renombrar pestaña» no pueda competir con el editor modal completo del mismo bloque y muestre la explicación correspondiente sin modificar la nota.
- [ ] Validar la versión 1.8.28 en una nota extensa durante una sesión prolongada: alternar pestañas, reordenar, abrir/cerrar el modal, editar títulos anidados y navegar rápidamente, confirmando que memoria, scroll, foco, controles y renderizado permanecen estables.
- [ ] Validar que pegar bloques de código con tres o más backticks dentro del editor modal y cerrarlo conserve el contenido, ajuste una sola vez la cerca exterior cuando sea necesario y nunca deje backticks debajo del bloque de pestañas.
- [ ] Validar que «Añadir nueva pestaña» funcione antes y después de usar el editor modal, incluido el intervalo inmediatamente posterior a crear manualmente otro separador, sin mostrar «Not a valid tab» y sin debilitar las guardas de eliminar o reordenar.
- [ ] Validar en Obsidian que abrir el editor modal con doble clic y cerrarlo sin editar no cambie ningún carácter de la nota ni genere backticks fuera del bloque; repetir también después de editar y deshacer hasta recuperar el texto inicial.
- [ ] Validar insertar, eliminar, copiar y pegar mediante clic derecho en pestañas raíz y anidadas de varias profundidades, incluido el bloque heredado reproducido en `.references/Marcas.md`, confirmando que cada operación permanezca en el bloque y nivel seleccionados y preserve todos sus descendientes.
- [ ] Validar que, después de reordenar una pestaña en cualquier nivel, la pestaña arrastrada continúe visible y activa y ninguno de sus bloques padres cambie de selección.
- [ ] Validar el reordenamiento por arrastre de pestañas principales y anidadas horizontales/verticales, incluido mover la última pestaña a una posición intermedia, confirmando que cada separador permanezca en su propia línea, que cada sección conserve su contenido y descendientes y que nunca cambie de padre o nivel.
- [ ] Validar que la sección de colores por nivel de anidación muestre en español su encabezado, descripción y los textos correspondientes a los niveles 0, 1, 2, 3, 4 y 5 o superiores.
- [ ] Validar rendimiento, memoria y navegación tras optimizar `nestedTabsHighlighter` y el filtro de transacciones.
- [ ] Validar que `ModalSelection` mantenga visible el cursor en `tema:|Título` mediante flechas, clic, `Home`, escritura, `Enter` e inserción desde la barra, sin errores de coordenadas ni selecciones indefinidas.
- [ ] Validar que un clic simple coloque el cursor en cualquier carácter visible de todos los separadores raíz y anidados, incluidos inicio, centro y final del título, sin interferir con las papeleras.
- [ ] Validar la invariante del bloque activo: negrita solo en los textos fantasma de las dos cercas del bloque anidado más profundo, transferencia al padre al salir del hijo y ausencia de negrita fuera de todos los bloques.
- [ ] Validar el mapeo incremental de decoraciones al escribir contenido normal y la reconstrucción completa al editar cercas o separadores.
- [x] Validar que `ArrowUp` y `ArrowDown` conserven el formato al partir del inicio editable de un separador en el editor modal (confirmado por el usuario).
- [ ] Validar que el cursor permanezca visible y parpadeando en el límite entre el prefijo oculto y el título de un separador.
- [ ] Validar escritura inmediata después de insertar un bloque anidado vertical u horizontal desde la barra del editor modal.
- [ ] Validar que la escritura rápida al inicio de un título mantenga el orden de los caracteres.
- [ ] Validar que `Enter` y `Shift+Enter` inserten exactamente una línea en contenido, títulos vacíos, inicio/centro/final de títulos y bordes de cercas, sin perder formato.
- [ ] Validar que `Backspace`, `Shift+Backspace` y `Mod+Backspace` protejan cercas e identificadores ocultos y funcionen normalmente fuera de esas fronteras.
- [ ] Validar que el cursor visual avance junto con cada carácter escrito dentro de un título largo.
- [ ] Validar que el manejador autoritativo de clic permita posicionar el cursor al inicio, centro y final de un título `tema:`, incluido un título vacío recién insertado, y que `Shift+clic` extienda la selección.
- [ ] Validar que el `inputHandler` autoritativo mantenga sincronizados cursor lógico y visual al escribir manualmente `tema:`, continuar títulos largos, editar en medio y reemplazar selecciones dentro del título.
- [ ] Validar que los botones horizontal y vertical inserten y decoren inmediatamente los bloques desde contenido, títulos y líneas vacías, sin cerrar el editor modal.
- [ ] Validar que Live Preview vuelva a mostrar navegación, contenido y estilos de los bloques `tabs` y `tabs-v`, incluso si la instalación activa omite accidentalmente `styles.css`.
- [x] Eliminación total del salto de cursor y borrado de texto al escribir sobre la línea contigua a la cerca de cierre (`~~~`).

## Tareas Completadas

- [x] Restauración de todas las decoraciones del editor modal tras corregir la ubicación inalcanzable del cálculo de `activePair` (confirmado por el usuario).
- [x] Corrección del bug de escape de scope en nested tabs (anidación atómica).
- [x] Inserción limpia de pestañas anidadas en el editor modal (separador automático sin título por defecto, cursor listo tras el separador).
- [x] Depuración y retiro del botón "Corregir ATS" (`fixBtn`) y sus dependencias.
- [x] Corrección de la delimitación atómica al eliminar separadores únicos/últimos en bloques anidados.
- [x] Corrección del margen y separación vertical de bloques de código (`pre`) dentro de las pestañas.
- [x] Compatibilidad extendida para ejecuciones multibloque con plugins como `execute-code`.
- [x] Paridad visual 100% idéntica para callouts internos (mismos estilos, temas y bordes que fuera de las pestañas).
- [x] Aislamiento total de DOM y cero interferencia con notas/callouts fuera de las pestañas.
- [x] Soporte completo de compatibilidad visual para callouts nativos y de Callout Manager dentro de las pestañas.
- [x] Resolución de conflicto entre `execute-code` y `Callout Manager` (compatibilidad armónica total).
- [x] Desbloqueo total de botones y controles en el panel de configuración de Callout Manager.
- [x] Auditoría profunda de styles.css para compatibilidad 100% nativa con custom-callouts.
- [x] Restauración de selectores de color e íconos en el panel de configuración de Callout Manager.
- [x] Diagnóstico técnico de causa raíz sobre el reseteo de colores/íconos en Callout Manager.
- [x] Corrección en Callout Manager para preservar colores e íconos seleccionados.
- [x] Separación vertical limpia para bloques de código continuos en la vista previa del editor modal y pestañas.
- [x] Compatibilidad multibloque total con el plugin `execute-code` para botones Run en celdas consecutivas.
- [x] Análisis comparativo de inyección CSS y solución de cero interferencia en tabs-extended para Callout Manager.
- [x] Eliminación de backticks extras fuera del bloque principal al guardar o insertar pestañas anidadas en el editor modal.
- [x] Verificación de compatibilidad total entre la eliminación con botón 🗑️ y el control de backticks en el editor modal.
- [x] Fortalecimiento del backend en `saveEditorData` con escaneo dinámico de `lineEnd` y sincronización de rango para prevenir colas duplicadas y backticks extras.
- [x] Reparación de Undo (Ctrl+Z) y Redo (Ctrl+Y / Ctrl+Shift+Z) en botones y atajos de teclado del editor modal tras eliminaciones con el botón 🗑️.
- [x] Protección inamovible de cercas de pestañas anidadas (`~~~tabs` y `~~~`) contra borrados manuales, con desbloqueo inteligente al pasar el cursor por el botón `🗑️`.
- [x] Bloqueo total e inaccesibilidad por cursor en líneas de cercas (`~~~tabs` y `~~~`) con rebote automático de selección e inmunidad exclusiva para el botón `🗑️`.
- [x] Perfeccionamiento de cercas de cierre (`~~~`) con rebote direccional de cursor, tolerancia de inserción de frontera y relleno estructural de líneas.
- [x] Eliminación total del salto de cursor y borrado de texto al escribir sobre la línea contigua a la cerca de cierre (`~~~`).
- [x] Configuración de palabra clave personalizada (`tabsKeyword`) para bloques de código de pestañas (soporte para `<palabra>` y `<palabra>-v`).
- [x] Incorporación de botones duales en la caja de herramientas del editor modal para insertar pestañas anidadas horizontales y verticales.
- [x] Título inicial independiente para pestañas verticales (`defaultTabNavItemVertical`) en los ajustes y generador de pestañas.
- [x] Restablecimiento de accesos y botón de edición para abrir el editor modal (botón de esquina, menú de clic derecho y doble clic).
- [x] Exención del reconocimiento de virtual-linker exclusivamente en los títulos de pestañas.
