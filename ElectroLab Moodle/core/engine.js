/* core/engine.js - Transformer as Configurable Source */
const ComponentRegistry = {}; 

const Engine = {
    components: [], wires: [], powerOn: false, 
    liveSet: new Map(), // Tracks Source ID
    neutralSet: new Set(),
    time: 0, 

    register: (def) => { ComponentRegistry[def.type] = def; },

    add: (type, x, y) => {
        if (!ComponentRegistry[type]) return;
        const def = ComponentRegistry[type];
        const size = def.size || { w: 40, h: 40 }; 
        const comp = {
            id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
            type: type, x: x, y: y, w: size.w, h: size.h,
            // Default value is 12, but can be changed in Properties
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

    // --- PHYSICS HELPERS ---
    isRectified: (startCompId, sourceId) => {
        if(startCompId === sourceId) return false;
        let queue = [startCompId];
        let visited = new Set([startCompId]);
        
        while(queue.length > 0) {
            const currId = queue.shift();
            if(currId === sourceId) break; 
            const comp = Engine.components.find(c => c.id === currId);
            if(comp && (comp.type === 'diode' || comp.type === 'zener_diode')) return true;

            Engine.wires.forEach(w => {
                let next = null;
                if(w.startComp === currId) next = w.endComp;
                else if(w.endComp === currId) next = w.startComp;
                if(next && !visited.has(next) && Engine.isLive(next, 'any')) { 
                    visited.add(next); queue.push(next); 
                }
            });
        }
        return false;
    },

    getPotential: (compId, termId, mode = 'stable') => {
        const key = `${compId}:${termId}`;
        
        if (Engine.liveSet.has(key)) {
            const sourceId = Engine.liveSet.get(key);
            const source = Engine.components.find(c => c.id === sourceId);
            
            if(source) {
                let voltage = 0;
                let isAC = false;

                // 1. TRANSFORMER (Configurable Source)
                if(source.type === 'transformer_ct') {
                    isAC = true;
                    // GET USER SETTING (Default 12)
                    let setV = parseFloat(source.state.value);
                    if(isNaN(setV)) setV = 12;

                    const isS2 = (termId === 'S2' || Engine.checkConnection(compId, termId, source.id, 'S2'));
                    const phase = isS2 ? -1 : 1; 
                    
                    if(mode === 'instant') {
                        // Peak = RMS * 1.414
                        voltage = (setV * 1.414) * Math.sin(Engine.time) * phase;
                    } else {
                        // Stable RMS
                        voltage = isS2 ? -setV : setV; 
                    }
                }
                else if(source.type === 'ac_source') {
                    isAC = true;
                    voltage = (mode === 'instant') ? 325 * Math.sin(Engine.time) : 230; 
                }
                else if(source.type === 'battery_9v' || source.type === 'battery_clip') voltage = 9;
                else if(source.type === 'psu_variable') voltage = parseFloat(source.state.value) || 12;
                else if(source.type === 'plc_psu') voltage = 24;

                // 2. APPLY RECTIFICATION
                if (isAC && mode === 'instant') {
                    if(Engine.isRectified(compId, source.id)) {
                        voltage = Math.max(0, voltage); 
                    }
                }

                return voltage;
            }
            return 0;
        }
        return 0; 
    },

    isLive: (compId, termId) => {
        if(termId === 'any') { 
            const comp = Engine.components.find(c=>c.id===compId);
            if(!comp) return false;
            const def = ComponentRegistry[comp.type];
            return def.terminals.some(t => Engine.liveSet.has(`${compId}:${t.id}`));
        }
        return Engine.liveSet.has(`${compId}:${termId}`);
    },

    getPaths: (comp) => {
        const def = ComponentRegistry[comp.type];
        return def.getInternalPaths ? def.getInternalPaths(comp.state) : [];
    },

    checkConnection: (c1, t1, c2, t2) => {
        if(c1===c2 && t1===t2) return true;
        let q = [`${c1}:${t1}`];
        let visited = new Set(q);
        while(q.length > 0) {
            let curr = q.shift();
            if(curr === `${c2}:${t2}`) return true;
            let [cId, tId] = curr.split(':');
            
            Engine.wires.forEach(w => {
                if(w.startComp === cId && w.startTerm === tId) {
                    let next = `${w.endComp}:${w.endTerm}`;
                    if(!visited.has(next)) { visited.add(next); q.push(next); }
                }
                else if(w.endComp === cId && w.endTerm === tId) {
                    let next = `${w.startComp}:${w.startTerm}`;
                    if(!visited.has(next)) { visited.add(next); q.push(next); }
                }
            });

            let comp = Engine.components.find(c => c.id === cId);
            if(comp) {
                let def = ComponentRegistry[comp.type];
                if(def.getInternalPaths) {
                    def.getInternalPaths(comp.state).forEach(p => {
                        if(p[0] === tId) { let n=`${cId}:${p[1]}`; if(!visited.has(n)){visited.add(n); q.push(n);} }
                        if(p[1] === tId) { let n=`${cId}:${p[0]}`; if(!visited.has(n)){visited.add(n); q.push(n);} }
                    });
                }
            }
        }
        return false;
    },

    calculate: () => {
        Engine.time += 0.2; 
        Engine.liveSet.clear(); Engine.neutralSet.clear();
        if (!Engine.powerOn) return;

        // 1. Seed Sources
        Engine.components.filter(c => ComponentRegistry[c.type].role === 'source').forEach(src => {
            if(src.type.includes('battery') || src.type.includes('psu') || src.type === 'pv_panel') {
                Engine.liveSet.set(`${src.id}:Pos`, src.id); 
                Engine.neutralSet.add(`${src.id}:Neg`);
            } 
            else if(src.type === 'transformer_ct') {
                // AUTO-POWERED SOURCE (No input needed)
                Engine.liveSet.set(`${src.id}:S1`, src.id); 
                Engine.liveSet.set(`${src.id}:S2`, src.id);
                Engine.neutralSet.add(`${src.id}:CT`);
            }
            else {
                Engine.liveSet.set(`${src.id}:L`, src.id);   
                Engine.neutralSet.add(`${src.id}:N`);
            }
        });

        // 2. Propagate
        let changed = true; let loops = 0;
        while(changed && loops < 50) {
            changed = false;
            
            const spread = (from, to, isLive) => {
                if(isLive) {
                    if(Engine.liveSet.has(from) && !Engine.liveSet.has(to)) {
                        Engine.liveSet.set(to, Engine.liveSet.get(from)); 
                        changed = true;
                    }
                } else {
                    if(Engine.neutralSet.has(from) && !Engine.neutralSet.has(to)) {
                        Engine.neutralSet.add(to);
                        changed = true;
                    }
                }
            };

            Engine.wires.forEach(w => {
                const s = `${w.startComp}:${w.startTerm}`; const e = `${w.endComp}:${w.endTerm}`;
                spread(s, e, true); spread(e, s, true);
                spread(s, e, false); spread(e, s, false);
            });

            Engine.components.forEach(c => {
                const def = ComponentRegistry[c.type];
                if(def.getInternalPaths) {
                    def.getInternalPaths(c.state).forEach(p => {
                        const s = `${c.id}:${p[0]}`; const e = `${c.id}:${p[1]}`;
                        spread(s, e, true); spread(e, s, true);
                        spread(s, e, false); spread(e, s, false);
                    });
                }
            });
            loops++;
        }

        // 3. Loads
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