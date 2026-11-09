# 8 de noviembre de 2026 · Diagnósticos y procedimientos

## Solicitud y decisiones

El usuario pidió estratificar diagnósticos repetidos y etiquetarlos fácilmente, con Fractura → Platillo tibial → Schatzker como ejemplo. Solicitó también reconstrucción del ligamento patelofemoral (RLPFM) y confirmó reconstrucciones de esquina posteromedial (EPM) y posterolateral (EPL), separadas.

Se conservan la escritura libre, el diagnóstico obligatorio y las sugerencias de casos anteriores. La clasificación es opcional, sin valor predeterminado y reversible mediante otro toque. Elegir de nuevo un diagnóstico frecuente no copia la clasificación de otro caso. No se deducen tipos Schatzker de casos históricos, imágenes ni procedimientos.

## Implementación

- `config.js`: catálogo de ocho categorías de diagnóstico, valores Schatzker I–VI, metadatos consistentes y etiquetas derivadas. RLPFM/MPFL y EPL tienen nombres explícitos y alias para los anteriores; EPM es nuevo. Las tres opciones están disponibles como principal y asociado.
- `form.js`, `index.html`, `daybook.css`: selección por categorías y diagnóstico; después de elegir, el catálogo se oculta para dejar visibles texto y detalles. Para cambiar se pulsa otra categoría o se escribe. Schatzker aparece para fractura de platillo/meseta tibial, incluso escrita libremente. Dos columnas de categorías en móvil; clasificación en tres columnas.
- `store.js`, `export.js`, `bitacora.js`: campos `diagnosticoGrupo`, `diagnosticoTipo`, `clasificacionSchatzker`; normalización, respaldo JSON, CSV, búsqueda y detalle. Cambiar a un diagnóstico incompatible limpia metadatos y etiquetas automáticas antiguas; conserva etiquetas manuales. Los alias conservan IDs, historial del nombre anterior y metas; las metas equivalentes toman el mayor objetivo.
- `index.html`: recursos CSS/JS de `v=41` a `v=42`.
- Documentación de continuidad: estado existente actualizado; guía de desarrollo y bitácora mínima enlazadas desde `AGENTS.md`.

Los nombres de diagnóstico son un catálogo inicial editable del producto, no una clasificación exhaustiva ni una inferencia clínica. Referencia de los tipos I–VI: [Emergency Care Institute, NSW Health](https://aci.health.nsw.gov.au/networks/eci/clinical/tools/tibial-plateau-fractures). Se muestran sólo los números, sin sugerir tratamientos.

## Verificaciones y salidas

- `node --test tests/regression.test.cjs`: **31/31 correctas** (28 existentes y 3 nuevas). Las nuevas cubren persistencia/importación/exportación, limpieza al cambiar diagnóstico, búsqueda aunque se excluya la etiqueta, y compatibilidad de casos/metas/agrupaciones con alias RLPFM/EPL y EPM separado.
- `node --check`: correcto en los **12 módulos JS**.
- `git diff --check`: correcto.
- Chrome, escritorio y anchos de 320 y 390 px: sin desbordamiento horizontal de página ni de botones de categorías. Ajustado Patelofemoral a dos columnas para evitar partir su etiqueta.
- Ciclo manual: Fracturas → Platillo tibial, Schatzker inicialmente vacío, seleccionar/desmarcar, cambiar a lesión de LCA y comprobar limpieza; recuperar el borrador tras recarga; guardar caso ficticio, abrir ficha y editar conservando Schatzker II.
- Búsquedas por EPM, EPL y RLPFM: encuentran opciones distintas. Sin errores de consola capturados durante estas comprobaciones.
- Vista local usada: `http://127.0.0.1:8769/?demo=1#nuevo`. Se creó exclusivamente un caso ficticio CIR-0015 en el almacenamiento de demostración de ese origen; no se usaron datos reales ni repositorios de casos.
- Captura: [formulario móvil con Schatzker](../capturas/diagnosticos-schatzker-movil.jpg).

## Estado y límites

Base al iniciar: `main`, commit `e274750`; árbol limpio. Esta ampliación queda **local, sin commit ni push**, pendiente de revisión/publicación. No se modificó el worktree alternativo.

No se cambió autenticación, proveedor de base de datos ni sincronización con GitHub. No se agregaron otras clasificaciones de fracturas ni se asumió un catálogo clínico completo. En esta ejecución no se verificó la versión que sirve actualmente GitHub Pages.

Siguiente paso: revisar la selección por categorías y publicar cuando lo solicite el usuario. Si pide más diagnósticos o clasificaciones, ampliar el catálogo manteniendo la compatibilidad de datos y la selección explícita.
