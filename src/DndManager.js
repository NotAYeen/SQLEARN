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
            <div class="dnd-instruction">Arrastra los bloques de la izquierda hacia la zona de ensamblaje a la derecha:</div>
            <div style="display: flex; gap: 20px; margin-top: 10px;">
                <div style="flex: 1; border: 2px dashed var(--border-shadow); padding: 10px; min-height: 100px;">
                    <div style="font-weight: bold; margin-bottom: 10px; color: var(--text-secondary);">Bloques Disponibles</div>
                    <div id="dnd-source" style="display: flex; flex-direction: column; gap: 8px; min-height: 80px;"></div>
                </div>
                <div style="flex: 1; border: 2px solid var(--border-dark-shadow); background: var(--bg-panel); padding: 10px; min-height: 100px;">
                    <div style="font-weight: bold; margin-bottom: 10px; color: var(--accent-run);">Tu Consulta:</div>
                    <div id="dnd-target" style="display: flex; flex-direction: column; gap: 8px; min-height: 80px;"></div>
                </div>
            </div>
        `;

        const sourceEl = document.getElementById('dnd-source');
        const targetEl = document.getElementById('dnd-target');

        // Render blocks
        // Mezclamos (shuffle) los bloques para el reto
        const shuffled = [...blocks].sort(() => Math.random() - 0.5);
        
        shuffled.forEach(block => {
            const span = document.createElement("span");
            span.className = "dnd-block";
            span.textContent = block;
            sourceEl.appendChild(span);
        });

        // Initialize SortableJS
        if (this.sourceSortable) this.sourceSortable.destroy();
        if (this.targetSortable) this.targetSortable.destroy();

        this.sourceSortable = new Sortable(sourceEl, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost'
        });

        this.targetSortable = new Sortable(targetEl, {
            group: 'shared',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onSort: () => {
                this.updateEditorFromDropzone();
            }
        });

        // Clear editor since it starts empty
        window.SqlEditor.setValue("");
    }

    updateEditorFromDropzone() {
        const targetEl = document.getElementById('dnd-target');
        const blocks = Array.from(targetEl.children).map(child => child.textContent);
        const query = blocks.join(" ");
        window.SqlEditor.setValue(query);
    }
}
