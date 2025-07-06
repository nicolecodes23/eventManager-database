# Event Management Web Application

This project implements a **multi-tenant event management platform** with secure organiser authentication, event publishing workflows, ticket booking, and an attendee-facing public interface.

---

## Installation Requirements

- **Node.js**  
  Download and install from [https://nodejs.org/en/](https://nodejs.org/en/).  
  *(Latest LTS version recommended.)*

- **SQLite3**  
  Install from [https://www.tutorialspoint.com/sqlite/sqlite_installation.htm](https://www.tutorialspoint.com/sqlite/sqlite_installation.htm).  
  *(Most MacOS and Linux systems already have SQLite pre-installed.)*

---

## Setup Instructions

1. Install dependencies:
    npm install


2. Build the database:

- **Mac / Linux:**
  ```
  npm run build-db
  ```
- **Windows:**
  ```
  npm run build-db-win
  ```

3. Start the server:
    npm run start 

4. Visit in your browser:
http://localhost:3000 

---

## Test Routes

Use the following URLs to verify core functionality:

### Main Entry Point

- **Main Home Page**
http://localhost:3000 

### Organiser Area *(requires login)*

- **Register**
http://localhost:3000/organiser/register

- **Login**
http://localhost:3000/organiser/login

- **Organiser Home**
http://localhost:3000/organiser

- **Site Settings**
http://localhost:3000/organiser/settings

- **Create Event**
*Submit POST to* `/organiser/create` *(via the organiser home page button)*

- **Edit Event**
http://localhost:3000/organiser/events/edit/1

- **Publish Event**
*Submit POST to* `/organiser/publish/{eventID}`

- **Delete Event**
*Submit POST to* `/organiser/delete/{eventID}`

- **Logout**
http://localhost:3000/organiser/logout

### Attendee Area *(public)*

- **Attendee Home Page**
http://localhost:3000/attendee

- **Event Detail & Booking**
http://localhost:3000/attendee/event/2

---

## Additional Libraries Used

The following Node.js packages are used:

- `express`
- `ejs`
- `sqlite3`
- `bcrypt`
- `express-session`

These dependencies are declared in `package.json`.

---

## Special Notes

- **Database Creation**
All tables are defined in `db_schema.sql`.  
You must use `npm run build-db` to create the database.
- **Sessions**
Organiser authentication uses `express-session` for login persistence.
- **Password Hashing**
Organiser passwords are securely hashed with `bcrypt`.
- **Multi-tenancy**
Each organiser can manage their own events and site settings privately.






