/* core/renderer.js - With Wire Size Tooltip */
const Renderer = {
    canvas: null,
    ctx: null,
    ghostWire: null,
    wiresOnTop: false, 
    hoveredTerm: null,
    hoveredWire: null, // NEW
    
    camera: { x: 0, y: 0, zoom: 1, minZoom: 0.1, maxZoom: 5 },

    init: () => {
        Renderer.canvas = document.getElementById('simCanvas');
        Renderer.ctx = Renderer.canvas.getContext('2d');
        Renderer.resize();
        window.addEventListener('resize', Renderer.resize);
        requestAnimationFrame(Renderer.loop);
    },

    resize: () => {
        const p = document.getElementById('main');
        const dpr = window.devicePixelRatio || 1;
        Renderer.canvas.width = p.clientWidth * dpr;
        Renderer.canvas.height = p.clientHeight * dpr;
        Renderer.ctx.scale(dpr, dpr); 
        Renderer.width = p.clientWidth;
        Renderer.height = p.clientHeight;
    },

    screenToWorld: (sx, sy) => {
        return {
            x: (sx - Renderer.camera.x) / Renderer.camera.zoom,
            y: (sy - Renderer.camera.y) / Renderer.camera.zoom
        };
    },

    getTerminalPos: (compId, termId) => {
        const comp = Engine.components.find(c => c.id === compId);
        if (!comp) return null;
        const def = ComponentRegistry[comp.type];
        const t = def.terminals.find(t => t.id === termId);
        return t ? { x: comp.x + t.x, y: comp.y + t.y } : null;
    },

    tools: {
        plasticRect: (ctx, x, y, w, h, color, shadow = true) => {
            ctx.save();
            if(shadow) {
                ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4;
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4); else ctx.rect(x,y,w,h);
            ctx.fill();
            ctx.shadowColor = "transparent"; 
            ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
            ctx.strokeStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.stroke();
            ctx.restore();
        },

        screw: (ctx, x, y) => {
            ctx.save();
            const grd = ctx.createLinearGradient(x-5, y-5, x+5, y+5);
            grd.addColorStop(0, "#fcd34d"); grd.addColorStop(1, "#b45309");
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = "#78350f"; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x-3, y-3); ctx.lineTo(x+3, y+3); ctx.moveTo(x+3, y-3); ctx.lineTo(x-3, y+3);
            ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
        },

        toggle: (ctx, x, y, w, h, on, color = "#1f2937") => {
            ctx.save();
            ctx.fillStyle = "#0f172a";
            ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, 2); else ctx.rect(x,y,w,h); ctx.fill();
            const ty = on ? y + 2 : y + h - 22; 
            const grd = ctx.createLinearGradient(x, ty, x+w, ty);
            grd.addColorStop(0, "#334155"); grd.addColorStop(0.5, "#475569"); grd.addColorStop(1, "#334155");
            ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 4;
            ctx.fillStyle = color === 'red' ? (on ? '#dc2626' : '#ef4444') : grd;
            ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x+2, ty, w-4, 20, 4); else ctx.fillRect(x+2, ty, w-4, 20); ctx.fill();
            ctx.restore();
        },

        text: (ctx, text, x, y, color, size=10, weight="bold") => {
            ctx.fillStyle = color || '#334155';
            ctx.font = `${weight} ${size}px 'Segoe UI', sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(text, x, y);
        },
        rect: (ctx, x, y, w, h, fill) => { ctx.fillStyle = fill; ctx.fillRect(x,y,w,h); },
        circle: (ctx, x, y, r, fill, stroke) => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
            if (fill) { ctx.fillStyle = fill; ctx.fill(); }
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
        }
    },

    drawProbes: (ctx) => {
        ['red', 'black'].forEach(color => {
            const p = Meter.probes[color];
            const x = p.x; const y = p.y;
            const mainColor = color === 'red' ? '#dc2626' : '#1f2937';
            ctx.save();
            ctx.translate(x, y);
            ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
            const grd = ctx.createLinearGradient(-10, -90, 10, -90);
            grd.addColorStop(0, mainColor); grd.addColorStop(0.3, "#fff"); grd.addColorStop(1, mainColor);
            ctx.fillStyle = mainColor; 
            ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(6, -20); ctx.lineTo(8, -90); ctx.lineTo(-8, -90); ctx.fill();
            ctx.fillStyle = "#cbd5e1";
            ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(2, -20); ctx.lineTo(0, 0); ctx.fill();
            ctx.shadowColor = "transparent";
            ctx.beginPath(); ctx.moveTo(0, -90); ctx.bezierCurveTo(0, -150, -30, -150, -60, -200);
            ctx.strokeStyle = mainColor; ctx.lineWidth = 4; ctx.stroke();
            ctx.restore();
        });
    },

    drawGrid: (ctx) => {
        const zoom = Renderer.camera.zoom;
        const gridSize = 24 * zoom;
        const offsetX = Renderer.camera.x % gridSize;
        const offsetY = Renderer.camera.y % gridSize;

        ctx.beginPath();
        if(gridSize > 5) {
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 1;
            for (let x = offsetX; x < Renderer.width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, Renderer.height); }
            for (let y = offsetY; y < Renderer.height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(Renderer.width, y); }
            ctx.stroke();
        }
    },

    loop: () => {
        const ctx = Renderer.ctx;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const dpr = window.devicePixelRatio || 1;
        ctx.scale(dpr, dpr); 
        ctx.clearRect(0, 0, Renderer.width, Renderer.height);

        Engine.calculate();
        Meter.updateDisplay(); 
        Renderer.drawGrid(ctx);

        ctx.translate(Renderer.camera.x, Renderer.camera.y);
        ctx.scale(Renderer.camera.zoom, Renderer.camera.zoom);

        const drawWires = () => {
            Engine.wires.forEach(w => {
                const p1 = Renderer.getTerminalPos(w.startComp, w.startTerm);
                const p2 = Renderer.getTerminalPos(w.endComp, w.endTerm);
                if(p1 && p2) {
                    const isLive = Engine.isLive(w.startComp, w.startTerm) || Engine.isLive(w.endComp, w.endTerm);
                    const color = w.color;
                    ctx.save();
                    ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 3 / Renderer.camera.zoom; ctx.shadowOffsetY = 2 / Renderer.camera.zoom;
                    if(isLive && Engine.powerOn) { ctx.shadowColor = color; ctx.shadowBlur = 8 / Renderer.camera.zoom; }
                    
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.bezierCurveTo(p1.x, p1.y + 50, p2.x, p2.y + 50, p2.x, p2.y);
                    
                    let thickness = 2; 
                    const sizeNum = parseFloat(w.size);
                    if (!isNaN(sizeNum)) thickness = 1.5 + (sizeNum / 4); 
                    
                    ctx.lineWidth = Math.max(1, thickness / Math.sqrt(Renderer.camera.zoom)); 
                    ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.stroke();
                    
                    // Wire Highlight logic
                    if(Renderer.hoveredWire === w) {
                        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
                        ctx.shadowBlur = 10;
                        ctx.lineWidth += 2; 
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                        ctx.lineWidth -= 2;
                    }

                    ctx.shadowColor = "transparent"; ctx.lineWidth = ctx.lineWidth / 4; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();
                    ctx.restore();
                }
            });

            if(Renderer.ghostWire) {
                const g = Renderer.ghostWire;
                ctx.beginPath(); ctx.moveTo(g.x1, g.y1); ctx.bezierCurveTo(g.x1, g.y1 + 50, g.x2, g.y2 + 50, g.x2, g.y2);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2 / Renderer.camera.zoom; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            }
        };

        const drawComponents = () => {
            Engine.components.forEach(comp => {
                const def = ComponentRegistry[comp.type];
                ctx.save();
                ctx.translate(comp.x, comp.y);
                if(def.render) def.render(ctx, comp.state, Renderer.tools);
                
                if(def.terminals) {
                    def.terminals.forEach(t => {
                        Renderer.tools.screw(ctx, t.x, t.y);
                        
                        // Hover Label Logic
                        if(Renderer.hoveredTerm && 
                           Renderer.hoveredTerm.comp.id === comp.id && 
                           Renderer.hoveredTerm.term.id === t.id) {
                            
                            ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                            ctx.beginPath(); ctx.roundRect(t.x - 15, t.y - 30, 30, 18, 4); ctx.fill();
                            
                            ctx.fillStyle = "#fff";
                            const fontSize = Math.max(10, 10 / Renderer.camera.zoom);
                            ctx.font = `bold ${fontSize}px Arial`; 
                            ctx.textAlign = "center";
                            const txt = t.label || t.id;
                            ctx.fillText(txt, t.x, t.y - 21);
                        }

                        if(Engine.isLive(comp.id, t.id)) {
                            ctx.globalCompositeOperation = "screen";
                            ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI*2);
                            ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fill();
                            ctx.globalCompositeOperation = "source-over";
                        }
                    });
                }
                ctx.restore();
            });
        };

        if(Renderer.wiresOnTop) { drawComponents(); drawWires(); } else { drawWires(); drawComponents(); }

        // Hover Ring
        if(Renderer.hoveredTerm) {
            const h = Renderer.hoveredTerm;
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.fillStyle = "rgba(250, 204, 21, 0.4)"; 
            ctx.shadowColor = "#facc15"; ctx.shadowBlur = 10;
            ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
        }

        // --- NEW: Draw Wire Tooltip ---
        if(Renderer.hoveredWire) {
            // Find midpoint of wire for the label
            const w = Renderer.hoveredWire;
            const p1 = Renderer.getTerminalPos(w.startComp, w.startTerm);
            const p2 = Renderer.getTerminalPos(w.endComp, w.endTerm);
            if(p1 && p2) {
                const mx = (p1.x + p2.x) / 2;
                const my = (p1.y + p2.y) / 2 + 25; // approximate bezier dip

                ctx.save();
                ctx.translate(mx, my);
                // Background Box
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.beginPath(); ctx.roundRect(-25, -20, 50, 20, 4); ctx.fill();
                // Text
                ctx.fillStyle = "#fff";
                ctx.font = "bold 11px Arial";
                ctx.textAlign = "center";
                ctx.fillText(w.size + " mm²", 0, -6);
                ctx.restore();
            }
        }

        Renderer.drawProbes(ctx);
        requestAnimationFrame(Renderer.loop);
    }
};