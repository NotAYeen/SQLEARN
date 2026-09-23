import { fileURLToPath } from 'node:url';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { LEVELS } from '../src/levels.js';
import { compareAnswer } from '../src/compare.js';

const here = path.dirname(fileURLToPath(import.meta.url));

const collapseWs = (s) => String(s || '').replace(/\s+/g, '');

// Carga sql.js apuntando al .wasm empaquetado en node_modules.
export async function buildSQL() {
    return initSqlJs({
        locateFile: (file) => path.join(here, '..', 'node_modules', 'sql.js', 'dist', file)
    });
}

function lastResultSet(res) {
    for (let i = res.length - 1; i >= 0; i--) {
        if (res[i] && res[i].columns && res[i].columns.length > 0) return res[i];
    }
    return null;
}

// Comprueba si los bloques (en ALGUNA permutación) reconstruyen la consulta esperada.
// Los bloques de los niveles DND se barajan en tiempo de ejecución, así que el orden
// en el JSON no tiene por qué ser el de la solución.
function canAssemble(blocks, goalCollapsed) {
    const n = blocks.length;
    const used = new Array(n).fill(false);
    const search = (acc) => {
        if (acc.length > goalCollapsed.length) return false;
        if (acc === goalCollapsed) return true;
        if (!goalCollapsed.startsWith(acc)) return false;
        for (let i = 0; i < n; i++) {
            if (used[i]) continue;
            used[i] = true;
            if (search(acc + collapseWs(blocks[i]))) return true;
            used[i] = false;
        }
        return false;
    };
    return search('');
}

// Valida todos los niveles. Devuelve array de { index, id, ok, problems }.
export function validateLevels(SQL) {
    const results = [];
    LEVELS.forEach((level, i) => {
        const problems = [];
        const db = new SQL.Database();

        try {
            db.run(level.init_db_sql);
        } catch (e) {
            problems.push(`init_db_sql no se ejecuta: ${e.message}`);
        }

        const isAudit = level.modalidad === "Audit" || level.modalidad === "Auditoría";
        const isDnd = level.modalidad === "DND" || level.modalidad === "Ensamblaje";

        if (isAudit) {
            if (!Array.isArray(level.audit_tokens) || level.audit_tokens.length === 0) {
                problems.push('audit_tokens vacíos o ausentes');
            }
            if (!Number.isInteger(level.token_error_index) ||
                level.token_error_index < 0 ||
                level.token_error_index >= (level.audit_tokens || []).length) {
                problems.push('token_error_index fuera de rango');
            }
        }

        if (isDnd) {
            if (!Array.isArray(level.dnd_blocks) || level.dnd_blocks.length === 0) {
                problems.push('dnd_blocks vacíos o ausentes');
            }
            if (level.expected_query) {
                if (!canAssemble(level.dnd_blocks || [], collapseWs(level.expected_query))) {
                    problems.push('dnd_blocks no pueden reconstruir expected_query en ningún orden');
                }
            }
        }

        if (level.expected_query) {
            try {
                const res = db.exec(level.expected_query);
                const frame = lastResultSet(res);
                const values = frame ? frame.values : [];
                const cmp = compareAnswer(values, level.solution_data || []);
                if (!cmp.match) {
                    problems.push(`expected_query <> solution_data: ${cmp.message}`);
                } else if (cmp.orderMismatch) {
                    problems.push('expected_query devuelve las mismas filas, pero en distinto orden al solution_data (probar/definir ORDER BY)');
                }
            } catch (e) {
                problems.push(`expected_query no se ejecuta: ${e.message}`);
            }
        }

        if (level.query_defectuoso) {
            try {
                const res = db.exec(level.query_defectuoso);
                const frame = lastResultSet(res);
                const values = frame ? frame.values : [];
                const cmp = compareAnswer(values, level.solution_data || []);
                if (level.expected_query && cmp.match && !cmp.orderMismatch) {
                    problems.push('query_defectuoso ya produce exactamente la solución (el nivel no tiene reto)');
                }
            } catch (e) {
                // Correcto: un código defectuoso puede no ejecutarse (error de sintaxis).
            }
        }

        db.close();
        results.push({ index: i, id: level.id_nivel, ok: problems.length === 0, problems });
    });
    return results;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    const SQL = await buildSQL();
    const results = validateLevels(SQL);
    let failed = 0;
    for (const r of results) {
        if (r.ok) continue;
        failed++;
        console.log(`[FAIL] Nivel ${r.index + 1} (${r.id})`);
        r.problems.forEach(p => console.log(`   - ${p}`));
    }
    console.log(`\n${results.length - failed}/${results.length} niveles OK.`);
    process.exit(failed ? 1 : 0);
}