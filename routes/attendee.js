const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db', (err) => {
    if (err) console.error(err);
    else db.run('PRAGMA foreign_keys = ON');
});

/**
 * GET /attendee
 * Purpose: Render the Attendee Home Page showing the site name/description and all published events.
 * Inputs: organiser_ID from session if logged in, else defaults to 1.
 * Outputs: Renders attendee-home.ejs with site data and events data.
 */
router.get('/', (req, res) => {
    // If logged in, use their organiser_ID; else default to 1
    const organiserID = req.session.organiser_ID || 1;

    // Retrieve site settings (name and description) for the current or default organiser
    db.get(
        "SELECT site_name, site_description FROM SiteSettings WHERE organiser_ID = ?",
        [organiserID],
        (err, siteRow) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error retrieving site settings.");
            }

            // Retrieve all published events (Inputs: none; Outputs: list of events)
            db.all(
                "SELECT event_ID, event_title, event_datetime, event_description, image_filename FROM Event WHERE event_status = 'published' ORDER BY event_datetime ASC",
                [],
                (err, events) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Error retrieving events.");
                    }

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
/**
 * GET /attendee/event/:id
 * Purpose: Display the details of a specific published event and show available tickets.
 * Inputs: event ID from URL params.
 * Outputs: Renders attendee-event.ejs with event and ticket data.
 */
router.get('/event/:id', (req, res) => {
    const eventId = req.params.id;

    // Retrieve event details if published (Inputs: event_ID; Outputs: Event row)
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

            // Retrieve ticket types and quantities for this event (Inputs: event_ID; Outputs: list of TicketType rows)
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

                    // Render EJS with all data
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

/**
 * POST /attendee/event/:id/book
 * Purpose: Handle booking submission for an event.
 * Inputs: event ID from URL params, attendee_name, full_quantity, concession_quantity from form body.
 * Outputs: Creates Booking and BookedTicket records, updates ticket quantities, redirects to attendee home.
 */

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

    // Retrieve available ticket quantities for this event (Inputs: event_ID; Outputs: TicketType rows with availability)
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

            // Insert booking record (Inputs: attendee name, event_ID; Outputs: Booking row created)
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

                    // Insert booking items for each ticket type
                    const insertBookedTicket = db.prepare(
                        `INSERT INTO BookedTicket (booking_ID, ticket_ID, quantity) VALUES (?, ?, ?)`
                    );

                    if (fullQty > 0) insertBookedTicket.run(bookingId, ticketIdFull, fullQty);
                    if (concessionQty > 0) insertBookedTicket.run(bookingId, ticketIdConcession, concessionQty);

                    insertBookedTicket.finalize();

                    //Update ticket quantities to subtract booked tickets
                    const updateTicket = db.prepare(
                        `UPDATE TicketType SET quantity_available = quantity_available - ? WHERE event_ID = ? AND ticket_type = ?`
                    );

                    if (fullQty > 0) updateTicket.run(fullQty, eventId, 'full');
                    if (concessionQty > 0) updateTicket.run(concessionQty, eventId, 'concession');

                    updateTicket.finalize();

                    //Redirect to attendee home
                    res.redirect('/attendee');
                }
            );
        }
    );
});


module.exports = router;
