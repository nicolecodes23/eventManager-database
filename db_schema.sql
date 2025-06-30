
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)
CREATE TABLE SiteSettings ( 
    site_setting_ID INTEGER PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    site_description TEXT NOT NULL
);

CREATE TABLE Event (
    event_ID INTEGER PRIMARY KEY,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT NOT NULL,
    event_datetime DATETIME NOT NULL,
    event_status VARCHAR(20) NOT NULL CHECK (event_status IN ('draft','published')),
    created_at DATETIME NOT NULL,
    modified_at DATETIME,
    published_at DATETIME,
    image_filename TEXT
);

CREATE TABLE TicketType ( 
    ticket_ID INTEGER PRIMARY KEY,
    event_ID INTEGER NOT NULL,
    ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN('full','concession')),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
    FOREIGN KEY (event_ID) REFERENCES EVENT(event_ID) ON DELETE CASCADE
); 

CREATE TABLE Booking (
    booking_ID INTEGER PRIMARY KEY,
    event_ID INTEGER NOT NULL,
    attendee_name VARCHAR(255) NOT NULL,
    booked_date DATETIME NOT NULL,
    FOREIGN KEY (event_ID) REFERENCES Event(event_ID) ON DELETE CASCADE
);

CREATE TABLE BookingItem (
    booking_item_ID INTEGER PRIMARY KEY,
    booking_ID INTEGER NOT NULL,
    ticket_ID INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    FOREIGN KEY (booking_ID) REFERENCES Booking(booking_ID) ON DELETE CASCADE,
    FOREIGN KEY (ticket_ID) REFERENCES TicketType(ticket_ID) ON DELETE CASCADE
);


-- Insert default data (if necessary here)
-- Insert default Site Settings
INSERT INTO SiteSettings (site_setting_ID, site_name, site_description)
VALUES (1, 'The Mat Collective', 'Not your ordinary mats. A place to be calm, curious and creative - one event at a time');

-- Insert a draft event
INSERT INTO Event (
    event_ID, event_title, event_description, event_datetime,
    event_status, created_at,published_at,image_filename
) VALUES (
    1, 
    'Beginner Yoga Workshop', 
    'A relaxing yoga session for beginners.', 
    '2025-08-01 10:00:00', 
    'draft', 
    '2025-07-01 09:00:00',
    NULL,
    'event-pose.png'
);

-- Insert a published event
INSERT INTO Event (
    event_ID, event_title, event_description, event_datetime,
    event_status, created_at, published_at
) VALUES (
    2,
    'Sunrise Yoga',
    'Start your day with energy and peace.',
    '2025-08-05 06:30:00',
    'published',
    '2025-07-02 09:00:00',
    '2025-07-10 12:00:00'
);

-- Insert ticket types for draft event
INSERT INTO TicketType (ticket_ID, event_ID, ticket_type, price, quantity_available) VALUES
(1, 1, 'full', 20.00, 10),
(2, 1, 'concession', 15.00, 5);

-- Insert ticket types for published event
INSERT INTO TicketType (ticket_ID, event_ID, ticket_type, price, quantity_available) VALUES
(3, 2, 'full', 25.00, 8),
(4, 2, 'concession', 18.00, 4);

-- Optionally insert a booking
INSERT INTO Booking (booking_ID, event_ID, attendee_name, booked_date) VALUES
(1, 2, 'Alice Smith', '2025-07-15 10:00:00');

INSERT INTO BookingItem (booking_item_ID, booking_ID, ticket_ID, quantity) VALUES
(1, 1, 3, 2);

 

COMMIT;

