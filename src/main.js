import { App } from './App.js';

const initApp = () => {
    const sqlSim = new App();
    sqlSim.init();
    window.sqlSim = sqlSim;
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
