# 8 de noviembre de 2026 · Auditoría del registro de cuatro casos

## Objetivo y alcance

El usuario pidió simular cuatro casos desde la perspectiva de un fellow de rodilla y evaluar el flujo, sin sincronizar nada. Se usó la skill `redesign-existing-projects` para claridad, estados y usabilidad, con la versión local `v=42`. Es una prueba exploratoria del producto, no una evaluación de indicaciones quirúrgicas ni un estudio con usuarios.

**No se modificó código de la app en esta ejecución.** Los hallazgos y sus soluciones son propuestas pendientes. Los cambios funcionales de la bitácora anterior continúan sin commit ni publicación.

## Entorno y parámetros

- Carpeta y rama: principal, `main`; HEAD `e274750` con los cambios locales previos de diagnósticos/procedimientos.
- Vista aislada: `http://127.0.0.1:8770/?demo=1#bitacora`, servidor Python local. Al empezar, 14 casos ficticios; al terminar, 18.
- Navegador: Chrome. Caso 1 en escritorio; casos 2–4 en móvil de 390 × 844. Comprobación final en escritorio tras reabrir la demo.
- Datos faltantes: fecha 08/11/2026 y rol Cirujano (supervisado) como valores de prueba. Abordajes de prueba: Artroscópico en caso 1, Mixto en 2/4 y Abierto en 3. No representan confirmación de datos clínicos reales.
- Lateralidad: Derecha sólo en el caso 3, según lo pedido. Se dejó vacía en los demás. No se inventaron duración, injerto, técnica meniscal, patrón multiligamentario, cirujano supervisor ni datos personales.
- Etiquetas manuales de trazabilidad: `Auditoría de flujo` y `Caso de prueba N`. Notas explícitas de SIMULACIÓN.
- Se verificaron en Ajustes usuario, repositorio y token vacíos; estado En este dispositivo y conexión Pendiente de configurar. La ruta demo limpia la configuración de conexión durante el arranque. No se ejecutaron pruebas de conexión, descargas remotas, subidas ni sincronización de casos.

## Resultado por caso

| Caso solicitado | Registro ficticio | Cómo quedó guardado | Evaluación del flujo |
| --- | --- | --- | --- |
| Lesión de LCA + lesión radial de menisco lateral; RLCA + sutura | CIR-0015 | Diagnóstico combinado en texto libre; principal Reconstrucción de LCA; asociado Reparación meniscal (sutura) | Los procedimientos se registran bien. Elegir un segundo diagnóstico del catálogo sustituye al primero. No hay detalle radial para menisco lateral; se conservó escribiéndolo. |
| Luxación patelar + lesión condral reinsertable; RLPFM + reinserción condral | CIR-0016 | Diagnóstico compuesto escrito; principal RLPFM/MPFL; asociado Otro (especificar en notas); reinserción condral descrita en notas | No se pudo representar íntegramente con procedimientos normalizados. No existe reinserción condral en el catálogo. Otro es un recurso de la prueba, no una equivalencia clínica. |
| Gonartrosis; PTR derecha | CIR-0017 | Gonartrosis del catálogo, PTR como principal, lateralidad Derecha | Flujo directo: categoría, diagnóstico, D, procedimiento y guardado. |
| Luxación de rodilla, IIIM; RLCA + RLCP + EPM | CIR-0018 | Lesión multiligamentaria · luxación de rodilla; Schenck KD III-M; principal RLCA, asociados RLCP y EPM | Los tres procedimientos se guardan correctamente. Para descubrir Schenck hubo que usar Lesión multiligamentaria; Luxación de rodilla por sí sola no lo muestra. |

Se abrieron las cuatro fichas después de reabrir Chrome en el mismo origen: se conservaron diagnósticos, procedimientos, lateralidad, clasificación, notas y etiquetas descritos arriba. El filtro `Auditoría de flujo` mostró **4 de 18 casos**, con exportación de cuatro resultados disponible. La duración acumulada de esos cuatro fue 0 porque no se ingresaron minutos.

## Hallazgos reproducidos y prioridad propuesta

### P1 · Diagnósticos combinados no están modelados

Reproducción: elegir Ligamentos → Lesión de LCA; luego Menisco → Lesión de menisco lateral. El segundo reemplaza el valor del primero. Se resolvió para la prueba escribiendo `Lesión de LCA + lesión radial de menisco lateral`, conservando como diagnóstico de catálogo sólo Lesión de LCA.

Consecuencia: se conserva la descripción, pero lateralidad meniscal/patrón radial no se convierten en datos estructurados o etiquetas automáticas específicas. En el caso 2 sucede lo mismo con la lesión condral reinsertable.

Propuesta: lista de diagnósticos seleccionados con botón Agregar diagnóstico. Cada diagnóstico conserva categoría y detalles propios, con texto adicional opcional. Ejemplos de esta prueba: LCA + Menisco lateral / Radial; Luxación patelar + Lesión condral / Reinsertable. Elegir un segundo diagnóstico no debe borrar el anterior.

Referencia: `assets/js/form.js`, función `selectDiagnosis`; `assets/js/config.js`, catálogo y `diagnosisFields`.

### P1 · Falta reinserción condral

Reproducción: buscar `reinser` no devuelve opciones. Se revisó el área Cartílago completa: condroplastia, microfracturas, mosaicoplastia/OATS, ACI/MACI, aloinjerto osteocondral y matriz de colágeno. No hay reinserción condral. Buscar `condral` sólo encuentra el aloinjerto osteocondral, que no se usó como sustituto.

Consecuencia: el procedimiento termina en Otro y notas, y no puede contarse específicamente como reinserción condral en el catálogo actual.

Propuesta: incorporar la denominación solicitada como procedimiento propio, disponible tanto principal como asociado. Acordar por separado si hacen falta otras opciones, como fijación de fragmento osteocondral; no se asumió que fueran equivalentes.

Referencia: `assets/js/config.js`, procedimientos de Cartílago.

### P1 · Schenck depende de una palabra dentro del texto

Reproducción: escribir `Luxación de rodilla` deja oculto y deshabilitado Schenck. Elegir `Lesión multiligamentaria` hace aparecer el campo y permite seleccionar KD III-M. Se guardó esa opción, correspondiente al texto solicitado en esta simulación, sin inferirla a partir de los procedimientos.

Consecuencia: una clasificación disponible puede pasar inadvertida o quedar sin registrar en un diagnóstico habitual.

Propuesta: añadir Luxación de rodilla al catálogo y definir explícitamente los diagnósticos a los que corresponde mostrar el campo. La visibilidad debe depender del diagnóstico seleccionado y sus equivalencias, manteniendo la selección manual de la clasificación.

Referencia: `assets/js/config.js:11`, `isMultiligamentaryDiagnosis`; `assets/js/form.js`, `conditionals` y `read`.

### P1 · Campos no informados aparecen como No

Observación en las cuatro fichas: sin haber confirmado isquemia ni complicación intraoperatoria, se muestran `Isquemia: No` y `Complicación intraoperatoria: No`. Los valores booleanos no distinguen una respuesta negativa de un dato no registrado.

Propuesta: estado inicial vacío y respuesta explícita Sí/No para esos campos; mostrar un guion cuando no se haya respondido. Evitar añadir pasos obligatorios a todo caso sin definir antes el criterio del producto.

Referencia: `assets/js/store.js`, `BOOL_FIELDS` y `normalize`; `assets/js/bitacora.js:180`.

### P2 · Siglas habituales no siempre encuentran el procedimiento

Reproducido: `RLCA` sin coincidencias, mientras `LCA` encuentra la reconstrucción; `RLCP` sin coincidencias, mientras `LCP` sí la encuentra. `PTR`, `RLPFM` y `EPM` encuentran directamente sus opciones.

Propuesta: diccionario de términos de búsqueda, por ejemplo RLCA ↔ Reconstrucción de LCA y RLCP ↔ Reconstrucción de LCP, sin crear procedimientos duplicados ni cambiar la descripción guardada.

Referencia: `assets/js/form.js`, búsquedas de principal y asociados basadas en `includes`.

### P2 · El listado resalta la cirugía principal y oculta parte de la combinación

Observación: en escritorio el caso 4 muestra Reconstrucción de LCA +2; los nombres de RLCP/EPM se ven en la ficha y sus siglas aparecen en etiquetas. En móvil, el título de la tarjeta muestra sólo el procedimiento principal. Para interpretar la cirugía completa hay que leer etiquetas o abrir la ficha.

Propuesta: resumen compacto y explícito de la combinación, por ejemplo RLCA + RLCP + EPM. Separar visualmente diagnóstico, procedimientos y participación. Reducir etiquetas redundantes sin ocultar clasificaciones relevantes.

No se consideraron las dos etiquetas manuales de auditoría como contenido necesario del producto.

## Lo que funcionó

- PTR derecha: selección directa, legible y sin tener que escribir el diagnóstico.
- Procedimientos asociados: permitieron sutura con RLCA y dos reconstrucciones con RLCA; los tres se conservan en la ficha.
- RLPFM y EPM: localizables por sus siglas y sin confusión con EPL.
- Clasificación KD III-M: se conserva en ficha y etiqueta una vez encontrada la ruta correspondiente.
- Campos no especificados de lateralidad y duración: pudieron quedar vacíos; no se forzaron datos inventados para completar el caso.
- Guardar y crear otro funcionó desde Más acciones en móvil; fecha conservada, rol y abordaje reiniciados. Mantener esa decisión explícita si se optimiza la carga de varios casos.
- Los cuatro registros quedaron en el almacenamiento local de demostración y sobrevivieron a reabrir la página en Chrome.

## Evidencia, límites y pendientes

- [Captura de los cuatro casos filtrados](../capturas/auditoria-cuatro-casos-escritorio.jpg).
- El usuario confirmó que descargó el respaldo JSON. La espera de confirmación de descarga de la herramienta se bloqueó; no se inspeccionó automáticamente su contenido. Esto no se contabiliza como un fallo demostrado de la app. Se verificaron los datos guardados mediante las cuatro fichas, después de recuperar la sesión de Chrome.
- La consola mostró errores de carga de estilos de Grammarly, originados en una extensión de Chrome. No se atribuyeron a la app.
- No se midieron tiempos ni se asignó una puntuación numérica: las latencias de automatización no representan el tiempo de un fellow.
- No se repitieron las 31 pruebas de la ejecución anterior, porque esta auditoría no cambió código funcional; ese resultado previo sigue identificado en su propia bitácora.
- No se probó sincronización, no se modificaron repositorios remotos y no se publicó nada.
- Próximo paso propuesto: resolver diagnósticos múltiples, reinserción condral y descubrimiento de Schenck; después mejorar búsquedas por siglas, resumen de cirugías combinadas y estados de datos no informados. Ninguna de esas correcciones se implementó durante esta auditoría.
