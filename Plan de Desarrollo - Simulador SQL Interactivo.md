# **Plan de Arquitectura y Especificaciones: Simulador SQL Interactivo**

## **1\. Información General**

> * **Desarrollador Principal:** Anton Flores (@GhostlineCore)  
> * **Entorno de Despliegue:** GitHub Pages (Arquitectura estática, procesamiento 100% cliente).  
> * **Propósito:** Plataforma gamificada para el aprendizaje y depuración de sintaxis SQL mediante bases de datos efímeras en memoria.

## **2\. Stack Tecnológico**

La aplicación se construirá sobre estándares web modernos, prescindiendo de un backend activo:

> * **Lógica de Interfaz y Estructura:** HTML5, CSS3 y JavaScript puro para garantizar máxima compatibilidad y rendimiento.  
> * **Motor de Datos:** sql.js (WebAssembly) para ejecutar y evaluar consultas SQLite nativas dentro de la sesión del navegador.  
> * **Editores de Código:** Integración de CodeMirror o Monaco Editor para autocompletado y resaltado de sintaxis.  
> * **Almacenamiento de Estado:** localStorage del navegador web para mantener la persistencia del progreso del usuario de forma local.

## **3\. Dirección de Arte y Experiencia de Usuario (UI/UX)**

El diseño visual adoptará una estética de entorno de escritorio retro y minimalista, simulando un sistema operativo clásico y ordenado ejecutándose directamente en el navegador del usuario.

* **Estética Central:** Diseño de interfaz basado en ventanas flotantes modulares, con una barra de estado superior global y elementos distribuidos simulando un "escritorio" de trabajo vintage.  
* **Esquema de Colores:** Una paleta suave pero con alto contraste estructural. Los fondos principales utilizarán un tono crema/beige crudo, acompañados de acentos en azul pastel apagado (y azul sólido para áreas de enfoque, como el editor). El color negro puro se utilizará para todos los textos, iconos y contornos.  
* **Tipografía:** Uso exclusivo de fuentes monoespaciadas legibles, estilo máquina de escribir o terminal (como *Courier Prime*, *Space Mono* o *Fira Code*), aplicadas en color negro sólido para reforzar la sensación de estar documentando o escribiendo código.  
* **Estructura CSS (Bordes y Sombras):** Eliminación de degradados y sombras difuminadas. Todo el diseño dependerá de bordes negros gruesos (2px a 4px) para delimitar contenedores, botones y áreas de texto. Las sombras serán sólidas y sin desenfoque (ej. `box-shadow: 5px 5px 0px #000000`) para generar volumen manteniendo el estilo gráfico plano.  
* **Diseño de Componentes (Ventanas):** Las áreas funcionales (el editor SQL, la zona de *Drag & Drop* o la tabla de resultados) estarán encapsuladas en contenedores que simulen ventanas de software. Estas incluirán una barra superior delimitada por una línea negra, botones circulares simples (estilo controles de ventana) y rutas de texto simuladas (ej. `/home/simulador/reto_01.sql`).  
* **Widgets Complementarios:** Incorporación de paneles laterales de estado. Estos incluirán indicadores de progreso del nivel utilizando barras de contorno grueso, y un widget secundario flotante que simule una pequeña superposición de medios o notificaciones de audio directamente en el entorno web para acompañar la sesión de código.  
* **Iconografía:** Uso de iconos de línea (*line-art*) en color negro, sin relleno complejo, para representar acciones como "Ejecutar", "Reiniciar" o las carpetas de los distintos niveles de dificultad.  
> * 

## **4\. Modalidades de Práctica y Sistemas de Validación**

El núcleo pedagógico se divide en cuatro módulos distintos de interacción, validados localmente:

| Modalidad | Mecánica del Usuario | Método de Validación   |
| :---- | :---- | :---- |
| Terminal (Construcción Libre) | Redacción de sentencias SQL desde cero utilizando el editor integrado. | El motor sql.js procesa la consulta y evalúa si el *dataset* resultante coincide exactamente con la solución esperada. |
| Depuración (Fix) | Identificación y corrección de consultas pre-escritas que contienen errores sintácticos o lógicos. | Validación en tiempo de ejecución. El código debe compilar sin lanzar excepciones del motor SQLite y retornar la data correcta. |
| Auditoría (Búsqueda de Fallos) | El usuario inspecciona una cadena estática y hace clic en el fragmento o token exacto que invalida el código. | Detección de eventos de interacción sobre nodos DOM (etiquetas \<span\>) indexados según el modelo JSON del nivel. |
| Ensamblaje (Drag & Drop) | Arrastre y reordenación de bloques de comandos desde un área de almacenamiento hacia la zona de ejecución. | Concatenación secuencial de los bloques depositados y posterior evaluación del *dataset* en memoria. |

## **5\. Estructura de Datos (API Estática JSON)**

Los retos y escenarios se gestionarán sin base de datos centralizada, utilizando catálogos JSON que dictarán los parámetros de cada nivel.

{  
  "id\_nivel": "sql\_op\_001",  
  "dificultad": "intermedio",  
  "modalidad": "auditoria",  
  "briefing\_mision": "Se ha detectado una anomalía en los registros de inventario. Localiza el error en la llamada de actualización.",  
  "query\_defectuoso": "UPDATE arsenal SET estado \= 'inactivo' WHERE item\_id \= 405",  
  "token\_error\_index": 5,  
  "explicacion": "La sentencia carece del delimitador final (;). En entornos estrictos, esto interrumpe el lote de ejecución."  
}  
