/* core/interaction.js - Enhanced Snap & Scope */
const Interaction = {
    selectedComp: null, contextComp: null, draggingProbe: null,
    isDragging: false, isPanning: false, lastPanPos: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 }, wireStart: null, mode: 'interact', 
    cableSize: 'red', draggingLead: null,

    init: (canvas) => {
        canvas.addEventListener('mousedown', Interaction.handleDown);
        window.addEventListener('mousemove', Interaction.handleMove);
        window.addEventListener('mouseup', Interaction.handleUp);
        canvas.addEventListener('wheel', Interaction.handleWheel, { passive: false });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('click', () => {
            const menu = document.getElementById('context-menu');
            if(menu) menu.style.display = 'none';
        });
    },

    handleWheel: (e) => {
        e.preventDefault();
        const rect = document.getElementById('simCanvas').getBoundingClientRect();
        const mouseX = e.clientX - rect.left; const mouseY = e.clientY - rect.top;
        const worldPosBefore = Renderer.screenToWorld(mouseX, mouseY);
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        Renderer.camera.zoom = Math.min(Math.max(Renderer.camera.minZoom, Renderer.camera.zoom + delta), Renderer.camera.maxZoom);
        Renderer.camera.x += (mouseX - (worldPosBefore.x * Renderer.camera.zoom + Renderer.camera.x));
        Renderer.camera.y += (mouseY - (worldPosBefore.y * Renderer.camera.zoom + Renderer.camera.y));
    },

    handleDown: (e) => {
        const rect = document.getElementById('simCanvas').getBoundingClientRect();
        const x = Renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top).x;
        const y = Renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top).y;

        if(e.button === 1 || (e.button === 0 && e.getModifierState && e.getModifierState("Space"))) {
            Interaction.isPanning = true; Interaction.lastPanPos = { x: e.clientX, y: e.clientY }; return;
        }

        if(Interaction.wireStart && e.button === 2) {
            Interaction.wireStart = null; Renderer.ghostWire = null; return; 
        }

        // CHECK SCOPE PROBES
        if(window.Scope) {
            const hitScope = ['ch1', 'ch2', 'gnd'].find(ch => {
                const p = window.Scope.probes[ch];
                return (Math.hypot(x - p.x, y - p.y) < 15);
            });
            if(hitScope) { Interaction.draggingProbe = {type:'scope', id:hitScope}; return; }
        }

        // CHECK METER PROBES
        const hitProbe = ['red', 'black'].find(c => {
            const p = Meter.probes[c]; return (x > p.x - 10 && x < p.x + 10 && y > p.y - 100 && y < p.y);
        });
        if(hitProbe) { Interaction.draggingProbe = {type:'meter', id:hitProbe}; return; }

        // COMPONENT SELECTION
        const sorted = [...Engine.components].sort((a, b) => (a.type === 'trackboard' ? -1 : 1) - (b.type === 'trackboard' ? -1 : 1));
        let targetList = (Interaction.mode === 'break') ? sorted : sorted.reverse(); 
        
        let clickedTerm = null;
        if(Interaction.mode === 'interact') {
            for(let c of targetList) {
                const def = ComponentRegistry[c.type];
                if(def.flexible) {
                    const t2Pos = Renderer.getTerminalPos(c.id, def.terminals[1].id);
                    if(Math.hypot(x - t2Pos.x, y - t2Pos.y) < 15) { clickedTerm = { c, id: 2 }; break; }
                }
            }
        }

        const clicked = targetList.find(c => {
            if(ComponentRegistry[c.type].flexible) {
                const p1 = Renderer.getTerminalPos(c.id, ComponentRegistry[c.type].terminals[0].id);
                const p2 = Renderer.getTerminalPos(c.id, ComponentRegistry[c.type].terminals[1].id);
                const A = x - p1.x; const B = y - p1.y;
                const C = p2.x - p1.x; const D = p2.y - p1.y;
                const dot = A * C + B * D;
                const len_sq = C * C + D * D;
                let param = -1;
                if (len_sq !== 0) param = dot / len_sq;
                let xx, yy;
                if (param < 0) { xx = p1.x; yy = p1.y; }
                else if (param > 1) { xx = p2.x; yy = p2.y; }
                else { xx = p1.x + param * C; yy = p1.y + param * D; }
                const dx = x - xx; const dy = y - yy;
                return (dx * dx + dy * dy) < 100;
            } else {
                return x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h; 
            }
        });

        if(e.button === 2) {
             const hitWire = Engine.wires.find(w => Interaction.isNearWire(x, y, w));
             if(hitWire) { Engine.removeWire(hitWire); return; }
             if(clicked) {
                 Interaction.contextComp = clicked;
                 const menu = document.getElementById('context-menu');
                 if(menu) { menu.style.display = 'block'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; }
             }
             return;
        }

        if(clickedTerm) {
            Interaction.draggingLead = clickedTerm;
            Interaction.selectedComp = clickedTerm.c;
            const attached = Engine.wires.filter(w => w.size === 'virtual' && (w.startComp === clickedTerm.c.id || w.endComp === clickedTerm.c.id));
            attached.forEach(w => Engine.removeWire(w));
            return;
        }

        if(clicked && Interaction.mode === 'fault') { App.openPropertyModal(clicked); return; }

        if(Interaction.mode === 'interact' && Renderer.hoveredTerm) {
            const ht = Renderer.hoveredTerm;
            Interaction.startWiring(ht.comp, ht.term.id, ht.x, ht.y);
            return; 
        }

        if(clicked && Interaction.mode === 'move') {
            Interaction.selectedComp = clicked; Interaction.isDragging = true;
            Interaction.dragOffset = { x: x - clicked.x, y: y - clicked.y };
            const attached = Engine.wires.filter(w => w.size === 'virtual' && (w.startComp === clicked.id || w.endComp === clicked.id));
            attached.forEach(w => Engine.removeWire(w));
            return;
        } 
        
        if(clicked && (Interaction.mode === 'interact' || Interaction.mode === 'break')) {
            const def = ComponentRegistry[clicked.type];
            if(def.onInteract) { def.onInteract(clicked, x - clicked.x, y - clicked.y); return; }
            if(def.hasSwitch && Interaction.mode !== 'break') { clicked.state.on = !clicked.state.on; }
        }
    },

    handleMove: (e) => {
        if(Interaction.isPanning) {
            Renderer.camera.x += e.clientX - Interaction.lastPanPos.x; Renderer.camera.y += e.clientY - Interaction.lastPanPos.y;
            Interaction.lastPanPos = { x: e.clientX, y: e.clientY }; document.body.style.cursor = "grabbing"; return;
        }

        const rect = document.getElementById('simCanvas').getBoundingClientRect();
        const x = Renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top).x;
        const y = Renderer.screenToWorld(e.clientX - rect.left, e.clientY - rect.top).y;

        if(Interaction.draggingLead) {
            const c = Interaction.draggingLead.c;
            const sx = Math.round(x/18)*18;
            const sy = Math.round(y/18)*18;
            const dx = sx - c.x;
            const dy = sy - c.y;
            c.state.lead2 = { x: dx, y: dy };
            return;
        }

        Renderer.hoveredTerm = null;
        if(Interaction.mode === 'interact' && !Interaction.draggingProbe) {
            const sorted = [...Engine.components].sort((a, b) => (a.type === 'trackboard' ? -1 : 1) - (b.type === 'trackboard' ? -1 : 1));
            sorted.forEach(c => {
                const def = ComponentRegistry[c.type];
                if(def.terminals) {
                    def.terminals.forEach(t => {
                        const absPos = Renderer.getTerminalPos(c.id, t.id);
                        if(absPos && Math.hypot(x - absPos.x, y - absPos.y) < 15) {
                            Renderer.hoveredTerm = { comp: c, term: t, x: absPos.x, y: absPos.y };
                        }
                    });
                }
            });
        }

        if(Interaction.draggingProbe) {
            const dp = Interaction.draggingProbe;
            let p;
            if(dp.type === 'meter') p = Meter.probes[dp.id];
            if(dp.type === 'scope') p = window.Scope.probes[dp.id];
            
            p.x = x; p.y = y; p.compId = null; p.termId = null;
            Engine.components.forEach(c => {
                const def = ComponentRegistry[c.type];
                if(def.terminals) {
                    def.terminals.forEach(t => {
                        const absPos = Renderer.getTerminalPos(c.id, t.id);
                        if(absPos && Math.hypot(x - absPos.x, y - absPos.y) < 20) {
                            p.x = absPos.x; p.y = absPos.y; p.compId = c.id; p.termId = t.id;
                        }
                    });
                }
            });
            return;
        }

        if(Interaction.isDragging && Interaction.selectedComp) {
            Interaction.selectedComp.x = Math.round((x - Interaction.dragOffset.x)/18)*18;
            Interaction.selectedComp.y = Math.round((y - Interaction.dragOffset.y)/18)*18;
        }

        if(Interaction.wireStart) Renderer.ghostWire = { x1: Interaction.wireStart.x, y1: Interaction.wireStart.y, x2: x, y2: y };
    },

    handleUp: () => { 
        const comp = Interaction.selectedComp;
        
        // AUTO-JOIN TO STRIPBOARD (Increased Snap Distance to 20px)
        if((Interaction.isDragging || Interaction.draggingLead) && comp) {
            const boards = Engine.components.filter(c => c.type === 'trackboard');
            boards.forEach(board => {
                const boardDef = ComponentRegistry['trackboard'];
                const compDef = ComponentRegistry[comp.type];
                
                compDef.terminals.forEach(ct => {
                    const cPos = Renderer.getTerminalPos(comp.id, ct.id);
                    boardDef.terminals.forEach(bt => {
                        const bPos = Renderer.getTerminalPos(board.id, bt.id);
                        // FIX: Increased from 10 to 20 to ensure it snaps even if slightly off visually
                        if(Math.hypot(bPos.x - cPos.x, bPos.y - cPos.y) < 20) {
                            Engine.addWire(comp.id, ct.id, board.id, bt.id, 'virtual');
                        }
                    });
                });
            });
        }

        Interaction.isDragging = false; 
        Interaction.draggingLead = null;
        Interaction.draggingProbe = null; 
        Interaction.isPanning = false; 
        document.body.style.cursor = "default"; 
    },

    isNearWire: (px, py, w) => { 
        const p1 = Renderer.getTerminalPos(w.startComp, w.startTerm);
        const p2 = Renderer.getTerminalPos(w.endComp, w.endTerm);
        if(!p1 || !p2) return false;
        const cp1 = { x: p1.x, y: p1.y + 50 }; const cp2 = { x: p2.x, y: p2.y + 50 };
        for(let t = 0; t <= 1; t += 0.05) {
            const iT = 1 - t;
            const cx = (iT**3 * p1.x) + (3 * iT**2 * t * cp1.x) + (3 * iT * t**2 * cp2.x) + (t**3 * p2.x);
            const cy = (iT**3 * p1.y) + (3 * iT**2 * t * cp1.y) + (3 * iT * t**2 * cp2.y) + (t**3 * p2.y);
            if(Math.hypot(px - cx, py - cy) < 15) return true; 
        } return false;
    },

    startWiring: (comp, termId, tx, ty) => {
        if(!Interaction.wireStart) Interaction.wireStart = { comp, term: termId, x: tx, y: ty };
        else {
            if(Interaction.wireStart.comp.id !== comp.id) Engine.addWire(Interaction.wireStart.comp.id, Interaction.wireStart.term, comp.id, termId, Interaction.cableSize);
            Interaction.wireStart = null; Renderer.ghostWire = null;
        }
    }
};