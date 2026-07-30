const AudioFX = {
    muted: false,
    ctx: null,
    
    init() {
        if (this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch(e) {
            console.warn("AudioContext no soportado");
        }
    },
    
    playTone(freq, type, duration, vol = 0.1) {
        if (this.muted || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    
    keyPress() { this.playTone(800, 'square', 0.05, 0.02); },
    success() { 
        this.playTone(440, 'sine', 0.1, 0.1); 
        setTimeout(() => this.playTone(660, 'sine', 0.2, 0.15), 100);
    },
    error() { 
        this.playTone(200, 'sawtooth', 0.2, 0.1); 
        setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.1), 150);
    }
};

class App {
    constructor() {
        this.levels = window.AppLevels || [];
        this.currentLevelIndex = parseInt(localStorage.getItem('sql_sim_level')) || 0;
        
        // Cargar Tema
        const savedTheme = localStorage.getItem('sql_sim_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    async init() {
        window.SqlEditor.init();
        window.SqlEditor.onChange((code) => {
            AudioFX.init();
            AudioFX.keyPress();
            localStorage.setItem(`sql_sim_code_${this.currentLevelIndex}`, code);
        });
        
        try {
            await window.DBEngine.init();
            this.setupDBSelector();
            this.loadLevel(this.currentLevelIndex);
        } catch (e) {
            console.error("Error crítico: No se pudo inicializar el motor SQL.");
        }

        this.bindEvents();
        this.setupResizer();
        this.renderDocs();
        this.setupDraggableWindow();
    }

    setupDBSelector() {
        const selector = document.getElementById("db-selector");
        if (!selector) return;

        selector.innerHTML = "";
        this.levels.forEach((level, index) => {
            const option = document.createElement("option");
            option.value = index;
            // Usamos db_name si existe, o un genérico
            option.textContent = level.db_name || `Nivel ${index + 1}`;
            selector.appendChild(option);
        });

        selector.addEventListener("change", (e) => {
            const selectedIndex = parseInt(e.target.value);
            this.loadLevel(selectedIndex);
        });
    }

    bindEvents() {
        document.getElementById("btn-run")?.addEventListener("click", () => {
            AudioFX.init();
            this.runQuery();
        });

        // Tema (Light/Dark)
        const themeBtn = document.getElementById("btn-theme-toggle");
        if (themeBtn) {
            // Actualizar icono al inicio
            const current = document.documentElement.getAttribute('data-theme');
            themeBtn.innerHTML = current === 'light' ? '<i class="ph ph-moon"></i>' : '<i class="ph ph-sun"></i>';
            
            themeBtn.addEventListener("click", () => {
                let curr = document.documentElement.getAttribute('data-theme');
                let next = curr === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('sql_sim_theme', next);
                
                themeBtn.innerHTML = next === 'light' ? '<i class="ph ph-moon"></i>' : '<i class="ph ph-sun"></i>';
                
                if (window.SqlEditor && window.SqlEditor.editor) {
                    window.SqlEditor.editor.setOption('theme', next === 'light' ? 'default' : 'monokai');
                }
            });
        }

        // Toggles para Paneles Laterales
        document.getElementById("menu-view-left")?.addEventListener("click", () => {
            const left = document.getElementById("layout-left");
            left.style.display = (left.style.display === "none") ? "flex" : "none";
        });
        document.getElementById("menu-view-right")?.addEventListener("click", () => {
            const right = document.getElementById("layout-right");
            right.style.display = (right.style.display === "none") ? "flex" : "none";
        });

        // Hint y Solution
        document.getElementById("btn-hint")?.addEventListener("click", () => {
            this.showModal("Pista (Hint)", "Revisa la sección 'Learning Resources' y la estructura esperada en la tabla inferior.", null, false);
        });
        document.getElementById("btn-solution")?.addEventListener("click", () => {
            const level = this.levels[this.currentLevelIndex];
            if (level && level.expected_query) {
                window.SqlEditor.setValue(level.expected_query);
            }
        });

        // Botones Huérfanos de la Interfaz
        document.getElementById("btn-settings")?.addEventListener("click", () => {
            this.showModal(
                "Ajustes del Sistema", 
                "¿Deseas formatear la base de datos local y reiniciar tu progreso al Nivel 1?", 
                () => {
                    localStorage.removeItem('sql_sim_level');
                    location.reload();
                }, 
                true
            );
        });
        document.getElementById("btn-contact")?.addEventListener("click", () => {
            this.showModal("Acerca de", "SQL Practice Simulator v1.0\n\nDesarrollado para entrenamiento corporativo y dominio avanzado de bases de datos relacionales.", null, false);
        });
    }

    showModal(title, msg, onConfirm, showCancel = true) {
        const overlay = document.getElementById("retro-modal-overlay");
        if (!overlay) return;

        document.getElementById("retro-modal-title").textContent = title;
        document.getElementById("retro-modal-msg").innerText = msg; // innerText respeta saltos de línea \n

        const btnOk = document.getElementById("retro-modal-ok");
        const btnCancel = document.getElementById("retro-modal-cancel");
        const btnX = document.getElementById("retro-modal-x");

        btnCancel.style.display = showCancel ? "flex" : "none";

        // Limpiar eventos previos clonando los botones (truco rápido para evitar fugas de eventos)
        const newOk = btnOk.cloneNode(true);
        const newCancel = btnCancel.cloneNode(true);
        const newX = btnX.cloneNode(true);
        btnOk.parentNode.replaceChild(newOk, btnOk);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);
        btnX.parentNode.replaceChild(newX, btnX);

        const closeModal = () => overlay.classList.add("hidden");

        newOk.addEventListener("click", () => {
            closeModal();
            if (onConfirm) onConfirm();
        });

        newCancel.addEventListener("click", closeModal);
        newX.addEventListener("click", closeModal);

        overlay.classList.remove("hidden");
    }

    setupResizer() {
        const resizer = document.getElementById("vertical-resizer");
        const resultsPanel = document.getElementById("results-panel");
        
        if (!resizer || !resultsPanel) return;

        let isResizing = false;
        let initialY = 0;
        let initialResultsHeight = 0;

        resizer.addEventListener("mousedown", (e) => {
            isResizing = true;
            initialY = e.clientY;
            initialResultsHeight = resultsPanel.offsetHeight;
            document.body.style.cursor = "row-resize";
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isResizing) return;
            const dy = e.clientY - initialY;
            const newHeight = initialResultsHeight - dy;
            
            if (newHeight > 100 && newHeight < window.innerHeight - 150) {
                resultsPanel.style.height = `${newHeight}px`;
            }
        });

        document.addEventListener("mouseup", () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = "default";
                document.body.style.userSelect = "";
                if (window.SqlEditor && window.SqlEditor.editor) {
                    window.SqlEditor.editor.refresh();
                }
            }
        });
    }

    renderDocs() {
        const docsList = document.getElementById("docs-list");
        if (!docsList || !window.SqlDocs) return;

        docsList.innerHTML = "";

        window.SqlDocs.forEach(category => {
            // Header de categoría
            const catHeader = document.createElement("li");
            catHeader.style.padding = "4px 8px";
            catHeader.style.fontWeight = "bold";
            catHeader.style.backgroundColor = "#e0e0e0";
            catHeader.style.color = "#000";
            catHeader.style.fontSize = "12px";
            catHeader.textContent = category.category;
            docsList.appendChild(catHeader);

            // Elementos
            category.items.forEach(item => {
                const li = document.createElement("li");
                li.className = "schema-column"; // Reutilizamos clase de estilo retro
                li.innerHTML = `<i class="ph-fill ph-book-open"></i> ${item.name}`;
                li.addEventListener("click", () => this.showDocWindow(item));
                docsList.appendChild(li);
            });
        });

        document.getElementById("docs-close")?.addEventListener("click", () => {
            document.getElementById("docs-window").classList.add("hidden");
        });
    }

    showDocWindow(item) {
        const win = document.getElementById("docs-window");
        document.getElementById("docs-item-name").textContent = item.name;
        document.getElementById("docs-item-desc").textContent = item.desc;
        document.getElementById("docs-item-example").textContent = item.example;
        win.classList.remove("hidden");
    }

    setupDraggableWindow() {
        const win = document.getElementById("docs-window");
        const header = document.getElementById("docs-window-header");
        if (!win || !header) return;

        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener("mousedown", (e) => {
            isDragging = true;
            offsetX = e.clientX - win.getBoundingClientRect().left;
            offsetY = e.clientY - win.getBoundingClientRect().top;
            document.body.style.userSelect = "none";
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            win.style.left = (e.clientX - offsetX) + "px";
            win.style.top = (e.clientY - offsetY) + "px";
            win.style.right = "auto"; // Override CSS right: 50px
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });
    }

    loadLevel(index) {
        if (index < 0 || index >= this.levels.length) return;
        
        const level = this.levels[index];
        this.currentLevelIndex = index;

        // Info en Right Sidebar
        document.getElementById("mission-briefing").textContent = level.briefing_mision;
        
        window.DBEngine.loadLevelDB(level.init_db_sql);
        localStorage.setItem('sql_sim_level', index);

        // Sincronizar el selector de DB
        const selector = document.getElementById("db-selector");
        if (selector) {
            selector.value = index;
        }

        this.renderSchema(level);
        this.renderResources(level);
        this.renderExpectedOutput(level);

        this.resetLevel(true);
    }

    renderSchema(level) {
        const schemaList = document.getElementById("schema-list");
        const tableInfo = document.getElementById("table-info-content");
        
        schemaList.innerHTML = "";
        tableInfo.innerHTML = "";
        
        if (!level.schema) return;

        // Configuración para el Autocompletado de CodeMirror
        let cmTables = {};

        level.schema.forEach(tbl => {
            // Recopilar columnas puras para el autocompletado
            const pureCols = tbl.columns.map(c => c.split(" ")[0]);
            cmTables[tbl.table] = pureCols;

            // Schema Left
            const li = document.createElement("li");
            li.className = "schema-table-name";
            li.innerHTML = `<i class="ph-fill ph-table"></i> ${tbl.table}`;
            li.addEventListener("click", () => {
                const cm = window.SqlEditor.editor;
                if (cm) cm.replaceSelection(tbl.table);
            });
            schemaList.appendChild(li);

            // Table Info Right
            const tInfo = document.createElement("div");
            tInfo.style.marginBottom = "8px";
            tInfo.innerHTML = `<i class="ph-fill ph-table"></i> ${tbl.table}`;
            tableInfo.appendChild(tInfo);

            tbl.columns.forEach(col => {
                const colLi = document.createElement("li");
                colLi.className = "schema-column";
                colLi.innerHTML = col; 
                colLi.addEventListener("click", () => {
                    const cm = window.SqlEditor.editor;
                    const colName = col.split(" ")[0];
                    if (cm) cm.replaceSelection(colName + ", ");
                });
                schemaList.appendChild(colLi);
            });
        });

        // Inyectar en CodeMirror
        if (window.SqlEditor && window.SqlEditor.editor) {
            window.SqlEditor.editor.setOption("hintOptions", {
                tables: cmTables
            });
        }
    }

    renderResources(level) {
        const resList = document.getElementById("resources-list");
        resList.innerHTML = "";

        if (!level.learning_resources) return;

        level.learning_resources.forEach(res => {
            const li = document.createElement("li");
            li.style.marginBottom = "10px";
            li.innerHTML = `<div style="font-size:13px;font-weight:500;color:#fff;">${res.title}</div><div style="font-size:12px;color:#888;">${res.desc}</div>`;
            resList.appendChild(li);
        });
    }

    renderExpectedOutput(level) {
        const expTable = document.getElementById("expected-table");
        expTable.innerHTML = "";

        if (!level.solution_data || level.solution_data.length === 0) return;

        // Muestra max 3 filas para no saturar
        const rowsToShow = level.solution_data.slice(0, 3);
        
        rowsToShow.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(val => {
                const td = document.createElement("td");
                td.textContent = val;
                td.style.padding = "4px 8px";
                tr.appendChild(td);
            });
            expTable.appendChild(tr);
        });
        
        if (level.solution_data.length > 3) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = level.solution_data[0].length;
            td.textContent = "...";
            td.style.textAlign = "center";
            tr.appendChild(td);
            expTable.appendChild(tr);
        }
    }

    resetLevel(isLoad = false) {
        const level = this.levels[this.currentLevelIndex];
        
        if (isLoad) {
            const savedCode = localStorage.getItem(`sql_sim_code_${this.currentLevelIndex}`);
            if (savedCode) {
                window.SqlEditor.setValue(savedCode);
            } else {
                this._setInitialLevelCode(level);
            }
        } else {
            this._setInitialLevelCode(level);
        }

        this.clearResults();
    }

    _setInitialLevelCode(level) {
        const editorPanel = document.getElementById("editor-container");
        const auditPanel = document.getElementById("audit-container");
        const dndPanel = document.getElementById("dnd-container");
        const btnRun = document.getElementById("btn-run");

        editorPanel.style.display = "none";
        auditPanel.style.display = "none";
        dndPanel.style.display = "none";
        if(btnRun) btnRun.style.display = "flex";

        if (level.modalidad === "Auditoría") {
            auditPanel.style.display = "block";
            if(btnRun) btnRun.style.display = "none";
            this.buildAuditTokens(level);
        } else if (level.modalidad === "Ensamblaje") {
            dndPanel.style.display = "block";
            this.buildDndBlocks(level);
        } else if (level.modalidad === "Depuración") {
            editorPanel.style.display = "block";
            window.SqlEditor.setValue(level.query_defectuoso || "-- Falta query_defectuoso en config");
        } else {
            editorPanel.style.display = "block";
            window.SqlEditor.setValue("");
        }
        
        localStorage.removeItem(`sql_sim_code_${this.currentLevelIndex}`);
    }

    buildAuditTokens(level) {
        const container = document.getElementById("audit-code-area");
        container.innerHTML = "";
        if (!level.audit_tokens) return;
        
        level.audit_tokens.forEach((tokenText, index) => {
            const span = document.createElement("span");
            span.textContent = tokenText;
            span.className = "audit-token";
            
            span.addEventListener("click", () => {
                AudioFX.init();
                if (index === level.token_error_index) {
                    AudioFX.success();
                    span.classList.add("error-found");
                    setTimeout(() => {
                        this.showModal("Error Encontrado", `${level.explicacion}\n\n¿Avanzar al siguiente nivel?`, () => {
                            this.loadLevel(this.currentLevelIndex + 1);
                        });
                    }, 500);
                } else {
                    AudioFX.error();
                    span.classList.remove("wrong-click");
                    void span.offsetWidth; 
                    span.classList.add("wrong-click");
                }
            });
            container.appendChild(span);
        });
    }

    buildDndBlocks(level) {
        const source = document.getElementById("dnd-blocks-source");
        const target = document.getElementById("dnd-blocks-target");
        
        source.innerHTML = "";
        target.innerHTML = "";
        if (!level.dnd_blocks) return;
        
        const setupDropZone = (zone) => {
            zone.ondragover = (e) => e.preventDefault();
            zone.ondrop = (e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData("text/plain");
                const block = document.getElementById(data);
                if (block) zone.appendChild(block);
            };
        };
        
        setupDropZone(source);
        setupDropZone(target);
        
        level.dnd_blocks.forEach((text, i) => {
            const block = document.createElement("div");
            block.className = "dnd-block";
            block.textContent = text;
            block.id = `dnd-block-${i}`;
            block.draggable = true;
            
            block.ondragstart = (e) => {
                AudioFX.init();
                AudioFX.keyPress();
                e.dataTransfer.setData("text/plain", block.id);
            };
            
            source.appendChild(block);
        });
    }

    runQuery() {
        const level = this.levels[this.currentLevelIndex];
        if (level.modalidad === "Auditoría") return;

        let query = "";
        if (level.modalidad === "Ensamblaje") {
            const target = document.getElementById("dnd-blocks-target");
            const blocks = Array.from(target.children);
            query = blocks.map(b => b.textContent).join(" ");
            if (query.trim() === "") return;
        } else {
            query = window.SqlEditor.getValue();
            if (!query || query.trim() === "") return;
        }

        const result = window.DBEngine.executeQuery(query);
        
        if (result.error) {
            this.showError(result.error);
        } else {
            this.renderResults(result.results);
            this.validateSolution(result.results);
        }
    }

    validateSolution(resultsData) {
        const level = this.levels[this.currentLevelIndex];
        if (!resultsData || !resultsData.values) return;

        const userVals = resultsData.values;
        const expectedVals = level.solution_data;

        if (JSON.stringify(userVals) === JSON.stringify(expectedVals)) {
            AudioFX.success();
            setTimeout(() => {
                localStorage.removeItem(`sql_sim_code_${this.currentLevelIndex}`);
                this.showModal("¡Excelente Trabajo!", "¡Has resuelto el nivel correctamente!\n\n¿Avanzar al siguiente escenario?", () => {
                    this.loadLevel(this.currentLevelIndex + 1);
                });
            }, 500);
        } else {
            AudioFX.error();
        }
    }

    renderResults(data) {
        const table = document.getElementById("results-table");
        const wrapper = document.getElementById("results-content");
        const placeholder = document.getElementById("results-placeholder");
        
        table.innerHTML = "";
        placeholder.style.display = "none";
        wrapper.style.display = "block";

        if (!data) return;

        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        data.columns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        data.values.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(val => {
                const td = document.createElement("td");
                td.textContent = val;
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

    clearResults() {
        document.getElementById("results-table").innerHTML = "";
        document.getElementById("results-content").style.display = "none";
        document.getElementById("results-placeholder").style.display = "flex";
    }

    showError(msg) {
        AudioFX.error();
        const table = document.getElementById("results-table");
        const wrapper = document.getElementById("results-content");
        const placeholder = document.getElementById("results-placeholder");
        
        placeholder.style.display = "none";
        wrapper.style.display = "block";
        table.innerHTML = `<tr><td style="color: #e57373; font-family: monospace;">${msg}</td></tr>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.AppController = new App();
    window.AppController.init();
});
