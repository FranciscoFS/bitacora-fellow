# Guía de desarrollo y verificaciones

Leer primero el [estado vigente](continuidad-del-proyecto.md) y la [última bitácora relevante](bitacoras/). Proyecto estático: no requiere instalar paquetes ni ejecutar un build.

## Estado y carpetas

Desde la carpeta principal, en PowerShell:

```powershell
git status --short --branch
git log -5 --oneline
git worktree list
```

La carpeta de `main` y el worktree de `redesign/ui-ux` están indicados en el estado. Comprobar el estado de ambos cuando se vayan a comparar o integrar. Las referencias `origin/*` son locales hasta actualizar el remoto; antes de commit o merge, revisar cambios locales y remotos.

## Vista local

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8765/?demo=1`. La demostración usa datos ficticios y el prefijo de almacenamiento `bf.demo.`. Para probar el formulario directamente: `http://127.0.0.1:8765/?demo=1#nuevo`.

Si el puerto ya está ocupado, elegir otro y registrar cuál se utilizó en la bitácora. Recargar la página después de cambios en código o estilos. No usar la bitácora real para pruebas destructivas ni capturas.

## Pruebas funcionales y sintaxis

```powershell
node --test tests/regression.test.cjs
```

Revisar la sintaxis de los módulos cambiados con `node --check assets/js/nombre.js`. Para revisar todos:

```powershell
Get-ChildItem assets/js/*.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

Las pruebas usan datos ficticios y simulan almacenamiento y sincronización. No verifican por sí solas el aspecto visual ni todos los eventos del formulario: comprobar también escritorio y móvil, teclado, edición y borradores cuando se modifiquen esos flujos.

## Publicación

GitHub Pages usa `main`, raíz del repositorio. Mantener las versiones de CSS y JS en `index.html` coherentes al publicar. Un commit local no actualiza Pages; después del push verificar el commit desplegado y los recursos servidos. Registrar por separado qué se implementó, qué se probó y qué llegó a publicarse.
