const LEVELS = [
    {
        id_nivel: "escenario_01",
        db_name: "techcorp.db",
        dificultad: "Básico",
        modalidad: "Terminal",
        briefing_mision: "[RRHH y Nóminas] Necesitamos revisar la lista de empleados de la empresa 'TechCorp'. Escribe una consulta para seleccionar el 'nombre' y 'salario' de la tabla 'empleados' donde el departamento ('depto') sea 'IT'.",
        init_db_sql: `
            CREATE TABLE empleados (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                depto TEXT NOT NULL,
                salario INTEGER NOT NULL
            );
            INSERT INTO empleados (id, nombre, depto, salario) VALUES 
            (1, 'Laura G.', 'IT', 4500),
            (2, 'Roberto M.', 'Ventas', 3200),
            (3, 'Carla T.', 'IT', 4700),
            (4, 'Sofia R.', 'Marketing', 3000),
            (5, 'Diego P.', 'IT', 4200);
        `,
        expected_query: "SELECT nombre, salario FROM empleados WHERE depto = 'IT';",
        solution_data: [
            ['Laura G.', 4500],
            ['Carla T.', 4700],
            ['Diego P.', 4200]
        ],
        schema: [
            {
                table: "empleados",
                columns: ["id (INT)", "nombre (TEXT)", "depto (TEXT)", "salario (INT)"]
            }
        ],
        learning_resources: [
            { title: "SELECT", desc: "Selecciona las columnas que quieres visualizar de la base de datos." },
            { title: "FROM", desc: "Especifica la tabla de la cual vas a extraer los datos." },
            { title: "WHERE", desc: "Filtra los resultados para mostrar sólo los que cumplan la condición." }
        ]
    },
    {
        id_nivel: "escenario_02",
        db_name: "metro.db",
        dificultad: "Intermedio",
        modalidad: "Depuración",
        briefing_mision: "[Transporte Público] El panel de horarios del metro está fallando. Se supone que debe mostrar las estaciones de la línea 'Roja' que tienen una incidencia ('incidencia' = 1). Arregla el código defectuoso.",
        init_db_sql: `
            CREATE TABLE estaciones (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                linea TEXT NOT NULL,
                incidencia INTEGER NOT NULL
            );
            INSERT INTO estaciones (id, nombre, linea, incidencia) VALUES 
            (101, 'Central', 'Roja', 1),
            (102, 'Norte', 'Azul', 0),
            (103, 'Plaza Mayor', 'Roja', 0),
            (104, 'Sur', 'Verde', 1),
            (105, 'Universidad', 'Roja', 1);
        `,
        query_defectuoso: "SELECT nombre FROM estaciones WHERE linea = 'Roja' OR incidencia = 1;",
        expected_query: "SELECT nombre FROM estaciones WHERE linea = 'Roja' AND incidencia = 1;",
        solution_data: [
            ['Central'],
            ['Universidad']
        ],
        schema: [
            {
                table: "estaciones",
                columns: ["id (INT)", "nombre (TEXT)", "linea (TEXT)", "incidencia (INT)"]
            }
        ],
        learning_resources: [
            { title: "AND vs OR", desc: "El operador AND requiere que ambas condiciones sean verdaderas. El operador OR requiere que sólo una de ellas sea verdadera." },
            { title: "=", desc: "Comprueba si dos valores son iguales." }
        ]
    },
    {
        id_nivel: "escenario_03",
        db_name: "logistica.db",
        dificultad: "Intermedio",
        modalidad: "Auditoría",
        briefing_mision: "[Logística] Un paquete se perdió. El sistema de búsqueda falló por un error tipográfico al intentar buscar el paquete con código 'PKG-999'. Haz clic en el token erróneo.",
        init_db_sql: `
            CREATE TABLE envios (
                codigo TEXT PRIMARY KEY,
                destino TEXT NOT NULL,
                estado TEXT NOT NULL
            );
            INSERT INTO envios (codigo, destino, estado) VALUES 
            ('PKG-123', 'Madrid', 'Entregado'),
            ('PKG-999', 'Barcelona', 'En Tránsito');
        `,
        audit_tokens: [
            "SELECT ", "* ", "FROM ", "envíos ", "WHERE ", "codigo = ", "'PKG-999';"
        ],
        token_error_index: 3,
        explicacion: "El nombre de la tabla no debe llevar tilde ('envíos' debería ser 'envios'). En bases de datos y programación, se evitan los caracteres especiales o tildes en nombres de tablas o variables.",
        expected_query: "", 
        solution_data: [],
        schema: [
            {
                table: "envios",
                columns: ["codigo (TEXT)", "destino (TEXT)", "estado (TEXT)"]
            }
        ],
        learning_resources: [
            { title: "Sintaxis", desc: "No uses acentos, eñes, ni caracteres especiales en nombres de bases de datos o tablas." },
            { title: "* (Asterisco)", desc: "Se usa en el SELECT para indicar 'todas las columnas'." }
        ]
    },
    {
        id_nivel: "escenario_04",
        db_name: "hospital.db",
        dificultad: "Intermedio",
        modalidad: "Ensamblaje",
        briefing_mision: "[Hospital] El médico de guardia necesita ver rápidamente los pacientes asignados a 'Cardiología'. Ensambla los bloques arrastrándolos para formar la consulta correcta.",
        init_db_sql: `
            CREATE TABLE pacientes (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                area TEXT NOT NULL,
                habitacion INTEGER NOT NULL
            );
            INSERT INTO pacientes (id, nombre, area, habitacion) VALUES 
            (1, 'Manuel Ortiz', 'Cardiología', 101),
            (2, 'Lucia Perez', 'Neurología', 202),
            (3, 'Andrés Silva', 'Cardiología', 105);
        `,
        dnd_blocks: [
            "WHERE area = 'Cardiología'",
            "SELECT nombre, habitacion",
            ";",
            "FROM pacientes"
        ],
        expected_query: "SELECT nombre, habitacion FROM pacientes WHERE area = 'Cardiología';",
        solution_data: [
            ['Manuel Ortiz', 101],
            ['Andrés Silva', 105]
        ],
        schema: [
            {
                table: "pacientes",
                columns: ["id (INT)", "nombre (TEXT)", "area (TEXT)", "habitacion (INT)"]
            }
        ],
        learning_resources: [
            { title: "Estructura SQL", desc: "El orden común y correcto es: 1. SELECT, 2. FROM, 3. WHERE." },
            { title: "; (Punto y Coma)", desc: "Se usa para indicar el final de una consulta SQL completa." }
        ]
    },
    {
        id_nivel: "escenario_05",
        db_name: "ecommerce.db",
        dificultad: "Avanzado",
        modalidad: "Terminal",
        briefing_mision: "[E-Commerce] El equipo de ventas necesita un reporte. Une (JOIN) la tabla 'clientes' con la tabla 'pedidos' para mostrar el 'nombre' del cliente y el 'producto' que compró.",
        init_db_sql: `
            CREATE TABLE clientes (
                id_cliente INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                pais TEXT NOT NULL
            );
            CREATE TABLE pedidos (
                id_pedido INTEGER PRIMARY KEY,
                id_cliente INTEGER NOT NULL,
                producto TEXT NOT NULL,
                precio INTEGER NOT NULL,
                FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
            );
            INSERT INTO clientes (id_cliente, nombre, pais) VALUES 
            (1, 'Andrea Soto', 'México'),
            (2, 'Carlos Ruiz', 'España'),
            (3, 'Mariana Gil', 'Colombia'),
            (4, 'Luis Torres', 'Argentina'),
            (5, 'Diana Paz', 'Chile');
            
            INSERT INTO pedidos (id_pedido, id_cliente, producto, precio) VALUES 
            (101, 2, 'Laptop Pro', 1200),
            (102, 1, 'Mouse Inalámbrico', 25),
            (103, 4, 'Monitor 4K', 400),
            (104, 2, 'Teclado Mecánico', 80),
            (105, 5, 'Auriculares', 60),
            (106, 1, 'Webcam', 45);
        `,
        expected_query: "SELECT clientes.nombre, pedidos.producto FROM clientes INNER JOIN pedidos ON clientes.id_cliente = pedidos.id_cliente;",
        solution_data: [
            ['Carlos Ruiz', 'Laptop Pro'],
            ['Andrea Soto', 'Mouse Inalámbrico'],
            ['Luis Torres', 'Monitor 4K'],
            ['Carlos Ruiz', 'Teclado Mecánico'],
            ['Diana Paz', 'Auriculares'],
            ['Andrea Soto', 'Webcam']
        ],
        schema: [
            {
                table: "clientes",
                columns: ["id_cliente (INT)", "nombre (TEXT)", "pais (TEXT)"]
            },
            {
                table: "pedidos",
                columns: ["id_pedido (INT)", "id_cliente (INT)", "producto (TEXT)", "precio (INT)"]
            }
        ],
        learning_resources: [
            { title: "INNER JOIN", desc: "Permite combinar filas de dos tablas basándose en una columna relacionada entre ellas." },
            { title: "ON", desc: "Especifica la condición que une las tablas (ej. ON tabla1.id = tabla2.id)." }
        ]
    },
    {
        id_nivel: "escenario_06",
        db_name: "streaming.db",
        dificultad: "Avanzado",
        modalidad: "Depuración",
        briefing_mision: "[Servicio de Streaming] Tenemos un error al buscar el 'Top 3' de usuarios que más minutos han consumido. La consulta une 3 tablas, agrupa por usuario y suma los minutos de las películas, pero hay errores en la sintaxis del ORDER BY y LIMIT. ¡Arréglalo!",
        init_db_sql: `
            CREATE TABLE usuarios (
                id_usuario INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL
            );
            CREATE TABLE catalogo (
                id_peli INTEGER PRIMARY KEY,
                titulo TEXT NOT NULL,
                minutos INTEGER NOT NULL
            );
            CREATE TABLE historial_vistas (
                id_vista INTEGER PRIMARY KEY,
                id_usuario INTEGER NOT NULL,
                id_peli INTEGER NOT NULL,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (id_peli) REFERENCES catalogo(id_peli)
            );
            
            INSERT INTO usuarios (id_usuario, nombre) VALUES 
            (1, 'Alex'), (2, 'Maria'), (3, 'Juan'), (4, 'Sofia');
            
            INSERT INTO catalogo (id_peli, titulo, minutos) VALUES 
            (101, 'Matrix', 136), (102, 'Shrek', 90), (103, 'Inception', 148), (104, 'Avatar', 162);
            
            INSERT INTO historial_vistas (id_vista, id_usuario, id_peli) VALUES 
            (1, 1, 101), (2, 1, 102), -- Alex: 226 min
            (3, 2, 103), (4, 2, 104), (5, 2, 101), -- Maria: 446 min
            (6, 3, 102), -- Juan: 90 min
            (7, 4, 104), (8, 4, 103); -- Sofia: 310 min
        `,
        query_defectuoso: "SELECT usuarios.nombre, SUM(catalogo.minutos) FROM usuarios INNER JOIN historial_vistas ON usuarios.id_usuario = historial_vistas.id_usuario INNER JOIN catalogo ON historial_vistas.id_peli = catalogo.id_peli GROUP BY usuarios.nombre ORDER BY SUM(catalogo.minutos) LIMIT 3 DESC;",
        expected_query: "SELECT usuarios.nombre, SUM(catalogo.minutos) FROM usuarios INNER JOIN historial_vistas ON usuarios.id_usuario = historial_vistas.id_usuario INNER JOIN catalogo ON historial_vistas.id_peli = catalogo.id_peli GROUP BY usuarios.nombre ORDER BY SUM(catalogo.minutos) DESC LIMIT 3;",
        solution_data: [
            ['Maria', 446],
            ['Sofia', 310],
            ['Alex', 226]
        ],
        schema: [
            {
                table: "usuarios",
                columns: ["id_usuario (INT)", "nombre (TEXT)"]
            },
            {
                table: "catalogo",
                columns: ["id_peli (INT)", "titulo (TEXT)", "minutos (INT)"]
            },
            {
                table: "historial_vistas",
                columns: ["id_vista (INT)", "id_usuario (INT)", "id_peli (INT)"]
            }
        ],
        learning_resources: [
            { title: "JOIN Múltiple", desc: "Puedes encadenar varios INNER JOIN para unir 3 o más tablas." },
            { title: "ORDER BY & LIMIT", desc: "El orden de cláusulas siempre es: WHERE, GROUP BY, ORDER BY, LIMIT." }
        ]
    },
    {
        id_nivel: "escenario_07",
        db_name: "banco.db",
        dificultad: "Experto",
        modalidad: "Terminal",
        briefing_mision: "[Banco] El jefe final: 4 Tablas. Muestra el 'nombre' del cliente y el total de 'monto' de sus transacciones. Debes hacer JOIN desde 'clientes' hasta 'sucursales', luego 'cuentas' y finalmente 'transacciones', agrupando por nombre del cliente.",
        init_db_sql: `
            CREATE TABLE clientes (
                id_cliente INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL
            );
            CREATE TABLE sucursales (
                id_sucursal INTEGER PRIMARY KEY,
                id_cliente INTEGER NOT NULL,
                ciudad TEXT NOT NULL,
                FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
            );
            CREATE TABLE cuentas (
                id_cuenta INTEGER PRIMARY KEY,
                id_sucursal INTEGER NOT NULL,
                tipo_cuenta TEXT NOT NULL,
                FOREIGN KEY (id_sucursal) REFERENCES sucursales(id_sucursal)
            );
            CREATE TABLE transacciones (
                id_tx INTEGER PRIMARY KEY,
                id_cuenta INTEGER NOT NULL,
                monto INTEGER NOT NULL,
                FOREIGN KEY (id_cuenta) REFERENCES cuentas(id_cuenta)
            );
            
            INSERT INTO clientes (id_cliente, nombre) VALUES (1, 'TechCorp Inc.'), (2, 'GlobalMedia');
            
            INSERT INTO sucursales (id_sucursal, id_cliente, ciudad) VALUES 
            (10, 1, 'Madrid'), (11, 1, 'Barcelona'), (12, 2, 'Valencia');
            
            INSERT INTO cuentas (id_cuenta, id_sucursal, tipo_cuenta) VALUES 
            (100, 10, 'Corriente'), (101, 11, 'Ahorro'), (102, 12, 'Corriente');
            
            INSERT INTO transacciones (id_tx, id_cuenta, monto) VALUES 
            (1000, 100, 5000), (1001, 100, 2500), 
            (1002, 101, 10000), 
            (1003, 102, 8000), (1004, 102, 2000);
        `,
        expected_query: "SELECT clientes.nombre, SUM(transacciones.monto) FROM clientes INNER JOIN sucursales ON clientes.id_cliente = sucursales.id_cliente INNER JOIN cuentas ON sucursales.id_sucursal = cuentas.id_sucursal INNER JOIN transacciones ON cuentas.id_cuenta = transacciones.id_cuenta GROUP BY clientes.nombre;",
        solution_data: [
            ['GlobalMedia', 10000],
            ['TechCorp Inc.', 17500]
        ],
        schema: [
            {
                table: "clientes",
                columns: ["id_cliente (INT)", "nombre (TEXT)"]
            },
            {
                table: "sucursales",
                columns: ["id_sucursal (INT)", "id_cliente (INT)", "ciudad (TEXT)"]
            },
            {
                table: "cuentas",
                columns: ["id_cuenta (INT)", "id_sucursal (INT)", "tipo_cuenta (TEXT)"]
            },
            {
                table: "transacciones",
                columns: ["id_tx (INT)", "id_cuenta (INT)", "monto (INT)"]
            }
        ],
        learning_resources: [
            { title: "JOIN Masivo", desc: "La base de los sistemas corporativos complejos es saber cómo navegar las relaciones de tabla en tabla usando las Llaves Primarias y Foráneas." },
            { title: "GROUP BY", desc: "Permite consolidar la suma total (SUM) agrupando por un atributo de nivel superior (nombre de cliente)." }
        ]
    },
    {
        id_nivel: "escenario_08",
        db_name: "videojuegos.db",
        dificultad: "Básico",
        modalidad: "Auditoría",
        briefing_mision: "[Videojuegos] Un jugador se queja de que perdió su 'Espada Épica'. Intentamos buscarla, pero la consulta falló por un error de sintaxis en el filtro de texto (las cadenas de texto llevan comillas simples). Haz clic en el token erróneo.",
        init_db_sql: `
            CREATE TABLE inventario (
                id_item INTEGER PRIMARY KEY,
                jugador TEXT NOT NULL,
                item TEXT NOT NULL
            );
            INSERT INTO inventario (id_item, jugador, item) VALUES (1, 'Hero99', 'Poción'), (2, 'Hero99', 'Espada Épica');
        `,
        audit_tokens: ["SELECT ", "* ", "FROM ", "inventario ", "WHERE ", "item = ", "Espada Épica", ";"],
        token_error_index: 6,
        explicacion: "Los textos siempre deben ir entre comillas simples en SQL: 'Espada Épica'.",
        expected_query: "", solution_data: [],
        schema: [{ table: "inventario", columns: ["id_item (INT)", "jugador (TEXT)", "item (TEXT)"] }],
        learning_resources: [{ title: "Comillas simples", desc: "El texto en SQL siempre debe estar rodeado de comillas simples ('texto')." }]
    },
    {
        id_nivel: "escenario_09",
        db_name: "restaurante.db",
        dificultad: "Intermedio",
        modalidad: "Auditoría",
        briefing_mision: "[Restaurante] El sistema de órdenes falló. Un programador usó una palabra reservada ('table') como nombre para la tabla de mesas del restaurante. Encuentra y haz clic en el error.",
        init_db_sql: `
            CREATE TABLE mesas (
                id_mesa INTEGER PRIMARY KEY,
                capacidad INTEGER NOT NULL
            );
        `,
        audit_tokens: ["SELECT ", "* ", "FROM ", "table ", "WHERE ", "capacidad > 2;"],
        token_error_index: 3,
        explicacion: "No puedes nombrar a una tabla con palabras reservadas del sistema SQL como 'table', 'select', 'where', etc. (Se llamó 'mesas' en la BD real).",
        expected_query: "", solution_data: [],
        schema: [{ table: "mesas", columns: ["id_mesa (INT)", "capacidad (INT)"] }],
        learning_resources: [{ title: "Palabras Reservadas", desc: "Evita nombrar tus tablas o columnas con comandos de SQL." }]
    },
    {
        id_nivel: "escenario_10",
        db_name: "red_social.db",
        dificultad: "Intermedio",
        modalidad: "Ensamblaje",
        briefing_mision: "[Red Social] Un usuario nuevo se ha registrado. Ensambla los bloques para INSERTAR al usuario 'bob' y luego SELECCIONARLO para verificar.",
        init_db_sql: `
            CREATE TABLE usuarios (
                username TEXT PRIMARY KEY,
                seguidores INTEGER
            );
            INSERT INTO usuarios (username, seguidores) VALUES ('alice', 500);
        `,
        dnd_blocks: ["INSERT INTO usuarios", "(username, seguidores) VALUES ('bob', 0);", "SELECT username", "FROM usuarios WHERE username = 'bob';"],
        expected_query: "INSERT INTO usuarios (username, seguidores) VALUES ('bob', 0); SELECT username FROM usuarios WHERE username = 'bob';",
        solution_data: [['bob']],
        schema: [{ table: "usuarios", columns: ["username (TEXT)", "seguidores (INT)"] }],
        learning_resources: [{ title: "INSERT INTO", desc: "Agrega nuevas filas. Se suele seguir de (columnas) VALUES (valores)." }]
    },
    {
        id_nivel: "escenario_11",
        db_name: "vuelos.db",
        dificultad: "Intermedio",
        modalidad: "Ensamblaje",
        briefing_mision: "[Vuelos] Forma un JOIN correcto para ver qué pasajero va en qué vuelo.",
        init_db_sql: `
            CREATE TABLE pasajeros (id_pasajero INT, nombre TEXT);
            CREATE TABLE vuelos (id_vuelo INT, id_pasajero INT, destino TEXT);
            INSERT INTO pasajeros VALUES (1, 'Carlos'), (2, 'Ana');
            INSERT INTO vuelos VALUES (100, 1, 'Paris'), (101, 2, 'Roma');
        `,
        dnd_blocks: ["SELECT pasajeros.nombre, vuelos.destino", "FROM pasajeros", "INNER JOIN vuelos", "ON pasajeros.id_pasajero = vuelos.id_pasajero;"],
        expected_query: "SELECT pasajeros.nombre, vuelos.destino FROM pasajeros INNER JOIN vuelos ON pasajeros.id_pasajero = vuelos.id_pasajero;",
        solution_data: [['Carlos', 'Paris'], ['Ana', 'Roma']],
        schema: [{ table: "pasajeros", columns: ["id_pasajero (INT)", "nombre (TEXT)"] }, { table: "vuelos", columns: ["id_vuelo (INT)", "id_pasajero (INT)", "destino (TEXT)"] }],
        learning_resources: [{ title: "INNER JOIN", desc: "La estructura básica es: FROM tabla1 INNER JOIN tabla2 ON tabla1.id = tabla2.id" }]
    },
    {
        id_nivel: "escenario_12",
        db_name: "biblioteca.db",
        dificultad: "Intermedio",
        modalidad: "Depuración",
        briefing_mision: "[Biblioteca] La búsqueda de libros no funciona. Queremos encontrar cualquier libro que contenga la palabra 'Magia' en su título, pero los comodines '%' del LIKE están mal puestos. ¡Arréglalo!",
        init_db_sql: `
            CREATE TABLE libros (id INT, titulo TEXT);
            INSERT INTO libros VALUES (1, 'La Magia Oscura'), (2, 'Matemáticas Básicas'), (3, 'Trucos de Magia'), (4, 'Historia Universal');
        `,
        query_defectuoso: "SELECT titulo FROM libros WHERE titulo LIKE 'Magia%';",
        expected_query: "SELECT titulo FROM libros WHERE titulo LIKE '%Magia%';",
        solution_data: [['La Magia Oscura'], ['Trucos de Magia']],
        schema: [{ table: "libros", columns: ["id (INT)", "titulo (TEXT)"] }],
        learning_resources: [{ title: "LIKE", desc: "El comodín % reemplaza cualquier cantidad de caracteres. '%Texto%' busca 'Texto' en cualquier parte." }]
    },
    {
        id_nivel: "escenario_13",
        db_name: "concesionario.db",
        dificultad: "Avanzado",
        modalidad: "Depuración",
        briefing_mision: "[Concesionario] Queremos ver el precio promedio (AVG) de los autos por cada marca. La consulta da error porque olvidaron agrupar los resultados. ¡Añade la cláusula faltante al final!",
        init_db_sql: `
            CREATE TABLE autos (id INT, marca TEXT, precio INT);
            INSERT INTO autos VALUES (1, 'Ford', 20000), (2, 'Ford', 25000), (3, 'Toyota', 22000), (4, 'Toyota', 24000);
        `,
        query_defectuoso: "SELECT marca, AVG(precio) FROM autos;",
        expected_query: "SELECT marca, AVG(precio) FROM autos GROUP BY marca;",
        solution_data: [['Ford', 22500], ['Toyota', 23000]],
        schema: [{ table: "autos", columns: ["id (INT)", "marca (TEXT)", "precio (INT)"] }],
        learning_resources: [{ title: "Funciones de Agregación", desc: "Siempre que uses AVG, SUM o COUNT junto con otras columnas, DEBES agrupar (GROUP BY) por esas otras columnas." }]
    },
    {
        id_nivel: "escenario_14",
        db_name: "gimnasio.db",
        dificultad: "Intermedio",
        modalidad: "Terminal",
        briefing_mision: "[Gimnasio] Extrae el 'nombre' de los clientes que tengan estado 'Activo' y ordénalos alfabéticamente de forma descendente (Z a A).",
        init_db_sql: `
            CREATE TABLE clientes (id INT, nombre TEXT, estado TEXT);
            INSERT INTO clientes VALUES (1, 'Zack', 'Activo'), (2, 'Ana', 'Inactivo'), (3, 'Xavier', 'Activo'), (4, 'Beto', 'Activo');
        `,
        expected_query: "SELECT nombre FROM clientes WHERE estado = 'Activo' ORDER BY nombre DESC;",
        solution_data: [['Zack'], ['Xavier'], ['Beto']],
        schema: [{ table: "clientes", columns: ["id (INT)", "nombre (TEXT)", "estado (TEXT)"] }],
        learning_resources: [{ title: "ORDER BY DESC", desc: "El orden predeterminado es ASC. Usa DESC para invertirlo." }]
    },
    {
        id_nivel: "escenario_15",
        db_name: "universidad.db",
        dificultad: "Experto",
        modalidad: "Terminal",
        briefing_mision: "[Universidad] Jefe Final 2: Subconsultas. Selecciona el 'nombre' de los alumnos cuya 'calificacion' sea MAYOR al promedio general de todos los alumnos. (Pista: usa WHERE calificacion > (SELECT AVG(calificacion) FROM alumnos) ).",
        init_db_sql: `
            CREATE TABLE alumnos (id INT, nombre TEXT, calificacion INT);
            INSERT INTO alumnos VALUES (1, 'Luis', 6), (2, 'Marta', 9), (3, 'Pedro', 7), (4, 'Julia', 10);
        `,
        expected_query: "SELECT nombre FROM alumnos WHERE calificacion > (SELECT AVG(calificacion) FROM alumnos);",
        solution_data: [['Marta'], ['Julia']],
        schema: [{ table: "alumnos", columns: ["id (INT)", "nombre (TEXT)", "calificacion (INT)"] }],
        learning_resources: [{ title: "Subconsultas", desc: "Puedes anidar consultas dentro de paréntesis para usar sus resultados como valores dinámicos en tu WHERE." }]
    },
    {
        id_nivel: "escenario_16", db_name: "rrhh_filtros.db", dificultad: "Intermedio", modalidad: "Terminal",
        briefing_mision: "[RRHH Filtros] Selecciona el 'nombre' de los empleados cuyo departamento esté en la lista ('IT', 'Ventas') y cuyo salario esté entre 3000 y 5000.",
        init_db_sql: "CREATE TABLE empleados (nombre TEXT, depto TEXT, salario INT); INSERT INTO empleados VALUES ('Ana', 'IT', 4000), ('Beto', 'Ventas', 2000), ('Cris', 'IT', 6000), ('Dany', 'Ventas', 4500);",
        expected_query: "SELECT nombre FROM empleados WHERE depto IN ('IT', 'Ventas') AND salario BETWEEN 3000 AND 5000;",
        solution_data: [['Ana'], ['Dany']],
        schema: [{ table: "empleados", columns: ["nombre (TEXT)", "depto (TEXT)", "salario (INT)"] }],
        learning_resources: [{ title: "IN y BETWEEN", desc: "Usa IN ('a', 'b') para listas y BETWEEN x AND y para rangos inclusivos." }]
    },
    {
        id_nivel: "escenario_17", db_name: "soporte_it.db", dificultad: "Intermedio", modalidad: "Depuración",
        briefing_mision: "[Soporte IT] La consulta intenta mostrar el ticket y quién lo atiende. Si el asignado es nulo, debe decir 'Sin Asignar'. Arregla la función COALESCE (recibe dos parámetros).",
        init_db_sql: "CREATE TABLE tickets (id INT, asignado TEXT); INSERT INTO tickets VALUES (1, 'Admin'), (2, NULL);",
        query_defectuoso: "SELECT id, COALESCE(asignado) FROM tickets;",
        expected_query: "SELECT id, COALESCE(asignado, 'Sin Asignar') FROM tickets;",
        solution_data: [[1, 'Admin'], [2, 'Sin Asignar']],
        schema: [{ table: "tickets", columns: ["id (INT)", "asignado (TEXT)"] }],
        learning_resources: [{ title: "COALESCE", desc: "Devuelve el primer valor que no sea nulo en la lista: COALESCE(columna, 'Valor por defecto')." }]
    },
    {
        id_nivel: "escenario_18", db_name: "contabilidad.db", dificultad: "Avanzado", modalidad: "Ensamblaje",
        briefing_mision: "[Contabilidad] Ensambla la consulta para calcular el precio final con impuesto (precio * 1.16) y redondéalo a 1 decimal.",
        init_db_sql: "CREATE TABLE productos (nombre TEXT, precio REAL); INSERT INTO productos VALUES ('Mouse', 10.55), ('Teclado', 20.1);",
        dnd_blocks: ["SELECT nombre,", "ROUND(", "precio * 1.16", ", 1)", "FROM productos;"],
        expected_query: "SELECT nombre, ROUND( precio * 1.16 , 1) FROM productos;",
        solution_data: [['Mouse', 12.2], ['Teclado', 23.3]],
        schema: [{ table: "productos", columns: ["nombre (TEXT)", "precio (REAL)"] }],
        learning_resources: [{ title: "Matemáticas y ROUND", desc: "Puedes usar *, /, +, - directamente. ROUND(valor, decimales) redondea el número." }]
    },
    {
        id_nivel: "escenario_19", db_name: "directorio.db", dificultad: "Avanzado", modalidad: "Terminal",
        briefing_mision: "[Directorio] Concatena nombre y apellido con un espacio entre ellos ('nombre || \\' \\' || apellido') y conviértelo a MAYÚSCULAS usando UPPER(). Extrae solo eso.",
        init_db_sql: "CREATE TABLE gente (nombre TEXT, apellido TEXT); INSERT INTO gente VALUES ('john', 'doe'), ('jane', 'smith');",
        expected_query: "SELECT UPPER(nombre || ' ' || apellido) FROM gente;",
        solution_data: [['JOHN DOE'], ['JANE SMITH']],
        schema: [{ table: "gente", columns: ["nombre (TEXT)", "apellido (TEXT)"] }],
        learning_resources: [{ title: "Operadores de Texto", desc: "|| une textos (en SQLite). UPPER() los hace mayúsculas, LOWER() minúsculas." }]
    },
    {
        id_nivel: "escenario_20", db_name: "calificaciones.db", dificultad: "Avanzado", modalidad: "Depuración",
        briefing_mision: "[Calificaciones] Corrige la sintaxis del CASE WHEN. Falta la palabra clave que cierra y finaliza el bloque lógico.",
        init_db_sql: "CREATE TABLE notas (alumno TEXT, nota INT); INSERT INTO notas VALUES ('Leo', 90), ('Mia', 50);",
        query_defectuoso: "SELECT alumno, CASE WHEN nota >= 60 THEN 'Aprobado' ELSE 'Reprobado' FROM notas;",
        expected_query: "SELECT alumno, CASE WHEN nota >= 60 THEN 'Aprobado' ELSE 'Reprobado' END FROM notas;",
        solution_data: [['Leo', 'Aprobado'], ['Mia', 'Reprobado']],
        schema: [{ table: "notas", columns: ["alumno (TEXT)", "nota (INT)"] }],
        learning_resources: [{ title: "CASE WHEN", desc: "Estructura: CASE WHEN condicion THEN resultado ELSE alternativo END" }]
    },
    {
        id_nivel: "escenario_21", db_name: "inventario_bodega.db", dificultad: "Intermedio", modalidad: "Auditoría",
        briefing_mision: "[Bodega] Se intenta calcular la suma total (SUM) de inventario, pero por error usaron la función para contar (COUNT). Encuentra el error.",
        init_db_sql: "CREATE TABLE items (nombre TEXT, cantidad INT); INSERT INTO items VALUES ('A', 10), ('B', 20);",
        audit_tokens: ["SELECT ", "COUNT", "(cantidad) ", "FROM ", "items;"],
        token_error_index: 1,
        explicacion: "COUNT() cuenta filas. SUM() suma los valores numéricos.",
        expected_query: "", solution_data: [],
        schema: [{ table: "items", columns: ["nombre (TEXT)", "cantidad (INT)"] }],
        learning_resources: [{ title: "COUNT vs SUM", desc: "COUNT cuenta la cantidad de registros. SUM suma el valor matemático de la columna." }]
    },
    {
        id_nivel: "escenario_22", db_name: "fusiones.db", dificultad: "Avanzado", modalidad: "Ensamblaje",
        briefing_mision: "[Fusiones] Arrastra los bloques para UNIR los correos de la tabla 'empresa_a' con los de 'empresa_b', excluyendo duplicados.",
        init_db_sql: "CREATE TABLE empresa_a (correo TEXT); CREATE TABLE empresa_b (correo TEXT); INSERT INTO empresa_a VALUES ('a@mail.com'), ('dup@mail.com'); INSERT INTO empresa_b VALUES ('b@mail.com'), ('dup@mail.com');",
        dnd_blocks: ["SELECT correo FROM empresa_a", "UNION", "SELECT correo FROM empresa_b", ";"],
        expected_query: "SELECT correo FROM empresa_a UNION SELECT correo FROM empresa_b ;",
        solution_data: [['a@mail.com'], ['b@mail.com'], ['dup@mail.com']],
        schema: [{ table: "empresa_a", columns: ["correo (TEXT)"] }, { table: "empresa_b", columns: ["correo (TEXT)"] }],
        learning_resources: [{ title: "UNION vs UNION ALL", desc: "UNION combina resultados eliminando duplicados. UNION ALL los deja intactos." }]
    },
    {
        id_nivel: "escenario_23", db_name: "suscripciones.db", dificultad: "Experto", modalidad: "Terminal",
        briefing_mision: "[Suscripciones] Lista 'nombre' del cliente y su 'plan' de suscripción. Usa LEFT JOIN para que los clientes SIN suscripción también aparezcan (su plan se mostrará vacío).",
        init_db_sql: "CREATE TABLE cl (id INT, nombre TEXT); CREATE TABLE sub (id_cl INT, plan TEXT); INSERT INTO cl VALUES (1, 'Sam'), (2, 'Tim'); INSERT INTO sub VALUES (1, 'Pro');",
        expected_query: "SELECT cl.nombre, sub.plan FROM cl LEFT JOIN sub ON cl.id = sub.id_cl;",
        solution_data: [['Sam', 'Pro'], ['Tim', null]],
        schema: [{ table: "cl", columns: ["id (INT)", "nombre (TEXT)"] }, { table: "sub", columns: ["id_cl (INT)", "plan (TEXT)"] }],
        learning_resources: [{ title: "LEFT JOIN", desc: "Mantiene TODAS las filas de la tabla izquierda, y rellena con NULL donde no hay match a la derecha." }]
    },
    {
        id_nivel: "escenario_24", db_name: "hoteles.db", dificultad: "Experto", modalidad: "Depuración",
        briefing_mision: "[Hoteles] Busca las reservas que ocurran HOY o en el futuro. Debes reemplazar 'HOY' por la función DATE('now') para obtener la fecha actual dinámica del sistema.",
        init_db_sql: "CREATE TABLE reservas (habitacion INT, fecha TEXT); INSERT INTO reservas VALUES (101, '2010-12-31'), (102, '2050-05-10');",
        query_defectuoso: "SELECT habitacion FROM reservas WHERE fecha >= 'HOY';",
        expected_query: "SELECT habitacion FROM reservas WHERE fecha >= DATE('now');",
        solution_data: [[102]],
        schema: [{ table: "reservas", columns: ["habitacion (INT)", "fecha (TEXT)"] }],
        learning_resources: [{ title: "Funciones de Fecha", desc: "DATE('now') devuelve la fecha del día de hoy para comparaciones dinámicas." }]
    },
    {
        id_nivel: "escenario_25", db_name: "seguridad_nsa.db", dificultad: "Experto", modalidad: "Terminal",
        briefing_mision: "[NSA] Jefe Final Absoluto. Extrae la 'ip' de los accesos donde NOT EXISTS un registro en la tabla de 'autorizados' que tenga la misma IP.",
        init_db_sql: "CREATE TABLE accesos (ip TEXT); CREATE TABLE autorizados (ip TEXT); INSERT INTO accesos VALUES ('1.1.1.1'), ('9.9.9.9'); INSERT INTO autorizados VALUES ('1.1.1.1');",
        expected_query: "SELECT ip FROM accesos WHERE NOT EXISTS (SELECT 1 FROM autorizados WHERE autorizados.ip = accesos.ip);",
        solution_data: [['9.9.9.9']],
        schema: [{ table: "accesos", columns: ["ip (TEXT)"] }, { table: "autorizados", columns: ["ip (TEXT)"] }],
        learning_resources: [{ title: "NOT EXISTS", desc: "WHERE NOT EXISTS (subconsulta) filtra registros donde la subconsulta correlacionada no arroje ni un solo resultado." }]
    }
];

window.AppLevels = LEVELS;
