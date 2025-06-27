const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

// GET method gets organiser home page
router.get('/', async (req, res) => {
    try {
        const siteInfo = await new Promise((resolve, reject) => {
            db.get(
                'SELECT site_name, site_description FROM SiteSettings WHERE site_setting_ID = 1',
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });


        const totalEvents = await db.get('SELECT COUNT(*) AS count FROM Event');
        const draftEvents = await db.get("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'draft'");
        const publishedEvents = await db.get("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'published'");
        const published = await new Promise((resolve, reject) => {
            db.all(
                `
              SELECT e.event_ID, e.event_title, e.event_datetime, e.created_at, e.published_at,
                GROUP_CONCAT(tt.ticket_type || ' ($' || tt.price || ') - Qty: ' || tt.quantity_available, ', ') AS tickets
              FROM Event e
              LEFT JOIN TicketType tt ON e.event_ID = tt.event_ID
              WHERE e.event_status = 'published'
              GROUP BY e.event_ID
              ORDER BY e.event_datetime ASC
              `,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        // Draft events: fetch each ticket row separately
        const draftRows = await new Promise((resolve, reject) => {
            db.all(`
                SELECT e.event_ID, e.event_title, e.event_datetime, e.created_at, e.published_at,
                       tt.ticket_type, tt.price, tt.quantity_available
                FROM Event e
                LEFT JOIN TicketType tt ON e.event_ID = tt.event_ID
                WHERE e.event_status = 'draft'
                ORDER BY e.event_datetime ASC
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });


        // Group the rows into events with tickets[]
        const drafts = [];
        let currentEvent = null;

        for (const row of draftRows) {
            if (!currentEvent || currentEvent.event_ID !== row.event_ID) {
                if (currentEvent) drafts.push(currentEvent);
                currentEvent = {
                    event_ID: row.event_ID,
                    event_title: row.event_title,
                    event_datetime: row.event_datetime,
                    created_at: row.created_at,
                    published_at: row.published_at,
                    tickets: []
                };
            }
            if (row.ticket_type) {
                currentEvent.tickets.push({
                    type: row.ticket_type,
                    price: row.price,
                    quantity: row.quantity_available
                });
            }
        }
        if (currentEvent) drafts.push(currentEvent);

        //Produce random images everytime user creates event
        const images = ['event-pose.png', 'event-mat.png', 'eventpose2.png'];
        const draftsWithImages = drafts.map((event, index) => ({
            ...event,
            image: images[index % images.length]
        }));


        res.render('organiser-home', {
            siteInfo,
            totalEvents: totalEvents.count,
            draftCount: draftEvents.count,
            publishedCount: publishedEvents.count,
            drafts: draftsWithImages,
            published
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


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
