import { Storage } from './storage.js';
import { SQLEditor } from './editor.js';
import { DatabaseEngine } from './database.js';
import { LevelLoader } from './LevelLoader.js';
import { WindowManager } from './WindowManager.js';
import { DndManager } from './DndManager.js';
import { AchievementsManager } from './Achievements.js';
import { SqlDocs } from './docs.js';
import { AudioFX } from './AudioFX.js';

export class App {
    constructor() {
        this.loader = new LevelLoader();
        this.db = new DatabaseEngine();
        this.editor = new SQLEditor("sql-editor");
        this.winManager = new WindowManager();
        this.dndManager = new DndManager(this);
        this.achievements = new AchievementsManager();
        
        this.currentLevelIndex = parseInt(Storage.getItem()) || 0;
        
        // Cargar Tema
        const savedTheme = Storage.getItem() || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    async init() {
        this.editor.init();
        this.editor.onChange((code) => {
            AudioFX.init();
            AudioFX.keyPress();
            Storage.setItem(`sql_sim_code_${this.currentLevelIndex}`, code);
        });
        
        try {
            await this.loader.fetchAllLevels();
            await this.db.init();
            this.setupDBSelector();
            this.loadLevel(this.currentLevelIndex);
        } catch (e) {
            console.error("Error crítico en la inicialización:", e);
        }

        this.bindEvents();
        this.setupResizer();
        this.renderDocs();
    }

    setupDBSelector() {
        const selector = document.getElementById("db-selector");
        if (!selector) return;

        selector.innerHTML = "";
        this.loader.levels.forEach((level, index) => {
            const option = document.createElement("option");
            option.value = index;
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

        document.getElementById("btn-theme-toggle")?.addEventListener("click", () => {
            const html = document.documentElement;
            const current = html.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            Storage.setItem('sql_sim_theme', newTheme);
        });

        document.getElementById("menu-view-left")?.addEventListener("click", () => {
            document.getElementById("layout-left").classList.toggle("hidden-panel");
        });
        document.getElementById("menu-view-right")?.addEventListener("click", () => {
            document.getElementById("layout-right").classList.toggle("hidden-panel");
        });

        document.getElementById("btn-hint")?.addEventListener("click", () => {
            this.showModal("Pista (Hint)", "Revisa la sección 'Learning Resources' y la estructura esperada en la tabla inferior.", null, false);
        });
        document.getElementById("btn-solution")?.addEventListener("click", () => {
            const level = this.loader.getLevel(this.currentLevelIndex);
            if (level && level.expected_query) {
                this.editor.setValue(level.expected_query);
            }
        });

        document.getElementById("btn-settings")?.addEventListener("click", () => {
            this.showModal(
                "Ajustes del Sistema", 
                "¿Deseas formatear la base de datos local y reiniciar tu progreso al Nivel 1?", 
                () => {
                    Storage.removeItem();
                    Storage.removeItem();
                    location.reload();
                }, 
                true
            );
        });
        document.getElementById("btn-contact")?.addEventListener("click", () => {
            this.showModal("Acerca de", "SQL Practice Simulator v2.0\n\nDesarrollado para entrenamiento corporativo y dominio avanzado de bases de datos relacionales.", null, false);
        });
    }

    showModal(title, msg, onConfirm, showCancel = true) {
        const overlay = document.getElementById("retro-modal-overlay");
        if (!overlay) return;

        document.getElementById("retro-modal-title").textContent = title;
        document.getElementById("retro-modal-msg").innerText = msg;

        const btnOk = document.getElementById("btn-modal-ok");
        const btnCancel = document.getElementById("btn-modal-cancel");

        btnCancel.style.display = showCancel ? "inline-flex" : "none";

        const cleanup = () => {
            overlay.classList.add("hidden");
            btnOk.replaceWith(btnOk.cloneNode(true));
            btnCancel.replaceWith(btnCancel.cloneNode(true));
        };

        btnOk.onclick = () => {
            if (onConfirm) onConfirm();
            cleanup();
        };
        btnCancel.onclick = () => cleanup();

        overlay.classList.remove("hidden");
    }

    setupResizer() {
        const resizer = document.getElementById('resizer');
        const leftPanel = document.getElementById('editor-container');
        let isResizing = false;

        resizer?.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const containerOffset = leftPanel.parentElement.getBoundingClientRect().left;
            const newWidth = e.clientX - containerOffset;
            if (newWidth > 200 && newWidth < window.innerWidth - 300) {
                leftPanel.style.flex = `0 0 ${newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = 'default';
        });
    }

    renderDocs() {
        const docsList = document.getElementById("docs-list");
        if (!docsList) return;

        docsList.innerHTML = "";

        SqlDocs.forEach(category => {
            const catHeader = document.createElement("li");
            catHeader.style.padding = "4px 8px";
            catHeader.style.fontWeight = "bold";
            catHeader.style.backgroundColor = "#e0e0e0";
            catHeader.style.color = "#000";
            catHeader.style.fontSize = "12px";
            catHeader.textContent = category.category;
            docsList.appendChild(catHeader);

            category.items.forEach(item => {
                const li = document.createElement("li");
                li.className = "schema-column";
                li.innerHTML = `<i class="ph-fill ph-book-open"></i> ${item.name}`;
                li.addEventListener("click", () => this.winManager.showDoc(item));
                docsList.appendChild(li);
            });
        });
    }

    loadLevel(index) {
        const level = this.loader.getLevel(index);
        if (!level) return;

        this.currentLevelIndex = index;
        Storage.setItem('sql_sim_level', index);
        
        const selector = document.getElementById("db-selector");
        if (selector) selector.value = index;

        this.db.loadLevelDB(level.init_db_sql);

        this.renderSchema(level.schema);
        this.renderResources(level.learning_resources);

        const briefing = document.getElementById("mission-briefing");
        if (briefing) {
            briefing.innerHTML = `
                <h2 style="margin-bottom:8px;">Misión ${index + 1}: ${level.db_name || ''}</h2>
                <p style="font-size:14px; line-height:1.5;">${level.descripcion}</p>
                <p style="font-size:13px; color:#666; margin-top:8px;"><strong>Objetivo:</strong> ${level.objetivo}</p>
            `;
        }

        document.getElementById("editor-container").style.display = "none";
        document.getElementById("audit-container").style.display = "none";
        document.getElementById("dnd-container").style.display = "none";
        document.getElementById("btn-run").style.display = "none";

        if (level.modalidad === "Audit" || level.modalidad === "Auditoría") {
            document.getElementById("audit-container").style.display = "flex";
            this.setupAuditMode(level);
        } else if (level.modalidad === "DND" || level.modalidad === "Ensamblaje") {
            document.getElementById("dnd-container").style.display = "flex";
            document.getElementById("btn-run").style.display = "inline-flex";
            this.dndManager.init(level.dnd_blocks);
        } else {
            document.getElementById("editor-container").style.display = "block";
            document.getElementById("btn-run").style.display = "inline-flex";
            const savedCode = Storage.getItem();
            if (savedCode) {
                this.editor.setValue(savedCode);
            } else {
                this.editor.setValue("");
            }
            this.editor.updateHints(level.schema);
        }

        this.clearResults();
        this.showExpectedOutput(level.solution_data);
    }

    renderSchema(schema) {
        const list = document.getElementById("schema-list");
        list.innerHTML = "";
        schema.forEach(tbl => {
            const li = document.createElement("li");
            li.innerHTML = `<div class="schema-table-name"><i class="ph-fill ph-table"></i> ${tbl.table}</div>`;
            
            const colList = document.createElement("ul");
            colList.className = "schema-list";
            colList.style.border = "none";
            
            tbl.columns.forEach(col => {
                const cli = document.createElement("li");
                cli.className = "schema-column";
                cli.innerHTML = `<i class="ph-fill ph-columns"></i> ${col}`;
                colList.appendChild(cli);
            });
            
            li.appendChild(colList);
            list.appendChild(li);
        });
    }

    renderResources(resources) {
        const list = document.getElementById("resources-list");
        list.innerHTML = "";
        if (!resources) return;
        resources.forEach(res => {
            const li = document.createElement("li");
            li.className = "schema-column";
            li.style.flexDirection = "column";
            li.style.alignItems = "flex-start";
            li.innerHTML = `
                <div style="font-weight:bold; margin-bottom:4px;"><i class="ph-fill ph-lightbulb"></i> ${res.title}</div>
                <div style="font-size: 11px; line-height: 1.3;">${res.desc}</div>
            `;
            list.appendChild(li);
        });
    }

    setupAuditMode(level) {
        const area = document.getElementById("audit-code-area");
        area.innerHTML = "";
        level.audit_tokens.forEach((token, idx) => {
            const span = document.createElement("span");
            span.className = "audit-token";
            span.textContent = token;
            span.onclick = () => this.checkAudit(level, idx);
            area.appendChild(span);
        });
    }

    checkAudit(level, selectedIndex) {
        if (selectedIndex === level.token_error_index) {
            AudioFX.success();
            this.achievements.unlock('detective'); // Unlock Achievement!
            this.showModal("¡Auditoría Exitosa!", "¡Buen trabajo! Encontraste el error.\n\n" + level.explicacion, () => {
                this.loadLevel(this.currentLevelIndex + 1);
            });
        } else {
            AudioFX.error();
            this.showModal("Error", "Ese no es el problema. Revisa bien la sintaxis o las lógicas.", null, false);
        }
    }

    runQuery() {
        const sql = this.editor.getValue();
        if (!sql.trim()) return;

        const res = this.db.executeQuery(sql);

        if (res.error) {
            AudioFX.error();
            this.renderResults({ columns: ["Error SQL"], values: [[res.error]] });
            return;
        }

        if (!res.results) {
            this.renderResults({ columns: ["Resultado"], values: [["Comando ejecutado con éxito sin filas devueltas"]] });
            this.checkAnswer([]);
            return;
        }

        // Siempre renderizar los resultados primero para que el usuario pueda verlos
        this.renderResults(res.results);

        // Comprobar si los resultados coinciden con la misión actual
        this.checkAnswer(res.results.values);
    }

    renderResults(res) {
        const table = document.getElementById("results-table");
        table.innerHTML = "";

        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        res.columns.forEach(col => {
            const th = document.createElement("th");
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        res.values.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(val => {
                const td = document.createElement("td");
                td.textContent = val !== null ? val : 'NULL';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

    showExpectedOutput(expectedData) {
        const table = document.getElementById("expected-table");
        if (!table) return;
        table.innerHTML = "";

        const tbody = document.createElement("tbody");
        expectedData.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(val => {
                const td = document.createElement("td");
                td.textContent = val !== null ? val : 'NULL';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

    clearResults() {
        document.getElementById("results-table").innerHTML = "";
    }

    checkAnswer(actualData) {
        const level = this.loader.getLevel(this.currentLevelIndex);
        if (!level || !level.solution_data) return;

        // Comprobación simple (serializada)
        const isCorrect = JSON.stringify(actualData) === JSON.stringify(level.solution_data);

        if (isCorrect) {
            AudioFX.success();
            
            // Achievements checks
            if (this.currentLevelIndex === 0) this.achievements.unlock('first_blood');
            if (level.modalidad === "DND" || level.modalidad === "Ensamblaje") this.achievements.unlock('puzzle_master');
            if (this.currentLevelIndex === 12) this.achievements.unlock('half_way');
            if (this.currentLevelIndex === 24) this.achievements.unlock('nsa_hacker'); // Nivel 25 (index 24)

            this.showModal(
                "¡Misión Completada!", 
                "Has resuelto la consulta exitosamente.\n¿Quieres pasar al siguiente nivel?", 
                () => {
                    if (this.currentLevelIndex < this.loader.levels.length - 1) {
                        this.loadLevel(this.currentLevelIndex + 1);
                    } else {
                        this.showModal("¡Felicidades!", "Has completado todos los niveles del simulador.", null, false);
                    }
                }, 
                true
            );
        } else {
            AudioFX.error();
        }
    }
}
