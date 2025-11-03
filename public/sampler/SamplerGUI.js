import { WaveformView } from './WaveformView.js';

export class SamplerGUI {
    constructor(engine) {
        this.engine = engine;
        this.grid = document.getElementById('pad-grid');
        this.waveformCanvas = document.getElementById('waveform');
        this.presetSelector = document.getElementById('presetSelector');
        this.waveform = new WaveformView(this.waveformCanvas, (s, e) => {
            if (this.selectedPad !== undefined)
                this.engine.setTrim(this.selectedPad, s, e);
        });
        this.selectedPad = undefined;
    }

    //initialisation de l’interface
    async init() {

        const res = await fetch('http://localhost:3000/api/presets');
        const presets = await res.json();

        presets.forEach(p => {
            const opt = document.createElement('option');
            opt.textContent = p.name;
            opt.value = p.name;
            this.presetSelector.appendChild(opt);
        });

        this.presetSelector.addEventListener('change', e => {
            this.loadPreset(e.target.value);
        });
    }

    //charge un preset complet depuis le serveur
    async loadPreset(name) {
        const res = await fetch(`http://localhost:3000/api/presets/${encodeURIComponent(name)}`);
        const preset = await res.json();
        const urls = preset.samples.map(s => `http://localhost:3000/presets/${name}/${encodeURIComponent(s.url.split('/').pop())}`);

        this.createPads(preset.samples.map(s => s.name));

        await this.engine.loadSamples(urls, (index, percent) => {
            const pad = this.grid.children[index];
            if (pad) {
                pad.style.setProperty('--progress', `${percent}%`);
                if (percent >= 100) pad.classList.remove('loading');
            }
        });
    }

    //crée les 16 pads du sampler
    createPads(names) {
        this.grid.innerHTML = '';
        this.selectedPad = undefined;

        for (let i = 0; i < 16; i++) {
            const pad = document.createElement('div');
            pad.className = 'pad loading';
            pad.textContent = names[i] || 'Empty';
            this.grid.appendChild(pad);

            pad.addEventListener('click', () => {
                if (!this.engine.getBuffer(i)) return; // pas encore chargé
                this.selectedPad = i;
                this.engine.play(i);

                const buffer = this.engine.getBuffer(i);
                if (buffer) {
                    const trim = this.engine.getTrim(i) || { start: 0, end: buffer.duration };
                    this.waveform.draw(buffer, trim.start, trim.end);
                }

                pad.classList.add('loaded');
                setTimeout(() => pad.classList.remove('loaded'), 150);
            });
        }
    }
}
