# Auditoría UI y UX · Bitácora Fellow

Fecha: 1 de octubre de 2026, America/Santiago.

La app tiene una base visual coherente y una estructura funcional clara. Las mejoras con mayor impacto son reducir el esfuerzo para registrar una cirugía, corregir la navegación móvil, ordenar el dashboard y hacer que cada mensaje de guardado, importación y sincronización describa exactamente lo que sucede.

**Alcance y evidencia**

Se revisaron Dashboard, Bitácora, Nuevo caso, el panel de detalle y Ajustes en Chrome, junto con HTML, CSS y JavaScript. Se observaron el estado vacío y el estado con los 14 casos ficticios incluidos en la app, en una instancia local sin conexión configurada a GitHub. Se probaron navegación, validación de campos vacíos, pérdida de un borrador y búsquedas sin resultados. No se importaron archivos, no se ejecutaron borrados ni se probaron escrituras remotas.

La revisión visual se hizo en el tema oscuro activo. El tema claro se revisó en el código; no se verificó visualmente. Se usaron el viewport inicial de aproximadamente 1707 × 932, un portátil de 1366 × 768 y un móvil de 390 × 844. Las medidas corresponden a esta instancia y a los datos ficticios; pueden variar con contenido, zoom y dispositivo.

Se aplicó la [skill gpt-taste](../.agents/skills/gpt-taste/SKILL.md) para evaluar composición, jerarquía, densidad, contraste y movimiento. Sus patrones de hero, AIDA, enormes separaciones y scroll cinematográfico están orientados a páginas de presentación. Para esta herramienta de registro propongo una interfaz compacta, predecible y con microinteracciones que acompañen las acciones. La selección aleatoria de layouts y el preflight de la skill se exigen antes de escribir UI; esta entrega es una auditoría sin implementación.

**Qué conviene conservar**

- El acento único, la paleta sobria y el uso de colores de estado con significado.
- Los tokens CSS, los números tabulares y las superficies bien diferenciadas.
- El estado inicial que evita llenar la pantalla de indicadores en cero.
- El panel lateral de detalle, su cierre con Escape y la devolución del foco.
- Los labels asociados a los campos, el enlace para saltar al contenido y los textos accesibles de los gráficos.
- La adaptación a movimiento reducido y las transiciones cortas.

**Prioridades**

P0 indica una interacción cuyo significado puede conducir a una modificación destructiva inesperada. P1 indica un problema de uso frecuente, accesibilidad o confianza en los datos. P2 indica refinamiento de composición, descubrimiento o eficiencia. Los esfuerzos son relativos: bajo implica un cambio localizado; medio, un componente o flujo; alto, varios flujos y persistencia.

| Prioridad | Hallazgo | Evidencia | Mejora propuesta | Esfuerzo |
|---|---|---|---|---|
| P0 | Cancelar la importación reemplaza los casos | Código | Diálogo con Fusionar, Reemplazar y Cancelar; cancelar debe salir sin cambios | Medio |
| P0 | El borrado se anuncia como local y también se sube a GitHub | Código | Explicar el alcance remoto antes de confirmar y ofrecer respaldo | Medio |
| P1 | Navegación móvil comprimida y cabecera que desaparece | Navegador + código | Segunda fila de navegación completa y corregir el contenedor sticky | Bajo |
| P1 | Borrador perdido al iniciar otro caso | Reproducido | Recuperación de borrador y aviso antes de descartarlo | Alto |
| P1 | Registro demasiado largo | Medido | Registro esencial, detalles opcionales y guardado accesible | Medio |
| P1 | Contraste insuficiente en botones primarios oscuros | Medido + código | Token de texto sobre acento distinto por tema | Bajo |
| P1 | Fecha predeterminada basada en UTC | Navegador + código | Usar la fecha local del usuario | Bajo |
| P1 | Mediana incorrecta | Navegador + cálculo independiente | Calcularla o retirar la etiqueta | Bajo |
| P1 | Gráficos ilegibles en móvil | Medido + código | Labels HTML o geometría adaptada al ancho real | Medio |
| P1 | Guardado y sincronización comunican estados ambiguos | Código | Separar borrador, guardado local, pendiente y sincronizado | Medio |
| P1 | Filtros con alcance poco claro y estados vacíos incorrectos | Reproducido | Identificar las metas globales y distinguir cero resultados de cero casos | Bajo |
| P1 | Accesibilidad incompleta de estados interactivos | DOM + código | Estado de chips, foco de switches y errores asociados a cada campo | Medio |
| P2 | KPIs y gráficos dejan huecos grandes | Medido | Grid explícito y agrupación de gráficos compatibles | Bajo |
| P2 | Bitácora móvil oculta el procedimiento | Navegador + medida | Lista compacta móvil con procedimiento visible | Medio |
| P2 | Ajustes reúne configuración, mantenimiento y destrucción | Navegador + código | Agrupar por tarea y aislar acciones destructivas | Medio |
| P2 | Metas se presentan como un editor permanente | Navegador + código | Separar lectura del progreso y edición de metas | Medio |
| P2 | Jerarquía tipográfica y marca poco distintivas | Evaluación visual | Escala más clara, labels legibles y símbolo coherente | Bajo |

**1. Importación: cancelar debe cancelar**

En `assets/js/export.js:69`, el resultado de `confirm()` elige entre fusionar y reemplazar. La opción Cancelar devuelve `false`, y en la línea 74 conduce al reemplazo de todos los casos locales. Si hay conexión configurada, el flujo además programa la subida. El usuario no dispone de una salida neutra desde esa elección.

Propuesta: mostrar el archivo elegido, cantidad de registros, efecto de cada modo y tres acciones explícitas. Reemplazar requiere una confirmación propia con el número de casos afectados; Cancelar cierra sin modificar datos. Este hallazgo proviene del código y no se ejecutó una importación durante la auditoría.

**2. Borrado: el alcance anunciado no coincide con el efecto**

En `assets/js/app.js:134`, la confirmación dice «de este navegador». En la línea 140, si GitHub está configurado, se sube el estado vacío al repositorio. Dos confirmaciones sucesivas no resuelven esa diferencia de significado.

Propuesta: distinguir claramente eliminar la bitácora sincronizada de cualquier eventual acción de limpieza local. Antes del borrado sincronizado, indicar cuántos casos se eliminarán y que afectará la copia remota. Ofrecer exportar un respaldo desde ese mismo flujo. No se probó el borrado.

**3. Navegación móvil y permanencia de la cabecera**

A 390 px, la marca, el estado de sincronización y las pestañas comparten una fila. La marca se parte en varias líneas; las pestañas tienen aproximadamente 104 px disponibles para 332 px de contenido. La sección Nuevo caso queda fuera del área visible y requiere desplazamiento horizontal.

En `assets/css/styles.css:558`, dar `width: 100%` a `.tabs` no neutraliza su `flex: 1` previo. Propuesta: usar una segunda fila con base de flex del 100%, o cuatro destinos distribuidos en una barra móvil. El botón de registro debe encontrarse sin explorar horizontalmente.

También se observó que, con scroll de unos 2173 px, la cabecera tenía su borde superior a unos −1455 px pese a declarar `position: sticky`. La combinación de `html, body { height: 100% }` y un contenido más alto limita su recorrido. Revisar ese contenedor; preferir altura mínima y comprobar la cabecera al llegar al final del formulario.

**4. Protección del trabajo sin guardar**

Prueba reproducida: escribir un diagnóstico ficticio → abrir Bitácora → pulsar + Nuevo caso. El diagnóstico desaparece sin advertencia. `assets/js/bitacora.js:212` llama a `startNew()`, que resetea el formulario.

La advertencia `beforeunload` de `app.js:179` sólo contempla cambios de la base pendientes de subir y conexión configurada. No protege el contenido que todavía se está escribiendo.

Propuesta: guardar un borrador local con estado visible, recuperar después de una recarga y preguntar antes de descartarlo al crear otro caso o limpiar. Un borrador incompleto debe diferenciarse de un caso guardado.

**5. Acortar el registro inicial**

Se contaron 40 controles visibles y ocho bloques. En escritorio, el formulario mide aproximadamente 2859 px de alto. En móvil supera los 6090 px; el botón Guardar aparece alrededor del píxel 6141 desde el inicio del documento. Sólo los procedimientos asociados ocupan unos 2080 px.

Propuesta: presentar primero fecha, lateralidad, diagnóstico, rol, abordaje y procedimiento principal: los seis campos obligatorios actuales. Añadir los detalles mediante bloques plegables, con estado de completitud y apertura automática cuando contengan errores. Mantener el guardado disponible en una barra inferior que respete el teclado y el área segura del móvil.

Reemplazar los 56 chips visibles por un selector con búsqueda, grupos y resumen de seleccionados. El principal también debería poder buscarse por nombre o sigla. Mostrar tiempo de isquemia y detalle de complicación cuando sus controles relacionados estén activos. Permitir completar seguimiento y actividad académica después del registro inicial.

**6. Contraste de las acciones principales**

En modo oscuro, `.btn-primary` mantiene texto blanco sobre el acento `#38bdf8`: contraste calculado de **2,14:1**. En claro, blanco sobre `#0e7490` alcanza **5,36:1**. El problema requiere un tratamiento por tema.

Propuesta: introducir un token para el texto sobre acento. En oscuro, `#0d141c` sobre `#38bdf8` alcanza **8,64:1**. Comprobar también hover, foco y deshabilitado. El mínimo para texto normal es 4,5:1 según [WCAG, contraste mínimo](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum).

**7. Fecha predeterminada y métricas fiables**

El formulario mostró 02/10/2026 durante el 01/10/2026 local en Santiago. `assets/js/util.js:41` obtiene el día con `toISOString()`, que usa UTC. Propuesta: construir la fecha a partir de los componentes locales; conservar UTC para timestamps de sincronización.

El KPI de duración mostró «mediana ≈ 92 min». `assets/js/dashboard.js:58` redondea el promedio para producir ese texto. En los 14 casos ficticios, el promedio es 91,79 min y la mediana real es **97,5 min**. Corregir el cálculo o eliminar la afirmación.

La cifra académica suma presentados y publicables. En el ejemplo resulta 6, pero hay 5 casos únicos porque uno está en ambos grupos. Puede representar seis actividades si se etiqueta así; si representa casos, debe deduplicarse. El alcance debe quedar explícito.

**8. Gráficos que mantengan legibilidad**

Las barras usan un `viewBox` de 620 unidades y labels de 11 unidades. En móvil se dibujan con unos 309 px de ancho: el texto queda aproximadamente en **5,5 px**. En escritorio, la misma geometría escala hacia arriba y vuelve muy grandes los gráficos de ancho completo. El ranking ocupa aproximadamente 614 px de alto en el viewport inicial.

Propuesta: labels HTML con tamaño estable, barras dimensionadas según el espacio disponible y valores visibles al tocar o enfocar. Para evolución temporal, reducir labels del eje en móvil y conservar el acceso a todos los valores. Añadir un resumen o tabla desplegable de datos. El atributo accesible actual ayuda, pero no sustituye una lectura visual legible.

**9. Guardado, respaldo y sincronización como estados separados**

El onboarding dice que «el formulario guarda solo», pero los casos se guardan al pulsar una acción. `form.js:228` anuncia «subiendo a GitHub» cuando hay conexión configurada, incluso si el guardado automático está desactivado. `util.js:111` oculta errores de localStorage y continúa en memoria; el flujo puede comunicar éxito aunque los datos no sobrevivan a una recarga. Estos escenarios se identificaron en código; no se forzó un fallo de almacenamiento ni se conectó GitHub.

Propuesta: usar mensajes precisos: «Borrador guardado», «Caso guardado en este dispositivo», «Pendiente de sincronizar», «Sincronizando» y «Sincronizado a las…». Ante un fallo de persistencia, mantener un aviso y facilitar exportar. No mostrar éxito remoto antes de recibirlo.

El JSON de respaldo en `export.js:51` contiene casos, pero no objetivos, aunque el archivo de sincronización sí los incluye. Para un respaldo completo de la bitácora, incluir también las metas y las preferencias pertinentes, excluyendo credenciales.

**10. Filtros, metas y estados sin resultados**

Al buscar una cadena sin coincidencias, los KPIs quedan en cero y las metas siguen computando 14 casos. Esa decisión de producto es válida para exposición acumulada, pero la interfaz no explica que las metas ignoran los filtros. Los gráficos muestran «Sin casos registrados todavía», aunque hay registros.

Propuesta: separar «Resumen del período» y «Progreso acumulado del fellowship», con una indicación visible del alcance. Ante cero resultados, decir «No hay casos para estos filtros» y ofrecer restablecerlos. Evitar presentar 0% de complicaciones como un resultado favorable cuando la muestra está vacía.

El CSV usa los filtros del dashboard incluso cuando se exporta desde Ajustes; no usa la búsqueda de Bitácora. Mostrar antes de exportar el número de casos y el alcance, o separar Exportar todos de Exportar resultados.

**11. Accesibilidad de los estados**

Los chips comunican selección con `.on`, pero no tienen `aria-pressed`. Los switches esconden su input con tamaño cero y opacidad cero; falta una regla que dibuje el foco sobre el control visible. La búsqueda y el orden de Bitácora necesitan nombres accesibles explícitos. Los errores marcan `aria-invalid`, pero no tienen una explicación enlazada por campo.

Propuesta: estado accesible de chips, foco visible en el switch, labels para búsqueda y orden, y errores con `aria-describedby`. Distinguir «campo obligatorio» de «valor fuera de rango»: la validación actual usa un mensaje genérico sobre datos obligatorios. Respetar movimiento reducido también en el scroll programático de JavaScript.

Para controles táctiles frecuentes, recomiendo un área cómoda de unos 44 px; es una decisión de usabilidad. WCAG 2.2 AA define un mínimo de 24 × 24 px con excepciones, no 44 px: [tamaño mínimo de objetivos](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum). Esta revisión no constituye una certificación completa de accesibilidad.

**12. Composición del dashboard**

En los dos tamaños de escritorio comprobados, siete KPIs ocupan la primera fila y el octavo queda solo debajo. En la cuadrícula de gráficos, una tarjeta de una columna seguida por otra de ancho completo deja media fila vacía. Esto ocurre con Participación por rol y Lateralidad, y al final con Complicaciones.

Propuesta: cuatro columnas de KPIs en escritorio y dos en móvil, con cuatro indicadores prioritarios y los demás secundarios. Para gráficos, agrupar parejas compatibles y reservar ancho completo para contenido que lo necesite. Puede usarse `grid-auto-flow: dense`, como pide gpt-taste para bento, pero comprobar que el orden visual conserve una lectura y navegación lógica. Una composición explícita evita depender del relleno automático.

**13. Bitácora y detalle en móvil**

La tabla midió aproximadamente 984 px dentro de un contenedor de 347 px. La primera vista muestra código, fecha y rol; el procedimiento, que permite reconocer el caso, queda fuera de pantalla. El scroll está contenido: es un problema de priorización, no de desbordamiento global.

Propuesta: lista móvil con procedimiento como título, fecha y lateralidad visibles, rol secundario y acción de abrir detalle. Conservar la tabla en escritorio. Diferenciar «sin casos» de «sin resultados» y ofrecer una acción pertinente. Añadir seguimiento desde el detalle reduciría la necesidad de abrir todo el formulario para una actualización breve.

**14. Metas, onboarding y Ajustes**

Las metas siempre muestran inputs y controles de borrado. Propuesta: vista de lectura con nombre completo, casos/meta y porcentaje; un botón Editar metas abre la administración. Priorizar objetivos pendientes mediante un criterio estable y visible. No reordenar filas inesperadamente durante la edición.

El onboarding coloca conectar GitHub como primer paso, aunque el usuario puede empezar localmente. Propuesta: acciones claras para registrar el primer caso o recuperar una bitácora existente, con sincronización como tarea posterior cuando corresponda. La guía inicial y las metas aparecen sin separación suficiente; un espacio consistente resolvería ese borde compartido.

Ajustes mezcla conexión, respaldo, demo, borrado e instrucciones de publicación. Propuesta: «Sincronización», «Importar y exportar» y «Administración», con la zona destructiva separada. Mover instrucciones de publicación a ayuda. Etiquetas como «Descargar cambios» y «Sincronizar ahora» explican mejor la acción cotidiana; los parámetros técnicos pueden quedar en una sección avanzada.

**15. Dirección visual propuesta**

Una bitácora quirúrgica editorial: sobria, precisa y fácil de escanear. Mantener el acento frío, reducir el protagonismo uniforme de todos los contenedores y usar la tipografía para distinguir información principal, secundaria y editable.

- Títulos de vista: aproximadamente 28–32 px en escritorio y 24–28 px en móvil.
- Texto de trabajo y campos: aproximadamente 15–16 px.
- Labels: aproximadamente 13–14 px, preferentemente en caja de oración; reservar mayúsculas para usos puntuales.
- Separaciones coherentes de 8, 12, 16, 24 y 32 px según relación entre elementos.
- Una acción principal reconocible: Registrar caso en las vistas de consulta; Guardar caso en el formulario.
- Coherencia de marca: el favicon representa un ángulo de rodilla, mientras la cabecera usa KR. Elegir un símbolo y aplicarlo de forma consistente.
- Si se adopta Geist u otra tipografía propuesta por la skill, servirla localmente. La pila del sistema actual ya es una opción funcional.
- Movimiento breve para foco, selección, validación y apertura del panel; sin desplazar información durante tareas de registro.

**Orden recomendado de implementación**

| Etapa | Cambios | Resultado esperado |
|---|---|---|
| 1 | Importación, alcance del borrado, contraste, fecha y mediana | Acciones y datos que inspiran confianza |
| 2 | Navegación móvil, cabecera sticky y composición del dashboard | Consulta clara en móvil y portátil |
| 3 | Registro esencial, selector de procedimientos, campos condicionales y borradores | Menor esfuerzo para cargar y completar un caso |
| 4 | Gráficos responsive, lista móvil, alcance de filtros, estados de sincronización y accesibilidad | Uso continuo más eficiente |
| 5 | Metas, onboarding, Ajustes, tipografía y marca | Una experiencia visual consistente |

**Criterios para revisar una futura implementación**

1. Cancelar una importación no cambia casos ni programa una subida.
2. Toda confirmación de borrado declara si afecta al repositorio remoto.
3. Las cuatro secciones se encuentran sin scroll horizontal a 390 px; la navegación sigue disponible al final del contenido.
4. Un borrador ficticio se recupera después de recargar y no desaparece silenciosamente al crear otro caso.
5. Se puede guardar un registro válido completando los seis campos esenciales, sin recorrer detalles opcionales vacíos.
6. El texto de los botones principales alcanza al menos 4,5:1 en ambos temas.
7. La fecha predeterminada coincide con Santiago cuando UTC ya está en el día siguiente; la mediana de la demo es 97,5 min.
8. Los gráficos conservan labels legibles en móvil; el caso puede reconocerse por procedimiento sin mover horizontalmente la lista.
9. Una búsqueda sin coincidencias muestra un estado de resultados vacío y explica el alcance global de las metas.
10. Con teclado se reconocen foco, selección y errores; los mensajes distinguen persistencia local y sincronización remota.

En el momento de esta auditoría el código de la app no se modificó. Los problemas remotos y destructivos se identificaron mediante lectura del código, sin ejecutar esos efectos. Las propuestas de jerarquía y composición son criterio de diseño; el tiempo real de registro debe medirse con usuarios en una siguiente validación.

Las mejoras se implementaron posteriormente. Ver [implementación y validación](implementacion-ui-ux.md).
