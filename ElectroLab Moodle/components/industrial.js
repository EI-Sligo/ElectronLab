/* INDUSTRIAL COMPONENTS - CLEAN LABELS */

// 1. 3-PHASE ISOLATOR
Engine.register({
    type: 'isolator_3ph',
    label: 'Isolator 3PH',
    category: 'Industrial',
    role: 'switch',
    hasSwitch: true,
    size: { w: 100, h: 140 },
    terminals: [ 
        {id:'L1in', label:'L1', x:20, y:15}, {id:'L2in', label:'L2', x:50, y:15}, {id:'L3in', label:'L3', x:80, y:15},
        {id:'L1out', label:'L1', x:20, y:125}, {id:'L2out', label:'L2', x:50, y:125}, {id:'L3out', label:'L3', x:80, y:125} 
    ],
    getInternalPaths: (state) => state.on ? [['L1in', 'L1out'], ['L2in', 'L2out'], ['L3in', 'L3out']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 100, 140, "#f1f5f9");
        // Label
        ctx.fillStyle = "#fef08a"; ctx.fillRect(20, 40, 60, 60);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.strokeRect(20, 40, 60, 60);
        tools.text(ctx, 'MAIN SW', 50, 30, '#000', 10, "bold");
        tools.text(ctx, '415V', 50, 115, '#ef4444', 12, "bold");
        // Handle
        ctx.save(); ctx.translate(50, 70);
        if(state.on) ctx.rotate(Math.PI / 2);
        ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6;
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#b91c1c"; ctx.beginPath(); 
        if(ctx.roundRect) ctx.roundRect(-10, -35, 20, 70, 4); else ctx.rect(-10,-35,20,70); ctx.fill();
        ctx.restore();
    }
});

// 2. 3-PHASE MOTOR
Engine.register({
    type: 'motor_3ph',
    label: 'Motor',
    category: 'Industrial',
    role: 'load',
    size: { w: 120, h: 120 },
    terminals: [ {id:'U', x:30, y:20}, {id:'V', x:60, y:20}, {id:'W', x:90, y:20}, {id:'E', x:105, y:20} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 20, 0, 80, 30, "#475569");
        const grad = ctx.createLinearGradient(0, 30, 120, 30);
        grad.addColorStop(0, "#334155"); grad.addColorStop(0.3, "#94a3b8"); grad.addColorStop(1, "#334155");
        ctx.fillStyle = grad;
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(10, 30, 100, 90, 4); else ctx.rect(10,30,100,90); ctx.fill();
        // Fins
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
        for(let y=40; y<110; y+=10) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(110, y); ctx.stroke(); }
        // Shaft
        ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.arc(60, 75, 15, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#475569"; ctx.stroke();
        if(state.lit) {
            ctx.save(); ctx.translate(60, 75);
            ctx.rotate((Date.now() / 20) % (Math.PI * 2));
            ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(-2, -15, 4, 30);
            ctx.restore();
        }
        tools.text(ctx, '3-PHASE', 60, 110, '#fff', 10);
    }
});

// 3. INDUSTRIAL SOCKET
Engine.register({
    type: 'commando_socket',
    label: '415V Socket',
    category: 'Industrial',
    role: 'load',
    size: { w: 100, h: 140 },
    terminals: [ 
        {id:'L1', x:20, y:30}, {id:'L2', x:50, y:30}, {id:'L3', x:80, y:30},
        {id:'N', x:35, y:120}, {id:'E', x:65, y:120} // Moved down slightly
    ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        const grd = ctx.createLinearGradient(0, 0, 100, 140);
        grd.addColorStop(0, "#ef4444"); grd.addColorStop(1, "#b91c1c");
        ctx.save(); ctx.fillStyle = grd; ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(10, 10); ctx.lineTo(90, 10); ctx.lineTo(100, 40); ctx.lineTo(100, 130); ctx.lineTo(0, 130); ctx.lineTo(0, 40); ctx.closePath(); ctx.fill(); ctx.restore();
        tools.plasticRect(ctx, 15, 45, 70, 70, "#f3f4f6", false);
        ctx.fillStyle = "#374151"; ctx.fillRect(25, 40, 50, 8);
        tools.text(ctx, '415V', 50, 80, '#ef4444', 16, "bold");
    }
});

// 4. EMERGENCY STOP
Engine.register({
    type: 'estop',
    label: 'E-Stop',
    category: 'Industrial',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 110 },
    terminals: [ {id:'L1in', label:'1', x:20, y:15}, {id:'L1out', label:'2', x:20, y:95}, {id:'L2in', label:'3', x:70, y:15}, {id:'L2out', label:'4', x:70, y:95} ],
    getInternalPaths: (state) => !state.on ? [['L1in', 'L1out'], ['L2in', 'L2out']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 90, 110, "#facc15");
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(45, 55, 38, 0, Math.PI*2); ctx.fill();
        tools.text(ctx, 'EMERGENCY', 45, 25, '#facc15', 8, "bold");
        ctx.save(); ctx.translate(45, 55);
        const scale = state.on ? 0.9 : 1.0; ctx.scale(scale, scale);
        const rGrd = ctx.createRadialGradient(-10, -10, 5, 0, 0, 30);
        rGrd.addColorStop(0, "#ef4444"); rGrd.addColorStop(1, "#991b1b");
        ctx.fillStyle = rGrd; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
});

// 5. HIGH BAY LIGHT
Engine.register({
    type: 'high_bay',
    label: 'High Bay',
    category: 'Industrial',
    role: 'load',
    size: { w: 120, h: 120 },
    terminals: [ {id:'L', x:30, y:20}, {id:'N', x:60, y:20}, {id:'E', x:90, y:20} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 25, 0, 70, 40, "#1f2937");
        ctx.save(); ctx.translate(60, 70);
        ctx.fillStyle = "#334155"; ctx.beginPath(); ctx.arc(0, 0, 55, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
        for(let i=0; i<12; i++) { ctx.rotate(Math.PI/6); ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(55, 0); ctx.stroke(); }
        ctx.restore();
        const litColor = state.lit ? "#fef08a" : "#cbd5e1";
        ctx.fillStyle = litColor; ctx.beginPath(); ctx.arc(60, 70, 25, 0, Math.PI*2); ctx.fill();
    }
});

// 6. 3-PHASE SUPPLY
Engine.register({
    type: 'supply_3ph',
    label: '3-Ph Supply',
    category: 'Industrial',
    role: 'source',
    size: { w: 140, h: 120 },
    terminals: [ 
        {id:'L1', x:25, y:100}, {id:'L2', x:55, y:100}, {id:'L3', x:85, y:100},
        {id:'N', x:115, y:100}, {id:'E', x:70, y:30} 
    ],
    getInternalPaths: () => [['N', 'E']],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 140, 120, "#374151");
        [25, 55, 85].forEach(x => { ctx.fillStyle="#000"; ctx.fillRect(x-10, 40, 20, 50); });
        ctx.fillStyle="#1f2937"; ctx.fillRect(105, 40, 20, 50); 
        tools.text(ctx, '400V IN', 70, 15, '#fff', 12, "bold");
    }
});

// 7. TPN DISTRIBUTION BOARD (Cleaned Up Labels)
Engine.register({
    type: 'db_3ph',
    label: 'TPN Board',
    category: 'Industrial',
    size: { w: 200, h: 300 },
    terminals: [
        // SUPPLY (Bottom)
        {id:'L1_in', label:'L1', x:40, y:270}, {id:'L2_in', label:'L2', x:70, y:270}, {id:'L3_in', label:'L3', x:100, y:270}, 
        {id:'N_in', label:'N', x:130, y:270}, {id:'E_in', label:'E', x:160, y:270},
        // BUSBAR OUTPUTS 1 (Top Left)
        {id:'L1_out', label:'L1', x:40, y:90}, {id:'L2_out', label:'L2', x:70, y:90}, {id:'L3_out', label:'L3', x:100, y:90},
        // BUSBAR OUTPUTS 2 (Mid Left)
        {id:'L1_out2', label:'L1', x:40, y:140}, {id:'L2_out2', label:'L2', x:70, y:140}, {id:'L3_out2', label:'L3', x:100, y:140},
        // BARS
        {id:'N_bar', label:'N', x:160, y:90}, {id:'E_bar', label:'E', x:180, y:90}
    ],
    getInternalPaths: () => [
        ['L1_in','L1_out'], ['L2_in','L2_out'], ['L3_in','L3_out'],
        ['L1_in','L1_out2'], ['L2_in','L2_out2'], ['L3_in','L3_out2'],
        ['N_in','N_bar'], ['E_in','E_bar']
    ],
    render: (ctx, state, tools) => {
        const grd = ctx.createLinearGradient(0, 0, 200, 300);
        grd.addColorStop(0, "#9ca3af"); grd.addColorStop(1, "#d1d5db");
        ctx.fillStyle = grd;
        ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(0, 0, 200, 300, 4); else ctx.rect(0,0,200,300); ctx.fill();
        ctx.strokeStyle = "#4b5563"; ctx.lineWidth = 4; ctx.stroke();
        
        ctx.fillStyle = "#000"; ctx.fillRect(180, 130, 10, 40);
        tools.text(ctx, 'TPN BOARD', 100, 30, '#374151', 12, "bold");
        tools.text(ctx, 'BUSBARS', 90, 65, '#4b5563', 10);
        tools.text(ctx, 'SUPPLY IN', 100, 240, '#4b5563', 10);
        
        ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 2;
        for(let y=200; y<230; y+=10) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(160, y); ctx.stroke(); }
    }
});

// 8. 3-PHASE MCB
Engine.register({
    type: 'mcb_3ph',
    label: '3-Ph MCB',
    category: 'Industrial',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 130 },
    terminals: [ 
        {id:'L1in', label:'1', x:15, y:15}, {id:'L2in', label:'3', x:45, y:15}, {id:'L3in', label:'5', x:75, y:15},
        {id:'L1out', label:'2', x:15, y:115}, {id:'L2out', label:'4', x:45, y:115}, {id:'L3out', label:'6', x:75, y:115}
    ],
    getInternalPaths: (state) => state.on ? [['L1in','L1out'], ['L2in','L2out'], ['L3in','L3out']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 90, 130, "#fff");
        tools.toggle(ctx, 10, 40, 70, 30, state.on, "#334155");
        tools.text(ctx, 'C32', 45, 90, '#000', 12, "bold");
        tools.text(ctx, '3-POLE', 45, 105, '#94a3b8', 9);
    }
});
// --- CONTROL SYSTEM (24V) ---

// 9. 24V POWER SUPPLY (DIN Rail)
Engine.register({
    type: 'plc_psu',
    label: '24V PSU',
    category: 'Industrial',
    role: 'source', // Acts as source for DC side, load for AC side
    size: { w: 60, h: 130 },
    terminals: [ 
        {id:'L', x:15, y:20}, {id:'N', x:45, y:20}, // 230V Input
        {id:'Pos', x:15, y:110}, {id:'Neg', x:45, y:110} // 24V Output
    ],
    // Logic: If AC Input -> Enable DC Output
    getInternalPaths: () => [], // Handled by custom logic in Engine if needed, or simple source assumption
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 130, "#fff");
        // Vents
        ctx.fillStyle = "#cbd5e1";
        for(let y=40; y<90; y+=6) ctx.fillRect(10, y, 40, 2);
        
        // LED
        const on = Engine.isLive(state.id, 'L'); // Check if powered
        tools.circle(ctx, 30, 100, 4, on ? "#22c55e" : "#334155");
        
        tools.text(ctx, 'DC 24V', 30, 60, '#334155', 10, "bold");
        tools.text(ctx, 'INPUT', 30, 35, '#64748b', 8);
        tools.text(ctx, 'OUTPUT', 30, 90, '#64748b', 8);
    }
});

// Custom Logic Hook: We need the PSU to become a "Source" for the 24V network if powered
// Add this to Engine.calculate loop in a real app. For now, we can treat it as a passive switch 
// that connects an invisible internal 24V source? 
// SIMPLER: Let's define the terminals Pos/Neg as connected to an internal source *if* L/N are live.
// Since Engine doesn't support conditional sources easily, we will simulate it by
// allowing the user to connect a battery, OR just assume this component *is* a source for simplicity in this demo version.
// UPDATED DEFINITION FOR SIMULATION:
Engine.register({
    type: 'plc_psu',
    label: '24V PSU',
    category: 'Industrial',
    role: 'source', 
    size: { w: 60, h: 130 },
    terminals: [ {id:'L', x:15, y:20}, {id:'N', x:45, y:20}, {id:'Pos', x:15, y:110}, {id:'Neg', x:45, y:110} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 130, "#fff");
        for(let y=40; y<90; y+=6) { ctx.fillStyle="#e2e8f0"; ctx.fillRect(10, y, 40, 2); }
        // Green LED always on for this simplified source version
        tools.circle(ctx, 30, 100, 4, "#22c55e");
        tools.text(ctx, '24V DC', 30, 60, '#334155', 10, "bold");
        tools.text(ctx, '+', 15, 120, '#ef4444', 10);
        tools.text(ctx, '-', 45, 120, '#1d4ed8', 10);
    }
});

// 10. PUSH BUTTON (Green Start - NO)
Engine.register({
    type: 'btn_start',
    label: 'Start Btn',
    category: 'Industrial',
    role: 'switch',
    hasSwitch: true, // Click to press
    size: { w: 60, h: 80 },
    terminals: [ {id:'13', x:15, y:65}, {id:'14', x:45, y:65} ],
    // Momentary logic usually, but toggle for sim ease unless we add mouseup/down listeners
    getInternalPaths: (state) => state.on ? [['13', '14']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 80, "#e5e7eb");
        // Button Head
        const c = state.on ? "#15803d" : "#22c55e";
        tools.circle(ctx, 30, 30, 20, c);
        // Bezel
        ctx.strokeStyle = "#9ca3af"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(30,30,20,0,Math.PI*2); ctx.stroke();
        tools.text(ctx, 'START', 30, 70, '#064e3b', 8, "bold");
        tools.text(ctx, 'NO', 30, 10, '#64748b', 8);
    }
});

// 11. PUSH BUTTON (Red Stop - NC)
Engine.register({
    type: 'btn_stop',
    label: 'Stop Btn',
    category: 'Industrial',
    role: 'switch',
    hasSwitch: true,
    size: { w: 60, h: 80 },
    terminals: [ {id:'11', x:15, y:65}, {id:'12', x:45, y:65} ],
    // NC Logic: Connected when NOT pressed
    getInternalPaths: (state) => !state.on ? [['11', '12']] : [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 80, "#e5e7eb");
        // Button Head
        const c = state.on ? "#991b1b" : "#ef4444";
        tools.circle(ctx, 30, 30, 20, c);
        tools.text(ctx, 'STOP', 30, 70, '#7f1d1d', 8, "bold");
        tools.text(ctx, 'NC', 30, 10, '#64748b', 8);
    }
});

// 12. PILOT LIGHT (Panel Mount)
Engine.register({
    type: 'pilot_green',
    label: 'Run Light',
    category: 'Industrial',
    role: 'load',
    size: { w: 60, h: 80 },
    terminals: [ {id:'X1', x:15, y:65}, {id:'X2', x:45, y:65} ], // X1/X2 standard for lamps
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 80, "#e5e7eb");
        // Lens
        const c = state.lit ? "#22c55e" : "#14532d";
        const glow = state.lit ? 15 : 0;
        ctx.shadowColor = "#22c55e"; ctx.shadowBlur = glow;
        tools.circle(ctx, 30, 30, 18, c);
        ctx.shadowBlur = 0;
        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.arc(25, 25, 5, 0, Math.PI*2); ctx.fill();
        tools.text(ctx, 'RUN', 30, 55, '#000', 8);
    }
});

Engine.register({
    type: 'pilot_red',
    label: 'Trip Light',
    category: 'Industrial',
    role: 'load',
    size: { w: 60, h: 80 },
    terminals: [ {id:'X1', x:15, y:65}, {id:'X2', x:45, y:65} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 60, 80, "#e5e7eb");
        const c = state.lit ? "#ef4444" : "#7f1d1d";
        const glow = state.lit ? 15 : 0;
        ctx.shadowColor = "#ef4444"; ctx.shadowBlur = glow;
        tools.circle(ctx, 30, 30, 18, c);
        ctx.shadowBlur = 0;
        tools.text(ctx, 'TRIP', 30, 55, '#000', 8);
    }
});

// 13. SELECTOR SWITCH (Hand/Off/Auto)
Engine.register({
    type: 'sw_man_auto',
    label: 'Selector',
    category: 'Industrial',
    role: 'switch',
    hasSwitch: true,
    states: 3, // Enable 3-state cycling (0, 1, 2) in interaction.js
    size: { w: 80, h: 100 },
    terminals: [ 
        {id:'C', x:40, y:20}, // Common
        {id:'1', x:20, y:80}, // Hand
        {id:'2', x:60, y:80}  // Auto
    ],
    // Logic: 0=Hand, 1=Off, 2=Auto (Matches visual rotation below)
    // NOTE: Order of click cycle is 0->1->2. 
    // Let's map: 0 = Hand (Left), 1 = Off (Center), 2 = Auto (Right)
    getInternalPaths: (state) => {
        const val = state.switchVal || 0;
        if(val === 0) return [['C', '1']]; // Hand connected
        if(val === 2) return [['C', '2']]; // Auto connected
        return []; // Off (1) connected to nothing
    },
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 80, 100, "#e5e7eb");
        
        tools.text(ctx, 'HAND', 20, 20, '#000', 8);
        tools.text(ctx, 'OFF', 40, 10, '#000', 8);
        tools.text(ctx, 'AUTO', 60, 20, '#000', 8);
        
        // Knob Rotation
        ctx.save(); ctx.translate(40, 50);
        const val = state.switchVal || 0;
        // 0=Left (-45), 1=Center (0), 2=Right (45)
        let rot = 0;
        if(val === 0) rot = -Math.PI/4;
        if(val === 2) rot = Math.PI/4;
        
        ctx.rotate(rot);
        
        tools.plasticRect(ctx, -8, -20, 16, 40, "#000"); // Handle
        ctx.fillStyle = "#fff"; ctx.fillRect(-2, -15, 4, 15); // Marker
        ctx.restore();
    }
});
// 14. INDUSTRIAL PLC (Allen-Bradley Micro820 Style - 10 INPUTS)
Engine.register({
    type: 'plc_mini',
    label: 'PLC',
    category: 'Industrial',
    role: 'controller',
    size: { w: 380, h: 180 }, // Widened for 10 inputs
    terminals: [
        // Power (Left)
        {id:'L', x:20, y:15, label:'+24V', labelOffset:12}, 
        {id:'N', x:50, y:15, label:'-24V', labelOffset:12},
        
        // Inputs (Top Strip: I00 - I09)
        {id:'I1', x:90, y:15, label:'I-00', labelOffset:12}, 
        {id:'I2', x:115, y:15, label:'I-01', labelOffset:12}, 
        {id:'I3', x:140, y:15, label:'I-02', labelOffset:12}, 
        {id:'I4', x:165, y:15, label:'I-03', labelOffset:12},
        {id:'I5', x:190, y:15, label:'I-04', labelOffset:12},
        {id:'I6', x:215, y:15, label:'I-05', labelOffset:12},
        {id:'I7', x:240, y:15, label:'I-06', labelOffset:12}, // New
        {id:'I8', x:265, y:15, label:'I-07', labelOffset:12}, // New
        {id:'I9', x:290, y:15, label:'I-08', labelOffset:12}, // New
        {id:'I10', x:315, y:15, label:'I-09', labelOffset:12},// New
        
        // Outputs (Bottom Strip)
        {id:'Q1_in', x:30, y:165, label:'CM0', labelOffset:-12}, {id:'Q1_out', x:50, y:165, label:'O-00', labelOffset:-12},
        {id:'Q2_in', x:90, y:165, label:'CM1', labelOffset:-12}, {id:'Q2_out', x:110, y:165, label:'O-01', labelOffset:-12},
        {id:'Q3_in', x:150, y:165, label:'CM2', labelOffset:-12}, {id:'Q3_out', x:170, y:165, label:'O-02', labelOffset:-12},
        {id:'Q4_in', x:210, y:165, label:'CM3', labelOffset:-12}, {id:'Q4_out', x:230, y:165, label:'O-03', labelOffset:-12}
    ],
    getInternalPaths: (state) => {
        const paths = [];
        if(state.outputs?.Q1) paths.push(['Q1_in', 'Q1_out']);
        if(state.outputs?.Q2) paths.push(['Q2_in', 'Q2_out']);
        if(state.outputs?.Q3) paths.push(['Q3_in', 'Q3_out']);
        if(state.outputs?.Q4) paths.push(['Q4_in', 'Q4_out']);
        return paths;
    },
    render: (ctx, state, tools) => {
        const w = 380, h = 180;
        
        // 1. Body
        tools.plasticRect(ctx, 0, 0, w, h, "#e5e7eb");
        
        // 2. Black Strips
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(0, 0, w, 35); 
        ctx.fillRect(0, h-35, w, 35); 
        
        // 3. Branding
        ctx.fillStyle = "#00909e"; ctx.fillRect(10, 45, 40, 40);
        tools.text(ctx, 'AB', 30, 65, '#fff', 14, "bold");
        tools.text(ctx, 'Allen-Bradley', 100, 55, '#374151', 12, "bold");
        tools.text(ctx, 'Micro820', 90, 70, '#6b7280', 10);

        // 4. Power LED (Shifted Right)
        const powered = Engine.isLive(state.id, 'L');
        tools.text(ctx, 'POWER', 340, 55, '#374151', 9, "bold");
        tools.text(ctx, 'RUN', 340, 75, '#374151', 9, "bold");
        tools.circle(ctx, 365, 55, 4, powered ? '#22c55e' : '#9ca3af');
        tools.circle(ctx, 365, 75, 4, powered ? '#22c55e' : '#9ca3af');

        // 5. Status LEDs (Widened)
        const ledBoxX = 60, ledBoxY = 90;
        ctx.fillStyle = "#374151"; 
        ctx.fillRect(ledBoxX, ledBoxY, 260, 45); // Widened background
        
        const drawStatus = (label, idx, on, isInput) => {
            const lx = ledBoxX + 15 + (idx * 25);
            const ly = ledBoxY + (isInput ? 15 : 32);
            ctx.fillStyle = "#9ca3af"; ctx.font = "9px monospace"; ctx.textAlign="center";
            ctx.fillText(label, lx, ly - 8);
            ctx.fillStyle = on ? "#facc15" : "#4b5563"; 
            ctx.beginPath(); ctx.arc(lx, ly, 3, 0, Math.PI*2); ctx.fill();
            if(on) { ctx.shadowColor="#facc15"; ctx.shadowBlur=5; ctx.fill(); ctx.shadowBlur=0; }
        };

        const ins = state.inputs || {};
        const outs = state.outputs || {};
        
        // Draw 10 Inputs (00-09)
        for(let i=0; i<10; i++) {
            drawStatus(`0${i}`, i, ins[`I${i+1}`], true);
        }
        
        // Draw 4 Outputs (00-03)
        for(let i=0; i<4; i++) {
            drawStatus(`0${i}`, i, outs[`Q${i+1}`], false);
        }

        ctx.fillStyle = "#9ca3af"; ctx.font = "italic 9px Arial";
        ctx.textAlign = "right"; ctx.fillText("Input 24VDC", w-10, 30);
        ctx.textAlign = "right"; ctx.fillText("Relay Output", w-10, h-8);
    }
});