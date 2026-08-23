# Auditoría de optimización

## Alcance

La auditoría cubre las rutas propias que procesan, renderizan y editan bloques `tabs` y `tabs-v`: análisis de fuente, renderizado de títulos y contenidos, navegación, drag & drop, menú contextual, persistencia estructural y editor modal. El runtime compacto de CodeMirror/Lezer se considera código generado de terceros y queda fuera de las refactorizaciones manuales.

## Criterios aplicados

1. El ciclo de vida del recurso debe coincidir con el componente que lo posee.
2. El texto fuente es inmutable durante un análisis; sus resultados pueden reutilizarse únicamente con una clave exacta.
3. Toda caché necesita una invalidación explícita y capacidad acotada.
4. El trabajo visual repetido dentro del mismo cuadro debe coalescerse.
5. Una ruta rápida estructural siempre debe validar su candidato y mantener una recuperación correcta.
6. Las APIs DOM de texto son preferibles a parsear HTML cuando no se necesita marcado arbitrario.
7. Las optimizaciones no pueden cambiar las invariantes funcionales documentadas en `comportamiento_esperado.md`.

## Fuentes técnicas consultadas

- Obsidian, eventos de plugins: https://docs.obsidian.md/Plugins/Events
- Obsidian, decoraciones del editor: https://docs.obsidian.md/Plugins/Editor/Decorations
- Obsidian, interfaz `Editor`: https://docs.obsidian.md/Plugins/Editor/Editor
- MDN, `MutationObserver.disconnect()`: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
- MDN, `requestAnimationFrame()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
- MDN, `cancelAnimationFrame()`: https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelAnimationFrame
- MDN, `Node.textContent`: https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
- MDN, `Element.innerHTML`: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
- MDN, `Map`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

## Cambios aplicados

- Caché de una entrada para palabras clave, análisis de secciones y bloques anidados.
- Invalidación atómica de cachés junto con cada actualización fuente.
- Candidato O(1) validado para el cierre exterior y escaneo de recuperación ante metadatos obsoletos.
- Listeners asociados al `MarkdownRenderChild`, con desconexión explícita de observadores.
- Coalescencia y cancelación de cuadros y temporizadores de presentación.
- Posprocesado dependiente de Markdown encadenado a la finalización del renderizado.
- Expresión regular estructural del modal compilada una sola vez por instancia.
- Construcción segura de widgets con nodos de texto en lugar de `innerHTML`.

## Validación

- `node --check main.js`.
- `git diff --check`.
- Veintitrés aserciones de regresión sobre reutilización e invalidación de cachés, análisis de secciones, anidamiento, cercas pendientes, resolución del cierre exterior, listeners, cancelación tras descarga, expresión regular compartida y construcción DOM.
- Pendiente: validación interactiva y de larga duración en Obsidian por parte del usuario.
