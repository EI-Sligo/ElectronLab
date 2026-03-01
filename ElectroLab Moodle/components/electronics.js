/* ELECTRONICS COMPONENTS - WITH VARIABLE PSU */

// Helper to draw the component body
const drawAxial = (ctx, state, tools, x1, y1, x2, y2, color, label, type) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const mid = dist / 2;

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    // Leads
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dist, 0); ctx.stroke();

    // Body
    if (type === 'resistor') {
        tools.plasticRect(ctx, mid - 15, -5, 30, 10, "#d97706");
        ctx.fillStyle = "#78350f"; ctx.fillRect(mid - 10, -5, 4, 10);
        ctx.fillStyle = "#000"; ctx.fillRect(mid - 2, -5, 4, 10);
        ctx.fillStyle = "#dc2626"; ctx.fillRect(mid + 6, -5, 4, 10);
    } 
    else if (type === 'diode') {
        tools.plasticRect(ctx, mid - 10, -8, 20, 16, "#000");
        ctx.fillStyle = "#cbd5e1"; ctx.fillRect(mid + 5, -8, 4, 16);
    }
    else if (type === 'capacitor') {
        tools.plasticRect(ctx, mid - 10, -8, 20, 16, color);
    }
    else if (type === 'led') {
       // LED is handled in specific render below usually, but fallback here
       ctx.translate(mid, 0);
       tools.circle(ctx, 0, 0, 10, state.lit ? "#ef4444" : "#7f1d1d"); 
       ctx.translate(-mid, 0);
    }

    if(label) {
        ctx.translate(mid, -15);
        if(angle > Math.PI/2 || angle < -Math.PI/2) ctx.rotate(Math.PI);
        tools.text(ctx, label, 0, 0, '#334155', 10, "bold");
    }
    ctx.restore();
};

// --- 1. SOURCES ---

Engine.register({
    type: 'battery_9v', label: '9V Battery', role: 'source', size: { w: 60, h: 100 },
    terminals: [ {id:'Pos', x:15, y:10, label:'+'}, {id:'Neg', x:45, y:10, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 100, "#334155"); 
        ctx.fillStyle = "#fbbf24"; ctx.fillRect(0, 0, 60, 30); 
        tools.text(ctx, '9V', 30, 60, '#fff', 20, "bold");
        tools.screw(ctx, 15, 10); tools.screw(ctx, 45, 10);
    }
});

// NEW: VARIABLE PSU (0-30V)
Engine.register({
    type: 'psu_variable', label: 'Lab PSU', role: 'source', size: { w: 100, h: 80 },
    terminals: [ {id:'Pos', x:20, y:60, label:'+'}, {id:'Neg', x:80, y:60, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 80, "#e2e8f0");
        // Screen
        ctx.fillStyle = "#000"; ctx.fillRect(10, 10, 80, 30);
        // Voltage Text
        const v = state.value || 12;
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 20px monospace"; 
        ctx.textAlign = "right"; ctx.fillText(parseFloat(v).toFixed(1) + "V", 85, 32);
        
        // Terminals
        tools.text(ctx, '+', 20, 50, '#ef4444', 14, "bold");
        tools.text(ctx, '-', 80, 50, '#1f2937', 14, "bold");
    }
});

Engine.register({
    type: 'ac_source', label: 'AC Generator', role: 'source', size: { w: 80, h: 80 },
    terminals: [ {id:'L', x:20, y:15, label:'L'}, {id:'N', x:60, y:15, label:'N'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 80, 80, "#f8fafc");
        tools.circle(ctx, 40, 45, 20, "#fff", "#334155");
        tools.text(ctx, '~', 40, 48, '#334155', 24, "normal");
        tools.text(ctx, '230V', 40, 70, '#64748b', 10);
    }
});

// --- 2. FLEXIBLE COMPONENTS ---

Engine.register({
    type: 'resistor', label: 'Resistor', role: 'passive', flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: () => [['T1', 'T2']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#d97706", state.value || '1kΩ', 'resistor');
    }
});

Engine.register({
    type: 'led_red', label: 'Red LED', role: 'load', flexible: true,
    terminals: [ {id:'A', x:0, y:0, label:'A'}, {id:'K', x:36, y:0, label:'K'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 36, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#ef4444", '', 'led');
    }
});

Engine.register({
    type: 'push_button', label: 'Push Button', role: 'switch', hasSwitch: true, flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#e2e8f0", 'Push', 'push'); // Use 'push' type helper
    }
});

Engine.register({
    type: 'switch_toggle', label: 'Toggle Switch', role: 'switch', hasSwitch: true, flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        // Reuse switch drawing from helper
        const dx = t2.x; const dy = t2.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx);
        const mid = dist/2;
        ctx.save(); ctx.rotate(angle);
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dist,0); ctx.stroke();
        ctx.translate(mid, 0);
        tools.plasticRect(ctx, -15, -10, 30, 20, "#cbd5e1");
        ctx.fillStyle = state.on ? "#22c55e" : "#ef4444"; ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
    }
});

// --- 3. STRIPBOARD (FIXED OFFSET FOR SNAP) ---
const BOARD_COLS = 12;
const BOARD_ROWS = 8;
const SPACING = 36;
const OFFSET = 36;

let trackboardTerminals = [];
for(let r=0; r<BOARD_ROWS; r++) {
    for(let c=0; c<BOARD_COLS; c++) {
        trackboardTerminals.push({ id: `R${r}_C${c}`, x: OFFSET + c * SPACING, y: OFFSET + r * SPACING });
    }
}

Engine.register({
    type: 'trackboard', label: 'Stripboard', role: 'passive',
    size: { w: OFFSET*2 + (BOARD_COLS-1)*SPACING, h: OFFSET*2 + (BOARD_ROWS-1)*SPACING }, 
    terminals: trackboardTerminals,
    getInternalPaths: (state) => {
        let paths = [];
        const broken = state.broken || {};
        for(let r=0; r<BOARD_ROWS; r++) {
            for(let c=0; c<BOARD_COLS-1; c++) {
                const cutId = `${r}_${c}`;
                if(!broken[cutId]) paths.push([`R${r}_C${c}`, `R${r}_C${c+1}`]);
            }
        }
        return paths;
    },
    onInteract: (comp, lx, ly) => {
        if(!comp.state.broken) comp.state.broken = {};
        for(let r=0; r<BOARD_ROWS; r++) {
            const ry = OFFSET + r * SPACING;
            if(Math.abs(ly - ry) < 15) { 
                for(let c=0; c<BOARD_COLS-1; c++) {
                    const cx_mid = OFFSET + c * SPACING + (SPACING/2); 
                    if(Math.abs(lx - cx_mid) < 15) { 
                        comp.state.broken[`${r}_${c}`] = !comp.state.broken[`${r}_${c}`]; 
                        return;
                    }
                }
            }
        }
    },
    render: (ctx, state, tools) => {
        const w = OFFSET*2 + (BOARD_COLS-1)*SPACING; const h = OFFSET*2 + (BOARD_ROWS-1)*SPACING;
        tools.plasticRect(ctx, 0, 0, w, h, "#fde68a"); 
        for(let r=0; r<BOARD_ROWS; r++) {
            const ry = OFFSET + r * SPACING;
            ctx.fillStyle = "#b45309"; ctx.fillRect(10, ry - 6, w - 20, 12);
            for(let c=0; c<BOARD_COLS-1; c++) {
                if(state.broken && state.broken[`${r}_${c}`]) {
                    const cx = OFFSET + c * SPACING + (SPACING/2);
                    ctx.fillStyle = "#fde68a"; ctx.fillRect(cx - 5, ry - 7, 10, 14);
                    ctx.strokeStyle = "red"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx-4, ry-4); ctx.lineTo(cx+4, ry+4); ctx.moveTo(cx-4, ry+4); ctx.lineTo(cx+4, ry-4); ctx.stroke();
                }
            }
        }
        for(let r=0; r<BOARD_ROWS; r++) {
            for(let c=0; c<BOARD_COLS; c++) {
                tools.circle(ctx, OFFSET + c * SPACING, OFFSET + r * SPACING, 4, "#1f2937");
            }
        }
        tools.text(ctx, 'Stripboard', w/2, 10, '#b45309', 10, "bold");
    }
});