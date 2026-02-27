/* DOMESTIC COMPONENTS - REALISTIC SWITCHES & IRISH LAYOUT */
/* UPDATES: Analog Timer, Hover Labels (supported by renderer), No Fake Screws */

// --- HELPER FOR REALISTIC ROCKER SWITCHES ---
const drawRealisticRocker = (ctx, x, y, w, h, state) => {
    ctx.save();
    ctx.translate(x, y);

    // 1. Base Plate
    ctx.shadowColor = "rgba(0,0,0,0.15)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#fdfdfd";
    ctx.beginPath(); ctx.roundRect(0, 0, w, h, 4); ctx.fill();
    ctx.shadowColor = "transparent";

    // 2. Rocker Mechanism
    const rx = w * 0.2; const rw = w * 0.6;
    const ry = h * 0.2; const rh = h * 0.6;

    // 3. The Rocker
    ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, 2);
    
    if (state.on) {
        // Pressed DOWN
        const grd = ctx.createLinearGradient(rx, ry, rx, ry + rh);
        grd.addColorStop(0, "#f1f5f9"); grd.addColorStop(1, "#e2e8f0"); 
        ctx.fillStyle = grd; ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(rx, ry, rw, 3);
    } else {
        // Pressed UP
        const grd = ctx.createLinearGradient(rx, ry, rx, ry + rh);
        grd.addColorStop(0, "#e2e8f0"); grd.addColorStop(1, "#f1f5f9"); 
        ctx.fillStyle = grd; ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(rx, ry + rh - 3, rw, 3);
    }
    ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 0.5; ctx.stroke();
    ctx.restore();
};

// ... [Keep Distribution Board, Mains, Fuse, RCD, SPD unchanged from previous version] ...
// 1. DISTRIBUTION BOARD
Engine.register({
    type: 'db_board',
    label: 'DB Board',
    category: 'Domestic',
    size: { w: 550, h: 500 },
    terminals: [], 
    render: (ctx, state, tools) => {
        const grd = ctx.createLinearGradient(0, 0, 550, 500);
        grd.addColorStop(0, "#f1f5f9"); grd.addColorStop(1, "#cbd5e1");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.roundRect(0, 0, 550, 500, 12); ctx.fill();
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 4; ctx.stroke();
        const drawRail = (y) => {
            const railGrd = ctx.createLinearGradient(0, y, 0, y+30);
            railGrd.addColorStop(0, "#64748b"); railGrd.addColorStop(0.5, "#94a3b8"); railGrd.addColorStop(1, "#64748b");
            ctx.fillStyle = railGrd; ctx.fillRect(20, y, 510, 35);
            ctx.fillStyle = "#000"; for(let i=40; i<500; i+=50) { ctx.beginPath(); ctx.arc(i, y+17, 2, 0, Math.PI*2); ctx.fill(); }
        };
        drawRail(145); drawRail(345);
        tools.text(ctx, 'HAGER DISTRIBUTION BOARD', 275, 480, '#64748b', 18, "bold");
    }
});

// 2. SERVICE HEAD
Engine.register({
    type: 'service_head',
    label: 'Mains',
    role: 'source',
    size: { w: 90, h: 110 },
    terminals: [ {id:'L', x:25, y:90}, {id:'N', x:65, y:90}, {id:'E', x:45, y:90} ],
    getInternalPaths: () => [['N', 'E']],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 90, 110, "#1f2937");
        ctx.fillStyle = "#ef4444"; ctx.fillRect(15, 15, 60, 30);
        tools.text(ctx, 'DANGER', 45, 25, '#fff', 10); tools.text(ctx, '230V', 45, 38, '#fff', 12);
        tools.plasticRect(ctx, 15, 50, 60, 30, "#000");
        tools.text(ctx, '100A', 45, 65, '#94a3b8', 12);
    }
});

// 3. MAIN FUSE (Bottom Fed)
Engine.register({
    type: 'main_fuse',
    label: 'Main Fuse',
    role: 'switch',
    hasSwitch: true,
    size: { w: 100, h: 140 },
    terminals: [ {id:'Lout', x:25, y:20}, {id:'Nout', x:85, y:20}, {id:'Lin', x:25, y:120}, {id:'Nin', x:85, y:120} ],
    getInternalPaths: (state) => state.on ? [['Lin', 'Lout'], ['Nin', 'Nout']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 140, "#fff");
        tools.plasticRect(ctx, 15, 40, 70, 60, "#f1f5f9", false);
        tools.toggle(ctx, 35, 50, 30, 40, state.on, "#000");
        ctx.fillStyle = state.on ? '#ef4444' : '#22c55e'; ctx.fillRect(40, 105, 20, 8);
        tools.text(ctx, 'MAIN SW', 50, 15, '#334155', 10);
    }
});

// 4. RCD (Bottom Fed)
Engine.register({
    type: 'rcd',
    label: 'RCD',
    role: 'switch',
    hasSwitch: true,
    size: { w: 110, h: 130 },
    terminals: [ {id:'Lout', x:25, y:20}, {id:'Nout', x:85, y:20}, {id:'Lin', x:25, y:110}, {id:'Nin', x:85, y:110} ],
    getInternalPaths: (state) => state.on ? [['Lin', 'Lout'], ['Nin', 'Nout']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 110, 130, "#f8fafc");
        ctx.fillStyle = "#e2e8f0"; ctx.fillRect(10, 35, 90, 60);
        tools.toggle(ctx, 45, 40, 20, 35, state.on, "#000");
        ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.roundRect(80, 45, 15, 10, 2); ctx.fill();
        tools.text(ctx, 'T', 87.5, 50, '#713f12', 8);
        tools.text(ctx, 'RCD', 25, 50, '#64748b', 10); 
    }
});

// 7. SPD Module
Engine.register({
    type: 'spd_module',
    label: 'SPD',
    category: 'Domestic',
    size: { w: 60, h: 130 },
    terminals: [ {id:'L', x:20, y:115}, {id:'N', x:40, y:115}, {id:'E', x:30, y:15} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 130, "#fff");
        ctx.fillStyle = "#3b82f6"; ctx.fillRect(0, 0, 60, 10);
        tools.plasticRect(ctx, 5, 25, 50, 80, "#f8fafc", false);
        tools.text(ctx, 'SPD', 30, 45, '#000', 12, "bold"); 
        tools.text(ctx, 'T2', 30, 60, '#ef4444', 10, "bold");
        ctx.fillStyle = "#22c55e"; ctx.fillRect(20, 80, 20, 10);
    }
});

// 8. SWITCH 1-WAY
Engine.register({
    type: 'sw_1way',
    label: 'Switch 1W',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 90 },
    terminals: [ {id:'C', x:45, y:20}, {id:'L1', x:45, y:70}, {id:'E', x:75, y:20} ],
    getInternalPaths: (state) => state.on ? [['C', 'L1']] : [],
    render: (ctx, state, tools) => {
        drawRealisticRocker(ctx, 0, 0, 90, 90, state);
    }
});

// 9. SWITCH 2-WAY
Engine.register({
    type: 'sw_2way',
    label: 'Switch 2W',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 90 },
    terminals: [ {id:'C', x:45, y:20}, {id:'L1', x:25, y:70}, {id:'L2', x:65, y:70}, {id:'E', x:75, y:20} ],
    getInternalPaths: (state) => state.on ? [['C', 'L2']] : [['C', 'L1']],
    render: (ctx, state, tools) => {
        drawRealisticRocker(ctx, 0, 0, 90, 90, state);
    }
});

// 10. INTERMEDIATE SWITCH
Engine.register({
    type: 'sw_inter',
    label: 'Intermediate',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 90 },
    terminals: [ {id:'L1in', x:20, y:20}, {id:'L2in', x:70, y:20}, {id:'L1out', x:20, y:70}, {id:'L2out', x:70, y:70} ],
    getInternalPaths: (state) => state.on ? [['L1in', 'L2out'], ['L2in', 'L1out']] : [['L1in', 'L1out'], ['L2in', 'L2out']],
    render: (ctx, state, tools) => {
        drawRealisticRocker(ctx, 0, 0, 90, 90, state);
        tools.text(ctx, 'INT', 45, 80, '#94a3b8', 10);
    }
});

// 11. SOCKET
Engine.register({
    type: 'socket',
    label: 'Socket',
    role: 'load',
    size: { w: 100, h: 100 },
    terminals: [ {id:'L', x:25, y:80}, {id:'N', x:75, y:80}, {id:'E', x:50, y:20} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 100, "#fff");
        ctx.fillStyle = "#1f2937"; ctx.beginPath(); ctx.roundRect(42, 30, 16, 20, 2); ctx.fill();
        ctx.fillRect(20, 60, 20, 12); ctx.fillRect(60, 60, 20, 12);
        tools.toggle(ctx, 75, 10, 15, 20, state.lit, "#fff");
        if(state.lit) { ctx.fillStyle = "red"; ctx.fillRect(78, 12, 9, 4); }
    }
});

// 12. LAMP
Engine.register({
    type: 'lamp',
    label: 'Lamp',
    role: 'load',
    size: { w: 80, h: 100 },
    terminals: [ {id:'L', x:25, y:15}, {id:'N', x:55, y:15}, {id:'E', x:40, y:15} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 10, 0, 60, 30, "#fff");
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(40, 30); ctx.lineTo(40, 60); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.fillRect(30, 60, 20, 15);
        const color = state.lit ? "#fef08a" : "#e2e8f0";
        ctx.fillStyle = color; ctx.shadowColor = state.lit ? "#facc15" : "transparent"; ctx.shadowBlur = state.lit ? 20 : 0;
        ctx.beginPath(); ctx.arc(40, 85, 15, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth=1; ctx.stroke();
    }
});

// 13. COOKER SWITCH
Engine.register({
    type: 'cooker_sw',
    label: 'Cooker Sw',
    role: 'switch',
    hasSwitch: true,
    size: { w: 100, h: 140 },
    terminals: [ {id:'Lin', x:20, y:20}, {id:'Nin', x:80, y:20}, {id:'Ein', x:50, y:20}, {id:'Lout', x:20, y:120}, {id:'Nout', x:80, y:120}, {id:'Eout', x:50, y:120} ],
    getInternalPaths: (state) => state.on ? [['Lin', 'Lout'], ['Nin', 'Nout'], ['Ein', 'Eout']] : [['Ein', 'Eout']],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 140, "#fff");
        ctx.save(); ctx.translate(20, 50);
        const rockerColor = state.on ? "#dc2626" : "#ef4444";
        const grd = ctx.createLinearGradient(0, 0, 60, 0); grd.addColorStop(0, rockerColor); grd.addColorStop(0.5, "#fca5a5"); grd.addColorStop(1, rockerColor);
        ctx.fillStyle = grd; ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 5; ctx.beginPath(); ctx.roundRect(0, 0, 60, 60, 4); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.1)"; if(state.on) ctx.fillRect(0, 0, 60, 30); else ctx.fillRect(0, 30, 60, 30);
        ctx.restore();
        ctx.fillStyle = state.on ? "#ef4444" : "#451a03"; if(state.on) { ctx.shadowColor = "red"; ctx.shadowBlur = 10; }
        ctx.fillRect(40, 30, 20, 10); ctx.shadowBlur = 0;
        tools.text(ctx, 'COOKER', 50, 130, '#94a3b8', 10);
    }
});

// 14. FAN
Engine.register({
    type: 'fan',
    label: 'Fan',
    role: 'load',
    size: { w: 100, h: 100 },
    terminals: [ {id:'L', x:30, y:80}, {id:'N', x:70, y:80}, {id:'SL', x:50, y:80} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 100, "#fff");
        ctx.fillStyle = "#f1f5f9"; ctx.beginPath(); ctx.arc(50, 40, 35, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.stroke();
        ctx.save(); ctx.translate(50, 40); if(state.lit) ctx.rotate((Date.now() / 50) % (Math.PI * 2));
        ctx.fillStyle = "#94a3b8"; for(let i=0; i<5; i++) { ctx.rotate((Math.PI * 2) / 5); ctx.beginPath(); ctx.ellipse(0, -15, 8, 20, 0, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }
});

// 15. JUNCTION BOX
Engine.register({
    type: 'junction_box',
    label: 'Junction Box',
    role: 'passive',
    size: { w: 90, h: 90 },
    terminals: [
        {id:'L1', x:25, y:25}, {id:'L2', x:45, y:25}, {id:'L3', x:65, y:25},
        {id:'N1', x:25, y:45}, {id:'N2', x:45, y:45}, {id:'N3', x:65, y:45},
        {id:'S1', x:25, y:65}, {id:'S2', x:45, y:65}, {id:'E', x:80, y:80}
    ],
    getInternalPaths: () => [['L1','L2'],['L2','L3'],['L1','L3'],['N1','N2'],['N2','N3'],['N1','N3'],['S1','S2']],
    render: (ctx, state, tools) => {
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 5;
        const grd = ctx.createRadialGradient(45, 45, 10, 45, 45, 45); grd.addColorStop(0, "#fff"); grd.addColorStop(1, "#f1f5f9");
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(45, 45, 45, 0, Math.PI*2); ctx.fill(); ctx.restore();
        tools.text(ctx, 'JB', 45, 45, '#cbd5e1', 20, "bold");
    }
});

// 16. IMMERSION SWITCH
Engine.register({
    type: 'sw_sink_bath',
    label: 'Immersion Sw',
    role: 'switch',
    hasSwitch: true,
    size: { w: 110, h: 130 },
    terminals: [ {id:'C', x:55, y:30}, {id:'Sink', x:30, y:100}, {id:'Bath', x:80, y:100}, {id:'E', x:100, y:20} ],
    getInternalPaths: (state) => state.on ? [['C', 'Bath']] : [['C', 'Sink']],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 110, 130, "#fff");
        tools.toggle(ctx, 40, 25, 30, 40, true, "#fff");
        tools.text(ctx, 'ISOLATOR', 55, 15, '#64748b', 9);
        ctx.save(); ctx.translate(20, 80); ctx.fillStyle = "#f1f5f9"; ctx.fillRect(0,0,70,30);
        ctx.fillStyle = "#fff"; if(state.on) ctx.fillRect(35,0,35,30); else ctx.fillRect(0,0,35,30); ctx.restore();
        tools.text(ctx, 'SINK', 35, 120, state.on ? '#94a3b8' : '#2563eb', 9); tools.text(ctx, 'BATH', 75, 120, state.on ? '#2563eb' : '#94a3b8', 9);
    }
});

// 17. DUAL IMMERSION HEATER
Engine.register({
    type: 'immersion_dual',
    label: 'Dual Immersion',
    role: 'load',
    size: { w: 140, h: 140 },
    terminals: [ {id:'N', x:30, y:50}, {id:'E', x:30, y:90}, {id:'Sink', x:110, y:50}, {id:'Bath', x:110, y:90} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const grd = ctx.createRadialGradient(70, 70, 10, 70, 70, 60); grd.addColorStop(0, "#fcd34d"); grd.addColorStop(1, "#b45309");
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(70, 70, 60, 0, Math.PI*2); ctx.fill();
        ctx.lineWidth=4; ctx.strokeStyle = "#78350f"; ctx.stroke();
        ctx.beginPath(); for(let i=0; i<6; i++) { const a = i * Math.PI/3; ctx.lineTo(70 + 30*Math.cos(a), 70 + 30*Math.sin(a)); }
        ctx.closePath(); ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth=2; ctx.stroke();
        tools.text(ctx, 'DUAL ELEMENT', 70, 70, 'rgba(0,0,0,0.5)', 10, "bold");
    }
});

// 18. BARS
Engine.register({
    type: 'neutral_bar',
    label: 'Neutral Bar',
    role: 'passive',
    size: { w: 220, h: 40 },
    terminals: Array.from({length:8}, (_,i)=>({id:`N${i}`, x:25+(i*22), y:25})),
    getInternalPaths: () => { const t=[]; for(let i=0;i<7;i++) t.push([`N${i}`,`N${i+1}`]); return t; },
    render: (ctx, state, tools) => {
        const grd = ctx.createLinearGradient(0, 0, 0, 40); grd.addColorStop(0, "#e2e8f0"); grd.addColorStop(1, "#94a3b8");
        tools.plasticRect(ctx, 0, 0, 220, 40, "#fff"); ctx.fillStyle = grd; ctx.fillRect(10, 10, 200, 20);
    }
});

Engine.register({
    type: 'earth_bar',
    label: 'Earth Bar',
    role: 'passive',
    size: { w: 300, h: 40 },
    terminals: Array.from({length:12}, (_,i)=>({id:`E${i}`, x:25+(i*22), y:25})),
    getInternalPaths: () => { const t=[]; for(let i=0;i<11;i++) t.push([`E${i}`,`E${i+1}`]); return t; },
    render: (ctx, state, tools) => {
        const grd = ctx.createLinearGradient(0, 0, 0, 40); grd.addColorStop(0, "#fcd34d"); grd.addColorStop(1, "#d97706");
        tools.plasticRect(ctx, 0, 0, 300, 40, "#fff"); ctx.fillStyle = grd; ctx.fillRect(10, 10, 280, 20);
    }
});

// 19. MAIN SWITCH (Bottom Fed)
Engine.register({
    type: 'main_switch_100a',
    label: 'Main Switch',
    category: 'Domestic',
    role: 'switch',
    hasSwitch: true,
    size: { w: 70, h: 130 },
    terminals: [ {id:'Lout', x:18, y:15}, {id:'Nout', x:52, y:15}, {id:'Lin', x:18, y:115}, {id:'Nin', x:52, y:115} ],
    getInternalPaths: (state) => state.on ? [['Lin', 'Lout'], ['Nin', 'Nout']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 70, 130, "#fff");
        tools.toggle(ctx, 15, 40, 40, 40, state.on, "red");
        tools.text(ctx, 'MAIN SW', 35, 20, '#000', 10, "bold"); 
        tools.text(ctx, '100A', 35, 95, '#ef4444', 12, "bold");
    }
});

// 23. FUSED CONNECTION UNIT (FCU)
Engine.register({
    type: 'fcu_switched',
    label: 'Fused Spur',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 90 }, 
    terminals: [ 
        {id:'Lin', x:20, y:20}, {id:'Nin', x:70, y:20}, {id:'Ein', x:45, y:20},
        {id:'Lout', x:20, y:70}, {id:'Nout', x:70, y:70}, {id:'Eout', x:45, y:70}
    ],
    getInternalPaths: (state) => state.on ? [['Lin', 'Lout'], ['Nin', 'Nout']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 90, 90, "#fff");
        // Draw Fuse Holder
        ctx.fillStyle = "#e2e8f0"; ctx.fillRect(60, 35, 15, 25);
        ctx.strokeStyle = "#cbd5e1"; ctx.strokeRect(60, 35, 15, 25);
        tools.text(ctx, 'FUSE', 67.5, 47.5, '#94a3b8', 6);
        drawRealisticRocker(ctx, 15, 30, 30, 40, state);
        tools.text(ctx, 'FUSED', 45, 80, '#94a3b8', 8);
    }
});

// 24. SMOKE ALARM (Interlocked)
Engine.register({
    type: 'smoke_alarm',
    label: 'Smoke Alarm',
    role: 'load',
    size: { w: 100, h: 100 },
    terminals: [ {id:'L', x:30, y:50}, {id:'N', x:70, y:50}, {id:'E', x:50, y:20}, {id:'IC', x:50, y:80, label:'IC'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.1)"; ctx.shadowBlur = 10;
        ctx.fillStyle = "#fff"; 
        ctx.beginPath(); ctx.arc(50, 50, 45, 0, Math.PI*2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(50, 50, 30, 0, Math.PI*2); ctx.stroke();
        const ledColor = state.lit ? "#22c55e" : "#86efac";
        ctx.fillStyle = ledColor;
        if(state.lit) { ctx.shadowColor = "#22c55e"; ctx.shadowBlur = 10; }
        ctx.beginPath(); ctx.arc(50, 80, 3, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        tools.text(ctx, 'TEST', 50, 50, '#cbd5e1', 10, "bold");
    }
});

// 25. HAGER TIMER (ANALOG STYLE)
Engine.register({
    type: 'timer_hager',
    label: 'Analog Timer',
    category: 'Domestic',
    role: 'switch',
    hasSwitch: true, // Manual override via switch
    size: { w: 70, h: 130 }, // 2 Modules
    terminals: [
        {id:'L', x:15, y:15, label:'L'}, {id:'N', x:55, y:15, label:'N'}, 
        {id:'1', x:15, y:115, label:'1(C)'}, {id:'2', x:35, y:115, label:'2(NC)'}, {id:'3', x:55, y:115, label:'3(NO)'}
    ],
    getInternalPaths: (state) => state.on ? [['1', '3']] : [['1', '2']],
    render: (ctx, state, tools) => {
        // 1. DIN Body
        tools.plasticRect(ctx, 0, 0, 70, 130, "#f1f5f9"); // Light Grey
        
        // 2. Hager Blue Stripe
        ctx.fillStyle = "#3b82f6"; ctx.fillRect(5, 30, 60, 4);
        tools.text(ctx, ':hager', 50, 38, '#3b82f6', 9, "bold");
        tools.text(ctx, 'EH 110', 15, 38, '#64748b', 8);

        // 3. Analog Dial Background
        ctx.save(); ctx.translate(35, 75);
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0,0, 30, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1; ctx.stroke();

        // 4. Dial Teeth (Tappets) - Visual Only
        ctx.strokeStyle = "#334155"; ctx.lineWidth = 2;
        for(let i=0; i<24; i++) {
            ctx.rotate(Math.PI * 2 / 24);
            ctx.beginPath(); ctx.moveTo(0, 25); ctx.lineTo(0, 30); ctx.stroke();
        }
        
        // 5. Hands (Static or Moving based on state?)
        // Let's draw static hands at 3:00 for aesthetic
        ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#334155"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(15, 0); ctx.stroke(); // Minute
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -10); ctx.stroke(); // Hour
        ctx.restore();

        // 6. Clear Plastic Cover (Glassy Effect)
        ctx.save();
        const glassGrd = ctx.createLinearGradient(0, 40, 70, 110);
        glassGrd.addColorStop(0, "rgba(255,255,255,0.1)");
        glassGrd.addColorStop(0.5, "rgba(200,230,255,0.2)");
        glassGrd.addColorStop(1, "rgba(255,255,255,0.1)");
        ctx.fillStyle = glassGrd;
        ctx.beginPath(); ctx.roundRect(5, 40, 60, 70, 4); ctx.fill();
        ctx.strokeStyle = "rgba(59, 130, 246, 0.3)"; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();

        // 7. Manual Switch (Bottom Left)
        tools.toggle(ctx, 5, 70, 15, 10, state.on, "#334155");
        tools.text(ctx, 'I/O', 12, 115, '#64748b', 7);
    }
});

/* --- AUTOMATIC IRISH BREAKER GENERATOR --- */
const COMMON_RATINGS = [6, 10, 16, 20, 32, 40, 50];

COMMON_RATINGS.forEach(amp => {
    // 1. CREATE MCB (Bottom Fed)
    Engine.register({
        type: `mcb_b${amp}`,
        label: `B${amp} MCB`,
        category: 'Domestic',
        role: 'switch',
        hasSwitch: true,
        size: { w: 35, h: 130 },
        terminals: [ {id:'Lout', x:17.5, y:15}, {id:'Lin', x:17.5, y:115} ],
        getInternalPaths: (state) => state.on ? [['Lin', 'Lout']] : [],
        render: (ctx, state, tools) => {
            tools.plasticRect(ctx, 0, 0, 35, 130, "#fff");
            tools.toggle(ctx, 8, 45, 19, 30, state.on, "#334155");
            tools.text(ctx, `B${amp}`, 17.5, 90, '#000', 12, "bold");
            tools.text(ctx, 'Hager', 17.5, 30, '#3b82f6', 8, "bold");
        }
    });

    // 2. CREATE RCBO (Bottom Fed, NO FE)
    Engine.register({
        type: `rcbo_b${amp}`,
        label: `B${amp} RCBO`,
        category: 'Domestic',
        role: 'switch',
        hasSwitch: true,
        size: { w: 35, h: 130 }, 
        terminals: [ 
            {id:'Lout', x:10, y:15}, {id:'Nout', x:25, y:15},
            {id:'Lin', x:10, y:115}, {id:'Nin', x:25, y:115}
        ],
        getInternalPaths: (state) => state.on ? [['Lin', 'Lout'], ['Nin', 'Nout']] : [],
        render: (ctx, state, tools) => {
            tools.plasticRect(ctx, 0, 0, 35, 130, "#fff");
            tools.toggle(ctx, 8, 45, 19, 30, state.on, "#2563eb");
            ctx.fillStyle = "#fef08a"; 
            ctx.beginPath(); ctx.roundRect(10, 80, 15, 10, 2); ctx.fill();
            tools.text(ctx, 'T', 17.5, 85, '#854d0e', 7);
            tools.text(ctx, `B${amp}`, 17.5, 105, '#000', 11, "bold");
            tools.text(ctx, '30mA', 17.5, 120, '#ef4444', 7);
        }
    });
});