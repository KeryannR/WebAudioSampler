export class WaveformView {
    constructor(canvas, onTrimChange) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onTrimChange = onTrimChange;
        this.start = 0;
        this.end = 0;
        this.buffer = null;
        this.dragging = null;
        this.HIT_ZONE = 10;

        canvas.addEventListener('mousedown', e => this.onMouseDown(e));
        canvas.addEventListener('mousemove', e => this.onMouseMove(e));
        canvas.addEventListener('mouseup', () => this.onMouseUp());
        canvas.addEventListener('mouseleave', () => this.onMouseUp());
    }

    //dessine la forme d’onde d’un buffer audio
    draw(buffer, start = 0, end = buffer.duration) {
        this.buffer = buffer;
        this.start = start;
        this.end = end;

        const { ctx, canvas } = this;
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / canvas.width);
        const amp = canvas.height / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, amp);

        for (let i = 0; i < canvas.width; i++) {
            let min = 1.0, max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.lineTo(i, (1 + min) * amp);
        }

        ctx.strokeStyle = '#1e90ff';
        ctx.stroke();

        this.drawTrims();
    }

    //dessine les zones de sélection (trim)
    drawTrims() {
        const { ctx, canvas, buffer } = this;
        if (!buffer) return;

        const xStart = (this.start / buffer.duration) * canvas.width;
        const xEnd = (this.end / buffer.duration) * canvas.width;

        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(xStart, 0, xEnd - xStart, canvas.height);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(xStart - 1, 0, 3, canvas.height);
        ctx.fillRect(xEnd - 2, 0, 3, canvas.height);
    }

    //clic souris pour initier un glissement
    onMouseDown(e) {
        if (!this.buffer) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / this.canvas.width) * this.buffer.duration;

        const xStart = (this.start / this.buffer.duration) * this.canvas.width;
        const xEnd = (this.end / this.buffer.duration) * this.canvas.width;

        if (Math.abs(x - xStart) < this.HIT_ZONE) {
            this.dragging = 'start';
        } else if (Math.abs(x - xEnd) < this.HIT_ZONE) {
            this.dragging = 'end';
        } else if (x > xStart && x < xEnd) {
            this.dragging = 'region';
            this.dragOffset = time - this.start;
        }
    }

    //déplacement souris -> mise à jour du trim
    onMouseMove(e) {
        if (!this.buffer) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = Math.max(0, Math.min(this.buffer.duration, (x / this.canvas.width) * this.buffer.duration));

        const xStart = (this.start / this.buffer.duration) * this.canvas.width;
        const xEnd = (this.end / this.buffer.duration) * this.canvas.width;

        if (!this.dragging) {
            if (Math.abs(x - xStart) < this.HIT_ZONE || Math.abs(x - xEnd) < this.HIT_ZONE) {
                this.canvas.style.cursor = 'ew-resize';
            } else if (x > xStart && x < xEnd) {
                this.canvas.style.cursor = 'grab';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }

        if (!this.dragging) return;

        if (this.dragging === 'start') {
            this.start = Math.min(time, this.end - 0.01);
        } else if (this.dragging === 'end') {
            this.end = Math.max(time, this.start + 0.01);
        } else if (this.dragging === 'region') {
            const length = this.end - this.start;
            let newStart = time - this.dragOffset;
            let newEnd = newStart + length;

            if (newStart < 0) {
                newEnd -= newStart;
                newStart = 0;
            }
            if (newEnd > this.buffer.duration) {
                newStart -= (newEnd - this.buffer.duration);
                newEnd = this.buffer.duration;
            }

            this.start = newStart;
            this.end = newEnd;
        }

        this.draw(this.buffer, this.start, this.end);
        if (this.onTrimChange) this.onTrimChange(this.start, this.end);
    }

    //relâchement de la souris
    onMouseUp() {
        this.dragging = null;
        this.canvas.style.cursor = 'default';
    }
}
