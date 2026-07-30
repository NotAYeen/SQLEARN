const LEVELS = [
    {
        id_nivel: "escenario_01",
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
    }
];

window.AppLevels = LEVELS;
