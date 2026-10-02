---
name: Bitácora Fellow · cuatro propuestas
description: Exploración HTML independiente; ninguna dirección aprobada.
colors:
  station-yellow: "#f2d16a"
  station-sky: "#dcebf7"
  pulse-yellow: "#f5d95e"
  pulse-sky: "#dfedf8"
  daybook-yellow: "#f7df81"
  daybook-sky: "#dcecf8"
  atlas-yellow: "#f1d36a"
  atlas-sky: "#e0f0fa"
typography:
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "15px"
    lineHeight: 1.5
  pulse-display:
    fontFamily: "Barlow, sans-serif"
    fontSize: "4.25rem"
    fontWeight: 700
    lineHeight: 1.15
---

# Design System: Bitácora Fellow · prototipos

## Overview

Documento limitado a `mockups/`, extraído de sus cinco HTML y CSS/JS compartidos. `PRODUCT.md` identifica un fellowship de cirugía de rodilla en la Pontificia Universidad Católica de Chile y confirma la primera tarea: registrar una cirugía recién terminada. Modo claro, acciones amarillas y complemento celeste son compromisos del usuario; los valores son adaptaciones, sin manual institucional validado.

El encargo explícito de **cuatro opciones HTML divergentes** reemplaza para esta exploración la selección de un único mundo visual y la aprobación previa de una maqueta de imagen. La primera interpretación editorial fue rechazada. Se generó la semilla `75aaaece`; el conjunto explorado incluyó consola clínica, datos suizos, actividad, mapa formativo, programación de pabellón, cuaderno personal y registro docente. Cuaderno digital incorpora el candidato número 6. Ninguna dirección ha sido aprobada.

Las cuatro alternativas comparten tareas y datos ficticios, pero cambian composición, densidad, tipografía y formas. `index.html` es un comparador neutral, no una quinta dirección. La app de producción y sus datos permanecen fuera de esta exploración; este documento no prescribe su rediseño.

## Colors

| Dirección | Fondo / texto principal | Amarillo de acción | Celeste y azul de apoyo |
| --- | --- | --- | --- |
| Estación clínica | `#edf2f6` / `#172f46` | `station-yellow` | `station-sky`; rail marino `#17394f`; azul `#215b88` |
| Pulso | `#f9faf9` / `#123e65` | `pulse-yellow` | `pulse-sky`; banda `#cde6f8`; azul `#23689f` |
| Cuaderno digital | `#e9f3fa` / `#213e56` | `daybook-yellow` | `daybook-sky`; panel mensual `#d1e7f6`; azul `#326b98` |
| Atlas académico | `#ffffff` / `#143d60` | `atlas-yellow` | `atlas-sky`; columna `#d6ebfa`; azul `#1f6f9f` |

Amarillo identifica registrar y guardar; celeste organiza superficies, navegación o datos. La selección añade texto/estado y `aria-current` o `aria-pressed`. El comparador usa blanco, gris claro y marino; su enlace de apertura es amarillo. `assets/prototype.css` y `assets/comparison.css` son la fuente efectiva de estilos.

## Typography

Outfit local variable (100–900), con fallback sans-serif, gobierna cuerpo, campos y comparador. Pulso añade `BarlowCondensed-Bold.ttf`, registrado en CSS como **Barlow**, a titulares y cifras. Ambas fuentes se distribuyen bajo SIL Open Font License 1.1; conservar `assets/fonts/Outfit-OFL.txt` y `assets/fonts/Barlow-OFL.txt` junto a los binarios. No se solicita una fuente remota al abrir estas maquetas.

Estación usa h1 de 1.75rem; Pulso 4.25rem, condensada y mayúscula; Cuaderno 2.5rem, peso 500; Atlas usa 2rem en la columna por su ajuste final. Cuerpo 15px/1.5; campos 16px; fechas, códigos y cifras usan números tabulares. El procedimiento encabeza cada fila; fecha, lateralidad y código acompañan la identificación del caso.

## Layout

| Sistema | Composición real | Ventaja y coste de la dirección |
| --- | --- | --- |
| **Estación clínica** (`station.html`) | Rail fijo de 212px; barra superior; resumen compacto; casos en hoja blanca a la izquierda, metas a la derecha. | Familiaridad y densidad para trabajo repetido; el rail consume ancho y expresa una herramienta más institucional. |
| **Pulso** (`pulse.html`) | Navegación superior; título grande; banda celeste de cuatro cifras; columnas asimétricas; desglose mensual y por procedimiento. | Carácter y jerarquía fuertes; el título y cifras ocupan altura antes del contenido y pueden competir con la urgencia de registrar. |
| **Cuaderno digital** (`daybook.html`) | Fondo celeste; actividad sobre hoja blanca redondeada; gráfico bajo ella; resumen personal y metas a la derecha. | Lectura cercana del historial y continuidad de uso; menor densidad y más recorrido vertical que Estación. |
| **Atlas académico** (`atlas.html`) | Columna celeste de 300px con registrar/resumen; matriz de seis procedimientos; dos casos recientes debajo. | Lectura rápida de exposición académica; consulta reciente recibe menos espacio y exige abrir Bitácora para profundizar. |

Contenedores máximos: Pulso 1400px, Cuaderno 1230px, Atlas 1440px. Ritmo observado de 16, 24, 28, 32 y 44px; no hay una escala única aprobada. A 1100px se reducen márgenes y Estación apila paneles. A 760px las cuatro pasan a navegación superior, columnas apiladas y formulario de una columna; rol/duración se ocultan en filas, pero siguen en el detalle. El comparador apila sus dos vistas a 900px y ajusta controles a 560px.

## Elevation & Depth

Profundidad principalmente por color, espacio y divisores. Las hojas no tienen sombras decorativas. El detalle modal usa `0 18px 64px rgba(18,38,57,.16)` y el mensaje de estado `0 8px 24px rgba(18,38,57,.16)`; el registro entra en un panel lateral con fondo atenuado. Transiciones de 140–200ms y curva `cubic-bezier(.22,1,.36,1)`; `prefers-reduced-motion` elimina animación y transformaciones.

## Shapes

Estación: hojas de 12px y botones de 8px. Pulso: controles de 2px, marca cuadrada y barras rectas. Cuaderno: hojas de 16px, acción de 24px y marca circular. Atlas: matriz pautada, barras rectas y controles compartidos de 8px. Campos de 7px, detalle de 14px y panel de registro sin esquinas redondeadas son comunes.

## Components

**Controles implementados en el código:** navegación Inicio/Bitácora/Metas/Ajustes; registrar, cerrar y guardar; detalle y edición; búsqueda por procedimiento, diagnóstico o código; filtro por rol; limpiar búsqueda; metas editables; apertura de registros desde un procedimiento; alternar primer uso/casos. El comparador cambia dirección, compara dos, cambia estado inicial y abre cada HTML a pantalla completa. Cada iframe tiene memoria independiente.

**Registro:** diálogo nativo `dialog`, ancho máximo 600px y altura de ventana. Exige fecha, diagnóstico, procedimiento principal, rol y abordaje. Lateralidad permite «Sin registrar»; duración opcional, 0–900 minutos. Validación HTML nativa; guardar actualiza el resumen y abre Bitácora con confirmación del código. Edición conserva el código. Cerrar un registro nuevo conserva los campos introducidos durante esta visita; cerrar una edición no guarda un borrador de edición.

**Metas:** seis procedimientos, objetivos iniciales 30/20/20/40/50/10; edición entre 1 y 999. Numerador acumulado incluye todos los roles y fechas. Barra limitada visualmente al 100%; porcentaje puede superar 100%. «Como cirujano» agrupa roles supervisado e independiente. Actividad mensual muestra julio–octubre de 2026; octubre es un período fijo de demostración.

**Historias y criterios de lectura:**

1. **Acabo de terminar una cirugía.** Como fellow, quiero registrar desde Inicio sin buscar el formulario. Pulso, Estación y Cuaderno sitúan la acción junto al título; Atlas en la columna celeste. Completo los cinco campos exigidos y guardo: veo el código confirmado y el caso en Bitácora. Duración y lateralidad pueden esperar.
2. **Me interrumpen antes de guardar.** Quiero volver al caso iniciado durante esta visita. Cierro y reabro Registrar: reaparecen los campos introducidos con aviso de borrador. Recargar o cambiar de documento pierde ese borrador; no existe recuperación persistente.
3. **Necesito revisar o corregir un caso.** Busco diagnóstico, procedimiento o código, acoto mi rol y abro la fila. El detalle muestra diagnóstico, rol, lateralidad, abordaje y minutos. Editar precarga el formulario; guardar actualiza ese mismo caso y confirma su código. Sin coincidencias, «Ver todos los casos» limpia ambos filtros.
4. **Quiero revisar mi exposición.** Leo conteo/objetivo y el alcance «Todos los casos, todos los roles». Selecciono un procedimiento para consultar sus registros o entro en Metas, abro «Editar objetivos» y guardo. Es exposición registrada, no una certificación de competencia ni un requisito oficial del programa.
5. **Es mi primera visita.** Con estado vacío veo registrar el primer caso, orientación para recuperar bitácora y definir metas. Configurar metas funciona; recuperar lleva a texto explicativo de Ajustes. Registrar el primer caso reemplaza la orientación inicial por el contenido de trabajo.
6. **Necesito elegir una dirección.** Comparo la misma tarea y datos en una o dos vistas, con o sin casos. Puedo abrir cada propuesta independiente. La comparación ayuda a elegir distribución y sensación de trabajo; no constituye aprobación ni implementación del estilo en producción.

**Alcance explicado, sin implementación:** Ajustes describe guardado, sincronización GitHub, importación de respaldo JSON y apariencia. No hay conexión, importador, credenciales, selector de tema ni respaldo en estas maquetas. «En este dispositivo» es texto demostrativo, no prueba de persistencia o sincronización.

## Do's and Don'ts

- **Do:** conservar español, modo claro, amarillo de acción, celeste y acceso inmediato al registro al desarrollar cualquiera de estas direcciones.
- **Do:** distinguir números del período de exposición acumulada y mantener confirmación textual, estados vacíos y detalle editable.
- **Do:** usar información ficticia. Los 14 casos y el catálogo de seis procedimientos son una simplificación clínica para comparar diseño.
- **Don't:** atribuir identidad oficial a estos colores, presentar metas como certificación o transferir automáticamente un estilo a producción.
- **Don't:** prometer guardado duradero: casos, metas y borrador viven en memoria y se reinician al recargar. Alternar vacío/casos reemplaza los registros por cero o por la muestra; no recupera modificaciones. Recargar un iframe también reinicia su visita.
- **Don't:** asumir funcionalidades del formulario clínico completo, eliminación, importación, sincronización, ordenamiento cronológico automático o gráficos de cualquier período. La búsqueda distingue acentos. Guardar un caso limpia búsqueda y rol para mostrar el registro; abrir un procedimiento desde Metas limpia el rol para respetar el conteo de todos los casos.
- **Do:** verificar antes de integrar el código. Este documento se basa en lectura de fuentes, sin navegador ni pruebas nuevas. CSS responsive, foco visible, salto a contenido, mensajes `role="status"` y diálogos nativos existen; resultados de móvil, teclado y comportamiento real dependen de la verificación del agente principal. No se declara conformidad ni certificación de accesibilidad.

## Verificación de las maquetas

El agente principal comprobó las cuatro propuestas en navegador a 1440×1000 y 390×844, sin desbordamiento horizontal. Probó registro, edición, búsqueda, filtro por rol, objetivos, primer uso y recuperación del borrador tras cerrar con Escape. Las capturas finales están en `captures/`. JavaScript pasó comprobación de sintaxis, los cinco HTML pasaron revisión estructural y Git no detectó errores de espacios. La revisión independiente final dio **Pass** a las cuatro direcciones y al comparador; alcance y hallazgos resueltos en `REVIEW.md`. Esto valida una maqueta comparativa, no su integración en producción.
