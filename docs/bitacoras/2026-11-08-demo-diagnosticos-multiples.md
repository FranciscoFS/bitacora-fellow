# 8 de noviembre de 2026 · Demo con diagnósticos múltiples

## Solicitud y alcance

El usuario aprobó probar en la demo las modificaciones propuestas por la auditoría de cuatro casos, especialmente permitir más de un diagnóstico. Se implementaron localmente, conservando el stack y las preferencias visuales existentes. No se hizo commit, push, publicación ni sincronización de casos.

Base: `main`, HEAD `e274750`, con los cambios no confirmados de las etapas anteriores. No se modificó el worktree alternativo.

## Cambios

- Modelo `diagnosticos`: lista con identificador estable, nombre, categoría/tipo del catálogo, detalles, patrón meniscal, respuesta opcional de lesión condral reinsertable y clasificaciones independientes de Schatzker/Schenck. El campo `diagnostico` se conserva como resumen compatible.
- Formulario: agregar diagnósticos del catálogo o escritos libremente; quitar uno sin reemplazar los demás; detalles propios y controles sin preselección. Enter o Agregar lo escrito permiten incorporar texto libre; Guardar incorpora también texto pendiente para no perderlo. El borrador conserva la lista, sus detalles y la búsqueda todavía no agregada.
- Menisco medial/lateral: patrón opcional con Radial, Longitudinal, Horizontal, Asa de balde, Compleja u Otra. Cartílago: Reinsertable Sí/No/vacío. Ninguna selección se infiere a partir de la cirugía.
- Luxación de rodilla: disponible en el catálogo de Ligamentos y muestra Schenck directamente. Clasificación manual, reversible y sin valor predeterminado.
- Reinserción condral: procedimiento propio en Cartílago, como principal o asociado. No se equiparó a aloinjerto ni a fijación osteocondral.
- RLCA y RLCP: términos de búsqueda que encuentran las reconstrucciones existentes; no se crean duplicados.
- Bitácora: resumen completo de la combinación quirúrgica y diagnósticos debajo, en escritorio y móvil. Se omiten de la presentación etiquetas automáticas ya expresadas por el diagnóstico, conservándolas en los datos y respetando etiquetas manuales.
- Isquemia/complicación intraoperatoria: tres estados. Vacío es null; Sí/No son booleanos explícitos. Volver a pulsar la misma respuesta la desmarca. Ficha y tabla muestran un guion para vacío; CSV deja la celda vacía. El porcentaje de complicaciones usa sólo los casos con respuesta y queda vacío si no hay registros.
- JSON: formato de respaldo versión 2, importación validada de listas de diagnósticos. CSV incorpora Diagnósticos y detalles y conserva las columnas previas. Recursos de `index.html`: `v=43`.

## Compatibilidad y límites

Los casos antiguos se convierten en un diagnóstico con su texto original, sin dividir frases como LCA + menisco. Sus clasificaciones explícitas y las respuestas false ya guardadas se conservan. No se reinterpreta un false histórico como desconocido: no existe información que permita distinguirlo de una respuesta negativa real.

Se mantienen importación/exportación, metas, etiquetas manuales, borradores y las capas de sincronización existentes. Las pruebas de sincronización son simuladas; no se hizo una sincronización real.

## Verificaciones automáticas

- `node --test tests/regression.test.cjs`: **37/37 correctas**. Seis pruebas nuevas cubren persistencia de varios diagnósticos/detalles, eliminación independiente y limpieza de etiquetas/clasificaciones, cirugía combinada y reinserción condral, compatibilidad de casos antiguos, tres estados y denominador del porcentaje de complicaciones, y rechazo de importaciones malformadas.
- `node --check` en los **12 módulos JS**: correcto.
- `git diff --check`: correcto.

## Prueba manual de los cuatro casos

Origen aislado: `http://127.0.0.1:8770/?demo=1`, en Chrome. Se conservaron los 18 registros de ejemplo/auditoría y se añadieron cuatro nuevos con etiquetas `Prueba mejorada` y `Caso N`.

| Código | Diagnósticos comprobados en ficha | Procedimientos comprobados |
| --- | --- | --- |
| CIR-0019 | Lesión de LCA + Lesión de menisco lateral, patrón Radial | RLCA + Sutura meniscal |
| CIR-0020 | Luxación de rótula + Lesión condral, Reinsertable | RLPFM + Reinserción condral |
| CIR-0021 | Gonartrosis; lateralidad Derecha | PTR |
| CIR-0022 | Luxación de rodilla; Schenck KD III-M | RLCA + RLCP + EPM |

Se usaron fecha 08/11/2026 y rol Cirujano (supervisado) de prueba. Abordajes de prueba: Artroscópico en 1, Mixto en 2/4, Abierto en 3. Lateralidad vacía salvo Derecha en 3. No se inventaron duraciones, injerto ni técnica meniscal. Isquemia y complicación quedaron sin respuesta, verificadas como guion en las cuatro fichas.

Comprobaciones adicionales:

1. Edición del CIR-0019 recupera los dos diagnósticos y Radial.
2. Se añadió temporalmente Fractura de platillo tibial y se eligió Schatzker II; al quitar ese tercer diagnóstico se conservaron LCA y menisco con Radial. No se guardó el diagnóstico temporal.
3. Se cambió temporalmente Radial a Longitudinal y se escribió un diagnóstico pendiente sin agregar; tras recarga se recuperaron ambos estados en el borrador. Se cerró la selección pendiente y se restauró Radial antes de guardar CIR-0019.
4. Torniquete Sí muestra el tiempo, No lo oculta y otra pulsación deja vacío. Se ingresaron temporalmente 90 minutos para comprobarlo; al guardar con campo vacío se limpiaron. Complicación No y otra pulsación dejaron vacío.
5. 320/390 px y escritorio: sin desbordamiento horizontal de página ni de botones comprobados. Se ajustaron los patrones meniscales a dos columnas en móvil para evitar partir los nombres.
6. Recarga y filtro `Prueba mejorada`: **4 de 22 casos**, con procedimientos combinados visibles en las tarjetas y tabla.
7. Los errores de consola observados en la revisión final provinieron de la extensión Zotero; no se atribuyeron a la app.

Evidencia: [formulario móvil](../capturas/diagnosticos-multiples-movil.jpg) y [cuatro casos mejorados](../capturas/demo-cuatro-casos-mejorados.jpg).

## Estado final y siguiente paso

Cambios locales sin publicar ni sincronizar. Vista previa local activa en el puerto 8770; buscar Prueba mejorada en la bitácora. El usuario debe revisar la propuesta antes de decidir su publicación. Los informes previos se conservan como historial y no describen el estado funcional final de esta demo.
