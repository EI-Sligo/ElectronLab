/* RENEWABLE COMPONENTS - HIGH FIDELITY */

// 1. PV PANEL (Glass & Aluminum Look)
Engine.register({
    type: 'pv_panel',
    label: 'PV Panel',
    category: 'Renewables',
    role: 'source',
    size: { w: 120, h: 180 },
    terminals: [ {id:'Pos', x:30, y:165}, {id:'Neg', x:90, y:165} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        // Aluminum Frame
        const frameGrd = ctx.createLinearGradient(0, 0, 120, 180);
        frameGrd.addColorStop(0, "#e2e8f0"); frameGrd.addColorStop(1, "#94a3b8");
        ctx.fillStyle = frameGrd;
        ctx.beginPath(); ctx.roundRect(0, 0, 120, 180, 4); ctx.fill();
        
        // Solar Cells (Dark Blue/Black Glass)
        const cellGrd = ctx.createLinearGradient(0, 0, 120, 180);
        cellGrd.addColorStop(0, "#172554"); cellGrd.addColorStop(1, "#1e3a8a");
        ctx.fillStyle = cellGrd;
        ctx.fillRect(5, 5, 110, 150);
        
        // Grid Lines
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=1; i<4; i++) { ctx.moveTo(5, 5 + i*37.5); ctx.lineTo(115, 5 + i*37.5); } // Horiz
        for(let j=1; j<3; j++) { ctx.moveTo(5 + j*36.6, 5); ctx.lineTo(5 + j*36.6, 155); } // Vert
        ctx.stroke();

        // Junction Box at bottom
        tools.plasticRect(ctx, 20, 155, 80, 20, "#000");
        tools.text(ctx, '+', 30, 165, '#ef4444', 12, "bold");
        tools.text(ctx, '-', 90, 165, '#3b82f6', 12, "bold");
    }
});

// 2. HYBRID INVERTER (Appliance Look)
Engine.register({
    type: 'inverter',
    label: 'Inverter',
    category: 'Renewables',
    role: 'switch',
    size: { w: 160, h: 180 },
    terminals: [
        {id:'PVPos', x:30, y:165}, {id:'PVNeg', x:50, y:165}, // DC Input
        {id:'Lout', x:110, y:165}, {id:'Nout', x:130, y:165}  // AC Output
    ],
    getInternalPaths: (state) => state.energized ? [['PVPos', 'Lout'], ['PVNeg', 'Nout']] : [],
    render: (ctx, state, tools) => {
        // White Glossy Body
        tools.plasticRect(ctx, 0, 0, 160, 180, "#fff");
        
        // Dark Grey Header / Heat Sink area
        ctx.fillStyle = "#334155";
        ctx.beginPath(); ctx.roundRect(0, 0, 160, 40, [4,4,0,0]); ctx.fill();
        tools.text(ctx, 'SOLAR HYBRID', 80, 20, '#cbd5e1', 14, "bold");

        // LCD Screen
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(20, 60, 120, 50); // Bezel
        ctx.fillStyle = state.energized ? "#22c55e" : "#334155"; // Backlight
        ctx.fillRect(25, 65, 110, 40); // Screen
        
        // Screen Text
        if(state.energized) {
            tools.text(ctx, 'GENERATING', 80, 85, '#064e3b', 12, "bold");
        } else {
            tools.text(ctx, 'STANDBY', 80, 85, '#94a3b8', 12, "bold");
        }

        // Status LEDs
        tools.circle(ctx, 40, 130, 4, state.energized ? '#22c55e' : '#334155'); // Power
        tools.circle(ctx, 60, 130, 4, '#ef4444'); // Fault
        tools.circle(ctx, 80, 130, 4, '#3b82f6'); // Wifi

        // Terminal Labels
        tools.text(ctx, 'DC IN', 40, 155, '#64748b', 9);
        tools.text(ctx, 'AC OUT', 120, 155, '#64748b', 9);
    }
});

// 3. DC ISOLATOR (Rotary Switch)
Engine.register({
    type: 'dc_iso',
    label: 'DC Isolator',
    category: 'Renewables',
    role: 'switch',
    hasSwitch: true,
    size: { w: 90, h: 110 },
    terminals: [ {id:'InPos', x:20, y:15}, {id:'InNeg', x:70, y:15}, {id:'OutPos', x:20, y:95}, {id:'OutNeg', x:70, y:95} ],
    getInternalPaths: (state) => state.on ? [['InPos', 'OutPos'], ['InNeg', 'OutNeg']] : [],
    render: (ctx, state, tools) => {
        // Grey Industrial Box
        tools.plasticRect(ctx, 0, 0, 90, 110, "#e2e8f0");
        
        // Yellow Label Background
        ctx.fillStyle = "#facc15";
        ctx.fillRect(20, 30, 50, 50);
        ctx.strokeStyle = "#000"; ctx.lineWidth = 1; ctx.strokeRect(20, 30, 50, 50);

        // Rotary Switch Handle (Red)
        ctx.save();
        ctx.translate(45, 55);
        if(state.on) ctx.rotate(Math.PI / 2); // Rotate 90deg if ON
        
        ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 5;
        ctx.fillStyle = "#ef4444"; // Red Handle
        ctx.beginPath(); ctx.roundRect(-8, -25, 16, 50, 4); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
        
        // Locking hole
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(0, 15, 2, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        tools.text(ctx, 'DC ISOLATOR', 45, 95, '#1e293b', 10, "bold");
    }
});
// 4. AC BATTERY STORAGE (Sleek Wall Unit)
Engine.register({
    type: 'battery_ac',
    label: 'AC Battery',
    category: 'Renewables',
    role: 'load', // Acts as load when charging, source when discharging (simplified to load for sim)
    size: { w: 140, h: 200 },
    terminals: [ {id:'L', x:30, y:185}, {id:'N', x:70, y:185}, {id:'E', x:110, y:185} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        // Sleek White Body
        tools.plasticRect(ctx, 0, 0, 140, 200, "#fff");
        
        // Side glowing strip (Status)
        const glow = state.lit ? "#22c55e" : "#e2e8f0";
        ctx.fillStyle = glow;
        ctx.shadowColor = state.lit ? "#22c55e" : "transparent";
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.roundRect(120, 20, 10, 160, 5); ctx.fill();
        ctx.shadowBlur = 0;

        // Branding
        tools.text(ctx, 'POWERSTORE', 60, 30, '#94a3b8', 12, "bold");
        
        // Capacity Indicator
        ctx.fillStyle = "#f1f5f9"; ctx.fillRect(40, 80, 40, 60); // Screen
        if(state.lit) {
            ctx.fillStyle = "#22c55e";
            ctx.fillRect(45, 110, 30, 25); // Half full
            tools.text(ctx, 'CHARGING', 60, 95, '#064e3b', 8);
        }
    }
});

// 5. EV CHARGER (Wallbox)
Engine.register({
    type: 'ev_charger',
    label: 'EV Charger',
    category: 'Renewables',
    role: 'load',
    size: { w: 100, h: 140 },
    terminals: [ {id:'L', x:25, y:125}, {id:'N', x:75, y:125}, {id:'E', x:50, y:80} ],
    getInternalPaths: () => [],
    render: (ctx, state, tools) => {
        // Dark Grey Body
        tools.plasticRect(ctx, 0, 0, 100, 140, "#1f2937");
        
        // Front Faceplate
        ctx.fillStyle = "#374151";
        ctx.beginPath(); ctx.roundRect(10, 10, 80, 100, 4); ctx.fill();
        
        // LED Ring (Status)
        ctx.strokeStyle = state.lit ? "#3b82f6" : "#4b5563";
        ctx.lineWidth = 4;
        ctx.shadowColor = state.lit ? "#3b82f6" : "transparent";
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(50, 50, 20, 0, Math.PI*2); ctx.stroke();
        ctx.shadowBlur = 0;

        // Cable Holster visual
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(50, 50, 12, 0, Math.PI*2); ctx.fill();
        
        // Tethered Cable drape
        ctx.strokeStyle = "#000"; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(50, 50); ctx.bezierCurveTo(50, 150, 120, 150, 100, 100); ctx.stroke();

        tools.text(ctx, '7.4kW', 50, 95, '#9ca3af', 10);
    }
});

// 6. GENERATION METER (Digital)
Engine.register({
    type: 'gen_meter',
    label: 'Gen Meter',
    category: 'Renewables',
    role: 'passive',
    size: { w: 90, h: 110 },
    terminals: [ {id:'Lin', x:25, y:15}, {id:'Nin', x:65, y:15}, {id:'Lout', x:25, y:95}, {id:'Nout', x:65, y:95} ],
    getInternalPaths: () => [['Lin', 'Lout'], ['Nin', 'Nout']],
    render: (ctx, state, tools) => {
        tools.plasticRect(ctx, 0, 0, 90, 110, "#fff");
        
        // Screen area
        ctx.fillStyle = "#e2e8f0"; ctx.fillRect(15, 30, 60, 40);
        ctx.fillStyle = "#94a3b8"; // LCD Backing
        
        // Digital Digits
        tools.text(ctx, '00428', 45, 50, '#000', 14, "monospace");
        tools.text(ctx, 'kWh', 65, 62, '#000', 8);
        
        // LED Pulse
        ctx.fillStyle = "red"; ctx.beginPath(); ctx.arc(45, 80, 3, 0, Math.PI*2); ctx.fill();
        tools.text(ctx, '1000 imp/kWh', 45, 90, '#64748b', 7);
    }
});