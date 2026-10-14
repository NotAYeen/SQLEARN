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
            this.bootStatus("Cargando las 25 misiones...");
            await this.loader.fetchAllLevels();

            this.bootStatus("Cargando el motor SQLite en WebAssembly...");
            await this.db.init();

            this.bootStatus("Preparando el nivel...");
            this.setupDBSelector();
            this.loadLevel(this.currentLevelIndex);
        } catch (e) {
            console.error("Error crítico en la inicialización:", e);
            // Antes este catch solo escribía en consola: la app quedaba muerta
            // con el literal "Cargando misión..." y el editor sin funcionar.
            this.bootFail(
                "No se pudo iniciar el simulador. Todos los niveles se ejecutan " +
                "en tu navegador, así que hace falta conexión para descargar el motor la primera vez.",
                e && e.message ? e.message : String(e)
            );
            return;
        }

        this.bindEvents();
        this.setupResizer();
        this.renderDocs();
        this.setupMobileTabs();
        this.editor.applyTheme();

        const icon = document.querySelector('#btn-mute i');
        if (icon) icon.className = `ph-fill ${AudioFX.muted ? 'ph-speaker-x' : 'ph-speaker-high'}`;

        this.bootDone();
    }

    bootStatus(msg) {
        const el = document.getElementById("boot-status");
        if (el) el.textContent = msg;
    }

    bootFail(hint, detail) {
        const overlay = document.getElementById("boot-overlay");
        const status = document.getElementById("boot-status");
        const detailEl = document.getElementById("boot-detail");
        const hintEl = document.getElementById("boot-hint");
        if (status) status.textContent = "Error de arranque";
        if (detailEl) {
            detailEl.textContent = detail;
            detailEl.classList.remove("hidden");
        }
        if (hintEl) hintEl.textContent = hint;
        if (overlay) {
            overlay.classList.remove("hidden");
            overlay.setAttribute("role", "alert");
        }
    }

    bootDone() {
        const overlay = document.getElementById("boot-overlay");
        if (overlay) overlay.classList.add("hidden");
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
            // "Obtener Pista" solo revela (su rótulo lo dice); el toggle de la
            // cabecera es el que oculta. Antes los dos controls se desincronizaban
            // y el texto "Mostrar" podia quedar mintiendo sobre el estado real.
            const list = document.getElementById("resources-list");
            const btn = document.getElementById("toggle-hints-btn");
            if (!list) return;
            list.style.display = "block";
            if (btn) btn.textContent = "Ocultar";
            const summary = document.getElementById("results-summary");
            if (summary) summary.textContent = "Pistas del nivel mostradas.";

            // En móvil las pistas viven en el panel de Esquema, que está oculto
            // desde la tab Misión. Sin este salto el botón no hace nada visible.
            if (window.matchMedia('(max-width: 768px)').matches && this._switchMobileTab) {
                this._switchMobileTab(
                    document.getElementById("tab-btn-schema"),
                    document.getElementById("layout-left")
                );
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
            // El autoguardado por nivel (sql_sim_code_N) también es progreso.
            // No borrarlo dejaba respuestas viejas reapareciendo al volver a
            // un nivel anterior, así que el botón prometía un reset que no era.
            this.showModal(
                "Ajustes del Sistema",
                "¿Deseas formatear la base de datos local y reiniciar tu progreso al Nivel 1? " +
                "Se borrarán los logros y el código guardado de los 25 niveles.",
                () => {
                    Storage.removeItem('sql_sim_level');
                    Storage.removeItem('sql_sim_achievements');
                    this.loader.levels.forEach((_, i) => Storage.removeItem(`sql_sim_code_${i}`));
                    location.reload();
                },
                true
            );
        });

        document.getElementById("btn-contact")?.addEventListener("click", () => {
            // El botón decía "Contacto" y el modal decía "Acerca de". Ahora
            // ambos dicen lo mismo; el texto aclara qué es cada cosa.
            this.showModal(
                "Acerca de",
                "SQL Practice Simulator. Un entorno de práctica con 25 misiones para aprender " +
                "SQL ejecutando consultas de verdad contra SQLite en WebAssembly, sin servidor y sin cuenta.\n\n" +
                "Cada misión corre en tu navegador: nada de lo que escribas sale de tu equipo.",
                null,
                false
            );
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

        this._switchMobileTab = (activeBtn, showPanel) => {
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

        btnEditor.addEventListener("click", () => this._switchMobileTab(btnEditor, midPanel));
        btnSchema.addEventListener("click", () => this._switchMobileTab(btnSchema, leftPanel));
        btnMission.addEventListener("click", () => this._switchMobileTab(btnMission, rightPanel));

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
                    this._switchMobileTab(tabs[next], panels[next]);
                    tabs[next].focus();
                } else if (e.key === "Home") {
                    e.preventDefault();
                    this._switchMobileTab(tabs[0], panels[0]);
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

        const bounds = () => {
            const parent = editor?.parentElement;
            if (!parent) return null;
            return { top: parent.getBoundingClientRect().top, height: parent.clientHeight };
        };

        const setHeight = (px) => {
            const b = bounds();
            if (!b) return;
            const min = 100;
            const max = Math.max(min, b.height - 180);
            const newHeight = clamp(Math.round(px), min, max);
            editor.style.flex = `0 0 ${newHeight}px`;
            if (resizer) {
                resizer.setAttribute('aria-valuenow', String(newHeight));
                resizer.setAttribute('aria-valuemin', String(min));
                resizer.setAttribute('aria-valuemax', String(Math.round(max)));
            }
            Storage.setItem('sql_sim_editor_height', String(newHeight));
        };

        const currentHeight = () => {
            const b = bounds();
            if (!b || !editor) return 0;
            const explicit = parseInt(editor.style.flex, 10);
            return Number.isFinite(explicit) && explicit > 0 ? explicit : editor.clientHeight;
        };

        // La preferencia de altura sobrevive al cambio de nivel y al tema.
        const saved = parseInt(Storage.getItem('sql_sim_editor_height'), 10);
        if (Number.isFinite(saved) && saved > 0) setHeight(saved);

        resizer?.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
            document.body.style.cursor = 'row-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing || !editor || !editor.parentElement) return;
            const b = bounds();
            if (!b) return;
            setHeight(e.clientY - b.top);
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = 'default';
        });

        // role="separator" promete operacion con flechas. Sin esto era un
        // control solo-raton que ademas anunciaba una capacidad inexistente.
        resizer?.addEventListener('keydown', (e) => {
            const STEP = 24;
            const PAGE = 96;
            let delta = 0;
            if (e.key === 'ArrowUp') delta = -STEP;
            else if (e.key === 'ArrowDown') delta = STEP;
            else if (e.key === 'PageUp') delta = -PAGE;
            else if (e.key === 'PageDown') delta = PAGE;
            else if (e.key === 'Home') { e.preventDefault(); setHeight(100); return; }
            else if (e.key === 'End') { e.preventDefault(); setHeight(1e9); return; }
            else return;

            e.preventDefault();
            setHeight(currentHeight() + delta);
        });
    }

    renderDocs() {
        const docsList = document.getElementById("docs-list");
        if (!docsList) return;

        docsList.innerHTML = "";
        SqlDocs.forEach(cat => {
            const catLi = document.createElement("li");
            catLi.innerHTML = `<div class="schema-table-name"><i class="ph-fill ph-folder" aria-hidden="true"></i> ${escapeHtml(cat.category)}</div>`;
            
            const itemList = document.createElement("ul");
            itemList.className = "schema-list schema-list-nested";
            
            
            cat.items.forEach(item => {
                const itemLi = document.createElement("li");
                itemLi.className = "schema-column docs-item";
                itemLi.setAttribute("role", "button");
                itemLi.setAttribute("tabindex", "0");
                itemLi.innerHTML = `<i class="ph-fill ph-code" aria-hidden="true"></i> ${escapeHtml(item.name)}`;
                itemLi.onclick = () => this.winManager.showDoc(item);
                itemLi.onkeydown = (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        this.winManager.showDoc(item);
                    }
                };
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
                <h2 class="mission-title">
                    <span>Misión ${index + 1}: ${escapeHtml(level.db_name || '')}</span>
                    ${badgeHTML}
                </h2>
                <p class="mission-text-body">${escapeHtml(level.briefing_mision)}</p>
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
        if (!schema || schema.length === 0) {
            // Estado vacío explícito: antes salía temprano y dejaba un <ul>
            // en blanco, sin nada que indicara que faltaba el esquema.
            const empty = document.createElement("li");
            empty.className = "sidebar-empty";
            empty.textContent = "Este nivel no define tablas.";
            list.appendChild(empty);
            return;
        }
        schema.forEach(tbl => {
            const li = document.createElement("li");
            li.innerHTML = `<div class="schema-table-name"><i class="ph-fill ph-table" aria-hidden="true"></i> ${escapeHtml(tbl.table)}</div>`;
            
            const colList = document.createElement("ul");
            colList.className = "schema-list schema-list-nested";
            
            
            tbl.columns.forEach(col => {
                const cli = document.createElement("li");
                cli.className = "schema-column";
                cli.innerHTML = `<i class="ph-fill ph-columns" aria-hidden="true"></i> ${escapeHtml(col)}`;
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
            const empty = document.createElement("div");
            empty.className = "sidebar-empty";
            empty.textContent = "Sin tablas asignadas.";
            container.appendChild(empty);
            return;
        }

        schema.forEach(tbl => {
            const card = document.createElement("div");
            card.className = "table-info-card";

            const tableName = document.createElement("div");
            tableName.className = "table-info-name";
            tableName.innerHTML = `<i class="ph-fill ph-table" aria-hidden="true"></i> Tabla: <span class="table-info-table">${escapeHtml(tbl.table)}</span>`;

            const colCount = document.createElement("div");
            colCount.className = "table-info-count";
            colCount.textContent = `Total Columnas: ${tbl.columns ? tbl.columns.length : 0}`;

            const colBadgeWrapper = document.createElement("div");
            colBadgeWrapper.className = "column-badge-row";

            if (tbl.columns) {
                tbl.columns.forEach(col => {
                    const badge = document.createElement("span");
                    badge.className = "column-badge";
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
            const empty = document.createElement("li");
            empty.className = "sidebar-empty";
            empty.textContent = "Sin pistas requeridas para este nivel.";
            list.appendChild(empty);
            return;
        }
        resources.forEach(res => {
            const li = document.createElement("li");
            li.className = "hint-item";
            const title = document.createElement("div");
            title.className = "hint-item-title";
            title.innerHTML = `<i class="ph-fill ph-lightbulb" aria-hidden="true"></i> ${escapeHtml(res.title)}`;
            const desc = document.createElement("div");
            desc.className = "hint-item-desc";
            desc.textContent = res.desc;
            li.appendChild(title);
            li.appendChild(desc);
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
            // El último nivel de auditoría no tenía siguiente: loadLevel(index+1) salía
            // de rango y el botón Aceptar no hacía nada visible.
            const isLast = this.currentLevelIndex >= this.loader.levels.length - 1;
            this.showModal("¡Auditoría Exitosa!", "¡Buen trabajo! Encontraste el error.\n\n" + level.explicacion, () => {
                if (isLast) {
                    this.showModal("¡Felicidades!", "Has completado todos los niveles del simulador.", null, false);
                } else {
                    this.loadLevel(this.currentLevelIndex + 1);
                }
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
        if (!sql.trim()) {
            const summary = document.getElementById("results-summary");
            if (summary) summary.textContent = "El editor está vacío. Escribe una consulta antes de ejecutar.";
            this.showModal("Editor vacío", "Escribe una consulta en el editor antes de pulsar Ejecutar.", null, false);
            return;
        }

        // Ejecutar en transacción y revertir: cada "Ejecutar" evalúa contra la BD
        // prístina del nivel, así las consultas DML son idempotentes y la validación
        // no depende del estado acumulado entre intentos (evita UNIQUE/duplicados).
        const db = this.db.db;
        try { db.exec("BEGIN"); } catch (e) { /* ignore */ }

        let res;
        try {
            res = this.db.executeQuery(sql);
        } finally {
            try { db.exec("ROLLBACK"); } catch (e) { /* ignore */ }
        }

        if (res.error) {
            AudioFX.error();
            // Fila de error propia: antes renderizaba el mensaje como una fila
            // de datos normal, indistinguible de un SELECT exitoso.
            this.renderResults({ columns: ["Error SQL"], values: [[res.error]] }, { error: true });
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

    renderResults(res, opts = {}) {
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
        caption.textContent = opts.error ? "Error de la consulta SQL" : "Resultados de tu consulta SQL";
        table.appendChild(caption);

        if (opts.error) {
            // Sin cabecera de columnas: un error no tiene columnas, y una fila
            // roja bajo un "th" que dice "Error SQL" sigue pareciendo un dato.
            const tbody = document.createElement("tbody");
            const tr = document.createElement("tr");
            tr.className = "error-row";
            const td = document.createElement("td");
            td.colSpan = 1;
            td.textContent = allRows.length ? allRows[0][0] : 'Error desconocido';
            tr.appendChild(td);
            tbody.appendChild(tr);
            table.appendChild(tbody);
            this.announceResults(0, 0, true);
            return;
        }

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

        this.announceResults(allRows.length, res.columns.length, false);

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
            table.innerHTML = "<tbody><tr><td class='sidebar-empty'>No requiere salida estructurada.</td></tr></tbody>";
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

    announceResults(rowCount, colCount, isError) {
        // La región viva vive fuera de la tabla: con aria-live en el panel,
        // un resultado de 200 filas se leía fila a fila.
        const summary = document.getElementById("results-summary");
        if (!summary) return;
        if (isError) {
            summary.textContent = "La consulta tiene un error. Revisa el mensaje en el panel de resultados.";
        } else if (rowCount === 0) {
            summary.textContent = "La consulta se ejecutó y no devolvió filas.";
        } else {
            const cols = colCount === 1 ? "1 columna" : `${colCount} columnas`;
            const rows = rowCount === 1 ? "1 fila" : `${rowCount} filas`;
            summary.textContent = `La consulta devolvió ${rows} y ${cols}.`;
        }
    }

    clearResults() {
        const placeholder = document.getElementById("results-placeholder");
        const contentWrapper = document.getElementById("results-content");
        if (placeholder) placeholder.style.display = "block";
        if (contentWrapper) contentWrapper.style.display = "none";
        const table = document.getElementById("results-table");
        if (table) table.innerHTML = "";
        const summary = document.getElementById("results-summary");
        if (summary) summary.textContent = "";
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
