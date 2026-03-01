const ComponentRegistry = {}; 

const Engine = {
    components: [],
    wires: [],
    powerOn: false,
    liveSet: new Set(),
    neutralSet: new Set(),

    register: (def) => { ComponentRegistry[def.type] = def; },

    add: (type, x, y) => {
        if (!ComponentRegistry[type]) return;
        const def = ComponentRegistry[type];
        
        // FIX: Use default size if component doesn't define one
        const size = def.size || { w: 40, h: 40 }; 

        const comp = {
            id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
            type: type, x: x, y: y, 
            w: size.w, h: size.h, // Use the safe size
            state: { 
                on: false, switchVal: 0, energized: false, lit: false, 
                fault: 'none', label: def.label, 
                inputs: {}, outputs: {}, value: '', lead2: null 
            }
        };
        Engine.components.push(comp);
    },
    remove: (id) => {
        Engine.components = Engine.components.filter(c => c.id !== id);
        Engine.wires = Engine.wires.filter(w => w.startComp !== id && w.endComp !== id);
    },

    removeWire: (wireObj) => {
        Engine.wires = Engine.wires.filter(w => w !== wireObj);
    },

    addWire: (id1, term1, id2, term2, size) => {
     let color = '#94a3b8'; // Default grey

     // Map the drop-down values to actual drawing colors
     if (size === 'red') color = '#ef4444';      
     else if (size === 'black') color = '#1f2937'; 
     else if (size === 'blue') color = '#3b82f6';  
     else if (size === 'yellow') color = '#eab308';    
     else if (size === 'green') color = '#22c55e'; 

     Engine.wires.push({ startComp: id1, startTerm: term1, endComp: id2, endTerm: term2, size: size, color: color });
 },

    isLive: (compId, termId) => Engine.liveSet.has(`${compId}:${termId}`),

    getPotential: (compId, termId) => {
        if (!Engine.liveSet.has(`${compId}:${termId}`)) return 0;
        if (termId.includes('Pos') || termId.includes('Neg') || termId === '13' || termId === '14' || termId === 'A1' || termId.startsWith('I') || termId.startsWith('Q')) return 24;
        return 9;
    },

    getPathsWithFaults: (comp) => {
        const def = ComponentRegistry[comp.type];
        let paths = def.getInternalPaths ? def.getInternalPaths(comp.state) : [];
        const f = comp.state.fault;

        if (f === 'open') return [];
        if (f === 'open_N') paths = paths.filter(p => !p[0].includes('N') && !p[1].includes('N'));

        if (f === 'short_ln' || f === 'earth_le') {
            const terms = def.terminals || [];
            const isL = (id) => ['L','C','SL','Lin','Lout','Pos','L1','L2','L3','X1'].some(k => id.includes(k));
            const isN = (id) => ['N','Nin','Nout','Neg','X2'].some(k => id.includes(k));
            const isE = (id) => ['E','Ein','Eout'].some(k => id.includes(k));

            const lTerms = terms.filter(t => isL(t.id));
            if (f === 'short_ln') {
                const nTerms = terms.filter(t => isN(t.id));
                lTerms.forEach(l => nTerms.forEach(n => paths.push([l.id, n.id])));
            }
            if (f === 'earth_le') {
                const eTerms = terms.filter(t => isE(t.id));
                lTerms.forEach(l => eTerms.forEach(e => paths.push([l.id, e.id])));
            }
        }
        return paths;
    },

    checkConnection: (c1, t1, c2, t2) => {
        if(!c1 || !c2) return false;
        if(c1 === c2 && t1 === t2) return true;
        const startNode = `${c1}:${t1}`;
        const targetNode = `${c2}:${t2}`;
        let queue = [startNode];
        let visited = new Set([startNode]);

        while(queue.length > 0) {
            const curr = queue.shift();
            if(curr === targetNode) return true;
            const lastSep = curr.lastIndexOf(':');
            const currCompId = curr.substring(0, lastSep);
            const currTerm = curr.substring(lastSep + 1);
            const comp = Engine.components.find(c => c.id === currCompId);
            
            Engine.wires.forEach(w => {
                let neighbor = null;
                if(w.startComp === currCompId && w.startTerm === currTerm) neighbor = `${w.endComp}:${w.endTerm}`;
                if(w.endComp === currCompId && w.endTerm === currTerm) neighbor = `${w.startComp}:${w.startTerm}`;
                if(neighbor && !visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
            });

            if(comp) {
                const paths = Engine.getPathsWithFaults(comp);
                paths.forEach(pair => {
                    const idA = `${comp.id}:${pair[0]}`;
                    const idB = `${comp.id}:${pair[1]}`;
                    if(curr === idA && !visited.has(idB)) { visited.add(idB); queue.push(idB); }
                    if(curr === idB && !visited.has(idA)) { visited.add(idA); queue.push(idA); }
                });
            }
        }
        return false;
    },

    calculate: () => {
        Engine.components.forEach(c => { c.state.energized = false; c.state.lit = false; });
        Engine.liveSet.clear();
        Engine.neutralSet.clear();

        if (!Engine.powerOn) return;

        const sources = Engine.components.filter(c => ComponentRegistry[c.type].role === 'source');
        sources.forEach(src => {
            if (src.type === 'plc_psu') return;

            if(src.type === 'supply_3ph') {
                Engine.liveSet.add(`${src.id}:L1`); Engine.liveSet.add(`${src.id}:L2`); Engine.liveSet.add(`${src.id}:L3`); Engine.neutralSet.add(`${src.id}:N`);
            } else {
                Engine.liveSet.add(`${src.id}:L`); Engine.neutralSet.add(`${src.id}:N`);
            }
        });

        let changed = true;
        let loops = 0;
        while(changed && loops < 100) {
            changed = false;
            let startL = Engine.liveSet.size;
            let startN = Engine.neutralSet.size;

            Engine.wires.forEach(w => {
                const start = `${w.startComp}:${w.startTerm}`;
                const end = `${w.endComp}:${w.endTerm}`;
                if(Engine.liveSet.has(start) && !Engine.liveSet.has(end)) { Engine.liveSet.add(end); changed = true; }
                if(Engine.liveSet.has(end) && !Engine.liveSet.has(start)) { Engine.liveSet.add(start); changed = true; }
                if(Engine.neutralSet.has(start) && !Engine.neutralSet.has(end)) { Engine.neutralSet.add(end); changed = true; }
                if(Engine.neutralSet.has(end) && !Engine.neutralSet.has(start)) { Engine.neutralSet.add(start); changed = true; }
            });

            Engine.components.forEach(c => {
                const paths = Engine.getPathsWithFaults(c);
                paths.forEach(pair => {
                    const t1 = `${c.id}:${pair[0]}`;
                    const t2 = `${c.id}:${pair[1]}`;
                    if(Engine.liveSet.has(t1) && !Engine.liveSet.has(t2)) { Engine.liveSet.add(t2); changed = true; }
                    if(Engine.liveSet.has(t2) && !Engine.liveSet.has(t1)) { Engine.liveSet.add(t1); changed = true; }
                    if(Engine.neutralSet.has(t1) && !Engine.neutralSet.has(t2)) { Engine.neutralSet.add(t2); changed = true; }
                    if(Engine.neutralSet.has(t2) && !Engine.neutralSet.has(t1)) { Engine.neutralSet.add(t1); changed = true; }
                });

                if(c.type === 'plc_psu') {
                    if(Engine.liveSet.has(`${c.id}:L`) && Engine.neutralSet.has(`${c.id}:N`)) {
                        if(!Engine.liveSet.has(`${c.id}:Pos`)) { Engine.liveSet.add(`${c.id}:Pos`); changed = true; }
                        if(!Engine.neutralSet.has(`${c.id}:Neg`)) { Engine.neutralSet.add(`${c.id}:Neg`); changed = true; }
                    }
                }
            });
            if(Engine.liveSet.size === startL && Engine.neutralSet.size === startN) changed = false;
            loops++;
        }

        Engine.components.filter(c => c.type === 'plc_mini').forEach(plc => {
            const hasPower = Engine.liveSet.has(`${plc.id}:L`) && Engine.neutralSet.has(`${plc.id}:N`);
            
            if(!hasPower) {
                plc.state.inputs = {};
                plc.state.outputs = {};
                return;
            }

            const inputs = {
                I1: Engine.liveSet.has(`${plc.id}:I1`),
                I2: Engine.liveSet.has(`${plc.id}:I2`),
                I3: Engine.liveSet.has(`${plc.id}:I3`),
                I4: Engine.liveSet.has(`${plc.id}:I4`),
                I5: Engine.liveSet.has(`${plc.id}:I5`),
                I6: Engine.liveSet.has(`${plc.id}:I6`),
                I7: Engine.liveSet.has(`${plc.id}:I7`),
                I8: Engine.liveSet.has(`${plc.id}:I8`),
                I9: Engine.liveSet.has(`${plc.id}:I9`),
                I10: Engine.liveSet.has(`${plc.id}:I10`)
            };
            plc.state.inputs = inputs;

            // FIX: Safely retrieve ladder or use empty array
            const ladder = Array.isArray(plc.program) ? plc.program : [];
            const newOutputs = { Q1:false, Q2:false, Q3:false, Q4:false };

            ladder.forEach(rung => {
                if(!rung || !rung.coil) return; // Skip if no coil defined

                let rungPower = true; 
                // Only process contacts if they exist
                if(rung.contacts && Array.isArray(rung.contacts)) {
                    rung.contacts.forEach(contact => {
                        if(contact === null) return; // Empty slot (wire)
                        const inputState = inputs[contact.addr];
                        if(contact.type === 'NO') rungPower = rungPower && inputState;
                        else if (contact.type === 'NC') rungPower = rungPower && !inputState;
                    });
                } else {
                    // Safety: if contacts array is missing, treat as open circuit
                    rungPower = false; 
                }

                if(rungPower && rung.coil) {
                    newOutputs[rung.coil.addr] = true;
                }
            });

            plc.state.outputs = newOutputs;
        });

        let tripped = false;
        Engine.components.forEach(c => {
            const def = ComponentRegistry[c.type];
            if(def.role === 'load') {
                const hasL = Engine.liveSet.has(`${c.id}:L`) || Engine.liveSet.has(`${c.id}:SL`) || Engine.liveSet.has(`${c.id}:Pos`) || Engine.liveSet.has(`${c.id}:U`) || Engine.liveSet.has(`${c.id}:X1`);
                const hasN = Engine.neutralSet.has(`${c.id}:N`) || Engine.neutralSet.has(`${c.id}:Neg`) || Engine.neutralSet.has(`${c.id}:V`) || Engine.neutralSet.has(`${c.id}:X2`);
                
                if(hasL && hasN) c.state.lit = true;
            }
            if(def.type === 'inverter' && Engine.liveSet.has(`${c.id}:PVPos`)) c.state.energized = true;

            if(Engine.powerOn && c.state.fault === 'short_ln' && (Engine.liveSet.has(`${c.id}:L`) || Engine.liveSet.has(`${c.id}:L1`))) {
                Engine.powerOn = false;
                alert(`💥 TRIP! Short Circuit detected at ${c.state.label}.`);
                tripped = true;
            }
        });
        if(tripped) Engine.calculate(); 
    }
};