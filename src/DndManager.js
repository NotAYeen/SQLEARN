import Sortable from 'sortablejs';

export class DndManager {
    constructor(appInstance) {
        this.app = appInstance;
        this.sourceSortable = null;
        this.targetSortable = null;
    }

    init(blocks) {
        const dndContainer = document.getElementById("dnd-container");
        if (!dndContainer) return;

        // Clean up previous UI
        dndContainer.innerHTML = `
            <div class="dnd-instruction">Arrastra los bloques, presiona ＋ o − para ensamblar la consulta:</div>
            <div class="dnd-row">
                <div class="dnd-pane">
                    <div style="font-weight: bold; margin-bottom: 10px; color: var(--text-secondary);">Bloques Disponibles</div>
                    <div id="dnd-source" style="display: flex; flex-direction: column; gap: 8px; min-height: 80px;"></div>
                </div>
                <div class="dnd-pane dnd-pane-target">
                    <div style="font-weight: bold; margin-bottom: 10px; color: var(--accent-run);">Tu Consulta:</div>
                    <div id="dnd-target" style="display: flex; flex-direction: column; gap: 8px; min-height: 80px;"></div>
                </div>
            </div>
        `;

        const sourceEl = document.getElementById('dnd-source');
        const targetEl = document.getElementById('dnd-target');

        // Render blocks (shuffled)
        const shuffled = [...blocks].sort(() => Math.random() - 0.5);
        shuffled.forEach(block => {
            sourceEl.appendChild(this.createItem(block, 'add'));
        });

        // Delegated clicks for the ＋/－ buttons (keyboard + touch friendly)
        sourceEl.addEventListener('click', (e) => this.onItemClick(e, 'add'));
        targetEl.addEventListener('click', (e) => this.onItemClick(e, 'remove'));

        // Initialize SortableJS
        if (this.sourceSortable) this.sourceSortable.destroy();
        if (this.targetSortable) this.targetSortable.destroy();

        const onSort = () => {
            this.syncAll();
            this.updateEditorFromDropzone();
        };

        this.sourceSortable = new Sortable(sourceEl, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.dnd-block',
            onSort
        });

        this.targetSortable = new Sortable(targetEl, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.dnd-block',
            onSort
        });

        // Clear editor since it starts empty
        this.app.setEditorQuiet("");
    }

    createItem(block, type) {
        const wrapper = document.createElement("div");
        wrapper.className = "dnd-item";

        const label = document.createElement("span");
        label.className = "dnd-block";
        label.textContent = block;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.block = block;
        this.styleButton(btn, type);

        wrapper.appendChild(label);
        wrapper.appendChild(btn);
        return wrapper;
    }

    styleButton(btn, type) {
        const block = btn.dataset.block;
        if (type === 'add') {
            btn.className = "dnd-btn dnd-btn-add";
            btn.textContent = "＋";
            btn.setAttribute('aria-label', `Añadir bloque "${block}" a tu consulta`);
        } else {
            btn.className = "dnd-btn dnd-btn-remove";
            btn.textContent = "−";
            btn.setAttribute('aria-label', `Quitar bloque "${block}" de tu consulta`);
        }
    }

    syncAll() {
        const sourceEl = document.getElementById('dnd-source');
        const targetEl = document.getElementById('dnd-target');
        if (sourceEl) {
            sourceEl.querySelectorAll('.dnd-item').forEach(item => {
                this.styleButton(item.querySelector('.dnd-btn'), 'add');
            });
        }
        if (targetEl) {
            targetEl.querySelectorAll('.dnd-item').forEach(item => {
                this.styleButton(item.querySelector('.dnd-btn'), 'remove');
            });
        }
    }

    onItemClick(e, type) {
        const btn = e.target.closest('.dnd-btn');
        if (!btn) return;

        const block = btn.dataset.block;
        const sourceEl = document.getElementById('dnd-source');
        const targetEl = document.getElementById('dnd-target');
        if (!sourceEl || !targetEl) return;

        const item = btn.closest('.dnd-item');
        if (!item) return;

        if (type === 'add') {
            const moved = this.createItem(block, 'remove');
            targetEl.appendChild(moved);
            item.remove();
        } else {
            const moved = this.createItem(block, 'add');
            sourceEl.appendChild(moved);
            item.remove();
        }

        this.updateEditorFromDropzone();
    }

    getQuery() {
        const targetEl = document.getElementById('dnd-target');
        if (!targetEl) return "";
        return Array.from(targetEl.querySelectorAll('.dnd-block')).map(el => el.textContent).join(" ");
    }

    updateEditorFromDropzone() {
        this.app.setEditorQuiet(this.getQuery());
    }

    applySolution(expectedQuery) {
        if (!expectedQuery) return false;
        const sourceEl = document.getElementById('dnd-source');
        const targetEl = document.getElementById('dnd-target');
        if (!sourceEl || !targetEl) return false;

        const norm = (s) => String(s)
            .replace(/\s+/g, ' ')
            .replace(/\s*([;,.)])\s*/g, '$1')
            .trim()
            .toLowerCase();

        const expected = norm(expectedQuery);
        const blocks = Array.from(sourceEl.querySelectorAll('.dnd-block'))
            .concat(Array.from(targetEl.querySelectorAll('.dnd-block')))
            .map(el => el.textContent);

        const order = this.findSolutionOrder(blocks, expected, norm);
        if (!order) return false;

        sourceEl.innerHTML = "";
        targetEl.innerHTML = "";
        order.forEach(block => {
            targetEl.appendChild(this.createItem(block, 'remove'));
        });
        this.syncAll();
        this.updateEditorFromDropzone();
        return true;
    }

    findSolutionOrder(blocks, expected, norm) {
        const n = blocks.length;
        if (n === 0 || n > 8) return null;

        const used = new Array(n).fill(false);
        const perm = [];
        let found = null;

        const backtrack = () => {
            if (found) return;
            if (perm.length === n) {
                const joined = perm.map(i => blocks[i]).join(' ');
                if (norm(joined) === expected) found = perm.slice();
                return;
            }
            for (let i = 0; i < n; i++) {
                if (used[i]) continue;
                used[i] = true;
                perm.push(i);
                backtrack();
                perm.pop();
                used[i] = false;
                if (found) return;
            }
        };
        backtrack();

        if (!found) return null;
        return found.map(i => blocks[i]);
    }
}