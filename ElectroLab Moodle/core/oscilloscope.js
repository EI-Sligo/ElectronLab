const Scope = {
    on: false,
    probes: {
        ch1: { x: 50, y: 100, color: '#facc15', compId:null, termId:null },
        ch2: { x: 50, y: 150, color: '#3b82f6', compId:null, termId:null },
        gnd: { x: 50, y: 200, color: '#000', compId:null, termId:null }
    },
    data: { ch1:[], ch2:[] },
    timeBase: 50, // width of screen in samples

    init: () => {
        // Init happens in toggle logic
    },

    toggle: () => {
        Scope.on = !Scope.on;
        document.getElementById('scope-panel').style.display = Scope.on ? 'block' : 'none';
        document.getElementById('btn-scope').classList.toggle('active');
    },

    drawProbes: (ctx) => {
        if(!Scope.on) return;
        ['ch1', 'ch2', 'gnd'].forEach(k => {
            const p = Scope.probes[k];
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.moveTo(-5,-15); ctx.lineTo(5,-15); ctx.lineTo(0,0); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.textAlign="center"; ctx.font="10px Arial";
            ctx.fillText(k.toUpperCase(), 0, -20);
            ctx.restore();
        });
    },

    update: () => {
        if(!Scope.on || !Engine.powerOn) return;
        
        // Get Voltages relative to GND probe
        const vGnd = Scope.probes.gnd.compId ? Engine.getPotential(Scope.probes.gnd.compId, Scope.probes.gnd.termId) : 0;
        
        const v1 = Scope.probes.ch1.compId ? Engine.getPotential(Scope.probes.ch1.compId, Scope.probes.ch1.termId) - vGnd : 0;
        const v2 = Scope.probes.ch2.compId ? Engine.getPotential(Scope.probes.ch2.compId, Scope.probes.ch2.termId) - vGnd : 0;

        Scope.data.ch1.push(v1);
        Scope.data.ch2.push(v2);
        
        if(Scope.data.ch1.length > 200) Scope.data.ch1.shift();
        if(Scope.data.ch2.length > 200) Scope.data.ch2.shift();
    },

    renderScreen: () => {
        if(!Scope.on) return;
        const canvas = document.getElementById('scopeCanvas');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = "#000"; ctx.fillRect(0,0,w,h);
        
        // Grid
        ctx.strokeStyle = "#1f2937"; ctx.lineWidth=1;
        ctx.beginPath();
        for(let x=0; x<w; x+=20) { ctx.moveTo(x,0); ctx.lineTo(x,h); }
        for(let y=0; y<h; y+=20) { ctx.moveTo(0,y); ctx.lineTo(w,y); }
        ctx.stroke();

        // Draw Channel 1 (Yellow)
        ctx.strokeStyle = "#facc15"; ctx.lineWidth=2; ctx.beginPath();
        Scope.data.ch1.forEach((v, i) => {
            const x = i * (w/200);
            const y = (h/2) - (v * 5); // Scale: 5px per volt
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();

        // Draw Channel 2 (Blue)
        ctx.strokeStyle = "#3b82f6"; ctx.beginPath();
        Scope.data.ch2.forEach((v, i) => {
            const x = i * (w/200);
            const y = (h/2) - (v * 5);
            if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
    }
};