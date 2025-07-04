
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

-- Stores the organiser details who owns the site
CREATE TABLE Organiser (
    organiser_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    organiser_name TEXT NOT NULL,
    organiser_email TEXT NOT NULL UNIQUE,
    organiser_password TEXT NOT NULL
);

-- Stores the site title and description displayed across pages
CREATE TABLE SiteSettings ( 
    site_setting_ID INTEGER PRIMARY KEY,
    organiser_ID INTEGER NOT NULL,
    site_name VARCHAR(255) NOT NULL,
    site_description TEXT NOT NULL,
    FOREIGN KEY (organiser_ID) REFERENCES Organiser(organiser_ID) ON DELETE CASCADE
);

-- Stores events (both drafts and published)
CREATE TABLE Event (
    event_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    organiser_ID INTEGER NOT NULL,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT NOT NULL,
    event_datetime DATETIME NOT NULL,
    event_status VARCHAR(20) NOT NULL CHECK (event_status IN ('draft','published')),
    created_at DATETIME NOT NULL,
    modified_at DATETIME,
    published_at DATETIME,
    image_filename TEXT,
    FOREIGN KEY (organiser_ID) REFERENCES Organiser(organiser_ID) ON DELETE CASCADE
);

-- Stores ticket types (full or concession) for each event
CREATE TABLE TicketType ( 
    ticket_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    event_ID INTEGER NOT NULL,
    ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN('full','concession')),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
    FOREIGN KEY (event_ID) REFERENCES EVENT(event_ID) ON DELETE CASCADE
); 

-- Stores header record of booking transaction
CREATE TABLE Booking (
    booking_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    event_ID INTEGER NOT NULL,
    attendee_name VARCHAR(255) NOT NULL,
    booked_date DATETIME NOT NULL,
    FOREIGN KEY (event_ID) REFERENCES Event(event_ID) ON DELETE CASCADE
);

-- Stores what tickets and quantites were purchased in the booking
CREATE TABLE BookedTicket (
    booked_ticket_ID INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ID INTEGER NOT NULL,
    ticket_ID INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (booking_ID) REFERENCES Booking(booking_ID) ON DELETE CASCADE,
    FOREIGN KEY (ticket_ID) REFERENCES TicketType(ticket_ID) ON DELETE CASCADE
);



-- Insert default data (if necessary here)
--Insert default organiser
INSERT INTO Organiser (organiser_name, organiser_email, organiser_password)
VALUES ('Default Organiser', 'organiser@example.com', 'passwordhash');


-- Insert default Site Settings
INSERT INTO SiteSettings (organiser_ID, site_name, site_description)
VALUES (
    1,
    'The Mat Collective',
    'Not your ordinary mats. A place to be calm, curious and creative - one event at a time'
);

-- Insert Events
INSERT INTO Event ( organiser_ID,
    event_title, event_description, event_datetime,
    event_status, created_at, published_at, image_filename
) VALUES
(    1,
    'Evening Relaxation Yoga',
    'Wind down with gentle stretches and guided meditation.',
    '2025-08-10 19:00:00',
    'draft',
    '2025-07-02 14:00:00',
    NULL,
    'event-lily.png'
),
(   1,
    'Weekend Power Yoga',
    'An energizing session to start your weekend strong.',
    '2025-08-12 08:00:00',
    'published',
    '2025-07-03 09:30:00',
    '2025-07-15 11:00:00',
    'event-pilates.png'
),
(   1,
    'Mindful Movement Workshop',
    'Explore movement practices to cultivate awareness.',
    '2025-08-15 17:30:00',
    'published',
    '2025-07-05 10:00:00',
    '2025-07-16 13:00:00',
    'event-pose.png'
),
(   1,
    'Sunrise Flow Yoga',
    'Start your day with an invigorating vinyasa flow session.',
    '2025-08-20 06:30:00',
    'published',
    '2025-07-04 08:00:00',
    '2025-07-17 09:00:00',
    'event-mat.png'
),
(   1,
    'Lunchtime Stretch Session',
    'A quick midday session to release tension and improve focus.',
    '2025-08-22 12:00:00',
    'published',
    '2025-07-06 12:00:00',
    '2025-07-18 13:00:00',
    'event-ball.png'
);

-- Insert Ticket Types
-- IMPORTANT: must insert Events first, then use the correct event_IDs.
-- Since IDs auto-increment starting from 1, they will be:
-- 1: Evening Relaxation Yoga
-- 2: Weekend Power Yoga
-- 3: Mindful Movement Workshop
-- 4: Sunrise Flow Yoga
-- 5: Lunchtime Stretch Session

INSERT INTO TicketType (
    event_ID, ticket_type, price, quantity_available
) VALUES
-- Tickets for Event 1
(1, 'full', 22.00, 12),
(1, 'concession', 17.00, 6),

-- Tickets for Event 2
(2, 'full', 28.00, 10),
(2, 'concession', 20.00, 5),

-- Tickets for Event 3
(3, 'full', 30.00, 15),
(3, 'concession', 22.00, 7),

--Tickets for Event 4
(4, 'full', 25.00, 20),
(4, 'concession', 18.00, 10),

-- Tickets for Event 5
(5, 'full', 20.00, 25),
(5, 'concession', 15.00, 12);


-- Insert Bookings
INSERT INTO Booking (
    event_ID, attendee_name, booked_date
) VALUES
(2, 'John Doe', '2025-07-20 09:00:00'),
(2, 'Mary Johnson', '2025-07-21 14:00:00'),
(3, 'Chris Evans', '2025-07-22 15:30:00'),
(4, 'Alice Smith', '2025-07-23 08:30:00'),
(5, 'David Lee', '2025-07-24 11:30:00');


-- Insert Booking Items
-- IMPORTANT: The booking_IDs will be:
-- 1: John Doe
-- 2: Mary Johnson
-- 3: Chris Evans
-- 4: Alice Smith
-- 5: David Lee

-- The ticket_IDs auto-increment starting from 1 in order of insertion above:
-- 1,2: Event 1 tickets
-- 3,4: Event 2 tickets
-- 5,6: Event 3 tickets
-- 7,8: Event 4 tickets
-- 9,10: Event 5 tickets
INSERT INTO BookedTicket (
    booking_ID, ticket_ID, quantity
) VALUES
(1, 3, 1),
(2, 4, 2),
(3, 5, 1),
(4, 7, 1),
(5, 9, 1);

COMMIT;

