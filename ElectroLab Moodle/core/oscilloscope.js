/* core/oscilloscope.js - High Vis + Real Physics */
window.Scope = {
    on: false,
    probes: {
        ch1: { x: 50, y: 100, color: '#facc15', compId:null, termId:null },
        ch2: { x: 50, y: 150, color: '#3b82f6', compId:null, termId:null },
        gnd: { x: 50, y: 200, color: '#000', compId:null, termId:null }
    },
    data: { ch1:[], ch2:[] },

    toggle: () => {
        window.Scope.on = !window.Scope.on;
        document.getElementById('scope-panel').style.display = window.Scope.on ? 'block' : 'none';
        document.getElementById('btn-scope').classList.toggle('active');
    },

    drawProbes: (ctx) => {
        if(!window.Scope.on) return;
        ['ch1', 'ch2', 'gnd'].forEach(k => {
            const p = window.Scope.probes[k];
            ctx.save(); ctx.translate(p.x, p.y);
            // Big Visibility Triangle
            ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 5;
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-10,-35); ctx.lineTo(10,-35); ctx.lineTo(0,0); ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = "#fff"; ctx.font="bold 12px Arial"; ctx.textAlign="center"; ctx.fillText(k.toUpperCase(), 0, -40);
            ctx.restore();
        });
    },

    update: () => {
        if(!window.Scope.on || !Engine.powerOn) return;
        // Request INSTANT voltage for waveform
        const vGnd = window.Scope.probes.gnd.compId ? Engine.getPotential(window.Scope.probes.gnd.compId, window.Scope.probes.gnd.termId, 'instant') : 0;
        const v1 = window.Scope.probes.ch1.compId ? Engine.getPotential(window.Scope.probes.ch1.compId, window.Scope.probes.ch1.termId, 'instant') - vGnd : 0;
        const v2 = window.Scope.probes.ch2.compId ? Engine.getPotential(window.Scope.probes.ch2.compId, window.Scope.probes.ch2.termId, 'instant') - vGnd : 0;

        window.Scope.data.ch1.push(v1);
        window.Scope.data.ch2.push(v2);
        
        if(window.Scope.data.ch1.length > 200) window.Scope.data.ch1.shift();
        if(window.Scope.data.ch2.length > 200) window.Scope.data.ch2.shift();
    },

    renderScreen: () => {
        if(!window.Scope.on) return;
        const canvas = document.getElementById('scopeCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width; const h = canvas.height;

        let maxV = 10; 
        [...window.Scope.data.ch1, ...window.Scope.data.ch2].forEach(v => { if(Math.abs(v) > maxV) maxV = Math.abs(v); });
        const scale = (h / 2 * 0.9) / maxV;

        ctx.fillStyle = "#000"; ctx.fillRect(0,0,w,h);
        ctx.strokeStyle = "#1f2937"; ctx.lineWidth=1; ctx.beginPath();
        for(let x=0; x<w; x+=20) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
        for(let y=0; y<h; y+=20) { ctx.moveTo(0,y); ctx.lineTo(w,y); }
        ctx.stroke();

        ctx.strokeStyle = "#facc15"; ctx.lineWidth=2; ctx.beginPath();
        window.Scope.data.ch1.forEach((v, i) => {
            const x = i * (w/200); const y = (h/2) - (v * scale);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();

        ctx.strokeStyle = "#3b82f6"; ctx.beginPath();
        window.Scope.data.ch2.forEach((v, i) => {
            const x = i * (w/200); const y = (h/2) - (v * scale);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();

        ctx.fillStyle = "#fff"; ctx.fillText(`Scale: +/- ${Math.ceil(maxV)}V`, 10, 15);
    }
};