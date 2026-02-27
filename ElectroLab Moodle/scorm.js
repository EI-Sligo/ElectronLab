/* scorm.js - The Bridge to Moodle */
var scorm = {
    connection: null,

    init: function() {
        // 1. Look for Moodle's API
        var api = this.findAPI(window);
        if (api) {
            this.connection = api;
            // 2. Say Hello to Moodle
            var result = this.connection.LMSInitialize("");
            if (result.toString() === "true") {
                console.log("SCORM: Connected to Moodle!");
                // Set status to 'incomplete' so Moodle knows they started
                this.connection.LMSSetValue("cmi.core.lesson_status", "incomplete");
                this.connection.LMSCommit("");
            }
        } else {
            console.warn("SCORM: Could not find Moodle API (Are you running locally?)");
        }
    },

    pass: function(score) {
        if (this.connection) {
            // 3. Report Success
            this.connection.LMSSetValue("cmi.core.score.raw", score || 100);
            this.connection.LMSSetValue("cmi.core.lesson_status", "passed");
            this.connection.LMSCommit("");
            console.log("SCORM: Grade Sent!");
        }
    },

    finish: function() {
        if (this.connection) {
            // 4. Say Goodbye
            this.connection.LMSFinish("");
        }
    },

    // Standard function to hunt for the API frame
    findAPI: function(win) {
        var findAPITries = 0;
        while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAPITries++;
            if (findAPITries > 7) return null;
            win = win.parent;
        }
        return win.API;
    }
};