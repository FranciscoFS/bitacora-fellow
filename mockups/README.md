# Cuatro propuestas para Bitácora Fellow

Maquetas HTML independientes para elegir la próxima dirección visual. Modo claro, amarillo en acciones principales y celeste complementario. La prioridad común es registrar un caso recién terminado.

Desde la raíz del repositorio:

```powershell
python -m http.server 8765
```

Abrir [el comparador](http://localhost:8765/mockups/index.html). También se puede abrir `index.html` directamente en un navegador; no necesita compilación ni dependencias externas.

| Propuesta | Archivo | Dirección |
|---|---|---|
| Estación clínica | [station.html](station.html) | Navegación estable, trabajo compacto y metas visibles. |
| Pulso | [pulse.html](pulse.html) | Tipografía contundente, composición suiza y datos abiertos. |
| Cuaderno digital | [daybook.html](daybook.html) | Actividad personal, formas suaves y fondo celeste. |
| Atlas académico | [atlas.html](atlas.html) | Registro destacado y matriz de exposición por procedimiento. |

El comparador permite ver dos propuestas, cambiar entre primer uso y casos registrados, y abrir una propuesta completa. Cada maqueta permite registrar, editar, buscar, filtrar y ajustar objetivos. Los casos y cambios son ficticios, viven en memoria y se reinician al recargar. Recuperación e importación son orientación de interfaz, sin conexión real.

Las maquetas no modifican la app actual. Consulta [las decisiones y user stories](DESIGN.md), [la revisión final](REVIEW.md) y las capturas de escritorio y móvil en `captures/`.

`build.py` regenera los cuatro HTML. CSS y JavaScript están en `assets/`; las fuentes locales incluyen sus licencias OFL en `assets/fonts/`.
