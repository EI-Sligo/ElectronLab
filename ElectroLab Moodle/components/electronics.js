/* ELECTRONICS COMPONENTS - FULLY FLEXIBLE VERSION */

// --- HELPER: Draw component body along a line ---
const drawAxial = (ctx, x1, y1, x2, y2, color, label, type, state) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const mid = dist / 2;

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    // 1. Draw Leads (Wires)
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(dist, 0); ctx.stroke();

    // 2. Draw Specific Component Symbols
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
    else if (type === 'zener') {
        tools.plasticRect(ctx, mid - 10, -8, 20, 16, "#ef4444");
        ctx.fillStyle = "#000"; ctx.fillRect(mid + 5, -8, 4, 16);
    }
    else if (type === 'capacitor') {
        tools.plasticRect(ctx, mid - 10, -8, 20, 16, color);
    }
    else if (type === 'inductor') {
        // Draw coils over the wire
        ctx.fillStyle = "#f1f5f9"; ctx.strokeStyle = "#b45309"; ctx.lineWidth = 2;
        for(let i=-15; i<=15; i+=6) {
            ctx.beginPath(); ctx.arc(mid + i, -4, 6, 0, Math.PI); ctx.stroke(); // Coils
        }
    }
    else if (type === 'lamp') {
        ctx.translate(mid, 0);
        ctx.shadowColor = state.lit ? "#facc15" : "transparent"; ctx.shadowBlur = state.lit ? 25 : 0;
        tools.circle(ctx, 0, 0, 12, state.lit ? "#fef08a" : "#f1f5f9", "#cbd5e1"); ctx.shadowBlur = 0;
        ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.moveTo(6, -6); ctx.lineTo(-6, 6); ctx.stroke();
        ctx.translate(-mid, 0);
    }
    else if (type === 'buzzer') {
        ctx.translate(mid, 0);
        tools.plasticRect(ctx, -12, -12, 24, 24, "#1f2937");
        tools.circle(ctx, 0, 0, 6, "#000");
        if (state.lit) tools.text(ctx, '((( )))', 0, -18, '#fbbf24', 10, "bold");
        ctx.translate(-mid, 0);
    }
    else if (type === 'switch' || type === 'push') {
        ctx.translate(mid, 0);
        tools.plasticRect(ctx, -15, -10, 30, 20, "#e2e8f0");
        if(type === 'push') {
            tools.circle(ctx, 0, 0, 8, state.on ? "#dc2626" : "#ef4444", "#94a3b8");
        } else {
            ctx.fillStyle = "#334155"; ctx.fillRect(-5, -15, 10, 30);
            ctx.fillStyle = state.on ? "#22c55e" : "#ef4444"; ctx.fillRect(-3, state.on ? -12 : -2, 6, 14);
        }
        ctx.translate(-mid, 0);
    }

    // 3. Label (keeps text upright)
    if(label) {
        ctx.translate(mid, -15);
        if(angle > Math.PI/2 || angle < -Math.PI/2) { ctx.rotate(Math.PI); }
        tools.text(ctx, label, 0, 0, '#334155', 10, "bold");
    }

    ctx.restore();
};

// --- 1. POWER SOURCES (Boxes remain fixed for stability) ---

Engine.register({
    type: 'battery_9v', label: '9V Battery', role: 'source', size: { w: 60, h: 100 },
    terminals: [ {id:'L', x:15, y:10, label:'+'}, {id:'N', x:45, y:10, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 100, "#334155"); 
        ctx.fillStyle = "#fbbf24"; ctx.fillRect(0, 0, 60, 30); 
        tools.text(ctx, '9V', 30, 60, '#fff', 20, "bold");
    }
});

Engine.register({
    type: 'psu_5v', label: '5V Logic PSU', role: 'source', size: { w: 80, h: 60 },
    terminals: [ {id:'L', x:20, y:10, label:'+5V'}, {id:'N', x:60, y:10, label:'0V'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 80, 60, "#e2e8f0");
        tools.text(ctx, '5V DC', 40, 35, '#ef4444', 14, "bold");
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
    }
});

// --- 2. SWITCHES (Now Flexible!) ---

Engine.register({
    type: 'push_button', label: 'Push Button', role: 'switch', hasSwitch: true, flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#e2e8f0", 'Push', 'push', state);
    }
});

Engine.register({
    type: 'switch_toggle', label: 'Toggle Switch', role: 'switch', hasSwitch: true, flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#cbd5e1", 'SW', 'switch', state);
    }
});

// --- 3. PASSIVES (Flexible) ---

Engine.register({
    type: 'resistor', label: 'Resistor', role: 'passive', flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: () => [['T1', 'T2']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#d97706", state.value || '1kΩ', 'resistor', state);
    }
});

Engine.register({
    type: 'inductor', label: 'Inductor', role: 'passive', flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: () => [['T1', 'T2']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#b45309", '10mH', 'inductor', state);
    }
});

Engine.register({
    type: 'capacitor', label: 'Capacitor', role: 'passive', flexible: true,
    terminals: [ {id:'T1', x:0, y:0, label:'+'}, {id:'T2', x:36, y:0, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 36, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#3b82f6", state.value || '10μF', 'capacitor', state);
    }
});

// --- 4. SEMICONDUCTORS (Flexible) ---

Engine.register({
    type: 'diode', label: 'Diode', role: 'passive', flexible: true,
    terminals: [ {id:'A', x:0, y:0, label:'A'}, {id:'K', x:72, y:0, label:'K'} ],
    getInternalPaths: () => [['A', 'K']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#000", '1N4007', 'diode', state);
    }
});

Engine.register({
    type: 'zener_diode', label: 'Zener', role: 'passive', flexible: true,
    terminals: [ {id:'A', x:0, y:0, label:'A'}, {id:'K', x:72, y:0, label:'K'} ],
    getInternalPaths: () => [['A', 'K']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#ef4444", '5.1V', 'zener', state);
    }
});

Engine.register({
    type: 'led_red', label: 'Red LED', role: 'load', flexible: true,
    terminals: [ {id:'A', x:0, y:0, label:'A'}, {id:'K', x:36, y:0, label:'K'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 36, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#ef4444", '', 'led', state);
    }
});

// --- 5. OUTPUTS (Flexible) ---

Engine.register({
    type: 'lamp_filament', label: 'Lamp', role: 'load', flexible: true,
    terminals: [ {id:'L', x:0, y:0}, {id:'N', x:72, y:0} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#f1f5f9", '12V', 'lamp', state);
    }
});

Engine.register({
    type: 'buzzer', label: 'Buzzer', role: 'load', flexible: true,
    terminals: [ {id:'L', x:0, y:0}, {id:'N', x:72, y:0} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, 0, 0, t2.x, t2.y, "#1f2937", '', 'buzzer', state);
    }
});

// --- 6. MULTI-LEG COMPONENTS (Fixed - Too hard to stretch 3 legs!) ---

Engine.register({
    type: 'transistor_npn', label: 'NPN Transistor', role: 'passive', size: { w: 50, h: 50 },
    terminals: [ {id:'C', x:10, y:10, label:'C'}, {id:'B', x:25, y:45, label:'B'}, {id:'E', x:40, y:10, label:'E'} ],
    getInternalPaths: () => [['C', 'E']],
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.arc(25, 20, 18, 0, Math.PI); ctx.fill();
        tools.plasticRect(ctx, 7, 18, 36, 10, "#1e293b", false);
        tools.text(ctx, 'NPN', 25, 23, '#cbd5e1', 9);
    }
});

Engine.register({
    type: 'transistor_pnp', label: 'PNP Transistor', role: 'passive', size: { w: 50, h: 50 },
    terminals: [ {id:'C', x:10, y:10, label:'C'}, {id:'B', x:25, y:45, label:'B'}, {id:'E', x:40, y:10, label:'E'} ],
    getInternalPaths: () => [['E', 'C']],
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.arc(25, 20, 18, 0, Math.PI); ctx.fill(); 
        tools.plasticRect(ctx, 7, 18, 36, 10, "#1e293b", false);
        tools.text(ctx, 'PNP', 25, 23, '#cbd5e1', 9);
    }
});

Engine.register({
    type: 'transformer_ct', label: 'Centre-Tapped Transformer', role: 'passive', size: { w: 80, h: 80 },
    terminals: [ 
        {id:'P1', x:10, y:20, label:'P1'}, {id:'P2', x:10, y:60, label:'P2'}, 
        {id:'S1', x:70, y:10, label:'S1'}, {id:'CT', x:70, y:40, label:'CT'}, {id:'S2', x:70, y:70, label:'S2'} 
    ],
    getInternalPaths: () => [['P1','P2'], ['S1','CT'], ['CT','S2']],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 25, 0, 30, 80, "#475569"); // Iron Core
        ctx.strokeStyle = "#d97706"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(10, 20); ctx.lineTo(25, 20); ctx.moveTo(10, 60); ctx.lineTo(25, 60); ctx.stroke(); // Primary leads
        ctx.beginPath(); ctx.moveTo(70, 10); ctx.lineTo(55, 10); ctx.moveTo(70, 40); ctx.lineTo(55, 40); ctx.moveTo(70, 70); ctx.lineTo(55, 70); ctx.stroke(); // Secondary leads
    }
});

Engine.register({
    type: 'potentiometer', label: 'Potentiometer', role: 'passive', size: { w: 50, h: 50 },
    terminals: [ {id:'T1', x:10, y:40}, {id:'Wiper', x:25, y:40, label:'W'}, {id:'T2', x:40, y:40} ],
    getInternalPaths: () => [['T1', 'Wiper'], ['Wiper', 'T2']],
    render: (ctx, state, tools) => {
        tools.circle(ctx, 25, 20, 18, "#334155");
        tools.circle(ctx, 25, 20, 12, "#f1f5f9");
        ctx.fillStyle = "#000"; ctx.fillRect(23, 8, 4, 12);
    }
});

// --- 6. LOGIC GATES ---

Engine.register({
    type: 'logic_and', label: 'AND Gate', role: 'passive', size: { w: 60, h: 50 },
    terminals: [ {id:'A', x:0, y:15, label:'A'}, {id:'B', x:0, y:35, label:'B'}, {id:'Y', x:60, y:25, label:'Y'} ],
    getInternalPaths: () => [], 
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; 
        ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(30, 5); ctx.arc(30, 25, 20, -Math.PI/2, Math.PI/2); ctx.lineTo(10, 45); ctx.fill();
        tools.text(ctx, '&', 25, 25, '#fff', 12);
    }
});

Engine.register({
    type: 'logic_or', label: 'OR Gate', role: 'passive', size: { w: 60, h: 50 },
    terminals: [ {id:'A', x:0, y:15, label:'A'}, {id:'B', x:0, y:35, label:'B'}, {id:'Y', x:60, y:25, label:'Y'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; 
        ctx.beginPath(); ctx.moveTo(10, 5); ctx.quadraticCurveTo(40, 5, 50, 25); ctx.quadraticCurveTo(40, 45, 10, 45); ctx.quadraticCurveTo(20, 25, 10, 5); ctx.fill();
        tools.text(ctx, '≥1', 25, 25, '#fff', 10);
    }
});

Engine.register({
    type: 'logic_not', label: 'NOT Gate', role: 'passive', size: { w: 60, h: 50 },
    terminals: [ {id:'A', x:0, y:25, label:'A'}, {id:'Y', x:60, y:25, label:'Y'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; 
        ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(40, 25); ctx.lineTo(15, 40); ctx.fill();
        tools.circle(ctx, 45, 25, 5, "#f1f5f9", "#1e293b"); 
    }
});

// --- 7. STRIPBOARD ---

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
    }
});