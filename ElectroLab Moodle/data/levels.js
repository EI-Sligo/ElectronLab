/* data/levels.js - Default Electronics Layout */

window.LEVELS = {
    1: {
        title: "1. Basic LED Circuit",
        desc: "Wire the 9V battery through the push button and resistor to light up the LED.",
        comps: [
            { type: 'battery_9v', x: 200, y: 200 },
            { type: 'push_button', x: 350, y: 200 },
            { type: 'resistor', x: 450, y: 210 },
            { type: 'led_red', x: 550, y: 190 }
        ],
        wires: [] // Start with an empty board so the user has to wire it!
    }
};