import { describe, it, expect, beforeAll } from 'vitest';
import { LEVELS } from '../src/levels.js';
import { buildSQL, validateLevels } from '../scripts/validate-levels.mjs';
import { compareAnswer, rowsExactEqual, rowsMultisetEqual } from '../src/compare.js';

let SQL;

beforeAll(async () => {
    SQL = await buildSQL();
}, 20000);

describe('compareAnswer', () => {
    it('coincide en el mismo orden', () => {
        const cmp = compareAnswer([["a", 1]], [["a", 1]]);
        expect(cmp.match).toBe(true);
        expect(cmp.orderMismatch).toBe(false);
    });

    it('normaliza numéricos (22500.0 === 22500)', () => {
        const cmp = compareAnswer([[22500.0]], [[22500]]);
        expect(cmp.match).toBe(true);
    });

    it('detecta coincidencia de valores con orden distinto', () => {
        const cmp = compareAnswer([["b", 2], ["a", 1]], [["a", 1], ["b", 2]]);
        expect(cmp.match).toBe(true);
        expect(cmp.orderMismatch).toBe(true);
    });

    it('reporta filas esperadas vs obtenidas', () => {
        const cmp = compareAnswer([["a", 1]], [["a", 1], ["b", 2]]);
        expect(cmp.match).toBe(false);
        expect(cmp.message).toContain('2 fila(s)');
    });
});

describe('validación de niveles', () => {
    it('todos los niveles son válidos frente a sql.js', async () => {
        const results = validateLevels(SQL);
        const failed = results.filter(r => !r.ok);
        const details = failed.map(f => `Nivel ${f.index + 1} (${f.id}):\n${f.problems.map(p => `   - ${p}`).join('\n')}`).join('\n');
        expect(failed, `Niveles fallidos:\n${details}`).toHaveLength(0);
    });

    it('existen 25 niveles', () => {
        expect(LEVELS).toHaveLength(25);
    });
});