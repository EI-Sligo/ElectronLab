/* ELECTRONICS COMPONENTS - ALIGNED TO PHASE 2 SYLLABUS */

// --- 1. POWER SOURCES ---

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

// --- 2. SWITCHES & OUTPUTS ---

Engine.register({
    type: 'switch_toggle', label: 'Toggle Switch', role: 'switch', hasSwitch: true, size: { w: 40, h: 60 },
    terminals: [ {id:'T1', x:20, y:10}, {id:'T2', x:20, y:50} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 40, 60, "#cbd5e1");
        ctx.fillStyle = state.on ? "#22c55e" : "#ef4444";
        ctx.fillRect(15, state.on ? 20 : 30, 10, 10);
    }
});

Engine.register({
    type: 'push_button', label: 'Push Button', role: 'switch', hasSwitch: true, size: { w: 40, h: 40 },
    terminals: [ {id:'T1', x:10, y:20}, {id:'T2', x:30, y:20} ],
    getInternalPaths: (state) => state.on ? [['T1', 'T2']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 40, 40, "#e2e8f0");
        tools.circle(ctx, 20, 20, 12, state.on ? "#dc2626" : "#ef4444", "#94a3b8");
    }
});

Engine.register({
    type: 'led_red', label: 'Red LED', role: 'load', size: { w: 40, h: 60 },
    terminals: [ {id:'L', x:10, y:50, label:'A'}, {id:'N', x:30, y:50, label:'K'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.shadowColor = state.lit ? "#ef4444" : "transparent"; ctx.shadowBlur = state.lit ? 20 : 0;
        tools.circle(ctx, 20, 20, 15, state.lit ? "#ef4444" : "#7f1d1d"); ctx.shadowBlur = 0;
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(10, 35); ctx.lineTo(10, 50); ctx.moveTo(30, 35); ctx.lineTo(30, 50); ctx.stroke();
    }
});

Engine.register({
    type: 'lamp_filament', label: 'Filament Lamp', role: 'load', size: { w: 50, h: 50 },
    terminals: [ {id:'L', x:10, y:40}, {id:'N', x:40, y:40} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.shadowColor = state.lit ? "#facc15" : "transparent"; ctx.shadowBlur = state.lit ? 25 : 0;
        tools.circle(ctx, 25, 20, 15, state.lit ? "#fef08a" : "#f1f5f9", "#cbd5e1"); ctx.shadowBlur = 0;
        tools.text(ctx, 'X', 25, 20, '#94a3b8', 16);
    }
});

Engine.register({
    type: 'buzzer', label: 'Buzzer', role: 'load', size: { w: 50, h: 50 },
    terminals: [ {id:'L', x:10, y:40, label:'+'}, {id:'N', x:40, y:40, label:'-'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 50, 40, "#1f2937");
        tools.circle(ctx, 25, 20, 8, "#000");
        if (state.lit) tools.text(ctx, 'BZZZ!', 25, -10, '#fbbf24', 12, "bold");
    }
});

// --- 3. PASSIVE COMPONENTS ---

Engine.register({
    type: 'resistor', label: 'Resistor', role: 'passive', size: { w: 60, h: 20 },
    terminals: [ {id:'T1', x:0, y:10}, {id:'T2', x:60, y:10} ],
    getInternalPaths: () => [['T1', 'T2']],
    render: (ctx, state, tools) => {
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(60, 10); ctx.stroke();
        tools.plasticRect(ctx, 15, 2, 30, 16, "#d97706");
        ctx.fillStyle = "#78350f"; ctx.fillRect(20, 2, 4, 16); ctx.fillStyle = "#000"; ctx.fillRect(28, 2, 4, 16); ctx.fillStyle = "#dc2626"; ctx.fillRect(36, 2, 4, 16);
    }
});

Engine.register({
    type: 'potentiometer', label: 'Potentiometer', role: 'passive', size: { w: 50, h: 50 },
    terminals: [ {id:'T1', x:10, y:40}, {id:'Wiper', x:25, y:40, label:'W'}, {id:'T2', x:40, y:40} ],
    getInternalPaths: () => [['T1', 'Wiper'], ['Wiper', 'T2']],
    render: (ctx, state, tools) => {
        tools.circle(ctx, 25, 20, 18, "#334155");
        tools.circle(ctx, 25, 20, 12, "#f1f5f9");
        ctx.fillStyle = "#000"; ctx.fillRect(23, 8, 4, 12); // Dial line
    }
});

Engine.register({
    type: 'capacitor', label: 'Capacitor', role: 'passive', size: { w: 40, h: 40 },
    terminals: [ {id:'T1', x:10, y:30}, {id:'T2', x:30, y:30} ],
    getInternalPaths: () => [], // Blocks DC
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 5, 5, 30, 20, "#3b82f6");
        tools.text(ctx, '10μF', 20, 15, '#fff', 9);
    }
});

Engine.register({
    type: 'inductor', label: 'Inductor (Coil)', role: 'passive', size: { w: 60, h: 30 },
    terminals: [ {id:'T1', x:0, y:15}, {id:'T2', x:60, y:15} ],
    getInternalPaths: () => [['T1', 'T2']],
    render: (ctx, state, tools) => {
        ctx.strokeStyle = "#b45309"; ctx.lineWidth = 3;
        ctx.beginPath();
        for(let i=1; i<=4; i++) { ctx.arc(10 + (i*8), 15, 6, Math.PI, 0); }
        ctx.stroke();
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

// --- 4. SEMICONDUCTORS ---

Engine.register({
    type: 'diode', label: 'Rectifier Diode', role: 'passive', size: { w: 60, h: 20 },
    terminals: [ {id:'A', x:0, y:10, label:'A'}, {id:'K', x:60, y:10, label:'K'} ],
    getInternalPaths: () => [['A', 'K']],
    render: (ctx, state, tools) => {
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(60, 10); ctx.stroke();
        tools.plasticRect(ctx, 15, 2, 30, 16, "#000"); // Black body
        ctx.fillStyle = "#cbd5e1"; ctx.fillRect(38, 2, 5, 16); // Silver cathode band
    }
});

Engine.register({
    type: 'zener_diode', label: 'Zener Diode', role: 'passive', size: { w: 60, h: 20 },
    terminals: [ {id:'A', x:0, y:10, label:'A'}, {id:'K', x:60, y:10, label:'K'} ],
    getInternalPaths: () => [['A', 'K']],
    render: (ctx, state, tools) => {
        ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(60, 10); ctx.stroke();
        tools.plasticRect(ctx, 20, 4, 20, 12, "#ef4444"); // Glass red body
        ctx.fillStyle = "#000"; ctx.fillRect(34, 4, 4, 12); // Black cathode band
    }
});

Engine.register({
    type: 'transistor_npn', label: 'NPN Transistor', role: 'passive', size: { w: 50, h: 50 },
    terminals: [ {id:'C', x:10, y:10, label:'C'}, {id:'B', x:25, y:45, label:'B'}, {id:'E', x:40, y:10, label:'E'} ],
    getInternalPaths: () => [['C', 'E']], // Simplified continuity for logic testing
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; ctx.beginPath(); ctx.arc(25, 20, 18, 0, Math.PI); ctx.fill(); // TO-92 flat side down
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

// --- 5. LOGIC GATES (74 Series style) ---

Engine.register({
    type: 'logic_and', label: 'AND Gate (7408)', role: 'passive', size: { w: 60, h: 50 },
    terminals: [ {id:'A', x:0, y:15, label:'A'}, {id:'B', x:0, y:35, label:'B'}, {id:'Y', x:60, y:25, label:'Y'} ],
    getInternalPaths: () => [], 
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; 
        ctx.beginPath(); ctx.moveTo(10, 5); ctx.lineTo(30, 5); ctx.arc(30, 25, 20, -Math.PI/2, Math.PI/2); ctx.lineTo(10, 45); ctx.fill();
        tools.text(ctx, '&', 25, 25, '#fff', 12);
    }
});

Engine.register({
    type: 'logic_or', label: 'OR Gate (7432)', role: 'passive', size: { w: 60, h: 50 },
    terminals: [ {id:'A', x:0, y:15, label:'A'}, {id:'B', x:0, y:35, label:'B'}, {id:'Y', x:60, y:25, label:'Y'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; 
        ctx.beginPath(); ctx.moveTo(10, 5); ctx.quadraticCurveTo(40, 5, 50, 25); ctx.quadraticCurveTo(40, 45, 10, 45); ctx.quadraticCurveTo(20, 25, 10, 5); ctx.fill();
        tools.text(ctx, '≥1', 25, 25, '#fff', 10);
    }
});

Engine.register({
    type: 'logic_not', label: 'NOT Gate (7404)', role: 'passive', size: { w: 60, h: 50 },
    terminals: [ {id:'A', x:0, y:25, label:'A'}, {id:'Y', x:60, y:25, label:'Y'} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        ctx.fillStyle = "#1e293b"; 
        ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(40, 25); ctx.lineTo(15, 40); ctx.fill();
        tools.circle(ctx, 45, 25, 5, "#f1f5f9", "#1e293b"); // Inversion circle
    }
});

// --- 6. PROTOTYPING BOARDS ---

const BOARD_COLS = 12;
const BOARD_ROWS = 8;
const SPACING = 36; // Wide spacing to make it easy to click and wire

// Automatically generate all the terminals (holes) for the board
let trackboardTerminals = [];
for(let r=0; r<BOARD_ROWS; r++) {
    for(let c=0; c<BOARD_COLS; c++) {
        trackboardTerminals.push({
            id: `R${r}_C${c}`,
            x: 20 + c * SPACING,
            y: 20 + r * SPACING
        });
    }
}

Engine.register({
    type: 'trackboard',
    label: 'Stripboard',
    role: 'passive',
    size: { w: 40 + (BOARD_COLS-1)*SPACING, h: 40 + (BOARD_ROWS-1)*SPACING }, 
    terminals: trackboardTerminals,
    getInternalPaths: (state) => {
        let paths = [];
        const broken = state.broken || {};
        // Connect all horizontal holes together UNLESS the track is cut
        for(let r=0; r<BOARD_ROWS; r++) {
            for(let c=0; c<BOARD_COLS-1; c++) {
                const cutId = `${r}_${c}`;
                if(!broken[cutId]) {
                    paths.push([`R${r}_C${c}`, `R${r}_C${c+1}`]);
                }
            }
        }
        return paths;
    },
    onInteract: (comp, lx, ly) => {
        if(!comp.state.broken) comp.state.broken = {};
        
        // Find if the user clicked directly on the copper track BETWEEN two holes
        for(let r=0; r<BOARD_ROWS; r++) {
            const ry = 20 + r * SPACING;
            if(Math.abs(ly - ry) < 12) { // Clicked near this horizontal row
                for(let c=0; c<BOARD_COLS-1; c++) {
                    const cx_mid = 20 + c * SPACING + (SPACING/2); // Midpoint between holes
                    if(Math.abs(lx - cx_mid) < 12) { // Clicked exactly between holes
                        const cutId = `${r}_${c}`;
                        // Toggle the cut
                        comp.state.broken[cutId] = !comp.state.broken[cutId]; 
                        return;
                    }
                }
            }
        }
    },
    render: (ctx, state, tools) => {
        const w = 40 + (BOARD_COLS-1)*SPACING;
        const h = 40 + (BOARD_ROWS-1)*SPACING;
        const broken = state.broken || {};

        // Draw fiberglass board
        tools.plasticRect(ctx, 0, 0, w, h, "#fde68a"); 
        
        // Draw copper tracks (horizontal)
        for(let r=0; r<BOARD_ROWS; r++) {
            const ry = 20 + r * SPACING;
            
            // Base copper strip
            ctx.fillStyle = "#b45309"; 
            ctx.fillRect(10, ry - 6, w - 20, 12);
            
            // Draw track cuts
            for(let c=0; c<BOARD_COLS-1; c++) {
                const cutId = `${r}_${c}`;
                if(broken[cutId]) {
                    const cx_mid = 20 + c * SPACING + (SPACING/2);
                    // Erase copper
                    ctx.fillStyle = "#fde68a";
                    ctx.fillRect(cx_mid - 4, ry - 7, 8, 14);
                    // Draw red 'X' to signify cut
                    ctx.strokeStyle = "red"; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(cx_mid - 4, ry - 4); ctx.lineTo(cx_mid + 4, ry + 4);
                    ctx.moveTo(cx_mid - 4, ry + 4); ctx.lineTo(cx_mid + 4, ry - 4);
                    ctx.stroke();
                }
            }
        }
        
        // Draw standard holes
        for(let r=0; r<BOARD_ROWS; r++) {
            for(let c=0; c<BOARD_COLS; c++) {
                tools.circle(ctx, 20 + c * SPACING, 20 + r * SPACING, 4, "#1f2937");
            }
        }
        
        tools.text(ctx, 'Vero / Stripboard (Click between holes to cut tracks)', w/2, 6, '#b45309', 9, "bold");
    }
});