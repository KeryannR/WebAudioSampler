import { SamplerEngine } from './sampler/SamplerEngine.js';
import { SamplerGUI } from './sampler/SamplerGUI.js';

let started = false;

//démarrage du sampler au premier clic utilisateur
window.addEventListener('click', async () => {
    if (started) return;
    started = true;

    console.log("Initializing sampler...");
    const audioContext = new AudioContext();

    const engine = new SamplerEngine(audioContext);
    const gui = new SamplerGUI(engine);
    await gui.init();

    console.log("Sampler ready");
});