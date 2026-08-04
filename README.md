# 🗄️ SQL Practice Simulator

[![Lanzar Simulador](https://img.shields.io/badge/🚀_PROBAR_EN_VIVO-Lanzar_Simulador-success?style=for-the-badge&logo=rocket)](https://notayeen.github.io/SQLEARN/)

Un simulador interactivo y retro para aprender y practicar SQL directamente desde el navegador. Construido como una Single Page Application (SPA), este proyecto te permite sumergirte en 25 niveles y misiones desafiantes, manejando una base de datos SQLite real 100% en el lado del cliente gracias a WebAssembly.

---

## ✨ Características Principales

* **📚 25 Misiones Interactivas:** Desde consultas básicas (`SELECT`, `WHERE`) hasta reportes avanzados y manipulación de datos. Cada misión tiene objetivos específicos con retroalimentación en tiempo real.
* **💾 Motor SQLite Integrado:** Ejecución real de consultas en el navegador usando `sql.js` (SQLite compilado a WebAssembly). ¡Sin necesidad de un backend o servidor de base de datos externo!
* **🎮 Gamificación y Logros:** Sistema de logros desbloqueables con notificaciones visuales y sonoras ("First Blood", "Detective", "Master", etc.) guardados de forma local en tu navegador.
* **🧩 Modo Drag & Drop (Ensamblaje):** Niveles especiales diseñados para construir consultas arrastrando y soltando bloques (ideal para aprender la estructura sintáctica), impulsado por `SortableJS`.
* **🕵️‍♂️ Modo Auditoría:** Misiones enfocadas en encontrar errores lógicos y de sintaxis en códigos SQL pre-escritos.
* **🖥️ Interfaz Retro y Temas:** Un diseño nostálgico con animaciones sutiles. Soporte para **Modo Oscuro** y **Modo Claro**.
* **💡 Enciclopedia SQL y Pistas:** Ventanas flotantes integradas con documentación de comandos SQL, esquemas de bases de datos y ejemplos de uso.
* **⚡ Ejecución Local (`file://`):** Toda la aplicación está empaquetada estáticamente. ¡Puedes simplemente hacer doble clic en `index.html` y jugar sin necesidad de instalar ni correr servidores!

---

## 🛠️ Tecnologías Utilizadas

* **HTML5, CSS3, JavaScript (ES6)**
* **[Vite](https://vitejs.dev/)**: Para el empaquetado ultra rápido del proyecto (`bundle.js`).
* **[sql.js](https://sql.js.org/)**: Motor de base de datos SQLite en WebAssembly.
* **[CodeMirror](https://codemirror.net/5/)**: Editor de código con resaltado de sintaxis SQL y autocompletado.
* **[SortableJS](https://sortablejs.github.io/Sortable/)**: Para la funcionalidad de Drag & Drop de los bloques de código.
* **[Phosphor Icons](https://phosphoricons.com/)**: Iconografía moderna y ligera.

---

## 🚀 Cómo Jugar / Instalar

Gracias al empaquetado estático, la forma más fácil de disfrutar el simulador es simplemente clonar el proyecto y abrir el archivo.

### Opción 1: Ejecución Directa (Recomendada)
1. Clona o descarga este repositorio:
   ```bash
   git clone https://github.com/notayeen/SQLEARN.git
   ```
2. Navega a la carpeta del proyecto.
3. Haz doble clic en el archivo `index.html` para abrirlo en tu navegador favorito. ¡A jugar!

### Opción 2: Modo Desarrollador (Si quieres editar el código)
Si deseas modificar los archivos fuente (ubicados en `src/`) y compilar tus propios cambios:
1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Levanta el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
3. Para generar un nuevo archivo unificado `bundle.js` para producción:
   ```bash
   npm run build
   ```

---

## 🎯 Controles y Atajos

* **`Ctrl + Enter`**: Ejecutar la consulta SQL escrita en el editor.
* **`Ctrl + Space`**: Activar el menú de autocompletado inteligente de palabras clave SQL.
* Puedes explorar la base de datos de manera libre (sandbox) ejecutando cualquier consulta, sin que esto afecte el progreso de tu misión actual.

---

## 🤝 Contribuciones

¡Las contribuciones, problemas (issues) y solicitudes de extracción (pull requests) son bienvenidas!
Siéntete libre de añadir nuevos niveles JSON en la carpeta de configuraciones o mejorar el motor de evaluación.

---

**Desarrollado con pasión para mejorar las habilidades de análisis de datos de manera interactiva y divertida.**
