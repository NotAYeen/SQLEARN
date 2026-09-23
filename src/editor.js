export class SQLEditor {
    constructor(textAreaId) {
        this.textAreaId = textAreaId;
        this.editor = null;
    }

    init() {
        const textArea = document.getElementById(this.textAreaId);
        if (!textArea) {
            console.error("No se encontró el textarea para CodeMirror.");
            return;
        }

        const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'monokai';
        this.editor = window.CodeMirror.fromTextArea(textArea, {
            mode: "text/x-sql",
            lineNumbers: true,
            indentWithTabs: true,
            smartIndent: true,
            lineWrapping: true,
            matchBrackets: true,
            autofocus: true,
            theme: theme 
        });

        // Make the editor accessible: CodeMirror 5 replaces the textarea
        const wrapper = this.editor.getWrapperElement();
        wrapper.setAttribute('role', 'application');
        wrapper.setAttribute('aria-label', 'Editor de código SQL');
        wrapper.setAttribute('aria-multiline', 'true');

        // Configurar un atajo para ejecutar (Ctrl+Enter) y autocompletar (Ctrl-Space)
        this.editor.setOption("extraKeys", {
            "Ctrl-Enter": () => {
                if(window.sqlSim) {
                    window.sqlSim.runQuery();
                }
            },
            "Ctrl-Space": "autocomplete"
        });

        this.updateHints([]);

        // Disparar autocompletado al escribir
        this.editor.on("inputRead", (cm, change) => {
            if (change.text[0].match(/[a-zA-Z_0-9]/)) {
                if (!cm.state.completionActive) {
                    cm.showHint({ completeSingle: false });
                }
            }
        });

        // Evento de cambio para autoguardado
        this.editor.on("change", () => {
            if (this.onChangeCallback) {
                this.onChangeCallback(this.getValue());
            }
        });
    }

    onChange(callback) {
        this.onChangeCallback = callback;
    }

    updateHints(schema) {
        if (!this.editor) return;
        const tables = {};
        (schema || []).forEach(tbl => {
            const cols = {};
            (tbl.columns || []).forEach(c => {
                const colName = String(c).split(' ')[0];
                cols[colName] = null;
            });
            tables[tbl.table] = cols;
        });
        this.editor.setOption("hintOptions", { tables });
    }

    applyTheme() {
        if (!this.editor) return;
        const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'monokai';
        this.editor.setOption("theme", theme);
    }

    getValue() {
        return this.editor ? this.editor.getValue() : "";
    }

    setValue(val) {
        if(this.editor) {
            this.editor.setValue(val);
        }
    }
}
