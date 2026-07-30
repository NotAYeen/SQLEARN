import { App } from './App.js';

document.addEventListener('DOMContentLoaded', () => {
    const sqlSim = new App();
    sqlSim.init();
    
    // Opcional: exponer a window si algo necesita debugging
    window.sqlSim = sqlSim;
});
