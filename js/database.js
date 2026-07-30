class DatabaseEngine {
    constructor() {
        this.SQL = null;
        this.db = null;
        this.isReady = false;
    }

    async init() {
        try {
            // Inicializar sql.js importado vía CDN
            // sql.js espera encontrar el archivo .wasm en una URL específica
            const sqlPromise = initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
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
            
            return { success: true, results: res[0] };
        } catch (err) {
            return { error: err.message };
        }
    }
}

window.DBEngine = new DatabaseEngine();
