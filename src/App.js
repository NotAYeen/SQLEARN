import { SQLEditor } from './editor.js';
import { DatabaseEngine } from './database.js';
import { LevelLoader } from './LevelLoader.js';
import { WindowManager } from './WindowManager.js';
import { DndManager } from './DndManager.js';
import { AchievementsManager } from './Achievements.js';
import { SqlDocs } from './docs.js';
import { AudioFX } from './AudioFX.js';
import { Storage } from './storage.js';
import { compareAnswer } from './compare.js';

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export class App {
    constructor() {
        this.loader = new LevelLoader();
        this.db = new DatabaseEngine();
        this.editor = new SQLEditor("sql-editor");
        this.winManager = new WindowManager();
        this.dndManager = new DndManager(this);
        this.achievements = new AchievementsManager();
        
        this.currentLevelIndex = parseInt(Storage.getItem('sql_sim_level')) || 0;

        this._silentChange = false;
        this._saveTimer = null;
        this._lastFocused = null;
        AudioFX.muted = Storage.getItem('sql_sim_muted') === 'true';
        
        // Cargar Tema
        const savedTheme = Storage.getItem('sql_sim_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    async init() {
        this.editor.init();
        this.editor.onChange((code) => {
            AudioFX.init();
            if (!this._silentChange) AudioFX.keyPress();
            clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(() => {
                Storage.setItem(`sql_sim_code_${this.currentLevelIndex}`, code);
            }, 300);
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
        this.editor.applyTheme();

        const icon = document.querySelector('#btn-mute i');
        if (icon) icon.className = `ph-fill ${AudioFX.muted ? 'ph-speaker-x' : 'ph-speaker-high'}`;
    }

    setEditorQuiet(value) {
        this._silentChange = true;
        try {
            this.editor.setValue(value);
        } finally {
            this._silentChange = false;
        }
    }

    setupDBSelector() {
        const selector = document.getElementById("db-selector");
        if (!selector) return;

        selector.innerHTML = "";

        const groupBasic = document.createElement("optgroup");
        groupBasic.label = "🟢 Dificultad: Básica";

        const groupInter = document.createElement("optgroup");
        groupInter.label = "🟡 Dificultad: Intermedia";

        const groupAdv = document.createElement("optgroup");
        groupAdv.label = "🔴 Dificultad: Avanzada";

        this.loader.levels.forEach((level, index) => {
            const option = document.createElement("option");
            option.value = index;
            
            const diff = level.dificultad || "Básico";
            let tag = "🟢";
            if (diff.includes("Intermedio") || diff.includes("Medio")) tag = "🟡";
            else if (diff.includes("Avanzado") || diff.includes("Difícil") || diff.includes("Experto")) tag = "🔴";

            option.textContent = `${tag} Nivel ${index + 1}: ${level.db_name || ''} [${diff}]`;
            
            if (tag === "🟢") groupBasic.appendChild(option);
            else if (tag === "🟡") groupInter.appendChild(option);
            else groupAdv.appendChild(option);
        });

        if (groupBasic.children.length > 0) selector.appendChild(groupBasic);
        if (groupInter.children.length > 0) selector.appendChild(groupInter);
        if (groupAdv.children.length > 0) selector.appendChild(groupAdv);

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
            this.editor.applyTheme();
        });

        document.getElementById("btn-mute")?.addEventListener("click", () => {
            AudioFX.muted = !AudioFX.muted;
            Storage.setItem('sql_sim_muted', String(AudioFX.muted));
            const icon = document.querySelector('#btn-mute i');
            if (icon) icon.className = `ph-fill ${AudioFX.muted ? 'ph-speaker-x' : 'ph-speaker-high'}`;
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
            if (!level) return;
            const modalidad = level.modalidad || "";
            if (modalidad === "Audit" || modalidad === "Auditoría") {
                this.revealAuditSolution(level);
            } else if (modalidad === "DND" || modalidad === "Ensamblaje") {
                const ok = this.dndManager.applySolution(level.expected_query);
                if (!ok && level.expected_query) {
                    this.showModal("Solución", level.expected_query, null, false);
                }
            } else if (level.expected_query) {
                this.setEditorQuiet(level.expected_query);
            }
        });

        document.getElementById("btn-reset-db")?.addEventListener("click", () => {
            const level = this.loader.getLevel(this.currentLevelIndex);
            if (!level) return;
            this.showModal(
                "Reiniciar Base de Datos",
                "Se restaurará la base de datos de esta misión a su estado inicial. Los cambios que hayas hecho (INSERT, UPDATE o DELETE) se descartarán. Tu código en el editor se mantiene.",
                () => {
                    if (this.db.loadLevelDB(level.init_db_sql)) {
                        this.clearResults();
                        this.showExpectedOutput(level.solution_data);
                    }
                },
                true
            );
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
            activeBtn.setAttribute("aria-selected", "true");

            [btnEditor, btnSchema, btnMission].forEach(b => {
                if (b !== activeBtn) b.setAttribute("aria-selected", "false");
            });

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

        // Keyboard arrow navigation between tabs (mobile tab pattern)
        const tabs = [btnEditor, btnSchema, btnMission];
        const panels = [midPanel, leftPanel, rightPanel];
        tabs.forEach((btn, i) => {
            btn.addEventListener("keydown", (e) => {
                let next = null;
                if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
                else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
                if (next !== null) {
                    e.preventDefault();
                    switchTab(tabs[next], panels[next]);
                    tabs[next].focus();
                } else if (e.key === "Home") {
                    e.preventDefault();
                    switchTab(tabs[0], panels[0]);
                    tabs[0].focus();
                }
            });
        });

        // Panel role: tabpanel on mobile, landmark on desktop
        const mq = window.matchMedia('(max-width: 768px)');
        const applyPanelRoles = (mobile) => {
            [leftPanel, midPanel, rightPanel].forEach(p => {
                if (mobile) p.setAttribute("role", "tabpanel");
                else p.setAttribute("role", p.id === "layout-mid" ? "main" : "complementary");
            });
        };
        applyPanelRoles(mq.matches);
        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", (e) => applyPanelRoles(e.matches));
        }
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

        const appRoot = document.querySelector(".app-container");
        if (this._lastFocused === null) this._lastFocused = document.activeElement;

        const restoreBackground = () => {
            if (appRoot) {
                appRoot.inert = false;
                appRoot.removeAttribute("aria-hidden");
            }
        };

        const cleanup = () => {
            overlay.classList.add("hidden");
            removeFocusTrap();
            if (this._modalEscHandler) {
                document.removeEventListener("keydown", this._modalEscHandler);
                this._modalEscHandler = null;
            }
            restoreBackground();
            const focusTarget = this._lastFocused;
            this._lastFocused = null;
            // Restore focus to the element that opened the modal
            if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
        };

        if (btnOk) btnOk.onclick = () => {
            try {
                if (onConfirm) onConfirm();
            } finally {
                cleanup();
            }
        };
        if (btnCancel) btnCancel.onclick = () => cleanup();
        if (btnX) btnX.onclick = () => cleanup();

        // Close on Escape key (single shared handler, removed on cleanup)
        this._modalEscHandler = (e) => {
            if (e.key === "Escape") cleanup();
        };
        document.addEventListener("keydown", this._modalEscHandler);

        // Close when clicking the dimmed backdrop (except when a confirm is mandatory)
        if (showCancel) {
            overlay.onclick = (e) => {
                if (e.target === overlay) cleanup();
            };
        }

        // Keep focus inside the modal
        const focusables = () => Array.from(overlay.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])'))
            .filter(el => !el.disabled && el.style.display !== 'none');
        const removeFocusTrap = () => {
            overlay.removeEventListener("keydown", trapFocus);
        };
        const trapFocus = (e) => {
            if (e.key !== "Tab") return;
            const items = focusables();
            if (items.length === 0) { e.preventDefault(); return; }
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        overlay.addEventListener("keydown", trapFocus);

        overlay.classList.remove("hidden");
        restoreBackground();
        if (appRoot) {
            appRoot.inert = true;
            appRoot.setAttribute("aria-hidden", "true");
        }

        // Focus the first available control
        const firstBtn = focusables()[0] || btnX || btnOk;
        if (firstBtn) firstBtn.focus();
        if (document.activeElement !== firstBtn) {
            overlay.setAttribute('tabindex', '-1');
            overlay.focus();
        }
    }

    setupResizer() {
        const resizer = document.getElementById('vertical-resizer');
        const editor = document.getElementById('editor-container');
        let isResizing = false;

        const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

        resizer?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            document.body.style.cursor = 'row-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !editor || !editor.parentElement) return;
            const parentTop = editor.parentElement.getBoundingClientRect().top;
            const parentHeight = editor.parentElement.clientHeight;
            const newHeight = clamp(e.clientY - parentTop, 100, parentHeight - 280);
            editor.style.flex = `0 0 ${newHeight}px`;
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
            catLi.innerHTML = `<div class="schema-table-name" style="color:var(--text-primary);"><i class="ph-fill ph-folder"></i> ${escapeHtml(cat.category)}</div>`;
            
            const itemList = document.createElement("ul");
            itemList.className = "schema-list";
            itemList.style.border = "none";
            
            cat.items.forEach(item => {
                const itemLi = document.createElement("li");
                itemLi.className = "schema-column";
                itemLi.innerHTML = `<i class="ph-fill ph-code"></i> ${escapeHtml(item.name)}`;
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

        const diff = level.dificultad || "Básico";
        let badgeClass = "badge-easy";
        let badgeIcon = "🟢";
        if (diff.includes("Intermedio") || diff.includes("Medio")) {
            badgeClass = "badge-medium";
            badgeIcon = "🟡";
        } else if (diff.includes("Avanzado") || diff.includes("Difícil") || diff.includes("Experto")) {
            badgeClass = "badge-hard";
            badgeIcon = "🔴";
        }
        const badgeHTML = `<span class="difficulty-badge ${badgeClass}">${badgeIcon} ${diff}</span>`;

        const briefing = document.getElementById("mission-briefing");
        if (briefing) {
            briefing.innerHTML = `
                <h2 style="margin-bottom:8px; display:flex; align-items:center; flex-wrap:wrap; gap:6px;">
                    <span>Misión ${index + 1}: ${escapeHtml(level.db_name || '')}</span>
                    ${badgeHTML}
                </h2>
                <p style="font-size:14px; line-height:1.5;">${escapeHtml(level.briefing_mision)}</p>
            `;
        }

        const mobileBriefing = document.getElementById("mobile-mission-briefing");
        if (mobileBriefing) {
            mobileBriefing.innerHTML = `
                <div class="mobile-mission-title">
                    <span><i class="ph-fill ph-target" aria-hidden="true"></i> Misión ${index + 1}: ${escapeHtml(level.db_name || '')}</span>
                    ${badgeHTML}
                </div>
                <div class="mobile-mission-text">${escapeHtml(level.briefing_mision)}</div>
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
            const isDepuracion = level.modalidad === "Depuración";
            if (savedCode) {
                this.setEditorQuiet(savedCode);
            } else if (isDepuracion && level.query_defectuoso) {
                this.setEditorQuiet(level.query_defectuoso);
            } else {
                this.setEditorQuiet("");
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
            li.innerHTML = `<div class="schema-table-name"><i class="ph-fill ph-table"></i> ${escapeHtml(tbl.table)}</div>`;
            
            const colList = document.createElement("ul");
            colList.className = "schema-list";
            colList.style.border = "none";
            
            tbl.columns.forEach(col => {
                const cli = document.createElement("li");
                cli.className = "schema-column";
                cli.innerHTML = `<i class="ph-fill ph-columns"></i> ${escapeHtml(col)}`;
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
            tableName.innerHTML = `<i class="ph-fill ph-table"></i> Tabla: <span style="color:var(--text-primary); font-weight:bold;">${escapeHtml(tbl.table)}</span>`;

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
                <div style="font-weight:bold; margin-bottom:4px; color:var(--text-primary);"><i class="ph-fill ph-lightbulb"></i> ${escapeHtml(res.title)}</div>
                <div style="font-size: 11px; line-height: 1.3; color:var(--text-secondary);">${escapeHtml(res.desc)}</div>
            `;
            list.appendChild(li);
        });
    }

    setupAuditMode(level) {
        const area = document.getElementById("audit-code-area");
        if (!area) return;
        area.innerHTML = "";
        area.dataset.solved = "false";
        level.audit_tokens.forEach((token, idx) => {
            const span = document.createElement("span");
            span.className = "audit-token";
            span.textContent = token.trim() + " ";
            span.dataset.index = idx;
            span.setAttribute("role", "button");
            span.setAttribute("tabindex", "0");
            span.setAttribute("aria-label", `Fragmento ${idx + 1} del código SQL: ${token.trim()}`);
            span.onclick = () => this.checkAudit(level, idx);
            span.onkeydown = (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this.checkAudit(level, idx);
                }
            };
            area.appendChild(span);
        });
    }

    revealAuditSolution(level) {
        const area = document.getElementById("audit-code-area");
        if (!area || area.dataset.solved === "true") return;
        if (!Array.isArray(level.audit_tokens)) return;
        const token = area.querySelector(`.audit-token[data-index="${level.token_error_index}"]`);
        if (token) token.classList.add("solution-reveal");
        this.showModal(
            "Solución (Auditoría)",
            "El fragmento marcado en dorado contiene el error.\n\n" + (level.explicacion || ""),
            null,
            false
        );
    }

    checkAudit(level, selectedIndex) {
        const area = document.getElementById("audit-code-area");
        if (!area || area.dataset.solved === "true") return;

        if (selectedIndex === level.token_error_index) {
            area.dataset.solved = "true";
            const token = area.querySelector(`.audit-token[data-index="${selectedIndex}"]`);
            if (token) token.classList.add("error-found");
            Array.from(area.querySelectorAll(".audit-token")).forEach(t => {
                t.style.pointerEvents = "none";
                t.setAttribute("tabindex", "-1");
                t.setAttribute("aria-disabled", "true");
            });
            AudioFX.success();
            this.achievements.unlock('detective'); // Unlock Achievement!
            this.showModal("¡Auditoría Exitosa!", "¡Buen trabajo! Encontraste el error.\n\n" + level.explicacion, () => {
                this.loadLevel(this.currentLevelIndex + 1);
            });
        } else {
            AudioFX.error();
            const token = area.querySelector(`.audit-token[data-index="${selectedIndex}"]`);
            if (token) {
                token.classList.add("audit-token-wrong");
                setTimeout(() => token.classList.remove("audit-token-wrong"), 600);
            }
            this.showModal("Error", "Ese no es el problema. Revisa bien la sintaxis o la lógica.", null, false);
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

        const MAX_ROWS = 200;
        const allRows = res.values || [];
        const rows = allRows.slice(0, MAX_ROWS);

        const caption = document.createElement("caption");
        caption.className = "visually-hidden";
        caption.textContent = "Resultados de tu consulta SQL";
        table.appendChild(caption);

        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        res.columns.forEach(col => {
            const th = document.createElement("th");
            th.scope = "col";
            th.textContent = col;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        rows.forEach(row => {
            const tr = document.createElement("tr");
            row.forEach(val => {
                const td = document.createElement("td");
                td.textContent = val !== null ? val : 'NULL';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        if (allRows.length > MAX_ROWS) {
            const noteRow = document.createElement("tr");
            noteRow.className = "truncation-note";
            const noteCell = document.createElement("td");
            noteCell.colSpan = res.columns.length;
            noteCell.textContent = `Mostrando las primeras ${MAX_ROWS} de ${allRows.length} filas. Usa LIMIT u ORDER BY para acotar los resultados.`;
            noteRow.appendChild(noteCell);
            tbody.appendChild(noteRow);
        }
    }

    showExpectedOutput(expectedData) {
        const panel = document.getElementById("expected-panel");
        const table = document.getElementById("expected-table");
        if (!table) return;

        if (!expectedData || expectedData.length === 0) {
            table.innerHTML = "<tbody><tr><td style='padding:6px; font-size:11px; color:var(--text-secondary);'>No requiere salida estructurada.</td></tr></tbody>";
            if (panel) panel.style.display = "none";
            return;
        }

        if (panel) panel.style.display = "block";
        table.innerHTML = "";

        const level = this.loader.getLevel(this.currentLevelIndex);
        const colNames = this.getExpectedColumns(level);

        const caption = document.createElement("caption");
        caption.className = "visually-hidden";
        caption.textContent = "Salida esperada de la misión";
        table.appendChild(caption);

        const sampleRow = Array.isArray(expectedData[0]) ? expectedData[0] : [expectedData[0]];
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");

        sampleRow.forEach((_, cIdx) => {
            const th = document.createElement("th");
            th.scope = "col";
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

    getExpectedColumns(level) {
        if (!level || !level.expected_query) return [];
        if (level._expectedColsCache) return level._expectedColsCache;

        let cols = null;
        const db = this.db.db;
        if (db) {
            // Run inside a transaction and roll back so DML in expected_query
            // (e.g. the INSERT+SELECT of some DND levels) never mutates the level DB.
            try { db.exec("BEGIN"); } catch (e) { /* ignore */ }
            try {
                const res = this.db.executeQuery(level.expected_query);
                if (res && !res.error && res.results && res.results.columns && res.results.columns.length > 0) {
                    cols = res.results.columns;
                }
            } catch (e) { /* fall through */ }
            finally {
                try { db.exec("ROLLBACK"); } catch (e) { /* ignore */ }
            }
        }

        if (!cols || cols.length === 0) {
            const first = level.schema && level.schema[0] && level.schema[0].columns;
            cols = first ? first.map(c => c.split(' ')[0]) : [];
        }

        level._expectedColsCache = cols;
        return cols;
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

        const cmp = compareAnswer(actualData, level.solution_data);

        if (cmp.match) {
            AudioFX.success();

            // Achievements checks (keyed by stable id_nivel, not array index)
            if (this.currentLevelIndex === 0) this.achievements.unlock('first_blood');
            if (level.modalidad === "DND" || level.modalidad === "Ensamblaje") this.achievements.unlock('puzzle_master');
            if (level.id_nivel === 'escenario_13') this.achievements.unlock('half_way');
            if (level.id_nivel === 'escenario_25') this.achievements.unlock('nsa_hacker');

            const note = cmp.orderMismatch ? "\n\n" + cmp.message : "";
            this.showModal(
                "¡Misión Completada!",
                "Has resuelto la consulta exitosamente." + note + "\n¿Quieres pasar al siguiente nivel?",
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
            this.showModal("Resultado Incorrecto", cmp.message, null, false);
        }
    }
}
