# Arquitectura AST y Anidamiento Infinito de Tabs
## Estado: ✅ Implementado y Documentado

---

## 1. El Concepto del Árbol de Sintaxis Abstracta (AST)

El problema central del anidamiento infinito es que los separadores (`tema:`) de un bloque hijo pueden "fugarse" y ser leídos erróneamente por el bloque padre.

Para evitar esto, el plugin usa una arquitectura **AST basada en Pilas (Stack)** tanto en la Vista de Lectura como en la Vista de Editor (CodeMirror 6).

---

## 2. Reglas de la Pila (`fenceStack`)

Cada línea del documento se evalúa contra la pila activa:

| Caso | Resultado |
|---|---|
| Línea es apertura de `tabs` (`~~~tabs`) | Se empuja a la pila como `type: "tabs"` |
| Línea es apertura de código normal (`~~~python`) | Se empuja como `type: "code"` |
| Línea es cierre válido (misma longitud, sin `info`) | Se saca (`pop`) el último elemento |
| Línea contiene separador (`tema:`) Y la pila está vacía (o en modo modal) | Se evalúa como separador de pestaña activo |
| Línea contiene separador PERO la pila tiene un elemento activo | Se **ignora** → Hermetismo garantizado |

### Candado 1: Cierre Estricto
Para que una marca de código sea un **cierre** válido, debe cumplir:
- Longitud ≥ al elemento en la cima de la pila
- Mismo carácter de apertura (`\`` o `~`)
- Sin texto adicional (`info === ""`)

Si la línea dice `` ```tabs `` nunca cerrará un bloque, sino que abrirá uno nuevo.

### Candado 2: Hermetismo de Separadores
Los separadores solo se procesan si la pila de `tabs` está en nivel cero dentro del contexto actual. Cualquier separador dentro de un bloque de código interno es completamente ignorado.

---

## 3. La Ley de la Longitud del Bloque (Limitación CommonMark)

Obsidian procesa los bloques de código **antes** de entregarlos al plugin. Aplica la especificación CommonMark estándar.

**Regla de Oro:** El bloque contenedor exterior DEBE tener más caracteres de apertura que los bloques internos.

### ❌ Roto (misma longitud)
```markdown
~~~tabs
tema:Padre
~~~tabs
tema:Hijo
~~~
~~~
```
Obsidian cierra el bloque padre en el primer `~~~`. El plugin nunca recibe el texto completo.

### ✅ Correcto (padre N+1)
```markdown
~~~~tabs
tema:Padre

~~~tabs
tema:Hijo 1
~~~

tema:Siguiente Padre

~~~tabs
tema:Hijo 2
~~~
~~~~
```

---

## 4. Jerarquía de Contenedores Recomendada

La regla es simple: **cada nivel padre debe tener un backtick más que su hijo**.

| Nivel | Delimitador | Descripción |
|---|---|---|
| 0 (Raíz) | `` ```tabs `` (3 backticks) | Bloque principal en la nota |
| 1 | `````tabs ` (5 backticks) | Padre del nivel 0 |
| 2 | `` ````tabs `` (4 backticks) | Padre del nivel 1 |
| 3 | `` ```tabs `` (3 backticks) | Hijo del nivel 2 |
| 4 | `~~~~tabs` (4 tildes) | Hijo del nivel 3 |
| 5 | `~~~tabs` (3 tildes) | Hijo del nivel 4 |

> **Nota**: Backticks y tildes son intercambiables en CommonMark, pero NO se pueden mezclar en la misma pareja de apertura/cierre.

---

## 5. Sistemas de Auto-Corrección Implementados

### 5.1 `formatTabsHierarchy(text)` — Método del Plugin

Función AST pura que recibe el texto de un bloque de pestañas y reescribe automáticamente todas las longitudes de cercas para garantizar la jerarquía.

**Algoritmo:**
1. Recorre el texto línea a línea usando una pila idéntica a la del editor.
2. Registra todos los pares `{ openIdx, closeIdx, depth }`.
3. Calcula `maxDepth` del árbol.
4. Reescribe: `newFenceLength = maxDepth - depth + 3` (hoja = 3, raíz = max+3).

### 5.2 Botón ✨ en la Interfaz del Editor (Live Preview)

El botón `✨` aparece junto al botón 🗑️ en la línea de apertura de cada bloque de pestañas raíz.

- Al hacer clic, extrae el texto del bloque completo (desde el primer backtick hasta el cierre coincidente).
- Ejecuta `formatTabsHierarchy(blockText)`.
- Reescribe el bloque corregido en el editor con un solo `dispatch()`.
- Muestra una `Notice` informando si hubo correcciones o si ya estaba perfecto.

### 5.3 Inserción Inteligente (`convert-to-tabs`)

El comando de Obsidian para insertar un bloque de pestañas ahora es **consciente de la profundidad del cursor**:

1. Obtiene la vista CM6 activa (`view.editor.cm`).
2. Recorre el documento desde la línea 1 hasta la línea del cursor, construyendo el AST stack.
3. Determina `cursorDepth` (número de bloques `tabs` que envuelven el cursor).
4. Calcula `newFenceLen = parentFenceLen - 1` (mínimo 3).
5. Inserta el bloque con la longitud de cerca correcta automáticamente.

**Resultado:** Si el cursor está dentro de un bloque de 5 backticks, el comando insertará un bloque de 4. Si está en raíz, inserta 3.

---

## 6. Discrepancia entre Vistas

| Vista | Engine | Comportamiento |
|---|---|---|
| **Reading View** | Parser nativo Obsidian + CommonMark | Recibe el texto ya cortado. Si el usuario usa el mismo nivel de delimitador para padre e hijo, Obsidian rompe el bloque antes de entregarlo al plugin. |
| **Live Preview (Editor)** | CodeMirror 6 + `nestedTabsHighlighter` | Recibe texto crudo completo. El AST stack es más tolerante e ignora bloques de código intermedios. |

---

## 7. Troubleshooting

### Síntoma: Un separador hijo aparece en la pestaña padre
**Causa probable:** El usuario usó el mismo nivel de delimitador para padre e hijo.
**Diagnóstico:** Verificar en el editor si el bloque padre y el hijo tienen la misma cantidad de backticks.
**Solución:** Usar el botón ✨ para corregir automáticamente la jerarquía.

### Síntoma: Aparece un bloque de código vacío después de un bloque de pestañas
**Causa probable:** El cierre del bloque hijo (`~~~`) es interpretado por Obsidian como cierre del padre, dejando el texto siguiente como un bloque huérfano.
**Solución:** Mismo que arriba — corregir jerarquía con ✨.

### Síntoma: `\r\n` (Windows line endings) rompe la detección de separadores
**Estado:** ✅ Resuelto. El parser usa `/\r?\n/` para sanitizar retornos de carro.
