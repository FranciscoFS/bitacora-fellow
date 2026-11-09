# 8 de noviembre de 2026 · Plan y demo del catálogo ampliado

## Objetivo

El usuario aprobó planificar la ampliación y verla en la demo. Se priorizaron menisco discoide/tallado y los motivos independientes de revisión protésica. La revisión puede tener varios diagnósticos y un único procedimiento principal, sin seleccionar automáticamente cirugías a partir de un motivo.

## Plan y avance

1. **Catálogo base y compatibilidad — implementado localmente.** Añadir diagnósticos y gestos identificables aprovechando los diagnósticos múltiples y detalles existentes; conservar nombres anteriores, IDs, metas y respaldos. No fusionar tallado con meniscectomía ni asignar cirugía automáticamente.
2. **Casos de demostración y verificación — ejecutado.** Registrar discoide con tallado/sutura y una revisión con aflojamiento/inestabilidad. Mantener los ejemplos anteriores y probar móvil/escritorio.
3. **Refinar detalles tras la revisión del usuario — pendiente.** Valorar campos propios de morfología/estabilidad del discoide, localización de raíz, componentes y etapa de revisión. Por ahora esos datos adicionales se pueden escribir en Detalles de cada diagnóstico. Revisar también deformidad varo/valgo y agrupación de procedimientos para metas. No añadir clasificaciones ni equivalencias clínicas automáticamente.
4. **Publicación — pendiente de solicitud.** Revisar la demo, guardar los cambios en Git y publicar sólo cuando el usuario lo solicite. No se hizo commit, push ni sincronización.

## Implementación actual

- Diagnósticos: Menisco lateral discoide; Déficit meniscal posmeniscectomía; Falla de plastia de LCA; Lesión de cíclope.
- Nueva categoría Revisión protésica: Infección periprotésica, Aflojamiento aséptico de prótesis, Inestabilidad protésica, Desgaste de polietileno, Osteólisis periprotésica, Rigidez tras artroplastia y Otro motivo de revisión protésica. Se pueden seleccionar varios motivos.
- Infección periprotésica sigue accesible en Infección. Al seleccionar desde una categoría concreta, el formulario respeta ese contexto, sin duplicar el diagnóstico en un caso.
- Procedimientos nuevos: Meniscoplastia / tallado meniscal (saucerización); Reinserción de raíz meniscal; Injerto óseo de túneles; Fijación de fragmento osteocondral; Perforaciones por osteocondritis disecante; Resección de lesión de cíclope; Movilización bajo anestesia; Desbridamiento y retención de implantes (DAIR); Retiro de prótesis y colocación de espaciador; Reimplantación protésica.
- Se mantienen Meniscectomía parcial, Reparación meniscal (sutura), Prótesis de revisión y los procedimientos anteriores. Las opciones nuevas están disponibles como principal o asociado; Cambio de VAC sigue siendo sólo adicional.
- Recursos locales: `v=44`. Sin cambios adicionales en el formato de respaldo versión 2.

## Casos de prueba

Origen: `http://127.0.0.1:8770/?demo=1#bitacora`, Chrome. Buscar **Catálogo ampliado** para aislar los dos nuevos casos. Total final: 24 registros ficticios; los ejemplos anteriores se conservaron.

| Código | Diagnóstico | Cirugía |
| --- | --- | --- |
| CIR-0023 | Menisco lateral discoide | Tallado/saucerización + Reparación meniscal (sutura) |
| CIR-0024 | Aflojamiento aséptico de prótesis + Inestabilidad protésica | Prótesis de revisión |

Fecha de prueba 08/11/2026, rol ficticio Cirujano (supervisado), abordajes de prueba Artroscópico y Abierto respectivamente. Lateralidad, duración, patrón de rotura y otros datos no proporcionados se dejaron vacíos. Isquemia y complicación continúan como datos sin responder. Los ejemplos no son indicaciones terapéuticas.

Se comprobó en la ficha del CIR-0024 que conserva ambos motivos y un único procedimiento de revisión.

## Verificaciones

- 38/38 pruebas de regresión correctas; se añadió una para catálogo, clasificación por áreas, motivos múltiples, conteo único en metas y respeto de la categoría de infección elegida.
- Sintaxis correcta en los 12 módulos JS y `git diff --check` correcto.
- Revisión de catálogo y registro en escritorio. A 320 px, el botón Revisión protésica y las demás categorías se ajustan al ancho sin desbordamiento. Se restableció el tamaño de ventana al terminar.
- [Captura de la demo ampliada](../capturas/demo-catalogo-ampliado.jpg).
- Sin pruebas de conexión ni acciones de sincronización. Sin publicación ni cambios en el worktree alternativo.

La propuesta de la bitácora anterior se conserva como referencia histórica. Los detalles estructurados indicados en el paso 3 siguen pendientes; no se presentan como terminados.
