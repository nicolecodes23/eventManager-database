const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db', (err) => {
    if (err) console.error(err);
    else db.run('PRAGMA foreign_keys = ON');
});

// GET method to get /attendee home page
// router.get('/', (req, res) => {
//     res.render('attendee-home'); //attendee-home.ejs
// });

/**
 * GET /attendee
 * Purpose: Render the Attendee Home Page showing site info and published events.
 * Inputs: none
 * Outputs: attendee-home.ejs rendered with site data and events data
 */
router.get('/', (req, res) => {
    // Query site name and description
    db.get(
        "SELECT site_name, site_description FROM SiteSettings WHERE site_setting_ID = 1",
        (err, siteRow) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error retrieving site settings.");
            }

            // Query all published events ordered by event_date
            db.all(
                "SELECT event_ID, event_title, event_datetime, event_description, image_filename FROM Event WHERE event_status = 'published' ORDER BY event_datetime ASC",
                (err, events) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error retrieving events.");
                    }

                    // Render the EJS template and pass data
                    res.render('attendee-home', {
                        site: siteRow,
                        events: events
                    });
                }
            );
        }
    );
});

// GET method to get /attendee/event/:id attendee event page
router.get('/event/:id', (req, res) => {
    res.render('attendee-event'); //attendee-event.ejs
});

module.exports = router;
