# 8 de noviembre de 2026 · Propuesta de ampliación del catálogo

## Alcance y estado

El usuario señaló menisco lateral discoide y sus procedimientos (meniscectomía, tallado y sutura), y pidió pensar en otros ejemplos. Se revisó el catálogo local `v=43` y referencias clínicas para proponer mejoras de registro. **Esta ampliación es una propuesta: no se modificó código funcional, no se añadieron casos ni se publicó o sincronizó nada durante esta revisión.**

El diagnóstico y la cirugía realizada se registran de forma independiente. Las asociaciones siguientes son ejemplos para evaluar la cobertura del catálogo, no reglas que indiquen una operación o la seleccionen automáticamente.

## Criterios para ampliar

- Separar diagnóstico base, morfología, localización, patrón de lesión, clasificación y procedimiento.
- No usar Discoide como un patrón de rotura: puede coexistir con Radial, Longitudinal u otros patrones registrados.
- Incorporar entidades o gestos que deban contarse por separado; conservar como detalles las variantes que no requieren un procedimiento nuevo.
- Mantener términos habituales y siglas como equivalencias de búsqueda. Antes de crear dos procedimientos potencialmente solapados, acordar cómo se relacionarán para evitar contar dos veces el mismo gesto.
- Mantener vacíos los detalles no informados y permitir varios diagnósticos/procedimientos independientes.

## Menisco lateral discoide

Propuesta de diagnóstico específico en Menisco: Menisco lateral discoide. Detalles candidatos: morfología, estabilidad periférica y patrón de rotura, todos opcionales. El lado de la rodilla sigue siendo un dato del caso; medial/lateral identifica el menisco.

Procedimientos que debe poder registrar: Meniscectomía parcial (ya existe), Meniscoplastia / tallado meniscal (saucerización, falta como opción explícita) y Reparación meniscal (sutura, ya existe). Ejemplo de prueba futura: discoide con rotura y reparación, registrado como Tallado + Sutura. No se presupone que todo discoide se opere ni que todas esas acciones se hayan realizado.

Antes de implementar: acordar si Tallado se mantiene como procedimiento independiente o como subtipo reconocido, y su agrupación con meniscectomía para metas. No se estableció una equivalencia automática entre ambos.

## Otros ejemplos para revisar

| Situación | Qué mejorar en diagnóstico/detalles | Procedimientos que debe permitir registrar | Estado del catálogo local |
| --- | --- | --- | --- |
| Lesión de raíz meniscal | Medial/lateral y raíz anterior/posterior | Reinserción / reparación de raíz meniscal | Diagnóstico genérico existente; falta detalle anatómico y procedimiento explícito. |
| Lesión de rampa | Identificar la lesión sin perder diagnósticos de LCA asociados | Sutura meniscal con detalle de rampa | Diagnóstico y sutura existentes; no requiere necesariamente otro procedimiento. |
| Déficit meniscal tras meniscectomía | Menisco afectado y antecedente de resección | Trasplante meniscal | Procedimiento existente; falta diagnóstico específico. |
| Falla de plastia de LCA | Falla del injerto, inestabilidad y, si se registra, etapa de revisión | Revisión de RLCA; injerto óseo de túneles como gesto identificable si se realizó | Revisión de RLCA existente; faltan diagnóstico y registro explícito de injerto de túneles. |
| Cíclope tras RLCA | Diagnóstico específico, conservando descripción y contexto | Resección de lesión de cíclope | Existe liberación de artrofibrosis genérica; falta nomenclatura específica. |
| Osteocondritis disecante / fragmento osteocondral | Localización y estabilidad del fragmento | Perforaciones; fijación osteocondral; técnicas de injerto según lo realizado | Osteocondritis y varias técnicas de injerto existentes; faltan perforaciones y fijación explícitas. No equiparar fijación osteocondral a reinserción condral. |
| Deformidad en varo/valgo | Eje y nivel de la deformidad, además de la artrosis que pueda coexistir | Osteotomía tibial alta o femoral distal | Procedimientos y detalles de apertura/cierre existentes; falta diagnóstico de deformidad. |
| Rigidez / artrofibrosis | Contexto posquirúrgico, por ejemplo RLCA o PTR | Artrolisis/liberación; movilización bajo anestesia | Artrofibrosis y liberación existentes; falta movilización bajo anestesia. |
| Aflojamiento aséptico / inestabilidad de PTR | Motivo de revisión, sin dejarlo como gonartrosis | Revisión protésica y componentes intervenidos | Cirugías de revisión existentes; faltan diagnósticos y detalles del motivo. |
| Infección periprotésica | Contexto y etapa del tratamiento registrada | DAIR, retiro de componentes con espaciador y reimplantación, como actos diferenciados si se realizaron | Diagnóstico, aseo y recambio de espaciador existentes; las etapas no quedan claramente representadas. |
| Rotura del aparato extensor | Tendón rotuliano o cuadricipital y detalles de lesión | Reparación tendinosa, con tendón identificado | Diagnósticos separados existentes; el procedimiento agrupa ambos tendones. Puede resolverse con un detalle, sin duplicar entradas. |

## Prioridad propuesta

1. Menisco discoide y tallado; raíz meniscal con reinserción específica. Revisar también rampa y déficit meniscal usando lo ya existente.
2. Cíclope y rigidez/artrofibrosis; fijación osteocondral.
3. Fallas de plastia y motivos/etapas de revisión protésica.

Las entidades nuevas, los detalles opcionales y las equivalencias todavía no fueron acordados como catálogo final. No se cambiaron conteos ni metas.

## Fuentes revisadas

- [AAOS / OrthoInfo: Discoid Meniscus](https://www.orthoinfo.org/bodypart/kneelower-leg/discoid-meniscus/): morfología y procedimientos de remodelación, resección y sutura.
- [AAOS / OrthoInfo: Revision Total Knee Replacement](https://www.orthoinfo.org/bodypart/kneelower-leg/revision-total-knee-replacement/): motivos de revisión, retención de implantes, etapas de infección y movilización bajo anestesia.
- [AAOS / OrthoInfo: Osteochondritis Dissecans](https://www.orthoinfo.org/diseases--conditions/childrens-conditions/osteochondritis-dissecans/): perforaciones, fijación e injertos como técnicas diferenciadas.
- [HSS: Meniscus Surgery](https://www.hss.edu/health-library/conditions-and-treatments/meniscus-surgery-meniscectomy): reparación, meniscectomía y trasplante como procedimientos distintos.
- [Técnica de reparación de raíz meniscal posterior medial](https://pmc.ncbi.nlm.nih.gov/articles/PMC5494976/): nomenclatura de reparación de raíz.
- [Resección de lesión de cíclope tras RLCA](https://pubmed.ncbi.nlm.nih.gov/40309481/): ejemplo técnico publicado de resección específica.

Se verificaron contra `assets/js/config.js` las entradas marcadas como existentes. No se repitieron pruebas de código porque esta revisión sólo produjo documentación; la última ejecución funcional sigue siendo 37/37 en la bitácora de diagnósticos múltiples.
