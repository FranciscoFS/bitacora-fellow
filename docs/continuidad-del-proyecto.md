# Continuidad del proyecto: Bitácora Fellow

Actualizado: 11 de noviembre de 2026. Estado vigente y decisiones del desarrollo; no es una transcripción completa.

## Estado actual

- Último desarrollo local: categoría Aparato extensor con roturas patelar/cuadricipital, fallas de reparación e insuficiencia. Procedimientos específicos de reparación/reinserción, revisión, reconstrucción y refuerzo. Recursos v=46, 39/39 pruebas correctas. Pendiente revisión en demo, commit y publicación de esta ampliación. [Bitácora del 11 de noviembre](bitacoras/2026-11-11-aparato-extensor.md).
- Publicación previa verificada el 8 de noviembre: commit `241623d` subido a main, Pages servía recursos v=45 y Cx completa. Las menciones siguientes a implementación local y publicación pendiente describen la etapa anterior a ese push.
- Añadida «Cx completa» como primera opción de «Pasos que realicé personalmente», disponible al elegir un procedimiento y sin preselección. Usa el almacenamiento y las exportaciones existentes. Recursos locales v=45; 38/38 pruebas correctas. [Bitácora](bitacoras/2026-11-08-cx-completa.md).
- Objetivo activo: probar en la demo local las correcciones de la auditoría, sin publicar ni sincronizar.
- Implementado localmente: varios diagnósticos por caso, cada uno con categoría, detalles y clasificaciones propias. Patrón meniscal (incluye Radial), lesión condral reinsertable Sí/No, Schatzker opcional y Schenck directamente desde Luxación de rodilla. Agregar o quitar un diagnóstico conserva los otros. Texto libre, sugerencias y borradores conservados.
- Procedimientos solicitados: reconstrucción del ligamento patelofemoral medial (RLPFM / MPFL), esquina posteromedial (EPM) y esquina posterolateral (EPL), disponibles como principal o asociado. RLPFM y EPL reemplazan etiquetas previas mediante alias; EPM es nuevo. Casos y metas anteriores mantienen la compatibilidad.
- Nuevas correcciones: Reinserción condral como procedimiento principal/asociado; búsquedas por RLCA/RLCP; resumen de procedimientos combinados y diagnósticos en tabla y tarjetas; etiquetas redundantes ocultas sólo en presentación. Isquemia/complicación intraoperatoria distinguen Sí, No y vacío. La tasa de complicaciones excluye casos sin respuesta.
- Verificado: 38 pruebas de regresión correctas, sintaxis correcta en 12 módulos JS y `git diff --check`. Las verificaciones anteriores de diagnósticos múltiples se conservan; se añadieron catálogo ampliado, motivos múltiples de revisión y conteo único en metas, y revisión del botón Revisión protésica a 320 px.
- Base de esta ampliación: `e274750`, rama `main`. El usuario autorizó guardar los cambios acumulados en un commit local. Recursos `v=45`, formato de respaldo `version: 2` con importación de casos antiguos. [Registro del commit](bitacoras/2026-11-08-commit-ampliacion.md).
- Usuarios/base de datos: se discutieron Supabase, Firebase y Clerk + Supabase. No hay proveedor elegido ni implementación; continúa la sincronización con GitHub.
- Auditoría posterior: se simularon y guardaron cuatro casos ficticios en Chrome, `http://127.0.0.1:8770/?demo=1`, CIR-0015–CIR-0018; persistieron al reabrir. Sin configuración ni acciones de sincronización. El caso de reinserción condral requirió Otro y notas porque falta en el catálogo. El usuario confirmó la descarga de un respaldo.
- Prueba de la versión mejorada: CIR-0019–CIR-0022 en la misma demo local de Chrome (22 casos totales). Buscar `Prueba mejorada` para aislar los cuatro. Los casos originales de la auditoría se conservaron como comparación.
- Compatibilidad: los diagnósticos antiguos compuestos se conservan como una sola descripción, sin separarlos ni inferir datos clínicos. Respuestas negativas ya guardadas se conservan; no se pueden distinguir retrospectivamente de antiguos valores predeterminados. Los nuevos campos vacíos se guardan como null y se exportan vacíos en CSV.
- Próximo paso: continuar la revisión en la demo. Commit local autorizado el 8 de noviembre. Push y publicación pendientes de solicitud.
- Ampliación aprobada para demo: menisco discoide, déficit meniscal, falla de plastia y cíclope; categoría Revisión protésica con motivos combinables. Añadidos tallado, reinserción de raíz, injerto de túneles, fijación/perforaciones osteocondrales, resección de cíclope, movilización bajo anestesia, DAIR, retiro con espaciador y reimplantación. No se elige una cirugía automáticamente por diagnóstico.
- Demo ampliada: CIR-0023 discoide con tallado/sutura; CIR-0024 revisión por aflojamiento e inestabilidad, con una cirugía. En Chrome, puerto 8770, buscar Catálogo ampliado (2 de 24 casos). Detalles adicionales de morfología, estabilidad, componentes y etapa se pueden escribir; estructurarlos es el siguiente paso del plan, todavía pendiente.
- Plan y última ejecución: [plan y demo del catálogo ampliado](bitacoras/2026-11-08-plan-y-demo-catalogo-ampliado.md). La propuesta anterior queda como historial. Sin publicar ni sincronizar.
- Última bitácora: [implementación de diagnósticos múltiples](bitacoras/2026-11-08-demo-diagnosticos-multiples.md). La [auditoría anterior](bitacoras/2026-11-08-auditoria-cuatro-casos.md) conserva el comportamiento previo a las correcciones.
- Detalle de esta ejecución: [bitácora del 08-11-2026](bitacoras/2026-11-08-diagnosticos-y-procedimientos.md). Comandos: [guía de desarrollo](guia-desarrollo.md).

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

El usuario confirmó que agregó la conversación al proyecto/carpeta de Codex. Este documento y `AGENTS.md` conservan el contexto en archivos para futuras conversaciones, independientemente del historial disponible en la app.
