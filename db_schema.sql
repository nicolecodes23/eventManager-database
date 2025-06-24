
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
    event_date DATE NOT NULL,
    event_status VARCHAR(20) NOT NULL CHECK (event_status IN ('draft','published')),
    created_at DATETIME NOT NULL,
    modified_at DATETIME,
    published_at DATETIME
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

 

COMMIT;

