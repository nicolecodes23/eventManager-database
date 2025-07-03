const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db', (err) => {
    if (err) console.error(err);
    else db.run('PRAGMA foreign_keys = ON');
});

/**
 * GET /attendee
 * Purpose: Render the Attendee Home Page showing site info and published events.
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

//=====================================================================
// GET method to get /attendee/event/:id attendee event page
// Purpose: Show the event page for a specific event
router.get('/event/:id', (req, res) => {
    const eventId = req.params.id;

    // 1. Query Event by ID, must be published 
    db.get(
        `SELECT event_ID, event_title, event_description, event_datetime, image_filename
        FROM Event
        WHERE event_ID = ? AND event_status = 'published'`,
        [eventId],
        (err, eventRow) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error fetching event.");
            }

            if (!eventRow) {
                return res.status(404).send("Event not found or not published.");
            }

            // 2. Query Ticket Types for this event
            db.all(
                `SELECT ticket_type, price, quantity_available FROM TicketType WHERE event_ID = ?`,
                [eventId],
                (err, ticketRows) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error fetching tickets.");
                    }

                    // Prepare ticket price and availability for templatating
                    const ticketPrices = {};
                    const ticketAvailability = {};

                    ticketRows.forEach(ticket => {
                        if (ticket.ticket_type === 'full') {
                            ticketPrices.full = ticket.price;
                            ticketAvailability.full = ticket.quantity_available;
                        }
                        if (ticket.ticket_type === 'concession') {
                            ticketPrices.concession = ticket.price;
                            ticketAvailability.concession = ticket.quantity_available;
                        }
                    });

                    // 3. Render EJS with all data
                    res.render('attendee-event', {
                        event: eventRow,
                        ticketPrices,
                        ticketAvailability
                    });
                }
            );
        }
    );
});

// POST /attendee/events/:id/book
// Purpose: Handle booking submission
// Inputs: Event ID, attendee name, quantities
// Outputs: Create booking, update quantities, redirect
router.post('/event/:id/book', (req, res) => {
    const eventId = req.params.id;
    const { attendee_name, full_quantity, concession_quantity } = req.body;

    // Convert quantities to integers
    const fullQty = parseInt(full_quantity) || 0;
    const concessionQty = parseInt(concession_quantity) || 0;

    // Validate name
    if (!attendee_name || attendee_name.trim() === "") {
        return res.status(400).send("Name is required.");
    }

    // Validate at least one ticket was selected 
    if (fullQty === 0 && concessionQty === 0) {
        return res.status(400).send("Please select at least one ticket.");
    }

    // 1. Check available tickets quantites 
    db.all(
        `SELECT ticket_ID, ticket_type, quantity_available FROM TicketType WHERE event_ID = ?`,
        [eventId],
        (err, ticketRows) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error checking ticket availability.");
            }

            let availableFull = 0;
            let availableConcession = 0;
            let ticketIdFull = null;
            let ticketIdConcession = null;

            //map tickets for easier lookup
            ticketRows.forEach(ticket => {
                if (ticket.ticket_type === 'full') {
                    availableFull = ticket.quantity_available;
                    ticketIdFull = ticket.ticket_ID;
                }
                if (ticket.ticket_type === 'concession') {
                    availableConcession = ticket.quantity_available;
                    ticketIdConcession = ticket.ticket_ID;
                }
            });

            // Check if enough tickets left
            if (fullQty > availableFull || concessionQty > availableConcession) {
                return res.status(400).send("Not enough tickets available.");
            }

            // 2. Insert booking into booking table 
            db.run(
                `INSERT INTO Booking (attendee_name, event_ID, booked_date) VALUES (?, ?, datetime('now'))`,
                [attendee_name, eventId],
                function (err) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error creating booking.");
                    }

                    //retrieve booking ID of newly inserted booking
                    const bookingId = this.lastID;

                    // 3. Insert booking items for each ticket type
                    const insertBookingItem = db.prepare(
                        `INSERT INTO BookingItem (booking_ID, ticket_ID, quantity) VALUES (?, ?, ?)`
                    );

                    if (fullQty > 0) insertBookingItem.run(bookingId, ticketIdFull, fullQty);
                    if (concessionQty > 0) insertBookingItem.run(bookingId, ticketIdConcession, concessionQty);

                    insertBookingItem.finalize();

                    // 4. Update ticket quantities to subtract booked tickets
                    const updateTicket = db.prepare(
                        `UPDATE TicketType SET quantity_available = quantity_available - ? WHERE event_ID = ? AND ticket_type = ?`
                    );

                    if (fullQty > 0) updateTicket.run(fullQty, eventId, 'full');
                    if (concessionQty > 0) updateTicket.run(concessionQty, eventId, 'concession');

                    updateTicket.finalize();

                    // 5. Redirect to attendee home
                    res.redirect('/attendee');
                }
            );
        }
    );
});


module.exports = router;
