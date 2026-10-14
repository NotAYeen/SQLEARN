# DESIGN.md — SQL Practice Simulator

Dirección de diseño del proyecto. `antislop` actúa como filtro encima de este archivo, no al revés.

## Identidad

Simulador de práctica SQL que imita un sistema operativo de escritorio de 1995 (Windows 95 / Win3.1). Todo lo visual nace de esa época: biselados de 2 px, barras de título con degradado azul, fuentes de sistema, scrollbars con relieve, ventanas flotantes arrastrables con barra de título y botón de cierre cuadrado.

**Motivo:** el estudiante está fiddlingando con una base de datos, no leyendo un artículo. El chrome de "aplicación de escritorio" refuerza la metáfora de "estoy operando una herramienta", y lo retro diferencia el producto de cualquier editor SQL moderno genérico.

**Test de identidad:** si se cambia el logo y el nombre, el resultado sigue siendo inmediatamente reconocible como un Windows 95. Ese es el criterio.

## Personalidad

Directa, funcional, sin adorno. El adorno es el entorno, no el contenido. Nada de gradientes decorativos, nada de sombras suaves, nada de esquinas redondeadas fuera de 2 px. Si algo brilla, brilla porque es un estado de foco, un error o una solución revelada.

## Paleta

Tokens en `css/style.css`, sección `:root`. **13 tokens**, ampliados a 18 con las superficies.

| Token | Claro | Oscuro | Uso | Razón |
|---|---|---|---|---|
| `--bg-desktop` | `#2b5b5c` | `#112526` | Fondo de la app | Teal de escritorio, el color de fondo del Win95 original |
| `--bg-panel` | `#dfdfd1` | `#2e2e2e` | Paneles, botones, barras de título | Gris classic del Win95 / su equivalente oscuro |
| `--bg-hover` | `#c9c9b9` | `#404040` | Hover, estado activo de tab | Un paso por encima del panel |
| `--bg-surface` | `#ffffff` | `#1a1a1a` | Listas, tablas, área de código, editor de audit | Blanco puro de listas en SO retro |
| `--text-primary` | `#000000` | `#ffffff` | Texto principal | Contraste máximo |
| `--text-secondary` | `#222222` | `#d0d0d0` | Texto secundario, notas | 11.8:1 en claro, 8.8:1 en oscuro |
| `--header-bg` | `90deg, #0000a0, #1069b4` | `90deg, #001a40, #004080` | Barras de título, `.section-title` | Degradado azul de Win95. **Extremo claro `#1069b4`**: blanco encima da 5.67:1, pasa AA |
| `--header-text` | `#ffffff` | `#ffffff` | Texto sobre `--header-bg` | — |
| `--border-light` | `#ffffff` | `#555555` | Borde biselado, luz | Mitad izquierda/arriba del biselado |
| `--border-shadow` | `#808080` | `#1a1a1a` | Borde biselado, sombra | Mitad derecha/abajo del biselado |
| `--border-dark-shadow` | `#000000` | `#000000` | Borde biselado, sombra profunda | Línea exterior del biselado |
| `--accent-run` | `#006400` | `#4caf50` | Botón Ejecutar | Verde WCAG, el botón que el usuario pulsa más |
| `--accent-focus` | `#7a4300` | `#ffcc00` | Anillo de foco | Dorado oscuro en claro (5.9:1 sobre el panel), dorado claro en oscuro (8.98:1). El oro claro daba 1.12:1 sobre `#dfdfd1`, o sea invisible |
| `--accent-highlight` | `#ffcc00` | `#ffcc00` | Relleno: token de solución revelada, toast de logro | Oro de resaltado del SO. Lleva texto `#1a1a1a` encima: 11.5:1 |
| `--color-error` | `#c62828` | `#ef5350` | Error SQL, token erróneo | — |
| `--color-error-wrong` | `#7a5a00` | `#7a5a00` | Token marcado incorrecto | Amarillo sucio, distinto del rojo de acierto |
| `--scrollbar-thumb` | `#7f7f70` | `#7a7a7a` | Thumb de scrollbar | 3.02:1 y 3.16:1 contra el panel. **Mínimo de componente de UI** |
| `--scrollbar-thumb-hover` | `#6b6b5d` | `#8a8a8a` | Thumb en hover | Aumenta el delta |
| `--color-success` | `#1b5e20` | `#4caf50` | Botón ＋ de DND, badge fácil | — |

**Regla de paleta (R-29):** 3 colores base (teal, gris panel, blanco superficie) + 1 acento (oro de foco). Los colores de estado (rojo de error, verde de acierto) son semánticos, no decorativos. Nada más.

**Prohibido:** azul-violeta, azul-cian, morado-rosa, neón, glassmorphism, fondos con rejilla o puntos, sombras suaves.

## Tipografía

```
--font-ui:  'Tahoma', 'MS Sans Serif', Arial, sans-serif;
--font-mono: 'Source Code Pro', 'Courier New', monospace;
```

**Razón:** Tahoma *es* la fuente de interfaz de Windows 95. No es una elección estética, es la elección literal del periodo. Cualquier sans moderna (Inter, Geist, Space Grotesk) rompería la identidad aunque se viera mejor. Por eso **`Inter` está fuera**: se pidió una vez por inercia y nunca se usó, `--font-ui` nunca la referenció. Se eliminó la petición en vez de cambiar la variable.

`Source Code Pro` sí se usa, en `--font-mono`, para SQL, tablas de salida esperada y badges de columna: el código es el contenido y merece una voz propia.

**Escala:** 10 px (iconos, badges de columna, solo decorativo) · 11 px (tabla de salida esperada, apretada por diseño) · 12 px (texto secundario, tips) · 13 px (texto de interfaz, cuerpo por defecto) · 14 px (código, misión) · 24 px (título del estado vacío).

**Nada de mayúsculas con tracking amplio.** `text-transform: uppercase` solo aparece en `.difficulty-badge`, donde etiqueta una categoría, no decora.

## Espaciado y radio

Escala de espaciado, en lugar de px literales:

```
--space-1: 4px    --space-2: 8px    --space-3: 12px    --space-4: 16px
--radius:  2px
```

**Radio:** 2 px en todo, o 0. Nunca píldora, nunca `border-radius: 50%` salvo en elementos que son físicamente circulares.

**Motivo:** el Win95 no usa esquinas redondeadas en las superficies de UI. El radio de 2 px es el del biselado original.

## Componentes

**Biselado.** La primitiva de todo el sistema, definida una vez como `--bevel`:

```css
--bevel-out: inset 1px 1px 0 var(--border-light),
             inset -1px -1px 0 var(--border-dark-shadow),
             inset 2px 2px 0 var(--border-light),
             inset -2px -2px 0 var(--border-shadow);
```

Superficies, botones, celdas de cabecera de tabla. Un panel hundido invierte el orden de las cuatro sombras.

**Barra de título.** Degradado `--header-bg` + texto `--header-text`, 13 px bold. Unifica `.section-title`, `.retro-modal-header`, `.retro-window-header`, `.audit-instruction`, `.dnd-instruction` y `th` de la tabla esperada. Es el motivo de identidad que se repite.

**Botón.** `.nav-btn` con biselado saliente. `:active` invierte el biselado **y** desplaza el padding 2 px (el "click" físico de un botón que se hunde).

## Diales

```
ENERGY 2 / RHYTHM 1 / MOTION 1
```

- **ENERGY 2**: dice hola con claridad, sin gritar. Un header de azul saturado, tipografía de sistema, cero ornamentación.
- **RHYTHM 1**: uniforme y predecible. Es un IDE de tres paneles; la variedad rompería la familiaridad. La repetición del biselado y de la barra de título *es* la variación.
- **MOTION 1**: solo estados de hover, foco y el shake de error. Sin transiciones de entrada, sin parallax, sin reveal.

## Movimiento

Solo cuatro animaciones en todo el proyecto, cada una con propósito:

| Animación | Propósito | Duración |
|---|---|---|
| `shake-token` | Señalar que el token de audit elegido no era el error | 0.35 s × 2 |
| `slideIn` / `slideOut` de toasts | Indicar entrada y salida de un logro sin rob attention | 0.5 s |

**`prefers-reduced-motion: reduce`** desactiva ambas. Una herramienta de aprendizaje con animaciones de sacudida necesita opt-out.

## Accesibilidad (no negociable)

- **Contraste AA**: 4.5:1 texto normal, 3:1 texto grande, **3:1 para componentes de UI** (thumb de scrollbar, bordes de control, anillo de foco).
- **Foco visible**: anillo `--accent-focus` de 2 px con `outline-offset`. Nunca `outline: none` sin sustituto. El oro se elige porque contrasta con los dos temas y con el panel.
- **Teclado**: todo control operable con teclado. `Ctrl+Enter` ejecuta, `Ctrl+Space` autocompleta, flechas recorren las tabs móviles. El resizer es `role="separator"` y **por lo tanto responde a flechas**; un separator que solo responde al ratón anuncia una capacidad que no tiene.
- **Foco en diálogos**: al abrir, el foco entra; `Tab` queda atrapado; `Escape` cierra; al cerrar, el foco vuelve al elemento que abrió. `inert` + `aria-hidden` en el fondo.
- **Reglas vivas**: se anuncia el resumen ("N filas, M columnas"), no la tabla de 200 filas.
- **Errores y vacíos**: todo panel de datos tiene estado vacío, de carga y de error. Un estado de carga que nunca termina es peor que no tener estado.

## Voz

Directa, en español de España, tuteando. Dice qué hacer y qué significa, no cuánto es de increíble.

- Prohibido: `—` (em dash), "Sumérgete", "Revolutionario", "Imperdible", "Potente", "Sin esfuerzo".
- Botones con verbo específico de la acción: `Ejecutar`, `Reiniciar BD`, `Obtener Pista`, `Ver Solución`, `Mostrar` / `Ocultar`.
- El rótulo del botón y el título del diálogo que abre coinciden siempre.

## Anti-patrones activos

Los que este proyecto puede caer fácil y no debe:

- **Glassmorphism**: prohibición total. Bevel y bisel, nunca blur.
- **Biselado sin `:active`**: un botón que no se hunde no es un botón retro, es un div.
- **Tokens evitados por estilos inline**: los estilos viven en `css/style.css`. Un componente con `style="..."` por prop está fuera del sistema y no responde a los cambios de tema.
- **Varios dorados**: dos tokens, dos trabajos. `--accent-focus` es el anillo (contrasta contra el panel), `--accent-highlight` es el relleno (contrasta contra su propio texto). Un solo dorado para ambos fallaba en tema claro.
- **Radios inconsistentes**: 2 px o 0, nunca 4.
- **Badges que no distinguen**: si dos badges parecen iguales, uno sobra. `#bf360c` y `#b71c1c` tenían luminancia relativa 1.17 y no comunicaban nada; la diferencia real la hacía el emoji, así que el color no cargaba la información. Ahora `#1b5e20` / `#8a5300` / `#a31515`.

## Fuera del CSS

Reglas que se aplican al JavaScript, no al CSS. Violarlas rompe el diseño igual que una regla de estilo:

- **Prohibido parchear CSS o HTML con scripts** (R-33). Los tokens se leen con `var()`, no se reescriben.
- **Prohibido el estilo inline en JS.** `style="..."` o `el.style.x =` para algo que no sea estado (display por un cambio de layout, tamaño del resizer) se salta los tokens y no responde al tema. Si necesita estilo, tiene una clase.
- **Prohibido inyectar `<style>` en runtime.** El toast de logros vivía así, con su propio dorado. Su estilo está en `css/style.css`.
- **Prohibido un segundo dorado.** Si aparece un color nuevo para un componente, primero se pregunta por qué no sirve un token.

## Progreso

El selector de nivel es el unico indicador de avance que tiene la app. Muestra
`Nivel N: <db_name> [<dificultad>]` agrupado por dificultad. Es funcional y no se
toca: anadir barras de progreso o insignias de "completado" seria decoration
que compite con el contenido (R-14, R-38). Si algun dia se anade progreso
visual, tiene que salir de datos reales: `sql_sim_achievements` ya existe.

## Toasts

`.retro-toast` en `css/style.css`. Aparece abajo a la derecha, se cierra solo a los
5 s o al pulsarlo. `role="status"` en el contenedor para que el lector de pantalla
lo anuncie sin robar foco. Se termina con `AudioFX.unlock()`: un arpegio corto
ascendente, el unico tono del proyecto que sube.
