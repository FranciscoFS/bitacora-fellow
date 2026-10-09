# Continuidad del proyecto: Bitácora Fellow

Actualizado: 9 de octubre de 2026. Resumen del desarrollo y las decisiones de la conversación; no es una transcripción completa.

## Objetivo

Aplicación para registrar la experiencia quirúrgica durante un fellowship de rodilla, consultar casos y medir metas. Interfaz en español, disponible en computador y móvil. HTML, CSS y JavaScript sin framework ni build obligatorio.

## Carpetas, ramas y publicación

| Uso | Carpeta | Rama |
| --- | --- | --- |
| Desarrollo principal y publicación | `C:/Users/franc/OneDrive/Desktop/Proyectos/Bitacora Fellow` | `main` |
| Copia alternativa para revisión | `C:/Users/franc/.codex/worktrees/review-redesign/Bitacora Fellow` | `redesign/ui-ux` |

La copia alternativa es un worktree del mismo repositorio, no un repositorio independiente. Conserva su propia carpeta de trabajo y rama. Usa `git worktree list` para comprobar sus ubicaciones actuales.

- Repositorio: https://github.com/FranciscoFS/bitacora-fellow
- Web principal: https://franciscofs.github.io/bitacora-fellow/
- Demostración independiente: https://franciscofs.github.io/bitacora-fellow/?demo=1
- GitHub Pages publica desde `main`, directorio raíz.
- Último merge de la conversación: `dbb32aa`, con los cambios de `redesign/ui-ux` integrados en `main`.
- Último commit de la rama alternativa al preparar este documento: `ddc8f6c`.
- Ambos commits fueron subidos a GitHub. Se verificó la publicación de `dbb32aa` mediante Pages y los recursos con versión `v=41`.
- Desde ese merge, el usuario acordó continuar trabajando sobre `main`. La alternativa queda disponible como referencia; no contiene los ajustes posteriores hechos al resolver el merge.

## Cambios aprobados e implementados

- Registro directo mediante botones para lateralidad, rol y abordaje, sin preselección obligatoria; volver a pulsar permite desmarcar. Textos explicativos reducidos.
- Diagnóstico con sugerencias de los casos anteriores, buscando sin distinguir acentos.
- Catálogo con prótesis de revisión y prótesis tumoral; área Trauma renombrada Fracturas.
- Detalles opcionales de osteotomía tibial alta y femoral distal: apertura/cierre y medial/lateral, independientes por procedimiento, conservados en exportaciones.
- Aseo quirúrgico como principal o adicional. Cambio de VAC únicamente como procedimiento adicional.
- Inicio con bloques interactivos y animaciones que respetan reducción de movimiento. La animación de entrada no se repite en cada regreso durante la sesión.
- Procedimientos principales en tarjetas ordenadas por frecuencia, sin selector de rol ni barras proporcionales. Muestran seis inicialmente y permiten expandir el resto.
- Períodos finales en `main`: 30 días, 90 días, este año e historial. Las tarjetas abren exactamente los casos correspondientes en la bitácora.
- Gráfico mensual con línea, puntos y área translúcida sobre tarjeta clara, meses sin casos y valores accesibles.
- Hasta tres metas destacadas con círculos de progreso, elegibles en Editar metas. Se conservan la edición completa, metas agrupadas y el conteo solo como cirujano.
- Bitácora con rol y etiquetas de categoría global en colores, además de etiquetas asignadas; visibles en tabla, tarjetas móviles y ficha.
- Ajustes de tipografía y tamaños para móvil. Barra de guardado compacta con Guardar caso y Más acciones, que reúne Guardar y crear otro y Descartar borrador.
- Paleta azul/celeste y amarillo pastel, modo claro inicial, superficies más suaves, roles neutros y categorías con contraste revisado en claro y oscuro.

La preferencia del usuario es una experiencia fluida, con poco texto accesorio, sin listas desplegables innecesarias y con controles legibles en móvil. No restaurar el mosaico proporcional ni los antiguos filtros de 4/12 semanas por seguir informes históricos.

## Mapa del código

- `index.html`: estructura y versiones de recursos.
- `assets/css/styles.css`, `daybook.css`, `home.css`: estilos base, cuaderno e inicio.
- `assets/js/config.js`: procedimientos y configuración.
- `assets/js/form.js`: formulario, borrador y sugerencias.
- `assets/js/bitacora.js`: listado, etiquetas, filtros de tarjetas y detalle.
- `assets/js/practice.js`: períodos y frecuencia de procedimientos principales.
- `assets/js/home.js`, `dashboard.js`, `charts.js`: inicio, metas e indicadores.
- `assets/js/store.js`, `export.js`, `github.js`: datos, respaldos y sincronización.
- `tests/regression.test.cjs`: pruebas funcionales con datos ficticios.
- `docs/guia-de-uso.md`: guía de la app. Los demás informes de diseño y `PRODUCT.md` contienen también propuestas de etapas anteriores.

## Retomar el trabajo

1. Leer este documento y `AGENTS.md`.
2. Revisar `git status --short --branch` y `git worktree list`. Consultar el estado de la alternativa si se va a comparar o modificar.
3. Iniciar una vista local con `python -m http.server 8765 --bind 127.0.0.1` y abrir `http://127.0.0.1:8765/?demo=1`.
4. Comprobar los cambios funcionales con `node --test tests/regression.test.cjs`. Al cerrar el merge pasaron las 28 pruebas y la revisión de sintaxis de los 12 módulos JS; se verificaron el filtro anual y la navegación a sus casos en móvil.
5. Para interfaz, revisar móvil estrecho y escritorio; conservar datos reales fuera de las demostraciones y capturas.

La configuración de sincronización y los casos del usuario están separados del código de la aplicación. Un push del código no equivale a respaldar los casos guardados en un navegador.

## Organización en Codex

Nombre previsto: **Bitácora Fellow**. Carpeta principal: la de `main`; carpeta secundaria de referencia: el worktree `review-redesign` indicado arriba.

Este documento y `AGENTS.md` permiten recuperar el contexto en futuras conversaciones. Su creación no registra por sí misma el proyecto en la interfaz de Codex ni mueve esta conversación a un proyecto. Ese registro debe confirmarse en la app.

No había una nueva tarea de producto pendiente al preparar este resumen. El siguiente objetivo del usuario es organizar el proyecto local y conservar el contexto de esta conversación.
