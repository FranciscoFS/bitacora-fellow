# Auditoría para el rediseño editorial

Fecha: 2 de octubre de 2026. Rama: `redesign/ui-ux`.

## Alcance y evidencia

Revisión de HTML, CSS y navegación, y recorrido en navegador de Dashboard, Nuevo caso, Bitácora y Ajustes con los 14 casos ficticios de la demo. Se inspeccionó visualmente escritorio en modo claro y el dashboard en modo oscuro. Las recomendaciones móviles se basan en el código responsive; falta verificar sus pantallas a 390 y 768 px. No se probaron sincronización remota, importaciones ni borrados.

La auditoría anterior de `docs/auditoria-ui-ux.md` es histórica: la versión actual ya incorpora borradores, acciones persistentes, detalles plegables, lista móvil, mediana correcta, filtros con alcance explicado y mejoras de accesibilidad. No se presentan aquellos defectos como hallazgos nuevos.

## Dirección de diseño

Una bitácora personal con carácter de publicación médica: fondo de papel cálido, titulares serif, controles precisos y datos de lectura rápida. La sensación buscada es calma, cuidado y progreso. La personalidad procede de tipografía, composición y materiales, sin imágenes decorativas de cirugía.

Se aplica `gpt-taste` para jerarquía editorial, contraste, composición sin huecos y movimiento cuidado. Su AIDA, pinning, marquees y scroll cinematográfico responden a páginas promocionales; para esta aplicación se propone conservar navegación y acceso inmediato al trabajo. La implementación deberá explicitar esta adaptación antes de escribir UI. Esta entrega es una auditoría, no código de interfaz.

## Hallazgos actuales

P1: prioridad para la primera implementación. P2: refinamiento posterior. Son prioridades de diseño y uso, no clasificaciones de fallos clínicos.

| Prioridad | Evidencia actual | Efecto | Propuesta |
|---|---|---|---|
| P1 | Tema inicial automático en Ajustes; el navegador abrió la demo oscura | La primera impresión depende del dispositivo | Claro como valor inicial cuando no hay preferencia guardada; mantener la elección explícita del usuario |
| P1 | Fondo azul frío, tarjetas azuladas y amarillo intenso en todas las acciones principales | La interfaz resulta más institucional que personal/editorial | Papel marfil, superficies blancas cálidas, tinta oscura; amarillo reservado a un detalle de marca |
| P1 | Ocho métricas antes del progreso y gráficos | Exige interpretar muchos números antes de responder cómo avanza el fellowship | Cuatro indicadores prioritarios; métricas de tiempo en una franja secundaria compacta |
| P1 | Procedimiento principal presenta búsqueda, select, nueve categorías y seis resultados simultáneos | Compiten varias formas de elegir lo mismo | Un selector buscable con resumen seleccionado; categorías disponibles dentro del selector |
| P1 | Asociados y pasos personales aparecen dentro de Registro esencial, aunque son opcionales | La tarea corta sigue pareciendo extensa | Agruparlos como “Completar la intervención”, plegable, con contador de datos agregados |
| P1 | Bitácora comienza por código, fecha y rol; procedimiento ocupa la cuarta columna | Se escanea por identificador antes de reconocer la intervención | Procedimiento como columna principal; código secundario; fecha y rol inmediatamente después |
| P2 | Cada fila sin complicaciones muestra una etiqueta verde “No” | Repetición de color positivo sin aportar discriminación | Texto neutro para ausencia de complicación; color reservado a eventos que requieren atención |
| P2 | Titulares serif ya presentes, pero cuerpo, bloques y controles mantienen tratamiento genérico | La dirección editorial queda concentrada en el encabezado | Extender jerarquía, reglas finas y ritmo de espaciado a secciones y detalle |
| P2 | Varias definiciones sucesivas de botones, temas y grids en styles.css | Cambiar tokens puede dejar inconsistencias por cascada | Consolidar tokens y componentes al implementar; comprobar estados hover, foco y disabled |
| P2 | Hay fade de vista, pulse de sincronización y presión de botones | Movimiento funcional existente, pero poco cohesionado | Sistema breve de transiciones por acción, con cancelación y movimiento reducido |
| P2 | Texto generado usa “caso(s)” y “meta(s)” | Sensación técnica y menor pulido editorial | Singular/plural natural; unidades claras y frases breves |

## Sistema visual propuesto

Paleta inicial para prototipo, pendiente de verificar contraste en cada combinación y estado:

| Token | Valor propuesto | Uso |
|---|---|---|
| Fondo | `#F6F4EE` | Papel cálido |
| Superficie | `#FFFEFA` | Formulario, detalle y gráficos |
| Superficie secundaria | `#EEECE5` | Agrupaciones suaves |
| Texto | `#252D2A` | Tinta principal |
| Texto secundario | `#626B65` | Ayuda y metadatos |
| Borde | `#DCDDD4` | Separadores discretos |
| Acento | `#315D50` | Acciones y selección |
| Acento suave | `#E4EDE7` | Selección y progreso |
| Marca amarilla | `#E8CF73` | Detalle pequeño, sin dominar controles |

Titulares: serif editorial con contraste moderado; usar inicialmente Georgia local o evaluar una fuente alojada en el repositorio. Cuerpo y controles: Geist alojada localmente si se incorpora, con fallback del sistema. Nada de fuentes remotas. Titulares de vista entre 36 y 52 px en escritorio y 30–36 px en móvil; texto de controles 15–16 px, ayudas 13–14 px. Números tabulares. No usar mayúsculas pequeñas para información que necesita lectura frecuente.

Espaciado: escala de 4, 8, 12, 16, 24, 32, 48 y 64 px. Separación amplia entre bloques, compacta dentro de una tarea. Radios de 8–12 px, sombras leves sólo donde ayudan a percibir elevación. El dashboard no necesita una tarjeta alrededor de cada dato.

## Composición por flujo

**Dashboard.** Encabezado editorial y acción Registrar caso. Resumen del período con filtros y cuatro cifras principales: casos, participación como cirujano, horas y complicaciones, con denominadores claros. Progreso acumulado en un bloque protagonista propio. Evolución mensual y procedimientos en una pareja de gráficos; distribución por rol y otras métricas después. Mantener el orden DOM y visual coherentes; comprobar grids con títulos largos y datos vacíos. No presentar el rol independiente como juicio de calidad.

**Nuevo caso.** Encabezado compacto, estado del borrador y registro esencial. Fecha, lado, rol y abordaje; diagnóstico y procedimiento como siguiente grupo. El selector se abre al buscar o activar Elegir procedimiento, muestra resultados y deja un resumen al confirmar. Asociados, pasos y detalles se revelan a demanda. Mantener Guardar disponible y Descartar visualmente separado. Diferenciar claramente selección única del principal y selección múltiple de asociados, también para lectores de pantalla.

**Bitácora.** Tratarla como un índice de intervenciones: procedimiento protagonista, fecha y rol secundarios, código discreto. Tabla en escritorio y lista en móvil. Búsqueda y cantidad de resultados juntas. El panel de detalle debe tener un título reconocible, datos agrupados y acciones Editar/Seguimiento fáciles de encontrar. Conservar devolución del foco y cierre por Escape.

**Ajustes.** Mantener agrupación por tarea. Dar al estado de conexión más jerarquía que a las opciones técnicas. Preservar configuración avanzada plegable y borrado separado. El modo claro será la primera experiencia, sin sobrescribir preferencias existentes.

## Feedback y movimiento

| Acción | Respuesta propuesta | Duración orientativa |
|---|---|---|
| Cambiar sección | Entrada suave de contenido, 4–6 px de desplazamiento; navegación activa inmediata | 180–240 ms |
| Hover / pulsar | Cambio de superficie y borde; presión de 1 px en botones | 120–160 ms |
| Seleccionar procedimiento | Marca y resumen claros; actualización sin mover el foco inesperadamente | 160–200 ms |
| Abrir detalles | Revelado corto, sin saltos del contenido; foco de teclado conservado | 180–220 ms |
| Guardar | Botón ocupado mientras corresponda, confirmación persistente cerca de la acción y aviso breve | Inmediato; transición de 160 ms |
| Abrir ficha | Entrada lateral contenida y velo suave | 220–280 ms |
| Actualizar filtros | Cambiar resultados y anunciar cantidad; no reiniciar animaciones de toda la página | 120–180 ms |
| Progreso | Animar barra una vez al entrar; cifra final visible desde el comienzo | 350–450 ms |

No contar cifras desde cero, hacer rebotar tarjetas ni escalar filas de datos. Animar preferentemente transform y opacity. Con movimiento reducido: eliminar desplazamientos y barras animadas; conservar estados y feedback. Guardado local, borrador y sincronización remota deben seguir siendo mensajes distintos. GSAP sólo si un componente justifica su coste; distribuirlo localmente si se usa para preservar funcionamiento offline.

## Secuencia de implementación y aceptación

1. Fundaciones: claro inicial, paleta, tipografía, navegación, botones y consolidación del CSS.
2. Dashboard: jerarquía de indicadores, progreso y composición de gráficos.
3. Registro y bitácora: simplificar selectores, agrupar opcionales y priorizar intervención.
4. Movimiento y pulido: estados vacíos, mensajes, paneles y transiciones.

Validar a 390, 768 y 1440 px, sin desbordamiento global ni controles tapados por la barra de guardado. Probar navegación por teclado, foco visible, zoom al 200%, movimiento reducido, textos clínicos largos y temas guardados previamente. Revisar contraste de texto, controles y todos sus estados. Ejecutar `node --test tests/regression.test.cjs` al modificar UI/JS y realizar un registro completo con datos ficticios, búsqueda, edición y recuperación del borrador. Ninguna animación debe retrasar registrar, guardar o consultar un caso.

Esta entrega define la dirección y el trabajo pendiente. No cambia el comportamiento ni la apariencia de la app.
