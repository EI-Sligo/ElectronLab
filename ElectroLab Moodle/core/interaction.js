/* core/interaction.js - Fixed Wiring Priority */
const Interaction = {
    selectedComp: null,
    contextComp: null, 
    draggingProbe: null,
    isDragging: false,
    isPanning: false,
    lastPanPos: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    wireStart: null,
    mode: 'interact', 
    cableSize: '2.5',
    lastClickTime: 0,

    init: (canvas) => {
        canvas.addEventListener('mousedown', Interaction.handleDown);
        window.addEventListener('mousemove', Interaction.handleMove);
        window.addEventListener('mouseup', Interaction.handleUp);
        canvas.addEventListener('wheel', Interaction.handleWheel, { passive: false });
        
        canvas.addEventListener('contextmenu', e => {
            e.preventDefault(); 
        });
        
        document.addEventListener('click', () => {
            const menu = document.getElementById('context-menu');
            if(menu) menu.style.display = 'none';
        });
    },

    handleWheel: (e) => {
        e.preventDefault();
        const rect = document.getElementById('simCanvas').getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPosBefore = Renderer.screenToWorld(mouseX, mouseY);
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newZoom = Math.min(Math.max(Renderer.camera.minZoom, Renderer.camera.zoom + delta), Renderer.camera.maxZoom);
        Renderer.camera.zoom = newZoom;
        const newWorldX = worldPosBefore.x * newZoom + Renderer.camera.x;
        const newWorldY = worldPosBefore.y * newZoom + Renderer.camera.y;
        Renderer.camera.x += (mouseX - newWorldX);
        Renderer.camera.y += (mouseY - newWorldY);
    },

    handleDown: (e) => {
        const rect = document.getElementById('simCanvas').getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = Renderer.screenToWorld(screenX, screenY);
        const x = worldPos.x;
        const y = worldPos.y;

        // Panning
        if(e.button === 1 || (e.button === 0 && e.getModifierState && e.getModifierState("Space"))) {
            Interaction.isPanning = true;
            Interaction.lastPanPos = { x: e.clientX, y: e.clientY };
            return;
        }

        // Cancel Wire
        if(Interaction.wireStart && e.button === 2) {
            Interaction.wireStart = null;
            Renderer.ghostWire = null;
            return; 
        }

        // Check Probes
        const hitProbe = ['red', 'black'].find(c => {
            const p = Meter.probes[c];
            return (x > p.x - 10 && x < p.x + 10 && y > p.y - 100 && y < p.y);
        });
        if(hitProbe) { Interaction.draggingProbe = hitProbe; return; }

        const comps = [...Engine.components].reverse();
        const clicked = comps.find(c => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h);

        // --- RIGHT CLICK: CONTEXT MENU ---
        if(e.button === 2) {
             const hitWire = Engine.wires.find(w => Interaction.isNearWire(x, y, w));
             if(hitWire) { Engine.removeWire(hitWire); return; }

             if(clicked) {
                 Interaction.contextComp = clicked;
                 const menu = document.getElementById('context-menu');
                 if(menu) {
                     menu.style.display = 'block';
                     menu.style.left = e.clientX + 'px';
                     menu.style.top = e.clientY + 'px';
                 }
             }
             return;
        }

        // --- LEFT CLICK LOGIC ---
        
        // 1. FAULT MODE (Highest Priority)
        if(clicked && Interaction.mode === 'fault') {
            App.openPropertyModal(clicked);
            return;
        }

        // 2. DOUBLE CLICK (Properties)
        if(clicked) {
            const now = Date.now();
            if((now - Interaction.lastClickTime) < 300) {
                if(clicked.type === 'plc_mini' && window.openPLCModal) { window.openPLCModal(clicked); } 
                else if (App.openPropertyModal) { App.openPropertyModal(clicked); }
                return; 
            }
            Interaction.lastClickTime = now;
        }

        // 3. WIRING (High Priority - Must be checked BEFORE component toggle)
        // If we are hovering a terminal, we want to wire, NOT toggle the switch underneath.
        if(Interaction.mode === 'interact' && Renderer.hoveredTerm) {
            const ht = Renderer.hoveredTerm;
            Interaction.startWiring(ht.comp, ht.term.id, ht.x, ht.y);
            return; // Stop here so we don't also toggle the switch
        }

        // 4. MOVE MODE
        if(clicked && Interaction.mode === 'move') {
            Interaction.selectedComp = clicked;
            Interaction.isDragging = true;
            Interaction.dragOffset = { x: x - clicked.x, y: y - clicked.y };
            return;
        } 
        
        // 5. COMPONENT INTERACTION (Switch Toggle) - Lowest Priority
        if(clicked && Interaction.mode === 'interact') {
            const def = ComponentRegistry[clicked.type];
            if(def.hasSwitch) {
                if(def.states) {
                    clicked.state.switchVal = (clicked.state.switchVal + 1) % def.states;
                    clicked.state.on = clicked.state.switchVal > 0;
                } else { clicked.state.on = !clicked.state.on; }
            }
            return;
        }
    },

    handleMove: (e) => {
        if(Interaction.isPanning) {
            const dx = e.clientX - Interaction.lastPanPos.x;
            const dy = e.clientY - Interaction.lastPanPos.y;
            Renderer.camera.x += dx;
            Renderer.camera.y += dy;
            Interaction.lastPanPos = { x: e.clientX, y: e.clientY };
            document.body.style.cursor = "grabbing";
            return;
        }

        const rect = document.getElementById('simCanvas').getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = Renderer.screenToWorld(screenX, screenY);
        const x = worldPos.x;
        const y = worldPos.y;

        // Hover Detection
        Renderer.hoveredTerm = null;
        if(Interaction.mode === 'interact' && !Interaction.draggingProbe) {
            Engine.components.forEach(c => {
                const def = ComponentRegistry[c.type];
                if(def.terminals) {
                    def.terminals.forEach(t => {
                        // Increase hit area slightly for easier wiring
                        if(Math.hypot(x - (c.x + t.x), y - (c.y + t.y)) < 15) {
                            Renderer.hoveredTerm = { comp: c, term: t, x: c.x + t.x, y: c.y + t.y };
                        }
                    });
                }
            });
        }

        Renderer.hoveredWire = null;
        if(!Renderer.hoveredTerm && !Interaction.draggingProbe) {
            Renderer.hoveredWire = Engine.wires.find(w => Interaction.isNearWire(x, y, w));
        }

        if(Interaction.draggingProbe) {
            const p = Meter.probes[Interaction.draggingProbe];
            p.x = x; p.y = y; p.compId = null; p.termId = null;
            Engine.components.forEach(c => {
                const def = ComponentRegistry[c.type];
                if(def.terminals) {
                    def.terminals.forEach(t => {
                        if(Math.hypot(x - (c.x + t.x), y - (c.y + t.y)) < 20) {
                            p.x = c.x + t.x; p.y = c.y + t.y; p.compId = c.id; p.termId = t.id;
                        }
                    });
                }
            });
            return;
        }

        if(Interaction.isDragging && Interaction.selectedComp) {
            Interaction.selectedComp.x = Math.round((x - Interaction.dragOffset.x)/10)*10;
            Interaction.selectedComp.y = Math.round((y - Interaction.dragOffset.y)/10)*10;
        }

        if(Interaction.wireStart) {
            Renderer.ghostWire = { x1: Interaction.wireStart.x, y1: Interaction.wireStart.y, x2: x, y2: y };
        }
    },

    handleUp: () => { 
        Interaction.isDragging = false; 
        Interaction.draggingProbe = null; 
        Interaction.isPanning = false;
        document.body.style.cursor = "default";
    },

    isNearWire: (px, py, w) => { 
        const p1 = Renderer.getTerminalPos(w.startComp, w.startTerm);
        const p2 = Renderer.getTerminalPos(w.endComp, w.endTerm);
        if(!p1 || !p2) return false;
        const cp1 = { x: p1.x, y: p1.y + 50 };
        const cp2 = { x: p2.x, y: p2.y + 50 };
        for(let t = 0; t <= 1; t += 0.05) {
            const iT = 1 - t;
            const cx = (iT**3 * p1.x) + (3 * iT**2 * t * cp1.x) + (3 * iT * t**2 * cp2.x) + (t**3 * p2.x);
            const cy = (iT**3 * p1.y) + (3 * iT**2 * t * cp1.y) + (3 * iT * t**2 * cp2.y) + (t**3 * p2.y);
            if(Math.hypot(px - cx, py - cy) < 15) return true; 
        }
        return false;
    },

    startWiring: (comp, termId, tx, ty) => {
        if(!Interaction.wireStart) {
            Interaction.wireStart = { comp, term: termId, x: tx, y: ty };
        } else {
            if(Interaction.wireStart.comp.id !== comp.id) {
                Engine.addWire(Interaction.wireStart.comp.id, Interaction.wireStart.term, comp.id, termId, Interaction.cableSize);
            }
            Interaction.wireStart = null;
            Renderer.ghostWire = null;
        }
    }
};