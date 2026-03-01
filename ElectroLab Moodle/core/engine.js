/* core/engine.js - Fixed: Added checkConnection & Source Tracking */
const ComponentRegistry = {}; 

const Engine = {
    components: [], wires: [], powerOn: false, 
    liveSet: new Map(), // Tracks Source ID
    neutralSet: new Set(),
    lastCalc: 0,

    register: (def) => { ComponentRegistry[def.type] = def; },

    add: (type, x, y) => {
        if (!ComponentRegistry[type]) return;
        const def = ComponentRegistry[type];
        const size = def.size || { w: 40, h: 40 }; 
        const comp = {
            id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
            type: type, x: x, y: y, w: size.w, h: size.h,
            state: { on: false, lit: false, label: def.label, value: '12' }
        };
        Engine.components.push(comp);
    },

    remove: (id) => {
        Engine.components = Engine.components.filter(c => c.id !== id);
        Engine.wires = Engine.wires.filter(w => w.startComp !== id && w.endComp !== id);
    },
    removeWire: (w) => Engine.wires = Engine.wires.filter(x => x !== w),
    
    addWire: (id1, term1, id2, term2, size) => {
        let color = '#94a3b8';
        if (size === 'red') color = '#ef4444'; else if (size === 'black') color = '#1f2937'; 
        else if (size === 'blue') color = '#3b82f6'; else if (size === 'virtual') color = 'transparent';
        Engine.wires.push({ startComp: id1, startTerm: term1, endComp: id2, endTerm: term2, size: size, color: color });
    },

    getPotential: (compId, termId) => {
        const key = `${compId}:${termId}`;
        if (Engine.liveSet.has(key)) {
            const sourceId = Engine.liveSet.get(key);
            const source = Engine.components.find(c => c.id === sourceId);
            if(source) {
                if(source.type === 'psu_variable') return parseFloat(source.state.value) || 12;
                if(source.type === 'ac_source') return 230 * Math.sin(Date.now()/100); 
                if(source.type === 'battery_9v') return 9;
                if(source.type === 'plc_psu') return 24;
            }
            return 9; 
        }
        return 0; 
    },

    isLive: (compId, termId) => Engine.liveSet.has(`${compId}:${termId}`),

    getPaths: (comp) => {
        const def = ComponentRegistry[comp.type];
        return def.getInternalPaths ? def.getInternalPaths(comp.state) : [];
    },

    // --- RESTORED FUNCTION ---
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
            
            // Check Wires
            Engine.wires.forEach(w => {
                let neighbor = null;
                if(w.startComp === currCompId && w.startTerm === currTerm) neighbor = `${w.endComp}:${w.endTerm}`;
                if(w.endComp === currCompId && w.endTerm === currTerm) neighbor = `${w.startComp}:${w.startTerm}`;
                if(neighbor && !visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
            });

            // Check Internal Paths
            const comp = Engine.components.find(c => c.id === currCompId);
            if(comp) {
                const paths = Engine.getPaths(comp);
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
    // -------------------------

    calculate: () => {
        const now = Date.now();
        if (now - Engine.lastCalc < 100) return; 
        Engine.lastCalc = now;

        Engine.liveSet.clear(); Engine.neutralSet.clear();
        if (!Engine.powerOn) return;

        Engine.components.filter(c => ComponentRegistry[c.type].role === 'source').forEach(src => {
            if(src.type === 'psu_variable' || src.type === 'battery_9v' || src.type === 'plc_psu') {
                Engine.liveSet.set(`${src.id}:Pos`, src.id); 
                Engine.neutralSet.add(`${src.id}:Neg`);
            } else {
                Engine.liveSet.set(`${src.id}:L`, src.id);   
                Engine.neutralSet.add(`${src.id}:N`);
            }
        });

        let changed = true; let loops = 0;
        while(changed && loops < 50) {
            changed = false;
            
            const propagate = (from, to) => {
                if(Engine.liveSet.has(from) && !Engine.liveSet.has(to)) {
                    Engine.liveSet.set(to, Engine.liveSet.get(from)); 
                    changed = true;
                }
            };
            const propagateNeutral = (from, to) => {
                if(Engine.neutralSet.has(from) && !Engine.neutralSet.has(to)) {
                    Engine.neutralSet.add(to);
                    changed = true;
                }
            };

            Engine.wires.forEach(w => {
                const s = `${w.startComp}:${w.startTerm}`; const e = `${w.endComp}:${w.endTerm}`;
                propagate(s, e); propagate(e, s);
                propagateNeutral(s, e); propagateNeutral(e, s);
            });

            Engine.components.forEach(c => {
                Engine.getPaths(c).forEach(p => {
                    const s = `${c.id}:${p[0]}`; const e = `${c.id}:${p[1]}`;
                    propagate(s, e); propagate(e, s);
                    propagateNeutral(s, e); propagateNeutral(e, s);
                });
            });
            loops++;
        }

        Engine.components.forEach(c => {
            const def = ComponentRegistry[c.type];
            if(def.role === 'load') {
                const live = def.terminals.some(t => Engine.liveSet.has(`${c.id}:${t.id}`));
                const neut = def.terminals.some(t => Engine.neutralSet.has(`${c.id}:${t.id}`));
                c.state.lit = (live && neut);
            }
        });
    }
};