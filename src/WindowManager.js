export class WindowManager {
    constructor() {
        this.win = document.getElementById("docs-window");
        this.header = document.getElementById("docs-window-header");
        this.closeBtn = document.getElementById("docs-close");
        this.backdrop = document.getElementById("docs-backdrop");
        this.appRoot = document.querySelector(".app-container");
        this._lastFocused = null;
        this._escHandler = null;
        this._trapHandler = null;

        if (this.win) {
            this.bindCloseEvents();
            if (this.header) {
                this.initDrag();
            }
        }
    }

    get isOpen() {
        return !!this.win && !this.win.classList.contains("hidden");
    }

    bindCloseEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener("click", () => this.hideDoc());
        }

        // Clic en el fondo cierra, como en cualquier dialogo modal.
        this.backdrop?.addEventListener("click", () => this.hideDoc());

        // Escape cierra y devuelve el foco a quien abrio la ventana.
        this._escHandler = (e) => {
            if (e.key === "Escape" && this.isOpen) {
                e.preventDefault();
                this.hideDoc();
            }
        };
        document.addEventListener("keydown", this._escHandler);

        // Con aria-modal el fondo deja de ser alcanzable con Tab; el foco
        // tiene que quedarse dentro de la ventana mientras esta abierta.
        this._trapHandler = (e) => {
            if (e.key !== "Tab" || !this.isOpen) return;
            const items = Array.from(
                this.win.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
            ).filter(el => !el.disabled && el.offsetParent !== null);
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
        document.addEventListener("keydown", this._trapHandler);
    }

    initDrag() {
        let isDragging = false;
        let offsetX, offsetY;

        // En movil la ventana se centra con transform, que compite con el
        // left/top que escribe el arrastre. Ahi no se arrastra.
        const canDrag = () => !window.matchMedia('(max-width: 768px)').matches;

        this.header.addEventListener("mousedown", (e) => {
            if (e.target.closest('#docs-close')) return;
            if (!canDrag()) return;

            isDragging = true;
            offsetX = e.clientX - this.win.getBoundingClientRect().left;
            offsetY = e.clientY - this.win.getBoundingClientRect().top;
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;

            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // Bounds logic
            const maxLeft = window.innerWidth - this.win.offsetWidth;
            const maxTop = window.innerHeight - this.win.offsetHeight;

            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop > maxTop) newTop = maxTop;

            this.win.style.left = newLeft + "px";
            this.win.style.top = newTop + "px";
            this.win.style.right = "auto";
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });

        // Arrastre accesible con teclado desde la barra de titulo.
        this.header.addEventListener("keydown", (e) => {
            if (!canDrag()) return;
            if (!e.target.closest('#docs-close') && e.target !== this.header && !this.header.contains(e.target)) return;
            const STEP = 24;
            const rect = this.win.getBoundingClientRect();
            let dx = 0, dy = 0;
            if (e.key === 'ArrowLeft') dx = -STEP;
            else if (e.key === 'ArrowRight') dx = STEP;
            else if (e.key === 'ArrowUp') dy = -STEP;
            else if (e.key === 'ArrowDown') dy = STEP;
            else return;
            e.preventDefault();
            const maxLeft = window.innerWidth - this.win.offsetWidth;
            const maxTop = window.innerHeight - this.win.offsetHeight;
            const left = Math.min(Math.max(rect.left + dx, 0), Math.max(0, maxLeft));
            const top = Math.min(Math.max(rect.top + dy, 0), Math.max(0, maxTop));
            this.win.style.left = left + "px";
            this.win.style.top = top + "px";
            this.win.style.right = "auto";
        });
    }

    showDoc(item) {
        if (!this.win) return;
        if (!this.isOpen) {
            this._lastFocused = document.activeElement;
        }
        document.getElementById("docs-item-name").textContent = item.name;
        document.getElementById("docs-item-desc").textContent = item.desc;
        document.getElementById("docs-item-example").textContent = item.example;
        this.win.classList.remove("hidden");
        this.backdrop?.classList.remove("hidden");
        if (this.appRoot) {
            this.appRoot.inert = true;
            this.appRoot.setAttribute("aria-hidden", "true");
        }
        // El foco entra en el dialogo: sin esto el Tab se va al fondo.
        (this.closeBtn || this.win).focus();
    }

    hideDoc() {
        if (!this.win) return;
        this.win.classList.add("hidden");
        this.backdrop?.classList.add("hidden");
        if (this.appRoot) {
            this.appRoot.inert = false;
            this.appRoot.removeAttribute("aria-hidden");
        }
        // Devolver el foco a la entrada de la enciclopedia que la abrio.
        const back = this._lastFocused;
        this._lastFocused = null;
        if (back && typeof back.focus === "function" && document.contains(back)) {
            back.focus();
        }
    }
}
