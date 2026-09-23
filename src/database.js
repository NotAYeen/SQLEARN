export class DatabaseEngine {
    constructor() {
        this.SQL = null;
        this.db = null;
        this.isReady = false;
    }

    async init() {
        try {
            // Inicializar sql.js importado vía CDN
            // sql.js espera encontrar el archivo .wasm en una URL específica
            const sqlPromise = window.initSqlJs({
                locateFile: file => `https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/${file}`
            });
            
            this.SQL = await sqlPromise;
            this.isReady = true;
            console.log("Motor SQLite (sql.js) cargado correctamente.");
        } catch (err) {
            console.error("Error al cargar sql.js: ", err);
            throw err;
        }
    }

    loadLevelDB(initSql) {
        if (!this.isReady) return false;
        
        // Crear una nueva DB en memoria
        if (this.db) {
            this.db.close();
        }
        this.db = new this.SQL.Database();
        
        try {
            // Ejecutar el script SQL de inicialización del nivel
            this.db.run(initSql);
            return true;
        } catch (err) {
            console.error("Error al inicializar BD del nivel: ", err);
            return false;
        }
    }

    executeQuery(query) {
        if (!this.db) return { error: "Base de datos no inicializada." };

        try {
            // db.exec devuelve un array de resultados para cada statement ejecutado
            // Ej: [{columns:['a','b'], values:[[1,2],[3,4]]}]
            const res = this.db.exec(query);

            if (res.length === 0) {
                // Sentencia válida pero no retorna data (ej. UPDATE, INSERT)
                return { success: true, results: null };
            }

            // En consultas con varias sentencias (ej. nivel DND con INSERT + SELECT),
            // nos quedamos con el último result set que tenga columnas reales.
            const withData = res.filter(r => r && r.columns && r.columns.length > 0);
            if (withData.length === 0) {
                return { success: true, results: null };
            }

            return { success: true, results: withData[withData.length - 1] };
        } catch (err) {
            return { error: err.message };
        }
    }
}
