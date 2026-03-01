/* main.js - With Password Protection for Admin Tools */
let currentEditComp = null;
const ADMIN_PASSWORD = "msletbadmin26"; // <--- CHANGE THIS PASSWORD HERE

const App = {
    init: () => {
        Renderer.init();
        Interaction.init(document.getElementById('simCanvas'));
        Interaction.cableSize = '2.5'; 
        
        document.getElementById('simCanvas').addEventListener('dblclick', handleGlobalDoubleClick);

        if (typeof scorm !== 'undefined') {
            scorm.init();
        }

        if(window.LEVELS && window.LEVELS[1]) {
            console.log("Auto-loading Default Board...");
            App.loadLevel(1); 
        }
        
        if(document.getElementById('tab-components')) {
            App.switchTab('components');
        }
    },

    // --- SECURITY HELPER ---
    checkPassword: () => {
        const input = prompt("🔒 Enter Teacher Password:");
        if (input === ADMIN_PASSWORD) return true;
        alert("❌ Incorrect Password");
        return false;
    },

    // --- FILE SYSTEM (PROTECTED) ---
    saveState: () => {
        // PASSWORD CHECK
        if (!App.checkPassword()) return;

        let filename = prompt("Enter a name for your save file:", "my_circuit");
        if (filename === null) return;
        if (!filename.toLowerCase().endsWith(".json")) filename += ".json";

        const data = {
            timestamp: new Date().toLocaleString(),
            comps: Engine.components,
            wires: Engine.wires
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    loadState: () => {
        // 1. Create the file input IMMEDIATELY (Do not ask for password yet)
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if(!file) return;

            // 2. NOW ask for the password (Once they have selected a file)
            // This ensures the browser doesn't block the file picker.
            if (!App.checkPassword()) return;

            const reader = new FileReader();
            reader.onload = evt => {
                try {
                    const data = JSON.parse(evt.target.result);
                    App.restoreFromData(data);
                } catch(err) {
                    alert("Error reading file: " + err);
                }
            };
            reader.readAsText(file);
        };
        
        // 3. Trigger the click
        input.click();
    },

    // --- CLEAR BOARD (PROTECTED) ---
    clear: () => {
        // PASSWORD CHECK
        if (!App.checkPassword()) return;

        if(confirm("Are you sure you want to clear all components?")) {
            Engine.components = [];
            Engine.wires = [];
            Engine.powerOn = false;
            const btn = document.getElementById('btn-power');
            if(btn) {
                btn.innerHTML = "🔌 Power ON";
                btn.classList.remove('active');
            }
        }
    },

    restoreFromData: (data) => {
        Engine.components = []; Engine.wires = [];
        if(data.comps) {
            data.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     // FIX: Safe size
                     const size = def.size || { w: 40, h: 40 };
                     const newComp = {
                         id: c.id, type: c.type, x: c.x, y: c.y, 
                         w: size.w, h: size.h,
                         state: c.state || { on:false, energized:false, lit:false, fault:'none', label:def.label }
                     };
                     if(c.program) newComp.program = c.program; 
                     Engine.components.push(newComp);
                 }
            });
        }
        if(data.wires) Engine.wires = JSON.parse(JSON.stringify(data.wires));
        alert("Circuit Loaded Successfully!");
    },

    loadLevel: (id) => {
        const lvl = window.LEVELS[id];
        if(!lvl) return;
        Engine.components = []; Engine.wires = [];
        
        if (lvl.comps) {
            lvl.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     // FIX: Safe size
                     const size = def.size || { w: 40, h: 40 };
                     const newComp = {
                         id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
                         type: c.type, x: c.x, y: c.y, 
                         w: size.w, h: size.h,
                         state: { on: false, energized: false, lit: false, fault: 'none', label: def.label }
                     };
                     Engine.components.push(newComp);
                 }
            });
        }
        if(lvl.wires) Engine.wires = JSON.parse(JSON.stringify(lvl.wires));
    },
    loadLevel: (id) => {
        const lvl = window.LEVELS[id];
        if(!lvl) return;
        Engine.components = []; Engine.wires = [];
        
        if (lvl.comps) {
            lvl.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     // FIX: Safe size
                     const size = def.size || { w: 40, h: 40 };
                     const newComp = {
                         id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
                         type: c.type, x: c.x, y: c.y, 
                         w: size.w, h: size.h,
                         state: { on: false, energized: false, lit: false, fault: 'none', label: def.label }
                     };
                     Engine.components.push(newComp);
                 }
            });
        }
        if(lvl.wires) Engine.wires = JSON.parse(JSON.stringify(lvl.wires));
    },

    // --- COMPONENT MANAGEMENT ---
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
        if(btn) {
            btn.innerText = Renderer.wiresOnTop ? "Wires: FRONT" : "Wires: BACK";
            btn.classList.toggle('active');
        }
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
            
            const fBtn = document.getElementById('btn-fault');
            if(fBtn) {
                fBtn.classList.remove('active');
                fBtn.innerHTML = "⚠️ Fault Mode: OFF";
            }
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
            
            // Turn off other modes
            document.getElementById('btn-move').classList.remove('active');
            document.body.classList.remove('move-active');
        }
    },

    toggleFaultMode: () => {
        const btn = document.getElementById('btn-fault');
        if (Interaction.mode === 'fault') {
            Interaction.mode = 'interact';
            btn.innerHTML = "⚠️ Fault Mode: OFF";
            btn.classList.remove('active');
        } else {
            Interaction.mode = 'fault';
            btn.innerHTML = "⚠️ Fault Mode: ON";
            btn.classList.add('active');
            
            const mBtn = document.getElementById('btn-move');
            if(mBtn) {
                mBtn.classList.remove('active');
                mBtn.innerHTML = "✋ Move Mode: OFF";
                document.body.classList.remove('move-active');
            }
        }
    },

    setCable: (val) => Interaction.cableSize = val,

    contextAction: (action) => {
        const comp = Interaction.contextComp;
        if(!comp) return;
        
        if(action === 'delete') {
            if(confirm(`Delete ${comp.state.label || 'component'}?`)) Engine.remove(comp.id);
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
        // Wiping the board on initial load usually doesn't need a password 
        // because it happens automatically at startup.
        Engine.components = [];
        Engine.wires = [];
        
        if (lvl.comps) {
            lvl.comps.forEach(c => {
                 const def = ComponentRegistry[c.type];
                 if(def) {
                     const newComp = {
                         id: 'c_' + Date.now() + Math.random().toString(16).slice(2),
                         type: c.type, 
                         x: c.x, y: c.y, 
                         w: def.size.w, h: def.size.h,
                         state: { on: false, energized: false, lit: false, fault: 'none', label: def.label }
                     };
                     Engine.components.push(newComp);
                 }
            });
        }
        if(lvl.wires) {
            Engine.wires = JSON.parse(JSON.stringify(lvl.wires));
        }
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
        const flt = document.getElementById('prop-fault');
        
        if(lbl) lbl.value = comp.state.label || '';
        if(val) val.value = comp.state.value || '';
        if(flt) flt.value = comp.state.fault || 'none';
        
        const modal = document.getElementById('prop-modal');
        if(modal) modal.style.display = 'flex';
    },

    saveProperty: () => {
        if(currentEditComp) {
            const lbl = document.getElementById('prop-label');
            const val = document.getElementById('prop-value');
            const flt = document.getElementById('prop-fault');
            
            if(lbl) currentEditComp.state.label = lbl.value;
            
            // Auto-Format Value Logic
            if(val) {
                let v = val.value.trim();
                // If user typed just a number (e.g. "2000"), format it
                if(v && !isNaN(v)) {
                    const num = parseFloat(v);
                    if(currentEditComp.type === 'resistor') {
                        if(num >= 1000000) v = (num/1000000) + 'MΩ';
                        else if(num >= 1000) v = (num/1000) + 'kΩ';
                        else v = num + 'Ω';
                    }
                    else if(currentEditComp.type === 'capacitor') {
                        if(num < 1) v = (num * 1000) + 'nF'; // Assume uF input if < 1
                        else v = num + 'μF';
                    }
                }
                currentEditComp.state.value = v;
            }

            if(flt) currentEditComp.state.fault = flt.value;
            
            document.getElementById('prop-modal').style.display = 'none';
            currentEditComp = null;
        }
    },
    
    renderLevels: () => { } 
};

// --- PLC & LADDER LOGIC HELPERS ---
let currentPLC = null; 
let tempLadderState = null;
const SVG_NO = `<svg class="ladder-svg" viewBox="0 0 50 50"><line x1="0" y1="25" x2="15" y2="25"/><line x1="35" y1="25" x2="50" y2="25"/><line x1="15" y1="5" x2="15" y2="45"/><line x1="35" y1="5" x2="35" y2="45"/></svg>`;
const SVG_NC = `<svg class="ladder-svg" viewBox="0 0 50 50"><line x1="0" y1="25" x2="15" y2="25"/><line x1="35" y1="25" x2="50" y2="25"/><line x1="15" y1="5" x2="15" y2="45"/><line x1="35" y1="5" x2="35" y2="45"/><line class="nc-bar" x1="10" y1="45" x2="40" y2="5"/></svg>`;
const SVG_COIL = `<svg class="ladder-svg" viewBox="0 0 50 50"><line x1="0" y1="25" x2="10" y2="25"/><line x1="40" y1="25" x2="50" y2="25"/><path d="M 10 25 C 10 5, 40 5, 40 25 C 40 45, 10 45, 10 25" /></svg>`;
const createDefaultLadder = () => Array(5).fill(null).map(() => ({ contacts: [null, null, null], coil: null }));

function openPLCModal(comp) { 
    currentPLC = comp; 
    const existing = comp.program; 
    if (existing && Array.isArray(existing) && existing.length > 0) { 
        tempLadderState = JSON.parse(JSON.stringify(existing)); 
    } else { 
        tempLadderState = createDefaultLadder(); 
    } 
    document.getElementById('plc-modal').style.display = 'flex'; 
    setTimeout(renderLadderEditor, 10); 
}

function closePLCModal() { 
    document.getElementById('plc-modal').style.display = 'none'; 
    currentPLC = null; 
}
window.openPLCModal = openPLCModal;

function renderLadderEditor() { 
    const container = document.getElementById('ladder-container'); 
    if(!container) return; 
    container.innerHTML = ''; 
    tempLadderState.forEach((rung, rIdx) => { 
        const rungDiv = document.createElement('div'); 
        rungDiv.className = 'ladder-rung'; 
        rungDiv.innerHTML = '<div class="power-rail-left"></div>'; 
        const slotsContainer = document.createElement('div'); 
        slotsContainer.className = 'ladder-slots-container'; 
        slotsContainer.innerHTML = '<div class="ladder-wire-line"></div>'; 
        rung.contacts.forEach((contact, cIdx) => { 
            const slot = document.createElement('div'); 
            slot.className = `ladder-slot ${contact ? 'configured' : ''}`; 
            if(contact) { 
                const icon = contact.type === 'NO' ? SVG_NO : SVG_NC; 
                slot.innerHTML = `${icon}<span>${contact.addr}</span>`; 
            } else { 
                slot.style.opacity = "0.5"; 
            } 
            slot.onclick = () => cycleContact(rIdx, cIdx); 
            slotsContainer.appendChild(slot); 
        }); 
        const coil = rung.coil; 
        const coilSlot = document.createElement('div'); 
        coilSlot.className = `ladder-slot ${coil ? 'configured' : ''}`; 
        if(coil) { 
            coilSlot.innerHTML = `${SVG_COIL}<span>${coil.addr}</span>`; 
        } else { 
            coilSlot.innerHTML = `<span style="font-size:9px; color:#94a3b8;">(Coil)</span>`; 
        } 
        coilSlot.onclick = () => cycleCoil(rIdx); 
        slotsContainer.appendChild(coilSlot); 
        rungDiv.appendChild(slotsContainer); 
        rungDiv.appendChild(document.createElement('div')).className = 'power-rail-right'; 
        container.appendChild(rungDiv); 
    }); 
}

function cycleContact(rIdx, cIdx) { 
    const current = tempLadderState[rIdx].contacts[cIdx]; 
    const inputs = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'I9', 'I10']; 
    if(!current) { 
        tempLadderState[rIdx].contacts[cIdx] = { type: 'NO', addr: 'I1' }; 
    } else if (current.type === 'NO') { 
        current.type = 'NC'; 
    } else if (current.type === 'NC') { 
        const idx = inputs.indexOf(current.addr); 
        if(idx < inputs.length - 1) { 
            current.type = 'NO'; 
            current.addr = inputs[idx + 1]; 
        } else { 
            tempLadderState[rIdx].contacts[cIdx] = null; 
        } 
    } 
    renderLadderEditor(); 
}

function cycleCoil(rIdx) { 
    const current = tempLadderState[rIdx].coil; 
    const outputs = ['Q1', 'Q2', 'Q3', 'Q4']; 
    if(!current) { 
        tempLadderState[rIdx].coil = { addr: 'Q1' }; 
    } else { 
        const idx = outputs.indexOf(current.addr); 
        if(idx < outputs.length - 1) { 
            current.addr = outputs[idx + 1]; 
        } else { 
            tempLadderState[rIdx].coil = null; 
        } 
    } 
    renderLadderEditor(); 
}

function savePLCLogic() { 
    if(!currentPLC || !tempLadderState) return; 
    currentPLC.program = JSON.parse(JSON.stringify(tempLadderState)); 
    closePLCModal(); 
    alert("Logic Uploaded to PLC!"); 
}

function handleGlobalDoubleClick(e) { 
    const rect = document.getElementById('simCanvas').getBoundingClientRect(); 
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top; 
    const comps = [...Engine.components].reverse(); 
    const clickedComp = comps.find(c => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h); 
    
    if (clickedComp) { 
        if(clickedComp.type === 'plc_mini') { 
            openPLCModal(clickedComp); 
            return; 
        } 
        if (Interaction.mode === 'interact' || Interaction.mode === 'move') { 
            App.openPropertyModal(clickedComp); 
        } 
    } 
}

// --- SCORM COMPLETION & AUTO-DOWNLOAD ---
function finishScenario() {
    var confirmed = confirm("Submit Task?\n\n1. This will send your completion grade to Moodle.\n2. It will DOWNLOAD your circuit file.\n\nPlease upload the downloaded file to the assignment.");
    
    if(confirmed) {
        if (typeof scorm !== 'undefined') {
            scorm.pass(100);
        }
        
        // Auto-save the student's work for them
        // Note: We bypass the password check here because the student is submitting their own work.
        const data = {
            timestamp: new Date().toLocaleString(),
            comps: Engine.components,
            wires: Engine.wires
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "submission_circuit.json";
        a.click();
        URL.revokeObjectURL(url);
        
        const btn = document.getElementById('btn-submit-task');
        if(btn) {
            btn.innerText = "Task Submitted!";
            btn.disabled = true;
        }
    }
}

window.onload = App.init;