/* ELECTRONICS COMPONENTS - COMPLETE LIBRARY */

// --- HELPER: Draw component body along a line ---
const drawAxial = (ctx, state, tools, x1, y1, x2, y2, color, label, type) => {
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
            ctx.beginPath(); ctx.arc(mid + i, -4, 6, 0, Math.PI); ctx.stroke(); 
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
    else if (type === 'led') {
       ctx.translate(mid, 0);
       tools.circle(ctx, 0, 0, 10, state.lit ? "#ef4444" : "#7f1d1d"); 
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

// --- 1. POWER SOURCES ---

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

Engine.register({
    type: 'psu_variable', label: 'Lab PSU', role: 'source', size: { w: 100, h: 80 },
    terminals: [ {id:'Pos', x:20, y:60, label:'+'}, {id:'Neg', x:80, y:60, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 80, "#e2e8f0");
        ctx.fillStyle = "#000"; ctx.fillRect(10, 10, 80, 30);
        const v = state.value || 12;
        ctx.fillStyle = "#ef4444"; ctx.font = "bold 20px monospace"; 
        ctx.textAlign = "right"; ctx.fillText(parseFloat(v).toFixed(1) + "V", 85, 32);
        tools.text(ctx, '+', 20, 50, '#ef4444', 14, "bold");
        tools.text(ctx, '-', 80, 50, '#1f2937', 14, "bold");
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

// AC Generator
Engine.register({
    type: 'ac_source', label: 'AC Generator', role: 'source', size: { w: 80, h: 80 },
    terminals: [ {id:'L', x:20, y:15, label:'L'}, {id:'N', x:60, y:15, label:'N'} ],
    getInternalPaths: () => [], // No internal path to keep L/N separate
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 80, 80, "#f8fafc");
        tools.circle(ctx, 40, 45, 20, "#fff", "#334155");
        tools.text(ctx, '~', 40, 48, '#334155', 24, "normal");
        tools.text(ctx, '230V', 40, 70, '#64748b', 10);
    }
});

// --- 2. SWITCHES (Flexible) ---

Engine.register({
    type: 'push_button', label: 'Push Button', role: 'switch', hasSwitch: true, flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#e2e8f0", 'Push', 'push');
    }
});

Engine.register({
    type: 'switch_toggle', label: 'Toggle Switch', role: 'switch', hasSwitch: true, flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
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

// --- 3. PASSIVES (Flexible) ---

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
    type: 'inductor', label: 'Inductor', role: 'passive', flexible: true,
    terminals: [ {id:'T1', x:0, y:0}, {id:'T2', x:72, y:0} ],
    getInternalPaths: () => [['T1', 'T2']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#b45309", '10mH', 'inductor');
    }
});

Engine.register({
    type: 'capacitor', label: 'Capacitor', role: 'passive', flexible: true,
    terminals: [ {id:'T1', x:0, y:0, label:'+'}, {id:'T2', x:36, y:0, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 36, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#3b82f6", state.value || '10μF', 'capacitor');
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

// TRANSFORMER - No Internal Paths (To prevent Short Circuit of logic)
Engine.register({
    type: 'transformer_ct', label: 'Transformer (AC)', role: 'source', size: { w: 80, h: 80 },
    // Only Output Terminals (Secondary Side) - Pins aligned to 36px grid
    terminals: [ 
        {id:'S1', x:80, y:0, label:'S1'},  // Output Top
        {id:'CT', x:80, y:36, label:'CT'}, // Center Tap (0V)
        {id:'S2', x:80, y:72, label:'S2'}  // Output Bottom
    ],
    getInternalPaths: () => [], // CRITICAL FIX: No internal paths logic
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 10, 5, 60, 70, "#475569"); 
        
        // Label with Voltage
        const volts = state.value || '12';
        tools.text(ctx, `${volts}V AC`, 40, 40, '#fff', 10, "bold");

        ctx.strokeStyle = "#d97706"; ctx.lineWidth = 4;
        
        // Primary Coil (Visual Only - Faded)
        ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(15, 18); ctx.lineTo(25, 18); ctx.moveTo(15, 54); ctx.lineTo(25, 54); ctx.stroke(); 
        ctx.globalAlpha = 1.0;

        // Secondary Coil (Active)
        ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(60, 0); ctx.moveTo(80, 36); ctx.lineTo(60, 36); ctx.moveTo(80, 72); ctx.lineTo(60, 72); ctx.stroke(); 
        
        // Iron Core symbol
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(35, 10); ctx.lineTo(35, 70); ctx.moveTo(45, 10); ctx.lineTo(45, 70); ctx.stroke();
    }
});

// --- 4. SEMICONDUCTORS ---

Engine.register({
    type: 'diode', label: 'Diode', role: 'passive', flexible: true,
    terminals: [ {id:'A', x:0, y:0, label:'A'}, {id:'K', x:72, y:0, label:'K'} ],
    getInternalPaths: () => [['A', 'K']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#000", '1N4007', 'diode');
    }
});

Engine.register({
    type: 'zener_diode', label: 'Zener', role: 'passive', flexible: true,
    terminals: [ {id:'A', x:0, y:0, label:'A'}, {id:'K', x:72, y:0, label:'K'} ],
    getInternalPaths: () => [['A', 'K']],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#ef4444", '5.1V', 'zener');
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

// --- 5. OUTPUTS ---

Engine.register({
    type: 'lamp_filament', label: 'Lamp', role: 'load', flexible: true,
    terminals: [ {id:'L', x:0, y:0}, {id:'N', x:72, y:0} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#f1f5f9", '12V', 'lamp');
    }
});

Engine.register({
    type: 'buzzer', label: 'Buzzer', role: 'load', flexible: true,
    terminals: [ {id:'L', x:0, y:0}, {id:'N', x:72, y:0} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const t2 = state.lead2 || {x: 72, y:0};
        drawAxial(ctx, state, tools, 0, 0, t2.x, t2.y, "#1f2937", '', 'buzzer');
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

// --- 7. OPTIMIZED STRIPBOARD ---
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

// Pre-calculate paths
const STRIP_PATHS_CACHE = [];
for(let r=0; r<BOARD_ROWS; r++) {
    for(let c=0; c<BOARD_COLS-1; c++) {
        STRIP_PATHS_CACHE.push({
            cutId: `${r}_${c}`,
            path: [`R${r}_C${c}`, `R${r}_C${c+1}`]
        });
    }
}

Engine.register({
    type: 'trackboard', label: 'Stripboard', role: 'passive',
    size: { w: OFFSET*2 + (BOARD_COLS-1)*SPACING, h: OFFSET*2 + (BOARD_ROWS-1)*SPACING }, 
    terminals: trackboardTerminals,
    getInternalPaths: (state) => {
        const broken = state.broken || {};
        return STRIP_PATHS_CACHE.filter(p => !broken[p.cutId]).map(p => p.path);
    },
    onInteract: (comp, lx, ly) => {
        if(!comp.state.broken) comp.state.broken = {};
        for(let r=0; r<BOARD_ROWS; r++) {
            const ry = OFFSET + r * SPACING;
            if(Math.abs(ly - ry) < 15) { 
                for(let c=0; c<BOARD_COLS-1; c++) {
                    const cx_mid = OFFSET + c * SPACING + (SPACING/2); 
                    if(Math.abs(lx - cx_mid) < 15) { 
                        const id = `${r}_${c}`;
                        comp.state.broken[id] = !comp.state.broken[id]; 
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
            
            // NEW: Draw Faint Copper Track Line
            ctx.strokeStyle = "rgba(180, 83, 9, 0.3)"; // Faint copper
            ctx.lineWidth = 14; // Wide track
            ctx.beginPath(); ctx.moveTo(OFFSET, ry); ctx.lineTo(w - OFFSET, ry); ctx.stroke();

            // Original Darker Strip (keep this for contrast if you like, or remove)
            ctx.fillStyle = "rgba(180, 83, 9, 0.2)"; ctx.fillRect(10, ry - 6, w - 20, 12);

            // Draw cuts
            const broken = state.broken || {};
            for(let c=0; c<BOARD_COLS-1; c++) {
                if(broken[`${r}_${c}`]) {
                    const cx = OFFSET + c * SPACING + (SPACING/2);
                    // Draw Cut Mark
                    ctx.fillStyle = "#fde68a"; ctx.fillRect(cx - 6, ry - 7, 12, 14); // Erase track
                    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; // Red Cross
                    ctx.beginPath(); ctx.moveTo(cx-4, ry-4); ctx.lineTo(cx+4, ry+4); 
                    ctx.moveTo(cx+4, ry-4); ctx.lineTo(cx-4, ry+4); ctx.stroke();
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
// PCB MOUNT 9V CLIP
Engine.register({
    type: 'battery_clip', label: '9V PCB Clip', role: 'source', 
    size: { w: 40, h: 60 },
    terminals: [ 
        {id:'Pos', x:20, y:10}, // Top Pin
        {id:'Neg', x:20, y:46}  // Bottom Pin (36px spacing = 1 row gap)
    ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        // Plastic Body
        tools.plasticRect(ctx, 0, 0, 40, 60, "#1f2937");
        // Battery Snaps
        ctx.fillStyle = "#cbd5e1"; 
        ctx.beginPath(); ctx.arc(20, 15, 6, 0, Math.PI*2); ctx.fill(); // Circular snap
        ctx.beginPath(); for(let i=0; i<6; i++) { ctx.lineTo(20 + 8*Math.cos(i*Math.PI/3), 46 + 8*Math.sin(i*Math.PI/3)); } ctx.fill(); // Hex snap
        
        tools.text(ctx, '+', 10, 15, '#ef4444', 14, "bold");
        tools.text(ctx, '9V', 20, 30, '#fff', 10);
    }
});