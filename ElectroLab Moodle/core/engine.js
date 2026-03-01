const ComponentRegistry = {}; 

const Engine = {
    components: [], wires: [], powerOn: false, liveSet: new Set(), neutralSet: new Set(),

    register: (def) => { ComponentRegistry[def.type] = def; },

    add: (type, x, y) => {
        if (!ComponentRegistry[type]) return;
        const def = ComponentRegistry[type];
        const size = def.size || { w: 40, h: 40 }; 
        const comp = {
            id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
            type: type, x: x, y: y, w: size.w, h: size.h,
            state: { on: false, lit: false, label: def.label, value: '12' } // Default 12V for PSUs
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

    // RECURSIVE VOLTAGE FINDER
    getPotential: (compId, termId) => {
        // 1. Is this terminal part of the Live Set?
        if (Engine.liveSet.has(`${compId}:${termId}`)) {
            // Find SOURCE connected to this live set
            const source = Engine.components.find(c => {
                const def = ComponentRegistry[c.type];
                return def.role === 'source' && Engine.liveSet.has(`${c.id}:Pos`) || Engine.liveSet.has(`${c.id}:L`);
            });
            
            if(source) {
                if(source.type === 'psu_variable') return parseFloat(source.state.value) || 12;
                if(source.type === 'ac_source') return 230 * Math.sin(Date.now()/100); // Simple AC sim
                if(source.type === 'battery_9v') return 9;
            }
            return 9; // Default
        }
        return 0; // Neutral/Ground
    },

    isLive: (compId, termId) => Engine.liveSet.has(`${compId}:${termId}`),

    getPaths: (comp) => {
        const def = ComponentRegistry[comp.type];
        return def.getInternalPaths ? def.getInternalPaths(comp.state) : [];
    },

    calculate: () => {
        Engine.liveSet.clear(); Engine.neutralSet.clear();
        if (!Engine.powerOn) return;

        // Seed Sources
        Engine.components.filter(c => ComponentRegistry[c.type].role === 'source').forEach(src => {
            if(src.type === 'psu_variable' || src.type === 'battery_9v') {
                Engine.liveSet.add(`${src.id}:Pos`); Engine.neutralSet.add(`${src.id}:Neg`);
            } else {
                Engine.liveSet.add(`${src.id}:L`); Engine.neutralSet.add(`${src.id}:N`);
            }
        });

        // Spread (Iterative)
        let changed = true; let loops = 0;
        while(changed && loops < 50) {
            changed = false;
            const sizeL = Engine.liveSet.size; const sizeN = Engine.neutralSet.size;

            Engine.wires.forEach(w => {
                const s = `${w.startComp}:${w.startTerm}`; const e = `${w.endComp}:${w.endTerm}`;
                if(Engine.liveSet.has(s) && !Engine.liveSet.has(e)) { Engine.liveSet.add(e); changed=true; }
                if(Engine.liveSet.has(e) && !Engine.liveSet.has(s)) { Engine.liveSet.add(s); changed=true; }
                if(Engine.neutralSet.has(s) && !Engine.neutralSet.has(e)) { Engine.neutralSet.add(e); changed=true; }
                if(Engine.neutralSet.has(e) && !Engine.neutralSet.has(s)) { Engine.neutralSet.add(s); changed=true; }
            });

            Engine.components.forEach(c => {
                Engine.getPaths(c).forEach(p => {
                    const s = `${c.id}:${p[0]}`; const e = `${c.id}:${p[1]}`;
                    if(Engine.liveSet.has(s) && !Engine.liveSet.has(e)) { Engine.liveSet.add(e); changed=true; }
                    if(Engine.liveSet.has(e) && !Engine.liveSet.has(s)) { Engine.liveSet.add(s); changed=true; }
                    if(Engine.neutralSet.has(s) && !Engine.neutralSet.has(e)) { Engine.neutralSet.add(e); changed=true; }
                    if(Engine.neutralSet.has(e) && !Engine.neutralSet.has(s)) { Engine.neutralSet.add(s); changed=true; }
                });
            });
            loops++;
        }

        // Check Loads
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