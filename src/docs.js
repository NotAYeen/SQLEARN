export const SqlDocs = [
    {
        category: "Cláusulas Principales",
        items: [
            { name: "SELECT", desc: "La instrucción principal para consultar datos. Define qué columnas quieres ver en el resultado final.", example: "SELECT nombre, edad FROM usuarios;" },
            { name: "FROM", desc: "Especifica la tabla base de la cual se van a extraer los registros.", example: "SELECT * FROM productos;" },
            { name: "WHERE", desc: "Filtra los registros según una o más condiciones. Solo se devuelven las filas que cumplen la condición (true).", example: "SELECT * FROM ventas WHERE total > 100;" },
            { name: "GROUP BY", desc: "Agrupa filas que tienen los mismos valores en filas de resumen, como encontrar el total o promedio. Se usa con funciones de agregación.", example: "SELECT depto, COUNT(*) FROM empleados GROUP BY depto;" },
            { name: "ORDER BY", desc: "Ordena el resultado final (ASC para ascendente por defecto, o DESC para descendente).", example: "SELECT * FROM puntajes ORDER BY score DESC;" },
            { name: "LIMIT", desc: "Limita la cantidad de filas que devuelve la consulta. Útil para obtener 'Top N' resultados.", example: "SELECT * FROM tops ORDER BY puntos DESC LIMIT 3;" }
        ]
    },
    {
        category: "Filtros y Operadores",
        items: [
            { name: "=, <>, >, <", desc: "Operadores de comparación básicos. <> o != significa 'distinto de'.", example: "WHERE precio >= 50 AND precio <> 100;" },
            { name: "AND / OR", desc: "Operadores lógicos para encadenar condiciones.", example: "WHERE (edad > 18 AND status = 'Activo') OR (rol = 'Admin');" },
            { name: "IN", desc: "Verifica si un valor coincide con cualquier valor dentro de una lista específica.", example: "WHERE pais IN ('México', 'España', 'Colombia');" },
            { name: "BETWEEN", desc: "Verifica si un valor está dentro de un rango (inclusivo).", example: "WHERE fecha BETWEEN '2023-01-01' AND '2023-12-31';" },
            { name: "LIKE", desc: "Busca un patrón en un texto usando el comodín % (reemplaza cualquier cantidad de caracteres).", example: "WHERE correo LIKE '%@gmail.com';" },
            { name: "IS NULL", desc: "Verifica si una columna está completamente vacía (ausencia de valor). NO es lo mismo que igual a cero o cadena vacía.", example: "WHERE telefono IS NULL;" }
        ]
    },
    {
        category: "Cruce de Tablas (Joins)",
        items: [
            { name: "INNER JOIN", desc: "Une dos tablas devolviendo SOLO los registros que tienen coincidencia en ambas partes.", example: "SELECT * FROM a INNER JOIN b ON a.id = b.id;" },
            { name: "LEFT JOIN", desc: "Devuelve todos los registros de la tabla izquierda, y los coincidentes de la derecha. Si no hay coincidencia, rellena con NULL.", example: "SELECT a.nombre, b.venta FROM clientes a LEFT JOIN compras b ON a.id = b.id_cliente;" },
            { name: "UNION", desc: "Combina los resultados de dos consultas `SELECT` distintas en una sola columna. Por defecto elimina filas duplicadas. Para mantener duplicados usa `UNION ALL`.", example: "SELECT email FROM usuarios UNION SELECT email FROM admins;" }
        ]
    },
    {
        category: "Matemáticas y Agregación",
        items: [
            { name: "COUNT()", desc: "Cuenta el número de filas o valores no nulos en una columna.", example: "SELECT COUNT(id) FROM clientes;" },
            { name: "SUM()", desc: "Calcula la suma total de una columna numérica.", example: "SELECT SUM(salario) FROM empleados;" },
            { name: "AVG()", desc: "Calcula el promedio aritmético de una columna numérica.", example: "SELECT AVG(calificacion) FROM alumnos;" },
            { name: "MIN() / MAX()", desc: "Devuelven el valor más pequeño o más grande de una columna.", example: "SELECT MIN(precio), MAX(precio) FROM catalogo;" },
            { name: "ROUND()", desc: "Redondea un número a una cantidad especificada de decimales.", example: "SELECT ROUND(precio * 1.16, 2) FROM productos;" }
        ]
    },
    {
        category: "Textos y Otros",
        items: [
            { name: "|| (Concatenar)", desc: "En SQLite, este operador une dos columnas o textos en un solo string.", example: "SELECT nombre || ' ' || apellido AS nombre_completo FROM usuarios;" },
            { name: "UPPER() / LOWER()", desc: "Convierte todo un texto a MAYÚSCULAS o minúsculas respectivamente.", example: "SELECT UPPER(codigo_postal) FROM direcciones;" },
            { name: "COALESCE()", desc: "Evalúa los argumentos en orden y devuelve el primero que no sea NULL.", example: "SELECT COALESCE(telefono_celular, telefono_casa, 'Sin Número') FROM contactos;" },
            { name: "CASE WHEN", desc: "Estructura algorítmica para evaluar condiciones y devolver un resultado. Es el equivalente a 'if/else'.", example: "CASE WHEN nota >= 6 THEN 'Pasa' ELSE 'Falla' END" },
            { name: "DATE()", desc: "Extrae o da formato de fecha a un string. `DATE('now')` devuelve la fecha actual del sistema.", example: "SELECT DATE('now');" }
        ]
    }
];
