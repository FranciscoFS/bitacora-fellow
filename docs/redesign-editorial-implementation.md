# Primera versión del rediseño editorial

Implementada el 2 de octubre de 2026 en `redesign/ui-ux`.

- Modo claro inicial cuando no existe preferencia guardada. Se conservan las elecciones claro, oscuro y automático.
- Papel cálido, tinta oscura, acento verde y marca amarilla discreta. Tipografía editorial local con Georgia y cuerpo del sistema.
- Dashboard con cuatro indicadores principales y métricas secundarias compactas; progreso con jerarquía propia.
- Bitácora con procedimiento como primera columna y ausencia de complicación en texto neutro.
- Asociados y pasos personales plegables, con contador; los bloques con selección se abren al editar o recuperar el registro.
- Entrada de vistas, panel lateral, avisos y detalles, con movimiento reducido respetado.
- Capa visual en `assets/css/editorial.css`, independiente del CSS heredado para facilitar revisión. La consolidación completa del CSS histórico queda pendiente.

Validación: 25 pruebas de regresión pasan; sintaxis JS y estructura de etiquetas HTML verificadas; `git diff --check` sin errores. Navegador a 390, 768 y 1440 px: registro, búsqueda, guardado local con caso ficticio y edición con asociado existente. Sin desbordamiento global en esas vistas. Contraste calculado: texto del botón sobre acento 7.40:1, secundario sobre papel 5.01:1 y tinta sobre superficie 13.99:1 (verificar valores calculados al cambiar tokens).

La demo usa almacenamiento independiente; el caso ficticio de validación no forma parte del repositorio. No se conectó GitHub de datos ni se probaron sincronizaciones reales. Se conserva el modelo de datos y los gráficos existentes. La simplificación más profunda del selector principal y la incorporación de una fuente sans local quedan para una siguiente iteración.

Captura: `docs/capturas/redesign-editorial-dashboard.jpg`.

## Ajuste de identidad UC

Botones principales en amarillo pastel `#F1D978`, texto azul tinta `#253747`; celeste en superficies seleccionadas y azul en navegación y gráficos. Se conserva el fondo cálido. La guía inicial de tres opciones sigue visible cuando no hay casos; se oculta cuando existen registros para priorizar el dashboard. La paleta es una adaptación visual, no una afirmación de colores institucionales oficiales.
