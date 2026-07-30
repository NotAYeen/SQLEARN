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
        this.editor = CodeMirror.fromTextArea(textArea, {
            mode: "text/x-sql",
            lineNumbers: true,
            indentWithTabs: true,
            smartIndent: true,
            lineWrapping: true,
            matchBrackets: true,
            autofocus: true,
            theme: theme 
        });

        // Configurar un atajo para ejecutar (Ctrl+Enter) y autocompletar (Ctrl-Space)
        this.editor.setOption("extraKeys", {
            "Ctrl-Enter": () => {
                if(window.AppController) {
                    window.AppController.runQuery();
                }
            },
            "Ctrl-Space": "autocomplete"
        });

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

    getValue() {
        return this.editor ? this.editor.getValue() : "";
    }

    setValue(val) {
        if(this.editor) {
            this.editor.setValue(val);
        }
    }
}
