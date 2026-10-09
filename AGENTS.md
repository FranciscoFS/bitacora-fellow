# Bitácora Fellow

Antes de continuar el desarrollo, lee `docs/continuidad-del-proyecto.md` y revisa el estado de Git. Ese documento conserva las decisiones de esta conversación y la ubicación de ambas carpetas.

- Carpeta principal: `C:/Users/franc/OneDrive/Desktop/Proyectos/Bitacora Fellow`, rama `main`.
- Copia alternativa (worktree del mismo repositorio): `C:/Users/franc/.codex/worktrees/review-redesign/Bitacora Fellow`, rama `redesign/ui-ux`.
- `main` es la rama principal y la fuente de GitHub Pages. La interfaz de `redesign/ui-ux` ya se integró en ella. Trabaja en `main` salvo indicación del usuario.
- Conserva el stack de HTML, CSS y JavaScript puro y el idioma español.
- Mantén el registro de casos directo, las metas acumuladas y la adaptación a móvil. Usa la demostración `?demo=1` para comprobar la interfaz con datos ficticios.
- Preserva almacenamiento, importación, exportación y sincronización. No añadas casos reales, respaldos privados ni credenciales al repositorio de código.
- Para cambios funcionales, ejecuta `node --test tests/regression.test.cjs` y revisa la sintaxis de los módulos afectados. Para cambios visuales, comprueba móvil y escritorio.
- Verifica qué cambios locales y remotos existen antes de un commit o merge. Las dos carpetas pueden estar en commits distintos; no las supongas idénticas.
- Actualiza el documento de continuidad cuando cambien decisiones importantes, ramas o ubicaciones. Los informes de diseño antiguos describen etapas previas y no sustituyen el estado actual.
