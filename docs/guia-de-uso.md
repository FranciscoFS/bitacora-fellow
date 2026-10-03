# Guía de Bitácora Fellow

Aplicación web para registrar las cirugías de rodilla durante el fellowship: **formulario de carga + dashboard interactivo con indicadores y gráficos**.

- Sin instalación, sin build, sin dependencias externas: son archivos estáticos (HTML + CSS + JS puro).
- Funciona **offline** (los datos quedan en el navegador) y se **sincroniza online** con un repositorio **privado** de GitHub.
- Se publica gratis en **GitHub Pages** y se puede usar desde la computadora y el celular con la misma base de datos.

---

## 1. Probarla en tu computadora

**Opción rápida:** doble clic en `index.html`. Funciona, pero algunos navegadores bloquean el `fetch` a GitHub desde `file://`.

**Opción recomendada** (servidor local):

```powershell
cd "c:\Users\franc\OneDrive\Desktop\Proyectos\Bitacora Fellow"
python -m http.server 8765
```

Luego abre <http://localhost:8765/>.

> En **Ajustes → Abrir demostración** puedes abrir una demo independiente con 14 casos ficticios. No modifica tus registros ni se conecta a GitHub.

---

## 2. Publicarla en GitHub Pages

1. Crea un repositorio **público** llamado, por ejemplo, `bitacora-fellow`.
2. Sube **todos los archivos de esta carpeta** (el repositorio sólo tiene código, nunca datos de pacientes):

   ```powershell
   cd "c:\Users\franc\OneDrive\Desktop\Proyectos\Bitacora Fellow"
   git init
   git add .
   git commit -m "Bitácora Fellow: formulario y dashboard"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/bitacora-fellow.git
   git push -u origin main
   ```

   El `.gitignore` ya deja afuera las carpetas de skills del asistente (`.agents/`, `.claude/`, `skills-lock.json`), los restos de pruebas y archivos con estos nombres o extensiones (`data/`, `*.csv`, `*.xlsx`, `bitacora*.json`). Aun así, antes de publicar ejecuta `git status` y verifica que no aparezca ningún archivo con datos reales: el repositorio de la app es público.

> ⚠️ **Nunca subas datos de pacientes al repositorio de la app.** Las planillas viejas y los respaldos van al repositorio **privado** de datos o quedan sólo en tu computadora.

3. En el repositorio: **Settings → Pages → Source: Deploy from a branch → main → /(root) → Save**.
4. Cuando termine el despliegue, la app queda en:

   ```
   https://TU-USUARIO.github.io/bitacora-fellow/
   ```

---

## 3. Conectar la base de datos (una sola vez)

Los registros se guardan en el navegador. Si conectas GitHub, también se sincronizan con un archivo `bitacora.json` en un repositorio privado tuyo.

### 3.1 Crear el repositorio de datos

1. GitHub → **New repository**.
2. Nombre: `bitacora-rodilla-data`
3. Visibilidad: **Private** ⚠️ (importante).
4. **No** agregar README ni .gitignore.

### 3.2 Crear el token de acceso

1. **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. *Token name*: `bitacora-fellow`. *Expiration*: la que prefieras (con 1 año alcanza; después generas otro).
3. **Repository access** → *Only select repositories* → elige **sólo** `bitacora-rodilla-data`.
4. **Permissions → Repository permissions → Contents** → **Read and write**. No hace falta ningún otro permiso.
5. **Generate token** y copia el valor (`github_pat_…`): se muestra una sola vez.

### 3.3 Cargar los datos en la app

En **Ajustes → Sincronización**, completa usuario, repositorio y token. La rama y la ruta se toman de la configuración del código:

| Campo | Valor |
|---|---|
| Usuario u organización | tu usuario de GitHub |
| Repositorio (privado) | `bitacora-rodilla-data` |
| Rama | `main` |
| Ruta del archivo | `data/bitacora.json` |
| Token de GitHub | el `github_pat_…` que copiaste |

Pulsa **Probar conexión** (debe decir *Conexión correcta*) y luego **Guardar configuración**.

A partir de ahí, con **Sincronizar automáticamente al guardar** activado, cada caso se sube solo al repositorio.

---

## 4. Uso diario

| Sección | Para qué sirve |
|---|---|
| **Nuevo caso** | Campos esenciales y secciones opcionales plegables. Borrador automático, buscador de procedimientos y seguimiento editable. |
| **Dashboard** | Indicadores y gráficos del período, con filtros plegables. Las metas mantienen su alcance global. |
| **Bitácora** | Tabla en escritorio y lista de procedimientos en móvil, con búsqueda y orden. La ficha permite editar, agregar seguimiento y eliminar. |
| **Ajustes** | Conexión con GitHub, respaldo/importación, datos de ejemplo y publicación. |

### Progresión del fellow (metas por procedimiento)

La sección de progreso del dashboard mide tu avance contra objetivos: por cada procedimiento muestra cuántos casos llevas sobre la meta, con barra de progreso y un ✓ al cumplirla.

- **Editar una meta**: pulsa **Editar metas**, cambia el objetivo y se guarda solo. Pulsa **Listo** para volver a la lectura.
- **Agregar**: dentro de **Editar metas**, elige el procedimiento y el objetivo. Las filas conservan el orden alfabético.
- **Quitar**: el botón de cada fila, dentro de **Editar metas**.
- **Contar sólo cuando actué como cirujano**: casilla arriba a la derecha. Por defecto cuenta toda participación (incluido observador); actívala para contar únicamente los casos en los que operaste.
- Las metas **se miden sobre el total de casos, no sobre los filtros** (el objetivo es tu exposición acumulada del fellowship) y **viajan dentro del archivo de datos**, así que se sincronizan entre dispositivos igual que los casos.

Las metas sugeridas iniciales son un punto de partida editable: 50 artroscopias diagnósticas, 40 meniscectomías parciales, 30 LCA, 20 reparaciones meniscales, 20 PTR y 10 osteosíntesis de meseta tibial.

### Exportar e importar

- **Exportar CSV (Excel)**: usa `;` y BOM UTF-8 para Excel en español. En Ajustes exporta todos los casos; **Exportar resultados** en Bitácora exporta la búsqueda visible.
- **Exportar JSON**: respaldo de casos, metas, criterio de conteo y borrador pendiente, sin credenciales (úsalo antes de borrar algo).
- **Importar JSON**: valida el archivo y permite fusionar, reemplazar o cancelar. Reemplazar exige escribir **REEMPLAZAR**; cancelar conserva los datos. Si contiene un borrador, ofrece recuperarlo.

### Migrar la planilla vieja (una sola vez)

Los registros anteriores a la app (el CSV exportado del formulario) se convierten al formato nuevo con:

```powershell
python tools\importar-legado.py
```

Lee `data/Old_answers.csv` y escribe **`data/bitacora-legado.json`**, listo para cargar con **Ajustes → Importar respaldo → Fusionar**. Antes de escribir imprime un reporte: cuántos casos convirtió, cómo los clasificó, y qué quedó dudoso o sin mapear.

Los recuentos siguientes describen la planilla original usada al desarrollar el conversor; pueden variar con otra planilla. Decisiones que conviene conocer:

- **Roles**: `1er Cirujano` → *Cirujano (supervisado)*, `2do` → *Primer ayudante*, `3er` → *Segundo ayudante*.
- **Se descartan los RUT / ficha**: son datos identificatorios de pacientes y no entran al JSON.
- Las dos generaciones del formulario viejo (el simple y el rico) se unifican en un solo esquema.
- Las **28 categorías de texto libre** se traducen al catálogo de procedimientos de la app; el texto original **no se pierde**: se guarda en las notas del caso.
- Los `id` son deterministas, así que **volver a correr el script actualiza los casos en vez de duplicarlos**.
- **Diagnósticos**: el formulario viejo no registraba el diagnóstico en las primeras seis semanas (0% en mayo, 36% en junio, 100% desde julio). El conversor lo **infiere del procedimiento** en esos 27 casos: no se hace una `PTR` sin gonartrosis: y **deja constancia en la nota** de cada uno: *"Diagnóstico inferido del procedimiento: el formulario anterior no lo registraba."* Si prefieres que queden vacíos, se borra la tabla `DX_INFERIDO` / `DX_MANUAL` y se vuelve a ejecutar.
- **Vocabulario de diagnósticos unificado**: el formulario viejo tenía ~60 formas distintas de escribir unos 15 diagnósticos (`Rotura LCA`, `Rlca`, `RLCA`; `Gonartrosis izq`, `OA Valgo`, `Genu Varo`; `Mensico Discoideo`, `Rotura Radial Ml`…). El conversor los lleva al vocabulario controlado de `DX_NORMALIZADO` (18 categorías) y **guarda el texto original en las notas** de cada caso: *"Diagnóstico según el registro original: …"*. Sin eso, buscar por diagnóstico no devolvía nada útil.
- **Las fracturas se separan por tipo**, no se agrupan en un genérico: `Fractura por avulsión`, `Fractura de rótula` y `Fractura periprotésica` son categorías propias (agruparlas escondía casos clínicamente distintos).
- **Combinados**: los diagnósticos múltiples (`RLCA + MM + ML`) se resuelven por la entidad dominante, con el detalle preservado en las notas.
- **Campos estructurados del formulario actual**: el injerto de LCA y la técnica de sutura meniscal se extraen del texto libre y van a los select `injertoLca` y `tecnicaMeniscal`, con los valores exactos del formulario (24 injertos y 6 técnicas recuperados). Cuando un caso menciona una sutura sin decir la técnica, el campo **queda vacío**: no se inventa.
- **Los nombres de Trauma siguen el catálogo del servicio**: `Fractura Platillos Tibiales`, `Fractura Fémur Distal`, `Fractura Periprotésica`, `Fractura de Rótula` y `Fractura Avulsiva Espinas Tibiales LCA / LCP`. Si el servicio vuelve a renombrarlos, se actualiza la tabla `REGLAS` y listo (la app además mantiene un alias de compatibilidad para los nombres viejos).
- **El diagnóstico desambigua el procedimiento** cuando el texto es genérico: un `Red + OTS` en una fractura de rótula no es una osteosíntesis de platillos tibiales, y un `Reinsercion` pelado puede ser menisco, LCM o espina tibial. La tabla `DX_A_PROCEDIMIENTO` resuelve esos casos. Y cuando un caso tiene reconstrucción de LCA **y** gesto meniscal, el LCA queda como principal y el menisco como asociado (el mayor manda); ídem `RLPFM + MicroFx`.

- **Etiquetas**: la app genera las clínicas sola (`autoTags`) a partir del procedimiento, el injerto y la técnica. El conversor emite `autoTags: []` para que eso ocurra, y deja como **manuales** sólo las dos cosas que la app no puede deducir: `importado` (marca el lote) y la clasificación que traía el formulario viejo (`ligamentaria`, `meniscal`…). Resultado: 94 de 101 casos reciben etiquetas automáticas; los 7 restantes son de área "Otros" (tendón, toilette, artrofibrosis, sinovectomía), que no generan etiqueta por diseño.
- **Multiligamentaria y Schenck**: los campos `patronMultiligamentario` y `clasificacionMultiligamentaria` quedan vacíos porque la planilla vieja **no registra ninguna lesión multiligamentaria** (0 coincidencias: los casos con LET son reconstrucciones de LCA con aumento anterolateral, no luxaciones de rodilla). No se inventan.
- **Laxitud multiligamentaria: tenodesis** pasó a llamarse **`Tenodesis extraarticular lateral (LET)`**; son los 11 casos con TEA/LET.

El script es editable: si quieres cambiar cómo se traduce un término, se ajusta la tabla `REGLAS` y se vuelve a ejecutar.

### Varios dispositivos

Carga el mismo token en cada dispositivo. Al abrir la app, cada uno descarga los datos del repositorio y, al guardar un caso, los sube si activaste la sincronización automática. También puedes usar **Sincronizar ahora**. Si dos dispositivos editan el mismo caso, gana la versión modificada más recientemente (la app avisa y fusiona sola).

---

## 5. Privacidad y seguridad 🔒

- **No cargues datos identificatorios**: nada de nombres, documentos ni números de historia clínica. El formulario está pensado para trabajar con edad, código interno y datos clínicos.
- Los datos quedan en el navegador y, si conectas GitHub, en **tu repositorio privado**; el repositorio de la app es público pero sólo contiene código.
- El token se guarda **sólo en el navegador** (localStorage) y viaja únicamente a `api.github.com`. Usa un token *fine-grained* limitado a ese repositorio y con un solo permiso.
- La app incluye `noindex, nofollow` y **no tiene ninguna dependencia externa** (ningún CDN, ninguna fuente remota): no carga scripts ni fuentes desde servicios externos.
- Si pierdes el token, revócalo en GitHub y genera otro.
- **Ojo con el modo incógnito**: el localStorage se borra al cerrar la ventana. Usa Exportar JSON como respaldo periódico.

---

## 6. Estructura del proyecto

```
index.html                 Estructura de la vista (formulario, dashboard, bitácora, ajustes)
assets/css/styles.css      Estilos, modo claro/oscuro automático y responsive
assets/js/config.js        Catálogos: procedimientos, roles, abordajes, anestesias, Clavien-Dindo
assets/js/util.js          Helpers de DOM, fechas, almacenamiento y avisos
assets/js/github.js        Cliente de la API de contenidos de GitHub
assets/js/store.js         Estado, CRUD, persistencia local, sincronización y métricas
assets/js/charts.js        Barras y rankings HTML, línea SVG y tablas de valores
assets/js/form.js          Formulario de registro y edición
assets/js/bitacora.js      Tabla, búsqueda, ficha de detalle y borrado
assets/js/dashboard.js     KPIs, filtros y gráficos
assets/js/export.js        CSV, respaldo JSON y datos de ejemplo
assets/js/app.js           Navegación, estado de sincronización y ajustes
tools/importar-legado.py   Conversor de la planilla vieja (CSV) al JSON que importa la app
data/                      Tus datos: planilla vieja y JSON convertido (fuera del control de versiones)
```

---

## 7. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| *"Token inválido o vencido"* | El token expiró o está mal copiado. Genera uno nuevo (paso 3.2). |
| *"El token no tiene permiso"* | Falta **Contents: Read and write** o el token no incluye ese repositorio. |
| *"No se encontró el archivo…"* | Revisa usuario, repositorio, rama y ruta. Si es la primera vez, pulsa **Sincronizar ahora** para crearlo. |
| *"El archivo del repositorio no es un JSON válido"* | Alguien editó el archivo a mano. Recupera desde **Importar JSON** con un respaldo. |
| *"Conflicto de versión"* | Dos dispositivos guardaron a la vez: la app reintenta y fusiona automáticamente. Si insiste, pulsa **Descargar cambios**. |
| La página queda en blanco | Abre la consola del navegador (F12). Verifica estar usando un servidor o GitHub Pages y no `file://`. |
| Después de una actualización sigo viendo la versión vieja | Si modificas CSS o JS, incrementa su parámetro `?v=` en `index.html` para renovar la caché. Recarga con `Ctrl + Shift + R` si sigues viendo la versión anterior. |

---

## 8. Sistema de diseño

Todo el estilo sale de variables en `:root` dentro de [assets/css/styles.css](../assets/css/styles.css). Si vas a tocar la interfaz, usa esos tokens en vez de valores sueltos:

| Grupo | Variables | Para qué |
|---|---|---|
| Superficies | `--bg`, `--surface`, `--surface-2`, `--border` | Fondos y separadores (hay bloque claro y oscuro) |
| Texto | `--text`, `--muted`, `--fs-xs` … `--fs-2xl` | Escala tipográfica |
| Acento | `--accent`, `--accent-soft` | Azul para navegación; `--brand-yellow` para acciones y `--on-yellow` para su texto |
| Estado | `--ok`, `--warn`, `--danger`, `--sev-1` … `--sev-4` | Sólo cuando el color **significa** algo (éxito, riesgo, gravedad de Clavien-Dindo). Nunca decorativos |
| Datos | `--c1` … `--c8` | Rampa de un solo tono frío para los gráficos y leyendas |
| Forma | `--radius`, `--radius-sm`, `--radius-xs` | Contenedores suaves, elementos internos más cerrados |
| Movimiento | `--ease`, `--dur` | Transiciones de 200 ms con la misma curva |
| Capas | `--z-topbar`, `--z-panel`, `--z-toast` | Sin `z-index` arbitrarios |

Decisiones que conviene respetar: numeración con `font-variant-numeric: tabular-nums` para que las columnas de datos no bailen; foco visible con `:focus-visible` (no quitarlo); y `@media (prefers-reduced-motion)` para quien pide menos animación.

## 9. Personalizar

Los catálogos clínicos se editan en [`assets/js/config.js`](../assets/js/config.js): agrega o quita procedimientos, roles, tipos de anestesia o grados de Clavien-Dindo según tu servicio. Las metas iniciales se cambian en `DEFAULT_OBJETIVOS` (sólo se usan la primera vez: después mandan las que definas en el dashboard). Para agregar un campo al formulario hay que tocar `index.html`, la lista `TEXT_FIELDS` (o `NUM_FIELDS`/`BOOL_FIELDS`) de `store.js` y la columna correspondiente en `export.js`.

## 10. Validación de cambios UI/UX

Ejecuta `node --test tests/regression.test.cjs` para comprobar fechas, métricas, importación, respaldos y conflictos de sincronización con datos ficticios y GitHub simulado. El detalle de implementación está en [implementacion-ui-ux.md](implementacion-ui-ux.md).

Los borrados sincronizados incluyen marcas de eliminación para evitar que reaparezcan al fusionar. Usa esta versión de la app en todos los dispositivos conectados.
