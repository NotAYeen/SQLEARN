import { SQLEditor } from './editor.js';
import { DatabaseEngine } from './database.js';
import { LevelLoader } from './LevelLoader.js';
import { WindowManager } from './WindowManager.js';
import { DndManager } from './DndManager.js';
import { AchievementsManager } from './Achievements.js';
import { SqlDocs } from './docs.js';
import { AudioFX } from './AudioFX.js';
import { Storage } from './storage.js';

export class App {
    constructor() {
        this.loader = new LevelLoader();
        this.db = new DatabaseEngine();
        this.editor = new SQLEditor("sql-editor");
        this.winManager = new WindowManager();
        this.dndManager = new DndManager(this);
        this.achievements = new AchievementsManager();
        
        this.currentLevelIndex = parseInt(Storage.getItem('sql_sim_level')) || 0;
        
        // Cargar Tema
        const savedTheme = Storage.getItem('sql_sim_theme') || 'dark';
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
        this.setupMobileTabs();
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

        document.getElementById("btn-hint")?.addEventListener("click", () => {
            // Unhide hints list silently without modal window
            const list = document.getElementById("resources-list");
            const btn = document.getElementById("toggle-hints-btn");
            if (list) {
                list.style.display = "block";
                if (btn) btn.textContent = "Ocultar";
            }
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
                    Storage.removeItem('sql_sim_level');
                    Storage.removeItem('sql_sim_achievements');
                    location.reload();
                }, 
                true
            );
        });

        document.getElementById("btn-contact")?.addEventListener("click", () => {
            this.showModal("Acerca de", "SQL Practice Simulator v2.0\n\nDesarrollado para aprendizaje interactivo y dominio de bases de datos relacionales.", null, false);
        });

        // Toggle Pistas del Nivel
        document.getElementById("toggle-hints-btn")?.addEventListener("click", (e) => {
            const list = document.getElementById("resources-list");
            if (!list) return;
            const isHidden = list.style.display === "none" || !list.style.display;
            list.style.display = isHidden ? "block" : "none";
            e.target.textContent = isHidden ? "Ocultar" : "Mostrar";
        });
    }

    setupMobileTabs() {
        const btnEditor = document.getElementById("tab-btn-editor");
        const btnSchema = document.getElementById("tab-btn-schema");
        const btnMission = document.getElementById("tab-btn-mission");

        const leftPanel = document.getElementById("layout-left");
        const midPanel = document.getElementById("layout-mid");
        const rightPanel = document.getElementById("layout-right");

        if (!btnEditor || !btnSchema || !btnMission) return;

        const switchTab = (activeBtn, showPanel) => {
            [btnEditor, btnSchema, btnMission].forEach(b => b.classList.remove("active"));
            activeBtn.classList.add("active");

            [leftPanel, midPanel, rightPanel].forEach(p => {
                p.classList.remove("mobile-show-panel");
                p.classList.add("mobile-hide-panel");
            });

            showPanel.classList.remove("mobile-hide-panel");
            showPanel.classList.add("mobile-show-panel");
        };

        btnEditor.addEventListener("click", () => switchTab(btnEditor, midPanel));
        btnSchema.addEventListener("click", () => switchTab(btnSchema, leftPanel));
        btnMission.addEventListener("click", () => switchTab(btnMission, rightPanel));
    }

    showModal(title, msg, onConfirm, showCancel = true) {
        const overlay = document.getElementById("retro-modal-overlay");
        if (!overlay) return;

        document.getElementById("retro-modal-title").textContent = title;
        document.getElementById("retro-modal-msg").innerText = msg;

        const btnOk = document.getElementById("retro-modal-ok");
        const btnCancel = document.getElementById("retro-modal-cancel");
        const btnX = document.getElementById("retro-modal-x");

        if (btnCancel) btnCancel.style.display = showCancel ? "inline-flex" : "none";

        const cleanup = () => {
            overlay.classList.add("hidden");
        };

        if (btnOk) btnOk.onclick = () => {
            if (onConfirm) onConfirm();
            cleanup();
        };
        if (btnCancel) btnCancel.onclick = () => cleanup();
        if (btnX) btnX.onclick = () => cleanup();

        // Close on Escape key
        const escHandler = (e) => {
            if (e.key === "Escape") {
                cleanup();
                document.removeEventListener("keydown", escHandler);
            }
        };
        document.addEventListener("keydown", escHandler);

        overlay.classList.remove("hidden");
    }

    setupResizer() {
        const resizer = document.getElementById('vertical-resizer');
        const leftPanel = document.getElementById('editor-container');
        let isResizing = false;

        resizer?.addEventListener('mousedown', () => {
            isResizing = true;
            document.body.style.cursor = 'ew-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !leftPanel || !leftPanel.parentElement) return;
            const containerOffset = leftPanel.parentElement.getBoundingClientRect().left;
            const newWidth = e.clientX - containerOffset;
            if (newWidth > 150 && newWidth < window.innerWidth - 300) {
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
        SqlDocs.forEach(cat => {
            const catLi = document.createElement("li");
            catLi.innerHTML = `<div class="schema-table-name" style="color:var(--text-primary);"><i class="ph-fill ph-folder"></i> ${cat.category}</div>`;
            
            const itemList = document.createElement("ul");
            itemList.className = "schema-list";
            itemList.style.border = "none";
            
            cat.items.forEach(item => {
                const itemLi = document.createElement("li");
                itemLi.className = "schema-column";
                itemLi.innerHTML = `<i class="ph-fill ph-code"></i> ${item.name}`;
                itemLi.onclick = () => this.winManager.showDoc(item);
                itemList.appendChild(itemLi);
            });

            catLi.appendChild(itemList);
            docsList.appendChild(catLi);
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
        this.renderTableInfo(level.schema);

        const briefing = document.getElementById("mission-briefing");
        if (briefing) {
            briefing.innerHTML = `
                <h2 style="margin-bottom:8px;">Misión ${index + 1}: ${level.db_name || ''}</h2>
                <p style="font-size:14px; line-height:1.5;">${level.briefing_mision}</p>
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
            const savedCode = Storage.getItem(`sql_sim_code_${index}`);
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
        if (!list) return;
        list.innerHTML = "";
        if (!schema) return;
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

    renderTableInfo(schema) {
        const container = document.getElementById("table-info-content");
        if (!container) return;
        container.innerHTML = "";

        if (!schema || schema.length === 0) {
            container.innerHTML = "<div style='padding:6px 8px; font-size:11px; color:var(--text-secondary);'>Sin tablas asignadas.</div>";
            return;
        }

        schema.forEach(tbl => {
            const card = document.createElement("div");
            card.style.padding = "6px 8px";
            card.style.borderBottom = "1px solid var(--border-shadow)";
            card.style.fontSize = "12px";

            const tableName = document.createElement("div");
            tableName.style.fontWeight = "bold";
            tableName.style.color = "var(--text-primary)";
            tableName.style.marginBottom = "3px";
            tableName.innerHTML = `<i class="ph-fill ph-table"></i> Tabla: <span style="color:#0000a0;">${tbl.table}</span>`;

            const colCount = document.createElement("div");
            colCount.style.fontSize = "11px";
            colCount.style.color = "var(--text-secondary)";
            colCount.textContent = `Total Columnas: ${tbl.columns ? tbl.columns.length : 0}`;

            const colBadgeWrapper = document.createElement("div");
            colBadgeWrapper.style.marginTop = "4px";
            colBadgeWrapper.style.display = "flex";
            colBadgeWrapper.style.flexWrap = "wrap";
            colBadgeWrapper.style.gap = "4px";

            if (tbl.columns) {
                tbl.columns.forEach(col => {
                    const badge = document.createElement("span");
                    badge.style.background = "var(--bg-hover)";
                    badge.style.border = "1px solid var(--border-shadow)";
                    badge.style.padding = "1px 4px";
                    badge.style.fontSize = "10px";
                    badge.style.fontFamily = "var(--font-mono)";
                    badge.style.color = "var(--text-primary)";
                    badge.textContent = col;
                    colBadgeWrapper.appendChild(badge);
                });
            }

            card.appendChild(tableName);
            card.appendChild(colCount);
            card.appendChild(colBadgeWrapper);
            container.appendChild(card);
        });
    }

    renderResources(resources) {
        const list = document.getElementById("resources-list");
        if (!list) return;
        list.innerHTML = "";
        if (!resources || resources.length === 0) {
            list.innerHTML = "<li style='padding:6px; font-size:11px; color:var(--text-secondary);'>Sin pistas requeridas para este nivel.</li>";
            return;
        }
        resources.forEach(res => {
            const li = document.createElement("li");
            li.className = "schema-column";
            li.style.flexDirection = "column";
            li.style.alignItems = "flex-start";
            li.innerHTML = `
                <div style="font-weight:bold; margin-bottom:4px; color:var(--text-primary);"><i class="ph-fill ph-lightbulb"></i> ${res.title}</div>
                <div style="font-size: 11px; line-height: 1.3; color:var(--text-secondary);">${res.desc}</div>
            `;
            list.appendChild(li);
        });
    }

    setupAuditMode(level) {
        const area = document.getElementById("audit-code-area");
        if (!area) return;
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
        const placeholder = document.getElementById("results-placeholder");
        const contentWrapper = document.getElementById("results-content");
        if (placeholder) placeholder.style.display = "none";
        if (contentWrapper) contentWrapper.style.display = "block";

        const table = document.getElementById("results-table");
        if (!table) return;
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

        if (!expectedData || expectedData.length === 0) {
            table.innerHTML = "<tbody><tr><td style='padding:6px; font-size:11px; color:var(--text-secondary);'>No requiere salida estructurada.</td></tr></tbody>";
            return;
        }

        const level = this.loader.getLevel(this.currentLevelIndex);
        let colNames = [];
        if (level && level.schema && level.schema[0] && level.schema[0].columns) {
            colNames = level.schema[0].columns.map(c => c.split(' ')[0]);
        }

        const sampleRow = Array.isArray(expectedData[0]) ? expectedData[0] : [expectedData[0]];
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");

        sampleRow.forEach((_, cIdx) => {
            const th = document.createElement("th");
            th.textContent = colNames[cIdx] || `Columna ${cIdx + 1}`;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        expectedData.forEach((row) => {
            const tr = document.createElement("tr");
            if (Array.isArray(row)) {
                row.forEach(val => {
                    const td = document.createElement("td");
                    td.textContent = val !== null ? val : 'NULL';
                    tr.appendChild(td);
                });
            } else {
                const td = document.createElement("td");
                td.textContent = row;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    }

    clearResults() {
        const placeholder = document.getElementById("results-placeholder");
        const contentWrapper = document.getElementById("results-content");
        if (placeholder) placeholder.style.display = "block";
        if (contentWrapper) contentWrapper.style.display = "none";
        const table = document.getElementById("results-table");
        if (table) table.innerHTML = "";
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
