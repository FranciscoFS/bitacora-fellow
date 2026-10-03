# Cuaderno digital — diseño elegido e integración

Esta especificación recoge las decisiones aprobadas en el chat y reemplaza la dirección editorial anterior. Las maquetas se conservan como exploración; la app oficial usa `assets/css/daybook.css`.

## Requisitos

1. Modo claro por defecto, fondo celeste, Outfit local y amarillo pastel para acciones principales. Mantener las opciones de apariencia existentes.
2. Priorizar registrar un caso recién terminado y mostrar actividad reciente a la izquierda, resumen personal y metas a la derecha. En móvil, una columna.
3. «Tu práctica reciente»: superficie proporcional a frecuencia en escritorio; ranking de barras legibles en móvil. Cinco procedimientos principales y agrupación del resto. Nombre, cantidad y porcentaje visibles; con pocos datos o superficies demasiado pequeñas, usar lista.
4. Períodos de 28 días, 84 días y todo el historial. Fechas locales inclusivas hasta hoy para períodos recientes; no usar la fecha fija de las maquetas.
5. Participación: todos los roles, como cirujano (supervisado + independiente) o un rol específico, incluido Observador.
6. Contar una vez por caso usando su procedimiento principal. Mostrar el alcance y aclarar que frecuencia no mide competencia. Conservar los gráficos que incluyen procedimientos asociados en análisis adicionales.
7. Abrir un procedimiento o «Otros procedimientos» en Bitácora conserva período y participación. «Ver todos los casos» dentro del indicador abre todos los casos del mismo alcance. Búsqueda y exportación se aplican al conjunto visible; un control explícito quita el alcance.
8. Registrar o editar actualiza indicadores y actividad. Guardar un caso regresa a la lista completa para que el registro nuevo no quede oculto por un alcance anterior.
9. Mantener formulario clínico completo, detalles, edición, borrador, metas agrupadas, importación/exportación, guardado local y sincronización existentes. La integración no cambia claves de almacenamiento ni el formato de los datos.
10. Mantener las tres entradas de primer uso: registrar, recuperar bitácora y definir metas. Los indicadores avanzados siguen disponibles en una sección desplegable; sus filtros no afectan actividad, resumen personal, mosaico ni metas.
11. Feedback discreto, foco visible y movimiento reducido. No animar la reorganización del mosaico mientras se leen sus datos. Sin nuevas dependencias de ejecución ni fuentes remotas.

## Implementación

- `practice.js`: alcance temporal, participación, agregación de principales, distribución proporcional y UI del indicador. La bitácora reutiliza el mismo criterio al consultar/exportar.
- `dashboard.js`: actividad reciente, resumen personal y gráfico mensual sobre todos los casos; conserva análisis filtrados y metas existentes.
- `bitacora.js`: alcance temporal no persistente, visible y descartable. Se aplica antes de ordenar y exportar.
- `form.js`: limpia el alcance después de guardar para mostrar el registro.
- `daybook.css`: dirección visual seleccionada y adaptación móvil. Outfit y su licencia se distribuyen localmente.

La hoja editorial anterior se retira del código de producción (permanece en el historial Git). Los tokens `--practice-text` y `--practice-1` a `--practice-4` definen la rampa celeste del indicador en modo claro, oscuro y automático. El color acompaña la frecuencia; área, cantidad escrita y porcentaje son la información principal.

## Validación

28 tests de regresión: los 25 existentes más fechas inclusivas/DST/año bisiesto, roles, agregación principal/cola/consulta y geometría proporcional sin solapamientos. Sintaxis comprobada en todos los JS.

Pruebas en navegador realizadas exclusivamente con la demo independiente: indicador → casos de cirujano, filtros, formulario clínico, registro y persistencia al recargar. Escritorio 1440×1000 y móvil 390×844; formulario y dashboard sin desbordamiento de página. Los gráficos mensuales pueden desplazarse horizontalmente dentro de su contenedor. Capturas en `docs/capturas/daybook-app-*.jpg`.

Además se comprobó primer uso en un origen local nuevo, sin bitácora ni configuración: las tres entradas están disponibles y no se muestran indicadores vacíos. La revisión de código encontró y se corrigieron dos puntos: limpiar búsqueda ahora conserva el alcance del indicador, y los colores de los rectángulos usan tokens de tema. El contraste móvil se comprobó en oscuro con texto `rgb(242,246,252)` sobre la barra `rgb(39,85,116)` y sobre el fondo oscuro. La demo se devolvió a modo claro al finalizar.

La demo contiene datos ficticios. No se probaron conexiones reales de GitHub ni se accedió a una bitácora personal. La app puede usar un token opcional de GitHub; ese flujo se conserva sin reestructurarlo. El PR requiere revisión y merge del mantenedor para actualizar `main` y GitHub Pages.
