const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// GET method gets organiser home page
router.get('/', async (req, res) => {
    try {
        const siteInfo = await db.get(
            'SELECT site_name, site_description FROM SiteSettings WHERE site_setting_ID = 1'
        );

        const totalEvents = await db.get('SELECT COUNT(*) AS count FROM Event');
        const draftEvents = await db.get("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'draft'");
        const publishedEvents = await db.get("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'published'");

        const published = await db.all(`
            SELECT e.event_ID, e.event_title, e.event_datetime, e.created_at, e.published_at,
                GROUP_CONCAT(tt.ticket_type || ' ($' || tt.price || ') - Qty: ' || tt.quantity_available, ', ') AS tickets
            FROM Event e
            LEFT JOIN TicketType tt ON e.event_ID = tt.event_ID
            WHERE e.event_status = 'published'
            GROUP BY e.event_ID
        `);

        const drafts = await db.all(`
            SELECT e.event_ID, e.event_title, e.event_datetime, e.created_at, e.published_at,
                GROUP_CONCAT(tt.ticket_type || ' ($' || tt.price || ') - Qty: ' || tt.quantity_available, ', ') AS tickets
            FROM Event e
            LEFT JOIN TicketType tt ON e.event_ID = tt.event_ID
            WHERE e.event_status = 'draft'
            GROUP BY e.event_ID
        `);

        res.render('organiser-home', {
            siteInfo,
            totalEvents: totalEvents.count,
            draftCount: draftEvents.count,
            publishedCount: publishedEvents.count,
            drafts,
            published
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


const siteInfo = await db.get('SELECT site_name, site_description FROM SiteSettings WHERE site_setting_ID = 1');
const totalEvents = await db.get('SELECT COUNT(*) AS count FROM Event');
const draftEvents = await db.get("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'draft'");
const publishedEvents = await db.get("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'published'");

const published = await db.all(`
    SELECT e.event_ID, e.event_title, e.event_datetime, e.created_at, e.published_at,
           GROUP_CONCAT(tt.ticket_type || ' ($' || tt.price || ') - Qty: ' || tt.quantity_available, ', ') AS tickets
    FROM Event e
    LEFT JOIN TicketType tt ON e.event_ID = tt.event_ID
    WHERE e.event_status = 'published'
    GROUP BY e.event_ID
`);

const drafts = await db.all(`
    SELECT e.event_ID, e.event_title, e.event_datetime, e.created_at, e.published_at,
           GROUP_CONCAT(tt.ticket_type || ' ($' || tt.price || ') - Qty: ' || tt.quantity_available, ', ') AS tickets
    FROM Event e
    LEFT JOIN TicketType tt ON e.event_ID = tt.event_ID
    WHERE e.event_status = 'draft'
    GROUP BY e.event_ID
`);




// GET method gets site settings page through organiser home page
//Render site settings page with current name and description 
router.get('/settings', (req, res) => {
    db.get("SELECT * FROM SiteSettings LIMIT 1", [], (err, row) => {
        if (err) {
            return res.status(500).send("Database error retrieving");
        }

        if (!row) {
            // Handle missing row (e.g., insert a default setting if empty)
            return res.status(404).send("Site settings not found in database.");
        }

        res.render('site-settings', { site: row });
    });
});

// Route: POST /organiser/settings
// Purpose: Update site name and description, then redirect to organiser home
router.post('/settings', (req, res) => {
    const { site_name, site_description } = req.body;

    if (!site_name || !site_description) {
        return res.status(400).send("All fields are required.");
    }

    const sql = `UPDATE SiteSettings SET site_name = ?, site_description = ? WHERE site_setting_ID = 1`;
    db.run(sql, [site_name, site_description], function (err) {
        if (err) {
            return res.status(500).send("Failed to update site settings.");
        }
        res.redirect('/organiser');
    });
});


// GET method gets organiser edit page 
router.get('/events/edit/:id', (req, res) => {
    res.render('organiser-edit'); //organiser-edit.ejs
});

module.exports = router;
