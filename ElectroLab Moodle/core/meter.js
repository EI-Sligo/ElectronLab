/* core/meter.js - Smart Resistance Reading */
const Meter = {
    mode: 'off', 
    voltageSetting: 500,
    lastUpdate: 0,
    
    probes: {
        red: { x: 50, y: 300, compId: null, termId: null },
        black: { x: 100, y: 300, compId: null, termId: null }
    },

    setMode: (m) => {
        Meter.mode = m;
        document.querySelectorAll('.meter-controls button').forEach(b => b.classList.remove('active'));
        if(m === 'volts') document.getElementById('btn-meter-v').classList.add('active');
        if(m === 'ohms') document.getElementById('btn-meter-o').classList.add('active');
        if(m === 'off') document.getElementById('btn-meter-off').classList.add('active');
        Meter.updateDisplay(true); 
    },

    // Helper to convert "10k" or "4.7M" into raw numbers
    parseResistance: (str) => {
        if(!str) return 0;
        let s = str.toString().toLowerCase().replace('ω','').replace('ohm','');
        let mult = 1;
        if(s.includes('m') && !s.includes('mm')) mult = 1000000;
        else if(s.includes('k')) mult = 1000;
        return parseFloat(s) * mult;
    },

    updateDisplay: (force = false) => {
        const el = document.getElementById('meter-display');
        if(!el) return;

        const now = Date.now();
        if(!force && now - Meter.lastUpdate < 250) return;
        Meter.lastUpdate = now;

        if(Meter.mode === 'off') { el.innerText = "---"; return; }

        const p1 = Meter.probes.red;
        const p2 = Meter.probes.black;
        
        if(!p1.compId || !p2.compId) {
            el.innerText = Meter.mode === 'ohms' ? "OL" : "0.00 V";
            return;
        }

        if(Meter.mode === 'volts') {
            if(!Engine.powerOn) { el.innerText = "0.00 V"; return; }
            const v1 = Engine.getPotential(p1.compId, p1.termId);
            const v2 = Engine.getPotential(p2.compId, p2.termId);
            const diff = Math.abs(v1 - v2);
            el.innerText = diff.toFixed(2) + " V";
        } 
        else if(Meter.mode === 'ohms') {
            if(Engine.powerOn) { el.innerText = "ERR:LIVE"; return; }
            
            // Check continuity first
            const connected = Engine.checkConnection(p1.compId, p1.termId, p2.compId, p2.termId);
            if(!connected) {
                el.innerText = "OL";
            } else {
                // SMART RESISTANCE LOGIC:
                // If we are connected across a resistor, read its value.
                // 1. Are we on the same component?
                if(p1.compId === p2.compId) {
                    const comp = Engine.components.find(c => c.id === p1.compId);
                    if(comp && (comp.type === 'resistor' || comp.type === 'potentiometer')) {
                        let val = Meter.parseResistance(comp.state.value || "1k");
                        el.innerText = val < 1000 ? val.toFixed(1) + " Ω" : (val/1000).toFixed(2) + " kΩ";
                        return;
                    }
                }
                
                // 2. Are we connected via wires to a resistor? 
                // (Simplified: Scan components to see if their terminals are touching our probes)
                const resistor = Engine.components.find(c => 
                    c.type === 'resistor' && 
                    Engine.checkConnection(c.id, 'T1', p1.compId, p1.termId) &&
                    Engine.checkConnection(c.id, 'T2', p2.compId, p2.termId)
                );

                if(resistor) {
                    let val = Meter.parseResistance(resistor.state.value || "1k");
                    el.innerText = val < 1000 ? val.toFixed(1) + " Ω" : (val/1000).toFixed(2) + " kΩ";
                } else {
                    // Just a wire or switch
                    el.innerText = "0.1 Ω"; 
                }
            }
        }
    }
};