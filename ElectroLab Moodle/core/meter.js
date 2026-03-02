/* core/meter.js - Added Amps & Capacitance */
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
        // Update UI Buttons
        document.querySelectorAll('.meter-controls button').forEach(b => b.classList.remove('active'));
        const btnMap = {
            'volts': 'btn-meter-v',
            'ohms': 'btn-meter-o',
            'amps': 'btn-meter-a', // NEW
            'cap': 'btn-meter-f',   // NEW
            'off': 'btn-meter-off'
        };
        if(btnMap[m]) document.getElementById(btnMap[m]).classList.add('active');
        
        Meter.updateDisplay(true); 
    },

    // Helper: Parse "10k", "4.7uF", etc. to numbers
    parseValue: (str, unit) => {
        if(!str) return 0;
        let s = str.toString().toLowerCase().replace(unit,'').trim();
        let mult = 1;
        if(s.includes('m') && !s.includes('mm')) mult = 1000000; // Mega (Resistor)
        else if(s.includes('k')) mult = 1000; // Kilo
        else if(s.includes('u') || s.includes('µ')) mult = 0.000001; // Micro
        else if(s.includes('n')) mult = 0.000000001; // Nano
        else if(s.includes('p')) mult = 0.000000000001; // Pico
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
        
        // 1. If probes aren't touching anything
        if(!p1.compId || !p2.compId) {
            if(Meter.mode === 'volts') el.innerText = "0.00 V";
            else el.innerText = "OL"; // Open Loop for R/C/I
            return;
        }

        // 2. VOLTAGE MODE (V DC/AC)
        if(Meter.mode === 'volts') {
            if(!Engine.powerOn) { el.innerText = "0.00 V"; return; }
            
            // Default mode is 'stable', so we don't need to pass 'instant'
            const v1 = Engine.getPotential(p1.compId, p1.termId); 
            const v2 = Engine.getPotential(p2.compId, p2.termId);
            const diff = Math.abs(v1 - v2);
            el.innerText = diff.toFixed(2) + " V";
        }
        
        // 3. RESISTANCE MODE (Ohms)
        else if(Meter.mode === 'ohms') {
            if(Engine.powerOn) { el.innerText = "ERR:LIVE"; return; }
            const connected = Engine.checkConnection(p1.compId, p1.termId, p2.compId, p2.termId);
            
            if(connected) {
                // If probing a resistor directly, show its value
                if(p1.compId === p2.compId) {
                    const comp = Engine.components.find(c => c.id === p1.compId);
                    if(comp && comp.type === 'resistor') {
                        el.innerText = comp.state.value || "1kΩ";
                        return;
                    }
                }
                el.innerText = "0.1 Ω"; // Continuity
            } else {
                el.innerText = "OL";
            }
        }

        // 4. CAPACITANCE MODE (Farads) - NEW!
        else if(Meter.mode === 'cap') {
            if(Engine.powerOn) { el.innerText = "ERR:DISCH"; return; } // Must be off
            
            // Must probe the SAME component to read capacitance
            if(p1.compId === p2.compId) {
                const comp = Engine.components.find(c => c.id === p1.compId);
                if(comp && comp.type === 'capacitor') {
                    el.innerText = comp.state.value || "10μF";
                    return;
                }
            }
            el.innerText = "0.0 nF";
        }

        // 5. CURRENT MODE (Amps) - NEW!
        else if(Meter.mode === 'amps') {
            if(!Engine.powerOn) { el.innerText = "0.00 A"; return; }
            
            // "Clamp" Logic: Calculate I = V/R for the component we are probing
            if(p1.compId === p2.compId) {
                const comp = Engine.components.find(c => c.id === p1.compId);
                const v1 = Engine.getPotential(p1.compId, p1.termId);
                const v2 = Engine.getPotential(p2.compId, p2.termId);
                const volts = Math.abs(v1 - v2);

                if(comp.type === 'resistor') {
                    const ohms = Meter.parseValue(comp.state.value || "1k", "");
                    const amps = volts / ohms;
                    // Format display
                    if(amps < 0.001) el.innerText = (amps*1000000).toFixed(1) + " μA";
                    else if(amps < 1) el.innerText = (amps*1000).toFixed(1) + " mA";
                    else el.innerText = amps.toFixed(2) + " A";
                }
                else if(comp.type === 'led_red' && volts > 1.5) {
                    el.innerText = "20.0 mA"; // Standard LED current
                }
                else {
                    el.innerText = "0.00 A";
                }
            } else {
                el.innerText = "0.00 A"; // Can only measure THROUGH a component
            }
        }
    }
};