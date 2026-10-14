import { Storage } from './storage.js';
import { AudioFX } from './AudioFX.js';

// El toast vivia con Object.assign(toast.style, {...}) y un <style> inyectado
// en runtime, con su propio dorado (#ffd700 / #8b6508) fuera del sistema de
// tokens. Era el unico componente que no respondia a los cambios de tema.
// Ahora el estilo esta en css/style.css (.retro-toast) y aqui solo el contenido.
const TOAST_MS = 5000;
const EXIT_MS = 490;

export class AchievementsManager {
    constructor() {
        this.achievements = JSON.parse(Storage.getItem('sql_sim_achievements', '{}') || '{}');
        this.definitions = {
            'first_blood': { title: 'Primera Sangre', desc: 'Completaste tu primer nivel.' },
            'detective': { title: 'Detective', desc: 'Completaste una auditoría exitosamente.' },
            'puzzle_master': { title: 'Puzzle Master', desc: 'Ensamblaste tu primera consulta.' },
            'nsa_hacker': { title: 'NSA Hacker', desc: 'Venciste a la NSA. Eres el maestro de las subconsultas.' },
            'half_way': { title: 'A Medio Camino', desc: 'Llegaste a la mitad del curso.' }
        };
        this.setupContainer();
    }

    setupContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('role', 'status');
            container.setAttribute('aria-live', 'polite');
            container.setAttribute('aria-atomic', 'true');
            document.body.appendChild(container);
        }
    }

    unlock(id) {
        if (this.achievements[id] || !this.definitions[id]) return;

        this.achievements[id] = true;
        Storage.setItem('sql_sim_achievements', JSON.stringify(this.achievements));

        this.showToast(this.definitions[id]);
    }

    showToast(achievement) {
        const toast = document.createElement('div');
        toast.className = 'retro-toast';

        const icon = document.createElement('i');
        icon.className = 'ph-fill ph-trophy';
        icon.setAttribute('aria-hidden', 'true');

        const text = document.createElement('div');
        const label = document.createElement('div');
        label.className = 'retro-toast-label';
        label.textContent = 'Logro desbloqueado';
        const title = document.createElement('div');
        title.className = 'retro-toast-title';
        title.textContent = achievement.title;
        text.appendChild(label);
        text.appendChild(title);

        toast.appendChild(icon);
        toast.appendChild(text);

        document.getElementById('toast-container').appendChild(toast);
        AudioFX.unlock();

        const dismiss = () => {
            if (!toast.isConnected) return;
            toast.classList.add('retro-toast-leaving');
            setTimeout(() => toast.remove(), EXIT_MS);
        };
        setTimeout(dismiss, TOAST_MS);
        toast.addEventListener('click', dismiss);
    }
}