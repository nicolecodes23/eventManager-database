const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db', (err) => {
    if (err) console.error(err);
    else db.run('PRAGMA foreign_keys = ON');
});
const { requireOrganiserAuth } = require('../middleware/auth');

// GET login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// POST login form
router.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const storedEmail = process.env.ORGANISER_EMAIL;
    const storedHash = process.env.ORGANISER_PASSWORD;

    if (email !== storedEmail) {
        return res.render('login', { error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, storedHash);
    if (match) {
        req.session.isOrganiser = true;
        res.redirect('/organiser/');
    } else {
        res.render('login', { error: 'Invalid email or password.' });
    }
});



// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/organiser/login');
    });
});

//========================================================================================
// GET method gets organiser home page after login
//Loads organiser home page with all published and draft events with counts
router.get('/', requireOrganiserAuth, async (req, res) => {
    try {
        // Get site name and description from SiteSettings table
        const siteInfo = await new Promise((resolve, reject) => {
            db.get(
                'SELECT site_name, site_description FROM SiteSettings WHERE site_setting_ID = 1',
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        // Helper function to get single values for counts 
        function dbGet(sql, params = []) {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
        }

        // Count all events, drafts, and published events
        const totalEvents = await dbGet('SELECT COUNT(*) AS count FROM Event');
        const draftEvents = await dbGet("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'draft'");
        const publishedEvents = await dbGet("SELECT COUNT(*) AS count FROM Event WHERE event_status = 'published'");

        // Fetch all published events and group their tickets
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
                        e.image_filename,
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
                    image: row.image_filename,
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

        //render organiser home page and pass all data 
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

// =================================================================================================
// GET method gets site settings page through organiser home page
//Render site settings page with current name and description 
router.get('/settings', requireOrganiserAuth, (req, res) => {
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
router.post('/settings', requireOrganiserAuth, (req, res) => {
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

// =================================================================================================
// GET method gets organiser edit page 
//Load edit form for a specific event based on its id 
router.get('/events/edit/:id', requireOrganiserAuth, async (req, res) => {
    const eventID = req.params.id;

    try {
        //get event details 
        const event = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM Event WHERE event_ID = ?`,
                [eventID],
                (err, row) => {
                    if (err) reject(err);
                    else if (!row) reject(new Error("Event not found"));
                    else resolve(row);
                }
            );
        });

        //get all tickets for event
        const tickets = await new Promise((resolve, reject) => {
            db.all(
                `SELECT * FROM TicketType WHERE event_ID = ?`,
                [eventID],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        //find full and concession tickets
        const fullTicket = tickets.find(t => t.ticket_type === 'full') || {
            quantity_available: 0,
            price: 0
        };

        const concessionTicket = tickets.find(t => t.ticket_type === 'concession') || {
            quantity_available: 0,
            price: 0
        };

        //render edit page with event and ticket data
        res.render('organiser-edit', {
            event,
            fullTicket,
            concessionTicket
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading event data.");
    }
});

// =================================================================================================
//POST route for edit form
// Update an event and its tickets in the database
router.post('/events/edit/:id', requireOrganiserAuth, (req, res) => {
    const eventID = req.params.id;

    const {
        event_title,
        event_description,
        event_date,
        event_time,
        full_quantity,
        full_price,
        concession_quantity,
        concession_price
    } = req.body;

    // Basic validation
    if (
        !event_title ||
        !event_description ||
        !event_date ||
        !event_time ||
        full_quantity === undefined ||
        full_price === undefined ||
        concession_quantity === undefined ||
        concession_price === undefined
    ) {
        return res.status(400).send("All fields are required.");
    }

    // Combine date and time
    const event_datetime = `${event_date} ${event_time}`;

    // Start transaction
    db.serialize(() => {
        // Update Event
        const updateEventSql = `
            UPDATE Event
            SET event_title = ?,
                event_description = ?,
                event_datetime = ?,
                modified_at = datetime('now','localtime')
            WHERE event_ID = ?
        `;

        db.run(updateEventSql, [event_title, event_description, event_datetime, eventID], function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Failed to update event.");
            }

            // Update Full Ticket
            const updateFullTicketSql = `
                UPDATE TicketType
                SET quantity_available = ?,
                    price = ?
                WHERE event_ID = ? AND ticket_type = 'full'
            `;

            db.run(updateFullTicketSql, [full_quantity, full_price, eventID], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Failed to update full ticket.");
                }

                // Update Concession Ticket
                const updateConcessionTicketSql = `
                    UPDATE TicketType
                    SET quantity_available = ?,
                        price = ?
                    WHERE event_ID = ? AND ticket_type = 'concession'
                `;

                db.run(updateConcessionTicketSql, [concession_quantity, concession_price, eventID], function (err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Failed to update concession ticket.");
                    }

                    // All updates done
                    res.redirect('/organiser');
                });
            });
        });
    });
});

// =========================================================================
// Route: POST /organiser/create
// Purpose: Create a new draft event and redirect to edit page
router.post('/create', requireOrganiserAuth, (req, res) => {
    //predefined event images array 
    const images = [
        'event-pose.png',
        'event-mat.png',
        'event-sun.png',
        'event-pose2.png',
        'event-ball.png',
        'event-lily.png',
        'event-pilates.png'
    ];

    // Pick a random image
    const randomImage = images[Math.floor(Math.random() * images.length)];

    const sqlEvent = `
        INSERT INTO Event (event_title, event_description, event_datetime, created_at, event_status, image_filename)
        VALUES (?, ?, ?, datetime('now','localtime'), 'draft', ?)
    `;
    const defaultTitle = 'Untitled Event';
    const defaultDescription = '';
    const defaultDate = new Date().toISOString().split('T')[0];

    db.run(sqlEvent, [defaultTitle, defaultDescription, defaultDate, randomImage], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to create event.");
        }
        const eventID = this.lastID;

        // Insert default tickets (full and concession) for the new event
        const sqlTicket = `
            INSERT INTO TicketType (event_ID, ticket_type, price, quantity_available)
            VALUES (?, ?, ?, ?)
        `;

        db.run(sqlTicket, [eventID, 'full', 0, 0], function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send("Failed to create full ticket.");
            }
            db.run(sqlTicket, [eventID, 'concession', 0, 0], function (err) {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Failed to create concession ticket.");
                }

                res.redirect(`/organiser/events/edit/${eventID}`);
            });
        });
    });
});


// =======================================================================
// Route: POST /organiser/publish/:id
// Purpose: Publish an event by updating its status and publication date
router.post('/publish/:id', requireOrganiserAuth, (req, res) => {
    const { id } = req.params;

    const sql = `
        UPDATE Event
        SET event_status = 'published',
            published_at = datetime('now','localtime')
        WHERE event_ID = ?
    `;

    db.run(sql, [id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to publish event.");
        }
        res.redirect('/organiser');
    });
});

// ===============================================================================================
// Route: POST /organiser/delete/:id
// Purpose: Delete an event and associated tickets
router.post('/delete/:id', requireOrganiserAuth, (req, res) => {
    const { id } = req.params;

    const sql = `
        DELETE FROM Event
        WHERE event_ID = ?
    `;

    db.run(sql, [id], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to delete event.");
        }
        res.redirect('/organiser');
    });
});



module.exports = router;
