/* core/interaction.js - Fixed Probe Grabbing & Wiring */
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

        // --- FIXED: EASIER PROBE GRABBING ---
        // Check Scope Probes (Body Hitbox)
        if(window.Scope) {
            const hitScope = ['ch1', 'ch2', 'gnd'].find(ch => {
                const p = window.Scope.probes[ch];
                // Check dist to tip OR box around body (y-40 to y)
                return (Math.hypot(x - p.x, y - p.y) < 15) || 
                       (x > p.x - 15 && x < p.x + 15 && y > p.y - 50 && y < p.y);
            });
            if(hitScope) { Interaction.draggingProbe = {type:'scope', id:hitScope}; return; }
        }

        // Check Meter Probes (Body Hitbox)
        const hitProbe = ['red', 'black'].find(c => {
            const p = Meter.probes[c];
            // Allow clicking the big handle (up to 100px above tip)
            return (x > p.x - 15 && x < p.x + 15 && y > p.y - 100 && y < p.y + 10);
        });
        if(hitProbe) { Interaction.draggingProbe = {type:'meter', id:hitProbe}; return; }
        // ------------------------------------

        // Check Components
        const sorted = [...Engine.components].sort((a, b) => (a.type === 'trackboard' ? -1 : 1) - (b.type === 'trackboard' ? -1 : 1));
        let targetList = (Interaction.mode === 'break') ? sorted : sorted.reverse(); 
        
        // Flexible Terminal Check (e.g. Resistor Legs)
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
                return Interaction.distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 10;
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

        // --- MAGNETIC SNAP & HOVER ---
        Renderer.hoveredTerm = null;
        if(Interaction.mode === 'interact' && !Interaction.draggingProbe && !Interaction.isDragging && !Interaction.draggingLead) {
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
        
        Renderer.hoveredWire = (!Renderer.hoveredTerm && !Interaction.draggingProbe) ? Engine.wires.find(w => Interaction.isNearWire(x, y, w)) : null;

        // --- SNAP CALCULATION ---
        let snapX = x, snapY = y; 
        let isSnapped = false;
        if(Interaction.isDragging || Interaction.draggingLead) {
            const boards = Engine.components.filter(c => c.type === 'trackboard');
            for(let b of boards) {
                const def = ComponentRegistry['trackboard'];
                for(let t of def.terminals) {
                    const bx = b.x + t.x; const by = b.y + t.y;
                    if(Math.hypot(x - bx, y - by) < 25) { snapX = bx; snapY = by; isSnapped = true; break; }
                }
                if(isSnapped) break;
            }
        }

        if(Interaction.draggingLead) {
            const c = Interaction.draggingLead.c;
            const targetX = isSnapped ? snapX : Math.round(x/18)*18;
            const targetY = isSnapped ? snapY : Math.round(y/18)*18;
            c.state.lead2 = { x: targetX - c.x, y: targetY - c.y };
            return;
        }

        if(Interaction.draggingProbe) {
            const dp = Interaction.draggingProbe;
            let p = (dp.type === 'meter') ? Meter.probes[dp.id] : window.Scope.probes[dp.id];
            p.compId = null; p.termId = null;
            let bestDist = 20; 
            
            Engine.components.forEach(c => {
                const def = ComponentRegistry[c.type];
                if(def.terminals) {
                    def.terminals.forEach(t => {
                        const pos = Renderer.getTerminalPos(c.id, t.id);
                        const dist = Math.hypot(x - pos.x, y - pos.y);
                        if(dist < bestDist) {
                            p.x = pos.x; p.y = pos.y; p.compId = c.id; p.termId = t.id; bestDist = dist;
                        }
                    });
                }
            });
            if(!p.compId) { p.x = x; p.y = y; }
            return;
        }

        if(Interaction.isDragging && Interaction.selectedComp) {
            if(isSnapped) {
                Interaction.selectedComp.x = Math.round((x - Interaction.dragOffset.x)/18)*18;
                Interaction.selectedComp.y = Math.round((y - Interaction.dragOffset.y)/18)*18;
            } else {
                Interaction.selectedComp.x = Math.round((x - Interaction.dragOffset.x)/18)*18;
                Interaction.selectedComp.y = Math.round((y - Interaction.dragOffset.y)/18)*18;
            }
        }

        if(Interaction.wireStart) Renderer.ghostWire = { x1: Interaction.wireStart.x, y1: Interaction.wireStart.y, x2: x, y2: y };
    },

    handleUp: () => { 
        const comp = Interaction.selectedComp;
        if((Interaction.isDragging || Interaction.draggingLead) && comp) {
            const boards = Engine.components.filter(c => c.type === 'trackboard');
            boards.forEach(board => {
                const boardDef = ComponentRegistry['trackboard'];
                const compDef = ComponentRegistry[comp.type];
                compDef.terminals.forEach(ct => {
                    const cPos = Renderer.getTerminalPos(comp.id, ct.id);
                    boardDef.terminals.forEach(bt => {
                        const bPos = Renderer.getTerminalPos(board.id, bt.id);
                        if(Math.hypot(bPos.x - cPos.x, bPos.y - cPos.y) < 20) {
                            Engine.addWire(comp.id, ct.id, board.id, bt.id, 'virtual');
                        }
                    });
                });
            });
        }
        Interaction.isDragging = false; Interaction.draggingLead = null; Interaction.draggingProbe = null; Interaction.isPanning = false; 
        document.body.style.cursor = "default"; 
    },

    distToSegment: (x, y, x1, y1, x2, y2) => {
        const A = x - x1; const B = y - y1;
        const C = x2 - x1; const D = y2 - y1;
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;
        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }
        const dx = x - xx; const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    isNearWire: (px, py, w) => { 
        const p1 = Renderer.getTerminalPos(w.startComp, w.startTerm);
        const p2 = Renderer.getTerminalPos(w.endComp, w.endTerm);
        if(!p1 || !p2) return false;
        return Interaction.distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) < 8;
    },

    startWiring: (comp, termId, tx, ty) => {
        if(!Interaction.wireStart) Interaction.wireStart = { comp, term: termId, x: tx, y: ty };
        else {
            if(Interaction.wireStart.comp.id !== comp.id) Engine.addWire(Interaction.wireStart.comp.id, Interaction.wireStart.term, comp.id, termId, Interaction.cableSize);
            Interaction.wireStart = null; Renderer.ghostWire = null;
        }
    }
};