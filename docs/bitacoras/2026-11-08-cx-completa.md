# 8 de noviembre de 2026 · Cx completa

- Solicitud: incorporar «Cx completa» a los pasos realizados personalmente.
- Implementación: primera opción en `personalStepsFor`, con el mismo botón seleccionable y desmarcable que los otros pasos. Disponible para cualquier procedimiento; no se marca automáticamente ni modifica el rol.
- Persistencia: se conserva en `pasosRealizados`, ficha y exportaciones existentes. Se ampliaron las pruebas de opciones y recorrido de almacenamiento/JSON/CSV con el valor nuevo.
- Verificación: 38/38 pruebas correctas con `node --test tests/regression.test.cjs`, sintaxis de `config.js` correcta y `git diff --check` sin errores. No se hizo revisión visual adicional para esta opción, que reutiliza el componente existente.
- Recursos v=45 para recargar el catálogo actualizado. Demo local: http://127.0.0.1:8770/?demo=1#nuevo.
- Sin commit, push, publicación ni sincronización. Cambios anteriores conservados.
