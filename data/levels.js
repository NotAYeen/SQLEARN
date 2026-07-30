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
    }
];

window.AppLevels = LEVELS;
