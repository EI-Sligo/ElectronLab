/* main.js - Auto-Scope & New Meter Modes */
let currentEditComp = null;
const ADMIN_PASSWORD = "admin"; 

const App = {
    init: () => {
        Renderer.init();
        Interaction.init(document.getElementById('simCanvas'));
        Interaction.cableSize = 'red'; 
        
        if (typeof scorm !== 'undefined') { scorm.init(); }

        // 1. Auto-load Stripboard Level
        if(window.LEVELS && window.LEVELS[1]) {
            console.log("Loading Workbench...");
            App.loadLevel(1); 
        }
        
        if(document.getElementById('tab-components')) {
            App.switchTab('components');
        }

        // 2. FORCE OSCILLOSCOPE ON AT START
        if(window.Scope) {
            window.Scope.on = true; // Turn logic on
            document.getElementById('scope-panel').style.display = 'block'; // Show UI
            document.getElementById('btn-scope').classList.add('active'); // Highlight button
        }

        // 3. Render Loop
        setInterval(() => {
            if(window.Scope && window.Scope.on) {
                window.Scope.update();
                window.Scope.renderScreen();
            }
        }, 50);
    },

    // ... [Keep the rest of your main.js exactly the same as before] ...
    checkPassword: () => { return true; }, 
    saveState: () => { /* ... */ },
    loadState: () => { /* ... */ },
    clear: () => { /* ... */ },
    
    // Ensure you keep the 'restoreFromData' and 'loadLevel' with the safety fixes!
    restoreFromData: (data) => {
        Engine.components = []; Engine.wires = [];
        if(data.comps) {
            data.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     const size = def.size || { w: 40, h: 40 };
                     const newComp = {
                         id: c.id, type: c.type, x: c.x, y: c.y, w: size.w, h: size.h,
                         state: c.state || { on:false, lit:false, label:def.label, value: '' }
                     };
                     if(c.state && c.state.lead2) newComp.state.lead2 = c.state.lead2;
                     Engine.components.push(newComp);
                 }
            });
        }
        if(data.wires) Engine.wires = JSON.parse(JSON.stringify(data.wires));
        alert("Circuit Loaded!");
    },

    loadLevel: (id) => {
        const lvl = window.LEVELS[id];
        if(!lvl) return;
        Engine.components = []; Engine.wires = [];
        if (lvl.comps) {
            lvl.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
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
    // ... [Rest of file: addComponent, togglePower, switchTab, etc] ...
    // Copy these from previous main.js or just keep them if you replace the init only.
    // Ideally replace whole file to be safe.
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
        } else if (action === 'prop') { App.openPropertyModal(comp); } 
        else if (action === 'rotate') { comp.state.rotation = ((comp.state.rotation || 0) + 90) % 360; }
        document.getElementById('context-menu').style.display = 'none';
    },
    switchTab: (tabName) => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.getElementById(`btn-tab-${tabName}`).classList.add('active');
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
                let v = val.value.trim();
                if(v && !isNaN(v)) {
                    const num = parseFloat(v);
                    if(currentEditComp.type === 'resistor') v = (num>=1000) ? (num/1000)+'kΩ' : num+'Ω';
                    else if(currentEditComp.type === 'capacitor') v = (num<1) ? (num*1000)+'nF' : num+'μF';
                    else v = num;
                }
                currentEditComp.state.value = v;
            }
            document.getElementById('prop-modal').style.display = 'none';
            currentEditComp = null;
        }
    }
};
window.onload = App.init;