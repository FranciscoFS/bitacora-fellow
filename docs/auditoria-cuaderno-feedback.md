# Auditoría del cuaderno digital y decisiones

Auditoría realizada con un subagente usando Impeccable; revisión y selección final por el agente principal. Alcance: Inicio, gráficos, metas, navegación, temas y adaptación móvil. Se revisaron código y capturas; las comprobaciones interactivas posteriores usaron solo la demostración con casos ficticios.

## Hallazgos y decisión

| Prioridad | Hallazgo | Decisión |
| --- | --- | --- |
| P1 | El mosaico podía cortar nombres y cantidades en cajas pequeñas. | Implementado: cálculo con ancho real y estimación de espacio para el nombre; cambia a lista cuando no cabe. Recalcula al cambiar ancho. |
| P1/P2 | Rellenos de frecuencia apenas distinguibles del fondo: 1,27–1,77:1 en claro; 1,21–1,99:1 en oscuro. | Implementado: cuatro tonos azules más definidos, texto blanco contrastado y contorno en oscuro. En móvil, texto separado de la barra proporcional. |
| P2 | Metas con mínimos de columnas demasiado anchos para el panel lateral en tablet. | Implementado: filas apiladas mediante consulta al ancho del contenedor, también al editar. |
| P2 | No se podía probar una columna en escritorio. | Implementado: selector con iconos y texto, estado accesible y preferencia local. Dos columnas iniciales; en móvil, una columna sin selector redundante. El análisis expandido también respeta la elección. |
| P2 | El gráfico mensual no explicita el desplazamiento horizontal en móvil. | Pendiente: conserva desplazamiento por teclado y tabla de valores; no bloquea esta comparación de distribuciones. |
| P2 | La navegación general no traslada el foco al título nuevo. | Pendiente: requiere revisar navegación, historial y formularios como conjunto; no se cambia el foco al alternar columnas. |

## Criterios

Se mantiene el cuaderno digital, los botones amarillos y el complemento celeste. No se añaden métricas de seguimiento de uso ni animaciones nuevas. La preferencia se guarda en el navegador, separada de registros y sincronización; la demostración conserva su almacenamiento independiente. El orden de lectura permanece: recientes, práctica, gráfico mensual y metas; en dos columnas, las metas se ven al lado.

## Validación

- 28 pruebas de regresión existentes aprobadas.
- Selector comprobado con recarga: conserva una columna y `aria-pressed` correcto.
- Escritorio 1280 px y móvil 390 px sin desbordamiento horizontal de página. El gráfico mensual mantiene su desplazamiento interno.
- Texto blanco en los cuatro tonos claros: 7,40 / 5,75 / 5,23 / 4,73:1. Se verifica también el conjunto oscuro.
- Detector mecánico Impeccable: sin hallazgos en los archivos modificados.
- Capturas: [dos columnas](capturas/layout-two-columns.png), [una columna](capturas/layout-one-column.png), [móvil](capturas/layout-mobile.png).
