import { LEVELS } from './levels.js';

export class LevelLoader {
    constructor() {
        this.levels = [];
        this.totalLevels = 25;
    }

    async fetchAllLevels() {
        this.levels = LEVELS;
        return this.levels;
    }

    getLevel(index) {
        return this.levels[index];
    }
}
