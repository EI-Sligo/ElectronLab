/* data/levels.js - Basic Electronics Layout */

window.LEVELS = {
    1: {
        title: "1. Basic LED Circuit",
        desc: "Wire the 9V battery through the switch and resistor to light up the LED.",
        comps: [
            { type: 'battery_9v', x: 100, y: 200 },
            { type: 'switch_toggle', x: 250, y: 200 },
            { type: 'resistor', x: 400, y: 200 },
            { type: 'led_red', x: 550, y: 200 }
        ],
        wires: [] 
    }
};