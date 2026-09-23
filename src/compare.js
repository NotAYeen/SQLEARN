function normalizeValue(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
        const trimmed = v.trim();
        const n = Number(trimmed);
        if (trimmed !== '' && !Number.isNaN(n) && String(n) === trimmed) {
            return n;
        }
        return v;
    }
    return v;
}

function canonicalizeRow(row) {
    return (row || []).map(normalizeValue);
}

function canonicalJSON(row) {
    return JSON.stringify(canonicalizeRow(row));
}

function rowsExactEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (canonicalJSON(a[i]) !== canonicalJSON(b[i])) return false;
    }
    return true;
}

function rowsMultisetEqual(a, b) {
    if (a.length !== b.length) return false;
    const sortA = a.map(canonicalJSON).sort();
    const sortB = b.map(canonicalJSON).sort();
    for (let i = 0; i < sortA.length; i++) {
        if (sortA[i] !== sortB[i]) return false;
    }
    return true;
}

function formatRow(row) {
    return '[' + canonicalizeRow(row).map(v => v === null ? 'NULL' : JSON.stringify(v)).join(', ') + ']';
}

// Devuelve { match, orderMismatch, message }
function compareAnswer(actual, expected) {
    const expectedRows = expected || [];
    const actualRows = actual || [];

    if (expectedRows.length === 0) {
        if (actualRows.length === 0) {
            return { match: true, orderMismatch: false, message: '' };
        }
        return {
            match: false,
            orderMismatch: false,
            message: `La misión no requiere filas devueltas y obtuviste ${actualRows.length} fila(s).`
        };
    }

    if (rowsExactEqual(actualRows, expectedRows)) {
        return { match: true, orderMismatch: false, message: '' };
    }

    if (rowsMultisetEqual(actualRows, expectedRows)) {
        return {
            match: true,
            orderMismatch: true,
            message: 'Tus filas y valores coinciden con la solución. Solo difiere el orden de las filas (puedes usar ORDER BY si quieres fijarlo).'
        };
    }

    const parts = [];
    if (expectedRows.length !== actualRows.length) {
        parts.push(`Se esperaban ${expectedRows.length} fila(s) y se obtuvieron ${actualRows.length}.`);
    }

    const maxLen = Math.max(expectedRows.length, actualRows.length);
    for (let i = 0; i < maxLen; i++) {
        const expRow = expectedRows[i];
        const actRow = actualRows[i];
        if (expRow === undefined || actRow === undefined) continue;
        if (canonicalJSON(expRow) !== canonicalJSON(actRow)) {
            parts.push(`La fila ${i + 1} no coincide.`);
            parts.push(`Esperado: ${formatRow(expRow)}`);
            parts.push(`Obtenido: ${formatRow(actRow)}`);
            break;
        }
    }

    return { match: false, orderMismatch: false, message: parts.join('\n') || 'Los resultados no coinciden con la solución esperada.' };
}

export { normalizeValue, canonicalizeRow, canonicalJSON, rowsExactEqual, rowsMultisetEqual, compareAnswer };