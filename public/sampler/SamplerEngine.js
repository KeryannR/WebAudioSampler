export class SamplerEngine {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.buffers = [];
        this.trims = new Map();
    }

    //charge plusieurs samples à partir de leurs URLs
    async loadSamples(urls, onProgress) {
        const promises = urls.map((url, i) =>
            this._fetchWithProgress(url, percent => {
                if (onProgress) onProgress(i, percent);
            })
                .then(data => this.audioContext.decodeAudioData(data))
                .catch(err => {
                    console.warn(`Erreur sur ${url}:`, err);
                    return null;
                })
        );

        //attend que tous les samples soient chargés
        this.buffers = await Promise.all(promises);
    }

    //téléchargement d’un sample avec suivi de la progression
    async _fetchWithProgress(url, onProgress) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Erreur ${res.status} sur ${url}`);

        const total = parseInt(res.headers.get("content-length") || "0", 10);
        const reader = res.body.getReader();
        const chunks = [];
        let loaded = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;

            if (total && onProgress) {
                const percent = Math.round((loaded / total) * 100);
                onProgress(percent);
            }
        }

        const blob = new Blob(chunks);
        return await blob.arrayBuffer();
    }

    //joue un sample selon son index
    play(index) {
        const buffer = this.buffers[index];
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        const { start = 0, end = buffer.duration } = this.trims.get(index) || {};
        source.connect(this.audioContext.destination);
        source.start(0, start, end - start);
    }

    //définit les points de découpe d’un sample
    setTrim(index, start, end) {
        this.trims.set(index, { start, end });
    }

    //récupère les points de découpe d’un sample
    getTrim(index) {
        return this.trims.get(index);
    }

    //récupère le buffer audio brut d’un sample
    getBuffer(index) {
        return this.buffers[index];
    }
}
