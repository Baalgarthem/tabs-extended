import assert from 'node:assert/strict';
import { tabsExtendedAnalyzeTabSections, tabsExtendedTabTitleSourceRange } from '../src/core/parser.js';
import { augmentContentWithDocumentDefinitions, extractReferenceDefinitions } from '../src/links/index.js';

export function runIntegrationTests() {
  console.log('--- Running Integration Tests ---');

  const fullAcademicDoc = `
# Derecho del Comercio Exterior

~~~tabs
tema:Dumping
El **dumping** consiste en introducir mercancías al mercado de otro país a un precio inferior a su **valor normal**. La Ley de Comercio Exterior mexicana utiliza técnicamente la expresión **discriminación de precios** para esta conducta. ([Cámara de Diputados][1])

> [!law] Ley de Comercio Exterior · artículo 30
> La importación en condiciones de discriminación de precios consiste en introducir mercancías al territorio nacional a un precio inferior a su valor normal. El artículo 31 toma como referencia, en principio, el precio comparable de una mercancía idéntica o similar destinada al mercado interno del país de origen en operaciones comerciales normales. ([Cámara de Diputados][1])

Por ello, no basta con observar que una mercancía extranjera es **barata**. La cuestión jurídica es comparativa: debe determinarse su precio de exportación y establecerse el valor normal conforme a las reglas aplicables.
* Precio de exportación: Precio relacionado con la mercancía que ingresa al mercado mexicano.
* Valor normal: Referencia jurídica con la que se compara el precio de exportación.
* Discriminación: Existe cuando el precio de exportación resulta inferior al valor normal.
* Daño: Para la imposición ordinaria de medidas deben acreditarse los requisitos de afectación a la producción nacional previstos legalmente.

La estructura puede expresarse como una regla: **si una mercancía se exporta a México por debajo de su valor normal → existe discriminación de precios → si además se actualizan el daño y la relación causal exigidos legalmente → puede imponerse una cuota compensatoria después de la investigación correspondiente**. ([Cámara de Diputados][1])

> [!warning] Precio bajo
> Un precio extranjero inferior al de productos mexicanos **no demuestra por sí mismo dumping**. La comparación relevante se realiza frente al **valor normal** determinado conforme a la legislación, no simplemente frente al precio de los competidores nacionales.

tema:Subvención
La **subvención** responde a una estructura distinta. En el marco de la Organización Mundial del Comercio, existe cuando se actualizan los elementos previstos por el Acuerdo sobre Subvenciones y Medidas Compensatorias, entre ellos una contribución financiera atribuible al gobierno o a un organismo público y la existencia de un beneficio para su receptor. ([Organización Mundial del Comercio][2])

La contribución gubernamental puede adoptar diferentes formas y no se limita a entregar dinero directamente.
* Transferencia: El gobierno puede otorgar fondos mediante aportaciones, préstamos u otras operaciones comprendidas por las normas.
* Garantía: Puede asumir potencialmente determinadas obligaciones financieras.
* Ingreso público: Puede renunciar a ingresos que normalmente habría recaudado, como determinados incentivos fiscales.
* Bienes o servicios: Puede proporcionar bienes o servicios distintos de infraestructura general o efectuar determinadas compras.
* Intermediación: Puede encomendar o dirigir a un organismo privado para realizar funciones comprendidas por la disciplina de subvenciones. ([Organización Mundial del Comercio][4])

Este último supuesto introduce una precisión importante. El **carácter estatal no exige necesariamente que el dinero pase directamente de una dependencia gubernamental a una empresa**. La normativa internacional contempla situaciones en las que el gobierno encomienda o dirige a una entidad privada para ejecutar determinadas funciones. Lo decisivo es que exista la conexión gubernamental jurídicamente requerida. ([Organización Mundial del Comercio][4])

> [!warning] Conducta privada
> Una conducta exclusivamente privada, sin atribución al gobierno u organismo público en los términos correspondientes, no constituye por sí misma una contribución financiera gubernamental para efectos del Acuerdo sobre Subvenciones y Medidas Compensatorias. ([Organización Mundial del Comercio][5])

La regla jurídica queda entonces estructurada así: **si existe una intervención financiera atribuible al Estado → ésta confiere un beneficio → y se satisfacen los demás requisitos aplicables → puede existir una subvención jurídicamente relevante → si las importaciones subvencionadas causan el daño exigido → el Estado importador puede adoptar una medida compensatoria después de la investigación correspondiente**. ([Organización Mundial del Comercio][2])

tema:Distinción jurídica
*Dumping* y subvención pueden producir una **ventaja competitiva en el comercio internacional**, pero no deben confundirse porque la fuente de esa ventaja es diferente.

| Criterio | Dumping | Subvención |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| Origen | Conducta comercial empresarial | Intervención atribuible al Estado |
| Elemento central | Precio de exportación inferior al valor normal | Contribución o intervención gubernamental que confiere un beneficio |
| Carácter | Principalmente privado | Estatal |
| Investigación | Determina discriminación de precios, daño y causalidad | Determina subvención, daño y causalidad |
| Respuesta | Cuota compensatoria derivada de dumping | Cuota compensatoria frente a importaciones subvencionadas |

La diferencia puede memorizarse desde el **origen de la ventaja**:
**Empresa modifica su conducta de precios → dumping.**
**Estado proporciona una ventaja jurídicamente calificable → subvención.**

Sin embargo, el derecho no sanciona automáticamente cualquier precio bajo ni cualquier ayuda estatal. Deben acreditarse los elementos establecidos por la legislación mediante el procedimiento correspondiente.

> [!law] Ley de Comercio Exterior · artículos 28-30
> En México, las importaciones en condiciones de discriminación de precios o de subvenciones que causen daño a una rama de producción nacional se consideran prácticas desleales de comercio internacional. Su existencia, el daño, la relación causal y las cuotas compensatorias se determinan mediante una investigación administrativa. ([Cámara de Diputados][1])
~~~

[1]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LCE.pdf
[2]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm
[4]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm#article1
[5]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm#article1.1a1iv
[^1]: Ley de Comercio Exterior DOF.
`;

  // Step 1: Extract tabs block body and analyze sections
  const tabsBody = fullAcademicDoc.split('~~~tabs\n')[1].split('\n~~~')[0];
  const analysis = tabsExtendedAnalyzeTabSections(tabsBody, 'tema:', {});
  assert.ok(analysis);
  assert.equal(analysis.sections.length, 3);
  console.log('✓ Academic note sections parsed (3 tabs)');

  // Step 2: Test tab renaming simulation on tab 0, 1, 2
  for (let i = 0; i < analysis.sections.length; i++) {
    const range = tabsExtendedTabTitleSourceRange(tabsBody, 'tema:', analysis, i);
    assert.ok(range);
    assert.ok(range.title.length > 0);
  }
  console.log('✓ Academic note title ranges resolved accurately');

  // Step 3: Extract definitions and verify propagation to tab 1
  const tab1Text = tabsBody.slice(analysis.sections[0].from, analysis.sections[0].to);
  const mockApp = {
    workspace: {
      getActiveViewOfType: () => ({
        file: { path: 'academic.md' },
        editor: { getValue: () => fullAcademicDoc }
      })
    }
  };
  const augmentedTab1 = augmentContentWithDocumentDefinitions(tab1Text, mockApp, { sourcePath: 'academic.md' }, { rawText: fullAcademicDoc });
  assert.ok(augmentedTab1.includes('[1]: https://www.diputados.gob.mx/LeyesBiblio/pdf/LCE.pdf'));
  assert.ok(augmentedTab1.includes('[2]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm'));
  assert.ok(augmentedTab1.includes('[4]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm#article1'));
  assert.ok(augmentedTab1.includes('[5]: https://www.wto.org/spanish/docs_s/legal_s/24-scm_01_s.htm#article1.1a1iv'));
  assert.ok(augmentedTab1.includes('[^1]: Ley de Comercio Exterior DOF.'));
  console.log('✓ Academic note definitions injected into Tab 1 correctly');

  console.log('All Integration tests passed!\n');
}
