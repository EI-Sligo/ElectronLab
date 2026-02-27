/* data/levels.js - Default Board Layout */

// Coordinates calculated to match the visual layout in your image
const START_X_TOP = 240;
const START_X_BOT = 590; // Offset for bottom row MCBs
const ROW_TOP_Y = 170;
const ROW_BOT_Y = 370;

window.LEVELS = {
    1: {
        title: "1. Distribution Board Setup",
        desc: "Complete the wiring for the pre-mounted distribution board components.",
        comps: [
            // 1. The Enclosure & Supply
            { type: 'db_board', x: 215, y: 90 },
            { type: 'service_head', x: 20, y: 400 },
            { type: 'danger_sticker', x: 20, y: 350 }, // Optional visual

            // 2. Bars
            { type: 'earth_bar', x: 330, y: 100 },
            { type: 'neutral_bar', x: 250, y: 530 },
            { type: 'neutral_bar', x: 500, y: 530 },

            // 3. TOP ROW (RCBOs + Timer)
            // Note: RCBOs are slim (35px). Spacing approx 35-40px.
            { type: 'rcbo_b6', x: 240, y: ROW_TOP_Y },
            { type: 'rcbo_b6', x: 280, y: ROW_TOP_Y },
            { type: 'rcbo_b10', x: 320, y: ROW_TOP_Y },
            { type: 'rcbo_b20', x: 360, y: ROW_TOP_Y },
            { type: 'rcbo_b32', x: 400, y: ROW_TOP_Y },
            { type: 'rcbo_b40', x: 440, y: ROW_TOP_Y },
            { type: 'timer_hager', x: 500, y: ROW_TOP_Y }, // Timer takes 2 slots

            // 4. BOTTOM ROW (Main Sw, SPD, RCD, MCBs)
            { type: 'main_switch_100a', x: 240, y: ROW_BOT_Y },
            { type: 'spd_module', x: 330, y: ROW_BOT_Y },
            { type: 'rcd', x: 410, y: ROW_BOT_Y }, // RCD is wider
            
            // MCBs start after RCD
            { type: 'mcb_b20', x: 540, y: ROW_BOT_Y },
            { type: 'mcb_b20', x: 580, y: ROW_BOT_Y },
            { type: 'mcb_b32', x: 620, y: ROW_BOT_Y },
            { type: 'mcb_b32', x: 660, y: ROW_BOT_Y },
            { type: 'mcb_b40', x: 700, y: ROW_BOT_Y }
        ],
        wires: [] // Start with no wires connected (except maybe internal factory links if desired?)
    }
};