/* main.js - Electronics Version (Fixed) */
let currentEditComp = null;
const ADMIN_PASSWORD = "admin"; 

const App = {
    init: () => {
        Renderer.init();
        Interaction.init(document.getElementById('simCanvas'));
        Interaction.cableSize = 'red'; 
        
        // Removed double-click listener to prevent popup annoyance

        if (typeof scorm !== 'undefined') { scorm.init(); }

        // Start with a clean slate or default level
        if(window.LEVELS && window.LEVELS[1]) {
            console.log("Auto-loading Default...");
            App.loadLevel(1); 
        }
        
        if(document.getElementById('tab-components')) {
            App.switchTab('components');
        }

        // NEW: Oscilloscope Render Loop
        setInterval(() => {
            if(window.Scope && window.Scope.on) {
                window.Scope.update();
                window.Scope.renderScreen();
            }
        }, 50);
    },

    checkPassword: () => { return true; }, 

    saveState: () => {
        let filename = prompt("Enter filename:", "circuit");
        if (!filename) return;
        const data = { timestamp: new Date().toLocaleString(), comps: Engine.components, wires: Engine.wires };
        const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename + ".json"; a.click();
    },

    loadState: () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = evt => App.restoreFromData(JSON.parse(evt.target.result));
            reader.readAsText(file);
        };
        input.click();
    },

    clear: () => {
        if(confirm("Clear board?")) { Engine.components = []; Engine.wires = []; Engine.powerOn = false; }
    },

    restoreFromData: (data) => {
        Engine.components = []; Engine.wires = [];
        if(data.comps) {
            data.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     // FIX: Safe size check for flexible components
                     const size = def.size || { w: 40, h: 40 };
                     const newComp = {
                         id: c.id, type: c.type, x: c.x, y: c.y, w: size.w, h: size.h,
                         state: c.state || { on:false, lit:false, label:def.label, value: '' }
                     };
                     if(c.state && c.state.lead2) newComp.state.lead2 = c.state.lead2; // Restore leg position
                     
                     Engine.components.push(newComp);
                 }
            });
        }
        if(data.wires) Engine.wires = JSON.parse(JSON.stringify(data.wires));
        alert("Circuit Loaded Successfully!");
    },

    addComponent: (type) => {
        const cvs = document.getElementById('simCanvas');
        const cx = (cvs.width/2 - Renderer.camera.x) / Renderer.camera.zoom;
        const cy = (cvs.height/2 - Renderer.camera.y) / Renderer.camera.zoom;
        Engine.add(type, cx - 50, cy - 50);
    },

    togglePower: () => {
        Engine.powerOn = !Engine.powerOn;
        const btn = document.getElementById('btn-power');
        btn.innerHTML = Engine.powerOn ? "⚡ Power OFF" : "🔌 Power ON";
        btn.classList.toggle('active');
        if(!Engine.powerOn) Engine.components.forEach(c => c.state.on = c.state.on);
    },

    toggleWireOrder: () => {
        Renderer.wiresOnTop = !Renderer.wiresOnTop;
        const btn = document.getElementById('btn-wire-order');
        btn.innerText = Renderer.wiresOnTop ? "Wires: FRONT" : "Wires: BACK";
    },

    toggleMoveMode: () => {
        const btn = document.getElementById('btn-move');
        if (Interaction.mode === 'move') {
            Interaction.mode = 'interact';
            btn.innerHTML = "✋ Move Mode: OFF";
            btn.classList.remove('active');
            document.body.classList.remove('move-active');
        } else {
            Interaction.mode = 'move';
            btn.innerHTML = "✋ Move Mode: ON";
            btn.classList.add('active');
            document.body.classList.add('move-active');
            // Reset other modes
            document.getElementById('btn-break').classList.remove('active');
            document.getElementById('btn-break').innerHTML = "🔨 Break Tracks: OFF";
        }
    },

    toggleBreakMode: () => {
        const btn = document.getElementById('btn-break');
        if (Interaction.mode === 'break') {
            Interaction.mode = 'interact';
            btn.innerHTML = "🔨 Break Tracks: OFF";
            btn.classList.remove('active');
        } else {
            Interaction.mode = 'break';
            btn.innerHTML = "🔨 Break Tracks: ON";
            btn.classList.add('active');
            // Reset move mode
            document.getElementById('btn-move').classList.remove('active');
            document.getElementById('btn-move').innerHTML = "✋ Move Mode: OFF";
            document.body.classList.remove('move-active');
        }
    },

    setCable: (val) => Interaction.cableSize = val,

    contextAction: (action) => {
        const comp = Interaction.contextComp;
        if(!comp) return;
        if(action === 'delete') {
            if(confirm(`Delete ${comp.state.label || 'item'}?`)) Engine.remove(comp.id);
        } else if (action === 'prop') {
            App.openPropertyModal(comp);
        } else if (action === 'rotate') {
            comp.state.rotation = ((comp.state.rotation || 0) + 90) % 360;
        }
        document.getElementById('context-menu').style.display = 'none';
    },

    loadLevel: (id) => {
        const lvl = window.LEVELS[id];
        if(!lvl) return;
        Engine.components = []; Engine.wires = [];
        if (lvl.comps) {
            lvl.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     // FIX: Safe size check
                     const size = def.size || { w: 40, h: 40 };
                     const newComp = {
                         id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
                         type: c.type, x: c.x, y: c.y, w: size.w, h: size.h,
                         state: { on: false, lit: false, label: def.label }
                     };
                     Engine.components.push(newComp);
                 }
            });
        }
        if(lvl.wires) Engine.wires = JSON.parse(JSON.stringify(lvl.wires));
    },

    switchTab: (tabName) => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        const content = document.getElementById(`tab-${tabName}`);
        const btn = document.getElementById(`btn-tab-${tabName}`);
        if(content) content.classList.add('active');
        if(btn) btn.classList.add('active');
    },

    openPropertyModal: (comp) => {
        currentEditComp = comp;
        const lbl = document.getElementById('prop-label');
        const val = document.getElementById('prop-value');
        if(lbl) lbl.value = comp.state.label || '';
        if(val) val.value = comp.state.value || '';
        document.getElementById('prop-modal').style.display = 'flex';
    },

    saveProperty: () => {
        if(currentEditComp) {
            const lbl = document.getElementById('prop-label');
            const val = document.getElementById('prop-value');
            if(lbl) currentEditComp.state.label = lbl.value;
            if(val) {
                // Auto-format
                let v = val.value.trim();
                if(v && !isNaN(v)) {
                    const num = parseFloat(v);
                    if(currentEditComp.type === 'resistor') v = (num>=1000) ? (num/1000)+'kΩ' : num+'Ω';
                    else if(currentEditComp.type === 'capacitor') v = (num<1) ? (num*1000)+'nF' : num+'μF';
                    else v = num; // Keeps simple numbers for Voltage PSU
                }
                currentEditComp.state.value = v;
            }
            document.getElementById('prop-modal').style.display = 'none';
            currentEditComp = null;
        }
    }
};

window.onload = App.init;