# AGENTS.md — SQL Practice Simulator (Convenio de trabajo y punto de retomar)

Este archivo resume el contexto, arquitectura y convenciones del proyecto para que cualquier sesión
futura de opencode pueda retomar el trabajo sin re-descubrir el estado. **Léelo al inicio de cada sesión.**

## Qué es el proyecto

SPA educativa que simula una práctica interactiva de SQL dentro del navegador.
Motor real: SQLite compilado a WebAssembly (`sql.js`), sin backend. Despliegue estático.

- URL de producción (GitHub Pages): https://NotAYeen.github.io/SQLEARN/
- Repositorio: https://github.com/NotAYeen/SQLEARN
- Rama de producción: **`main`** (todo push a `main` redepliega Pages automáticamente en ~1-2 min).
- Funciona también abriendo `index.html` con doble clic (sin servidor), porque todo va con CDN/archivos locales.

## Estado actual (punto de retomar)

- Último commit: `fd6ece3` — "Fix: Ver Solución ahora funciona en misiones de Auditoría y Ensamblaje".
- Trabajo previamente entregado (commits en historia): tooling/validación/CI, motor SQL resiliente (sql.js 1.13),
  auditoría A11y/UX (foco, modal, contraste WCAG), salidas esperadas por columnas reales, textos de los 25
  desafíos aclarados, y el fix de "Ver Solución".
- Todo verificado: `npm run validate` → 25/25, `npm test` → 6/6, `npm run build` → OK (~103 kB bundle.js).
- Working tree limpio, `main` sincronizada con `origin/main`.

### Ramas / remoto
- Rama local y remota de trabajo: `main`.
- Existe un `origin/master` obsoleto en GitHub (apuntando al mismo commit, quedó de cuando se trabajaba en
  `master`). No se usa. Si molesta, borrar con: `git push origin --delete master`.
- `HEAD` del remoto apunta a `main` (CI y Pages escuchan `main`, **no** `master`).

## Comandos

```bash
npm run dev        # servidor Vite de desarrollo (http://localhost:5173)
npm run build      # genera bundle.js (outDir='.' + emptyOutDir:false, escribe en la raíz del repo)
npm run preview    # Vite preview del build
npm run validate   # valida los 25 niveles (ejecuta init_db_sql + expected_query con sql.js)
npm test           # Vitest (tests/levels.test.js)
```

**REGLA CRÍTICA**: tras editar cualquier archivo de `src/`, hay que ejecutar `npm run build` y
**commitear `bundle.js` regenerado**. El CI (`.github/workflows/ci.yml`) dispara un fallo si
`git diff --exit-code bundle.js` no está limpio (guarda de bundle desactualizado).

## Arquitectura y mapa de archivos

- `src/main.js` — punto de entrada Vite (iife → `bundle.js`).
- `src/App.js` (~883 líneas) — controlador principal: eventos, `loadLevel`, `runQuery`, `checkAnswer`,
  `checkAudit`, `showModal` (focus trap + inert + Escape/backdrop), `setupAuditMode`, `getExpectedColumns`,
  `revealAuditSolution`, `showExpectedOutput`, `renderSchema/RenderResources`, resizer, tabs móviles, autosave.
- `src/levels.js` (~1016 líneas) — data de los 25 niveles (ver sección de niveles).
- `src/database.js` — `DatabaseEngine`, wrapper de sql.js. `locateFile` → jsdelivr `sql.js@1.13.0` (el build
  no puede usar el npm local en producción web; mantener sincronizados CDN y devDependency).
- `src/editor.js` — `SQLEditor` (CodeMirror 5 por CDN) con roles `application`/`aria-label`/`aria-multiline`.
- `src/DndManager.js` — bloques DND (SortableJS), botones ＋/− por bloque (teclado+táctil), `getQuery`,
  `updateEditorFromDropzone`, y `applySolution`/`findSolutionOrder` (resuelve el orden correcto a partir de
  `expected_query` buscando permutaciones normalizadas).
- `src/compare.js` — `compareAnswer` (comparación multiset por orden, normaliza números). Lo usa TODO nivel.
- `src/LevelLoader.js` — carga niveles desde `levels.js` (ya **no** desde JSON externos; `public/niveles` se eliminó).
- `src/Achievements.js` — logros con toasts (`role="status"`), claveados por **`id_nivel`**.
- `src/WildManager.js`, `src/docs.js`, `src/AudioFX.js`, `src/storage.js` — ventana enciclopedia, docs SQL, sonido, localStorage.
- `css/style.css` (~1010 líneas) — temas light/dark, contraste WCAG, focus-visible dorado, scrollbars, DND apilable en móvil.
- `index.html` — markup SPA + CDNs (sql.js 1.13.0, CodeMirror 5, phosphor icons, SortableJS) + botón
  `#btn-reset-db` ("Reiniciar BD" con confirmación) + resizer con `role=separator`.
- `scripts/validate-levels.mjs` — validador CLI (25/25).
- `tests/levels.test.js` — tests Vitest (6/6).
- `.github/workflows/ci.yml` — CI en push a `main` (npm ci → validate → test → build → guard de bundle.js).
- `vite.config.js` — `outDir: '.'`, `emptyOutDir: false`, minify terser (sin sourcemaps), output `bundle.js`.
- `public/` — solo `favicon.svg` y `preview.png` (copias fuente; los 404/robots/sitemap/niveles live en raíz).

## Niveles (src/levels.js)

25 niveles con `id_nivel` (`escenario_01`..`escenario_25`). Campos clave de cada nivel:
`id_nivel`, `db_name`, `dificultad` (Básico/Intermedio/Avanzado), `modalidad`, `briefing_mision`,
`init_db_sql`, `schema`, `learning_resources` (pistas), `solution_data`, `expected_query`,
y según modalidad: `query_defectuoso` / `dnd_blocks` / `audit_tokens` + `token_error_index`.

### Modalidades (y cómo funciona "Ver Solución" desde commit fd6ece3)
- **Terminal** (escribir consulta en el editor): `Ver Solución` rellena el editor con `expected_query`.
- **Depuración** (corregir `query_defectuoso` en el editor): igual que Terminal, rellena con `expected_query`.
- **Auditoría** (ubicar el token defectuoso): `Ver Solución` resalta el token erróneo con `.solution-reveal`
  (dorado) y muestra modal con `explicacion`. NO resuelve el nivel: el humilde estudiante debe hacer clic
  en el token para completar y ganar el logro `detective`.
- **Ensamblaje** (DND de bloques): `Ver Solución` ordena los bloques en el dropzone vía
  `DndManager.applySolution(expected_query)`. No auto-ejecuta; el usuario pulsa **Ejecutar** para verificar
  (los resultados los valida `checkAnswer`).

Detalles importantes:
- **Audit levels tienen `expected_query: ""`** (no aplica relleno de editor).
- `getExpectedColumns` ejecuta `expected_query` dentro de `BEGIN/ROLLBACK` para que el DML de los niveles DND
  (p. ej. escenario_10: `INSERT ...; SELECT ...`) no mute la BD del nivel.
- DND: todos los niveles usan TODOS los bloques, sin distractores. En `applySolution` se busca la permutación
  cuyo join (normalizado) iguala `expected_query` normalizado (colapsar espacios, quitar espacio antes de
  `; , ) .`, lowercase). Cap de 8 bloques; si falla, App muestra modal con `expected_query`.
- Logros: `first_blood` (nivel 0), `puzzle_master` (DND), `half_way` (id_nivel `escenario_13`), `nsa_hacker`
  (id_nivel `escenario_25`).
- Cap de 200 filas en resultados con nota `.truncation-note`.

## Git / entorno Windows

- Shell por defecto: **PowerShell 5.1** (sin `rg` instalado; usar `Select-String` o la herramienta Grep/Glob/Read).
  - No usar `&&` para encadenar; usar `cmd1; if ($?) { cmd2 }`.
- El repo se agregó a `safe.directory` global (evita el error de "dubious ownership").
- Identidad git configurada **solo a nivel de repo**: `Anton <anthonysmith120999@gmail.com>` (heredada de los
  commits previos). Cambiar con `git config user.name / user.email` si hace falta.
- Estilo de commits (mantener): `Prefijo: Descripción en español` (p. ej. `Fix:`, `Feat:`, `A11y/UX:`, `Chore:`).
- **Solo commitea/pushea cuando el usuario lo pida explícitamente.** El patrón del usuario es pedir "guarda en
  git y push en github" al final de cada tarea.
- El usuario trabaja en español; responder en español.

## Flujo recomendado para retomar

1. Leer este AGENTS.md (o confiar en el resumen de sesión anterior).
2. `git status` para comprobar si hay cambios pendientes; `git log --oneline -5` para ver contexto reciente.
3. Si hay que tocar niveles: leer `src/levels.js`, `scripts/validate-levels.mjs`, `tests/levels.test.js`.
4. Ante dudas de comportamiento del motor, verificar con node + sql.js (importar `sql.js` con
   `locateFile: f => '<dir>/node_modules/sql.js/dist/' + f`).
5. Tras tocar `src/*`: `npm run validate`, `npm test`, `npm run build`, y commitear `bundle.js`.
6. Al terminar: `git add ...`, commit con el estilo indicado, y `git push origin main` (Pages se actualiza solo).

## Notas / pendientes posibles para futuras sesiones

- (Opcional) eliminar `origin/master` obsoleto si estorba.
- `README.md` y `Plan de Desarrollo - Simulador SQL Interactivo.md` en la raíz contienen contexto adicional
  del producto si se quiere más narrativa.
- La auditoría de niveles 1-25 (briefings/pistas/explicaciones) ya se realizó y aplicó; la sección "Auditoría
  de textos de los 25 desafíos" del historial contiene el detalle de lo corregido.
- Si se añaden niveles o se cambia `dificultad`, mantener coherencia con los grupos 🟢/🟡/🔴 del selector.