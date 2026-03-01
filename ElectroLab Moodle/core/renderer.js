/* core/renderer.js - Fixed Scope Drawing */
const Renderer = {
    canvas: null, ctx: null, ghostWire: null, wiresOnTop: false, 
    hoveredTerm: null, hoveredWire: null, 
    camera: { x: 0, y: 0, zoom: 1, minZoom: 0.1, maxZoom: 5 },

    init: (canvas) => {
        Renderer.canvas = document.getElementById('simCanvas');
        Renderer.ctx = Renderer.canvas.getContext('2d');
        Renderer.resize(); window.addEventListener('resize', Renderer.resize);
        requestAnimationFrame(Renderer.loop);
    },

    resize: () => {
        const p = document.getElementById('main'); const dpr = window.devicePixelRatio || 1;
        Renderer.canvas.width = p.clientWidth * dpr; Renderer.canvas.height = p.clientHeight * dpr;
        Renderer.ctx.scale(dpr, dpr); Renderer.width = p.clientWidth; Renderer.height = p.clientHeight;
    },

    screenToWorld: (sx, sy) => ({ x: (sx - Renderer.camera.x) / Renderer.camera.zoom, y: (sy - Renderer.camera.y) / Renderer.camera.zoom }),

    getTerminalPos: (compId, termId) => {
        const comp = Engine.components.find(c => c.id === compId); if (!comp) return null;
        const def = ComponentRegistry[comp.type]; const t = def.terminals.find(t => t.id === termId); if(!t) return null;
        
        if(def.flexible) {
            if(termId === def.terminals[0].id) return { x: comp.x, y: comp.y };
            if(termId === def.terminals[1].id) {
                const l2 = comp.state.lead2 || { x: def.terminals[1].x, y: def.terminals[1].y };
                return { x: comp.x + l2.x, y: comp.y + l2.y };
            }
        }
        const cx = comp.w / 2; const cy = comp.h / 2;
        const angle = (comp.state.rotation || 0) * (Math.PI / 180);
        const rx = Math.cos(angle) * (t.x - cx) - Math.sin(angle) * (t.y - cy) + cx;
        const ry = Math.sin(angle) * (t.x - cx) + Math.cos(angle) * (t.y - cy) + cy;
        return { x: comp.x + rx, y: comp.y + ry };
    },

    tools: {
        plasticRect: (ctx, x, y, w, h, color, shadow = true) => {
            ctx.save(); if(shadow) { ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; }
            ctx.fillStyle = color; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4); else ctx.rect(x,y,w,h); ctx.fill();
            ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
            ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.stroke(); ctx.restore();
        },
        screw: (ctx, x, y) => {
            ctx.save(); const grd = ctx.createLinearGradient(x-5, y-5, x+5, y+5);
            grd.addColorStop(0, "#fcd34d"); grd.addColorStop(1, "#b45309"); ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = "#78350f"; ctx.lineWidth = 1; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x-3, y-3); ctx.lineTo(x+3, y+3); ctx.moveTo(x+3, y-3); ctx.lineTo(x-3, y+3);
            ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
        },
        text: (ctx, text, x, y, color, size=10, weight="bold") => {
            ctx.fillStyle = color || '#334155'; ctx.font = `${weight} ${size}px 'Segoe UI', sans-serif`;
            ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, x, y);
        },
        circle: (ctx, x, y, r, fill, stroke) => {
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
            if (fill) { ctx.fillStyle = fill; ctx.fill(); }
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
        }
    },

    drawProbes: (ctx) => {
        ['red', 'black'].forEach(color => {
            const p = Meter.probes[color]; const mainColor = color === 'red' ? '#dc2626' : '#1f2937';
            ctx.save(); ctx.translate(p.x, p.y); ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8;
            const grd = ctx.createLinearGradient(-10, -90, 10, -90); grd.addColorStop(0, mainColor); grd.addColorStop(0.3, "#fff"); grd.addColorStop(1, mainColor);
            ctx.fillStyle = mainColor; ctx.beginPath(); ctx.moveTo(-6, -20); ctx.lineTo(6, -20); ctx.lineTo(8, -90); ctx.lineTo(-8, -90); ctx.fill();
            ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(2, -20); ctx.lineTo(0, 0); ctx.fill();
            ctx.shadowColor = "transparent"; ctx.beginPath(); ctx.moveTo(0, -90); ctx.bezierCurveTo(0, -150, -30, -150, -60, -200);
            ctx.strokeStyle = mainColor; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
        });
    },

    drawGrid: (ctx) => {
        const zoom = Renderer.camera.zoom; const gridSize = 18 * zoom; 
        const offsetX = Renderer.camera.x % gridSize; const offsetY = Renderer.camera.y % gridSize;
        ctx.beginPath();
        if(gridSize > 5) {
            ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1;
            for (let x = offsetX; x < Renderer.width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, Renderer.height); }
            for (let y = offsetY; y < Renderer.height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(Renderer.width, y); }
            ctx.stroke();
        }
    },

    loop: () => {
        const ctx = Renderer.ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
        const dpr = window.devicePixelRatio || 1; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, Renderer.width, Renderer.height);

        Engine.calculate(); Meter.updateDisplay(); Renderer.drawGrid(ctx);

        ctx.translate(Renderer.camera.x, Renderer.camera.y); ctx.scale(Renderer.camera.zoom, Renderer.camera.zoom);

        const drawWires = () => {
            Engine.wires.forEach(w => {
                if(w.size === 'virtual') return; 
                const p1 = Renderer.getTerminalPos(w.startComp, w.startTerm); const p2 = Renderer.getTerminalPos(w.endComp, w.endTerm);
                if(p1 && p2) {
                    const isLive = Engine.isLive(w.startComp, w.startTerm) || Engine.isLive(w.endComp, w.endTerm);
                    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.2)"; ctx.shadowBlur = 3 / Renderer.camera.zoom; ctx.shadowOffsetY = 2 / Renderer.camera.zoom;
                    if(isLive && Engine.powerOn) { ctx.shadowColor = w.color; ctx.shadowBlur = 8 / Renderer.camera.zoom; }
                    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.bezierCurveTo(p1.x, p1.y + 50, p2.x, p2.y + 50, p2.x, p2.y);
                    ctx.lineWidth = Math.max(1, 3 / Math.sqrt(Renderer.camera.zoom)); ctx.strokeStyle = w.color; ctx.lineCap = "round"; ctx.stroke();
                    if(Renderer.hoveredWire === w) { ctx.shadowColor = "white"; ctx.shadowBlur = 10; ctx.lineWidth += 2; ctx.stroke(); }
                    ctx.shadowColor = "transparent"; ctx.lineWidth = ctx.lineWidth / 4; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke(); ctx.restore();
                }
            });
            if(Renderer.ghostWire) {
                const g = Renderer.ghostWire; ctx.beginPath(); ctx.moveTo(g.x1, g.y1); ctx.bezierCurveTo(g.x1, g.y1 + 50, g.x2, g.y2 + 50, g.x2, g.y2);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2 / Renderer.camera.zoom; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
            }
        };

        const drawComponents = () => {
            const sorted = [...Engine.components].sort((a, b) => (a.type === 'trackboard' ? -1 : 1) - (b.type === 'trackboard' ? -1 : 1));

            sorted.forEach(comp => {
                const def = ComponentRegistry[comp.type];
                ctx.save(); ctx.translate(comp.x, comp.y);
                
                if(!def.flexible) {
                    const angle = (comp.state.rotation || 0) * (Math.PI / 180);
                    ctx.translate(comp.w/2, comp.h/2); ctx.rotate(angle); ctx.translate(-comp.w/2, -comp.h/2);
                }

                if(window.Interaction && window.Interaction.mode === 'break') {
                    ctx.globalAlpha = (comp.type === 'trackboard') ? 1.0 : 0.2;
                }

                if(def.render) def.render(ctx, comp.state, Renderer.tools);
                ctx.globalAlpha = 1.0;

                if(def.terminals) {
                    def.terminals.forEach(t => {
                        let tx = t.x, ty = t.y;
                        if(def.flexible && t.id === def.terminals[1].id) {
                            const l2 = comp.state.lead2 || {x: t.x, y: t.y};
                            tx = l2.x; ty = l2.y;
                        }
                        
                        if(def.flexible) Renderer.tools.screw(ctx, tx, ty);
                        else Renderer.tools.screw(ctx, t.x, t.y);
                        
                        if(Engine.isLive(comp.id, t.id)) {
                            ctx.globalCompositeOperation = "screen"; ctx.beginPath(); 
                            if(def.flexible) ctx.arc(tx, ty, 8, 0, Math.PI*2);
                            else ctx.arc(t.x, t.y, 8, 0, Math.PI*2);
                            ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fill(); ctx.globalCompositeOperation = "source-over";
                        }
                    });
                }
                ctx.restore();
            });
        };

        if(Renderer.wiresOnTop) { drawComponents(); drawWires(); } else { drawWires(); drawComponents(); }

        if(Renderer.hoveredTerm) {
            const h = Renderer.hoveredTerm;
            ctx.save(); ctx.translate(h.x, h.y);
            ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.fillStyle = "rgba(250, 204, 21, 0.4)"; ctx.shadowColor = "#facc15"; ctx.shadowBlur = 10; ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
            ctx.shadowBlur = 0; ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
            ctx.beginPath(); ctx.roundRect(-20, -30, 40, 18, 4); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center";
            ctx.fillText(h.term.label || h.term.id, 0, -21);
            ctx.restore();
        }

        // NEW: Draw Oscilloscope Probes
        if(window.Scope) window.Scope.drawProbes(ctx);

        Renderer.drawProbes(ctx); requestAnimationFrame(Renderer.loop);
    }
};