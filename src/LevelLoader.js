export class LevelLoader {
    constructor() {
        this.levels = [];
        this.totalLevels = 25;
    }

    async fetchAllLevels() {
        this.levels = [];
        for (let i = 1; i <= this.totalLevels; i++) {
            const idx = i.toString().padStart(2, '0');
            try {
                const res = await fetch(`niveles/escenario_${idx}.json`);
                if (res.ok) {
                    const data = await res.json();
                    this.levels.push(data);
                }
            } catch (e) {
                console.error(`Error loading level ${idx}`, e);
            }
        }
        return this.levels;
    }

    getLevel(index) {
        return this.levels[index];
    }
}
